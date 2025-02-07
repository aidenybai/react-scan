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
  LOCALSTORAGE_KEY,
  MIN_CONTAINER_WIDTH,
  MIN_SIZE,
} from '~web/constants';
import { useVirtualList } from '~web/hooks/use-virtual-list';
import { signalWidget } from '~web/state';
import {
  cn,
  getExtendedDisplayName,
  saveLocalStorage,
} from '~web/utils/helpers';
import { getFiberPath } from '~web/utils/pin';
import { inspectorUpdateSignal } from '../states';
import {
  type InspectableElement,
  getCompositeComponentFromElement,
  getInspectableElements,
} from '../utils';
import { Breadcrumb } from './breadcrumb';
import {
  type FlattenedNode,
  type TreeNode,
  searchState,
  signalSkipTreeUpdate,
} from './state';

const flattenTree = (
  nodes: TreeNode[],
  depth = 0,
  parentPath: string | null = null,
): FlattenedNode[] => {
  return nodes.reduce<FlattenedNode[]>((acc, node, index) => {
    const nodePath = node.element
      ? getFiberPath(node.fiber)
      : `${parentPath}-${index}`;

    const flatNode: FlattenedNode = {
      ...node,
      depth,
      nodeId: nodePath,
      parentId: parentPath,
      fiber: node.fiber,
    };
    acc.push(flatNode);

    if (node.children?.length) {
      acc.push(...flattenTree(node.children, depth + 1, nodePath));
    }

    return acc;
  }, []);
};

const getMaxDepth = (nodes: FlattenedNode[]): number => {
  return nodes.reduce((max, node) => Math.max(max, node.depth), 0);
};

const calculateIndentSize = (containerWidth: number, maxDepth: number) => {
  const MIN_INDENT = 0;
  const MAX_INDENT = 24;
  const MIN_TOTAL_INDENT = 24; // Minimum total indentation we want to preserve

  if (maxDepth <= 0) return MAX_INDENT;

  const availableSpace = Math.max(0, containerWidth - MIN_CONTAINER_WIDTH);

  // If we have very little space, use minimal indentation
  if (availableSpace < MIN_TOTAL_INDENT) return MIN_INDENT;

  // Otherwise, calculate based on available space
  const targetTotalIndent = Math.min(
    availableSpace * 0.3,
    maxDepth * MAX_INDENT,
  );
  const baseIndent = targetTotalIndent / maxDepth;

  return Math.max(MIN_INDENT, Math.min(MAX_INDENT, baseIndent));
};

interface TreeNodeItemProps {
  node: FlattenedNode;
  onElementClick?: (element: HTMLElement) => void;
  collapsedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  searchValue: typeof searchState.value;
}

// Available wrapper types
const VALID_TYPES = ['memo', 'forwardRef', 'lazy', 'suspense'];

const parseTypeSearch = (query: string) => {
  const typeMatch = query.match(/\[(.*?)\]/);
  if (!typeMatch) return null;

  const typeSearches: string[] = [];
  const parts = typeMatch[1].split(',');
  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    if (trimmed) typeSearches.push(trimmed);
  }

  return typeSearches;
};

const isValidTypeSearch = (typeSearches: string[]) => {
  if (typeSearches.length === 0) return false;

  for (const search of typeSearches) {
    let isValid = false;
    for (const validType of VALID_TYPES) {
      if (validType.toLowerCase().includes(search)) {
        isValid = true;
        break;
      }
    }
    if (!isValid) return false;
  }
  return true;
};

const matchesTypeSearch = (
  typeSearches: string[],
  wrapperTypes: Array<{ type: string }>,
) => {
  if (typeSearches.length === 0) return true;
  if (!wrapperTypes.length) return false;

  for (const search of typeSearches) {
    let foundMatch = false;
    for (const wrapper of wrapperTypes) {
      if (wrapper.type.toLowerCase().includes(search)) {
        foundMatch = true;
        break;
      }
    }
    if (!foundMatch) return false;
  }
  return true;
};

