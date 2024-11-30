import { type Fiber } from 'react-reconciler';
import { getNearestHostFiber } from '../instrumentation/fiber';
import type { Render } from '../instrumentation/index';
import { type Measurement, ReactScanInternals } from '../index';
import { getLabelText } from '../utils';
import { isOutlineUnstable, throttle } from './utils';

//todo make more unique
export const genId = () => {
  const timeStamp: number = performance.now();
  const randomNum: number = Math.floor(Math.random() * 1000);
  return `${timeStamp}-${randomNum}`;
};

export const assertDom = (measurement: Measurement) => {
  if (measurement.kind !== 'dom') {
    throw new Error('dom invariant');
  }
  return measurement;
};
export interface PendingOutline {
  fiber: Fiber; // todo, weak ref not always available
  latestMeasurement: Measurement;
  renders: Render[];
}

export interface ActiveOutline {
  outline: PendingOutline;
  id: string;
  alpha: number;
  frame: number;
  totalFrames: number;
  resolve: () => void;
  text: string | null;
  updatedAt: number;
}

export interface OutlineLabel {
  alpha: number;
  outline: PendingOutline;
  text: string | null;
  color: { r: number; g: number; b: number };
}

export const MONO_FONT =
  'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace';
const DEFAULT_THROTTLE_TIME = 32; // 2 frames

const START_COLOR = { r: 115, g: 97, b: 230 };
const END_COLOR = { r: 185, g: 49, b: 115 };

export const getOutlineKey = (rect: DOMRect): string => {
  return `${rect.top}-${rect.left}-${rect.width}-${rect.height}`;
};

const rectCache = new Map<HTMLElement, { rect: DOMRect; timestamp: number }>();

export const getRect = (domNode: HTMLElement): DOMRect | null => {
  const now = performance.now();
  const cached = rectCache.get(domNode);

  if (cached && now - cached.timestamp < DEFAULT_THROTTLE_TIME) {
    return cached.rect;
  }

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
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth;

  if (!isVisible || !rect.width || !rect.height) {
    return null;
  }

  rectCache.set(domNode, { rect, timestamp: now });

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
    fiber: fiber,
    renders: [render],
    latestMeasurement: {
      kind: 'dom',
      value: rect,
    },
  };
};

export const mergeOutlines = (outlines: PendingOutline[]) => {
  const mergedOutlines = new Map<string, PendingOutline>();
  for (let i = 0, len = outlines.length; i < len; i++) {
    const outline = outlines[i];
    const key = getOutlineKey(assertDom(outline.latestMeasurement).value);
    const existingOutline = mergedOutlines.get(key);

    if (!existingOutline) {
      mergedOutlines.set(key, outline);
      continue;
    }
    existingOutline.renders.push(...outline.renders);
  }
  return Array.from(mergedOutlines.values());
};

export const getDomNode = (outline: PendingOutline) => {
  const fiber = outline.fiber;
  // if (!fiber) {
  //   return;
  // }
  const domNode = fiber.stateNode;
  if (!(domNode instanceof HTMLElement)) return null;
  return domNode;
};
export const recalcOutlines = throttle(() => {
  const { scheduledOutlines, activeOutlines } = ReactScanInternals;

  for (let i = scheduledOutlines.length - 1; i >= 0; i--) {
    const outline = scheduledOutlines[i];
    const domNode = getDomNode(outline);
    if (!domNode) continue;
    const rect = getRect(domNode);
    if (!rect) {
      scheduledOutlines.splice(i, 1);
      continue;
    }
    outline.latestMeasurement.value = rect;
  }

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    const { outline } = activeOutline;
    const domNode = getDomNode(outline);
    if (!domNode) continue;
    const rect = getRect(domNode);
    if (!rect) {
      activeOutlines.splice(i, 1);
      continue;
    }
    outline.latestMeasurement.value = rect;
  }
}, DEFAULT_THROTTLE_TIME);

export const flushOutlines = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  previousOutlines: Map<string, PendingOutline> = new Map(),
) => {
  if (!ReactScanInternals.scheduledOutlines.length) {
    return;
  }

  const scheduledOutlines = ReactScanInternals.scheduledOutlines;
  ReactScanInternals.scheduledOutlines = [];

  recalcOutlines();

  const newPreviousOutlines = new Map<string, PendingOutline>();

  void paintOutlines(
    ctx,
    scheduledOutlines.filter((outline) => {
      const key = getOutlineKey(assertDom(outline.latestMeasurement).value);
      if (previousOutlines.has(key)) {
        return false;
      }
      newPreviousOutlines.set(key, outline);
      return true;
    }),
  );

  if (ReactScanInternals.scheduledOutlines.length) {
    requestAnimationFrame(() => {
      flushOutlines(ctx, newPreviousOutlines);
    });
  }
};

let animationFrameId: number | null = null;

