// @ts-nocheck
import {
  type Fiber,
  ForwardRefTag,
  MemoComponentTag,
  SimpleMemoComponentTag,
  getDisplayName,
  getType,
} from 'bippy';
import { ReactScanInternals } from '~core/index';
import type { AggregatedChange, AggregatedRender, Render } from './instrumentation';
import { IS_CLIENT } from '~web/utils/constants';

/**
 * Resolves a display name from a Fiber node, correctly handling:
 *  - React.memo   (MemoComponentTag=10, SimpleMemoComponentTag=15):
 *      fiber.type = { $$typeof, type: ActualComponent, compare }
 *  - React.forwardRef (ForwardRefTag=11):
 *      fiber.type = { $$typeof, render: ActualComponent }
 *  - Higher-Order Components: fiber.type.displayName e.g. "connect(Foo)"
 *
 * Why bippy's getDisplayName(fiber) alone fails for these cases:
 *   For memo/forwardRef, fiber.type is a wrapper *object*, not a function.
 *   bippy checks .displayName and .name on that object — but those are not
 *   set for anonymous wrappers, so it returns null and the fiber gets dropped
 *   by the `if (!name) return` guard in outlineFiber().
 */
export function getFiberName(fiber: Fiber): string | null {
  const { tag, type } = fiber;
  if (!type) return null;

  // Fast path: plain function / class components
  if (typeof type === 'function') {
    return (type as { displayName?: string; name?: string }).displayName ||
           (type as { name?: string }).name ||
           null;
  }

  // React.memo — tag 10 (MemoComponent) or tag 15 (SimpleMemoComponent)
  if (tag === MemoComponentTag || tag === SimpleMemoComponentTag) {
    const inner = (type as { type?: unknown }).type;
    if (inner && typeof inner === 'function') {
      return (
        (inner as { displayName?: string }).displayName ||
        (inner as { name?: string }).name ||
        null
      );
    }
    // devtools may set displayName on the wrapper object itself
    return (type as { displayName?: string }).displayName || null;
  }

  // React.forwardRef — tag 11
  if (tag === ForwardRefTag) {
    const render = (type as { render?: unknown }).render;
    // type.displayName is set by forwardRef(fn) when fn is named
    const wrapperName = (type as { displayName?: string }).displayName;
    if (wrapperName) return wrapperName;
    if (render && typeof render === 'function') {
      return (
        (render as { displayName?: string }).displayName ||
        (render as { name?: string }).name ||
        null
      );
    }
    return null;
  }

  // Generic HOC or other wrapper — bippy may resolve "connect(MyComponent)"
  const bippyName = getDisplayName(type);
  if (bippyName) return bippyName;

  // Last resort: walk one level into .type or .render
  const innerFallback =
    (type as { type?: unknown }).type ||
    (type as { render?: unknown }).render;
  if (innerFallback && typeof innerFallback === 'function') {
    return (
      (innerFallback as { displayName?: string }).displayName ||
      (innerFallback as { name?: string }).name ||
      null
    );
  }

  return null;
}

export const aggregateChanges = (
  changes: Array<Change>,
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
    result += `, ${group[i].name}`;
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

  const componentsByCount = new Map<
    number,
    Array<{ name: string; forget: boolean; time: number }>
  >();

  for (const aggregatedRender of groupedAggregatedRenders) {
    const { forget, time, aggregatedCount, name } = aggregatedRender;
    if (!componentsByCount.has(aggregatedCount)) {
      componentsByCount.set(aggregatedCount, []);
    }
    const components = componentsByCount.get(aggregatedCount);
    if (components) {
      components.push({ name, forget, time: time ?? 0 });
    }
  }

  const sortedCounts = Array.from(componentsByCount.keys()).sort(descending);

  const parts: Array<string> = [];
  let cumulativeTime = 0;
  for (const count of sortedCounts) {
    const componentGroup = componentsByCount.get(count);
    if (!componentGroup) continue;

    let text = getComponentGroupNames(componentGroup);
    const totalTime = getComponentGroupTotalTime(componentGroup);
    const hasForget = componentGroupHasForget(componentGroup);

    cumulativeTime += totalTime;

    if (componentGroup.length > 4) {
      text += '…';
    }

    if (count > 1) {
      text += ` × ${count}`;
    }

    if (hasForget) {
      text = `✨${text}`;
    }

    parts.push(text);
  }

  labelText = parts.join(', ');

  if (!labelText.length) return null;

  if (labelText.length > 40) {
    labelText = `${labelText.slice(0, 40)}…`;
  }

  if (cumulativeTime >= 0.01) {
    labelText += ` (${Number(cumulativeTime.toFixed(2))}ms)`;
  }

  return labelText;
};

export const updateFiberRenderData = (fiber: Fiber, renders: Array<Render>) => {
  ReactScanInternals.options.value.onRender?.(fiber, renders);
  const type = getType(fiber.type) || fiber.type;
  if (type && (typeof type === 'function' || typeof type === 'object')) {
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
  type: unknown;
  changes?: Array<RenderChange>;
}

export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

export const not_globally_unique_generateId = () => {
  if (!IS_CLIENT) {
    return '0';
  }

  // @ts-expect-error
  if (window.reactScanIdCounter === undefined) {
    // @ts-expect-error
    window.reactScanIdCounter = 0;
  }
  // @ts-expect-error
  return `${++window.reactScanIdCounter}`;
};

export const playNotificationSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const options = {
    type: 'sine' as OscillatorType,
    freq: [
      392,
      //  523.25,
      600,
      //  659.25
    ],
    duration: 0.3,
    gain: 0.12,
  };

  const frequencies = options.freq;
  const timePerNote = options.duration / frequencies.length;

  frequencies.forEach((freq, i) => {
    oscillator.frequency.setValueAtTime(
      freq,
      audioContext.currentTime + i * timePerNote,
    );
  });

  oscillator.type = options.type;
  gainNode.gain.setValueAtTime(options.gain, audioContext.currentTime);

  gainNode.gain.setTargetAtTime(
    0,
    audioContext.currentTime + options.duration * 0.7,
    0.05,
  );

  oscillator.start();
  oscillator.stop(audioContext.currentTime + options.duration);
};
