import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { getInspectState } from "../../core/native-state";
import {
  TOOLBAR_DEFAULT_HEIGHT_PX,
  TOOLBAR_DEFAULT_WIDTH_PX,
  TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS,
  TOOLBAR_FADE_IN_DELAY_MS,
  LOCALSTORAGE_KEY,
  TOOLBAR_SNAP_ANIMATION_DURATION_MS,
  TOOLBAR_Z_INDEX,
} from "../constants";
import {
  getToolbarState,
  getWidgetState,
  getWidgetView,
  setWidgetRef,
  setWidgetState,
  setWidgetView,
  updateToolbarState,
} from "../state";
import { createToolbarDrag } from "../utils/create-toolbar-drag";
import { getCornerFromEdge } from "../utils/get-corner-from-edge";
import { saveLocalStorage } from "../utils/helpers";
import { getSafeArea } from "../utils/safe-area";
import {
  getCollapsedDimensions,
  getCollapsedPosition,
  getPositionFromEdgeAndRatio,
} from "../utils/toolbar-position";
import { Content } from "../views";
import { Toolbar } from "../views/toolbar";
import { ScanOverlay } from "../views/inspector/overlay";
import { calculatePosition } from "./helpers";
import { CollapsedIndicator } from "./collapsed-indicator";
import { ResizeHandle } from "./resize-handle";
import type { Position, SnapEdge } from "./types";

export const ToolbarElementContext = createContext<HTMLElement | null>(null);

