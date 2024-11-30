import type { Render } from '../instrumentation/index';
import { getLabelText } from '../utils';

export const log = (renders: Render[]) => {
  const logMap = new Map<
    string,
    { prev: unknown; next: unknown; type: string }[]
  >();
  for (let i = 0, len = renders.length; i < len; i++) {
    const render = renders[i];

    if (!render.name) continue;

    const changeLog = logMap.get(render.name) ?? [];
    const labelText = getLabelText([render], 'dom');
    if (!labelText) continue;

    if (render.type === 'props') {
      let prevChangedProps: Record<string, any> | null = null;
      let nextChangedProps: Record<string, any> | null = null;

      if (render.changes) {
        for (let i = 0, len = render.changes.length; i < len; i++) {
          const { name, prevValue, nextValue, unstable } = render.changes[i];
          if (!unstable) continue;
          prevChangedProps ??= {};
          nextChangedProps ??= {};
          prevChangedProps[`${name} (prev)`] = prevValue;
          nextChangedProps[`${name} (next)`] = nextValue;
        }
      }

      if (!prevChangedProps || !nextChangedProps) continue;

      changeLog.push({
        prev: prevChangedProps,
        next: nextChangedProps,
        type: 'props',
      });
    }

    if (render.type === 'context') {
      if (render.changes) {
        for (let i = 0, len = render.changes.length; i < len; i++) {
          const { prevValue, nextValue, unstable } = render.changes[i];
          if (!unstable) continue;
          changeLog.push({
            prev: prevValue,
            next: nextValue,
            type: 'context',
          });
        }
      }
    }
    logMap.set(labelText, changeLog);
  }
  for (const [name, changeLog] of Array.from(logMap.entries())) {
    // eslint-disable-next-line no-console
    console.group(
      `%c${name}`,
      'background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;',
    );
    // eslint-disable-next-line no-console
    console.log('Memoize these values:');
    for (const { type, prev, next } of changeLog) {
      // eslint-disable-next-line no-console
      console.log(`${type}:`, prev, '!==', next);
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
};

export const logIntro = () => {
  // eslint-disable-next-line no-console
  console.log(
    `%c[·] %cReact Scan`,
    'font-weight:bold;color:#7a68e8;font-size:20px;',
    'font-weight:bold;font-size:14px;',
  );
  // eslint-disable-next-line no-console
  console.log(
    'Try Million Lint to automatically optimize your app: https://million.dev',
  );
};
