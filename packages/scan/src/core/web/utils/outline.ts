import { throttle } from '@web-utils/helpers';
import { Fiber } from 'react-reconciler';
import { AggregatedChange } from 'src/core/instrumentation';
import { OutlineKey, ReactScanInternals } from '../../index';
import { getLabelText, joinAggregations } from '../../utils';
export interface OutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  labelText: string;
  textWidth: number; // this value does not correctly
  activeOutline: Outline;
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
  for (const activeOutline of activeOutlines.values()) {
    domNodes.push(activeOutline.domNode);
  }
  const rectMap = await batchGetBoundingRects(domNodes);
  for (const [key, activeOutline] of activeOutlines) {
    const rect = rectMap.get(activeOutline.domNode);
    if (!rect) {
      activeOutlines.delete(key);
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
    for (const [key, value] of boundingRectCache) {
      if (now - value.timestamp >= CACHE_LIFETIME) {
        boundingRectCache.delete(key);
      }
    }
  }, CACHE_LIFETIME);
};

export const flushOutlines = async (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  if (!ReactScanInternals.scheduledOutlines.size) {
    return;
  }

  const flattenedScheduledOutlines = Array.from(
    ReactScanInternals.scheduledOutlines.values(),
  );

  await activateOutlines();
  ReactScanInternals.scheduledOutlines = new Map();

  paintOutlines(
    ctx,
    flattenedScheduledOutlines, // this only matters for API back compat we aren't using it in this func
  );
};

let animationFrameId: number | null = null;