const useNodeHighlighting = (
  node: FlattenedNode,
  searchValue: typeof searchState.value,
) => {
  return useMemo(() => {
    const { query, matches } = searchValue;
    const isMatch = matches.some((match) => match.nodeId === node.nodeId);
    const typeSearches = parseTypeSearch(query) || [];
    const searchQuery = query ? query.replace(/\[.*?\]/, '').trim() : '';

    if (!query || !isMatch) {
      return {
        highlightedText: <span className="truncate">{node.label}</span>,
        typeHighlight: false,
      };
    }

    let matchesType = true;
    if (typeSearches.length > 0) {
      if (!node.fiber) {
        matchesType = false;
      } else {
        const { wrapperTypes } = getExtendedDisplayName(node.fiber);
        matchesType = matchesTypeSearch(typeSearches, wrapperTypes);
      }
    }

    let textContent = <span className="truncate">{node.label}</span>;
    if (searchQuery) {
      try {
        if (searchQuery.startsWith('/') && searchQuery.endsWith('/')) {
          const pattern = searchQuery.slice(1, -1);
          const regex = new RegExp(`(${pattern})`, 'i');
          const parts = node.label.split(regex);

          textContent = (
            <span className="tree-node-search-highlight">
              {parts.map((part, index) =>
                regex.test(part) ? (
                  <span
                    key={`${node.nodeId}-${part}`}
                    className={cn('regex', {
                      start: regex.test(part) && index === 0,
                      middle: regex.test(part) && index % 2 === 1,
                      end: regex.test(part) && index === parts.length - 1,
                      '!ml-0': index === 1,
                    })}
                  >
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
            </span>
          );
        } else {
          const lowerLabel = node.label.toLowerCase();
          const lowerQuery = searchQuery.toLowerCase();
          const index = lowerLabel.indexOf(lowerQuery);

          if (index >= 0) {
            textContent = (
              <span className="tree-node-search-highlight">
                {node.label.slice(0, index)}
                <span className="single">
                  {node.label.slice(index, index + searchQuery.length)}
                </span>
                {node.label.slice(index + searchQuery.length)}
              </span>
            );
          }
        }
      } catch {}
    }

    return {
      highlightedText: textContent,
      typeHighlight: matchesType && typeSearches.length > 0,
    };
  }, [node.label, node.nodeId, node.fiber, searchValue]);
};

const TreeNodeItem = ({
  node,
  onElementClick,
  collapsedNodes,
  onToggle,
  searchValue,
}: TreeNodeItemProps) => {
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = collapsedNodes.has(node.nodeId);

  const handleClick = useCallback(() => {
    if (node.element) {
      onElementClick?.(node.element);
    }
  }, [node.element, onElementClick]);

  const handleToggle = useCallback(
    (e: MouseEvent) => {
      if (hasChildren) {
        e.stopPropagation();
        onToggle(node.nodeId);
      }
    },
    [hasChildren, node.nodeId, onToggle],
  );

  const { highlightedText, typeHighlight } = useNodeHighlighting(
    node,
    searchValue,
  );

  const componentTypes = useMemo(() => {
    if (!node.fiber) return null;
    const { wrapperTypes } = getExtendedDisplayName(node.fiber);
    const firstWrapperType = wrapperTypes[0];

    return (
      <span
        className={cn(
          'flex items-center gap-x-1',
          'text-[10px] text-neutral-400 tracking-wide',
          'overflow-hidden',
        )}
      >
        {firstWrapperType && (
          <>
            <span
              key={firstWrapperType.type}
              title={firstWrapperType?.title}
              className={cn(
                'rounded py-[1px] px-1',
                'bg-neutral-700 text-neutral-300',
                'truncate',
                {
                  'bg-[#8e61e3] text-white': firstWrapperType.type === 'memo',
                  'bg-yellow-300 text-black': typeHighlight,
                },
              )}
            >
              {firstWrapperType.type}
            </span>
            {firstWrapperType.compiler && (
              <span className="text-yellow-300 ml-1">✨</span>
            )}
          </>
        )}
        {wrapperTypes.length > 1 && `×${wrapperTypes.length}`}
      </span>
    );
  }, [node.fiber, typeHighlight]);

  return (
    <button
      type="button"
      title={node.title}
      className={cn(
        'flex items-center gap-x-1',
        'pl-1 pr-2',
        'w-full h-7',
        'text-left',
        'rounded',
        'cursor-pointer select-none',
      )}
      onClick={handleClick}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn('w-6 h-6 flex items-center justify-center', 'text-left')}
      >
        {hasChildren && (
          <Icon
            name="icon-chevron-right"
            size={12}
            className={cn('transition-transform', {
              'rotate-90': !isCollapsed,
            })}
          />
        )}
      </button>
      {highlightedText}
      {componentTypes}
    </button>
  );
};

export const ComponentsTree = () => {
  const refContainer = useRef<HTMLDivElement>(null);
  const refBreadcrumbContainer = useRef<HTMLDivElement>(null);
  const refMainContainer = useRef<HTMLDivElement>(null);
  const refSearchInputContainer = useRef<HTMLDivElement>(null);
  const refSearchInput = useRef<HTMLInputElement>(null);
  const refSelectedElement = useRef<HTMLElement | null>(null);
  const refMaxTreeDepth = useRef(0);
  const refIsHovering = useRef(false);
  const refIsResizing = useRef(false);

  const [flattenedNodes, setFlattenedNodes] = useState<FlattenedNode[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [searchValue, setSearchValue] = useState(searchState.value);

  const visibleNodes = useMemo(() => {
    const visible: FlattenedNode[] = [];
    const nodes = flattenedNodes;
    const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));

    for (const node of nodes) {
      let isVisible = true;

      let currentNode = node;
      while (currentNode.parentId) {
        const parent = nodeMap.get(currentNode.parentId);
        if (!parent) break;

        if (collapsedNodes.has(parent.nodeId)) {
          isVisible = false;
          break;
        }
        currentNode = parent;
      }

      if (isVisible) {
        visible.push(node);
      }
    }

    return visible;
  }, [collapsedNodes, flattenedNodes]);

  const ITEM_HEIGHT = 28;

  const { virtualItems, totalSize } = useVirtualList({
    count: visibleNodes.length,
    getScrollElement: () => refContainer.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const handleElementClick = useCallback(
    (element: HTMLElement) => {
      refIsHovering.current = true;
      refSearchInput.current?.blur();
      signalSkipTreeUpdate.value = true;

      const { parentCompositeFiber } =
        getCompositeComponentFromElement(element);
      if (!parentCompositeFiber) return;

      Store.inspectState.value = {
        kind: 'focused',
        focusedDomElement: element,
        fiber: parentCompositeFiber,
      };

      const nodeIndex = visibleNodes.findIndex(
        (node) => node.element === element,
      );
      if (nodeIndex !== -1) {
        setSelectedIndex(nodeIndex);
        const itemTop = nodeIndex * ITEM_HEIGHT;
        const container = refContainer.current;
        if (container) {
          const containerHeight = container.clientHeight;
          const scrollTop = container.scrollTop;
          const breadcrumbHeight = 32;

          if (
            itemTop < scrollTop ||
            itemTop + ITEM_HEIGHT > scrollTop + containerHeight
          ) {
            container.scrollTo({
              top: Math.max(
                0,
                itemTop - (containerHeight - breadcrumbHeight) / 2,
              ),
              behavior: 'instant',
            });
          }
        }
      }
    },
    [visibleNodes],
  );

  const handleToggle = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleOnChangeSearch = useCallback(
    (query: string) => {
      refSearchInputContainer.current?.classList.remove('!border-red-500');
      const matches: FlattenedNode[] = [];

      if (!query) {
        searchState.value = { query, matches, currentMatchIndex: -1 };
        return;
      }

      if (query.includes('[') && !query.includes(']')) {
        if (query.length > query.indexOf('[') + 1) {
          refSearchInputContainer.current?.classList.add('!border-red-500');
          return;
        }
      }

      const typeSearches = parseTypeSearch(query) || [];
      if (query.includes('[')) {
        if (!isValidTypeSearch(typeSearches)) {
          refSearchInputContainer.current?.classList.add('!border-red-500');
          return;
        }
      }

      const searchQuery = query.replace(/\[.*?\]/, '').trim();
      const isRegex = /^\/.*\/$/.test(searchQuery);
      let matchesLabel = (_label: string) => false;

      if (searchQuery.startsWith('/') && !isRegex) {
        if (searchQuery.length > 1) {
          refSearchInputContainer.current?.classList.add('!border-red-500');
          return;
        }
      }

      if (isRegex) {
        try {
          const pattern = searchQuery.slice(1, -1);
          const regex = new RegExp(pattern, 'i');
          matchesLabel = (label: string) => regex.test(label);
        } catch {
          refSearchInputContainer.current?.classList.add('!border-red-500');
          return;
        }
      } else if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        matchesLabel = (label: string) =>
          label.toLowerCase().includes(lowerQuery);
      }

      for (const node of flattenedNodes) {
        let matchesSearch = true;

        if (searchQuery) {
          matchesSearch = matchesLabel(node.label);
        }

        if (matchesSearch && typeSearches.length > 0) {
          if (!node.fiber) {
            matchesSearch = false;
          } else {
            const { wrapperTypes } = getExtendedDisplayName(node.fiber);
            matchesSearch = matchesTypeSearch(typeSearches, wrapperTypes);
          }
        }

        if (matchesSearch) {
          matches.push(node);
        }
      }

      searchState.value = {
        query,
        matches,
        currentMatchIndex: matches.length > 0 ? 0 : -1,
      };

      if (matches.length > 0) {
        const firstMatch = matches[0];
        const nodeIndex = visibleNodes.findIndex(
          (node) => node.nodeId === firstMatch.nodeId,
        );
        if (nodeIndex !== -1) {
          const itemTop = nodeIndex * ITEM_HEIGHT;
          const container = refContainer.current;
          if (container) {
            const containerHeight = container.clientHeight;
            container.scrollTo({
              top: Math.max(0, itemTop - containerHeight / 2),
              behavior: 'instant',
            });
          }
        }
      }
    },
    [flattenedNodes, visibleNodes],
  );

  const handleInputChange = useCallback(
    (e: Event) => {
      const target = e.currentTarget as HTMLInputElement;
      if (!target) return;
      handleOnChangeSearch(target.value);
    },
    [handleOnChangeSearch],
  );

  const navigateSearch = useCallback(
    (direction: 'next' | 'prev') => {
      const { matches, currentMatchIndex } = searchState.value;
      if (matches.length === 0) return;

      const newIndex =
        direction === 'next'
          ? (currentMatchIndex + 1) % matches.length
          : (currentMatchIndex - 1 + matches.length) % matches.length;

      searchState.value = {
        ...searchState.value,
        currentMatchIndex: newIndex,
      };

      const currentMatch = matches[newIndex];
      const nodeIndex = visibleNodes.findIndex(
        (node) => node.nodeId === currentMatch.nodeId,
      );
      if (nodeIndex !== -1) {
        setSelectedIndex(nodeIndex);
        const itemTop = nodeIndex * ITEM_HEIGHT;
        const container = refContainer.current;
        if (container) {
          const containerHeight = container.clientHeight;
          container.scrollTo({
            top: Math.max(0, itemTop - containerHeight / 2),
            behavior: 'instant',
          });
        }
      }
    },
    [visibleNodes],
  );

  const updateContainerWidths = useCallback((width: number) => {
    if (refMainContainer.current) {
      refMainContainer.current.style.width = `${width}px`;
    }
    if (refContainer.current) {
      refContainer.current.style.width = `${width}px`;
      const indentSize = calculateIndentSize(width, refMaxTreeDepth.current);
      refContainer.current.style.setProperty(
        '--indentation-size',
        `${indentSize}px`,
      );
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  const handleResize = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!refContainer.current) return;
    refContainer.current.style.setProperty('pointer-events', 'none');

    refIsResizing.current = true;

    const startX = e.clientX;
    const startWidth = refContainer.current.offsetWidth;
    const parentWidth = signalWidget.value.dimensions.width;
    const maxWidth = Math.floor(parentWidth - MIN_SIZE.width / 2);

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.min(
        maxWidth,
        Math.max(MIN_CONTAINER_WIDTH, startWidth + delta),
      );
      updateContainerWidths(newWidth);
    };

    const handleMouseUp = () => {
      if (!refContainer.current) return;
      refContainer.current.style.removeProperty('pointer-events');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      signalWidget.value = {
        ...signalWidget.value,
        componentsTree: {
          ...signalWidget.value.componentsTree,
          width: refContainer.current.offsetWidth,
        },
      };

      saveLocalStorage(LOCALSTORAGE_KEY, signalWidget.value);

      refIsResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const onMouseLeave = useCallback(() => {
    refIsHovering.current = false;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    const buildTreeFromElements = (elements: Array<InspectableElement>) => {
      const nodeMap = new Map<HTMLElement, TreeNode>();
      const rootNodes: TreeNode[] = [];

      for (const { element, name, fiber } of elements) {
        if (!element) continue;

        let title = name;
        const { name: componentName, wrappers } = getExtendedDisplayName(fiber);
        if (componentName) {
          if (wrappers.length > 0) {
            title = `${wrappers.join('(')}(${componentName})${')'.repeat(wrappers.length)}`;
          } else {
            title = componentName;
          }
        }

        nodeMap.set(element, {
          label: componentName || name,
          title,
          children: [],
          element,
          fiber,
        });
      }

      for (const { element, depth } of elements) {
        if (!element) continue;
        const node = nodeMap.get(element);
        if (!node) continue;

        if (depth === 0) {
          rootNodes.push(node);
        } else {
          let parent = element.parentElement;
          while (parent) {
            const parentNode = nodeMap.get(parent);
            if (parentNode) {
              parentNode.children = parentNode.children || [];
              parentNode.children.push(node);
              break;
            }
            parent = parent.parentElement;
          }
        }
      }

      return rootNodes;
    };

    const updateTree = () => {
      const element = refSelectedElement.current;
      if (!element) return;

      const inspectableElements = getInspectableElements(element);
      const tree = buildTreeFromElements(inspectableElements);

      if (tree.length > 0) {
        const flattened = flattenTree(tree);
        const newMaxDepth = getMaxDepth(flattened);
        refMaxTreeDepth.current = newMaxDepth;

        updateContainerWidths(signalWidget.value.componentsTree.width);
        setFlattenedNodes(flattened);
      }
    };

    const unsubscribeStore = Store.inspectState.subscribe((state) => {
      if (state.kind === 'focused') {
        if (signalSkipTreeUpdate.value) {
          return;
        }

        handleOnChangeSearch('');
        setSelectedIndex(0);
        refSelectedElement.current = state.focusedDomElement as HTMLElement;
        updateTree();
      }
    });

    let rafId = 0;
    const unsubscribeUpdates = inspectorUpdateSignal.subscribe(() => {
      if (Store.inspectState.value.kind === 'focused') {
        cancelAnimationFrame(rafId);
        if (refIsResizing.current) return;

        rafId = requestAnimationFrame(() => {
          signalSkipTreeUpdate.value = false;
          updateTree();
        });
      }
    });

    return () => {
      unsubscribeStore();
      unsubscribeUpdates();

      searchState.value = {
        query: '',
        matches: [],
        currentMatchIndex: -1,
      };
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!refIsHovering.current) return;

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          e.stopPropagation();

          if (selectedIndex > 0) {
            const currentNode = visibleNodes[selectedIndex - 1];
            if (currentNode?.element) {
              handleElementClick(currentNode.element);
            }
          }
          return;
        }
        case 'ArrowDown': {
          e.preventDefault();
          e.stopPropagation();

          if (selectedIndex < visibleNodes.length - 1) {
            const currentNode = visibleNodes[selectedIndex + 1];
            if (currentNode?.element) {
              handleElementClick(currentNode.element);
            }
          }
          return;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          e.stopPropagation();

          const currentNode = visibleNodes[selectedIndex];
          if (currentNode?.nodeId) {
            handleToggle(currentNode.nodeId);
          }
          return;
        }
        case 'ArrowRight': {
          e.preventDefault();
          e.stopPropagation();

          const currentNode = visibleNodes[selectedIndex];
          if (currentNode?.nodeId) {
            handleToggle(currentNode.nodeId);
          }
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, visibleNodes, handleElementClick, handleToggle]);

  useEffect(() => {
    return searchState.subscribe(setSearchValue);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    const unsubscribe = signalWidget.subscribe((state) => {
      refMainContainer.current?.style.setProperty(
        'transition',
        'width 0.1s',
      );
      updateContainerWidths(state.componentsTree.width);

      setTimeout(() => {
        refMainContainer.current?.style.removeProperty('transition');
      }, 500);
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <div onMouseDown={handleResize} className="relative resize-v-line">
        <span>
          <Icon name="icon-ellipsis" size={18} />
        </span>
      </div>
      <div ref={refMainContainer} className="flex flex-col h-full">
        <div ref={refBreadcrumbContainer} className="overflow-hidden">
          <Breadcrumb selectedElement={refSelectedElement.current} />

          <div className="py-2 pr-2 border-b border-[#1e1e1e]">
            <div
              ref={refSearchInputContainer}
              title={`Search components by:

• Name (e.g., "Button") — Case insensitive, matches any part

• Regular Expression (e.g., "/^Button/") — Use forward slashes

• Wrapper Type (e.g., "[memo,forwardRef]"):
   - Available types: memo, forwardRef, lazy, suspense
   - Matches any part of type name (e.g., "mo" matches "memo")
   - Use commas for multiple types

• Combined Search:
   - Mix name/regex with type: "button [for]"
   - Will match components satisfying both conditions

• Navigation:
   - Enter → Next match
   - Shift + Enter → Previous match
   - Cmd/Ctrl + Enter → Select and focus match
`}
              className={cn(
                'relative',
                'flex items-center gap-x-1 px-2',
                'rounded',
                'border border-transparent',
                'focus-within:border-[#454545]',
                'bg-[#1e1e1e] text-neutral-300',
                'transition-colors',
                'whitespace-nowrap',
                'overflow-hidden',
              )}
            >
              <Icon
                name="icon-search"
                size={12}
                className=" text-neutral-500"
              />
              <div className="relative flex-1 h-7 overflow-hidden">
                <input
                  ref={refSearchInput}
                  type="text"
                  value={searchState.value.query}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.focus();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.currentTarget.blur();
                    }
                    if (searchState.value.matches.length) {
                      if (e.key === 'Enter' && e.shiftKey) {
                        navigateSearch('prev');
                      } else if (e.key === 'Enter') {
                        if (e.metaKey || e.ctrlKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleElementClick(
                            searchState.value.matches[
                              searchState.value.currentMatchIndex
                            ].element as HTMLElement,
                          );

                          e.currentTarget.focus();
                        } else {
                          navigateSearch('next');
                        }
                      }
                    }
                  }}
                  onChange={handleInputChange}
                  className="absolute inset-y-0 inset-x-1"
                  placeholder="Component name, /regex/, or [type]"
                />
              </div>
              {searchState.value.query ? (
                <>
                  <span className="flex items-center gap-x-0.5 text-xs text-neutral-500">
                    {searchState.value.currentMatchIndex + 1}
                    {'|'}
                    {searchState.value.matches.length}
                  </span>
                  {!!searchState.value.matches.length && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateSearch('prev');
                        }}
                        className="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
                      >
                        <Icon
                          name="icon-chevron-right"
                          className="-rotate-90"
                          size={12}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateSearch('next');
                        }}
                        className="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
                      >
                        <Icon
                          name="icon-chevron-right"
                          className="rotate-90"
                          size={12}
                        />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOnChangeSearch('');
                    }}
                    className="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
                  >
                    <Icon name="icon-close" size={12} />
                  </button>
                </>
              ) : (
                !!flattenedNodes.length && (
                  <span className="text-xs text-neutral-500">
                    {flattenedNodes.length}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            ref={refContainer}
            onMouseLeave={onMouseLeave}
            className="h-full overflow-auto will-change-transform"
          >
            <div
              className="relative w-full"
              style={{
                height: totalSize,
              }}
            >
              {virtualItems.map((virtualItem) => {
                const node = visibleNodes[virtualItem.index];
                if (!node) return null;

                const isSelected =
                  Store.inspectState.value.kind === 'focused' &&
                  node.element === Store.inspectState.value.focusedDomElement;
                const isKeyboardSelected = virtualItem.index === selectedIndex;

                return (
                  <div
                    key={node.nodeId}
                    className={cn(
                      'absolute left-0 w-full overflow-hidden',
                      'text-neutral-400 hover:text-neutral-300',
                      'bg-transparent hover:bg-[#5f3f9a]/20',
                      {
                        'text-neutral-300 bg-[#5f3f9a]/40 hover:bg-[#5f3f9a]/40':
                          isSelected || isKeyboardSelected,
                      },
                    )}
                    style={{
                      top: virtualItem.start,
                      height: ITEM_HEIGHT,
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        paddingLeft: `calc(${node.depth} * var(--indentation-size))`,
                      }}
                    >
                      <TreeNodeItem
                        node={node}
                        onElementClick={handleElementClick}
                        collapsedNodes={collapsedNodes}
                        onToggle={handleToggle}
                        searchValue={searchValue}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
