import { throttle } from '@web-utils/helpers';
import { ReactScanInternals } from '../../index';
import { type Render } from '../../instrumentation';
import { getLabelText } from '../../utils';

export interface PendingOutline {
  domNode: HTMLElement;
  renders: Array<Render>;
}

export interface ActiveOutline {
  outline: PendingOutline;
  alpha: number;
  frame: number;
  totalFrames: number;
  text: string | null;
  rect: DOMRect;
}

export interface OutlineLabel {
  alpha: number;
  outline: PendingOutline;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  labelText: string;
  textWidth: number;
  rect: DOMRect;
}

const DEFAULT_THROTTLE_TIME = 32; // 2 frames

const START_COLOR = { r: 115, g: 97, b: 230 };
const END_COLOR = { r: 185, g: 49, b: 115 };
const MONO_FONT =
  'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace';

export const getOutlineKey = (rect: DOMRect): string => {
  return `${rect.top}-${rect.left}-${rect.width}-${rect.height}`;
};

let currentFrameId = 0;

function incrementFrameId() {
  currentFrameId++;
  requestAnimationFrame(incrementFrameId);
}

if (typeof window !== 'undefined') {
  incrementFrameId();
}

export const recalcOutlines = throttle(async () => {
  const { activeOutlines } = ReactScanInternals;

  const domNodes: Array<HTMLElement> = [];

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    domNodes.push(activeOutline.outline.domNode);
  }
  const rectMap = await batchGetBoundingRects(domNodes);

  for (let i = activeOutlines.length - 1; i >= 0; i--) {
    const activeOutline = activeOutlines[i];
    if (!activeOutline) continue;
    const rect = rectMap.get(activeOutline.outline.domNode);
    if (!rect) {
      activeOutlines.splice(i, 1);
      continue;
    }
    activeOutline.rect = rect;
  }
}, DEFAULT_THROTTLE_TIME);

const boundingRectCache = new Map<
  HTMLElement,
  { rect: DOMRect; timestamp: number }
>();

const CACHE_LIFETIME = 200;

export const batchGetBoundingRects = (
  elements: Array<HTMLElement>,
): Promise<Map<HTMLElement, DOMRect>> => {
  idempotent_startBoundingRectGC();
  return new Promise((resolve) => {
    const now = Date.now();
    const results = new Map<HTMLElement, DOMRect>();
    const needsUpdate: Array<HTMLElement> = [];

    for (const element of elements) {
      const cached = boundingRectCache.get(element);
      if (cached && now - cached.timestamp < CACHE_LIFETIME) {
        results.set(element, cached.rect);
      } else {
        needsUpdate.push(element);
      }
    }

    if (needsUpdate.length === 0) {
      resolve(results);
      return;
    }

    // intersection observer runs off main thread, and provides
    // the client bounding rect on observation start https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#intersection_observer_concepts_and_usage
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const bounds = entry.boundingClientRect;

        results.set(element, bounds);
        boundingRectCache.set(element, {
          rect: bounds,
          timestamp: now,
        });
      }

      observer.disconnect();
      resolve(results);
    });

    for (const element of needsUpdate) {
      observer.observe(element);
    }
  });
};

let boundingRectGcInterval: ReturnType<typeof setInterval>;
// eslint-disable-next-line camelcase
const idempotent_startBoundingRectGC = () => {
  if (boundingRectGcInterval) return;
  setInterval(() => {
    const now = Date.now();
    boundingRectCache.forEach((value, key) => {
      if (now - value.timestamp >= CACHE_LIFETIME) {
        boundingRectCache.delete(key);
      }
    });
  }, CACHE_LIFETIME);
};

export const flushOutlines = async (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  previousOutlines: Map<string, PendingOutline> = new Map(),
) => {
  if (!ReactScanInternals.scheduledOutlines.length) {
    return;
  }

  const scheduledOutlines = ReactScanInternals.scheduledOutlines;
  const newPreviousOutlines = await activateOutlines(
    scheduledOutlines,
    previousOutlines,
  );
  ReactScanInternals.scheduledOutlines = [];

  recalcOutlines();

  void paintOutlines(
    ctx,
    scheduledOutlines, // this only matters for API back compat we aren't using it in this func
  );

  if (ReactScanInternals.scheduledOutlines.length) {
    requestAnimationFrame(() => {
      void flushOutlines(ctx, newPreviousOutlines); // i think this is fine, think harder about it later
    });
  }
};

let animationFrameId: number | null = null;

const labelTextCache = new WeakMap<PendingOutline, string>();

function getCachedLabelText(outline: PendingOutline): string {
  if (labelTextCache.has(outline)) {
    return labelTextCache.get(outline)!;
  }
  const text = getLabelText(outline.renders) ?? '';
  labelTextCache.set(outline, text);
  return text;
}

