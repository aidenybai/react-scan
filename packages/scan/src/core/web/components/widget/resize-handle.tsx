import { type JSX } from 'preact';
import { useCallback } from "preact/hooks";
import { memo } from 'preact/compat';
import { cn, saveLocalStorage } from '@web-utils/helpers';
import { Icon } from '@web-components/icon';
import { signalWidget, signalRefContainer, updateDimensions } from '../../state';
import { LOCALSTORAGE_KEY, MIN_SIZE, SAFE_AREA } from '../../constants';
import { type ResizeHandleProps } from './types';
import {
  calculatePosition,
  getInteractionClasses,
  getPositionClasses,
  calculateNewSizeAndPosition,
  getHandleVisibility,
  getWindowDimensions,
  getOppositeCorner,
  getClosestCorner
} from './helpers';

export const ResizeHandle = memo(({ position }: ResizeHandleProps) => {
  const isLine = !position.includes('-');
  const { dimensions, lastDimensions } = signalWidget.value;
  const { isFullWidth, isFullHeight } = dimensions;
  const currentCorner = signalWidget.value.corner;

  const getVisibilityClass = useCallback(() =>
    getHandleVisibility(position, isLine, currentCorner, isFullWidth, isFullHeight),
    [dimensions, position, isLine, isFullWidth, isFullHeight]
  );

  const handleDoubleClick = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!signalRefContainer.value) return;

    const { maxWidth, maxHeight, isFullWidth, isFullHeight } = getWindowDimensions();
    const currentWidth = signalWidget.value.dimensions.width;
    const currentHeight = signalWidget.value.dimensions.height;
    const currentCorner = signalWidget.value.corner;

    let isCurrentFullWidth = isFullWidth(currentWidth);
    let isCurrentFullHeight = isFullHeight(currentHeight);

    const isFullScreen = isCurrentFullWidth && isCurrentFullHeight;
    const isPartiallyMaximized = (isCurrentFullWidth || isCurrentFullHeight) && !isFullScreen;

    let newWidth = currentWidth;
    let newHeight = currentHeight;
    const newCorner = getOppositeCorner(
      position,
      currentCorner,
      isFullScreen,
      isCurrentFullWidth,
      isCurrentFullHeight
    );

    if (isLine) {
      if (position === 'left' || position === 'right') {
        newWidth = isCurrentFullWidth ? lastDimensions.width : maxWidth;
        if (isPartiallyMaximized) {
          newWidth = isCurrentFullWidth ? MIN_SIZE.width : maxWidth;
        }
      } else {
        newHeight = isCurrentFullHeight ? lastDimensions.height : maxHeight;
        if (isPartiallyMaximized) {
          newHeight = isCurrentFullHeight ? MIN_SIZE.height * 12 : maxHeight;
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
          newHeight = MIN_SIZE.height * 12;
        }
      } else {
        newWidth = MIN_SIZE.width;
        newHeight = MIN_SIZE.height * 12;
        isCurrentFullWidth = false;
        isCurrentFullHeight = false;
      }
    }

    const container = signalRefContainer.value;
    const newPosition = calculatePosition(newCorner, newWidth, newHeight);

    container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
    container.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;

    const newState = {
      isResizing: true,
      corner: newCorner,
      dimensions: {
        isFullWidth: isCurrentFullWidth,
        isFullHeight: isCurrentFullHeight,
        width: newWidth,
        height: newHeight,
        position: newPosition
      },
      lastDimensions: signalWidget.value.dimensions
    };
    signalWidget.value = newState;

    const onTransitionEnd = () => {
      container.style.transition = '';
      updateDimensions();
      container.removeEventListener('transitionend', onTransitionEnd);
    };
    container.addEventListener('transitionend', onTransitionEnd);

    saveLocalStorage(LOCALSTORAGE_KEY, {
      corner: newCorner,
      dimensions: signalWidget.value.dimensions
    });
  }, [isLine, position, lastDimensions]);

  const handleResize = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const container = signalRefContainer.value;
    if (!container) return;

    const initialX = e.clientX;
    const initialY = e.clientY;
    const { dimensions } = signalWidget.value;

    const initialWidth = dimensions.isFullWidth
      ? window.innerWidth - (SAFE_AREA * 2)
      : dimensions.width;
    const initialHeight = dimensions.isFullHeight
      ? window.innerHeight - (SAFE_AREA * 2)
      : dimensions.height;
    const initialPosition = dimensions.position;

    let rafId: number | null = null;
    let isResizing = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || rafId) return;

      container.style.transition = 'none';

      rafId = requestAnimationFrame(() => {
        const { newSize, newPosition } = calculateNewSizeAndPosition(
          position,
          { width: initialWidth, height: initialHeight },
          initialPosition,
          e.clientX - initialX,
          e.clientY - initialY
        );

        container.style.width = `${newSize.width}px`;
        container.style.height = `${newSize.height}px`;
        container.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;

        signalWidget.value = {
          ...signalWidget.value,
          dimensions: {
            ...signalWidget.value.dimensions,
            width: newSize.width,
            height: newSize.height,
            position: newPosition
          },
          isResizing: true
        };

        rafId = null;
      });
    };

    const handleMouseUp = () => {
      isResizing = false;
      if (rafId) cancelAnimationFrame(rafId);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      requestAnimationFrame(() => {
        const container = signalRefContainer.value;
        if (!container) return;

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

        container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;

        signalWidget.value = {
          isResizing: false,
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

        updateDimensions();
      });
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
  }, [position]);

  return (
    <div
      data-direction={position}
      onMouseDown={handleResize}
      onDblClick={handleDoubleClick}
      className={cn(
        "flex items-center justify-center",
        "resize-handle absolute",
        "group",
        'overflow-hidden',
        "transition-opacity select-none z-50 pointer-events-auto",
        getPositionClasses(position),
        getInteractionClasses(position, isLine, getVisibilityClass())
      )}
    >
      {
        isLine ?
          (
            <span
              className={cn(
                "absolute",
                "opacity-0 group-hover:opacity-100 group-active:opacity-100",
                "transition-[transform, opacity] duration-300",
                "delay-500 group-hover:delay-0 group-active:delay-0",
                {
                  "translate-y-full group-hover:-translate-y-1.5 group-active:-translate-y-1.5":
                    position === 'top',
                  "-translate-x-full group-hover:translate-x-1.5 group-active:translate-x-1.5":
                    position === 'right',
                  "-translate-y-full group-hover:translate-y-1.5 group-active:translate-y-1.5":
                    position === 'bottom',
                  "translate-x-full group-hover:-translate-x-1.5 group-active:-translate-x-1.5":
                    position === 'left',
                }
              )}
            >
              <Icon
                className='text-[#7b51c8]'
                name={position === 'left' || position === 'right'
                  ? 'icon-grip-vertical'
                  : 'icon-grip-horizontal'
                }
              />
            </span>
          )
          : (
            <span
              className={cn(
                "absolute w-6 h-6",
                "opacity-0 group-hover:opacity-100 group-active:opacity-100",
                "transition-[transform,opacity] duration-300",
                "delay-500 group-hover:delay-0 group-active:delay-0",
                "before:content-[''] before:absolute",
                "before:w-0 before:h-0",
                "before:border-[5px] before:border-transparent before:border-t-[#7b51c8]",
                {
                  "before:top-0 before:left-0 before:rotate-[135deg] translate-x-2 translate-y-2":
                    position === 'top-left',

                  "before:top-0 before:right-0 before:rotate-[225deg] -translate-x-2 translate-y-2":
                    position === 'top-right',

                  "before:bottom-0 before:left-0 before:rotate-45 translate-x-2 -translate-y-2":
                    position === 'bottom-left',

                  "before:bottom-0 before:right-0 before:-rotate-45 -translate-x-2 -translate-y-2":
                    position === 'bottom-right',
                },
                "group-hover:translate-x-0 group-hover:translate-y-0",
                "group-active:translate-x-0 group-active:translate-y-0"
              )}
            />
          )
      }
    </div>
  );
}, (prevProps, nextProps) => prevProps.position === nextProps.position);
