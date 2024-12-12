import type { Fiber } from 'react-reconciler';
import type * as React from 'react';
import { type Signal, signal } from '@preact/signals';
import { getDisplayName, getTimings, getType, isCompositeFiber } from 'bippy';
import { createInstrumentation, type Render } from './instrumentation';
import {
  type ActiveOutline,
  flushOutlines,
  getOutline,
  type PendingOutline,
} from './web/outline';
import { logIntro } from './web/log';
import { initReactScanOverlay } from './web/overlay';
import {
  createInspectElementStateMachine,
  type States,
} from './web/inspect-element/inspect-state-machine';
import { createToolbar } from './web/toolbar';
import type { InternalInteraction } from './monitor/types';
import { type getSession } from './monitor/utils';
import {
  isValidFiber,
  type RenderData,
  updateFiberRenderData,
} from './utils';
import { playGeigerClickSound } from './web/geiger';

export interface Options {
  /**
   * Enable/disable scanning
   *
   * Please use the recommended way:
   * enabled: process.env.NODE_ENV === 'development',
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

  /**
   * Enable/disable geiger sound
   *
   * @default true
   */
  playSound?: boolean;

  /**
   * Log renders to the console
   *
   * @default false
   */
  log?: boolean;

  /**
   * Show toolbar bar
   *
   * If you set this to true, and set {@link enabled} to false, the toolbar will still show, but scanning will be disabled.
   *
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Render count threshold, only show
   * when a component renders more than this
   *
   * @default 0
   */
  renderCountThreshold?: number;

  /**
   * Clear aggregated fibers after this time in milliseconds
   *
   * @default 5000
   */
  resetCountTimeout?: number;

  /**
   * Maximum number of renders for red indicator
   *
   * @default 20
   */
  maxRenders?: number;

  /**
   * Report data to getReport()
   *
   * @default false
   */
  report?: boolean;

  /**
   * Always show labels
   *
   * @default false
   */
  alwaysShowLabels?: boolean;

  /**
   * Animation speed
   *
   * @default "fast"
   */
  animationSpeed?: 'slow' | 'fast' | 'off';

  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish?: () => void;
  onPaintStart?: (outlines: Array<PendingOutline>) => void;
  onPaintFinish?: (outlines: Array<PendingOutline>) => void;
}

export type MonitoringOptions = Pick<
  Options,
  | 'includeChildren'
  | 'enabled'
  | 'renderCountThreshold'
  | 'resetCountTimeout'
  | 'onCommitStart'
  | 'onCommitFinish'
  | 'onPaintStart'
  | 'onPaintFinish'
  | 'onRender'
>;

interface Monitor {
  pendingRequests: number;
  interactions: Array<InternalInteraction>;
  session: ReturnType<typeof getSession>;
  url: string | null;
  apiKey: string | null;
  route: string | null;
  path: string | null;
  commit: string | null;
  branch: string | null;
}

interface StoreType {
  isInIframe: Signal<boolean>;
  inspectState: Signal<States>;
  monitor: Signal<Monitor | null>;
  fiberRoots: WeakSet<Fiber>;
  reportData: WeakMap<Fiber, RenderData>;
  legacyReportData: Map<string, RenderData>;
  lastReportTime: Signal<number>;
}

export interface Internals {
  instrumentation: ReturnType<typeof createInstrumentation> | null;
  componentAllowList: WeakMap<React.ComponentType<any>, Options> | null;
  options: Signal<Options>;
  scheduledOutlines: Array<PendingOutline>;
  activeOutlines: Array<ActiveOutline>;
  onRender: ((fiber: Fiber, renders: Array<Render>) => void) | null;
  Store: StoreType;
}

export const Store: StoreType = {
  isInIframe: signal(
    typeof window !== 'undefined' && window.self !== window.top,
  ),
  inspectState: signal<States>({
    kind: 'uninitialized',
  }),
  monitor: signal<Monitor | null>(null),
  fiberRoots: new WeakSet<Fiber>(),
  reportData: new WeakMap<Fiber, RenderData>(),
  legacyReportData: new Map<string, RenderData>(),
  lastReportTime: signal(0),
};

export const ReactScanInternals: Internals = {
  instrumentation: null,
  componentAllowList: null,
  options: signal({
    enabled: true,
    includeChildren: true,
    playSound: false,
    log: false,
    showToolbar: true,
    renderCountThreshold: 0,
    report: undefined,
    alwaysShowLabels: false,
    animationSpeed: 'fast',
  }),
  onRender: null,
  scheduledOutlines: [],
  activeOutlines: [],
  Store,
};

export const getReport = (type?: React.ComponentType<any>) => {
  if (type) {
    for (const reportData of Array.from(Store.legacyReportData.values())) {
      if (reportData.type === type) {
        return reportData;
      }
    }
    return null;
  }
  return Store.legacyReportData;
};

export const setOptions = (options: Options) => {
  const { instrumentation } = ReactScanInternals;
  if (instrumentation) {
    instrumentation.isPaused.value = options.enabled === false;
  }

  ReactScanInternals.options.value = {
    ...ReactScanInternals.options.value,
    ...options,
  };
};

export const getOptions = () => ReactScanInternals.options;

