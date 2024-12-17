import { throttle } from '@web-utils/helpers';
import { Internals, OutlineKey, ReactScanInternals } from '../../index';
import { aggregateRender, getLabelText, joinAggregations } from '../../utils';
import { AggregatedChange } from 'src/core/instrumentation';
import { Fiber } from 'react-reconciler';
// import { ReactScanInternals } from 'src/types';

// export interface ActiveOutline {
//   outline: Outline;
//   alpha: number;
//   frame: number;
//   totalFrames: number;
//   // text: string | null;
//   componentNames: Set<string>;
//   rect: DOMRect;
// }

// wait is this even used anymore?

export interface OutlineLabel {
  alpha: number;
  // outline: Outline;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  labelText: string;
  estimatedTextWidth: number; // this value does not correctly
  // rect: DOMRect;
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
    boundingRectCache.forEach((value, key) => {
      if (now - value.timestamp >= CACHE_LIFETIME) {
        boundingRectCache.delete(key);
      }
    });
  }, CACHE_LIFETIME);
};

export const flushOutlines = async (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  previousOutlines: Map<string, Outline> = new Map(),
) => {
  if (!ReactScanInternals.scheduledOutlines.size) {
    return;
  }

  // const scheduledOutlines = ReactScanInternals.scheduledOutlines;
  const flattenedScheduledOutlines = Array.from(
    ReactScanInternals.scheduledOutlines.values(),
  );

  // oh todo, if there exists an outline, do NOT add it, just increment it
  await activateOutlines();
  ReactScanInternals.scheduledOutlines = new Map();

  // recalcOutlines(); // is this needed?

  paintOutlines(
    ctx,
    flattenedScheduledOutlines, // this only matters for API back compat we aren't using it in this func
  );

  // i don' t think this ever runs? If thers a bug add it back
  // if (ReactScanInternals.scheduledOutlines.size) {
  //   requestAnimationFrame(() => {
  //     void flushOutlines(ctx, newPreviousOutlines); // i think this is fine, think harder about it later
  //   });
  // }
};

let animationFrameId: number | null = null;

const labelTextCache = new WeakMap<Outline, string>();

// function getCachedLabelText(outline: Outline): string {
//   if (labelTextCache.has(outline)) {
//     return labelTextCache.get(outline)!;
//   }
//   const text = getLabelText(outline.renders) ?? '';
//   labelTextCache.set(outline, text);
//   return text;
// }

