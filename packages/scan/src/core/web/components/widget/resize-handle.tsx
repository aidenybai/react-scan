import { type JSX } from 'preact';
import { useCallback, useRef, useEffect } from 'preact/hooks';
import { cn, saveLocalStorage, toggleMultipleClasses } from '@web-utils/helpers';
import { Store } from 'src/core';
import { signalWidget, signalRefContainer } from '../../state';
import { LOCALSTORAGE_KEY, MIN_SIZE } from '../../constants';
import { Icon } from '../icon';
import { type Corner, type ResizeHandleProps } from './types';
import {
  getWindowDimensions,
  getOppositeCorner,
  getClosestCorner,
  calculateNewSizeAndPosition,
  getPositionClasses,
  getInteractionClasses,
  getHandleVisibility,
  calculatePosition
} from './helpers';

export const ResizeHandle = ({ position }: ResizeHandleProps) => {
  const isLine = !position.includes('-');

  const refContainer = useRef<HTMLDivElement>(null);
  const refLine = useRef<HTMLDivElement>(null);
  const refCorner = useRef<HTMLDivElement>(null);

  const prevWidth = useRef<number | null>(null);
  const prevHeight = useRef<number | null>(null);
  const prevCorner = useRef<Corner | null>(null);

  useEffect(() => {
    if (!refContainer.current) return;
    const classes = getInteractionClasses(position, isLine);
    toggleMultipleClasses(refContainer.current, ...classes);

    const updateVisibility = (isFocused: boolean) => {
      if (!refContainer.current) return;
      const isVisible = isFocused && getHandleVisibility(
        position,
        isLine,
        signalWidget.value.corner,
        signalWidget.value.dimensions.isFullWidth,
        signalWidget.value.dimensions.isFullHeight
      );

      if (!isVisible) {
        refContainer.current.classList.add('hidden', 'pointer-events-none', 'opacity-0');
      } else {
        refContainer.current.classList.remove('hidden', 'pointer-events-none', 'opacity-0');
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

    const unsubscribeStoreInspectState = Store.inspectState.subscribe(state => {
      if (!refContainer.current) return;

      updateVisibility(state.kind === 'focused');
    });

    return () => {
      unsubscribeSignalWidget();
      unsubscribeStoreInspectState();
      prevWidth.current = null;
      prevHeight.current = null;
      prevCorner.current = null;
    };
  }, []);

  const handleResize = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
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
        position: initialPosition
      }
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
          e.clientY - initialY
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
            position: newPosition
          },
        };

        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);

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
        dimensions.height
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
          position: newPosition
        },
        lastDimensions: {
          isFullWidth: isCurrentFullWidth,
          isFullHeight: isCurrentFullHeight,
          width: dimensions.width,
          height: dimensions.height,
          position: newPosition
        }
      };

      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: newCorner,
        dimensions: signalWidget.value.dimensions,
        lastDimensions: signalWidget.value.lastDimensions
      });

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleDoubleClick = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const container = signalRefContainer.value;
    if (!container) return;

    const containerStyle = container.style;
    const { dimensions, corner } = signalWidget.value;
    const { maxWidth, maxHeight, isFullWidth, isFullHeight } = getWindowDimensions();

    const isCurrentFullWidth = isFullWidth(dimensions.width);
    const isCurrentFullHeight = isFullHeight(dimensions.height);
    const isFullScreen = isCurrentFullWidth && isCurrentFullHeight;
    const isPartiallyMaximized = (isCurrentFullWidth || isCurrentFullHeight) && !isFullScreen;

    let newWidth = dimensions.width;
    let newHeight = dimensions.height;
    const newCorner = getOppositeCorner(
      position,
      corner,
      isFullScreen,
      isCurrentFullWidth,
      isCurrentFullHeight
    );

    if (isLine) {
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
    } else {
      newWidth = maxWidth;
      newHeight = maxHeight;
    }

    if (isFullScreen) {
      if (isLine) {
        if (position === 'left' || position === 'right') {
          newWidth = MIN_SIZE.width;
        } else {
          newHeight = MIN_SIZE.height * 5;
        }
      } else {
        newWidth = MIN_SIZE.width;
        newHeight = MIN_SIZE.height * 5;
      }
    }

    const newPosition = calculatePosition(newCorner, newWidth, newHeight);
    const newDimensions = {
      isFullWidth: isFullWidth(newWidth),
      isFullHeight: isFullHeight(newHeight),
      width: newWidth,
      height: newHeight,
      position: newPosition
    };

    requestAnimationFrame(() => {
      signalWidget.value = {
        corner: newCorner,
        dimensions: newDimensions,
        lastDimensions: dimensions
      };

      containerStyle.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      containerStyle.width = `${newWidth}px`;
      containerStyle.height = `${newHeight}px`;
      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
    });

    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: newCorner,
      dimensions: newDimensions,
      lastDimensions: dimensions
    });
  }, []);

  return (
    <div
      ref={refContainer}
      onMouseDown={handleResize}
      onDblClick={handleDoubleClick}
      className={cn(
        "flex items-center justify-center",
        "resize-handle absolute",
        "group overflow-hidden",
        "transition-opacity select-none z-50",
        getPositionClasses(position)
      )}
    >
      {
        isLine ? (
          <span
            ref={refLine}
            className={cn(
              "absolute",
              "opacity-0 group-hover:opacity-100 group-active:opacity-100",
              "transition-[transform, opacity] duration-300",
              "delay-500 group-hover:delay-0 group-active:delay-0 group-active:opacity-0",
              {
                "translate-y-full group-hover:-translate-y-1/4":
                  position === 'top',
                "-translate-x-full group-hover:translate-x-1/4":
                  position === 'right',
                "-translate-y-full group-hover:translate-y-1/4":
                  position === 'bottom',
                "translate-x-full group-hover:-translate-x-1/4":
                  position === 'left',
              }
            )}
          >
            <Icon
              name="icon-chevrons-up-down"
              className={cn(
                'text-[#7b51c8]',
                {
                  'rotate-90': position === 'left' || position === 'right',
                }
              )}
            />
          </span>
        )
          : (
            <span
              ref={refCorner}
              className={cn(
                "absolute inset-0",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 group-active:opacity-100",
                "transition-[transform,opacity] duration-300",
                "delay-500 group-hover:delay-0 group-active:delay-0",
                'origin-center',
                "text-[#7b51c8]",
                {
                  "top-0 left-0 rotate-[135deg] translate-x-full translate-y-full":
                    position === 'top-left',

                  "top-0 right-0 rotate-[225deg] -translate-x-full translate-y-full":
                    position === 'top-right',

                  "bottom-0 left-0 rotate-45 translate-x-full -translate-y-full":
                    position === 'bottom-left',

                  "bottom-0 right-0 -rotate-45 -translate-x-full -translate-y-full":
                    position === 'bottom-right',
                },
                "group-hover:translate-x-0 group-hover:translate-y-0",
                "group-active:opacity-0"
              )}
            >
              <Icon name="icon-chevrons-up-down" />
            </span>
          )
      }
    </div>
  );
};
