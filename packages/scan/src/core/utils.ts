import type { Render } from './instrumentation/index';

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
