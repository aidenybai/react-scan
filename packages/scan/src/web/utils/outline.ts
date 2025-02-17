// THIS FILE WILL BE DELETED

import type { Fiber } from 'bippy';
import type { OutlineKey } from '~core/index';
import type { AggregatedChange } from '~core/instrumentation';

export interface OutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: number; // based on Reason enum
  labelText: string;
  textWidth: number;
  activeOutline: Outline;
}

// using intersection observer lets us get the boundingClientRect asynchronously without forcing a reflow.
// The browser can internally optimize the bounding rect query, so this will be faster then meticulously
// Batching getBoundingClientRect at the right time in the browser rendering pipeline.
// batchGetBoundingRects function can return in sub <10ms under good conditions, but may take much longer under poor conditions.
// We interpolate the outline rects to avoid the appearance of jitter
// reference: https://w3c.github.io/IntersectionObserver/
/**
 *
 * @deprecated use getBatchedRectMap
 */
export const batchGetBoundingRects = (
  elements: Array<Element>,
): Promise<Map<Element, DOMRect>> => {
  return new Promise((resolve) => {
    const results = new Map<Element, DOMRect>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target;
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

type ComponentName = string;

export interface Outline {
  domNode: Element;
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

export enum RenderPhase {
  Mount = 0b001,
  Update = 0b010,
  Unmount = 0b100,
}

export const RENDER_PHASE_STRING_TO_ENUM = {
  mount: RenderPhase.Mount,
  update: RenderPhase.Update,
  unmount: RenderPhase.Unmount,
} as const;

export interface AggregatedRender {
  name: ComponentName;
  frame: number | null;
  phase: number; // union of RenderPhase
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

export interface MergedOutlineLabel {
  alpha: number;
  color: { r: number; g: number; b: number };
  reasons: number;
  groupedAggregatedRender: Array<AggregatedRender>;
  rect: DOMRect;
}
