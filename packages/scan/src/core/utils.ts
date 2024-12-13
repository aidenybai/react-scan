import { type Fiber } from 'react-reconciler';
import { getType, traverseFiber } from 'bippy';
import { ignoredProps, ReactScanInternals } from '..';
import type { Render } from './instrumentation';

export const getLabelText = (renders: Array<Render>) => {
  let labelText = '';

  const components = new Map<
    string,
    {
      count: number;
      trigger: boolean;
      forget: boolean;
      time: number;
    }
  >();

  for (let i = 0, len = renders.length; i < len; i++) {
    const render = renders[i];
    const name = render.name;
    if (!name?.trim()) continue;

    const { count, trigger, forget, time } = components.get(name) ?? {
      count: 0,
      trigger: false,
      forget: false,
      time: 0,
    };
    components.set(name, {
      count: count + render.count,
      trigger: trigger || render.trigger,
      forget: forget || render.forget,
      time: time + render.time,
    });
  }

  const sortedComponents = Array.from(components.entries()).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  const parts: Array<string> = [];
  for (const [name, { count, forget, time }] of sortedComponents) {
    let text = name;
    if (count > 1) {
      text += ` ×${count}`;
    }
    if (time >= 0.01 && count > 0) {
      text += ` (${time.toFixed(2)}ms)`;
    }

    if (forget) {
      text = `${text} ✨`;
    }
    parts.push(text);
  }

  labelText = parts.join(' ');

  if (!labelText.length) return null;
  if (labelText.length > 40) {
    labelText = `${labelText.slice(0, 40)}…`;
  }
  return labelText;
};

export const addFiberToSet = (fiber: Fiber, set: Set<Fiber>) => {
  if (fiber.alternate && set.has(fiber.alternate)) {
    // then the alternate tree fiber exists in the weakset, don't double count the instance
    return;
  }

  set.add(fiber);
};

export const isValidFiber = (fiber: Fiber) => {
  if (ignoredProps.has(fiber.memoizedProps)) {
    return false;
  }

  const allowList = ReactScanInternals.componentAllowList;
  const shouldAllow =
    allowList?.has(fiber.type) ?? allowList?.has(fiber.elementType);

  if (shouldAllow) {
    const parent = traverseFiber(
      fiber,
      (node) => {
        const options =
          allowList?.get(node.type) ?? allowList?.get(node.elementType);
        return options?.includeChildren;
      },
      true,
    );
    if (!parent && !shouldAllow) return false;
  }
  return true;
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
    renderData.time += firstRender.time;
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
