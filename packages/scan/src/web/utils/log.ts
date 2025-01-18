// @ts-nocheck
import { ChangeReason, type Render } from '~core/instrumentation';
import { getLabelText } from '~core/utils';

export const log = (renders: Array<Render>) => {
  const logMap = new Map<
    string,
    Array<{ prev: unknown; next: unknown; type: string; unstable?: boolean }>
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
          // TODO(Alexis): use a faster reduction method
          type: render.changes.reduce((set, change) => set | change.type, 0),
          unstable: render.changes.some((change) => change.unstable),
        },
        phase: render.phase,
        computedCurrent: null,
      },
    ]);
    if (!labelText) continue;

    let prevChangedProps: Record<string, unknown> | null = null;
    let nextChangedProps: Record<string, unknown> | null = null;

    if (render.changes) {
      for (let i = 0, len = render.changes.length; i < len; i++) {
        const { name, prevValue, nextValue, unstable, type } =
          render.changes[i];
        if (type === ChangeReason.Props) {
          prevChangedProps ??= {};
          nextChangedProps ??= {};
          prevChangedProps[`${unstable ? '⚠️' : ''}${name} (prev)`] = prevValue;
          nextChangedProps[`${unstable ? '⚠️' : ''}${name} (next)`] = nextValue;
        } else {
          changeLog.push({
            prev: prevValue,
            next: nextValue,
            type: type === ChangeReason.Context ? 'context' : 'state',
            unstable: unstable ?? false,
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
    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.group(
      `%c${name}`,
      'background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;',
    );
    for (const { type, prev, next, unstable } of changeLog) {
      // biome-ignore lint/suspicious/noConsole: Intended debug output
      console.log(`${type}:`, unstable ? '⚠️' : '', prev, '!==', next);
    }
    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.groupEnd();
  }
};

export const logIntro = () => {
  // biome-ignore lint/suspicious/noConsole: Intended debug output
  console.log(
    '%c[·] %cReact Scan',
    'font-weight:bold;color:#7a68e8;font-size:20px;',
    'font-weight:bold;font-size:14px;',
  );
  // biome-ignore lint/suspicious/noConsole: Intended debug output
  console.log(
    'Try React Scan Monitoring to target performance issues in production: https://react-scan.com/monitoring',
  );
};
