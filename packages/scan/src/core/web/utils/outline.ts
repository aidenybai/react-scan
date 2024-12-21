import { throttle } from '@web-utils/helpers';
import { outlineWorker, type DrawingQueue } from '@web-utils/outline-worker';
import { type Fiber } from 'react-reconciler';
import { type AggregatedChange } from 'src/core/instrumentation';
import { ReactScanInternals, type OutlineKey } from '../../index';
import { getLabelText, joinAggregations } from '../../utils';

export interface OutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  labelText: string;
  textWidth: number;
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
  for (const activeOutline of activeOutlines.values()) {
    const rect = rectMap.get(activeOutline.domNode);
    if (!rect) {
      // we couldn't get a rect for the dom node, but the rect will fade out on its own when we continue
      continue;
    }
    activeOutline.target = rect;
  }
}, DEFAULT_THROTTLE_TIME);

export const batchGetBoundingRects = (
  elements: Array<HTMLElement>,
): Promise<Map<HTMLElement, DOMRect>> => {
  return new Promise((resolve) => {
    const results = new Map<HTMLElement, DOMRect>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const bounds = entry.boundingClientRect;
        results.set(element, bounds);
      }
      observer.disconnect();
      resolve(results);
    });

    for (const element of elements) {
      observer.observe(element);
    }
  });
};

export const flushOutlines = async () => {
  if (
    !ReactScanInternals.scheduledOutlines.size &&
    !ReactScanInternals.activeOutlines.size
  ) {
    return;
  }

  const flattenedScheduledOutlines = Array.from(
    ReactScanInternals.scheduledOutlines.values(),
  );

  await activateOutlines();

  recalcOutlines();

  ReactScanInternals.scheduledOutlines = new Map();

  const { options } = ReactScanInternals;

  options.value.onPaintStart?.(flattenedScheduledOutlines);

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline());
  }
};

let animationFrameId: number | null = null;

const shouldSkipInterpolation = (rect: DOMRect) => {
  // animations tend to transform out of screen/ to a very tiny size, those are noisy so we don't lerp them
  if (
    rect.top >= window.innerHeight || // completely below viewport
    rect.bottom <= 0 || // completely above viewport
    rect.left >= window.innerWidth || // completely right of viewport
    rect.right <= 0 // completely left of viewport
  ) {
    return true;
  }

  return !ReactScanInternals.options.value.smoothlyAnimateOutlines;
};

export const fadeOutOutline = () => {
  const drawingQueue: Array<DrawingQueue> = [];
  const pendingLabeledOutlines: Array<OutlineLabel> = [];
  const phases = new Set<string>();

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
    const color = { r, g, b };

    const reasons: Array<'unstable' | 'commit' | 'unnecessary'> = [];

    // don't re-create to avoid gc time
    phases.clear();
    reasons.length = 0;

    let didCommit = false;
    let unstable = false;
    let isUnnecessary = false;

    for (const render of invariant_activeOutline.groupedAggregatedRender.values()) {
      if (render.unnecessary) {
        isUnnecessary = true;
      }
      if (render.changes.unstable) {
        unstable = true;
      }
      if (render.didCommit) {
        didCommit = true;
      }
    }

    if (didCommit) reasons.push('commit');
    if (unstable) reasons.push('unstable');

    if (isUnnecessary) {
      reasons.push('unnecessary');
      color.r = 128;
      color.g = 128;
      color.b = 128;
    }

    const alphaScalar = 0.8;
    invariant_activeOutline.alpha =
      alphaScalar * (1 - frame / invariant_activeOutline.totalFrames);

    const alpha = invariant_activeOutline.alpha;
    const fillAlpha = alpha * 0.1;
    const target = invariant_activeOutline.target;

    const shouldSkip = shouldSkipInterpolation(target);
    if (shouldSkip) {
      invariant_activeOutline.current = target;
      invariant_activeOutline.groupedAggregatedRender.forEach((v) => {
        v.computedCurrent = target;
      });
    } else {
      if (!invariant_activeOutline.current) {
        invariant_activeOutline.current = new DOMRect(
          target.x,
          target.y,
          target.width,
          target.height,
        );
      }

      const INTERPOLATION_SPEED = 0.2;
      const current = invariant_activeOutline.current;

      const lerp = (start: number, end: number) => {
        return start + (end - start) * INTERPOLATION_SPEED;
      };

      const computedCurrent = new DOMRect(
        lerp(current.x, target.x),
        lerp(current.y, target.y),
        lerp(current.width, target.width),
        lerp(current.height, target.height),
      );

      invariant_activeOutline.current = computedCurrent;

      invariant_activeOutline.groupedAggregatedRender.forEach((v) => {
        v.computedCurrent = computedCurrent;
      });
    }

    drawingQueue.push({
      rect: invariant_activeOutline.current,
      color,
      alpha,
      fillAlpha,
    });

    const labelText = getLabelText(
      Array.from(invariant_activeOutline.groupedAggregatedRender.values()),
    );

    if (
      reasons.length &&
      labelText &&
      !(phases.has('mount') && phases.size === 1)
    ) {
      const measured = measureTextCached(labelText);
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

  const mergedLabels = mergeOverlappingLabels(pendingLabeledOutlines);

  outlineWorker.call({
    type: 'fade-out-outline',
    payload: {
      dpi: window.devicePixelRatio,
      drawingQueue,
      mergedLabels: mergedLabels.map((v) => ({
        alpha: v.alpha,
        rect: v.rect,
        color: v.color,
        reasons: v.reasons,
        labelText: getLabelText(v.groupedAggregatedRender) ?? 'N/A',
      })),
    },
  });

  if (activeOutlines.size) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline());
  } else {
    animationFrameId = null;
  }
};

