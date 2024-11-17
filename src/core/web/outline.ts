import { type Fiber } from 'react-reconciler';
import { getNearestHostFiber } from '../instrumentation/fiber';
import type { Render } from '../instrumentation/index';
import { ReactScanInternals } from '../index';
import { getLabelText } from '../utils';
import { isOutlineUnstable, throttle } from './utils';
import { log } from './log';

export interface PendingOutline {
  rect: DOMRect;
  domNode: HTMLElement;
  renders: Render[];
}

export interface ActiveOutline {
  outline: PendingOutline;
  alpha: number;
  frame: number;
  totalFrames: number;
  resolve: () => void;
  text: string | null;
}

export interface PaintedOutline {
  alpha: number;
  outline: PendingOutline;
  text: string | null;
}

export const MONO_FONT =
  'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace';
export const PURPLE_RGB = '115,97,230';

export const getOutlineKey = (outline: PendingOutline): string => {
  return `${outline.rect.top}-${outline.rect.left}-${outline.rect.width}-${outline.rect.height}`;
};

export const getRect = (domNode: HTMLElement): DOMRect | null => {
  const style = window.getComputedStyle(domNode);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return null;
  }

  const rect = domNode.getBoundingClientRect();
  const isVisible =
    rect.top >= 0 ||
    rect.left >= 0 ||
    rect.bottom <= window.innerHeight ||
    rect.right <= window.innerWidth;

  if (!isVisible) return null;

  if (!rect.height || !rect.width) return null;

  return rect;
};

export const getOutline = (
  fiber: Fiber,
  render: Render,
): PendingOutline | null => {
  const domFiber = getNearestHostFiber(fiber);
  if (!domFiber) return null;

  const domNode = domFiber.stateNode;

  if (!(domNode instanceof HTMLElement)) return null;

  let shouldIgnore = false;

  let currentDomNode: HTMLElement | null = domNode;
  while (currentDomNode) {
    if (currentDomNode.hasAttribute('data-react-scan-ignore')) {
      shouldIgnore = true;
      break;
    }
    currentDomNode = currentDomNode.parentElement;
  }

  if (shouldIgnore) return null;

  const rect = getRect(domNode);
  if (!rect) return null;

  return {
    rect,
    domNode,
    renders: [render],
  };
};

export const mergeOutlines = (outlines: PendingOutline[]) => {
  const mergedOutlines = new Map<string, PendingOutline>();
  for (let i = 0, len = outlines.length; i < len; i++) {
    const outline = outlines[i];
    const key = getOutlineKey(outline);
    const existingOutline = mergedOutlines.get(key);

    if (!existingOutline) {
      mergedOutlines.set(key, outline);
      continue;
    }
    existingOutline.renders.push(...outline.renders);
  }
  return Array.from(mergedOutlines.values());
};

export const recalcOutlines = throttle(() => {
  const { scheduledOutlines, activeOutlines } = ReactScanInternals;
  for (let i = scheduledOutlines.length - 1; i >= 0; i--) {
    const outline = scheduledOutlines[i];
    const rect = getRect(outline.domNode);
    if (!rect) {
      scheduledOutlines.splice(i, 1);
      continue;
    }
    outline.rect = rect;
  }
  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const { outline } = activeOutlines[i];
    const rect = getRect(outline.domNode);
    if (!rect) {
      activeOutlines.splice(i, 1);
      continue;
    }
    outline.rect = rect;
  }
}, 16); // 1 frame

