import type { Fiber } from 'react-reconciler';
import type * as React from 'react';
import { type Signal, signal } from '@preact/signals';
import {
  getDisplayName,
  getRDTHook,
  getNearestHostFiber,
  getTimings,
  getType,
  isCompositeFiber,
  isInstrumentationActive,
  traverseFiber,
  detectReactBuildType,
} from 'bippy';
import {
  type ActiveOutline,
  flushOutlines,
  type PendingOutline,
} from '@web-utils/outline';
import { log, logIntro } from '@web-utils/log';
import {
  createInspectElementStateMachine,
  type States,
} from '@web-inspect-element/inspect-state-machine';
import { playGeigerClickSound } from '@web-utils/geiger';
import { ICONS } from '@web-assets/svgs/svgs';
import { updateFiberRenderData, type RenderData } from 'src/core/utils';
import { initReactScanOverlay } from './web/overlay';
import { createInstrumentation, type Render } from './instrumentation';
import { createToolbar } from './web/toolbar';
import type { InternalInteraction } from './monitor/types';
import { type getSession } from './monitor/utils';
import styles from './web/assets/css/styles.css';

let toolbarContainer: HTMLElement | null = null;

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
   * Force React Scan to run in production (not recommended)
   *
   * @default false
   */
  dangerouslyForceRunInProduction?: boolean;

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
   * @deprecated
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
  route: string | null;
  apiKey: string | null;
  commit: string | null;
  branch: string | null;
}

interface StoreType {
  wasDetailsOpen: Signal<boolean>;
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
  wasDetailsOpen: signal(true),
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
    dangerouslyForceRunInProduction: false,
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

  const previousOptions = ReactScanInternals.options.value;

  ReactScanInternals.options.value = {
    ...ReactScanInternals.options.value,
    ...options,
  };

  if (previousOptions.showToolbar && !options.showToolbar) {
    if (toolbarContainer) {
      toolbarContainer.remove();
      toolbarContainer = null;
    }
  }
};

export const getOptions = () => ReactScanInternals.options;

