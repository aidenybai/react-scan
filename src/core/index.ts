import type { Fiber, FiberRoot } from 'react-reconciler';
import * as React from 'react';
import { registerDevtoolsHook } from './monitor/fiber';
import { type Render, monitor } from './monitor';

interface Options {
  /**
   * Enable/disable scanning
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Include children of a component applied with withScan
   *
   * @default true
   */
  includeChildren?: boolean;

  onMonitorStart?: () => void;
  onMonitorFinish?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onPaintStart?: () => void;
  onPaintFinish?: () => void;
}

interface Internals {
  onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
  isProd: boolean;
  isInIframe: boolean;
  isPaused: boolean;
  componentAllowList: WeakMap<React.ComponentType<any>, Options> | null;
  options: Options;
  renders: Render[];
}

export const ReactScanInternals: Internals = {
  onCommitFiberRoot: (_rendererID: number, _root: FiberRoot): void => {
    /**/
  },
  isProd: '_self' in React.createElement('div'),
  isInIframe: window.self !== window.top,
  isPaused: false,
  componentAllowList: null,
  options: {
    enabled: true,
    includeChildren: true,
  },
  renders: [],
};

if (typeof window !== 'undefined') {
  window.__REACT_SCAN__ = { ReactScanInternals };
  registerDevtoolsHook({
    onCommitFiberRoot: (rendererID, root) => {
      ReactScanInternals.onCommitFiberRoot(rendererID, root);
    },
  });
}

export const setOptions = (options: Options) => {
  ReactScanInternals.options = {
    ...ReactScanInternals.options,
    ...options,
  };
};

export const getOptions = () => ReactScanInternals.options;

export const log = (fiber: Fiber, render: Render) => {
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
};

export const handleMonitor = () => {
  const { options } = ReactScanInternals;
  monitor(
    () => {
      options.onMonitorStart?.();
    },
    (fiber, render) => {
      ReactScanInternals.renders.push(render);
    },
    () => {
      options.onMonitorFinish?.();
    },
  );
};

export const withScan = <T>(
  component: React.ComponentType<T>,
  options: Options = {},
) => {
  setOptions(options);
  const { isInIframe, isProd, componentAllowList } = ReactScanInternals;
  if (isInIframe || isProd || options.enabled === false) return component;
  if (!componentAllowList) {
    ReactScanInternals.componentAllowList = new WeakMap<
      React.ComponentType<any>,
      Options
    >();
  }
  if (componentAllowList) {
    componentAllowList.set(component, { ...options });
  }

  handleMonitor();

  return component;
};

export const scan = (options: Options = {}) => {
  setOptions(options);
  const { isInIframe, isProd } = ReactScanInternals;
  if (isInIframe || isProd || options.enabled === false) return;

  handleMonitor();
};
