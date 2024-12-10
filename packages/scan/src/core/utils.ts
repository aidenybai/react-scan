import { type Fiber } from 'react-reconciler';
import {
  type ClassValue,
  clsx,
} from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Render } from './instrumentation';

export const cn = (...inputs: Array<ClassValue>): string => {
  return twMerge(clsx(inputs));
};

export const getLabelText = (renders: Array<Render>) => {
  let labelText = '';

  const components = new Map<
    string,
    {
      count: number;
      trigger: boolean;
      forget: boolean;
    }
  >();

  for (let i = 0, len = renders.length; i < len; i++) {
    const render = renders[i];
    const name = render.name;
    if (!name?.trim()) continue;

    const { count, trigger, forget } = components.get(name) ?? {
      count: 0,
      trigger: false,
      forget: false,
    };
    components.set(name, {
      count: count + render.count,
      trigger: trigger || render.trigger,
      forget: forget || render.forget,
    });
  }

  const sortedComponents = Array.from(components.entries()).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  const parts: Array<string> = [];
  for (const [name, { count, forget }] of sortedComponents) {
    let text = name;
    if (count > 1) {
      text += ` ×${count}`;
    }

    if (forget) {
      text = `${text} ✨`;
    }
    parts.push(text);
  }

  labelText = parts.join(' ');

  if (!labelText.length) return null;
  if (labelText.length > 20) {
    labelText = `${labelText.slice(0, 20)}…`;
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