export const fadeOutOutline = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  const dpi = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width / dpi, ctx.canvas.height / dpi);
  const pendingLabeledOutlines: Array<OutlineLabel> = [];
  ctx.save();
  const phases = new Set<string>();
  const reasons: Array<'unstable' | 'commit' | 'unnecessary'> = [];
  const color = { r: 0, g: 0, b: 0 };
  const activeOutlines = ReactScanInternals.activeOutlines;

  for (const [key, activeOutline] of activeOutlines) {
    // invariant: active outline has "active" info non nullable at this point of the program b/c they must be activated
    const invariant_activeOutline = activeOutline as {
      [K in keyof Outline]: NonNullable<Outline[K]>;
    };
    let frame;

    for (const aggregatedRender of invariant_activeOutline.groupedAggregatedRender.values()) {
      aggregatedRender.frame! += 1;

      frame = frame
        ? Math.max(aggregatedRender.frame!, frame)
        : aggregatedRender.frame!;
    }

    if (!frame) {
      // Invariant: There should always be at least one frame
      // Fixme: there currently exists an edge case where an active outline has 0 group aggregated renders
      activeOutlines.delete(key);
      continue; // then there's nothing to draw
    }

    const THRESHOLD_FPS = 60;
    const avgFps =
      invariant_activeOutline.aggregatedRender.fps /
      invariant_activeOutline.aggregatedRender.aggregatedCount;
    const averageScore = Math.max(
      (THRESHOLD_FPS - Math.min(avgFps, THRESHOLD_FPS)) / THRESHOLD_FPS,
      invariant_activeOutline.aggregatedRender.time ??
        0 / invariant_activeOutline.aggregatedRender.aggregatedCount / 16,
    );

    const t = Math.min(averageScore, 1);
    const r = Math.round(START_COLOR.r + t * (END_COLOR.r - START_COLOR.r));
    const g = Math.round(START_COLOR.g + t * (END_COLOR.g - START_COLOR.g));
    const b = Math.round(START_COLOR.b + t * (END_COLOR.b - START_COLOR.b));
    color.r = r;
    color.g = g;
    color.b = b;

    // don't re-create to avoid gc time
    phases.clear();
    reasons.length = 0;

    if (invariant_activeOutline.aggregatedRender.didCommit)
      reasons.push('commit');
    if (invariant_activeOutline.aggregatedRender.changes.unstable)
      reasons.push('unstable');
    // todo: add better UI for unnecessary, adds too much overhead for a slight UI tweak
    // if (invariant_activeOutline.aggregatedRender.unnecessary) {
    //   reasons.push('unnecessary');
    //   if (reasons.length === 1) {
    //     color.r = 128;
    //     color.g = 128;
    //     color.b = 128;
    //   }
    // }

    const alphaScalar = 0.8;
    invariant_activeOutline.alpha =
      alphaScalar * (1 - frame! / invariant_activeOutline.totalFrames!);

    const alpha = invariant_activeOutline.alpha;
    const fillAlpha = alpha * 0.1;

    const rgb = `${color.r},${color.g},${color.b}`;
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 1;
    ctx.fillStyle = `rgba(${rgb},${fillAlpha})`;

    ctx.beginPath();
    ctx.rect(
      invariant_activeOutline.rect.x,
      invariant_activeOutline.rect.y,
      invariant_activeOutline.rect.width,
      invariant_activeOutline.rect.height,
    );
    ctx.stroke();
    ctx.fill();

    const labelText = getLabelText(
      Array.from(invariant_activeOutline.groupedAggregatedRender.values()),
    );

    if (
      reasons.length &&
      labelText &&
      !(phases.has('mount') && phases.size === 1)
    ) {
      const measured = measureTextCached(labelText, ctx);
      pendingLabeledOutlines.push({
        alpha,
        color,
        reasons,
        labelText,
        textWidth: measured.width,
        activeOutline: invariant_activeOutline,
      });
    }

    const totalFrames = invariant_activeOutline.totalFrames;
    for (const [
      fiber,
      aggregatedRender,
    ] of invariant_activeOutline.groupedAggregatedRender) {
      if (aggregatedRender.frame! >= totalFrames) {
        invariant_activeOutline.groupedAggregatedRender.delete(fiber);
      }
    }

    if (invariant_activeOutline.groupedAggregatedRender.size === 0) {
      activeOutlines.delete(key);
    }
  }

  ctx.restore();

  const mergedLabels = mergeOverlappingLabels(pendingLabeledOutlines);

  ctx.save();
  ctx.font = `11px ${MONO_FONT}`;

  for (let i = 0, len = mergedLabels.length; i < len; i++) {
    const { alpha, color, reasons, groupedAggregatedRender, rect } =
      mergedLabels[i];
    const text = getLabelText(groupedAggregatedRender) ?? 'Unknown';
    const conditionalText =
      reasons.includes('unstable') &&
      (reasons.includes('commit') || reasons.includes('unnecessary'))
        ? `⚠️${text}`
        : text;

    const textMetrics = ctx.measureText(conditionalText);
    const textWidth = textMetrics.width;
    const textHeight = 11;

    const labelX: number = rect!.x;
    const labelY: number = rect!.y - textHeight - 4;

    ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
    ctx.fillRect(labelX, labelY, textWidth + 4, textHeight + 4);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(conditionalText, labelX + 2, labelY + textHeight);
  }

  ctx.restore();

  if (activeOutlines.size) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  } else {
    animationFrameId = null;
  }
};
type ComponentName = string;
export interface Outline {
  domNode: HTMLElement;
  /** Aggregated render info */ // TODO: Flatten AggregatedRender into Outline to avoid re-creating objects
  aggregatedRender: AggregatedRender;

  /* Active Info- we re-use the Outline object to avoid over-allocing objects, which is why we have a singular aggregatedRender and collection of it (groupedAggregatedRender) */

  alpha: number | null;
  totalFrames: number | null;
  /* 
    - Invariant: This scales at a rate of O(unique components rendered at the same (x,y) coordinates) 
    - grouped renders by fiber
  */
  groupedAggregatedRender: Map<Fiber, AggregatedRender> | null;
  rect: DOMRect | null;
  /* This value is computed before the full rendered text is shown, so its only considered an estimate */
  estimatedTextWidth: number | null; // todo: estimated is stupid just make it the actual
}
export interface AggregatedRender {
  name: ComponentName;
  frame: number | null;
  phase: Set<'mount' | 'update' | 'unmount'>;
  time: number | null;
  aggregatedCount: number;
  forget: boolean;
  changes: AggregatedChange;
  unnecessary: boolean | null;
  didCommit: boolean;
  fps: number;

  computedKey: OutlineKey | null;
}