export const fadeOutOutline = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  // const { scheduledOutlines: outlines } = ReactScanInternals;
  // const options = ReactScanInternals.options.value;

  const dpi = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, ctx.canvas.width / dpi, ctx.canvas.height / dpi);

  // const groupedOutlines = new Map<string, Outline>();

  // const toRemove: Array<number> = [];
  // for (const [fiber, outline] of outlines) {
  //   // const activeOutline = outlines[idx];
  //   // if (!activeOutline) continue;

  //   const { rect } = outline;
  //   if (!rect) {
  //     // it has not been activated yet
  //     continue;
  //   }
  //   const key = `${rect.x}-${rect.y}`;
  //   let existing = groupedOutlines.get(key);
  //   // if (!existing){
  //   //   existing = []
  //   //   groupedOutlines.set(key, existing)
  //   // }
  //   // existing.push(outline);

  //   // joinAggregations(outline.a)
  //   // outline.

  //   // gr
  //   // groupedOutlines.set(existing)

  //   if (!existing) {
  //     groupedOutlines.set(key, outline);
  //   } else {
  //     // todo, make a general render aggregate function?

  //     // existing.outline.aggregatedRenders.aggregatedCount

  //     joinAggregations({
  //       from: outline.aggregatedRenders,
  //       to: existing.aggregatedRenders,
  //     });
  //     // existing.componentNames.add(activeOutline.a)
  //     // invariant: existing outlines have all its activated properties non nullable
  //     // invariant: at this point of the program, outline has all its activated properties non nullable
  //     existing.componentNames = existing.componentNames!.union(
  //       outline.componentNames!,
  //     );
  //     existing.alpha = Math.max(existing.alpha!, outline.alpha!);
  //     // existing.text
  //     existing.frame = Math.min(existing.frame!, outline.frame!);
  //     existing.totalFrames = Math.max(
  //       existing.totalFrames!,
  //       outline.totalFrames!,
  //     );

  //     // toRemove.push(idx);
  //   }

  //   out.frame++;
  //   const progress = activeOutline.frame / activeOutline.totalFrames;
  //   const alphaScalar = 0.8;
  //   activeOutline.alpha = alphaScalar * (1 - progress);

  // if (activeOutline.frame >= activeOutline.totalFrames) {
  //   toRemove.push(idx);
  // }
  // }

  // toRemove.sort((a, b) => a - b);
  // for (let i = toRemove.length - 1; i >= 0; i--) {
  //   activeOutlines.splice(toRemove[i], 1);
  // }

  const pendingLabeledOutlines: Array<OutlineLabel> = [];
  ctx.save();

  // const renderCountThreshold = options.renderCountThreshold ?? 0;

  const phases = new Set<string>();
  const reasons: Array<'unstable' | 'commit' | 'unnecessary'> = [];
  const color = { r: 0, g: 0, b: 0 };
  const activeOutlines = ReactScanInternals.activeOutlines;

  for (const [key, activeOutline] of activeOutlines) {
    // invariant: active outline has "active" info non nullable at this point of the program b/c they must be activated
    const invariant_activeOutline = activeOutline as {
      [K in keyof Outline]: NonNullable<Outline[K]>;
    };
    // invariant_activeOutline.frame += 1;
    // const frame = Math.max(Array.from(invariant_activeOutline.groupedAggregatedRender.values()).map(x=))
    let frame;

    for (const aggregatedRender of invariant_activeOutline.groupedAggregatedRender.values()) {
      aggregatedRender.frame! += 1;

      frame = frame
        ? Math.max(aggregatedRender.frame!, frame)
        : aggregatedRender.frame!;
    }

    // console.log('any?',Ar );

    // console.log('da frame', frame, invariant_activeOutline.groupedAggregatedRender.size);

    if (!frame) {
      console.error('invariant');
      activeOutlines.delete(key);
      continue; // then there's nothing to draw
    }
    // let totalTime = 0;
    // let totalCount = 0;
    // let totalFps = 0;
    // const renderLen = outline.renders.length;
    // for (let i = 0; i < renderLen; i++) {
    //   const render = outline.renders[i];
    //   totalTime += render.time ?? 0;
    //   totalCount += render.count;
    //   totalFps += render.fps;
    // }

    // const key =
    //   `${invariant_activeOutline.rect.x}-${invariant_activeOutline.rect.y}` as const;
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
    // let color = { r, g, b };
    color.r = r;
    color.g = g;
    color.b = b;

    // don't re-create to avoid gc time
    phases.clear();
    reasons.length = 0;

    // let didCommit = false;
    // let isUnstable = false;
    // let isUnnecessary = false;

    // for (let i = 0; i < renderLen; i++) {
    //   const render = outline.renders[i];
    //   phases.add(render.phase);
    //   if (render.didCommit) {
    //     didCommit = true;
    //   }

    //   const changes = render.changes;
    //   if (changes) {
    //     for (let j = 0, cLen = changes.length; j < cLen; j++) {
    //       if (changes[j].unstable) {
    //         isUnstable = true;
    //       }
    //     }
    //   }

    //   if (render.unnecessary) {
    //     isUnnecessary = true;
    //   }
    // }

    if (invariant_activeOutline.aggregatedRender.didCommit)
      reasons.push('commit');
    if (invariant_activeOutline.aggregatedRender.changes.unstable)
      reasons.push('unstable');
    if (invariant_activeOutline.aggregatedRender.unnecessary) {
      reasons.push('unnecessary');
      if (reasons.length === 1) {
        // color = { r: 128, g: 128, b: 128 };
        color.r = 128;
        color.g = 128;
        color.b = 128;
      }
    }

    // if (renderCountThreshold > 0) {
    //   // uh this does nothing?????????????????//
    //   let count = 0;
    //   for (let i = 0; i < renderLen; i++) {
    //     count += outline.renders[i].count;
    //   }
    //   if (count < renderCountThreshold) {
    //     continue;
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

    // this don't work because we need the set of renders grouped
    // const labelText = getCachedLabelText(outline);
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
        // outline,
        color,
        reasons,
        labelText,
        estimatedTextWidth: measured.width,
        // rect: invariant_activeOutline.rect,
        activeOutline: invariant_activeOutline,

        // rect,
      });
    }

    const totalFrames = invariant_activeOutline.totalFrames;
    for (const [
      fiber,
      aggregatedRender,
    ] of invariant_activeOutline.groupedAggregatedRender) {
      if (aggregatedRender.frame! >= totalFrames) {
        invariant_activeOutline.groupedAggregatedRender.delete(fiber);
        // ReactScanInternals.activeFibers.delete(fiber);
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
    // const text = getCachedLabelText(outline);
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

  // cleanup logic here

  if (activeOutlines.size) {
    animationFrameId = requestAnimationFrame(() => fadeOutOutline(ctx));
  } else {
    animationFrameId = null;
  }
};
type ComponentName = string;
export interface Outline {
  domNode: HTMLElement;

  /** Aggregated render info */ // TODO: FLATTEN THIS INTO THE SINGLE OBJECT TO AVOID RE-CREATING OBJECTS
  aggregatedRender: AggregatedRender; // i think we need to map this to component names, since that's what it will be under the hood, shrug
  // actually if we think of this as data for one outline, and then another field storing the minimal information, its fine
  // im not too worried about something being alloced staying a live a little long vs allocing a lot of memory
  // can make this nullable and clear it if neccecsary, but probably not a problem

  /* Active Info- we re-use this object to avoid over-allocing objects */
  // outline: Outline | null;
  alpha: number | null;

  totalFrames: number | null; // componentNames: Set<string> | null;
  // componentRenderCounts: Map<string, number>;
  /** Invariant: This scales at a rate of O(unique components rendered at the same (x,y) coordinates) */
  groupedAggregatedRender: Map<Fiber, AggregatedRender> | null;
  // erg, we need count, forget, time which is essentially
  rect: DOMRect | null;

  estimatedTextWidth: number | null; // todo estimated is stupid

  // so we know which fibers currently have outlines
  // this is used to dedup outlines
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

  computedKey: OutlineKey | null; // hacky but whatever
}

const activateOutlines = async () => {
  const domNodes: Array<HTMLElement> = [];

  // lets just see how expensive that loop is
  // const fibersWithOutline = new Set

  const scheduledOutlines = ReactScanInternals.scheduledOutlines;
  const activeOutlines = ReactScanInternals.activeOutlines;
  const activeFibers = new Map<Fiber, AggregatedRender>();

  for (const activeOutline of ReactScanInternals.activeOutlines.values()) {
    activeOutline.groupedAggregatedRender?.forEach(
      (aggregatedRender, fiber) => {
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
      },
    );
  }

  for (const [fiber, outline] of scheduledOutlines) {
    // if (outline.)
    const existingAggregatedRender =
      activeFibers.get(fiber) ||
      (fiber.alternate && activeFibers.get(fiber.alternate));
    if (existingAggregatedRender) {
      joinAggregations({
        to: existingAggregatedRender,
        from: outline.aggregatedRender,
      });
      // existingAggregatedRender.aggregatedCount = outline.aggregatedRender.aggregatedCount + 1
      existingAggregatedRender.frame = 0;
      // outline.rect =

      // continue;
    }
    // else, the later logic will handle adding the entry

    domNodes.push(outline.domNode);
    // const existingActiveOutline = previousActiveOutlines.get()
  }

  const rects = await batchGetBoundingRects(domNodes);
  //
  const totalFrames = 45;
  const alpha = 0.8;
  for (const [fiber, outline] of scheduledOutlines) {
    // put this behind config to use intersection observer or update speed
    // outlineUpdateSpeed: throttled | synchronous // "using synchronous updates will result in smoother animations, but add more overhead to react-scan"
    const rect = rects.get(outline.domNode);
    // const rect = outline.domNode.getBoundingClientRect()
    if (!rect) {
      // intersection observer could not get a rect, so we have nothing to paint/activate
      continue;
    }

    //
    // const hasFiber =j

    // console.log('has fibers?', );
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
    // it is ~8x faster to delete map items in the loop vs accumulating them in an array then deleting after on node v23.4.0
    if (isOffScreen) {
      // if its offscreen there is no reason to waste computation to aggregate + draw it
      continue;
    }

    const key = `${rect.x}-${rect.y}` as const;
    let existingOutline = activeOutlines.get(key);
    if (existingOutline) {
      existingOutline.rect = rect;
    }

    // activeFibers.add(fiber);

    if (!existingOutline) {
      existingOutline = outline; // re-use the existing object to avoid GC time
      existingOutline.rect = rect;
      // existingOutline.frame = 0;
      existingOutline.totalFrames = totalFrames;
      existingOutline.groupedAggregatedRender = new Map([
        [fiber, outline.aggregatedRender],
      ]);
      existingOutline.aggregatedRender.aggregatedCount =
        prevAggregatedRender?.aggregatedCount ?? 1;

      existingOutline.alpha = alpha;

      existingOutline.aggregatedRender.computedKey = key;
      // if (!prevAggregatedRender) {
      // activateOutlines.de

      // theres another key that exists already, gang
      if (prevAggregatedRender?.computedKey) {
        activeOutlines.delete(prevAggregatedRender.computedKey);
      }
      activeOutlines.set(key, existingOutline);
      // }
      /* Active Info */
      // outline: Outline | null;
      // alpha: number | null;
      // frame: number | null;
      // totalFrames: number | null;
      // componentNames: Set<string> | null;
      // rect: DOMRect | null;
    }

    // else {
    //   console.log('joined', existingOutline, existingOutline.aggregatedRender.renders);

    //   joinAggregations({
    //     from: outline.aggregatedRender,
    //     to: existingOutline.aggregatedRender,
    //   });
    // }

    // existingOutline.componentNames.add(activeOutline.a)
    // invariant: existingOutline outlines have all its activated properties non nullable
    // invariant: at this point of the program, outline has all its activated properties non nullable
    // existingOutline.componentNames = existingOutline.componentNames!.union(
    //   outline.componentNames!,
    // );
    // const previousComponentAggregatedRender =
    //   existingOutline.groupedAggregatedRender!.get(
    //   fiber
    //   ) ?? (fiber.alternate &&  existingOutline.groupedAggregatedRender!.get(
    //     fiber.alternate
    //     ))
    // // console.log('previous existing has!', previousComponentAggregatedRender?.renders);

    // if (previousComponentAggregatedRender) {
    //   // previousComponentAggregatedRender.

    //   joinAggregations({
    //     to: previousComponentAggregatedRender,
    //     from: outline.aggregatedRender,
    //   });

    //   // console.log('now it has', previousComponentAggregatedRender.renders);
    // } else {
    // existingOutline.groupedAggregatedRender!.set(
    //   fiber,
    //   outline.aggregatedRender
    // );
    // }

    //  for (const aggregatedRender of existingOutline.groupedAggregatedRender ) {

    //  }
    existingOutline.alpha = Math.max(existingOutline.alpha!, outline.alpha!);
    // existingOutline.text
    // existingOutline.frame = Math.min(existingOutline.frame!, outline.frame!);
    existingOutline.totalFrames = Math.max(
      existingOutline.totalFrames!,
      outline.totalFrames!,
    );
  }
};

// const activateOutlines = async (
//   outlines: Internals['scheduledOutlines'],
//   previousOutlines: Map<string, Outline>,
// ) => {
//   const scheduledOutlines: Internals['scheduledOutlines'] = new Map();
//   const domNodes: Array<HTMLElement> = [];

//   for (const [fiber, outline] of outlines.entries()) {
//     // if ()
//     if (outline.rect === null) {
//       scheduledOutlines.set(fiber, outline);
//       domNodes.push(outline.domNode);
//     }
//   }

//   // const newPreviousOutlines = new Map<string, Outline>();
//   //
//   // const { options } = ReactScanInternals;
//   // const totalFrames = options.value.alwaysShowLabels ? 60 : 30; // what?
//   const totalFrames = 30;
//   const alpha = 0.8;

//   const rects = await batchGetBoundingRects(domNodes);
//   // const newActiveOutlines: Array<ActiveOutline> = [];

//   const viewportWidth = window.innerWidth;
//   const viewportHeight = window.innerHeight;

//   // const newActiveOutlines =previousOutlines

//   for (const [fiber, outline] of outlines) {
//     // const renders = outline.renders;

//     const rect = rects.get(outline.domNode);
//     if (!rect) {
//       // If we cannot get the rect, it might mean the element is detached or invisible.
//       // Skip it.
//       continue;
//     }
//     const key = `${rect.x}-${rect.y}`;

//     const isOffScreen =
//       rect.bottom < 0 ||
//       rect.right < 0 ||
//       rect.top > viewportHeight ||
//       rect.left > viewportWidth;

//     if (isOffScreen) {
//       outlines.delete(fiber);
//       continue;
//     }

//     outline.rect = rect;
//     outline.frame = 0;
//     outline.totalFrames = totalFrames;
//     outline.componentNames = new Set();
//     outline.alpha = alpha;
//   }

//   // ReactScanInternals.activeOutlines.push(...newActiveOutlines);
//   // ReactScanInternals.activeOutlines.set;
//   // return newPreviousOutlines;
// };

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
// export const applyLabelTransform = (rect: DOMRect, estimatedTextWidth: number): DOMRect => {
//   const textHeight = 11;

//   const labelX = rect.x;
//   const labelY = rect.y - textHeight - 4;

//   return new DOMRect(
//     labelX,
//     labelY,
//     estimatedTextWidth + 4,
//     textHeight + 4
//   );
// };

//

/**
 * -  this can be done in O(nlogn) using https://en.wikipedia.org/wiki/Sweep_line_algorithm
 * - we don't merge if we need to perform over 1000 merge checks as a naive way to optimize this fn during expensive draws
 *    - this works fine since when there are lots of outlines, its likely going to be very cluttered anyway, merging does not make the situation meangifully better
 */
//

// export const mergeOverlappingLabels = (
//   labels: Array<OutlineLabel>,
//   maxMergeOps = 2000
// ): Array<OutlineLabel> => {
//   const sortedByX = labels.map((label) => ({
//     ...label,
//     rect: applyLabelTransform(label.activeOutline.rect!, label.estimatedTextWidth!),
//   }));
//   sortedByX.sort((a, b) => a.rect.x - b.rect.x);

//   const mergedLabels: Array<OutlineLabel> = [];
//   const mergedSet = new Set<OutlineLabel>();
//   let ops = 0;

//   for (let i = 0; i < sortedByX.length; i++) {
//     const label = sortedByX[i];
//     if (mergedSet.has(label)) continue;

//     let currentMerged: OutlineLabel = label;

//     for (
//       let j = i + 1;
//       j < sortedByX.length &&
//       sortedByX[j].rect.x <= label.rect.x + label.rect.width &&
//       ops < maxMergeOps;
//       j++
//     ) {
//       const nextLabel = sortedByX[j];
//       if (mergedSet.has(nextLabel)) continue;

//       ops++;
//       const overlapArea = getOverlapArea(label.rect, nextLabel.rect);

//       if (overlapArea > 0) {
//         const outermostLabel = getOutermostOutline(currentMerged, nextLabel);

//         // @ts-expect-error
//         console.log('hm', currentMerged.activeOutline.groupedAggregatedRender?.size, nextLabel.activeOutline.groupedAggregatedRender?.size, currentMerged.activeOutline.groupedAggregatedRender?.size + nextLabel.activeOutline.groupedAggregatedRender?.size);

//         outermostLabel.activeOutline.groupedAggregatedRender = new Map([
//           ...currentMerged.activeOutline.groupedAggregatedRender!.entries(),
//           ...nextLabel.activeOutline.groupedAggregatedRender!.entries()
//         ]);
//         console.log('whats this',currentMerged.activeOutline.groupedAggregatedRender?.values(), nextLabel.activeOutline.groupedAggregatedRender?.values());

//         outermostLabel.alpha = Math.max(
//           currentMerged.alpha!,
//           nextLabel.alpha!
//         );

//         mergedSet.add(currentMerged === outermostLabel ? nextLabel : currentMerged);
//         currentMerged = outermostLabel;
//       }
//     }

//     mergedLabels.push(currentMerged);
//   }

//   return mergedLabels;
// };

export interface MergedOutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: Array<'unstable' | 'commit' | 'unnecessary'>;
  groupedAggregatedRender: Array<AggregatedRender>;
  rect: DOMRect;
}

