import type { Fiber } from 'react-reconciler';
import * as React from 'react';
import { type Signal, signal } from '@preact/signals';
import {
  getDisplayName,
  getTimings,
  getType,
  isCompositeFiber,
  traverseFiber,
} from 'bippy';
import { createInstrumentation, type Render } from './instrumentation';
import {
  type ActiveOutline,
  flushOutlines,
  getOutline,
  type PendingOutline,
} from './web/outline';
import { logIntro } from './web/log';
import { createPerfObserver } from './web/perf-observer';
import { initReactScanOverlay } from './web/overlay';
import {
  createInspectElementStateMachine,
  type States,
} from './web/inspect-element/inspect-state-machine';
import { createToolbar } from './web/toolbar';
import { flush } from './monitor/network';
import type { InternalInteraction } from './monitor/types';
import { type getSession } from './monitor/utils';
import { addFiberToSet } from './utils';
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

  monitor?: {
    url: string;
  };

  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish?: () => void;
  onPaintStart?: (outlines: Array<PendingOutline>) => void;
  onPaintFinish?: (outlines: Array<PendingOutline>) => void;
}

interface Monitor {
  pendingRequests: number;
  url: string | null;
  apiKey: string | null;
  interactions: Array<InternalInteraction>;
  route: string | null;
  session: ReturnType<typeof getSession>;
  path: string | null;
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

interface RenderData {
  count: number;
  time: number;
  renders: Array<Render>;
  displayName: string | null;
  type: React.ComponentType<any> | null;
}

export interface Internals {
  instrumentation: ReturnType<typeof createInstrumentation> | null;
  componentAllowList: WeakMap<React.ComponentType<any>, Options> | null;
  options: Signal<Options>;
  scheduledOutlines: Array<PendingOutline>;
  activeOutlines: Array<ActiveOutline>;
  onRender: ((fiber: Fiber, renders: Array<Render>) => void) | null;
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
  // instanceTracker: new Map<string, Set<Fiber>>(),
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

  const monitor = Store.monitor.value;
  if (monitor && monitor.interactions && monitor.interactions.length > 0) {
    const latestInteraction =
      monitor.interactions[monitor.interactions.length - 1];

    let totalTime = 0;
    for (const render of renders) {
      totalTime += render.time;
    }

    const displayName = getDisplayName(fiber.type);
    if (!displayName) {
      // it may be useful to somehow report the first ancestor with a display name instead of completely ignoring
      return;
    }
    let component = latestInteraction.components.get(displayName);
    if (!component) {
      component = {
        fibers: new Set(),
        name: displayName,
        renders: 0,
        totalTime,
        retiresAllowed: 7, // allow max 7 retries before the set of components do not get reported (avoid memory leaks)
        uniqueInteractionId: latestInteraction.uniqueInteractionId,
      };
      latestInteraction.components.set(displayName, component);
    }
    addFiberToSet(fiber, component.fibers);

    component.renders += renders.length;
    if (!component.totalTime) {
      component.totalTime = 0;
    }
    component.totalTime += component.totalTime
      ? component.totalTime + totalTime
      : totalTime;
  }
};
let flushInterval: any | undefined;

export const start = () => {
  if (typeof window === 'undefined') return;
  const options = ReactScanInternals.options.value;

  let ctx: CanvasRenderingContext2D;
  let audioContext: any;

  if (!Store.monitor.value) {
    const existingOverlay = document.querySelector('react-scan-overlay');
    if (existingOverlay) {
      return;
    }
    initReactScanOverlay();
    const overlayElement = document.createElement('react-scan-overlay') as any;

    document.documentElement.appendChild(overlayElement);

    ctx = overlayElement.getContext();
    createInspectElementStateMachine();
    audioContext =
      typeof window !== 'undefined'
        ? new (window.AudioContext ||
            // @ts-expect-error -- This is a fallback for Safari
            window.webkitAudioContext)()
        : null;
    createPerfObserver();

    logIntro();
  }

  globalThis.__REACT_SCAN__ = {
    ReactScanInternals,
  };

  if (Store.monitor.value) {
    if (flushInterval) {
      clearInterval(flushInterval);
    }

    flushInterval = setInterval(() => {
      void flush();
    }, 2000);
  }

  // TODO: dynamic enable, and inspect-off check
  const instrumentation = createInstrumentation({
    onCommitStart() {
      ReactScanInternals.options.value.onCommitStart?.();
    },
    isValidFiber(fiber) {
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
    },
    onRender(fiber, renders) {
      if (ReactScanInternals.instrumentation?.isPaused.value) {
        // don't draw if it's paused
        return;
      }
      if (isCompositeFiber(fiber)) {
        reportRender(fiber, renders);
      }

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

      if (!Store.monitor.value) {
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
      }
    },
    onCommitFinish() {
      ReactScanInternals.options.value.onCommitFinish?.();
    },
  });

  ReactScanInternals.instrumentation = instrumentation;

  if (options.showToolbar && !Store.monitor.value) {
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
  if (isInIframe || options.enabled === false) return component;
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
  if (isInIframe || options.enabled === false) return;

  start();
};

export const useScan = (options: Options) => {
  React.useEffect(() => {
    scan(options);
  }, []);
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