export const fadeOutOutline = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  const { activeOutlines } = ReactScanInternals;
  const options = ReactScanInternals.options.value;

  const dpi = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width / dpi, ctx.canvas.height / dpi);

  const groupedOutlines = new Map<string, ActiveOutline>();

  const toRemove: Array<number> = [];
  for (let idx = activeOutlines.length - 1; idx >= 0; idx--) {
    const activeOutline = activeOutlines[idx];
    if (!activeOutline) continue;

    const { outline, rect } = activeOutline;
    const key = `${rect.x}-${rect.y}`;
    const existing = groupedOutlines.get(key);

    if (!existing) {
      groupedOutlines.set(key, activeOutline);
    } else {
      if (existing.outline.renders !== outline.renders) {
        const CHUNK_SIZE = 10000; //Array.prototype.push(...) can stack overflow with too many elements
        const renders = outline.renders;

        for (let start = 0; start < renders.length; start += CHUNK_SIZE) {
          const chunk = renders.slice(start, start + CHUNK_SIZE);
          existing.outline.renders.push(...chunk);
        }

        existing.alpha = Math.max(existing.alpha, activeOutline.alpha);
        existing.frame = Math.min(existing.frame, activeOutline.frame);
        existing.totalFrames = Math.max(
          existing.totalFrames,
          activeOutline.totalFrames,
        );
      }

      toRemove.push(idx);
    }

    activeOutline.frame++;
    const progress = activeOutline.frame / activeOutline.totalFrames;
    const alphaScalar = 0.8;
    activeOutline.alpha = alphaScalar * (1 - progress);

    if (activeOutline.frame >= activeOutline.totalFrames) {
      toRemove.push(idx);
    }
  }

  toRemove.sort((a, b) => a - b);
  for (let i = toRemove.length - 1; i >= 0; i--) {
    activeOutlines.splice(toRemove[i], 1);
  }

  const pendingLabeledOutlines: Array<OutlineLabel> = [];
  ctx.save();

  const renderCountThreshold = options.renderCountThreshold ?? 0;

  const phases = new Set<string>();
  const reasons: Array<'unstable' | 'commit' | 'unnecessary'> = [];

  for (const activeOutline of groupedOutlines.values()) {
    const { outline, frame, totalFrames, rect } = activeOutline;

    let totalTime = 0;
    let totalCount = 0;
    let totalFps = 0;
    const renderLen = outline.renders.length;
    for (let i = 0; i < renderLen; i++) {
      const render = outline.renders[i];
      totalTime += render.time ?? 0;
      totalCount += render.count;
      totalFps += render.fps;
    }

    const THRESHOLD_FPS = 60;
    const avgFps = totalFps / renderLen;
    const averageScore = Math.max(
      (THRESHOLD_FPS - Math.min(avgFps, THRESHOLD_FPS)) / THRESHOLD_FPS,
      totalTime / totalCount / 16,
    );

    const t = Math.min(averageScore, 1);
    const r = Math.round(START_COLOR.r + t * (END_COLOR.r - START_COLOR.r));
    const g = Math.round(START_COLOR.g + t * (END_COLOR.g - START_COLOR.g));
    const b = Math.round(START_COLOR.b + t * (END_COLOR.b - START_COLOR.b));
    let color = { r, g, b };

    phases.clear();
    reasons.length = 0;

    let didCommit = false;
    let isUnstable = false;
    let isUnnecessary = false;

    for (let i = 0; i < renderLen; i++) {
      const render = outline.renders[i];
      phases.add(render.phase);
      if (render.didCommit) {
        didCommit = true;
      }

      const changes = render.changes;
      if (changes) {
        for (let j = 0, cLen = changes.length; j < cLen; j++) {
          if (changes[j].unstable) {
            isUnstable = true;
          }
        }
      }

      if (render.unnecessary) {
        isUnnecessary = true;
      }
    }

    if (didCommit) reasons.push('commit');
    if (isUnstable) reasons.push('unstable');
    if (isUnnecessary) {
      reasons.push('unnecessary');
      if (reasons.length === 1) {
        color = { r: 128, g: 128, b: 128 };
      }
    }

    if (renderCountThreshold > 0) {
      let count = 0;
      for (let i = 0; i < renderLen; i++) {
        count += outline.renders[i].count;
      }
      if (count < renderCountThreshold) {
        continue;
      }
    }

    const alphaScalar = 0.8;
    activeOutline.alpha = alphaScalar * (1 - frame / totalFrames);

    const alpha = activeOutline.alpha;
    const fillAlpha = alpha * 0.1;

    const rgb = `${color.r},${color.g},${color.b}`;
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 1;
    ctx.fillStyle = `rgba(${rgb},${fillAlpha})`;

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.stroke();
    ctx.fill();

    const labelText = getCachedLabelText(outline);

    if (
      reasons.length &&
      labelText &&
      !(phases.has('mount') && phases.size === 1)
    ) {
      const measured = measureTextCached(labelText, ctx);
      pendingLabeledOutlines.push({
        alpha,
        outline,
        color,
        reasons,
        labelText,
        textWidth: measured.width,
        rect,
      });
    }
  }

  ctx.restore();

  const mergedLabels = mergeOverlappingLabels(pendingLabeledOutlines);

  ctx.save();
  ctx.font = `11px ${MONO_FONT}`;

  for (let i = 0, len = mergedLabels.length; i < len; i++) {
    const { alpha, outline, color, reasons, rect } = mergedLabels[i];
    const text = getCachedLabelText(outline);
    const conditionalText =
      reasons.includes('unstable') &&
      (reasons.includes('commit') || reasons.includes('unnecessary'))
        ? `⚠️${text}`
        : text;

    const textMetrics = ctx.measureText(conditionalText);
    const textWidth = textMetrics.width;
    const textHeight = 11;

    const labelX: number = rect.x;
    const labelY: number = rect.y - textHeight - 4;

    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
    ctx.fillRect(labelX, labelY, textWidth + 4, textHeight + 4);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(conditionalText, labelX + 2, labelY + textHeight);
  }

  ctx.restore();

  if (activeOutlines.length) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  } else {
    animationFrameId = null;
  }
};

