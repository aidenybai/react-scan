import { type JSX } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import { cn, saveLocalStorage } from '~web/utils/helpers';
import { LOCALSTORAGE_KEY, MIN_SIZE } from '../../constants';
import { signalRefContainer, signalWidget } from '../../state';
import {
  calculateNewSizeAndPosition,
  calculatePosition,
  getClosestCorner,
  getHandleVisibility,
  getOppositeCorner,
  getWindowDimensions,
} from './helpers';
import { type Corner, type ResizeHandleProps } from './types';

export const ResizeHandle = ({ position }: ResizeHandleProps) => {
  const refContainer = useRef<HTMLDivElement>(null);

  const prevWidth = useRef<number | null>(null);
  const prevHeight = useRef<number | null>(null);
  const prevCorner = useRef<Corner | null>(null);

  useEffect(() => {
    if (!refContainer.current) return;

    const updateVisibility = (isFocused: boolean) => {
      if (!refContainer.current) return;
      const isVisible =
        isFocused &&
        getHandleVisibility(
          position,
          signalWidget.value.corner,
          signalWidget.value.dimensions.isFullWidth,
          signalWidget.value.dimensions.isFullHeight,
        );

      if (isVisible) {
        refContainer.current.classList.remove(
          'hidden',
          'pointer-events-none',
          'opacity-0',
        );
      } else {
        refContainer.current.classList.add(
          'hidden',
          'pointer-events-none',
          'opacity-0',
        );
      }
    };

    const unsubscribeSignalWidget = signalWidget.subscribe((state) => {
      if (!refContainer.current) return;

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

      updateVisibility(Store.inspectState.value.kind === 'focused');

      prevWidth.current = state.dimensions.width;
      prevHeight.current = state.dimensions.height;
      prevCorner.current = state.corner;
    });

    const unsubscribeStoreInspectState = Store.inspectState.subscribe(
      (state) => {
        if (!refContainer.current) return;
        updateVisibility(state.kind === 'focused');
      },
    );

    return () => {
      unsubscribeSignalWidget();
      unsubscribeStoreInspectState();
      prevWidth.current = null;
      prevHeight.current = null;
      prevCorner.current = null;
    };
  }, []);

  const handleResize = useCallback(
    (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const container = signalRefContainer.value;
      if (!container) return;

      const containerStyle = container.style;
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

          signalWidget.value = {
            ...signalWidget.value,
            dimensions: {
              isFullWidth: false,
              isFullHeight: false,
              width: newSize.width,
              height: newSize.height,
              position: newPosition,
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
        const { isFullWidth, isFullHeight } = getWindowDimensions();
        const isCurrentFullWidth = isFullWidth(dimensions.width);
        const isCurrentFullHeight = isFullHeight(dimensions.height);
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
          container.removeEventListener('transitionend', onTransitionEnd);
        };

        container.addEventListener('transitionend', onTransitionEnd);
        containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;

        signalWidget.value = {
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
        });
      };

      document.addEventListener('mousemove', handleMouseMove, {
        passive: true,
      });
      document.addEventListener('mouseup', handleMouseUp);
    },
    [],
  );

  const handleDoubleClick = useCallback(
    (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const container = signalRefContainer.value;
      if (!container) return;

      const containerStyle = container.style;
      const { dimensions, corner } = signalWidget.value;
      const { maxWidth, maxHeight, isFullWidth, isFullHeight } =
        getWindowDimensions();

      const isCurrentFullWidth = isFullWidth(dimensions.width);
      const isCurrentFullHeight = isFullHeight(dimensions.height);
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
        newWidth = isCurrentFullWidth ? dimensions.width : maxWidth;
        if (isPartiallyMaximized) {
          newWidth = isCurrentFullWidth ? MIN_SIZE.width : maxWidth;
        }
      } else {
        newHeight = isCurrentFullHeight ? dimensions.height : maxHeight;
        if (isPartiallyMaximized) {
          newHeight = isCurrentFullHeight ? MIN_SIZE.height * 5 : maxHeight;
        }
      }

      if (isFullScreen) {
        if (position === 'left' || position === 'right') {
          newWidth = MIN_SIZE.width;
        } else {
          newHeight = MIN_SIZE.height * 5;
        }
      }

      const newPosition = calculatePosition(newCorner, newWidth, newHeight);
      const newDimensions = {
        isFullWidth: isFullWidth(newWidth),
        isFullHeight: isFullHeight(newHeight),
        width: newWidth,
        height: newHeight,
        position: newPosition,
      };

      requestAnimationFrame(() => {
        signalWidget.value = {
          corner: newCorner,
          dimensions: newDimensions,
          lastDimensions: dimensions,
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
      });
    },
    [],
  );

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
          'resize-right peer/right': position === 'right',
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
            className={cn('text-white/80', {
              'rotate-90': position === 'left' || position === 'right',
            })}
          />
        </span>
      </span>
    </div>
  );
};
