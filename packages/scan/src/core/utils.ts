import { getType } from 'bippy';
import { type Fiber } from 'react-reconciler';
import { ReactScanInternals } from '~core/index';
import { type AggregatedRender } from '~web/utils/outline';
import type { AggregatedChange, Render, RenderChange } from './instrumentation';

export const aggregateChanges = (
  changes: Array<RenderChange>,
  prevAggregatedChange?: AggregatedChange,
) => {
  const newChange = {
    type: prevAggregatedChange?.type ?? 0,
    unstable: prevAggregatedChange?.unstable ?? false,
  };
  for (const change of changes) {
    newChange.type |= change.type;
    newChange.unstable = newChange.unstable || (change.unstable ?? false);
  }

  return newChange;
};

export const joinAggregations = ({
  from,
  to,
}: {
  from: AggregatedRender;
  to: AggregatedRender;
}) => {
  to.changes.type |= from.changes.type;
  to.changes.unstable = to.changes.unstable || from.changes.unstable;
  to.aggregatedCount += 1;
  to.didCommit = to.didCommit || from.didCommit;
  to.forget = to.forget || from.forget;
  to.fps = to.fps + from.fps;
  to.phase |= from.phase;
  to.time = (to.time ?? 0) + (from.time ?? 0);

  to.unnecessary = to.unnecessary || from.unnecessary;
};

export const aggregateRender = (
  newRender: Render,
  prevAggregated: AggregatedRender,
) => {
  prevAggregated.changes = aggregateChanges(
    newRender.changes,
    prevAggregated.changes,
  );
  prevAggregated.aggregatedCount += 1;
  prevAggregated.didCommit = prevAggregated.didCommit || newRender.didCommit;
  prevAggregated.forget = prevAggregated.forget || newRender.forget;
  prevAggregated.fps = prevAggregated.fps + newRender.fps;
  prevAggregated.phase |= newRender.phase;
  prevAggregated.time = (prevAggregated.time ?? 0) + (newRender.time ?? 0);

  prevAggregated.unnecessary =
    prevAggregated.unnecessary || newRender.unnecessary;
};

function descending(a: number, b: number): number {
  return b - a;
}

interface ComponentData {
  name: string;
  forget: boolean;
  time: number;
}

function getComponentGroupNames(group: ComponentData[]): string {
  let result = group[0].name;

  const len = group.length;
  const max = Math.min(4, len);

  for (let i = 1; i < max; i++) {
    result += ', ' + group[i].name;
  }

  return result;
}

function getComponentGroupTotalTime(group: ComponentData[]): number {
  let result = group[0].time;

  for (let i = 1, len = group.length; i < len; i++) {
    result += group[i].time;
  }

  return result;
}

function componentGroupHasForget(group: ComponentData[]): boolean {
  for (let i = 0, len = group.length; i < len; i++) {
    if (group[i].forget) {
      return true;
    }
  }
  return false;
}

export const getLabelText = (
  groupedAggregatedRenders: Array<AggregatedRender>,
) => {
  let labelText = '';

  // TODO(Alexis): perhaps simplify this block up to the sorted line
  const componentsByCount = new Map<number, Array<ComponentData>>();

  for (const {
    forget,
    time,
    aggregatedCount,
    name,
  } of groupedAggregatedRenders) {
    if (!componentsByCount.has(aggregatedCount)) {
      componentsByCount.set(aggregatedCount, []);
    }
    componentsByCount
      .get(aggregatedCount)!
      .push({ name, forget, time: time ?? 0 });
  }

  const sortedCounts = Array.from(componentsByCount.keys()).sort(descending);

  const parts: Array<string> = [];
  let cumulativeTime = 0;

  for (const count of sortedCounts) {
    const componentGroup = componentsByCount.get(count)!;
    let text = getComponentGroupNames(componentGroup);
    const totalTime = getComponentGroupTotalTime(componentGroup);
    const hasForget = componentGroupHasForget(componentGroup);

    cumulativeTime += totalTime;

    if (componentGroup.length > 4) {
      text += '…';
    }

    if (count > 1) {
      text += ' ×' + count;
    }

    if (hasForget) {
      text = '✨' + text;
    }

    parts.push(text);
  }

  labelText = parts.join(', ');

  if (!labelText.length) return null;

  if (labelText.length > 40) {
    labelText = labelText.slice(0, 40) + '…';
  }

  if (cumulativeTime >= 0.01) {
    labelText += ' (' + cumulativeTime.toFixed(2) + 'ms)';
  }

  return labelText;
};

export const updateFiberRenderData = (fiber: Fiber, renders: Array<Render>) => {
  ReactScanInternals.options.value.onRender?.(fiber, renders);
  const type = getType(fiber.type) || fiber.type;
  if (type && typeof type === 'function' && typeof type === 'object') {
    const renderData = (type.renderData || {
      count: 0,
      time: 0,
      renders: [],
    }) as RenderData;
    const firstRender = renders[0];
    renderData.count += firstRender.count;
    renderData.time += firstRender.time ?? 0;
    renderData.renders.push(firstRender);
    type.renderData = renderData;
  }
};

export interface RenderData {
  count: number;
  time: number;
  renders: Array<Render>;
  displayName: string | null;
  type: React.ComponentType<any> | null;
  changes?: Array<RenderChange>;
}

export function isEqual(a: unknown, b: unknown): boolean {
  // eslint-disable-next-line no-self-compare
  return a === b || (a !== a && b !== b);
}