/**
 * Merge overlapping labels into a new array of MergedOutlineLabel.
 * If two (or more) labels overlap, they are combined into a single label.
 *
 * Steps:
 * 1) Transform and sort.
 * 2) Iteratively merge overlapping labels.
 * 3) Create new combined labels without mutating the original ones.
 */
export const mergeOverlappingLabels = (
  labels: Array<OutlineLabel>,
  maxMergeOps = 1000000000,
): Array<MergedOutlineLabel> => {
  if (labels.length <= 1) {
    return labels.map((label) => toMergedLabel(label));
  }

  // 1) Transform each label’s rect first
  const transformed = labels.map((label) => ({
    original: label,
    rect: applyLabelTransform(
      label.activeOutline.rect!,
      label.estimatedTextWidth!,
    ),
  }));

  // 2) Sort by rect.x
  transformed.sort((a, b) => a.rect.x - b.rect.x);

  const mergedLabels: Array<MergedOutlineLabel> = [];
  const mergedSet = new Set<number>(); // Track indices of merged labels
  let ops = 0;

  // 3) Attempt merges
  for (let i = 0; i < transformed.length; i++) {
    if (mergedSet.has(i)) continue;

    // currentMerged is the current combined label we're building
    let currentMerged = toMergedLabel(
      transformed[i].original,
      transformed[i].rect,
    );

    for (
      let j = i + 1;
      j < transformed.length &&
      ops < maxMergeOps &&
      transformed[j].rect.x <= currentMerged.rect.x + currentMerged.rect.width;
      j++
    ) {
      if (mergedSet.has(j)) continue;

      // Check overlap with the current merged rect
      const nextRect = transformed[j].rect;
      const overlapArea = getOverlapArea(currentMerged.rect, nextRect);
      if (overlapArea > 0) {
        ops++;

        const nextLabel = toMergedLabel(transformed[j].original, nextRect);
        // Create a new merged label that encloses both
        currentMerged = mergeTwoLabels(currentMerged, nextLabel);

        // Mark the j-th label as merged
        mergedSet.add(j);
      }
    }

    // If currentMerged wasn't merged into another label, push it to final
    // We know currentMerged is a MergedOutlineLabel
    mergedLabels.push(currentMerged);
  }

  return mergedLabels;
};

