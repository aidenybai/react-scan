import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { getInspectState, setInspectState } from "../../../../core/native-state";
import { getRenderData } from "../../../../core/instrumentation";
import { Icon } from "../../../components/icon";
import { LOCALSTORAGE_KEY, MIN_CONTAINER_WIDTH } from "../../../constants";
import { getWidgetState, setWidgetState } from "../../../state";
import { cn, getExtendedDisplayName, saveLocalStorage } from "../../../utils/helpers";
import { getFiberPath } from "../../../utils/pin";
import { getInspectorUpdateVersion } from "../states";
import {
  type InspectableElement,
  getCompositeComponentFromElement,
  getInspectableElements,
} from "../utils";
import {
  type FlattenedNode,
  type SearchState,
  type TreeNode,
  getSearchState,
  getShouldSkipTreeUpdate,
  setSearchState,
  setShouldSkipTreeUpdate,
} from "./state";
import { createVirtualList } from "./virtual-list";

const flattenTree = (
  nodes: TreeNode[],
  depth = 0,
  parentPath: string | null = null,
): FlattenedNode[] => {
  return nodes.reduce<FlattenedNode[]>((acc, node, index) => {
    const nodePath = node.element ? getFiberPath(node.fiber) : `${parentPath}-${index}`;

    const renderData = node.fiber?.type ? getRenderData(node.fiber) : undefined;

    const flatNode: FlattenedNode = {
      ...node,
      depth,
      nodeId: nodePath,
      parentId: parentPath,
      fiber: node.fiber,
      renderData,
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
  const MIN_TOTAL_INDENT = 24;

  if (maxDepth <= 0) return MAX_INDENT;

  const availableSpace = Math.max(0, containerWidth - MIN_CONTAINER_WIDTH);

  if (availableSpace < MIN_TOTAL_INDENT) return MIN_INDENT;

  const targetTotalIndent = Math.min(availableSpace * 0.3, maxDepth * MAX_INDENT);
  const baseIndent = targetTotalIndent / maxDepth;

  return Math.max(MIN_INDENT, Math.min(MAX_INDENT, baseIndent));
};

interface TreeNodeItemProps {
  node: FlattenedNode;
  nodeIndex: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  handleTreeNodeClick: (e: Event) => void;
  handleTreeNodeToggle: (e: Event) => void;
  searchValue: SearchState;
}

const VALID_TYPES = ["memo", "forwardRef", "lazy", "suspense"];

const parseTypeSearch = (query: string) => {
  const typeMatch = query.match(/\[(.*?)\]/);
  if (!typeMatch) return null;

  const typeSearches: string[] = [];
  const parts = typeMatch[1].split(",");
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

const matchesTypeSearch = (typeSearches: string[], wrapperTypes: Array<{ type: string }>) => {
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

const createNodeHighlighting = (node: () => FlattenedNode, searchValue: () => SearchState) => {
  return createMemo(() => {
    const currentNode = node();
    const { query, matches } = searchValue();
    const isMatch = matches.some((match) => match.nodeId === currentNode.nodeId);
    const typeSearches = parseTypeSearch(query) || [];
    const searchQuery = query ? query.replace(/\[.*?\]/, "").trim() : "";

    if (!query || !isMatch) {
      return {
        highlightedText: <span class="truncate">{currentNode.label}</span>,
        typeHighlight: false,
      };
    }

    let matchesType = true;
    if (typeSearches.length > 0) {
      if (!currentNode.fiber) {
        matchesType = false;
      } else {
        const { wrapperTypes } = getExtendedDisplayName(currentNode.fiber);
        matchesType = matchesTypeSearch(typeSearches, wrapperTypes);
      }
    }

    let textContent = <span class="truncate">{currentNode.label}</span>;
    if (searchQuery) {
      try {
        if (searchQuery.startsWith("/") && searchQuery.endsWith("/")) {
          const pattern = searchQuery.slice(1, -1);
          const regex = new RegExp(`(${pattern})`, "i");
          const parts = currentNode.label.split(regex);

          textContent = (
            <span class="tree-node-search-highlight">
              <For each={parts}>
                {(part, index) =>
                  regex.test(part) ? (
                    <span
                      class={cn("regex", {
                        start: regex.test(part) && index() === 0,
                        middle: regex.test(part) && index() % 2 === 1,
                        end: regex.test(part) && index() === parts.length - 1,
                        "!ml-0": index() === 1,
                      })}
                    >
                      {part}
                    </span>
                  ) : (
                    part
                  )
                }
              </For>
            </span>
          );
        } else {
          const lowerLabel = currentNode.label.toLowerCase();
          const lowerQuery = searchQuery.toLowerCase();
          const index = lowerLabel.indexOf(lowerQuery);

          if (index >= 0) {
            textContent = (
              <span class="tree-node-search-highlight">
                {currentNode.label.slice(0, index)}
                <span class="single">
                  {currentNode.label.slice(index, index + searchQuery.length)}
                </span>
                {currentNode.label.slice(index + searchQuery.length)}
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
  });
};

const formatTime = (time: number) => {
  if (time > 0) {
    if (time < 0.1 - Number.EPSILON) {
      return "< 0.1";
    }
    if (time < 1000) {
      return Number(time.toFixed(1)).toString();
    }
    return `${(time / 1000).toFixed(1)}k`;
  }
  return "0";
};

const TreeNodeItem = (props: TreeNodeItemProps) => {
  let renderCountElement: HTMLSpanElement | undefined;
  let previousRenderCount = props.node.renderData?.renderCount ?? 0;

  const nodeHighlighting = createNodeHighlighting(
    () => props.node,
    () => props.searchValue,
  );

  createEffect(() => {
    const currentRenderCount = props.node.renderData?.renderCount;
    const element = renderCountElement;
    if (
      !element ||
      !previousRenderCount ||
      !currentRenderCount ||
      previousRenderCount === currentRenderCount
    ) {
      return;
    }

    element.classList.remove("count-flash");
    void element.offsetWidth;
    element.classList.add("count-flash");

    previousRenderCount = currentRenderCount;
  });

  const renderTimeInfo = createMemo(() => {
    if (!props.node.renderData) return null;
    const { selfTime, totalTime, renderCount } = props.node.renderData;

    if (!renderCount) {
      return null;
    }

    return (
      <span class={cn("flex items-center gap-x-0.5 ml-1.5", "text-[10px] text-neutral-400")}>
        <span
          ref={renderCountElement}
          title={`Self time: ${formatTime(selfTime)}ms\nTotal time: ${formatTime(totalTime)}ms`}
          class="count-badge"
        >
          ×{renderCount}
        </span>
      </span>
    );
  });

  const componentTypes = createMemo(() => {
    if (!props.node.fiber) return null;
    const { wrapperTypes } = getExtendedDisplayName(props.node.fiber);
    const firstWrapperType = wrapperTypes[0];

    return (
      <span
        class={cn(
          "flex items-center gap-x-1",
          "text-[10px] text-neutral-400 tracking-wide",
          "overflow-hidden",
        )}
      >
        <Show when={firstWrapperType}>
          {(wrapperType) => (
            <>
              <span
                title={wrapperType().title}
                class={cn(
                  "rounded py-[1px] px-1",
                  "bg-neutral-700 text-neutral-300",
                  "truncate",
                  wrapperType().type === "memo" && "bg-[#8e61e3] text-white",
                  nodeHighlighting().typeHighlight && "bg-yellow-300 text-black",
                )}
              >
                {wrapperType().type}
              </span>
              <Show when={wrapperType().compiler}>
                <span class="text-yellow-300 ml-1">✨</span>
              </Show>
            </>
          )}
        </Show>
        <Show when={wrapperTypes.length > 1}>×{wrapperTypes.length}</Show>
        {renderTimeInfo()}
      </span>
    );
  });

  return (
    <div
      role="button"
      tabIndex={0}
      title={props.node.title}
      data-index={props.nodeIndex}
      class={cn(
        "flex items-center gap-x-1",
        "pl-1 pr-2",
        "w-full h-7",
        "text-left",
        "rounded",
        "cursor-pointer select-none",
      )}
      onClick={props.handleTreeNodeClick}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        props.handleTreeNodeClick(event);
      }}
    >
      <button
        type="button"
        data-index={props.nodeIndex}
        onClick={props.handleTreeNodeToggle}
        class={cn("w-6 h-6 flex items-center justify-center", "text-left")}
      >
        <Show when={props.hasChildren}>
          <Icon
            name="icon-chevron-right"
            size={12}
            class={cn("transition-transform", !props.isCollapsed && "rotate-90")}
          />
        </Show>
      </button>
      {nodeHighlighting().highlightedText}
      {componentTypes()}
    </div>
  );
};

export const ComponentsTree = () => {
  let containerElement: HTMLDivElement | undefined;
  let mainContainerElement: HTMLDivElement | undefined;
  let searchInputContainerElement: HTMLDivElement | undefined;
  let searchInputElement: HTMLInputElement | undefined;
  let selectedElement: HTMLElement | null = null;
  let maxTreeDepth = 0;
  let isHovering = false;
  let isResizing = false;
  let resizeHandleElement: HTMLDivElement | undefined;

  const [flattenedNodes, setFlattenedNodes] = createSignal<FlattenedNode[]>([]);
  const [collapsedNodes, setCollapsedNodes] = createSignal<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = createSignal<number | undefined>(undefined);

  const visibleNodes = createMemo(() => {
    const visible: FlattenedNode[] = [];
    const nodes = flattenedNodes();
    const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));

    for (const node of nodes) {
      let isVisible = true;

      let currentNode = node;
      while (currentNode.parentId) {
        const parent = nodeMap.get(currentNode.parentId);
        if (!parent) break;

        if (collapsedNodes().has(parent.nodeId)) {
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
  });

  const ITEM_HEIGHT = 28;

  const { virtualItems, totalSize } = createVirtualList({
    count: () => visibleNodes().length,
    getScrollElement: () => containerElement,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const handleElementClick = (element: HTMLElement) => {
    isHovering = true;
    searchInputElement?.blur();
    setShouldSkipTreeUpdate(true);

    const { parentCompositeFiber } = getCompositeComponentFromElement(element);
    if (!parentCompositeFiber) return;

    setInspectState({
      kind: "focused",
      focusedDomElement: element,
      fiber: parentCompositeFiber,
    });

    const nodeIndex = visibleNodes().findIndex((node) => node.element === element);
    if (nodeIndex !== -1) {
      setSelectedIndex(nodeIndex);
      const itemTop = nodeIndex * ITEM_HEIGHT;
      const container = containerElement;
      if (container) {
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;

        if (itemTop < scrollTop || itemTop + ITEM_HEIGHT > scrollTop + containerHeight) {
          container.scrollTo({
            top: Math.max(0, itemTop - containerHeight / 2),
            behavior: "instant",
          });
        }
      }
    }
  };

  const handleTreeNodeClick = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    const element = visibleNodes()[index].element;
    if (!element) return;
    handleElementClick(element);
  };

  const handleToggle = (nodeId: string) => {
    setCollapsedNodes((previousNodes) => {
      const nextNodes = new Set(previousNodes);
      if (nextNodes.has(nodeId)) {
        nextNodes.delete(nodeId);
      } else {
        nextNodes.add(nodeId);
      }
      return nextNodes;
    });
  };

  const handleTreeNodeToggle = (event: Event) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    const nodeId = visibleNodes()[index].nodeId;
    handleToggle(nodeId);
  };

  const handleOnChangeSearch = (query: string) => {
    searchInputContainerElement?.classList.remove("!border-red-500");
    const matches: FlattenedNode[] = [];

    if (!query) {
      setSearchState({ query, matches, currentMatchIndex: -1 });
      return;
    }

    if (query.includes("[") && !query.includes("]")) {
      if (query.length > query.indexOf("[") + 1) {
        searchInputContainerElement?.classList.add("!border-red-500");
        return;
      }
    }

    const typeSearches = parseTypeSearch(query) || [];
    if (query.includes("[")) {
      if (!isValidTypeSearch(typeSearches)) {
        searchInputContainerElement?.classList.add("!border-red-500");
        return;
      }
    }

    const searchQuery = query.replace(/\[.*?\]/, "").trim();
    const isRegex = /^\/.*\/$/.test(searchQuery);
    let matchesLabel = (_label: string) => false;

    if (searchQuery.startsWith("/") && !isRegex) {
      if (searchQuery.length > 1) {
        searchInputContainerElement?.classList.add("!border-red-500");
        return;
      }
    }

    if (isRegex) {
      try {
        const pattern = searchQuery.slice(1, -1);
        const regex = new RegExp(pattern, "i");
        matchesLabel = (label: string) => regex.test(label);
      } catch {
        searchInputContainerElement?.classList.add("!border-red-500");
        return;
      }
    } else if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      matchesLabel = (label: string) => label.toLowerCase().includes(lowerQuery);
    }

    for (const node of flattenedNodes()) {
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

    setSearchState({
      query,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1,
    });

    if (matches.length > 0) {
      const firstMatch = matches[0];
      const nodeIndex = visibleNodes().findIndex((node) => node.nodeId === firstMatch.nodeId);
      if (nodeIndex !== -1) {
        const itemTop = nodeIndex * ITEM_HEIGHT;
        const container = containerElement;
        if (container) {
          const containerHeight = container.clientHeight;
          container.scrollTo({
            top: Math.max(0, itemTop - containerHeight / 2),
            behavior: "instant",
          });
        }
      }
    }
  };

  const handleInputChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    if (!target) return;
    handleOnChangeSearch(target.value);
  };

  const navigateSearch = (direction: "next" | "prev") => {
    const { matches, currentMatchIndex } = getSearchState();
    if (matches.length === 0) return;

    const newIndex =
      direction === "next"
        ? (currentMatchIndex + 1) % matches.length
        : (currentMatchIndex - 1 + matches.length) % matches.length;

    setSearchState({
      ...getSearchState(),
      currentMatchIndex: newIndex,
    });

    const currentMatch = matches[newIndex];
    const nodeIndex = visibleNodes().findIndex((node) => node.nodeId === currentMatch.nodeId);
    if (nodeIndex !== -1) {
      setSelectedIndex(nodeIndex);
      const itemTop = nodeIndex * ITEM_HEIGHT;
      const container = containerElement;
      if (container) {
        const containerHeight = container.clientHeight;
        container.scrollTo({
          top: Math.max(0, itemTop - containerHeight / 2),
          behavior: "instant",
        });
      }
    }
  };

  const updateContainerWidths = (width: number) => {
    if (mainContainerElement) {
      mainContainerElement.style.width = `${width}px`;
    }
    if (containerElement) {
      containerElement.style.width = `${width}px`;
      const indentSize = calculateIndentSize(width, maxTreeDepth);
      containerElement.style.setProperty("--indentation-size", `${indentSize}px`);
    }
  };

  const updateResizeDirection = (width: number) => {
    if (!resizeHandleElement) return;

    const parentWidth = getWidgetState().dimensions.width;
    const maxWidth = Math.floor(parentWidth - MIN_CONTAINER_WIDTH / 2);

    resizeHandleElement.classList.remove("cursor-ew-resize", "cursor-w-resize", "cursor-e-resize");

    if (width <= MIN_CONTAINER_WIDTH) {
      resizeHandleElement.classList.add("cursor-w-resize");
    } else if (width >= maxWidth) {
      resizeHandleElement.classList.add("cursor-e-resize");
    } else {
      resizeHandleElement.classList.add("cursor-ew-resize");
    }
  };

  let cleanupResizeListeners = () => {};
  const handleResize = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!containerElement) return;
    containerElement.style.setProperty("pointer-events", "none");

    isResizing = true;

    const startX = event.clientX;
    const startWidth = containerElement.offsetWidth;
    const parentWidth = getWidgetState().dimensions.width;
    const maxWidth = Math.floor(parentWidth - MIN_CONTAINER_WIDTH / 2);

    updateResizeDirection(startWidth);

    const handlePointerMove = (e: PointerEvent) => {
      const delta = startX - e.clientX;
      const newWidth = startWidth + delta;
      updateResizeDirection(newWidth);

      const clampedWidth = Math.min(maxWidth, Math.max(MIN_CONTAINER_WIDTH, newWidth));
      updateContainerWidths(clampedWidth);
    };

    const handlePointerUp = () => {
      if (!containerElement) return;
      containerElement.style.removeProperty("pointer-events");
      cleanupResizeListeners();

      setWidgetState((state) => ({
        ...state,
        componentsTree: {
          ...state.componentsTree,
          width: containerElement.offsetWidth,
        },
      }));

      saveLocalStorage(LOCALSTORAGE_KEY, getWidgetState());
      isResizing = false;
    };

    cleanupResizeListeners();
    cleanupResizeListeners = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };
  onCleanup(() => cleanupResizeListeners());

  createEffect(
    on(getWidgetState, () => {
      if (!containerElement) return;
      updateResizeDirection(containerElement.offsetWidth);
    }),
  );

  const onPointerLeave = () => {
    isHovering = false;
  };

  onMount(() => {
    let isInitialTreeBuild = true;
    let initialScrollTimer: ReturnType<typeof setTimeout> | undefined;
    const buildTreeFromElements = (elements: Array<InspectableElement>) => {
      const nodeMap = new Map<HTMLElement, TreeNode>();
      const rootNodes: TreeNode[] = [];

      for (const { element, name, fiber } of elements) {
        if (!element) continue;

        let title = name;
        const { name: componentName, wrappers } = getExtendedDisplayName(fiber);
        if (componentName) {
          if (wrappers.length > 0) {
            title = `${wrappers.join("(")}(${componentName})${")".repeat(wrappers.length)}`;
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
      const element = selectedElement;
      if (!element) return;

      const inspectableElements = getInspectableElements();
      const tree = buildTreeFromElements(inspectableElements);

      if (tree.length > 0) {
        const flattened = flattenTree(tree);
        const newMaxDepth = getMaxDepth(flattened);
        maxTreeDepth = newMaxDepth;

        updateContainerWidths(getWidgetState().componentsTree.width);
        setFlattenedNodes(flattened);

        if (isInitialTreeBuild) {
          isInitialTreeBuild = false;
          const focusedIndex = flattened.findIndex((node) => node.element === element);
          if (focusedIndex !== -1) {
            const itemTop = focusedIndex * ITEM_HEIGHT;
            const container = containerElement;
            if (container) {
              initialScrollTimer = setTimeout(() => {
                container.scrollTo({
                  top: itemTop,
                  behavior: "instant",
                });
              }, 96);
            }
          }
        }
      }
    };

    createEffect(
      on(
        getInspectState,
        (state) => {
          if (state.kind === "focused") {
            if (getShouldSkipTreeUpdate()) {
              return;
            }

            handleOnChangeSearch("");
            selectedElement = state.focusedDomElement as HTMLElement;
            updateTree();
          }
        },
        { defer: true },
      ),
    );

    let rafId = 0;
    createEffect(
      on(
        getInspectorUpdateVersion,
        () => {
          if (getInspectState().kind === "focused") {
            cancelAnimationFrame(rafId);
            if (isResizing) return;

            rafId = requestAnimationFrame(() => {
              setShouldSkipTreeUpdate(false);
              updateTree();
            });
          }
        },
        { defer: true },
      ),
    );

    onCleanup(() => {
      setSearchState({
        query: "",
        matches: [],
        currentMatchIndex: -1,
      });
      cancelAnimationFrame(rafId);
      clearTimeout(initialScrollTimer);
    });
  });

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isHovering) return;

      const currentSelectedIndex = selectedIndex();
      if (currentSelectedIndex === undefined) return;

      switch (event.key) {
        case "ArrowUp": {
          event.preventDefault();
          event.stopPropagation();

          if (currentSelectedIndex > 0) {
            const currentNode = visibleNodes()[currentSelectedIndex - 1];
            if (currentNode?.element) {
              handleElementClick(currentNode.element);
            }
          }
          return;
        }
        case "ArrowDown": {
          event.preventDefault();
          event.stopPropagation();

          if (currentSelectedIndex < visibleNodes().length - 1) {
            const currentNode = visibleNodes()[currentSelectedIndex + 1];
            if (currentNode?.element) {
              handleElementClick(currentNode.element);
            }
          }
          return;
        }
        case "ArrowLeft": {
          event.preventDefault();
          event.stopPropagation();

          const currentNode = visibleNodes()[currentSelectedIndex];
          if (currentNode?.nodeId) {
            handleToggle(currentNode.nodeId);
          }
          return;
        }
        case "ArrowRight": {
          event.preventDefault();
          event.stopPropagation();

          const currentNode = visibleNodes()[currentSelectedIndex];
          if (currentNode?.nodeId) {
            handleToggle(currentNode.nodeId);
          }
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  let transitionTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(
    on(getWidgetState, (state) => {
      mainContainerElement?.style.setProperty("transition", "width 0.1s");
      updateContainerWidths(state.componentsTree.width);

      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        mainContainerElement?.style.removeProperty("transition");
      }, 500);
    }),
  );
  onCleanup(() => {
    clearTimeout(transitionTimer);
  });

  return (
    <div class="react-scan-components-tree flex">
      <div ref={resizeHandleElement} onPointerDown={handleResize} class="relative resize-v-line">
        <span>
          <Icon name="icon-ellipsis" size={18} />
        </span>
      </div>
      <div ref={mainContainerElement} class="flex flex-col h-full">
        <div class="p-2 border-b border-[#1e1e1e]">
          <div
            ref={searchInputContainerElement}
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
            class={cn(
              "relative",
              "flex items-center gap-x-1 px-2",
              "rounded",
              "border border-transparent",
              "focus-within:border-[#454545]",
              "bg-[#1e1e1e] text-neutral-300",
              "transition-colors",
              "whitespace-nowrap",
              "overflow-hidden",
            )}
          >
            <Icon name="icon-search" size={12} class=" text-neutral-500" />
            <div class="relative flex-1 h-7 overflow-hidden">
              <input
                ref={searchInputElement}
                type="text"
                value={getSearchState().query}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.focus();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                  if (getSearchState().matches.length) {
                    if (e.key === "Enter" && e.shiftKey) {
                      navigateSearch("prev");
                    } else if (e.key === "Enter") {
                      if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleElementClick(
                          getSearchState().matches[getSearchState().currentMatchIndex]
                            .element as HTMLElement,
                        );

                        e.currentTarget.focus();
                      } else {
                        navigateSearch("next");
                      }
                    }
                  }
                }}
                onInput={handleInputChange}
                class="absolute inset-y-0 inset-x-1"
                placeholder="Component name, /regex/, or [type]"
              />
            </div>
            <Show
              when={getSearchState().query}
              fallback={
                <Show when={flattenedNodes().length > 0}>
                  <span class="text-xs text-neutral-500">{flattenedNodes().length}</span>
                </Show>
              }
            >
              <span class="flex items-center gap-x-0.5 text-xs text-neutral-500">
                {getSearchState().currentMatchIndex + 1}
                {"|"}
                {getSearchState().matches.length}
              </span>
              <Show when={getSearchState().matches.length > 0}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateSearch("prev");
                  }}
                  class="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
                >
                  <Icon name="icon-chevron-right" class="-rotate-90" size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateSearch("next");
                  }}
                  class="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
                >
                  <Icon name="icon-chevron-right" class="rotate-90" size={12} />
                </button>
              </Show>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOnChangeSearch("");
                }}
                class="button rounded w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-300"
              >
                <Icon name="icon-close" size={12} />
              </button>
            </Show>
          </div>
        </div>
        <div class="flex-1 overflow-hidden">
          <div
            ref={containerElement}
            onPointerLeave={onPointerLeave}
            class="tree h-full overflow-auto will-change-transform"
          >
            <div
              class="relative w-full"
              style={{
                height: `${totalSize()}px`,
              }}
            >
              <For each={virtualItems()}>
                {(virtualItem) => {
                  const node = () => visibleNodes()[virtualItem.index];

                  const isSelected = () => {
                    const inspectState = getInspectState();
                    return (
                      inspectState.kind === "focused" &&
                      node()?.element === inspectState.focusedDomElement
                    );
                  };
                  const isKeyboardSelected = () => virtualItem.index === selectedIndex();

                  return (
                    <Show when={node()}>
                      {(currentNode) => (
                        <div
                          class={cn(
                            "absolute left-0 w-full overflow-hidden",
                            "text-neutral-400 hover:text-neutral-300",
                            "bg-transparent hover:bg-[#5f3f9a]/20",
                            (isSelected() || isKeyboardSelected()) &&
                              "text-neutral-300 bg-[#5f3f9a]/40 hover:bg-[#5f3f9a]/40",
                          )}
                          style={{
                            top: `${virtualItem.start}px`,
                            height: `${ITEM_HEIGHT}px`,
                          }}
                        >
                          <div
                            class="w-full h-full"
                            style={{
                              "padding-left": `calc(${currentNode().depth} * var(--indentation-size))`,
                            }}
                          >
                            <TreeNodeItem
                              node={currentNode()}
                              nodeIndex={virtualItem.index}
                              hasChildren={Boolean(currentNode().children?.length)}
                              isCollapsed={collapsedNodes().has(currentNode().nodeId)}
                              handleTreeNodeClick={handleTreeNodeClick}
                              handleTreeNodeToggle={handleTreeNodeToggle}
                              searchValue={getSearchState()}
                            />
                          </div>
                        </div>
                      )}
                    </Show>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