export const reportRender = (fiber: Fiber, renders: Array<Render>) => {
  let reportFiber: Fiber;
  let prevRenderData: RenderData | undefined;

  const currentFiberData = Store.reportData.get(fiber);
  if (currentFiberData) {
    reportFiber = fiber;
    prevRenderData = currentFiberData;
  } else if (!fiber.alternate) {
    reportFiber = fiber;
    prevRenderData = undefined;
  } else {
    reportFiber = fiber.alternate;
    prevRenderData = Store.reportData.get(fiber.alternate);
  }

  const displayName = getDisplayName(fiber.type);

  Store.lastReportTime.value = performance.now();

  if (prevRenderData) {
    prevRenderData.renders.push(...renders);
  } else {
    const { selfTime } = getTimings(fiber);

    const reportData = {
      count: renders.length,
      time: selfTime,
      renders,
      displayName,
      type: null,
    };

    Store.reportData.set(reportFiber, reportData);
  }

  if (displayName && ReactScanInternals.options.value.report) {
    const prevLegacyRenderData = Store.legacyReportData.get(displayName);

    if (prevLegacyRenderData) {
      prevLegacyRenderData.renders.push(...renders);
    } else {
      const { selfTime } = getTimings(fiber);

      const reportData = {
        count: renders.length,
        time: selfTime,
        renders,
        displayName: null,
        type: getType(fiber.type) || fiber.type,
      };
      Store.legacyReportData.set(displayName, reportData);
    }
  }
};

export const start = () => {
  if (typeof window === 'undefined') return;
  const options = ReactScanInternals.options.value;

  const existingOverlay = document.querySelector('react-scan-overlay');
  if (existingOverlay) {
    return;
  }
  initReactScanOverlay();
  const overlayElement = document.createElement('react-scan-overlay') as any;

  document.documentElement.appendChild(overlayElement);

  const ctx = overlayElement.getContext();
  createInspectElementStateMachine();
  const audioContext =
    typeof window !== 'undefined'
      ? new (window.AudioContext ||
          // @ts-expect-error -- This is a fallback for Safari
          window.webkitAudioContext)()
      : null;

  logIntro();

  globalThis.__REACT_SCAN__ = {
    ReactScanInternals,
  };

  // TODO: dynamic enable, and inspect-off check
  const instrumentation = createInstrumentation({
    kind: 'devtool',
    onCommitStart() {
      ReactScanInternals.options.value.onCommitStart?.();
    },
    isValidFiber(fiber) {
      return isValidFiber(fiber);
    },
    onRender(fiber, renders) {
      if (ReactScanInternals.instrumentation?.isPaused.value) {
        // don't draw if it's paused
        return;
      }
      updateFiberRenderData(fiber, renders);

      if (isCompositeFiber(fiber)) {
        reportRender(fiber, renders);
      }

      ReactScanInternals.options.value.onRender?.(fiber, renders);

      for (let i = 0, len = renders.length; i < len; i++) {
        const render = renders[i];
        const outline = getOutline(fiber, render);
        if (!outline) continue;
        ReactScanInternals.scheduledOutlines.push(outline);

        // audio context can take up an insane amount of cpu, todo: figure out why
        if (ReactScanInternals.options.value.playSound && audioContext) {
          const renderTimeThreshold = 10;
          const amplitude = Math.min(
            1,
            (render.time - renderTimeThreshold) / (renderTimeThreshold * 2),
          );
          playGeigerClickSound(audioContext, amplitude);
        }
      }
      flushOutlines(ctx, new Map());
    },
    onCommitFinish() {
      ReactScanInternals.options.value.onCommitFinish?.();
    },
  });

  ReactScanInternals.instrumentation = instrumentation;

  if (options.showToolbar) {
    createToolbar();
  }
};

export const withScan = <T>(
  component: React.ComponentType<T>,
  options: Options = {},
) => {
  setOptions(options);
  const isInIframe = Store.isInIframe.value;
  const componentAllowList = ReactScanInternals.componentAllowList;
  if (isInIframe || (options.enabled === false && options.showToolbar !== true))
    return component;
  if (!componentAllowList) {
    ReactScanInternals.componentAllowList = new WeakMap<
      React.ComponentType<any>,
      Options
    >();
  }
  if (componentAllowList) {
    componentAllowList.set(component, { ...options });
  }

  start();

  return component;
};

export const scan = (options: Options = {}) => {
  setOptions(options);
  const isInIframe = Store.isInIframe.value;
  if (isInIframe || (options.enabled === false && options.showToolbar !== true))
    return;

  start();
};

export const useScan = (options: Options = {}) => {
  setOptions(options);
  start();
};

export const onRender = (
  type: unknown,
  _onRender: (fiber: Fiber, renders: Array<Render>) => void,
) => {
  const prevOnRender = ReactScanInternals.onRender;
  ReactScanInternals.onRender = (fiber, renders) => {
    prevOnRender?.(fiber, renders);
    if (getType(fiber.type) === type) {
      _onRender(fiber, renders);
    }
  };
};

export const ignoredProps = new WeakSet<
  Exclude<
    React.ReactNode,
    undefined | null | string | number | boolean | bigint
  >
>();

export const ignoreScan = (node: React.ReactNode) => {
  if (typeof node === 'object' && node) {
    ignoredProps.add(node);
  }
};
