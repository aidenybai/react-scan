import { describe, expect, it } from 'vitest';
import { RANKED_BAR_CHART_WIDTH_DENOMINATOR_MIN } from '~web/constants';
import {
  filterSortedRankedBarsBySearch,
  getRankedBarDisplayLabel,
  getSafeRankedWidthDenominator,
  rankedBarMatchesSearch,
  type RankedBarChartBar,
} from '~web/utils/ranked-bar-chart-search';

const renderBar = (name: string, totalTime: number): RankedBarChartBar => ({
  kind: 'render',
  event: { name },
  totalTime,
});

const otherJavascriptBar = (totalTime: number): RankedBarChartBar => ({
  kind: 'other-javascript',
  totalTime,
});

describe('getRankedBarDisplayLabel', () => {
  it('returns component name for render bars', () => {
    expect(getRankedBarDisplayLabel(renderBar('TodoList', 10))).toBe('TodoList');
  });

  it('returns fixed labels for non-render bars', () => {
    expect(getRankedBarDisplayLabel(otherJavascriptBar(5))).toBe(
      'JavaScript/React Hooks',
    );
    expect(
      getRankedBarDisplayLabel({ kind: 'other-frame-drop', totalTime: 1 }),
    ).toBe('JavaScript, DOM updates, Draw Frame');
    expect(
      getRankedBarDisplayLabel({ kind: 'other-not-javascript', totalTime: 2 }),
    ).toBe('Update DOM and Draw New Frame');
  });
});

describe('rankedBarMatchesSearch', () => {
  it('matches every bar when query is empty', () => {
    expect(rankedBarMatchesSearch(renderBar('Any', 1), '')).toBe(true);
  });

  it('matches case-insensitive substrings on component names', () => {
    expect(rankedBarMatchesSearch(renderBar('TodoListForm', 1), 'todo')).toBe(
      true,
    );
    expect(rankedBarMatchesSearch(renderBar('TodoListForm', 1), 'FORM')).toBe(
      true,
    );
    expect(rankedBarMatchesSearch(renderBar('TodoListForm', 1), 'missing')).toBe(
      false,
    );
  });

  it('matches non-render bar labels', () => {
    expect(rankedBarMatchesSearch(otherJavascriptBar(1), 'hooks')).toBe(true);
    expect(rankedBarMatchesSearch(otherJavascriptBar(1), 'java')).toBe(true);
  });
});

describe('filterSortedRankedBarsBySearch', () => {
  const sortedBars: RankedBarChartBar[] = [
    renderBar('TodoListForm', 24),
    renderBar('TodoListItem', 6),
    otherJavascriptBar(10),
  ];

  it('returns all bars for empty or whitespace query', () => {
    expect(filterSortedRankedBarsBySearch(sortedBars, '')).toEqual(sortedBars);
    expect(filterSortedRankedBarsBySearch(sortedBars, '   ')).toEqual(sortedBars);
  });

  it('returns only matching bars in original order', () => {
    expect(filterSortedRankedBarsBySearch(sortedBars, 'TodoList')).toEqual([
      renderBar('TodoListForm', 24),
      renderBar('TodoListItem', 6),
    ]);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterSortedRankedBarsBySearch(sortedBars, 'xyz')).toEqual([]);
  });
});

describe('getSafeRankedWidthDenominator', () => {
  it('returns the value when above the floor', () => {
    expect(getSafeRankedWidthDenominator(240)).toBe(240);
  });

  it('returns the minimum constant when sum is zero', () => {
    expect(getSafeRankedWidthDenominator(0)).toBe(
      RANKED_BAR_CHART_WIDTH_DENOMINATOR_MIN,
    );
  });
});
