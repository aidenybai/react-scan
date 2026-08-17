import { createEffect, onCleanup } from "solid-js";
import { getInspectState } from "../../core/native-state";
import { Icon } from "../components/icon";
import { LOCALSTORAGE_KEY, MIN_CONTAINER_WIDTH, MIN_SIZE } from "../constants";
import { getWidgetRef, getWidgetState, getWidgetView, setWidgetState } from "../state";
import { cn, saveLocalStorage } from "../utils/helpers";
import {
  calculateNewSizeAndPosition,
  calculatePosition,
  getClosestCorner,
  getHandleVisibility,
  getOppositeCorner,
  getWindowDimensions,
} from "./helpers";
import type { ResizeHandleProps } from "./types";

export const ResizeHandle = (props: ResizeHandleProps) => {
  let container: HTMLDivElement | undefined;
  let resizeAbortController: AbortController | undefined;

  const updateVisibility = () => {
    if (!container) return;

    container.classList.remove("pointer-events-none");

    const widgetState = getWidgetState();
    const isFocused = getInspectState().kind === "focused";
    const shouldShow = getWidgetView().view !== "none";
    const isVisible =
      (isFocused || shouldShow) &&
      getHandleVisibility(
        props.position,
        widgetState.corner,
        widgetState.dimensions.isFullWidth,
        widgetState.dimensions.isFullHeight,
      );

    if (isVisible) {
      container.classList.remove("hidden", "pointer-events-none", "opacity-0");
    } else {
      container.classList.add("hidden", "pointer-events-none", "opacity-0");
    }
  };

  createEffect(updateVisibility);
  onCleanup(() => resizeAbortController?.abort());

  const handleResize = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const widget = getWidgetRef();
    if (!widget) return;

    const containerStyle = widget.style;
    const { dimensions } = getWidgetState();
    const initialX = event.clientX;
    const initialY = event.clientY;

    const initialWidth = dimensions.width;
    const initialHeight = dimensions.height;
    const initialPosition = dimensions.position;

    setWidgetState((state) => ({
      ...state,
      dimensions: {
        ...dimensions,
        isFullWidth: false,
        isFullHeight: false,
        width: initialWidth,
        height: initialHeight,
        position: initialPosition,
      },
    }));

    const pointerId = event.pointerId;
    let latestClientX = initialX;
    let latestClientY = initialY;
    let resizeFrameId: number | undefined;

    const applyResize = () => {
      const { newSize, newPosition } = calculateNewSizeAndPosition(
        props.position,
        { width: initialWidth, height: initialHeight },
        initialPosition,
        latestClientX - initialX,
        latestClientY - initialY,
      );

      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
      containerStyle.width = `${newSize.width}px`;
      containerStyle.height = `${newSize.height}px`;

      const maxTreeWidth = Math.floor(newSize.width - MIN_CONTAINER_WIDTH / 2);
      const currentTreeWidth = getWidgetState().componentsTree.width;
      const newTreeWidth = Math.min(maxTreeWidth, Math.max(MIN_CONTAINER_WIDTH, currentTreeWidth));

      setWidgetState((state) => ({
        ...state,
        dimensions: {
          isFullWidth: false,
          isFullHeight: false,
          width: newSize.width,
          height: newSize.height,
          position: newPosition,
        },
        componentsTree: {
          ...state.componentsTree,
          width: newTreeWidth,
        },
      }));

      resizeFrameId = undefined;
    };

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      latestClientX = pointerEvent.clientX;
      latestClientY = pointerEvent.clientY;
      containerStyle.transition = "none";
      if (resizeFrameId !== undefined) return;
      resizeFrameId = requestAnimationFrame(applyResize);
    };

    const handlePointerUp = () => {
      if (resizeFrameId !== undefined) {
        cancelAnimationFrame(resizeFrameId);
        applyResize();
      }
      resizeAbortController?.abort();
      resizeAbortController = undefined;
      if (container?.hasPointerCapture(pointerId)) {
        container.releasePointerCapture(pointerId);
      }

      const { dimensions, corner } = getWidgetState();
      const windowDims = getWindowDimensions();
      const isCurrentFullWidth = windowDims.isFullWidth(dimensions.width);
      const isCurrentFullHeight = windowDims.isFullHeight(dimensions.height);
      const isFullScreen = isCurrentFullWidth && isCurrentFullHeight;

      let newCorner = corner;
      if (isFullScreen || isCurrentFullWidth || isCurrentFullHeight) {
        newCorner = getClosestCorner(dimensions.position);
      }

      const newPosition = calculatePosition(newCorner, dimensions.width, dimensions.height);

      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;

      setWidgetState((state) => ({
        ...state,
        corner: newCorner,
        dimensions: {
          isFullWidth: isCurrentFullWidth,
          isFullHeight: isCurrentFullHeight,
          width: dimensions.width,
          height: dimensions.height,
          position: newPosition,
        },
        lastDimensions: {
          isFullWidth: isCurrentFullWidth,
          isFullHeight: isCurrentFullHeight,
          width: dimensions.width,
          height: dimensions.height,
          position: newPosition,
        },
      }));

      const widgetState = getWidgetState();
      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: newCorner,
        dimensions: widgetState.dimensions,
        lastDimensions: widgetState.lastDimensions,
        componentsTree: widgetState.componentsTree,
      });
    };

    container?.setPointerCapture(pointerId);
    resizeAbortController?.abort();
    resizeAbortController = new AbortController();
    const listenerOptions = { signal: resizeAbortController.signal };
    window.addEventListener("pointermove", handlePointerMove, listenerOptions);
    window.addEventListener("pointerup", handlePointerUp, listenerOptions);
    window.addEventListener("pointercancel", handlePointerUp, listenerOptions);
  };

  const handleDoubleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const widget = getWidgetRef();
    if (!widget) return;

    const containerStyle = widget.style;
    const { dimensions, corner } = getWidgetState();
    const windowDims = getWindowDimensions();

    const isCurrentFullWidth = windowDims.isFullWidth(dimensions.width);
    const isCurrentFullHeight = windowDims.isFullHeight(dimensions.height);
    const isFullScreen = isCurrentFullWidth && isCurrentFullHeight;
    const isPartiallyMaximized = (isCurrentFullWidth || isCurrentFullHeight) && !isFullScreen;

    let newWidth = dimensions.width;
    let newHeight = dimensions.height;
    const newCorner = getOppositeCorner(
      props.position,
      corner,
      isFullScreen,
      isCurrentFullWidth,
      isCurrentFullHeight,
    );

    if (props.position === "left" || props.position === "right") {
      newWidth = isCurrentFullWidth ? dimensions.width : windowDims.maxWidth;
      if (isPartiallyMaximized) {
        newWidth = isCurrentFullWidth ? MIN_SIZE.width : windowDims.maxWidth;
      }
    } else {
      newHeight = isCurrentFullHeight ? dimensions.height : windowDims.maxHeight;
      if (isPartiallyMaximized) {
        newHeight = isCurrentFullHeight ? MIN_SIZE.initialHeight : windowDims.maxHeight;
      }
    }

    if (isFullScreen) {
      if (props.position === "left" || props.position === "right") {
        newWidth = MIN_SIZE.width;
      } else {
        newHeight = MIN_SIZE.initialHeight;
      }
    }

    const newPosition = calculatePosition(newCorner, newWidth, newHeight);
    const newDimensions = {
      isFullWidth: windowDims.isFullWidth(newWidth),
      isFullHeight: windowDims.isFullHeight(newHeight),
      width: newWidth,
      height: newHeight,
      position: newPosition,
    };

    // Adjust components tree width when widget is resized
    const maxTreeWidth = Math.floor(newWidth - MIN_SIZE.width / 2);
    const currentTreeWidth = getWidgetState().componentsTree.width;
    const defaultWidth = Math.floor(newWidth * 0.3); // Use 30% of window width as default

    const newTreeWidth = isCurrentFullWidth
      ? MIN_CONTAINER_WIDTH
      : (props.position === "left" || props.position === "right") && !isCurrentFullWidth
        ? Math.min(maxTreeWidth, Math.max(MIN_CONTAINER_WIDTH, defaultWidth))
        : Math.min(maxTreeWidth, Math.max(MIN_CONTAINER_WIDTH, currentTreeWidth));

    requestAnimationFrame(() => {
      setWidgetState((state) => ({
        corner: newCorner,
        dimensions: newDimensions,
        lastDimensions: dimensions,
        componentsTree: {
          ...state.componentsTree,
          width: newTreeWidth,
        },
      }));

      containerStyle.transition = "all 0.25s cubic-bezier(0, 0, 0.2, 1)";
      containerStyle.width = `${newWidth}px`;
      containerStyle.height = `${newHeight}px`;
      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
    });

    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: newCorner,
      dimensions: newDimensions,
      lastDimensions: dimensions,
      componentsTree: {
        ...getWidgetState().componentsTree,
        width: newTreeWidth,
      },
    });
  };

  return (
    <div
      ref={container}
      onPointerDown={handleResize}
      onDblClick={handleDoubleClick}
      style={{ "touch-action": "none" }}
      class={cn(
        "absolute z-50",
        "flex items-center justify-center",
        "group",
        "transition-colors select-none",
        "peer",
        {
          "resize-left peer/left": props.position === "left",
          "resize-right peer/right z-10": props.position === "right",
          "resize-top peer/top": props.position === "top",
          "resize-bottom peer/bottom": props.position === "bottom",
        },
      )}
    >
      <span class="resize-line-wrapper">
        <span class="resize-line">
          <Icon
            name="icon-ellipsis"
            size={18}
            class={cn(
              "text-neutral-400",
              (props.position === "left" || props.position === "right") && "rotate-90",
            )}
          />
        </span>
      </span>
    </div>
  );
};
