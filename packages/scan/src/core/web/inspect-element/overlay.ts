import type { Fiber } from 'react-reconciler';
import { getDisplayName } from 'bippy';
import { ReactScanInternals, Store } from '../..';
import { getCompositeComponentFromElement } from './utils';

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

interface PerformanceStats {
  count: number;
  time: number;
}

let currentRect: Rect | null = null;
// eslint-disable-next-line import/no-mutable-exports
export let currentLockIconRect: LockIconRect | null = null;
export const OVERLAY_DPR: number =
  typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
let animationFrameId: number | null = null;

const linearInterpolation = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

export const drawHoverOverlay = (
  overlayElement: HTMLElement | null,
  canvas: HTMLCanvasElement | null,
  ctx: CanvasRenderingContext2D | null,
  kind: 'locked' | 'inspecting',
) => {
  if (!overlayElement || !canvas || !ctx) {
    return;
  }

  const { parentCompositeFiber, targetRect } = getCompositeComponentFromElement(overlayElement);

  if (!parentCompositeFiber || !targetRect) {
    return;
  }

  const reportDataFiber =
    Store.reportData.get(parentCompositeFiber) ??
    (parentCompositeFiber.alternate
      ? Store.reportData.get(parentCompositeFiber.alternate)
      : null);

  const stats: PerformanceStats = {
    count: reportDataFiber?.count ?? 0,
    time: reportDataFiber?.time ?? 0,
  };

  ctx.save();

  if (!currentRect) {
    drawRect(targetRect, canvas, ctx, kind, stats, parentCompositeFiber);
    currentRect = targetRect;
  } else {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }

    const animate = () => {
      const t =
        ReactScanInternals.options.value.animationSpeed === 'fast'
          ? 0.51
          : ReactScanInternals.options.value.animationSpeed === 'slow'
            ? 0.1
            : 0;
      currentRect = {
        left: linearInterpolation(currentRect!.left, targetRect.left, t),
        top: linearInterpolation(currentRect!.top, targetRect.top, t),
        width: linearInterpolation(currentRect!.width, targetRect.width, t),
        height: linearInterpolation(currentRect!.height, targetRect.height, t),
      };

      drawRect(currentRect, canvas, ctx, kind, stats, parentCompositeFiber);

      const stillMoving =
        Math.abs(currentRect.left - targetRect.left) > 0.1 ||
        Math.abs(currentRect.top - targetRect.top) > 0.1 ||
        Math.abs(currentRect.width - targetRect.width) > 0.1 ||
        Math.abs(currentRect.height - targetRect.height) > 0.1;

      if (stillMoving) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        currentRect = targetRect;
        animationFrameId = null;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
  }

  ctx.restore();
};

export const updateCanvasSize = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) => {
  if (!canvas) return;
  canvas.width = Math.floor(window.innerWidth * OVERLAY_DPR);
  canvas.height = Math.floor(window.innerHeight * OVERLAY_DPR);

  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(OVERLAY_DPR, OVERLAY_DPR);
  }
};

export const drawLockIcon = (
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

  // Shackle
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

  // Body
  const bodyWidth = size * 0.8;
  const bodyHeight = size * 0.5;
  const bodyX = x + (size - bodyWidth) / 2;
  const bodyY = y + shackleHeight / 2;

  ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

  ctx.restore();
};

export const drawStatsPill = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  stats: PerformanceStats,
  kind: 'locked' | 'inspecting',
  fiber: Fiber | null,
) => {
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
  const pillWidth =
    textWidth + pillPadding * 2 + lockIconSize + lockIconPadding;

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
    currentLockIconRect = {
      x: lockX,
      y: lockY,
      width: lockIconSize,
      height: lockIconSize,
    };
  } else {
    currentLockIconRect = null;
  }

  ctx.fillStyle = 'white';
  ctx.textBaseline = 'middle';
  const textX =
    pillX +
    pillPadding +
    (kind === 'locked' ? lockIconSize + lockIconPadding : 0);
  ctx.fillText(text, textX, pillY + pillHeight / 2);
  ctx.restore();
};

const drawRect = (
  rect: Rect,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  kind: 'locked' | 'inspecting',
  stats: PerformanceStats,
  fiber: Fiber | null,
) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (kind === 'locked') {
    ctx.strokeStyle = 'rgba(142, 97, 227, 0.5)';
    ctx.fillStyle = 'rgba(173, 97, 230, 0.10)';
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = 'rgba(142, 97, 227, 0.5)';
    ctx.fillStyle = 'rgba(173, 97, 230, 0.10)';
    ctx.setLineDash([4]);
  }

  ctx.lineWidth = 1;
  ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

  drawStatsPill(ctx, rect, stats, kind, fiber);
};
