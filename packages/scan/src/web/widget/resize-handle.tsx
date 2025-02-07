import type { JSX } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import { LOCALSTORAGE_KEY, MIN_CONTAINER_WIDTH, MIN_SIZE } from '~web/constants';
import { signalRefWidget, signalSlowDowns, signalWidget, signalWidgetViews } from '~web/state';
import { cn, saveLocalStorage } from '~web/utils/helpers';
import {
  calculateNewSizeAndPosition,
  calculatePosition,
  getClosestCorner,
  getHandleVisibility,
  getOppositeCorner,
  getWindowDimensions,
} from './helpers';
import type { Corner, ResizeHandleProps } from './types';

export const ResizeHandle = ({ position }: ResizeHandleProps) => {
  const refContainer = useRef<HTMLDivElement>(null);

  const prevWidth = useRef<number | null>(null);
  const prevHeight = useRef<number | null>(null);
  const prevCorner = useRef<Corner | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    const container = refContainer.current;
    if (!container) return;

    const checkForNotificationVisibility = () => {
      container.classList.remove('pointer-events-none');
      if (
        signalWidgetViews.value.view !== 'slow-downs' &&
        (position === 'top' || position === 'bottom')
      ) {
        const slowDowns = signalSlowDowns.value;
        if (slowDowns.slowDowns > 0 && !slowDowns.hideNotification) {
          container.classList.add('pointer-events-none');
        }
      }
    };

    const updateVisibility = () => {
      const isFocused = Store.inspectState.value.kind === 'focused';
      const shouldShow = signalWidgetViews.value.view !== 'none';
      const isVisible =
        (isFocused || shouldShow) &&
        getHandleVisibility(
          position,
          signalWidget.value.corner,
          signalWidget.value.dimensions.isFullWidth,
          signalWidget.value.dimensions.isFullHeight,
        );

      if (isVisible) {
        container.classList.remove(
          'hidden',
          'pointer-events-none',
          'opacity-0',
        );
      } else {
        container.classList.add('hidden', 'pointer-events-none', 'opacity-0');
      }
    };

    const unsubscribeSignalWidget = signalWidget.subscribe((state) => {
      checkForNotificationVisibility();

      if (
        prevWidth.current !== null &&
        prevHeight.current !== null &&
        prevCorner.current !== null &&
        state.dimensions.width === prevWidth.current &&
        state.dimensions.height === prevHeight.current &&
        state.corner === prevCorner.current
      ) {
        return;
      }

      updateVisibility();

      prevWidth.current = state.dimensions.width;
      prevHeight.current = state.dimensions.height;
      prevCorner.current = state.corner;
    });

    const unsubscribeInspectState = Store.inspectState.subscribe(() => {
      checkForNotificationVisibility();
      updateVisibility();
    });

    const unsubscribeSignalSlowDowns = signalSlowDowns.subscribe(() => {
      checkForNotificationVisibility();
    });

    return () => {
      unsubscribeSignalWidget();
      unsubscribeInspectState();
      unsubscribeSignalSlowDowns();
      prevWidth.current = null;
      prevHeight.current = null;
      prevCorner.current = null;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  const handleResize = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const widget = signalRefWidget.value;
    if (!widget) return;

    const containerStyle = widget.style;
    const { dimensions } = signalWidget.value;
    const initialX = e.clientX;
    const initialY = e.clientY;

    const initialWidth = dimensions.width;
    const initialHeight = dimensions.height;
    const initialPosition = dimensions.position;

    signalWidget.value = {
      ...signalWidget.value,
      dimensions: {
        ...dimensions,
        isFullWidth: false,
        isFullHeight: false,
        width: initialWidth,
        height: initialHeight,
        position: initialPosition,
      },
    };

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      containerStyle.transition = 'none';

      rafId = requestAnimationFrame(() => {
        const { newSize, newPosition } = calculateNewSizeAndPosition(
          position,
          { width: initialWidth, height: initialHeight },
          initialPosition,
          e.clientX - initialX,
          e.clientY - initialY,
        );

        containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
        containerStyle.width = `${newSize.width}px`;
        containerStyle.height = `${newSize.height}px`;

        // Adjust components tree width when widget is resized
        const maxTreeWidth = Math.floor(newSize.width - (MIN_SIZE.width / 2));
        const currentTreeWidth = signalWidget.value.componentsTree.width;
        const newTreeWidth = Math.min(
          maxTreeWidth,
          Math.max(MIN_CONTAINER_WIDTH, currentTreeWidth)
        );

        signalWidget.value = {
          ...signalWidget.value,
          dimensions: {
            isFullWidth: false,
            isFullHeight: false,
            width: newSize.width,
            height: newSize.height,
            position: newPosition,
          },
          componentsTree: {
            ...signalWidget.value.componentsTree,
            width: newTreeWidth,
          },
        };

        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const { dimensions, corner } = signalWidget.value;
      const windowDims = getWindowDimensions();
      const isCurrentFullWidth = windowDims.isFullWidth(dimensions.width);
      const isCurrentFullHeight = windowDims.isFullHeight(dimensions.height);
      const isFullScreen = isCurrentFullWidth && isCurrentFullHeight;

      let newCorner = corner;
      if (isFullScreen || isCurrentFullWidth || isCurrentFullHeight) {
        newCorner = getClosestCorner(dimensions.position);
      }

      const newPosition = calculatePosition(
        newCorner,
        dimensions.width,
        dimensions.height,
      );

      const onTransitionEnd = () => {
        widget.removeEventListener('transitionend', onTransitionEnd);
      };

      widget.addEventListener('transitionend', onTransitionEnd);
      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;

      signalWidget.value = {
        ...signalWidget.value,
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
      };

      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: newCorner,
        dimensions: signalWidget.value.dimensions,
        lastDimensions: signalWidget.value.lastDimensions,
        componentsTree: signalWidget.value.componentsTree,
      });
    };

    document.addEventListener('mousemove', handleMouseMove, {
      passive: true,
    });
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  const handleDoubleClick = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const widget = signalRefWidget.value;
    if (!widget) return;

    const containerStyle = widget.style;
    const { dimensions, corner } = signalWidget.value;
    const windowDims = getWindowDimensions();

    const isCurrentFullWidth = windowDims.isFullWidth(dimensions.width);
    const isCurrentFullHeight = windowDims.isFullHeight(dimensions.height);
    const isFullScreen = isCurrentFullWidth && isCurrentFullHeight;
    const isPartiallyMaximized =
      (isCurrentFullWidth || isCurrentFullHeight) && !isFullScreen;

    let newWidth = dimensions.width;
    let newHeight = dimensions.height;
    const newCorner = getOppositeCorner(
      position,
      corner,
      isFullScreen,
      isCurrentFullWidth,
      isCurrentFullHeight,
    );

    if (position === 'left' || position === 'right') {
      newWidth = isCurrentFullWidth ? dimensions.width : windowDims.maxWidth;
      if (isPartiallyMaximized) {
        newWidth = isCurrentFullWidth ? MIN_SIZE.width : windowDims.maxWidth;
      }
    } else {
      newHeight = isCurrentFullHeight
        ? dimensions.height
        : windowDims.maxHeight;
      if (isPartiallyMaximized) {
        newHeight = isCurrentFullHeight
          ? MIN_SIZE.initialHeight
          : windowDims.maxHeight;
      }
    }

    if (isFullScreen) {
      if (position === 'left' || position === 'right') {
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
    const maxTreeWidth = Math.floor(newWidth - (MIN_SIZE.width / 2));
    const currentTreeWidth = signalWidget.value.componentsTree.width;
    const defaultWidth = Math.floor(newWidth * 0.3); // Use 30% of window width as default

    const newTreeWidth = isCurrentFullWidth
      ? MIN_CONTAINER_WIDTH
      : (position === 'left' || position === 'right') && !isCurrentFullWidth
        ? Math.min(maxTreeWidth, Math.max(MIN_CONTAINER_WIDTH, defaultWidth))
        : Math.min(maxTreeWidth, Math.max(MIN_CONTAINER_WIDTH, currentTreeWidth));

    requestAnimationFrame(() => {
      signalWidget.value = {
        corner: newCorner,
        dimensions: newDimensions,
        lastDimensions: dimensions,
        componentsTree: {
          ...signalWidget.value.componentsTree,
          width: newTreeWidth,
        },
      };

      containerStyle.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      containerStyle.width = `${newWidth}px`;
      containerStyle.height = `${newHeight}px`;
      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
    });

    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: newCorner,
      dimensions: newDimensions,
      lastDimensions: dimensions,
      componentsTree: {
        ...signalWidget.value.componentsTree,
        width: newTreeWidth,
      },
    });
  }, []);

  return (
    <div
      ref={refContainer}
      onMouseDown={handleResize}
      onDblClick={handleDoubleClick}
      className={cn(
        'absolute z-50',
        'flex items-center justify-center',
        'group',
        'transition-colors select-none',
        'peer',
        {
          'resize-left peer/left': position === 'left',
          'resize-right peer/right z-10': position === 'right',
          'resize-top peer/top': position === 'top',
          'resize-bottom peer/bottom': position === 'bottom',
        },
      )}
    >
      <span className="resize-line-wrapper">
        <span className="resize-line">
          <Icon
            name="icon-ellipsis"
            size={18}
            className={cn('text-neutral-400', {
              'rotate-90': position === 'left' || position === 'right',
            })}
          />
        </span>
      </span>
    </div>
  );
};