/**
 * Convert an original OutlineLabel into the simplified MergedOutlineLabel format.
 */
function toMergedLabel(
  label: OutlineLabel,
  rectOverride?: DOMRect,
): MergedOutlineLabel {
  const rect =
    rectOverride ??
    applyLabelTransform(label.activeOutline.rect!, label.estimatedTextWidth!);
  // Convert groupedAggregatedRender map to array
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

/**
 * Merge two MergedOutlineLabels into a single new MergedOutlineLabel.
 */
function mergeTwoLabels(
  a: MergedOutlineLabel,
  b: MergedOutlineLabel,
): MergedOutlineLabel {
  // Compute bounding rect that encloses both
  const mergedRect = getBoundingRect(a.rect, b.rect);

  // Combine groupedAggregatedRender arrays
  const mergedGrouped = a.groupedAggregatedRender.concat(
    b.groupedAggregatedRender,
  );

  // Combine reasons (unique)
  const mergedReasons = Array.from(new Set([...a.reasons, ...b.reasons]));

  return {
    alpha: Math.max(a.alpha, b.alpha),
    // Keep color from "outermost" label: define "outermost" as the one with larger rect area or just pick 'a'.
    // If you'd rather pick based on area, compute area and pick:
    ...pickColorFromOutermost(a, b),
    reasons: mergedReasons,
    groupedAggregatedRender: mergedGrouped,
    rect: mergedRect,
  };
}

/**
 * Return the bounding DOMRect that encloses both r1 and r2.
 */
function getBoundingRect(r1: DOMRect, r2: DOMRect): DOMRect {
  const x1 = Math.min(r1.x, r2.x);
  const y1 = Math.min(r1.y, r2.y);
  const x2 = Math.max(r1.x + r1.width, r2.x + r2.width);
  const y2 = Math.max(r1.y + r1.height, r2.y + r2.height);
  return new DOMRect(x1, y1, x2 - x1, y2 - y1);
}

/**
 * Pick color from the outermost label. "Outermost" means largest area.
 */
function pickColorFromOutermost(a: MergedOutlineLabel, b: MergedOutlineLabel) {
  const areaA = a.rect.width * a.rect.height;
  const areaB = b.rect.width * b.rect.height;
  return areaA >= areaB ? { color: a.color } : { color: b.color };
}

/**
 * Compute overlap area between two rects.
 */
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

// export const getOverlapArea = (rect1: DOMRect, rect2: DOMRect): number => {
//   const xOverlap = Math.max(
//     0,
//     Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
//   );
//   const yOverlap = Math.max(
//     0,
//     Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
//   );
//   return xOverlap * yOverlap;
// };

// export const getOutermostOutline = (
//   label1: OutlineLabel,
//   label2: OutlineLabel
// ): OutlineLabel => {
//   const area1 = label1.activeOutline.rect!.width * label1.activeOutline.rect!.height;
//   const area2 = label2.activeOutline.rect!.width * label2.activeOutline.rect!.height;

//   return area1 >= area2 ? label1 : label2;
// };
