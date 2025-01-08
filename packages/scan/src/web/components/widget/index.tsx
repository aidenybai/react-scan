import { type JSX } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { ScanOverlay } from '~web/components/inspector/overlay';
import {
  cn,
  debounce,
  saveLocalStorage,
  toggleMultipleClasses,
} from '~web/utils/helpers';
import { LOCALSTORAGE_KEY, MIN_SIZE, SAFE_AREA } from '../../constants';
import {
  defaultWidgetConfig,
  signalRefContainer,
  signalWidget,
  updateDimensions,
} from '../../state';
import { Inspector } from '../inspector';
import { Header } from './header';
import {
  calculateBoundedSize,
  calculatePosition,
  getBestCorner,
} from './helpers';
import { ResizeHandle } from './resize-handle';
import Toolbar from './toolbar';

export const Widget = () => {
  const refShouldExpand = useRef<boolean>(false);

  const refContainer = useRef<HTMLDivElement | null>(null);
  const refContent = useRef<HTMLDivElement>(null);
  const refFooter = useRef<HTMLDivElement>(null);

  const refInitialMinimizedWidth = useRef<number>(0);
  const refInitialMinimizedHeight = useRef<number>(0);

  const updateWidgetPosition = useCallback((shouldSave = true) => {
    if (!refContainer.current) return;

    const inspectState = Store.inspectState.value;
    const isInspectFocused = inspectState.kind === 'focused';

    const { corner } = signalWidget.value;
    let newWidth, newHeight;

    if (isInspectFocused) {
      const lastDims = signalWidget.value.lastDimensions;
      newWidth = calculateBoundedSize(lastDims.width, 0, true);
      newHeight = calculateBoundedSize(lastDims.height, 0, false);
    } else {
      const currentDims = signalWidget.value.dimensions;
      if (currentDims.width > refInitialMinimizedWidth.current) {
        signalWidget.value = {
          ...signalWidget.value,
          lastDimensions: {
            isFullWidth: currentDims.isFullWidth,
            isFullHeight: currentDims.isFullHeight,
            width: currentDims.width,
            height: currentDims.height,
            position: currentDims.position,
          },
        };
      }
      newWidth = refInitialMinimizedWidth.current;
      newHeight = refInitialMinimizedHeight.current;
    }

    const newPosition = calculatePosition(corner, newWidth, newHeight);

    if (newWidth < MIN_SIZE.width || newHeight < MIN_SIZE.height * 5) {
      shouldSave = false;
    }

    const container = refContainer.current;
    const containerStyle = container.style;

    let rafId: number | null = null;
    const onTransitionEnd = () => {
      containerStyle.transition = 'none';
      updateDimensions();
      container.removeEventListener('transitionend', onTransitionEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    container.addEventListener('transitionend', onTransitionEnd);
    containerStyle.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    rafId = requestAnimationFrame(() => {
      containerStyle.width = `${newWidth}px`;
      containerStyle.height = `${newHeight}px`;
      containerStyle.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;
      rafId = null;
    });

    const newDimensions = {
      isFullWidth: newWidth >= window.innerWidth - SAFE_AREA * 2,
      isFullHeight: newHeight >= window.innerHeight - SAFE_AREA * 2,
      width: newWidth,
      height: newHeight,
      position: newPosition,
    };

    signalWidget.value = {
      corner,
      dimensions: newDimensions,
      lastDimensions: isInspectFocused
        ? signalWidget.value.lastDimensions
        : newWidth > refInitialMinimizedWidth.current
          ? newDimensions
          : signalWidget.value.lastDimensions,
    };

    if (shouldSave) {
      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: signalWidget.value.corner,
        dimensions: signalWidget.value.dimensions,
        lastDimensions: signalWidget.value.lastDimensions,
      });
    }

    updateDimensions();
  }, []);

  const handleDrag = useCallback(
    (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!refContainer.current || (e.target as HTMLElement).closest('button'))
        return;

      const container = refContainer.current;
      const containerStyle = container.style;
      const { dimensions } = signalWidget.value;

      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;

      const initialX = dimensions.position.x;
      const initialY = dimensions.position.y;

      let currentX = initialX;
      let currentY = initialY;
      let rafId: number | null = null;
      let hasMoved = false;
      let lastMouseX = initialMouseX;
      let lastMouseY = initialMouseY;

      const handleMouseMove = (e: globalThis.MouseEvent) => {
        if (rafId) return;

        hasMoved = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        rafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX;
          const deltaY = lastMouseY - initialMouseY;

          currentX = Number(initialX) + deltaX;
          currentY = Number(initialY) + deltaY;

          containerStyle.transition = 'none';
          containerStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          rafId = null;
        });
      };

      const handleMouseUp = () => {
        if (!container) return;

        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (!hasMoved) return;

        const newCorner = getBestCorner(
          lastMouseX,
          lastMouseY,
          initialMouseX,
          initialMouseY,
          Store.inspectState.value.kind === 'focused' ? 80 : 40,
        );

        if (newCorner === signalWidget.value.corner) {
          containerStyle.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          const currentPosition = signalWidget.value.dimensions.position;
          requestAnimationFrame(() => {
            containerStyle.transform = `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`;
          });
          return;
        }

        const snappedPosition = calculatePosition(
          newCorner,
          dimensions.width,
          dimensions.height,
        );

        if (currentX === initialX && currentY === initialY) return;

        const onTransitionEnd = () => {
          containerStyle.transition = 'none';
          updateDimensions();
          container.removeEventListener('transitionend', onTransitionEnd);
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        };

        container.addEventListener('transitionend', onTransitionEnd);
        containerStyle.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        requestAnimationFrame(() => {
          containerStyle.transform = `translate3d(${snappedPosition.x}px, ${snappedPosition.y}px, 0)`;
        });

        signalWidget.value = {
          corner: newCorner,
          dimensions: {
            isFullWidth: dimensions.isFullWidth,
            isFullHeight: dimensions.isFullHeight,
            width: dimensions.width,
            height: dimensions.height,
            position: snappedPosition,
          },
          lastDimensions: signalWidget.value.lastDimensions,
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

  useEffect(() => {
    if (!refContainer.current || !refFooter.current) return;

    refContainer.current.style.width = 'min-content';
    refInitialMinimizedHeight.current = refFooter.current.offsetHeight;
    refInitialMinimizedWidth.current = refContainer.current.offsetWidth;

    refContainer.current.style.maxWidth = `calc(100vw - ${SAFE_AREA * 2}px)`;
    refContainer.current.style.maxHeight = `calc(100vh - ${SAFE_AREA * 2}px)`;

    if (Store.inspectState.value.kind !== 'focused') {
      signalWidget.value = {
        ...signalWidget.value,
        dimensions: {
          isFullWidth: false,
          isFullHeight: false,
          width: refInitialMinimizedWidth.current,
          height: refInitialMinimizedHeight.current,
          position: signalWidget.value.dimensions.position,
        },
      };
    }

    signalRefContainer.value = refContainer.current;

    const unsubscribeSignalWidget = signalWidget.subscribe((widget) => {
      if (!refContainer.current) return;

      const { x, y } = widget.dimensions.position;
      const { width, height } = widget.dimensions;
      const container = refContainer.current;

      requestAnimationFrame(() => {
        container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
      });
    });

    const unsubscribeStoreInspectState = Store.inspectState.subscribe(
      (state) => {
        if (!refContent.current) return;

        refShouldExpand.current = state.kind === 'focused';

        if (state.kind === 'inspecting') {
          toggleMultipleClasses(refContent.current, [
            'opacity-0',
            'duration-0',
            'delay-0',
          ]);
        }
        updateWidgetPosition();
      },
    );

    const handleWindowResize = debounce(() => {
      updateWidgetPosition(true);
    }, 100);

    window.addEventListener('resize', handleWindowResize, { passive: true });
    updateWidgetPosition(false);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      unsubscribeStoreInspectState();
      unsubscribeSignalWidget();

      saveLocalStorage(LOCALSTORAGE_KEY, {
        ...defaultWidgetConfig,
        corner: signalWidget.value.corner,
      });
    };
  }, []);

  return (
    <>
      <ScanOverlay />
      <div
        id="react-scan-toolbar"
        ref={refContainer}
        onMouseDown={handleDrag}
        className={cn(
          'fixed inset-0 rounded-lg shadow-lg',
          'flex flex-col',
          'font-mono text-[13px]',
          'user-select-none',
          'opacity-0',
          'cursor-move',
          'z-[124124124124]',
          'animate-fade-in animation-duration-300 animation-delay-300',
          'will-change-transform',
        )}
      >
        <ResizeHandle position="top" />
        <ResizeHandle position="bottom" />
        <ResizeHandle position="left" />
        <ResizeHandle position="right" />

        <div
          className={cn(
            'flex flex-1 flex-col',
            'overflow-hidden z-10',
            'rounded-lg',
            'bg-black',
            'opacity-100',
            'transition-[border-radius] duration-150',
            'peer-hover/left:rounded-l-none',
            'peer-hover/right:rounded-r-none',
            'peer-hover/top:rounded-t-none',
            'peer-hover/bottom:rounded-b-none',
          )}
        >
          <div
            ref={refContent}
            className={cn(
              'relative',
              'flex-1',
              'flex flex-col',
              'rounded-t-lg',
              'overflow-hidden',
              'opacity-100',
              'transition-[opacity] duration-150',
            )}
          >
            <Header />
            <div
              className={cn(
                'react-scan-prop',
                'flex-1',
                'text-white',
                'transition-opacity duration-150 delay-150',
                'overflow-y-scroll overflow-x-hidden',
              )}
            >
              <Inspector />
            </div>
          </div>

          <div
            ref={refFooter}
            className={cn(
              'relative',
              'h-9',
              'flex items-center justify-between',
              'transition-colors duration-200',
              'overflow-hidden',
              'rounded-lg',
              'z-10',
            )}
          >
            <Toolbar />
          </div>
        </div>
      </div>
    </>
  );
};
