import type { Render } from '../../instrumentation';
import { getLabelText } from '../../utils';

export const log = (renders: Array<Render>) => {
  const logMap = new Map<
    string,
    Array<{ prev: unknown; next: unknown; type: string; unstable: boolean }>
  >();
  for (let i = 0, len = renders.length; i < len; i++) {
    const render = renders[i];

    if (!render.componentName) continue;

    const changeLog = logMap.get(render.componentName) ?? [];
    renders;
    const labelText = getLabelText([
      {
        aggregatedCount: 1,

        computedKey: null,
        name: render.componentName,
        frame: null,
        ...render,
        changes: {
          type: new Set(render.changes.map((change) => change.type)),
          unstable: render.changes.some((change) => change.unstable),
        },
        phase: new Set([render.phase]),
      },
    ]);
    if (!labelText) continue;

    let prevChangedProps: Record<string, any> | null = null;
    let nextChangedProps: Record<string, any> | null = null;

    if (render.changes) {
      for (let i = 0, len = render.changes.length; i < len; i++) {
        const { name, prevValue, nextValue, unstable, type } =
          render.changes[i];
        if (type === 'props') {
          prevChangedProps ??= {};
          nextChangedProps ??= {};
          prevChangedProps[`${unstable ? '⚠️' : ''}${name} (prev)`] = prevValue;
          nextChangedProps[`${unstable ? '⚠️' : ''}${name} (next)`] = nextValue;
        } else {
          changeLog.push({
            prev: prevValue,
            next: nextValue,
            type,
            unstable,
          });
        }
      }
    }

    if (prevChangedProps && nextChangedProps) {
      changeLog.push({
        prev: prevChangedProps,
        next: nextChangedProps,
        type: 'props',
        unstable: false,
      });
    }

    logMap.set(labelText, changeLog);
  }
  for (const [name, changeLog] of Array.from(logMap.entries())) {
    // eslint-disable-next-line no-console
    console.group(
      `%c${name}`,
      'background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;',
    );
    for (const { type, prev, next, unstable } of changeLog) {
      // eslint-disable-next-line no-console
      console.log(`${type}:`, unstable ? '⚠️' : '', prev, '!==', next);
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
    'Try React Scan Monitoring to target performance issues in production: https://react-scan.com/monitoring',
  );
};