export const fadeOutOutline = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  const { activeOutlines, options } = ReactScanInternals;

  const dpi = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width / dpi, ctx.canvas.height / dpi);

  const groupedOutlines = new Map<string, ActiveOutline>();

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    const { outline } = activeOutline;

    const rect = assertDom(outline.latestMeasurement).value;

    const key = `${rect.x}-${rect.y}`;

    if (!groupedOutlines.has(key)) {
      groupedOutlines.set(key, activeOutline);
    } else {
      const group = groupedOutlines.get(key)!;

      if (group.outline.renders !== outline.renders) {
        group.outline.renders = [...group.outline.renders, ...outline.renders];
      }

      group.alpha = Math.max(group.alpha, activeOutline.alpha);
      group.frame = Math.min(group.frame, activeOutline.frame);
      group.totalFrames = Math.max(
        group.totalFrames,
        activeOutline.totalFrames,
      );

      activeOutlines.splice(i, 1);
    }

    activeOutline.frame++;

    const progress = activeOutline.frame / activeOutline.totalFrames;
    const isImportant =
      isOutlineUnstable(activeOutline.outline) || options.alwaysShowLabels;

    const alphaScalar = isImportant ? 0.8 : 0.2;
    activeOutline.alpha = alphaScalar * (1 - progress);

    if (activeOutline.frame >= activeOutline.totalFrames) {
      activeOutline.resolve();
      activeOutlines.splice(i, 1);
    }
  }

  const pendingLabeledOutlines: OutlineLabel[] = [];

  ctx.save();

  const renderCountThreshold = options.renderCountThreshold ?? 0;
  for (const activeOutline of Array.from(groupedOutlines.values())) {
    const { outline, frame, totalFrames } = activeOutline;

    let count = 0;
    let time = 0;
    for (let i = 0, len = outline.renders.length; i < len; i++) {
      const render = outline.renders[i];
      count += render.count;
      time += render.time;
    }

    const maxRenders = ReactScanInternals.options.maxRenders ?? 100;
    const t = Math.min((count * (time || 1)) / maxRenders, 1);

    const r = Math.round(START_COLOR.r + t * (END_COLOR.r - START_COLOR.r));
    const g = Math.round(START_COLOR.g + t * (END_COLOR.g - START_COLOR.g));
    const b = Math.round(START_COLOR.b + t * (END_COLOR.b - START_COLOR.b));

    const color = { r, g, b };

    // const _totalTime = getMainThreadTaskTime();
    // if (totalTime) {
    //   console.log(totalTime);
    //   let divideBy = 1;
    //   for (let i = 0; i < Math.floor(totalTime / 50); i++) {
    //     divideBy += 0.1;
    //   }
    //   activeOutline.totalFrames = Math.floor(
    //     Math.max(1, totalFrames / divideBy),
    //   );
    // }
    const rect = assertDom(outline.latestMeasurement).value;
    const unstable = isOutlineUnstable(outline);

    if (renderCountThreshold > 0) {
      let count = 0;
      for (let i = 0, len = outline.renders.length; i < len; i++) {
        const render = outline.renders[i];
        count += render.count;
      }
      if (count < renderCountThreshold) {
        continue;
      }
    }

    const isImportant = unstable || options.alwaysShowLabels;

    const alphaScalar = isImportant ? 0.8 : 0.2;
    activeOutline.alpha = alphaScalar * (1 - frame / totalFrames);

    const alpha = activeOutline.alpha;
    const fillAlpha = isImportant ? activeOutline.alpha * 0.1 : 0;

    const rgb = `${color.r},${color.g},${color.b}`;
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 1;
    ctx.fillStyle = `rgba(${rgb},${fillAlpha})`;

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.stroke();
    ctx.fill();

    if (isImportant) {
      const text = getLabelText(outline.renders, 'dom');
      pendingLabeledOutlines.push({
        alpha,
        outline,
        text,
        color,
      });
    }
  }

  ctx.restore();

  for (let i = 0, len = pendingLabeledOutlines.length; i < len; i++) {
    const { alpha, outline, text, color } = pendingLabeledOutlines[i];
    const rect = assertDom(outline.latestMeasurement).value;
    ctx.save();

    if (text) {
      ctx.font = `11px ${MONO_FONT}`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 11;

      const labelX: number = rect.x;
      const labelY: number = rect.y - textHeight - 4;

      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
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
async function paintOutlines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  outlines: PendingOutline[],
): Promise<void> {
  return new Promise<void>((resolve) => {
    const { options } = ReactScanInternals;
    const totalFrames = options.alwaysShowLabels ? 60 : 30;
    const alpha = 0.8;

    options.onPaintStart?.(outlines);

    const newActiveOutlines = outlines.map((outline) => {
      const renders = outline.renders;

      const frame = 0;

      return {
        outline,
        alpha,
        frame,
        totalFrames,
        resolve,
        text: getLabelText(renders, 'dom'),
        updatedAt: performance.now(),
        id: genId(),
      };
    });

    ReactScanInternals.activeOutlines.push(...newActiveOutlines);
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
    }
  });
}