export const flushOutlines = (
  ctx: CanvasRenderingContext2D,
  previousOutlines: Map<string, PendingOutline> = new Map(),
  status: HTMLElement | null = null,
) => {
  if (!ReactScanInternals.scheduledOutlines.length) {
    return;
  }

  const firstOutlines = ReactScanInternals.scheduledOutlines;
  ReactScanInternals.scheduledOutlines = [];

  requestAnimationFrame(() => {
    void (async () => {
      const secondOutlines = ReactScanInternals.scheduledOutlines;
      ReactScanInternals.scheduledOutlines = [];
      const mergedOutlines = secondOutlines
        ? mergeOutlines([...firstOutlines, ...secondOutlines])
        : firstOutlines;

      const newPreviousOutlines = new Map<string, PendingOutline>();

      if (status) {
        let totalCount = 0;
        let totalTime = 0;

        for (let i = 0, len = mergedOutlines.length; i < len; i++) {
          const outline = mergedOutlines[i];
          for (let j = 0, lenRenders = outline.renders.length; j < lenRenders; j++) {
            const render = outline.renders[j];
            totalTime += render.time;
            totalCount += render.count;
          }
        }

        let text = `×${totalCount}`;
        if (totalTime > 0) text += ` (${totalTime.toFixed(2)}ms)`;

        const statusText = status.querySelector(
          '#react-scan-status-text',
        ) as HTMLSpanElement | null;
        if (statusText) {
          statusText.textContent = `${text} · react-scan`;
        }
      }

      await Promise.all(
        mergedOutlines.map(async (outline) => {
          const key = getOutlineKey(outline);

          if (ReactScanInternals.selectedArea) {
            const { x, y, width, height } = ReactScanInternals.selectedArea;
            const selectedAreaLeft = x;
            const selectedAreaTop = y;
            const selectedAreaRight = x + width;
            const selectedAreaBottom = y + height;

            const rect = outline.rect;
            const rectLeft = rect.left + window.scrollX;
            const rectTop = rect.top + window.scrollY;
            const rectRight = rectLeft + rect.width;
            const rectBottom = rectTop + rect.height;

            const isCompletelyWithinSelectedArea =
              rectLeft >= selectedAreaLeft &&
              rectRight <= selectedAreaRight &&
              rectTop >= selectedAreaTop &&
              rectBottom <= selectedAreaBottom;

            if (!isCompletelyWithinSelectedArea) {
              return;
            }
          }

          if (previousOutlines.has(key)) {
            return;
          }
          await paintOutline(ctx, outline);
          newPreviousOutlines.set(key, outline);
        }),
      );
      if (ReactScanInternals.scheduledOutlines.length) {
        flushOutlines(ctx, newPreviousOutlines, status);
      }
    })();
  });
};

let animationFrameId: number | null = null;

export const paintOutline = (
  ctx: CanvasRenderingContext2D,
  outline: PendingOutline,
) => {
  return new Promise<void>((resolve) => {
    const unstable = isOutlineUnstable(outline);

    const totalFrames = unstable ? 30 : 10;
    const frame = 0;
    const alpha = 0.8;

    const text: string | null = getLabelText(outline.renders);

    const { options } = ReactScanInternals;
    if (options.log) {
      for (let i = 0, len = outline.renders.length; i < len; i++) {
        const render = outline.renders[i];
        log(render);
      }
    }

    ReactScanInternals.activeOutlines.push({
      outline,
      alpha,
      frame,
      totalFrames,
      resolve,
      text,
    });

    if (!animationFrameId) {
      fadeOutOutline(ctx);
    }
  });
};

export const fadeOutOutline = (ctx: CanvasRenderingContext2D) => {
  const { activeOutlines } = ReactScanInternals;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const combinedPath = new Path2D();

  let maxStrokeAlpha = 0;
  let maxFillAlpha = 0;

  const pendingLabeledOutlines: PaintedOutline[] = [];

  for (let i = ReactScanInternals.activeOutlines.length - 1; i >= 0; i--) {
    const animation = ReactScanInternals.activeOutlines[i];
    const { outline, frame, totalFrames } = animation;
    const { rect } = outline;
    const unstable = isOutlineUnstable(outline);

    const alphaScalar = unstable ? 0.8 : 0.2;

    animation.alpha = alphaScalar * (1 - frame / totalFrames);

    maxStrokeAlpha = Math.max(maxStrokeAlpha, animation.alpha);
    maxFillAlpha = Math.max(maxFillAlpha, animation.alpha * 0.1);

    combinedPath.rect(rect.x, rect.y, rect.width, rect.height);

    if (unstable) {
      pendingLabeledOutlines.push({
        alpha: animation.alpha,
        outline,
        text: animation.text,
      });
    }

    animation.frame++;

    if (animation.frame > animation.totalFrames) {
      activeOutlines.splice(i, 1);
      animation.resolve();
    }
  }

  ctx.save();

  ctx.strokeStyle = `rgba(${PURPLE_RGB}, ${maxStrokeAlpha})`;
  ctx.lineWidth = 1;
  ctx.fillStyle = `rgba(${PURPLE_RGB}, ${maxFillAlpha})`;

  ctx.stroke(combinedPath);
  ctx.fill(combinedPath);

  ctx.restore();

  for (let i = 0, len = pendingLabeledOutlines.length; i < len; i++) {
    const { alpha, outline, text } = pendingLabeledOutlines[i];
    const { rect } = outline;
    ctx.save();

    if (text) {
      ctx.font = `10px ${MONO_FONT}`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 10;

      const labelX: number = rect.x;
      const labelY: number = rect.y - textHeight - 4;

      ctx.fillStyle = `rgba(${PURPLE_RGB},${alpha})`;
      ctx.fillRect(labelX, labelY, textWidth + 4, textHeight + 4);

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(text, labelX + 2, labelY + textHeight);
    }

    ctx.restore();
  }

  if (activeOutlines.length) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  } else {
    animationFrameId = null;
  }
};