export const Widget = () => {
  let toolbarContainer: HTMLDivElement | undefined;
  let panelContainer: HTMLDivElement | undefined;
  let fadeTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let resizeFrameId: number | undefined;
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isToolbarHovered, setIsToolbarHovered] = createSignal(false);
  const [expandedDimensions, setExpandedDimensions] = createSignal({
    width: TOOLBAR_DEFAULT_WIDTH_PX,
    height: TOOLBAR_DEFAULT_HEIGHT_PX,
  });
  const [toolbarPosition, setToolbarPosition] = createSignal<Position>(
    getPositionFromEdgeAndRatio(
      getToolbarState().edge,
      getToolbarState().ratio,
      TOOLBAR_DEFAULT_WIDTH_PX,
      TOOLBAR_DEFAULT_HEIGHT_PX,
    ),
  );

  const isCollapsed = () => getToolbarState().collapsed;
  const isPanelOpen = createMemo(
    () => getWidgetView().view !== "none" || getInspectState().kind === "focused",
  );
  const collapsedDimensions = () => getCollapsedDimensions(getToolbarState().edge);
  const visibleToolbarPosition = () =>
    isCollapsed()
      ? getCollapsedPosition(
          getToolbarState().edge,
          toolbarPosition(),
          expandedDimensions(),
          collapsedDimensions(),
        )
      : toolbarPosition();

  const savePanelState = () => {
    const widgetState = getWidgetState();
    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: widgetState.corner,
      dimensions: widgetState.dimensions,
      lastDimensions: widgetState.lastDimensions,
      componentsTree: widgetState.componentsTree,
    });
  };

  const updatePanelCorner = (edge: SnapEdge, ratio: number) => {
    const corner = getCornerFromEdge(edge, ratio);
    const dimensions = getWidgetState().dimensions;
    const position = calculatePosition(corner, dimensions.width, dimensions.height);
    setWidgetState((state) => ({
      ...state,
      corner,
      dimensions: {
        ...dimensions,
        position,
      },
    }));
    savePanelState();
  };

  const updateExpandedPosition = () => {
    const dimensions = expandedDimensions();
    setToolbarPosition(
      getPositionFromEdgeAndRatio(
        getToolbarState().edge,
        getToolbarState().ratio,
        dimensions.width,
        dimensions.height,
      ),
    );
  };

  const measureExpandedToolbar = () => {
    if (!toolbarContainer || isCollapsed()) return;
    const bounds = toolbarContainer.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    setExpandedDimensions({
      width: bounds.width,
      height: bounds.height,
    });
    updateExpandedPosition();
  };

  const toolbarDrag = createToolbarDrag({
    getContainer: () => toolbarContainer,
    isCollapsed,
    onDragStart: () => {
      setWidgetView({ view: "none" });
    },
    onPositionUpdate: setToolbarPosition,
    onSnapEdgeChange: (edge, ratio) => {
      updateToolbarState((state) => ({
        ...state,
        edge,
        ratio,
      }));
      updatePanelCorner(edge, ratio);
    },
    onSnapComplete: (edge, ratio, position) => {
      setToolbarPosition(position);
      updateToolbarState((state) => ({
        ...state,
        edge,
        ratio,
      }));
    },
  });

  const setCollapsed = (collapsed: boolean) => {
    updateToolbarState((state) => ({ ...state, collapsed }));
    if (collapsed) {
      setWidgetView({ view: "none" });
    }
  };

  const handleWindowResize = () => {
    cancelAnimationFrame(resizeFrameId ?? 0);
    resizeFrameId = requestAnimationFrame(() => {
      updateExpandedPosition();
      updatePanelCorner(getToolbarState().edge, getToolbarState().ratio);
    });
  };

  onMount(() => {
    if (panelContainer) {
      setWidgetRef(panelContainer);
      const safeArea = getSafeArea();
      panelContainer.style.maxWidth = `calc(100vw - ${safeArea.left + safeArea.right}px)`;
      panelContainer.style.maxHeight = `calc(100vh - ${safeArea.top + safeArea.bottom}px)`;
    }

    measureExpandedToolbar();
    updatePanelCorner(getToolbarState().edge, getToolbarState().ratio);
    fadeTimeoutId = setTimeout(() => setIsLoaded(true), TOOLBAR_FADE_IN_DELAY_MS);
    window.addEventListener("resize", handleWindowResize, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", handleWindowResize, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", handleWindowResize, {
      passive: true,
    });
  });

  createEffect(() => {
    if (isCollapsed()) return;
    requestAnimationFrame(measureExpandedToolbar);
  });

  onCleanup(() => {
    clearTimeout(fadeTimeoutId);
    cancelAnimationFrame(resizeFrameId ?? 0);
    window.removeEventListener("resize", handleWindowResize);
    window.visualViewport?.removeEventListener("resize", handleWindowResize);
    window.visualViewport?.removeEventListener("scroll", handleWindowResize);
    setWidgetRef(null);
    savePanelState();
  });

  const toolbarStyle = () => {
    const position = visibleToolbarPosition();
    const dimensions = collapsedDimensions();
    return {
      width: isCollapsed() ? `${dimensions.width}px` : "max-content",
      height: isCollapsed() ? `${dimensions.height}px` : "max-content",
      opacity: isLoaded() ? 1 : 0,
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      transition:
        toolbarDrag.isDragging() && !toolbarDrag.isSnapping()
          ? "none"
          : `transform ${TOOLBAR_SNAP_ANIMATION_DURATION_MS}ms var(--rs-ease-drawer), width ${TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS}ms var(--rs-ease-drawer), height ${TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS}ms var(--rs-ease-drawer), opacity ${TOOLBAR_COLLAPSE_ANIMATION_DURATION_MS}ms ease-out`,
      "z-index": TOOLBAR_Z_INDEX,
    };
  };

  const panelStyle = () => {
    const dimensions = getWidgetState().dimensions;
    return {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      transform: `translate3d(${dimensions.position.x}px, ${dimensions.position.y}px, 0)`,
      "z-index": TOOLBAR_Z_INDEX - 1,
    };
  };

  return (
    <>
      <ScanOverlay />
      <div
        id="react-scan-toolbar"
        dir="ltr"
        ref={toolbarContainer}
        onPointerDown={toolbarDrag.handlePointerDown}
        onMouseEnter={() => setIsToolbarHovered(true)}
        onMouseLeave={() => setIsToolbarHovered(false)}
        class="fixed left-0 top-0 select-none font-sans text-[13px] [touch-action:none] [will-change:transform]"
        classList={{
          "cursor-grabbing": toolbarDrag.isDragging(),
          "cursor-grab": !toolbarDrag.isDragging() && !isCollapsed(),
        }}
        style={toolbarStyle()}
      >
        <Show
          when={!isCollapsed()}
          fallback={
            <CollapsedIndicator
              edge={getToolbarState().edge}
              onExpand={toolbarDrag.createDragAwareHandler(() => setCollapsed(false))}
            />
          }
        >
          <Toolbar
            edge={getToolbarState().edge}
            onCollapse={toolbarDrag.createDragAwareHandler(() => setCollapsed(true))}
          />
        </Show>
      </div>

      <div
        id="react-scan-panel"
        dir="ltr"
        ref={panelContainer}
        class="fixed left-0 top-0 flex flex-col rounded-xl font-sans text-[13px] [will-change:transform]"
        classList={{
          hidden: !isPanelOpen(),
          "opacity-80": !isToolbarHovered() && toolbarDrag.isDragging(),
        }}
        style={panelStyle()}
      >
        <ToolbarElementContext.Provider value={panelContainer ?? null}>
          <ResizeHandle position="top" />
          <ResizeHandle position="bottom" />
          <ResizeHandle position="left" />
          <ResizeHandle position="right" />
          <Content />
        </ToolbarElementContext.Provider>
      </div>
    </>
  );
};
