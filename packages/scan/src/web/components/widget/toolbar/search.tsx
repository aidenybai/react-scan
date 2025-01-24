// @TODO: @pivanov finish this
import type { Fiber } from 'bippy';
import {
  ClassComponentTag,
  ForwardRefTag,
  FunctionComponentTag,
  MemoComponentTag,
  SimpleMemoComponentTag,
} from 'bippy';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import {
  findComponentDOMNode,
  getCompositeFiberFromElement,
  getInspectableAncestors,
} from '~web/components/inspector/utils';
import { cn } from '~web/utils/helpers';

// Types
interface TreeItem {
  name: string;
  depth: number;
  element: HTMLElement;
  fiber: Fiber | null;
  childrenCount: number;
  updates: {
    count: number;
    lastUpdate: number;
    renderDuration: number;
    cascadeLevel: number; // how many levels deep in the update cascade
    hasStructuralChanges: boolean;
  };
}

// Constants
const STYLES = {
  item: {
    height: 24,
    indentWidth: 24,
    initialIndent: 16,
    paddingRight: 40,
  },
  colors: {
    background: '#0a0a0a',
    selectedBg: 'rgba(255,255,255,0.1)',
    hoveredBg: 'rgba(255,255,255,0.05)',
    line: '#333',
    text: '#888',
  },
  font: '12px monospace',
} as const;

const getDpr = () => Math.min(window.devicePixelRatio || 1, 2);

// Custom hooks
const useContainerSize = (onReady: (height: number) => void) => {
  const refContainer = useRef<HTMLDivElement>(null);

  const handleRefContainer = useCallback(
    (element: HTMLDivElement | null) => {
      refContainer.current = element;

      if (element) {
        let resizeObserver: ResizeObserver | null = null;

        const timer = setTimeout(() => {
          const height = Math.floor(element.clientHeight);
          if (height > 0) {
            onReady(height);

            resizeObserver = new ResizeObserver(() => {
              const newHeight = Math.floor(element.clientHeight);
              if (newHeight > 0 && newHeight !== height) {
                onReady(newHeight);
              }
            });
            resizeObserver.observe(element);
          }
        }, 500);

        return () => {
          clearTimeout(timer);
          resizeObserver?.disconnect();
        };
      }
    },
    [onReady],
  );

  return { refContainer, handleRefContainer };
};

const useTreeNavigation = (
  elements: TreeItem[],
  onSelect: (element: HTMLElement) => void,
  containerRef: React.RefObject<HTMLDivElement>,
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;

      const itemTop = index * STYLES.item.height;
      const itemBottom = itemTop + STYLES.item.height;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      if (itemTop < scrollTop) {
        container.scrollTo({ top: itemTop, behavior: 'smooth' });
      } else if (itemBottom > scrollTop + containerHeight) {
        container.scrollTo({
          top: itemBottom - containerHeight,
          behavior: 'smooth',
        });
      }
    },
    [containerRef],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          if (selectedIndex < elements.length - 1) {
            const newIndex = selectedIndex + 1;
            setSelectedIndex(newIndex);
            onSelect(elements[newIndex].element);
            scrollToIndex(newIndex);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1;
            setSelectedIndex(newIndex);
            onSelect(elements[newIndex].element);
            scrollToIndex(newIndex);
          }
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (elements[selectedIndex]) {
            onSelect(elements[selectedIndex].element);
          }
          break;
      }
    },
    [elements, selectedIndex, onSelect, scrollToIndex],
  );

  return {
    selectedIndex,
    setSelectedIndex,
    hoveredIndex,
    setHoveredIndex,
    handleKeyDown,
  };
};