export let areFibersEqual = (fiberA: Fiber, fiberB: Fiber) => {
  if (fiberA === fiberB) {
    return true;
  }

  if (fiberA.alternate === fiberB) {
    return true;
  }

  if (fiberA === fiberB.alternate) {
    return true;
  }

  if (
    fiberA.alternate &&
    fiberB.alternate &&
    fiberA.alternate === fiberB.alternate
  ) {
    return true;
  }
  return false;
};

const activateOutlines = async () => {
  const domNodes: Array<HTMLElement> = [];
  const scheduledOutlines = ReactScanInternals.scheduledOutlines;
  const activeOutlines = ReactScanInternals.activeOutlines;
  const activeFibers = new Map<Fiber, AggregatedRender>();

  for (const activeOutline of ReactScanInternals.activeOutlines.values()) {
    if (!activeOutline.groupedAggregatedRender) {
      continue;
    }
    for (const [
      fiber,
      aggregatedRender,
    ] of activeOutline.groupedAggregatedRender) {
      if (fiber.alternate && activeFibers.has(fiber.alternate)) {
        const alternateAggregatedRender = activeFibers.get(fiber.alternate);

        if (alternateAggregatedRender) {
          joinAggregations({
            from: alternateAggregatedRender,
            to: aggregatedRender,
          });
        }

        activeFibers.delete(fiber.alternate);
      }
      activeFibers.set(fiber, aggregatedRender);
    }
  }

  for (const [fiber, outline] of scheduledOutlines) {
    const existingAggregatedRender =
      activeFibers.get(fiber) ||
      (fiber.alternate && activeFibers.get(fiber.alternate));
    if (existingAggregatedRender) {
      joinAggregations({
        to: existingAggregatedRender,
        from: outline.aggregatedRender,
      });
      existingAggregatedRender.frame = 0;
    }
    // else, the later logic will handle adding the entry

    domNodes.push(outline.domNode);
  }

  const rects = await batchGetBoundingRects(domNodes);
  const totalFrames = 45;
  const alpha = 0.8;
  for (const [fiber, outline] of scheduledOutlines) {
    // todo: put this behind config to use intersection observer or update speed
    // outlineUpdateSpeed: throttled | synchronous // "using synchronous updates will result in smoother animations, but add more overhead to react-scan"
    const rect = rects.get(outline.domNode);
    if (!rect) {
      // intersection observer could not get a rect, so we have nothing to paint/activate
      continue;
    }

    if (rect.top === rect.bottom || rect.left === rect.right) {
      continue;
    }

    const prevAggregatedRender =
      activeFibers.get(fiber) ||
      (fiber.alternate && activeFibers.get(fiber.alternate));

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isOffScreen =
      rect.bottom < 0 ||
      rect.right < 0 ||
      rect.top > viewportHeight ||
      rect.left > viewportWidth;
    if (isOffScreen) {
      // if its offscreen there is no reason to waste computation to aggregate + draw it
      continue;
    }

    const key = `${rect.x}-${rect.y}` as const;
    let existingOutline = activeOutlines.get(key);
    if (existingOutline) {
      existingOutline.rect = rect;
    }

    if (!existingOutline) {
      existingOutline = outline; // re-use the existing object to avoid GC time
      existingOutline.rect = rect;
      existingOutline.totalFrames = totalFrames;
      existingOutline.groupedAggregatedRender = new Map([
        [fiber, outline.aggregatedRender],
      ]);
      existingOutline.aggregatedRender.aggregatedCount =
        prevAggregatedRender?.aggregatedCount ?? 1;

      existingOutline.alpha = alpha;

      existingOutline.aggregatedRender.computedKey = key;

    
    // handles canceling the animation of the associated render that was painted at a different location
      if (prevAggregatedRender?.computedKey) {
        const groupOnKey = activeOutlines.get(prevAggregatedRender.computedKey);
        groupOnKey?.groupedAggregatedRender?.forEach(
          (value, prevStoredFiber) => {
            if (areFibersEqual(prevStoredFiber, fiber)) {
              value.frame = 45;
            }
          },
        );
      }
      activeOutlines.set(key, existingOutline);
    }

    existingOutline.alpha = Math.max(existingOutline.alpha!, outline.alpha!);

    existingOutline.totalFrames = Math.max(
      existingOutline.totalFrames!,
      outline.totalFrames!,
    );
  }
};
function paintOutlines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  outlines: Array<Outline>,
) {
  const { options } = ReactScanInternals;
  options.value.onPaintStart?.(outlines); // maybe we should start passing activeOutlines to onPaintStart, since we have the activeOutlines at painStart

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  }
}