type ComponentName = string;

export interface Outline {
  domNode: HTMLElement;
  /** Aggregated render info */ // TODO: Flatten AggregatedRender into Outline to avoid re-creating objects
  // this render is useless when in active outlines (confirm this rob)
  aggregatedRender: AggregatedRender; // maybe we should set this to null when its useless

  /* Active Info- we re-use the Outline object to avoid over-allocing objects, which is why we have a singular aggregatedRender and collection of it (groupedAggregatedRender) */
  alpha: number | null;
  totalFrames: number | null;
  /* 
    - Invariant: This scales at a rate of O(unique components rendered at the same (x,y) coordinates) 
    - renders with the same x/y position but different fibers will be a different fiber -> aggregated render entry. 
  */
  groupedAggregatedRender: Map<Fiber, AggregatedRender> | null;

  /* Rects for interpolation */
  current: DOMRect | null;
  target: DOMRect | null;
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
  computedCurrent: DOMRect | null; // reference to dom rect to copy over to new outline made at new position
}

export const areFibersEqual = (fiberA: Fiber, fiberB: Fiber) => {
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

export const getIsOffscreen = (rect: DOMRect) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return (
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > viewportHeight ||
    rect.left > viewportWidth
  );
};
const activateOutlines = async () => {
  const domNodes: Array<HTMLElement> = [];
  const scheduledOutlines = ReactScanInternals.scheduledOutlines;
  const activeOutlines = ReactScanInternals.activeOutlines;
  const activeFibers = new Map<Fiber, AggregatedRender>();

  // fiber alternate merging
  for (const activeOutline of ReactScanInternals.activeOutlines.values()) {
    activeOutline.groupedAggregatedRender?.forEach(
      (aggregatedRender, fiber) => {
        if (fiber.alternate && activeFibers.has(fiber.alternate)) {
          // if it already exists, copy it over
          const alternateAggregatedRender = activeFibers.get(fiber.alternate);

          if (alternateAggregatedRender) {
            joinAggregations({
              from: alternateAggregatedRender,
              to: aggregatedRender,
            });
          }
          // fixme: this seems to leave a label/outline alive for an extra frame in some cases
          activeOutline.groupedAggregatedRender?.delete(fiber);
          activeFibers.delete(fiber.alternate);
        }
        // match the current render to its fiber
        activeFibers.set(fiber, aggregatedRender);
      },
    );
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

    const isOffScreen = getIsOffscreen(rect);
    if (isOffScreen) {
      continue;
    }

    const key = `${rect.x}-${rect.y}` as const;
    let existingOutline = activeOutlines.get(key);

    if (!existingOutline) {
      existingOutline = outline; // re-use the existing object to avoid GC time

      existingOutline.target = rect;
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
              value.frame = 45; // todo: make this max frame, not hardcoded

              // for interpolation reference equality
              existingOutline!.current = value.computedCurrent!;
            }
          },
        );
      }
      activeOutlines.set(key, existingOutline);
      // we currently do not handle if the fiber moved positions, this is likely going to cause a problem somehwere
      // (the same fiber likely will exist multiple times in the active outlines)
      // this should be investigated asap
    } else if (!prevAggregatedRender) {
      existingOutline.alpha = outline.alpha;
      existingOutline.groupedAggregatedRender?.set(
        fiber,
        outline.aggregatedRender,
      );
    } else {
      joinAggregations({
        to: prevAggregatedRender,
        from: outline.aggregatedRender,
      });
    }

    // FIXME(Alexis): `|| 0` just for tseslint to shutup
    existingOutline.alpha = Math.max(
      existingOutline.alpha || 0,
      outline.alpha || 0,
    );

    existingOutline.totalFrames = Math.max(
      existingOutline.totalFrames || 0,
      outline.totalFrames || 0,
    );
  }
};

