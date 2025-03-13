import { createContext, type JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { cn, saveLocalStorage } from '~web/utils/helpers';
import { Content } from '~web/views';
import { ScanOverlay } from '~web/views/inspector/overlay';
import { LOCALSTORAGE_KEY, MIN_SIZE, SAFE_AREA } from '../constants';
import {
  defaultWidgetConfig,
  signalRefWidget,
  signalWidget,
  signalWidgetViews,
  updateDimensions,
} from '../state';
import {
  calculateBoundedSize,
  calculatePosition,
  getBestCorner,
} from './helpers';
import { ResizeHandle } from './resize-handle';

export const Widget = () => {
  const refWidget = useRef<HTMLDivElement | null>(null);
  const refShouldOpen = useRef<boolean>(false);

  const refInitialMinimizedWidth = useRef<number>(0);
  const refInitialMinimizedHeight = useRef<number>(0);

  const updateWidgetPosition = useCallback((shouldSave = true) => {
    if (!refWidget.current) return;

    const { corner } = signalWidget.value;
    let newWidth: number;
    let newHeight: number;

    if (refShouldOpen.current) {
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

    const isTooSmall =
      newWidth < MIN_SIZE.width || newHeight < MIN_SIZE.initialHeight;
    const shouldPersist = shouldSave && !isTooSmall;

    const container = refWidget.current;
    const containerStyle = container.style;

    let rafId: number | null = null;
    const onTransitionEnd = () => {
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
      lastDimensions: refShouldOpen
        ? signalWidget.value.lastDimensions
        : newWidth > refInitialMinimizedWidth.current
          ? newDimensions
          : signalWidget.value.lastDimensions,
      componentsTree: signalWidget.value.componentsTree,
    };

    if (shouldPersist) {
      saveLocalStorage(LOCALSTORAGE_KEY, {
        corner: signalWidget.value.corner,
        dimensions: signalWidget.value.dimensions,
        lastDimensions: signalWidget.value.lastDimensions,
        componentsTree: signalWidget.value.componentsTree,
      });
    }

    updateDimensions();
  }, []);

  const handleDrag = useCallback(
    (e: JSX.TargetedPointerEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!refWidget.current || (e.target as HTMLElement).closest('button'))
        return;

      const container = refWidget.current;
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

      const handlePointerMove = (e: globalThis.PointerEvent) => {
        if (rafId) return;

        hasMoved = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        rafId = requestAnimationFrame(() => {
          const deltaX = lastMouseX - initialMouseX;
          const deltaY = lastMouseY - initialMouseY;

          currentX = Number(initialX) + deltaX;
          currentY = Number(initialY) + deltaY;

          /* [CURSOR GENERATED] Anti-blur fix:
           * Changed from transition: 'all' and transform: translate() to:
           * 1. transition: none - Prevents interpolation blur during drag
           * 2. translate3d - Forces GPU acceleration for crisp text
           */
          containerStyle.transition = 'none';
          containerStyle.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
          rafId = null;
        });
      };

      const handlePointerEnd = () => {
        if (!container) return;

        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerEnd);

        // Calculate total movement distance
        const totalDeltaX = Math.abs(lastMouseX - initialMouseX);
        const totalDeltaY = Math.abs(lastMouseY - initialMouseY);
        const totalMovement = Math.sqrt(
          totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY,
        );

        // Only consider it a move if we moved more than 60 pixels
        if (!hasMoved || totalMovement < 60) return;

        const newCorner = getBestCorner(
          lastMouseX,
          lastMouseY,
          initialMouseX,
          initialMouseY,
          Store.inspectState.value.kind === 'focused' ? 80 : 40,
        );

        if (newCorner === signalWidget.value.corner) {
          /* [CURSOR GENERATED] Anti-blur fix:
           * Changed from transition: 'all' to transition: 'transform'
           * to prevent unnecessary property interpolation that was
           * causing text blur during animation
           */
          containerStyle.transition =
            'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
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
        containerStyle.transition =
          'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

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
          componentsTree: signalWidget.value.componentsTree,
        };

        saveLocalStorage(LOCALSTORAGE_KEY, {
          corner: newCorner,
          dimensions: signalWidget.value.dimensions,
          lastDimensions: signalWidget.value.lastDimensions,
          componentsTree: signalWidget.value.componentsTree,
        });
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerEnd);
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
  useEffect(() => {
    if (!refWidget.current) return;

    refWidget.current.style.width = 'min-content';
    refInitialMinimizedHeight.current = 36; // height of the header
    refInitialMinimizedWidth.current = refWidget.current.offsetWidth;

    refWidget.current.style.maxWidth = `calc(100vw - ${SAFE_AREA * 2}px)`;
    refWidget.current.style.maxHeight = `calc(100vh - ${SAFE_AREA * 2}px)`;

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

    signalRefWidget.value = refWidget.current;

    const unsubscribeSignalWidget = signalWidget.subscribe((widget) => {
      if (!refWidget.current) return;

      const { x, y } = widget.dimensions.position;
      const { width, height } = widget.dimensions;
      const container = refWidget.current;

      requestAnimationFrame(() => {
        container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
      });
    });

    const unsubscribeSignalWidgetViews = signalWidgetViews.subscribe(
      (state) => {
        refShouldOpen.current = state.view !== 'none';
        updateWidgetPosition();
      },
    );

    const unsubscribeStoreInspectState = Store.inspectState.subscribe(
      (state) => {
        refShouldOpen.current = state.kind === 'focused';
        updateWidgetPosition();
      },
    );

    const handleWindowResize = () => {
      updateWidgetPosition(true);
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      unsubscribeSignalWidgetViews();
      unsubscribeStoreInspectState();
      unsubscribeSignalWidget();

      saveLocalStorage(LOCALSTORAGE_KEY, {
        ...defaultWidgetConfig,
        corner: signalWidget.value.corner,
      });
    };
  }, []);

  // i don't want to put the ref in state, so this is the solution to force context to propagate it
  const [_, setTriggerRender] = useState(false);
  useEffect(() => {
    setTriggerRender(true);
  }, []);

  return (
    <>
      <ScanOverlay />
      <ToolbarElementContext.Provider value={refWidget.current}>
        <div
          id="react-scan-toolbar"
          dir="ltr"
          ref={refWidget}
          onPointerDown={handleDrag}
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
            '[touch-action:none]',
          )}
        >
          <ResizeHandle position="top" />
          <ResizeHandle position="bottom" />
          <ResizeHandle position="left" />
          <ResizeHandle position="right" />
          <Content />
        </div>
      </ToolbarElementContext.Provider>
    </>
  );
};

export const ToolbarElementContext = createContext<HTMLElement | null>(null);