export interface MergedOutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  groupedAggregatedRender: Array<AggregatedRender>;
  rect: DOMRect;
}

export const mergeOverlappingLabels = (
  labels: Array<OutlineLabel>,
): Array<MergedOutlineLabel> => {
  if (labels.length <= 1) {
    return labels.map((label) => toMergedLabel(label));
  }

  const transformed = labels.map((label) => ({
    original: label,
    rect: applyLabelTransform(label.activeOutline.rect!, label.textWidth!),
  }));

  transformed.sort((a, b) => a.rect.x - b.rect.x);

  const mergedLabels: Array<MergedOutlineLabel> = [];
  const mergedSet = new Set<number>();

  for (let i = 0; i < transformed.length; i++) {
    if (mergedSet.has(i)) continue;

    let currentMerged = toMergedLabel(
      transformed[i].original,
      transformed[i].rect,
    );

    for (
      let j = i + 1;
      j < transformed.length &&
      transformed[j].rect.x <= currentMerged.rect.x + currentMerged.rect.width;
      j++
    ) {
      if (mergedSet.has(j)) continue;

      const nextRect = transformed[j].rect;
      const overlapArea = getOverlapArea(currentMerged.rect, nextRect);
      if (overlapArea > 0) {
        const nextLabel = toMergedLabel(transformed[j].original, nextRect);
        currentMerged = mergeTwoLabels(currentMerged, nextLabel);

        mergedSet.add(j);
      }
    }

    mergedLabels.push(currentMerged);
  }

  return mergedLabels;
};

function toMergedLabel(
  label: OutlineLabel,
  rectOverride?: DOMRect,
): MergedOutlineLabel {
  const rect =
    rectOverride ??
    applyLabelTransform(label.activeOutline.rect!, label.textWidth!);
  const groupedArray = Array.from(
    label.activeOutline.groupedAggregatedRender!.values(),
  );
  return {
    alpha: label.alpha,
    color: label.color,
    reasons: label.reasons.slice(),
    groupedAggregatedRender: groupedArray,
    rect,
  };
}

function mergeTwoLabels(
  a: MergedOutlineLabel,
  b: MergedOutlineLabel,
): MergedOutlineLabel {
  const mergedRect = getBoundingRect(a.rect, b.rect);

  const mergedGrouped = a.groupedAggregatedRender.concat(
    b.groupedAggregatedRender,
  );

  const mergedReasons = Array.from(new Set([...a.reasons, ...b.reasons]));

  return {
    alpha: Math.max(a.alpha, b.alpha),

    ...pickColorFromOutermost(a, b), // kinda wrong, should pick color in earliest stage
    reasons: mergedReasons,
    groupedAggregatedRender: mergedGrouped,
    rect: mergedRect,
  };
}

function getBoundingRect(r1: DOMRect, r2: DOMRect): DOMRect {
  const x1 = Math.min(r1.x, r2.x);
  const y1 = Math.min(r1.y, r2.y);
  const x2 = Math.max(r1.x + r1.width, r2.x + r2.width);
  const y2 = Math.max(r1.y + r1.height, r2.y + r2.height);
  return new DOMRect(x1, y1, x2 - x1, y2 - y1);
}

function pickColorFromOutermost(a: MergedOutlineLabel, b: MergedOutlineLabel) {
  const areaA = a.rect.width * a.rect.height;
  const areaB = b.rect.width * b.rect.height;
  return areaA >= areaB ? { color: a.color } : { color: b.color };
}

function getOverlapArea(rect1: DOMRect, rect2: DOMRect): number {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
  );
  return xOverlap * yOverlap;
}

function applyLabelTransform(
  rect: DOMRect,
  estimatedTextWidth: number,
): DOMRect {
  const textHeight = 11;
  const labelX = rect.x;
  const labelY = rect.y;
  return new DOMRect(labelX, labelY, estimatedTextWidth + 4, textHeight + 4);
}

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
