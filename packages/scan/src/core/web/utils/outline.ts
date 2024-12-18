import { getNearestHostFiber } from 'bippy';
import type { Fiber } from 'react-reconciler';
import { throttle } from '@web-utils/helpers';
import { type DrawingQueue, outlineWorker } from '@web-utils/outline-worker';
import { ReactScanInternals } from '../../index';
import { type Render, isElementInViewport } from '../../instrumentation';
import { getLabelText } from '../../utils';

export interface PendingOutline {
  rect: DOMRect;
  domNode: HTMLElement;
  renders: Array<Render>;
}

export interface ActiveOutline {
  outline: PendingOutline;
  alpha: number;
  frame: number;
  totalFrames: number;
  resolve: () => void;
  text: string | null;
}

export interface OutlineLabel {
  alpha: number;
  outline: PendingOutline;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  labelText: string;
  textWidth: number;
}

const DEFAULT_THROTTLE_TIME = 32; // 2 frames

const START_COLOR = { r: 115, g: 97, b: 230 };
const END_COLOR = { r: 185, g: 49, b: 115 };
const MONO_FONT =
  'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace';

export const getOutlineKey = (outline: PendingOutline): string => {
  return `${outline.rect.top}-${outline.rect.left}-${outline.rect.width}-${outline.rect.height}`;
};

let currentFrameId = 0;

function incrementFrameId() {
  currentFrameId++;
  requestAnimationFrame(incrementFrameId);
}

if (typeof window !== 'undefined') {
  incrementFrameId();
}

interface CachedRect {
  rect: DOMRect;
  frameId: number;
}

const rectCache = new Map<Element, CachedRect>();

export const getRect = (el: Element): DOMRect | null => {
  const cached = rectCache.get(el);

  if (cached && cached.frameId === currentFrameId) {
    return cached.rect;
  }

  const rect = el.getBoundingClientRect();
  if (!isElementInViewport(el, rect)) {
    return null;
  }

  rectCache.set(el, { rect, frameId: currentFrameId });

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

export const mergeOutlines = (outlines: Array<PendingOutline>) => {
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

  const domNodes = new Set<HTMLElement>();

  for (let i = scheduledOutlines.length - 1; i >= 0; i--) {
    const outline = scheduledOutlines[i];
    domNodes.add(outline.domNode);
  }

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    domNodes.add(activeOutline.outline.domNode);
  }

  const rectMap = new Map<HTMLElement, DOMRect | null>();
  domNodes.forEach((domNode) => {
    const rect = getRect(domNode);
    rectMap.set(domNode, rect);
  });

  for (let i = scheduledOutlines.length - 1; i >= 0; i--) {
    const outline = scheduledOutlines[i];
    const rect = rectMap.get(outline.domNode);
    if (!rect) {
      scheduledOutlines.splice(i, 1);
      continue;
    }
    outline.rect = rect;
  }

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    const rect = rectMap.get(activeOutline.outline.domNode);
    if (!rect) {
      activeOutlines.splice(i, 1);
      continue;
    }
    activeOutline.outline.rect = rect;
  }
}, DEFAULT_THROTTLE_TIME);

export const flushOutlines = (
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
    scheduledOutlines.filter((outline) => {
      const key = getOutlineKey(outline);
      if (previousOutlines.has(key)) {
        return false;
      }
      newPreviousOutlines.set(key, outline);
      return true;
    }),
  );

  if (ReactScanInternals.scheduledOutlines.length) {
    requestAnimationFrame(() => {
      flushOutlines(newPreviousOutlines);
    });
  }
};

let animationFrameId: number | null = null;