export interface MergedOutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  groupedAggregatedRender: Array<AggregatedRender>;
  rect: DOMRect;
}

// todo: optimize me so this can run always
// note: this can be implemented in nlogn using https://en.wikipedia.org/wiki/Sweep_line_algorithm
export const mergeOverlappingLabels = (
  labels: Array<OutlineLabel>,
): Array<MergedOutlineLabel> => {
  if (labels.length > 1500) {
    return labels.map((label) => toMergedLabel(label));
  }

  const transformed = labels.map((label) => ({
    original: label,
    rect: applyLabelTransform(label.activeOutline.current!, label.textWidth),
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
    let currentRight = currentMerged.rect.x + currentMerged.rect.width;

    for (let j = i + 1; j < transformed.length; j++) {
      if (mergedSet.has(j)) continue;

      if (transformed[j].rect.x > currentRight) {
        break;
      }

      const nextRect = transformed[j].rect;
      const overlapArea = getOverlapArea(currentMerged.rect, nextRect);
      if (overlapArea > 0) {
        const nextLabel = toMergedLabel(transformed[j].original, nextRect);
        currentMerged = mergeTwoLabels(currentMerged, nextLabel);
        mergedSet.add(j);

        currentRight = currentMerged.rect.x + currentMerged.rect.width;
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
    applyLabelTransform(label.activeOutline.current!, label.textWidth);
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

    ...pickColorClosestToStartStage(a, b), // kinda wrong, should pick color in earliest stage
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

function pickColorClosestToStartStage(
  a: MergedOutlineLabel,
  b: MergedOutlineLabel,
) {
  // stupid hack to always take the gray value when the render is unnecessary (we know the gray value has equal rgb)
  if (a.color.r === a.color.g && a.color.g === a.color.b) {
    return { color: a.color };
  }
  if (b.color.r === b.color.g && b.color.g === b.color.b) {
    return { color: b.color };
  }

  return { color: a.color.r <= b.color.r ? a.color : b.color };
}

function getOverlapArea(rect1: DOMRect, rect2: DOMRect): number {
  if (rect1.right <= rect2.left || rect2.right <= rect1.left) {
    return 0;
  }

  if (rect1.bottom <= rect2.top || rect2.bottom <= rect1.top) {
    return 0;
  }

  const xOverlap =
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
  const yOverlap =
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);

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

let offscreenContext: OffscreenCanvasRenderingContext2D;

function getMeasuringContext(): OffscreenCanvasRenderingContext2D {
  if (!offscreenContext) {
    const dpi = window.devicePixelRatio || 1;
    const canvas = new OffscreenCanvas(
      dpi * window.innerWidth,
      dpi * window.innerHeight,
    );
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('unreachable');
    }
    offscreenContext = ctx;
  }
  return offscreenContext;
}

export const measureTextCached = (text: string): TextMetrics => {
  if (textMeasurementCache.has(text)) {
    return textMeasurementCache.get(text)!;
  }
  const ctx = getMeasuringContext();
  ctx.font = `11px ${MONO_FONT}`;
  const metrics = ctx.measureText(text);
  textMeasurementCache.set(text, metrics);
  return metrics;
};
