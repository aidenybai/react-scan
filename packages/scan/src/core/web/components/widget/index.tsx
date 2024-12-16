import { type JSX } from 'preact';
import { useRef, useCallback, useEffect, useMemo } from 'preact/hooks';
import { cn, debounce, saveLocalStorage } from '@web-utils/helpers';
import { getCompositeComponentFromElement } from '@web-inspect-element/utils';
import { Store } from 'src/core';
import { signalWidget, signalRefContainer, updateDimensions } from '../../state';
import { SAFE_AREA, LOCALSTORAGE_KEY } from '../../constants';
import { Header } from './header';
import { type Corner } from './types'
import Toolbar from './toolbar';
import { ResizeHandle } from './resize-handle';
import { calculatePosition } from './helpers';

export const Widget = () => {
  const inspectState = Store.inspectState.value;

  const isInspectFocused = inspectState.kind === 'focused';

  const refContainer = useRef<HTMLDivElement | null>(null);
  const refPropContainer = useRef<HTMLDivElement>(null);
  const refFooter = useRef<HTMLDivElement>(null);

  const refInitialMinimizedWidth = useRef<number>(0);
  const refInitialMinimizedHeight = useRef<number>(0);

  useEffect(() => {
    if (!refContainer.current || !refFooter.current) return;

    refContainer.current.style.width = 'min-content';
    refInitialMinimizedHeight.current = refFooter.current.offsetHeight;
    refInitialMinimizedWidth.current = refContainer.current.offsetWidth;

    signalWidget.value = {
      ...signalWidget.value,
      dimensions: {
        ...signalWidget.value.dimensions,
        width: refInitialMinimizedWidth.current,
        height: refInitialMinimizedHeight.current
      }
    };

    signalRefContainer.value = refContainer.current;
  }, []);

  const shouldExpand = useMemo(() => {
    if (isInspectFocused && inspectState.focusedDomElement) {
      const { parentCompositeFiber } = getCompositeComponentFromElement(inspectState.focusedDomElement);
      if (!parentCompositeFiber) {
        setTimeout(() => {
          Store.inspectState.value = {
            kind: 'inspect-off',
            propContainer: refPropContainer.current!,
          };
        }, 16);

        return false;
      }
    }

    return true;
  }, [isInspectFocused]);

  const handleMouseDown = useCallback((e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!refContainer.current) return;

    e.preventDefault();

    const container = refContainer.current;
    const { dimensions } = signalWidget.value;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = dimensions.position.x;
    const initialY = dimensions.position.y;

    let currentX = initialX;
    let currentY = initialY;
    let rafId: number | null = null;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (rafId) return;

      container.style.transition = 'none';

      rafId = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        currentX = initialX + deltaX;
        currentY = initialY + deltaY;

        container.style.transform = `translate(${currentX}px, ${currentY}px)`;
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (!container) return;
      if (rafId) cancelAnimationFrame(rafId);

      requestAnimationFrame(() => {
        container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        const newCorner = `${currentY < window.innerHeight / 2 ? 'top' : 'bottom'}-${currentX < window.innerWidth / 2 ? 'left' : 'right'}` as Corner;
        const snappedPosition = calculatePosition(newCorner, dimensions.width, dimensions.height);

        if (currentX === initialX && currentY === initialY) return;

        container.style.transform = `translate(${snappedPosition.x}px, ${snappedPosition.y}px)`;

        signalWidget.value = {
          isResizing: false,
          corner: newCorner,
          dimensions: {
            isFullWidth: dimensions.isFullWidth,
            isFullHeight: dimensions.isFullHeight,
            width: dimensions.width,
            height: dimensions.height,
            position: snappedPosition
          },
          lastDimensions: signalWidget.value.lastDimensions
        };

        saveLocalStorage(LOCALSTORAGE_KEY, {
          corner: signalWidget.value.corner,
          dimensions: signalWidget.value.dimensions,
          lastDimensions: signalWidget.value.lastDimensions
        });

        updateDimensions();
      });

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (!refContainer.current || !shouldExpand) {
      return;
    }

    let resizeTimeout: number;
    let isInitialUpdate = true;

    const updateWidgetPosition = () => {
      if (!refContainer.current) return;

      const { corner } = signalWidget.value;
      let newWidth, newHeight;

      if (isInspectFocused) {
        const lastDims = signalWidget.value.lastDimensions;
        newWidth = lastDims.width;
        newHeight = lastDims.height;
      } else {
        if (signalWidget.value.dimensions.width !== refInitialMinimizedWidth.current) {
          signalWidget.value = {
            ...signalWidget.value,
            lastDimensions: {
              ...signalWidget.value.dimensions
            }
          };
        }
        newWidth = refInitialMinimizedWidth.current;
        newHeight = refInitialMinimizedHeight.current;
      }

      const newPosition = calculatePosition(corner, newWidth, newHeight);

      refContainer.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      refContainer.current.style.width = `${newWidth}px`;
      refContainer.current.style.height = `${newHeight}px`;
      refContainer.current.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;

      signalWidget.value = {
        isResizing: false,
        corner,
        dimensions: {
          isFullWidth: newWidth >= window.innerWidth - (SAFE_AREA * 2),
          isFullHeight: newHeight >= window.innerHeight - (SAFE_AREA * 2),
          width: newWidth,
          height: newHeight,
          position: newPosition
        },
        lastDimensions: signalWidget.value.lastDimensions
      };

      if (!isInitialUpdate) {
        saveLocalStorage(LOCALSTORAGE_KEY, {
          corner: signalWidget.value.corner,
          dimensions: signalWidget.value.dimensions,
          lastDimensions: signalWidget.value.lastDimensions
        });
      }
      isInitialUpdate = false;

      updateDimensions();
    };

    const handleWindowResize = debounce(() => {
      if (resizeTimeout) window.cancelAnimationFrame(resizeTimeout);
      resizeTimeout = window.requestAnimationFrame(updateWidgetPosition);
    }, 16);

    updateWidgetPosition();

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (resizeTimeout) window.cancelAnimationFrame(resizeTimeout);
    };
  }, [isInspectFocused, shouldExpand]);

  return (
    <div
      id="react-scan-toolbar"
      ref={refContainer}
      onMouseDown={handleMouseDown}
      className={cn(
        "fixed inset-0 rounded-lg shadow-lg",
        "flex flex-col",
        "bg-black",
        'font-mono text-[13px]',
        'user-select-none',
        'opacity-0',
        'cursor-move',
        'z-[124124124124]',
        'animate-fade-in animation-duration-300 animation-delay-300',
      )}
    >
      <div
        className={cn(
          "flex-1",
          "flex flex-col",
          "rounded-t-lg",
          "overflow-hidden",
          'opacity-100',
          'transition-opacity duration-150',
          {
            'opacity-0 duration-0 delay-0': !isInspectFocused,
          }
        )}
      >
        <Header />
        <div
          ref={refPropContainer}
          className={cn(
            "react-scan-prop",
            "flex-1",
            "text-white",
            "transition-opacity duration-150 delay-150",
            "overflow-y-auto overflow-x-hidden",
            {
              'opacity-0 duration-0 delay-0': !isInspectFocused,
            }
          )}
        />
      </div>

      <div
        ref={refFooter}
        className={cn(
          "h-9",
          "flex items-center justify-between",
          "transition-colors duration-200",
          "overflow-hidden",
          "rounded-lg"
        )}
      >
        <Toolbar refPropContainer={refPropContainer} />
      </div>

      {
        isInspectFocused && shouldExpand && (
          <>
            <ResizeHandle position="top" />
            <ResizeHandle position="bottom" />
            <ResizeHandle position="left" />
            <ResizeHandle position="right" />

            <ResizeHandle position="top-left" />
            <ResizeHandle position="top-right" />
            <ResizeHandle position="bottom-left" />
            <ResizeHandle position="bottom-right" />
          </>
        )
      }
    </div>
  );
};