const useCanvasDrawing = (
  elements: TreeItem[],
  selectedIndex: number,
  hoveredIndex: number,
  scrollTop: number,
  containerHeight: number,
  maxContentWidth: number,
) => {
  const drawTree = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const dpr = getDpr();
      const containerWidth = Math.floor(canvas.parentElement?.clientWidth || 0);
      canvas.width = Math.max(containerWidth, maxContentWidth) * dpr;
      canvas.height = containerHeight * dpr + 10;

      ctx.scale(dpr, dpr);
      ctx.fillStyle = STYLES.colors.background;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      ctx.font = STYLES.font;
      ctx.textBaseline = 'middle';

      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / STYLES.item.height) - 1,
      );
      const endIndex = Math.min(
        elements.length,
        Math.ceil((scrollTop + containerHeight) / STYLES.item.height) + 2,
      );

      for (let index = startIndex; index < endIndex; index++) {
        const item = elements[index];
        const y = index * STYLES.item.height - scrollTop;

        // Draw background
        if (index === selectedIndex || index === hoveredIndex) {
          ctx.fillStyle =
            index === selectedIndex
              ? STYLES.colors.selectedBg
              : STYLES.colors.hoveredBg;
          ctx.fillRect(0, y, canvas.width / dpr, STYLES.item.height);
        }

        // Draw tree lines
        if (item.depth > 0) {
          ctx.strokeStyle = STYLES.colors.line;
          ctx.beginPath();
          ctx.setLineDash([1, 2]);

          for (let d = 1; d <= item.depth; d++) {
            const lineX =
              (d - 1) * STYLES.item.indentWidth + STYLES.item.initialIndent;
            ctx.moveTo(lineX, y);
            ctx.lineTo(lineX, y + STYLES.item.height);
          }

          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw component name with update info
        ctx.fillStyle = STYLES.colors.text;
        const x =
          item.depth * STYLES.item.indentWidth + STYLES.item.initialIndent;
        let text = item.name;

        if (item.updates.count > 0) {
          text += ` (${item.updates.count}×`;
          if (item.updates.renderDuration > 0) {
            text += ` ${item.updates.renderDuration.toFixed(1)}ms`;
          }
          text += ')';
        }

        ctx.fillText(text, x, y + STYLES.item.height / 2);
      }
    },
    [
      elements,
      selectedIndex,
      hoveredIndex,
      scrollTop,
      containerHeight,
      maxContentWidth,
    ],
  );

  return { drawTree };
};

