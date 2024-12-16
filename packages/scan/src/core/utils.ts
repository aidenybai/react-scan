import { type Fiber } from 'react-reconciler';
import { getType } from 'bippy';
import { ReactScanInternals } from '..';
import type { Render } from './instrumentation';

export const getLabelText = (renders: Array<Render>) => {
  let labelText = '';

  const components = new Map<
    string,
    {
      count: number;
      forget: boolean;
      time: number;
    }
  >();

  for (let i = 0, len = renders.length; i < len; i++) {
    const render = renders[i];
    const name = render.componentName;

    if (!name?.trim()) continue;

    const { count, forget, time } = components.get(name) ?? {
      count: 0,
      forget: false,
      time: 0,
    };
    components.set(name, {
      count: count + render.count,
      forget: forget || render.forget,
      time: time + (render.time ?? 0),
    });
  }

  const componentsByCount = new Map<
    number,
    Array<{ name: string; forget: boolean; time: number }>
  >();

  for (const [name, data] of Array.from(components.entries())) {
    const { count, forget, time } = data;
    if (!componentsByCount.has(count)) {
      componentsByCount.set(count, []);
    }
    componentsByCount.get(count)!.push({ name, forget, time });
  }

  const sortedCounts = Array.from(componentsByCount.keys()).sort(
    (a, b) => b - a,
  );

  const parts: Array<string> = [];
  let cumulativeTime = 0;
  for (const count of sortedCounts) {
    const componentGroup = componentsByCount.get(count)!;
    const names = componentGroup.map(({ name }) => name).join(', ');
    let text = names;

    const totalTime = componentGroup.reduce((sum, { time }) => sum + time, 0);
    const hasForget = componentGroup.some(({ forget }) => forget);

    cumulativeTime += totalTime;

    if (count > 1) {
      text += ` ×${count}`;
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
}
