import { useRef, useEffect } from 'preact/hooks';
import { getDisplayName } from 'bippy';
import type { Fiber } from 'react-reconciler';
import { cn, throttle } from '~web/utils/helpers';
import { Store, ReactScanInternals } from '~core/index';
import {
  getCompositeComponentFromElement,
  findComponentDOMNode,
  type States,
} from '~web/components/inspector/utils';

type DrawKind = 'locked' | 'inspecting';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LockIconRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ANIMATION_CONFIG = {
  frameInterval: 1000 / 60,
  speeds: {
    fast: 0.51,
    slow: 0.1,
    off: 0,
  }
} as const;

export const OVERLAY_DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

export const currentLockIconRect: LockIconRect | null = null;

export const ScanOverlay = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const refEventCatcher = useRef<HTMLDivElement>(null);
  const refCurrentRect = useRef<Rect | null>(null);
  const refCurrentLockIconRect = useRef<LockIconRect | null>(null);
  const refLastHoveredElement = useRef<HTMLElement | null>(null);
  const refRafId = useRef<number>(0);
  const refTimeout = useRef<TTimer>();
  const refCleanupMap = useRef(new Map<States['kind'] | 'fade-out', () => void>());
  const refIsFadingOut = useRef(false);
  const refLastFrameTime = useRef<number>(0);

  const linearInterpolation = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
  };

  const drawLockIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ) => {
    ctx.save();
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.lineWidth = 1.5;

    const shackleWidth = size * 0.6;
    const shackleHeight = size * 0.5;
    const shackleX = x + (size - shackleWidth) / 2;
    const shackleY = y;

    ctx.beginPath();
    ctx.arc(
      shackleX + shackleWidth / 2,
      shackleY + shackleHeight / 2,
      shackleWidth / 2,
      Math.PI,
      0,
      false,
    );
    ctx.stroke();

    const bodyWidth = size * 0.8;
    const bodyHeight = size * 0.5;
    const bodyX = x + (size - bodyWidth) / 2;
    const bodyY = y + shackleHeight / 2;

    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    ctx.restore();
  };

  const drawStatsPill = (
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    kind: 'locked' | 'inspecting',
    fiber: Fiber | null,
  ) => {
    if (!fiber) return;

    const reportDataFiber = Store.reportData.get(fiber) ??
      (fiber.alternate ? Store.reportData.get(fiber.alternate) : null);

    const stats = {
      count: reportDataFiber?.count ?? 0,
      time: reportDataFiber?.time ?? 0,
    };

    const pillHeight = 24;
    const pillPadding = 8;
    const componentName = getDisplayName(fiber?.type) ?? 'Unknown';
    let text = componentName;
    if (stats.count) {
      text += ` • ×${stats.count}`;
      if (stats.time) {
        text += ` (${stats.time.toFixed(1)}ms)`;
      }
    }

    ctx.save();
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const lockIconSize = kind === 'locked' ? 14 : 0;
    const lockIconPadding = kind === 'locked' ? 6 : 0;
    const pillWidth = textWidth + pillPadding * 2 + lockIconSize + lockIconPadding;

    const pillX = rect.left;
    const pillY = rect.top - pillHeight - 4;

    ctx.fillStyle = 'rgb(37, 37, 38, .75)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
    ctx.fill();

    if (kind === 'locked') {
      const lockX = pillX + pillPadding;
      const lockY = pillY + (pillHeight - lockIconSize) / 2 + 2;
      drawLockIcon(ctx, lockX, lockY, lockIconSize);
      refCurrentLockIconRect.current = {
        x: lockX,
        y: lockY,
        width: lockIconSize,
        height: lockIconSize,
      };
    } else {
      refCurrentLockIconRect.current = null;
    }

    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    const textX = pillX + pillPadding + (kind === 'locked' ? lockIconSize + lockIconPadding : 0);
    ctx.fillText(text, textX, pillY + pillHeight / 2);
    ctx.restore();
  };

  const drawRect = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    kind: DrawKind,
    fiber: Fiber | null,
  ) => {
    if (!refCurrentRect.current) return;
    const rect = refCurrentRect.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(142, 97, 227, 0.5)';
    ctx.fillStyle = 'rgba(173, 97, 230, 0.10)';

    if (kind === 'locked') {
      ctx.setLineDash([]);
    } else {
      ctx.setLineDash([4]);
    }

    ctx.lineWidth = 1;
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    drawStatsPill(ctx, rect, kind, fiber);
  };

  const animate = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    targetRect: Rect,
    kind: DrawKind,
    parentCompositeFiber: Fiber,
    onComplete?: () => void,
  ) => {
    const speed = ReactScanInternals.options.value.animationSpeed as keyof typeof ANIMATION_CONFIG.speeds;
    const t = ANIMATION_CONFIG.speeds[speed] ?? ANIMATION_CONFIG.speeds.off;

    const animationFrame = (timestamp: number) => {
      if (timestamp - refLastFrameTime.current < ANIMATION_CONFIG.frameInterval) {
        refRafId.current = requestAnimationFrame(animationFrame);
        return;
      }
      refLastFrameTime.current = timestamp;

      if (!refCurrentRect.current) {
        cancelAnimationFrame(refRafId.current);
        return;
      }

      refCurrentRect.current = {
        left: linearInterpolation(refCurrentRect.current.left, targetRect.left, t),
        top: linearInterpolation(refCurrentRect.current.top, targetRect.top, t),
        width: linearInterpolation(refCurrentRect.current.width, targetRect.width, t),
        height: linearInterpolation(refCurrentRect.current.height, targetRect.height, t),
      };

      drawRect(canvas, ctx, kind, parentCompositeFiber);

      const stillMoving =
        Math.abs(refCurrentRect.current.left - targetRect.left) > 0.1 ||
        Math.abs(refCurrentRect.current.top - targetRect.top) > 0.1 ||
        Math.abs(refCurrentRect.current.width - targetRect.width) > 0.1 ||
        Math.abs(refCurrentRect.current.height - targetRect.height) > 0.1;

      if (stillMoving) {
        refRafId.current = requestAnimationFrame(animationFrame);
      } else {
        refCurrentRect.current = targetRect;
        drawRect(canvas, ctx, kind, parentCompositeFiber);
        cancelAnimationFrame(refRafId.current);
        ctx.restore();
        onComplete?.();
      }
    };

    cancelAnimationFrame(refRafId.current);
    clearTimeout(refTimeout.current);

    refRafId.current = requestAnimationFrame(animationFrame);

    refTimeout.current = setTimeout(() => {
      cancelAnimationFrame(refRafId.current);
      refCurrentRect.current = targetRect;
      drawRect(canvas, ctx, kind, parentCompositeFiber);
      ctx.restore();
      onComplete?.();
    }, 1000);
  };

  const setupOverlayAnimation = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    targetRect: Rect,
    kind: DrawKind,
    parentCompositeFiber: Fiber,
  ) => {
    ctx.save();

    if (!refCurrentRect.current) {
      refCurrentRect.current = targetRect;
      drawRect(canvas, ctx, kind, parentCompositeFiber);
      ctx.restore();
      return;
    }

    animate(canvas, ctx, targetRect, kind, parentCompositeFiber);
  };

  const drawHoverOverlay = (
    overlayElement: HTMLElement | null,
    canvas: HTMLCanvasElement | null,
    ctx: CanvasRenderingContext2D | null,
    kind: DrawKind,
  ) => {
    if (!overlayElement || !canvas || !ctx) return;

    const { parentCompositeFiber, targetRect } = getCompositeComponentFromElement(overlayElement);
    if (!parentCompositeFiber || !targetRect) return;

    setupOverlayAnimation(canvas, ctx, targetRect, kind, parentCompositeFiber);
  };

  const unsubscribeAll = () => {
    refCleanupMap.current.forEach(cleanup => cleanup?.());
  };

  const cleanupCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    refCurrentRect.current = null;
    refCurrentLockIconRect.current = null;
    refLastHoveredElement.current = null;
    canvas.classList.remove('fade-in');
    refIsFadingOut.current = false;
  };

  const startFadeOut = (onComplete?: () => void) => {
    if (!refCanvas.current || refIsFadingOut.current) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (!refCanvas.current || e.propertyName !== 'opacity' || !refIsFadingOut.current) return;
      refCanvas.current.removeEventListener('transitionend', handleTransitionEnd);
      cleanupCanvas(refCanvas.current);
      onComplete?.();
    };

    const existingListener = refCleanupMap.current.get('fade-out');
    if (existingListener) {
      existingListener();
      refCleanupMap.current.delete('fade-out');
    }

    refCanvas.current.addEventListener('transitionend', handleTransitionEnd);
    refCleanupMap.current.set('fade-out', () => {
      refCanvas.current?.removeEventListener('transitionend', handleTransitionEnd);
    });

    refIsFadingOut.current = true;
    refCanvas.current.classList.remove('fade-in');
    refCanvas.current.classList.add('fade-out');
  };

  const startFadeIn = () => {
    if (!refCanvas.current) return;
    refCanvas.current.classList.remove('fade-out');
    refCanvas.current.classList.add('fade-in');
    refIsFadingOut.current = false;
  };

  const handleHoverableElement = (componentElement: HTMLElement) => {
    if (componentElement === refLastHoveredElement.current) return;

    startFadeIn();
    refLastHoveredElement.current = componentElement;
    Store.inspectState.value = {
      kind: 'inspecting',
      hoveredDomElement: componentElement,
    };
  };

  const handleNonHoverableArea = () => {
    if (!refCurrentRect.current || !refCanvas.current || refIsFadingOut.current) return;
    startFadeOut();
  };

  const handleMouseMove = throttle((e: MouseEvent) => {
    const state = Store.inspectState.peek();
    if (state.kind !== 'inspecting' || !refEventCatcher.current) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    clearTimeout(refTimeout.current);

    if (element && element !== refCanvas.current) {
      const { parentCompositeFiber } = getCompositeComponentFromElement(element as HTMLElement);
      if (parentCompositeFiber) {
        const componentElement = findComponentDOMNode(parentCompositeFiber);
        if (componentElement) {
          handleHoverableElement(componentElement);
          return;
        }
      }
    }

    handleNonHoverableArea();
  }, 32);

  const isClickInLockIcon = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const currentRect = refCurrentLockIconRect.current;
    if (!currentRect) return false;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const adjustedX = x / OVERLAY_DPR;
    const adjustedY = y / OVERLAY_DPR;

    return (
      adjustedX >= currentRect.x &&
      adjustedX <= currentRect.x + currentRect.width &&
      adjustedY >= currentRect.y &&
      adjustedY <= currentRect.y + currentRect.height
    );
  };

  const handleLockIconClick = (state: States) => {
    if (state.kind === 'focused') {
      Store.inspectState.value = {
        kind: 'inspecting',
        hoveredDomElement: state.focusedDomElement,
      };
    }
  };

  const handleElementClick = (e: MouseEvent) => {
    const element = refLastHoveredElement.current ?? document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(element as HTMLElement);
    if (!parentCompositeFiber) return;

    const componentElement = findComponentDOMNode(parentCompositeFiber);
    if (!componentElement) {
      refLastHoveredElement.current = null;
      Store.inspectState.value = {
        kind: 'inspect-off',
      };
      return;
    }

    Store.inspectState.value = {
      kind: 'focused',
      focusedDomElement: componentElement,
    };
  };

  const handleClick = (e: MouseEvent) => {
    const state = Store.inspectState.peek();
    const canvas = refCanvas.current;
    if (!canvas || !refEventCatcher.current) return;

    if (isClickInLockIcon(e, canvas)) {
      e.preventDefault();
      e.stopPropagation();
      handleLockIconClick(state);
      return;
    }

    if (state.kind === 'inspecting') {
      e.preventDefault();
      e.stopPropagation();
      handleElementClick(e);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const state = Store.inspectState.peek();
    const canvas = refCanvas.current;
    if (!canvas || e.key !== 'Escape') return;

    switch (state.kind) {
      case 'focused': {
        startFadeIn();
        refCurrentRect.current = null;
        refLastHoveredElement.current = state.focusedDomElement;
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: state.focusedDomElement,
        };
        break;
      }
      case 'inspecting': {
        startFadeOut(() => {
          Store.inspectState.value = {
            kind: 'inspect-off',
          };
        });
        break;
      }
    }
  };

  const handleStateChange = (
    state: States,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    refCleanupMap.current.get(state.kind)?.();

    if (refEventCatcher.current) {
      if (state.kind === 'inspecting') {
        refEventCatcher.current.style.pointerEvents = 'none';
      } else {
        refEventCatcher.current.style.removeProperty('pointer-events');
      }
    }

    if (refRafId.current) {
      cancelAnimationFrame(refRafId.current);
    }

    let unsubReport: (() => void) | undefined;

    switch (state.kind) {
      case 'inspect-off':
        return;

      case 'inspecting':
        drawHoverOverlay(state.hoveredDomElement, canvas, ctx, 'inspecting');
        break;

      case 'focused':
        if (!state.focusedDomElement) return;

        if (refLastHoveredElement.current !== state.focusedDomElement) {
          refLastHoveredElement.current = state.focusedDomElement;
        }

        drawHoverOverlay(state.focusedDomElement, canvas, ctx, 'locked');

        unsubReport = Store.lastReportTime.subscribe(() => {
          if (refRafId.current && refCurrentRect.current) {
            const { parentCompositeFiber } = getCompositeComponentFromElement(state.focusedDomElement);
            if (parentCompositeFiber) {
              drawHoverOverlay(state.focusedDomElement, canvas, ctx, 'locked');
            }
          }
        });

        if (unsubReport) {
          refCleanupMap.current.set(state.kind, unsubReport);
        }
        break;
    }
  };

  const updateCanvasSize = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * OVERLAY_DPR;
    canvas.height = rect.height * OVERLAY_DPR;
    ctx.scale(OVERLAY_DPR, OVERLAY_DPR);
    ctx.save();
  };

  const handleResizeOrScroll = () => {
    const state = Store.inspectState.peek();
    const canvas = refCanvas.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    cancelAnimationFrame(refRafId.current);
    clearTimeout(refTimeout.current);

    updateCanvasSize(canvas, ctx);
    refCurrentRect.current = null;

    if (state.kind === 'focused' && state.focusedDomElement) {
      drawHoverOverlay(state.focusedDomElement, canvas, ctx, 'locked');
    } else if (state.kind === 'inspecting' && state.hoveredDomElement) {
      drawHoverOverlay(state.hoveredDomElement, canvas, ctx, 'inspecting');
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    const state = Store.inspectState.peek();
    const canvas = refCanvas.current;
    if (!canvas) return;

    if (state.kind === 'inspecting' || isClickInLockIcon(e as unknown as MouseEvent, canvas)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  useEffect(() => {
    const canvas = refCanvas.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    updateCanvasSize(canvas, ctx);

    const unSubState = Store.inspectState.subscribe((state) => {
      handleStateChange(state, canvas, ctx);
    });

    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });
    window.addEventListener('resize', handleResizeOrScroll, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true, capture: true });
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeAll();
      unSubState();
      window.removeEventListener('scroll', handleResizeOrScroll);
      window.removeEventListener('resize', handleResizeOrScroll);
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);

      if (refRafId.current) {
        cancelAnimationFrame(refRafId.current);
      }
      clearTimeout(refTimeout.current);
    };
  }, []);

  return (
    <>
      <div
        ref={refEventCatcher}
        className={cn(
          'fixed inset-0 w-screen h-screen',
          'z-[214748366]',
          'pointer-events-none',
        )}
      />
      <canvas
        ref={refCanvas}
        className={cn(
          'react-scan-inspector-overlay',
          'fixed inset-0 w-screen h-screen',
          'pointer-events-none',
          'z-[214748367]',
        )}
      />
    </>
  );
};