export const fadeOutOutline = () => {
  const { activeOutlines } = ReactScanInternals;
  const options = ReactScanInternals.options.value;

  const groupedOutlines = new Map<string, ActiveOutline>();

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    const { outline } = activeOutline;

    const { rect } = outline;

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

    const alphaScalar = 0.8;
    activeOutline.alpha = alphaScalar * (1 - progress);

    if (activeOutline.frame >= activeOutline.totalFrames) {
      activeOutline.resolve();
      activeOutlines.splice(i, 1);
    }
  }

  const pendingLabeledOutlines: Array<OutlineLabel> = [];

  const drawingQueue: Array<DrawingQueue> = [];

  const renderCountThreshold = options.renderCountThreshold ?? 0;
  for (const activeOutline of Array.from(groupedOutlines.values())) {
    const { outline, frame, totalFrames } = activeOutline;

    let totalTime = 0;
    let totalCount = 0;
    let totalFps = 0;
    for (let i = 0, len = outline.renders.length; i < len; i++) {
      const render = outline.renders[i];
      totalTime += render.time ?? 0;
      totalCount += render.count;
      totalFps += render.fps;
    }

    const THRESHOLD_FPS = 60;
    const averageScore = Math.max(
      (THRESHOLD_FPS -
        Math.min(totalFps / outline.renders.length, THRESHOLD_FPS)) /
        THRESHOLD_FPS,
      totalTime / totalCount / 16, // long task
    );

    const t = Math.min(averageScore, 1);

    const r = Math.round(START_COLOR.r + t * (END_COLOR.r - START_COLOR.r));
    const g = Math.round(START_COLOR.g + t * (END_COLOR.g - START_COLOR.g));
    const b = Math.round(START_COLOR.b + t * (END_COLOR.b - START_COLOR.b));

    let color = { r, g, b };

    const phases = new Set();

    const reasons: Array<'unstable' | 'commit' | 'unnecessary'> = [];

    let didCommit = false;
    let isUnstable = false;
    let isUnnecessary = false;
    for (let i = 0, len = outline.renders.length; i < len; i++) {
      const render = outline.renders[i];
      phases.add(render.phase);
      if (render.didCommit) {
        didCommit = true;
      }
      for (let j = 0, len2 = render.changes?.length ?? 0; j < len2; j++) {
        const change = render.changes![j];
        if (change.unstable) {
          isUnstable = true;
        }
      }
      if (render.unnecessary) {
        isUnnecessary = true;
      }
    }
    if (didCommit) {
      reasons.push('commit');
    }
    if (isUnstable) {
      reasons.push('unstable');
    }
    if (isUnnecessary) {
      reasons.push('unnecessary');
      if (reasons.length === 1) {
        color = { r: 128, g: 128, b: 128 };
      }
    }

    const { rect } = outline;

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

    const alphaScalar = 0.8;
    activeOutline.alpha = alphaScalar * (1 - frame / totalFrames);

    const alpha = activeOutline.alpha;
    const fillAlpha = activeOutline.alpha * 0.1;

    drawingQueue.push({
      rect,
      color,
      alpha,
      fillAlpha,
    });

    const labelText = getLabelText(outline.renders) ?? '';
    if (
      reasons.length &&
      labelText &&
      !(phases.has('mount') && phases.size === 1)
    ) {
      pendingLabeledOutlines.push({
        alpha,
        outline,
        color,
        reasons,
        labelText,
        textWidth: measureTextCached(labelText).width,
      });
    }
  }

  const mergedLabels = mergeOverlappingLabels(pendingLabeledOutlines);

  outlineWorker.call({
    type: 'fade-out-outline',
    payload: {
      dpi: window.devicePixelRatio,
      drawingQueue,
      mergedLabels: mergedLabels.map((v) => ({
        alpha: v.alpha,
        rect: v.outline.rect,
        color: v.color,
        reasons: v.reasons,
        labelText: `${getLabelText(v.outline.renders)}`,
      })),
    },
  });

  if (activeOutlines.length) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline());
  } else {
    animationFrameId = null;
  }
};
async function paintOutlines(outlines: Array<PendingOutline>): Promise<void> {
  return new Promise<void>((resolve) => {
    const { options } = ReactScanInternals;
    const totalFrames = options.value.alwaysShowLabels ? 60 : 30;
    const alpha = 0.8;

    options.value.onPaintStart?.(outlines);

    const newActiveOutlines = outlines.map((outline) => {
      const renders = outline.renders;

      const frame = 0;

      return {
        outline,
        alpha,
        frame,
        totalFrames,
        resolve,
        text: getLabelText(renders),
      };
    });

    ReactScanInternals.activeOutlines.push(...newActiveOutlines);
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(() => fadeOutOutline());
    }
  });
}

// FIXME: slow
export const mergeOverlappingLabels = (
  labels: Array<OutlineLabel>,
): Array<OutlineLabel> => {
  // Precompute labelRects
  const labelRects = labels.map((label) => ({
    label,
    rect: getLabelRect(label),
  }));

  // Sort labels by x-coordinate
  labelRects.sort((a, b) => a.rect.x - b.rect.x);

  const mergedLabels: Array<OutlineLabel> = [];

  for (let i = 0; i < labelRects.length; i++) {
    const { label, rect } = labelRects[i];
    let isMerged = false;

    // Only compare with labels that might overlap
    for (
      let j = i + 1;
      j < labelRects.length && labelRects[j].rect.x <= rect.x + rect.width;
      j++
    ) {
      const nextLabel = labelRects[j].label;
      const nextRect = labelRects[j].rect;

      const overlapArea = getOverlapArea(rect, nextRect);

      if (overlapArea > 0) {
        // Merge labels
        const combinedOutline: PendingOutline = {
          rect: getOutermostOutline(nextLabel.outline, label.outline).rect,
          domNode: getOutermostOutline(nextLabel.outline, label.outline)
            .domNode,
          renders: [...label.outline.renders, ...nextLabel.outline.renders],
        };

        nextLabel.alpha = Math.max(nextLabel.alpha, label.alpha);
        nextLabel.outline = combinedOutline;
        nextLabel.reasons = Array.from(
          new Set(nextLabel.reasons.concat(label.reasons)),
        );

        isMerged = true;
        break;
      }
    }

    if (!isMerged) {
      mergedLabels.push(label);
    }
  }

  return mergedLabels;
};

export const getLabelRect = (label: OutlineLabel): DOMRect => {
  const { rect } = label.outline;
  const textHeight = 11;

  const labelX = rect.x;
  const labelY = rect.y - textHeight - 4;

  return new DOMRect(labelX, labelY, label.textWidth + 4, textHeight + 4);
};

const textMeasurementCache = new Map<string, TextMetrics>();

export const measureTextCached = (text: string): TextMetrics => {
  if (textMeasurementCache.has(text)) {
    return textMeasurementCache.get(text)!;
  }
  const dpi = window.devicePixelRatio || 1;
  const canvas = new OffscreenCanvas(
    dpi * window.innerWidth,
    dpi * window.innerHeight,
  );
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('unreachable');
  }
  ctx.font = `11px ${MONO_FONT}`;
  const metrics = ctx.measureText(text);
  textMeasurementCache.set(text, metrics);
  return metrics;
};

export const getOverlapArea = (rect1: DOMRect, rect2: DOMRect): number => {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
  );
  return xOverlap * yOverlap;
};

export const getOutermostOutline = (
  outline1: PendingOutline,
  outline2: PendingOutline,
): PendingOutline => {
  const area1 = outline1.rect.width * outline1.rect.height;
  const area2 = outline2.rect.width * outline2.rect.height;

  return area1 >= area2 ? outline1 : outline2;
};
