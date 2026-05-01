import { RANKED_BAR_CHART_WIDTH_DENOMINATOR_MIN } from '~web/constants';

interface RankedBarChartRenderEvent {
  name: string;
}

export type RankedBarChartBar =
  | { kind: 'other-frame-drop'; totalTime: number }
  | { kind: 'other-not-javascript'; totalTime: number }
  | { kind: 'other-javascript'; totalTime: number }
  | { kind: 'render'; event: RankedBarChartRenderEvent; totalTime: number };

export const getRankedBarDisplayLabel = (bar: RankedBarChartBar): string => {
  switch (bar.kind) {
    case 'other-frame-drop': {
      return 'JavaScript, DOM updates, Draw Frame';
    }
    case 'other-javascript': {
      return 'JavaScript/React Hooks';
    }
    case 'other-not-javascript': {
      return 'Update DOM and Draw New Frame';
    }
    case 'render': {
      return bar.event.name;
    }
  }
};

export const rankedBarMatchesSearch = (
  bar: RankedBarChartBar,
  trimmedQuery: string,
): boolean => {
  if (trimmedQuery === '') {
    return true;
  }
  return getRankedBarDisplayLabel(bar)
    .toLowerCase()
    .includes(trimmedQuery.toLowerCase());
};

export const filterSortedRankedBarsBySearch = <T extends RankedBarChartBar>(
  sortedBars: T[],
  query: string,
): T[] => {
  const trimmedQuery = query.trim();
  if (trimmedQuery === '') {
    return sortedBars;
  }
  return sortedBars.filter((bar) => rankedBarMatchesSearch(bar, trimmedQuery));
};

export const getSafeRankedWidthDenominator = (widthDenominator: number): number =>
  Math.max(widthDenominator, RANKED_BAR_CHART_WIDTH_DENOMINATOR_MIN);