export const reportRender = (fiber: Fiber, renders: Array<Render>) => {
  const reportFiber = fiber;
  const { selfTime } = getTimings(fiber);
  const displayName = getDisplayName(fiber.type);

  Store.lastReportTime.value = performance.now();

  const currentFiberData = Store.reportData.get(reportFiber) ?? {
    count: 0,
    time: 0,
    renders: [],
    displayName,
    type: null,
  };

  currentFiberData.count =
    Number(currentFiberData.count || 0) + Number(renders.length);
  currentFiberData.time =
    Number(currentFiberData.time || 0) + Number(selfTime || 0);
  currentFiberData.renders = renders;

  Store.reportData.set(reportFiber, currentFiberData);

  if (displayName && ReactScanInternals.options.value.report) {
    const existingLegacyData = Store.legacyReportData.get(displayName) ?? {
      count: 0,
      time: 0,
      renders: [],
      displayName: null,
      type: getType(fiber.type) || fiber.type,
    };

    existingLegacyData.count =
      Number(existingLegacyData.count || 0) + Number(renders.length);
    existingLegacyData.time =
      Number(existingLegacyData.time || 0) + Number(selfTime || 0);
    existingLegacyData.renders = renders;

    Store.legacyReportData.set(displayName, existingLegacyData);
  }
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

let flushInterval: ReturnType<typeof setInterval>;
const startFlushOutlineInterval = (ctx: CanvasRenderingContext2D) => {
  clearInterval(flushInterval);
  setInterval(() => {
    requestAnimationFrame(() => {
      flushOutlines(ctx);
    });
  }, 30);
};
export const start = () => {
  if (typeof window === 'undefined') return;

  const audioContext =
    typeof window !== 'undefined'
      ? new (
          window.AudioContext ||
          // @ts-expect-error -- This is a fallback for Safari
          window.webkitAudioContext
        )()
      : null;

  let ctx: ReturnType<typeof initReactScanOverlay> | null = null;
  // TODO: dynamic enable, and inspect-off check

  const instrumentation = createInstrumentation('devtools', {
    onActive() {
      if (!Store.monitor.value) {
        const rdtHook = getRDTHook();
        let isProduction = false;
        for (const renderer of rdtHook.renderers.values()) {
          const buildType = detectReactBuildType(renderer);
          if (buildType === 'production') {
            isProduction = true;
          }
        }
        if (
          isProduction &&
          !ReactScanInternals.options.value.dangerouslyForceRunInProduction
        ) {
          setOptions({ enabled: false, showToolbar: false });
          return;
        }

        const existingRoot = document.querySelector('react-scan-root');
        if (existingRoot) {
          return;
        }

        const container = document.createElement('div');
        container.id = 'react-scan-root';

        const shadow = container.attachShadow({ mode: 'open' });

        const fragment = document.createDocumentFragment();

        const cssStyles = document.createElement('style');
        cssStyles.textContent = styles;

        const iconSprite = new DOMParser().parseFromString(
          ICONS,
          'image/svg+xml',
        ).documentElement;
        shadow.appendChild(iconSprite);

        const root = document.createElement('div');
        root.id = 'react-scan-toolbar-root';
        root.className = 'absolute z-2147483647';

        fragment.appendChild(cssStyles);
        fragment.appendChild(root);

        shadow.appendChild(fragment);

        document.documentElement.appendChild(container);

        ctx = initReactScanOverlay();
        if (!ctx) return;
        startFlushOutlineInterval(ctx);

        createInspectElementStateMachine(shadow);

        globalThis.__REACT_SCAN__ = {
          ReactScanInternals,
        };

        if (ReactScanInternals.options.value.showToolbar) {
          toolbarContainer = createToolbar(shadow);
        }

        container.setAttribute('part', 'scan-root');

        const mainStyles = document.createElement('style');
        mainStyles.textContent = `
          html[data-theme="light"] react-scan-root::part(scan-root) {
            --icon-color: rgba(0, 0, 0, 0.8);
          }

          html[data-theme="dark"] react-scan-root::part(scan-root) {
            --icon-color: rgba(255, 255, 255, 0.8);
          }
        `;
        document.head.appendChild(mainStyles);

        const existingOverlay = document.querySelector('react-scan-overlay');
        if (existingOverlay) {
          return;
        }
        const overlayElement = document.createElement('react-scan-overlay');

        document.documentElement.appendChild(overlayElement);

        logIntro();
      }
    },
    onCommitStart() {
      ReactScanInternals.options.value.onCommitStart?.();
    },
    onError(error) {
      // eslint-disable-next-line no-console
      console.error('[React Scan] Error instrumenting:', error);
    },
    isValidFiber,
    onRender(fiber, renders) {
      if (Boolean(ReactScanInternals.instrumentation?.isPaused.value) || !ctx) {
        // don't draw if it's paused
        return;
      }
      updateFiberRenderData(fiber, renders);

      if (isCompositeFiber(fiber)) {
        reportRender(fiber, renders);
      }

      if (ReactScanInternals.options.value.log) {
        log(renders);
      }

      ReactScanInternals.options.value.onRender?.(fiber, renders);

      for (let i = 0, len = renders.length; i < len; i++) {
        const render = renders[i];
        const domFiber = getNearestHostFiber(fiber);
        if (!domFiber || !domFiber.stateNode) continue;

        ReactScanInternals.scheduledOutlines.push({
          domNode: domFiber.stateNode,
          renders,
        });

        // - audio context can take up an insane amount of cpu, todo: figure out why
        // - we may want to take this out of hot path
        if (ReactScanInternals.options.value.playSound && audioContext) {
          const renderTimeThreshold = 10;
          const amplitude = Math.min(
            1,
            ((render.time ?? 0) - renderTimeThreshold) /
              (renderTimeThreshold * 2),
          );
          playGeigerClickSound(audioContext, amplitude);
        }
      }
    },
    onCommitFinish() {
      ReactScanInternals.options.value.onCommitFinish?.();
    },
  });

  ReactScanInternals.instrumentation = instrumentation;

  // TODO: add an visual error indicator that it didn't load
  if (!Store.monitor.value) {
    setTimeout(() => {
      if (isInstrumentationActive()) return;
      // eslint-disable-next-line no-console
      console.error(
        '[React Scan] Failed to load. Must import React Scan before React runs.',
      );
    }, 5000);
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