export interface PendingOutline {
  domNode: HTMLElement;
  renders: Array<Render>;
}

const activateOutlines = async (
  outlines: Array<PendingOutline>,
  previousOutlines: Map<string, PendingOutline>,
) => {
  const newPreviousOutlines = new Map<string, PendingOutline>();

  const { options } = ReactScanInternals;
  const totalFrames = options.value.alwaysShowLabels ? 60 : 30;
  const alpha = 0.8;

  const rects = await batchGetBoundingRects(outlines.map((o) => o.domNode));
  const newActiveOutlines: Array<ActiveOutline> = [];

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  for (const outline of outlines) {
    const renders = outline.renders;
    const rect = rects.get(outline.domNode);
    if (!rect) {
      // If we cannot get the rect, it might mean the element is detached or invisible.
      // Skip it.
      continue;
    }

    const isOffScreen =
      rect.bottom < 0 ||
      rect.right < 0 ||
      rect.top > viewportHeight ||
      rect.left > viewportWidth;

    if (isOffScreen) {
      continue;
    }

    const key = getOutlineKey(rect);
    if (previousOutlines.has(key)) {
      continue;
    }
    newPreviousOutlines.set(key, outline);

    const frame = 0;

    newActiveOutlines.push({
      outline,
      alpha,
      frame,
      totalFrames,
      text: getLabelText(renders),
      rect,
    });
  }

  ReactScanInternals.activeOutlines.push(...newActiveOutlines);
  return newPreviousOutlines;
};

async function paintOutlines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  outlines: Array<PendingOutline>,
): Promise<void> {
  const { options } = ReactScanInternals;
  options.value.onPaintStart?.(outlines); // maybe we should start passing activeOutlines to onPaintStart, since we have the activeOutlines at painStart

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  }
}
export const getLabelRect = (label: OutlineLabel): DOMRect => {
  const textHeight = 11;

  const labelX = label.rect.x;
  const labelY = label.rect.y - textHeight - 4;

  return new DOMRect(labelX, labelY, label.textWidth + 4, textHeight + 4);
};

//

/**
 * -  this can be done in O(nlogn) using https://en.wikipedia.org/wiki/Sweep_line_algorithm
 * - we don't merge if we need to perform over 1000 merge checks as a naive way to optimize this fn during expensive draws
 *    - this works fine since when there are lots of outlines, its likely going to be very cluttered anyway, merging does not make the situation meangifully better
 */
//

export const mergeOverlappingLabels = (
  labels: Array<OutlineLabel>,
  maxMergeOps = 2000,
): Array<OutlineLabel> => {
  const sortedByX = labels.map((label) => ({
    ...label,
    rect: getLabelRect(label),
  }));
  sortedByX.sort((a, b) => a.rect.x - b.rect.x);

  const mergedLabels: Array<OutlineLabel> = [];
  let ops = 0;

  for (let i = 0; i < sortedByX.length; i++) {
    const label = sortedByX[i];
    let isMerged = false;

    // Only compare with labels that might overlap
    for (
      let j = i + 1;
      j < sortedByX.length &&
      sortedByX[j].rect.x <= label.rect.x + label.rect.width &&
      ops < maxMergeOps;
      j++
    ) {
      ops++;
      const nextLabel = sortedByX[j];
      const nextRect = sortedByX[j].rect;

      const overlapArea = getOverlapArea(label.rect, nextRect);

      if (overlapArea > 0) {
        const outermostLabel = getOutermostLabel(nextLabel, label);
        const combinedOutline: PendingOutline & { rect: DOMRect } = {
          rect: outermostLabel.rect,
          domNode: outermostLabel.outline.domNode,
          renders: [...label.outline.renders, ...nextLabel.outline.renders],
        };

        nextLabel.alpha = Math.max(nextLabel.alpha, label.alpha);

        nextLabel.rect = combinedOutline.rect;
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

const textMeasurementCache = new Map<string, TextMetrics>();

export const measureTextCached = (
  text: string,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
): TextMetrics => {
  if (textMeasurementCache.has(text)) {
    return textMeasurementCache.get(text)!;
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

export const getOutermostLabel = (
  label1: OutlineLabel,
  label2: OutlineLabel,
): OutlineLabel => {
  const area1 = label1.rect.width * label1.rect.height;
  const area2 = label2.rect.width * label2.rect.height;

  return area1 >= area2 ? label1 : label2;
};
