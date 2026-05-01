import { REACT_TOTAL_NUM_LANES, SCHEDULER_PRIORITY_NAMES } from './constants';
import type { Lanes, ReactRendererWithProfiling } from './types';

export interface LaneLabelTranslator {
  laneLabels: (lanes: Lanes | undefined) => Array<string> | undefined;
  priorityName: (priorityLevel: number | undefined) => string | undefined;
}

export interface LaneLabelTranslatorResult {
  translator: LaneLabelTranslator;
  /** `true` iff a renderer exposed a non-empty `getLaneLabelMap()`. */
  hasLaneLabelMap: boolean;
}

const noLaneLabels = (): undefined => undefined;

const priorityNameFromLevel = (priorityLevel: number | undefined): string | undefined => {
  if (priorityLevel == null) return undefined;
  return SCHEDULER_PRIORITY_NAMES[priorityLevel];
};

/**
 * Read the lane→label map from the renderer (cached per attach), and return
 * helpers that translate the bitmask + priority level. `priorityName` works
 * even when the renderer doesn't expose `getLaneLabelMap` (older React,
 * non-DOM renderers): the priority enum is part of the Scheduler package,
 * not the lane label map.
 *
 * Multi-renderer caveat: we take the first non-empty `getLaneLabelMap()`
 * we find and use it for ALL renderers' lane bitmasks. In practice every
 * renderer that ships with React shares the same lane semantics (they're
 * defined in `react-reconciler`), so this is safe. If you mix custom
 * renderers with materially different lane assignments, the labels for
 * the "loser" renderers' bitmasks may be wrong.
 *
 * Returns `hasLaneLabelMap: true` iff a real (non-noop) translator was
 * built. Callers can use this to skip subsequent rebuild attempts.
 */
export const createLaneLabelTranslator = (
  renderers: Iterable<ReactRendererWithProfiling>,
): LaneLabelTranslatorResult => {
  let laneToLabel: Map<number, string> | null = null;
  for (const renderer of renderers) {
    if (typeof renderer.getLaneLabelMap !== 'function') continue;
    try {
      const map = renderer.getLaneLabelMap();
      if (map && map.size > 0) {
        laneToLabel = map;
        break;
      }
    } catch {}
  }
  if (!laneToLabel) {
    return {
      translator: { laneLabels: noLaneLabels, priorityName: priorityNameFromLevel },
      hasLaneLabelMap: false,
    };
  }
  const resolvedMap = laneToLabel;

  const laneLabels = (lanes: Lanes | undefined): Array<string> | undefined => {
    if (lanes == null || lanes === 0) return undefined;
    const labels: Array<string> = [];
    let lane = 1;
    for (let index = 0; index < REACT_TOTAL_NUM_LANES; index++) {
      if (lane & lanes) {
        const label = resolvedMap.get(lane);
        if (label) labels.push(label);
      }
      lane *= 2;
    }
    return labels.length > 0 ? labels : undefined;
  };

  return {
    translator: { laneLabels, priorityName: priorityNameFromLevel },
    hasLaneLabelMap: true,
  };
};
