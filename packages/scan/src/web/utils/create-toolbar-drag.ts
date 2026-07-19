import { createSignal, onCleanup, type Accessor } from "solid-js";
import { TOOLBAR_DRAG_THRESHOLD_PX, TOOLBAR_SNAP_ANIMATION_DURATION_MS } from "../constants";
import type { Position, SnapEdge } from "../widget/types";
import {
  getPositionFromEdgeAndRatio,
  getRatioFromPosition,
  getSnapPosition,
} from "./toolbar-position";

interface ToolbarDragConfig {
  getContainer: () => HTMLDivElement | undefined;
  isCollapsed: Accessor<boolean>;
  onDragStart: () => void;
  onPositionUpdate: (position: Position) => void;
  onSnapEdgeChange: (edge: SnapEdge, ratio: number) => void;
  onSnapComplete: (edge: SnapEdge, ratio: number, position: Position) => void;
}

interface ToolbarDrag {
  isDragging: Accessor<boolean>;
  isSnapping: Accessor<boolean>;
  handlePointerDown: (event: PointerEvent) => void;
  createDragAwareHandler: (callback: () => void) => (event: MouseEvent) => void;
}

export const createToolbarDrag = (config: ToolbarDragConfig): ToolbarDrag => {
  const [isDragging, setIsDragging] = createSignal(false);
  const [isSnapping, setIsSnapping] = createSignal(false);
  let didMove = false;
  let shouldSuppressClick = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;
  let velocityX = 0;
  let velocityY = 0;
  let dragAbortController: AbortController | undefined;
  let snapFrameId: number | undefined;
  let snapTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const teardownDrag = () => {
    dragAbortController?.abort();
    dragAbortController = undefined;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!didMove) {
      const distance = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);
      if (distance <= TOOLBAR_DRAG_THRESHOLD_PX) return;
      didMove = true;
      config.onDragStart();
    }

    const currentTime = performance.now();
    const elapsedTime = currentTime - lastPointerTime;
    if (elapsedTime > 0) {
      velocityX = (event.clientX - lastPointerX) / elapsedTime;
      velocityY = (event.clientY - lastPointerY) / elapsedTime;
    }
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = currentTime;
    config.onPositionUpdate({
      x: event.clientX - dragOffsetX,
      y: event.clientY - dragOffsetY,
    });
  };

  const handlePointerEnd = () => {
    teardownDrag();
    setIsDragging(false);
    if (!didMove) return;

    shouldSuppressClick = true;
    const container = config.getContainer();
    const currentBounds = container?.getBoundingClientRect();
    if (!currentBounds) return;
    const snap = getSnapPosition(
      currentBounds.left,
      currentBounds.top,
      currentBounds.width,
      currentBounds.height,
      velocityX,
      velocityY,
    );
    const ratio = getRatioFromPosition(
      snap.edge,
      snap.x,
      snap.y,
      currentBounds.width,
      currentBounds.height,
    );
    config.onSnapEdgeChange(snap.edge, ratio);
    setIsSnapping(true);

    cancelAnimationFrame(snapFrameId ?? 0);
    snapFrameId = requestAnimationFrame(() => {
      const nextBounds = container?.getBoundingClientRect() ?? currentBounds;
      snapFrameId = requestAnimationFrame(() => {
        const position = getPositionFromEdgeAndRatio(
          snap.edge,
          ratio,
          nextBounds.width,
          nextBounds.height,
        );
        config.onSnapComplete(snap.edge, ratio, position);
        clearTimeout(snapTimeoutId);
        snapTimeoutId = setTimeout(() => setIsSnapping(false), TOOLBAR_SNAP_ANIMATION_DURATION_MS);
      });
    });
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || config.isCollapsed() || isSnapping()) return;
    const bounds = config.getContainer()?.getBoundingClientRect();
    if (!bounds) return;

    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPointerTime = performance.now();
    dragOffsetX = event.clientX - bounds.left;
    dragOffsetY = event.clientY - bounds.top;
    velocityX = 0;
    velocityY = 0;
    didMove = false;
    setIsDragging(true);
    teardownDrag();
    dragAbortController = new AbortController();
    const listenerOptions = { signal: dragAbortController.signal };
    window.addEventListener("pointermove", handlePointerMove, listenerOptions);
    window.addEventListener("pointerup", handlePointerEnd, listenerOptions);
    window.addEventListener("pointercancel", handlePointerEnd, listenerOptions);
  };

  const createDragAwareHandler = (callback: () => void) => (event: MouseEvent) => {
    event.stopImmediatePropagation();
    if (shouldSuppressClick) {
      shouldSuppressClick = false;
      return;
    }
    callback();
  };

  onCleanup(() => {
    teardownDrag();
    cancelAnimationFrame(snapFrameId ?? 0);
    clearTimeout(snapTimeoutId);
  });

  return {
    isDragging,
    isSnapping,
    handlePointerDown,
    createDragAwareHandler,
  };
};