const Breadcrumb = () => {
  const [path, setPath] = useState<TreeItem[]>([]);

  useEffect(() => {
    const unsubscribe = Store.inspectState.subscribe((state) => {
      if (state.kind !== 'focused') return;
      const element = state.focusedDomElement as HTMLElement;
      const ancestors = getInspectableAncestors(element);
      const items = ancestors.map((item) => {
        const { parentCompositeFiber } = getCompositeFiberFromElement(
          item.element,
        );

        // Count children for the breadcrumb items
        const getChildrenCount = (fiber: Fiber | null | undefined): number => {
          if (!fiber) return 0;
          let count = 0;
          let child = fiber.child;
          while (child) {
            if (child.tag === FunctionComponentTag ||
              child.tag === ForwardRefTag ||
              child.tag === SimpleMemoComponentTag ||
              child.tag === MemoComponentTag ||
              child.tag === ClassComponentTag) {
              count++;
            }
            child = child.sibling;
          }
          return count;
        };

        return {
          ...item,
          fiber: parentCompositeFiber || null,
          childrenCount: getChildrenCount(parentCompositeFiber),
          updates: {
            count: 0,
            lastUpdate: 0,
            renderDuration: 0,
            cascadeLevel: 0,
            hasStructuralChanges: false,
          },
        };
      });
      setPath(items);
    });

    return () => unsubscribe();
  }, []);

  const displayItems = useMemo(() => {
    if (path.length <= 4) return path;

    // Create a fake element for ellipsis that matches TreeItem interface
    const ellipsisItem: TreeItem = {
      name: '…',
      depth: 0,
      element: undefined as unknown as HTMLElement,
      fiber: null,
      childrenCount: 0,
      updates: {
        count: 0,
        lastUpdate: 0,
        renderDuration: 0,
        cascadeLevel: 0,
        hasStructuralChanges: false,
      },
    };

    // Return first item and last 3 items
    return [path[0], ellipsisItem, ...path.slice(-3)];
  }, [path]);

  return (
    <div
      className={cn(
        'flex items-center gap-x-1',
        'py-1',
        'text-xs text-neutral-400',
        'border-b border-white/10',
      )}
    >
      {displayItems.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-center gap-x-1 overflow-hidden h-6"
        >
          {index > 0 && (
            <span className="w-2.5 h-2.5 flex items-center justify-center text-neutral-400">
              <Icon name="icon-chevron-right" size={10} />
            </span>
          )}
          {item.name === '…' ? (
            <span className="text-sm h-4">…</span>
          ) : (
            <button
              type="button"
              title={item.name}
              className={cn('rounded', 'truncate', {
                'text-white': index === displayItems.length - 1,
                'text-neutral-400': index !== displayItems.length - 1,
              })}
              onClick={() => {
                Store.inspectState.value = {
                  kind: 'focused',
                  focusedDomElement: item.element,
                };
              }}
            >
              {item.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export const Search = () => {
  const [search, setSearch] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const refInput = useRef<HTMLInputElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);

  const handleSelect = useCallback((element: HTMLElement) => {
    Store.inspectState.value = {
      kind: 'focused',
      focusedDomElement: element,
    };
  }, []);

  // Track elements state
  const [elements, setElements] = useState<TreeItem[]>([]);
  const updateRef = useRef({ timestamp: 0 });

  // Initialize and track elements
  useEffect(() => {
    const collectElements = (
      rootFiber: Fiber,
      currentElements: TreeItem[],
      focusedElement: HTMLElement,
      isUpdate = false
    ) => {
      const seenFibers = new Set<Fiber>();
      const newElements: TreeItem[] = [];
      const validFibers = new Set<Fiber>();

      const collectFiberNodes = (fiber: Fiber | null, initialDepth: number) => {
        let currentFiber = fiber;
        let depth = initialDepth;
        const stack: Array<{ fiber: Fiber; depth: number }> = [];

        while (currentFiber || stack.length > 0) {
          if (currentFiber && !seenFibers.has(currentFiber)) {
            seenFibers.add(currentFiber);

            // Check if this is a React component
            if (currentFiber.tag === FunctionComponentTag ||
              currentFiber.tag === ForwardRefTag ||
              currentFiber.tag === SimpleMemoComponentTag ||
              currentFiber.tag === MemoComponentTag ||
              currentFiber.tag === ClassComponentTag) {

              validFibers.add(currentFiber);
              const existingElement = currentElements.find(el => el.fiber === currentFiber);

              // Get the most accurate timing info by checking both current and alternate
              const getTimingInfo = (fiber: Fiber) => {
                const current = {
                  duration: fiber.actualDuration ?? 0,
                  startTime: fiber.actualStartTime ?? 0
                };
                const alternate = fiber.alternate ? {
                  duration: fiber.alternate.actualDuration ?? 0,
                  startTime: fiber.alternate.actualStartTime ?? 0
                } : null;

                // Use the most recent timing info
                if (alternate?.startTime && alternate.startTime > current.startTime) {
                  return alternate;
                }
                return current;
              };

              const timing = getTimingInfo(currentFiber);
              const hasNewUpdate = isUpdate && timing.duration !== undefined;

              const domElement = findComponentDOMNode(currentFiber);

              newElements.push({
                name: currentFiber.type?.displayName || currentFiber.type?.name || 'Anonymous',
                depth,
                element: domElement || focusedElement,
                fiber: currentFiber,
                childrenCount: 0, // We'll calculate this after collecting all elements
                updates: existingElement ? {
                  ...existingElement.updates,
                  count: existingElement.updates.count + (hasNewUpdate ? 1 : 0),
                  renderDuration: timing.duration || 0,
                  lastUpdate: hasNewUpdate ? Date.now() : existingElement.updates.lastUpdate,
                  cascadeLevel: Math.min(existingElement.updates.cascadeLevel || depth, depth),
                  hasStructuralChanges: false // We'll update this after collecting all elements
                } : {
                  count: hasNewUpdate ? 1 : 0,
                  lastUpdate: hasNewUpdate ? Date.now() : 0,
                  renderDuration: timing.duration || 0,
                  cascadeLevel: depth,
                  hasStructuralChanges: false
                }
              });
            }

            // Push sibling to stack if it exists
            if (currentFiber.sibling) {
              stack.push({ fiber: currentFiber.sibling, depth });
            }

            // Move to child if it exists
            if (currentFiber.child) {
              currentFiber = currentFiber.child;
              depth++;
              continue;
            }
          }

          // No more children to process or fiber already seen, pop from stack
          const next = stack.pop();
          if (next) {
            currentFiber = next.fiber;
            depth = next.depth;
          } else {
            currentFiber = null;
          }
        }
      };

      collectFiberNodes(rootFiber, 0);

      // Now update structural change flags by comparing with previous elements
      const updateStructuralChanges = (elements: TreeItem[]) => {
        const elementsByDepth = new Map<number, TreeItem[]>();
        for (const el of elements) {
          const depthElements = elementsByDepth.get(el.depth) || [];
          depthElements.push(el);
          elementsByDepth.set(el.depth, depthElements);
        }

        for (const el of elements) {
          const prevEl = currentElements.find(prev => prev.fiber === el.fiber);
          const prevChildren = currentElements.filter(prev =>
            prev.depth === el.depth + 1 &&
            currentElements.find(p => p.fiber === el.fiber && p.depth === el.depth)
          );
          const currentChildren = elements.filter(curr =>
            curr.depth === el.depth + 1 &&
            elements.find(p => p.fiber === el.fiber && p.depth === el.depth)
          );

          el.childrenCount = currentChildren.length;
          el.updates.hasStructuralChanges =
            prevEl?.childrenCount !== currentChildren.length ||
            JSON.stringify(prevChildren.map(c => c.name)) !== JSON.stringify(currentChildren.map(c => c.name));
        }
      };

      updateStructuralChanges(newElements);
      return newElements.filter(el => el.fiber && validFibers.has(el.fiber));
    };

    const handleStateUpdate = (state: typeof Store.inspectState.value) => {
      if (state.kind !== 'focused') return;

      const currentElement = state.focusedDomElement as HTMLElement;
      const { parentCompositeFiber } = getCompositeFiberFromElement(currentElement);

      if (parentCompositeFiber) {
        setElements(prevElements =>
          collectElements(parentCompositeFiber, prevElements, currentElement, false)
        );
      }
    };

    // Initial collection
    handleStateUpdate(Store.inspectState.value);

    // Subscribe to state changes
    const unsubscribeState = Store.inspectState.subscribe(handleStateUpdate);

    // Subscribe to updates
    const unsubscribeUpdates = Store.lastReportTime.subscribe(() => {
      const state = Store.inspectState.value;
      if (state.kind !== 'focused') return;

      setElements(prevElements => {
        const rootElement = prevElements[0];
        if (!rootElement?.fiber) return prevElements;

        // Get the most recent fiber tree
        const currentIsNewer = rootElement.fiber.alternate
          ? (rootElement.fiber.actualStartTime ?? 0) > (rootElement.fiber.alternate.actualStartTime ?? 0)
          : true;

        const currentFiber = currentIsNewer ? rootElement.fiber : rootElement.fiber.alternate;
        if (!currentFiber) return prevElements;

        // Now collect elements with the current fiber tree
        const elements = collectElements(currentFiber, prevElements, state.focusedDomElement as HTMLElement, true);
        return elements;
      });

      updateRef.current.timestamp = Date.now();
    });

    return () => {
      unsubscribeState();
      unsubscribeUpdates();
    };
  }, []);

  const filteredElements = useMemo(() => {
    if (!search) return elements;
    const searchLower = search.toLowerCase();
    return elements.filter((item) =>
      item.name.toLowerCase().includes(searchLower),
    );
  }, [elements, search]);

  const { refContainer, handleRefContainer } = useContainerSize((height) => {
    setContainerHeight(height);
    setIsReady(true);
  });

  const {
    selectedIndex,
    setSelectedIndex,
    hoveredIndex,
    setHoveredIndex,
    handleKeyDown,
  } = useTreeNavigation(filteredElements, handleSelect, refContainer);

  // Calculate max content width
  const maxContentWidth = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    ctx.font = STYLES.font;
    return (
      Math.max(
        ...filteredElements.map((item) => {
          const x =
            item.depth * STYLES.item.indentWidth + STYLES.item.initialIndent;
          return x + ctx.measureText(item.name).width;
        }),
      ) + STYLES.item.paddingRight
    );
  }, [filteredElements]);

  const { drawTree } = useCanvasDrawing(
    filteredElements,
    selectedIndex,
    hoveredIndex,
    scrollTop,
    containerHeight,
    maxContentWidth,
  );

  // Handle scroll with horizontal adjustment
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    setScrollTop(target.scrollTop);
  }, []);

  // Canvas event handlers
  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = refCanvas.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top + scrollTop;
      const index = Math.floor(y / STYLES.item.height);

      if (index >= 0 && index < filteredElements.length) {
        setHoveredIndex(index);
      }
    },
    [filteredElements.length, scrollTop, setHoveredIndex],
  );

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      const canvas = refCanvas.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top + scrollTop;
      const index = Math.floor(y / STYLES.item.height);

      if (index >= 0 && index < filteredElements.length) {
        setSelectedIndex(index);
        const element = filteredElements[index];
        if (element.element) {
          Store.inspectState.value = {
            kind: 'focused',
            focusedDomElement: element.element
          };
        }
      }
    },
    [filteredElements, scrollTop, setSelectedIndex],
  );

  // Draw effect
  useEffect(() => {
    if (isReady && containerHeight > 0 && refCanvas.current) {
      const canvas = refCanvas.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const draw = () => {
          drawTree(canvas, ctx);
          if (updateRef.current.timestamp > 0) {
            requestAnimationFrame(draw);
          }
        };
        requestAnimationFrame(draw);
      }
    }
  }, [drawTree, isReady, containerHeight]);

  // Focus effect
  useEffect(() => {
    const canvas = refCanvas.current;
    if (canvas && isReady) {
      canvas.focus();
    }
  }, [isReady]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="flex-1 min-w-[260px] max-w-[260px] flex flex-col overflow-hidden gap-y-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        refCanvas.current?.focus();
      }}
    >
      <Breadcrumb />

      <input
        ref={refInput}
        type="text"
        value={search}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.focus();
        }}
        onInput={(e: Event) => {
          const target = e.target as HTMLInputElement;
          setSearch(target.value);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') {
            e.preventDefault();
            setSearch('');
          }
        }}
        className="h-9 w-full mx-2 border-b border-white/10 bg-[#0a0a0a] px-2 py-1 text-white focus:outline-none"
        placeholder="Search components..."
      />
      <div className="flex-1 h-[calc(100%-25px-36px-16px)] overflow-hidden flex bg-[#0a0a0a]">
        <div
          ref={handleRefContainer}
          className="flex-1 overflow-auto"
          onScroll={handleScroll}
        >
          <div
            style={{
              height: filteredElements.length * STYLES.item.height,
              position: 'relative',
            }}
          >
            {isReady && containerHeight > 0 && (
              <canvas
                ref={refCanvas}
                style={{
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: containerHeight,
                }}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
