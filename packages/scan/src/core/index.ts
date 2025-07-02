import { type Signal, signal } from '@preact/signals';
import {
  type Fiber,
  detectReactBuildType,
  getRDTHook,
  getType,
  isInstrumentationActive,
} from 'bippy';
import type { ComponentType } from 'preact';
import type { ReactNode } from 'preact/compat';
import type { RenderData } from 'src/core/utils';
import { initReactScanInstrumentation } from 'src/new-outlines';
import styles from '~web/assets/css/styles.css';
import { createToolbar } from '~web/toolbar';
import { IS_CLIENT } from '~web/utils/constants';
import { readLocalStorage, saveLocalStorage } from '~web/utils/helpers';
import type { Outline } from '~web/utils/outline';
import type { States } from '~web/views/inspector/utils';
import type {
  ChangeReason,
  Render,
  createInstrumentation,
} from './instrumentation';
import type { InternalInteraction } from './monitor/types';
import type { getSession } from './monitor/utils';
import { startTimingTracking } from './notifications/event-tracking';
import { createHighlightCanvas } from './notifications/outline-overlay';
import packageJson from '../../package.json';

let rootContainer: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;

// @TODO: @pivanov - add back in when options are implemented
// const audioContext: AudioContext | null = null;

interface RootContainer {
  rootContainer: HTMLDivElement;
  shadowRoot: ShadowRoot;
}

const initRootContainer = (): RootContainer => {
  if (rootContainer && shadowRoot) {
    return { rootContainer, shadowRoot };
  }

  rootContainer = document.createElement('div');
  rootContainer.id = 'react-scan-root';

  shadowRoot = rootContainer.attachShadow({ mode: 'open' });

  const cssStyles = document.createElement('style');
  cssStyles.textContent = styles;

  shadowRoot.appendChild(cssStyles);

  document.documentElement.appendChild(rootContainer);

  return { rootContainer, shadowRoot };
};

// export interface UnstableOptions {
//   /**
//    * Enable/disable scanning
//    *
//    * Please use the recommended way:
//    * enabled: process.env.NODE_ENV === 'development',
//    *
//    * @default true
//    */
//   enabled?: boolean;

//   /**
//    * Force React Scan to run in production (not recommended)
//    *
//    * @default false
//    */
//   dangerouslyForceRunInProduction?: boolean;

//   /**
//    * Animation speed
//    *
//    * @default "fast"
//    */
//   animationSpeed?: 'slow' | 'fast' | 'off';

//   /**
//    * Smoothly animate the re-render outline when the element moves
//    *
//    * @default true
//    */
//   smoothlyAnimateOutlines?: boolean;

//   /**
//    * Show toolbar bar
//    *
//    * If you set this to true, and set {@link enabled} to false, the toolbar will still show, but scanning will be disabled.
//    *
//    * @default true
//    */
//   showToolbar?: boolean;
// }

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
   * Force React Scan to run in production (not recommended)
   *
   * @default false
   */
  dangerouslyForceRunInProduction?: boolean;
  /**
   * Log renders to the console
   *
   * WARNING: This can add significant overhead when the app re-renders frequently
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
   * Animation speed
   *
   * @default "fast"
   */
  animationSpeed?: 'slow' | 'fast' | 'off';

  /**
   * Track unnecessary renders, and mark their outlines gray when detected
   *
   * An unnecessary render is defined as the component re-rendering with no change to the component's
   * corresponding dom subtree
   *
   *  @default false
   *  @warning tracking unnecessary renders can add meaningful overhead to react-scan
   */
  trackUnnecessaryRenders?: boolean;

  /**
   * Should the FPS meter show in the toolbar
   *
   *  @default true
   */
  showFPS?: boolean;

  /**
   * Should the number of slowdown notifications be shown in the toolbar
   *
   *  @default true
   */
  showNotificationCount?: boolean;

  /**
   * Allow React Scan to run inside iframes
   *
   * @default false
   */
  allowInIframe?: boolean;

  /**
   * Should react scan log internal errors to the console.
   *
   * Useful if react scan is not behaving expected and you want to provide information to maintainers when submitting an issue https://github.com/aidenybai/react-scan/issues
   *
   *  @default false
   */
  _debug?: 'verbose' | false;

  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish?: () => void;
  onPaintStart?: (outlines: Array<Outline>) => void;
  onPaintFinish?: (outlines: Array<Outline>) => void;
}

export type MonitoringOptions = Pick<
  Options,
  | 'enabled'
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

export interface StoreType {
  inspectState: Signal<States>;
  wasDetailsOpen: Signal<boolean>;
  lastReportTime: Signal<number>;
  isInIframe: Signal<boolean>;
  monitor: Signal<Monitor | null>;
  fiberRoots: WeakSet<Fiber>;
  reportData: Map<number, RenderData>;
  legacyReportData: Map<string, RenderData>;
  changesListeners: Map<number, Array<ChangesListener>>;
  interactionListeningForRenders:
    | ((fiber: Fiber, renders: Array<Render>) => void)
    | null;
}

export type OutlineKey = `${string}-${string}`;

export interface Internals {
  instrumentation: ReturnType<typeof createInstrumentation> | null;
  componentAllowList: WeakMap<ComponentType<unknown>, Options> | null;
  options: Signal<Options>;
  scheduledOutlines: Map<Fiber, Outline>; // we clear t,his nearly immediately, so no concern of mem leak on the fiber
  // outlines at the same coordinates always get merged together, so we pre-compute the merge ahead of time when aggregating in activeOutlines
  activeOutlines: Map<OutlineKey, Outline>; // we re-use the outline object on the scheduled outline
  onRender: ((fiber: Fiber, renders: Array<Render>) => void) | null;
  Store: StoreType;
  version: string;
  runInAllEnvironments: boolean;
}

export type FunctionalComponentStateChange = {
  type: ChangeReason.FunctionalState;
  value: unknown;
  prevValue?: unknown;
  count?: number | undefined;
  name: string;
};
export type ClassComponentStateChange = {
  type: ChangeReason.ClassState;
  value: unknown;
  prevValue?: unknown;
  count?: number | undefined;
  name: 'state';
};

export type StateChange =
  | FunctionalComponentStateChange
  | ClassComponentStateChange;
export type PropsChange = {
  type: ChangeReason.Props;
  name: string;
  value: unknown;
  prevValue?: unknown;
  count?: number | undefined;
};
export type ContextChange = {
  type: ChangeReason.Context;
  name: string;
  value: unknown;
  prevValue?: unknown;
  count?: number | undefined;
  contextType: number;
};

export type Change = StateChange | PropsChange | ContextChange;

export type ChangesPayload = {
  propsChanges: Array<PropsChange>;
  stateChanges: Array<
    FunctionalComponentStateChange | ClassComponentStateChange
  >;
  contextChanges: Array<ContextChange>;
};
export type ChangesListener = (changes: ChangesPayload) => void;

export const Store: StoreType = {
  wasDetailsOpen: signal(true),
  isInIframe: signal(IS_CLIENT && window.self !== window.top),
  inspectState: signal<States>({
    kind: 'uninitialized',
  }),
  monitor: signal<Monitor | null>(null),
  fiberRoots: new Set<Fiber>(),
  reportData: new Map<number, RenderData>(),
  legacyReportData: new Map<string, RenderData>(),
  lastReportTime: signal(0),
  interactionListeningForRenders: null,
  changesListeners: new Map(),
};

export const ReactScanInternals: Internals = {
  instrumentation: null,
  componentAllowList: null,
  options: signal({
    enabled: true,
    // includeChildren: true,
    // playSound: false,
    log: false,
    showToolbar: true,
    // renderCountThreshold: 0,
    // report: undefined,
    // alwaysShowLabels: false,
    animationSpeed: 'fast',
    dangerouslyForceRunInProduction: false,
    showFPS: true,
    showNotificationCount: true,
    allowInIframe: false,
    // smoothlyAnimateOutlines: true,
    // trackUnnecessaryRenders: false,
  }),
  runInAllEnvironments: false,
  onRender: null,
  scheduledOutlines: new Map(),
  activeOutlines: new Map(),
  Store,
  version: packageJson.version,
};

if (IS_CLIENT && window.__REACT_SCAN_EXTENSION__) {
  window.__REACT_SCAN_VERSION__ = ReactScanInternals.version;
}

export type LocalStorageOptions = Omit<
  Options,
  | 'onCommitStart'
  | 'onRender'
  | 'onCommitFinish'
  | 'onPaintStart'
  | 'onPaintFinish'
>;

const filetLocalStorageOptions = (options: Options): LocalStorageOptions => {
  const {
    onCommitStart,
    onRender,
    onCommitFinish,
    onPaintStart,
    onPaintFinish,
    ...rest
  } = options;
  return rest;
};

const validateOptions = (options: Partial<Options>): Partial<Options> => {
  const errors: Array<string> = [];
  const validOptions: Partial<Options> = {};

  for (const key in options) {
    const value = options[key as keyof Options];
    switch (key) {
      case 'enabled':
      // case 'includeChildren':
      case 'log':
      case 'showToolbar':
      // case 'report':
      // case 'alwaysShowLabels':
      case 'showNotificationCount':
      case 'dangerouslyForceRunInProduction':
      case 'showFPS':
      case 'allowInIframe':
        if (typeof value !== 'boolean') {
          errors.push(`- ${key} must be a boolean. Got "${value}"`);
        } else {
          validOptions[key] = value;
        }
        break;
      // case 'renderCountThreshold':
      // case 'resetCountTimeout':
      //   if (typeof value !== 'number' || value < 0) {
      //     errors.push(`- ${key} must be a non-negative number. Got "${value}"`);
      //   } else {
      //     validOptions[key] = value as number;
      //   }
      //   break;
      case 'animationSpeed':
        if (!['slow', 'fast', 'off'].includes(value as string)) {
          errors.push(
            `- Invalid animation speed "${value}". Using default "fast"`,
          );
        } else {
          validOptions[key] = value as 'slow' | 'fast' | 'off';
        }
        break;
      case 'onCommitStart':
        if (typeof value !== 'function') {
          errors.push(`- ${key} must be a function. Got "${value}"`);
        } else {
          validOptions.onCommitStart = value as () => void;
        }
        break;
      case 'onCommitFinish':
        if (typeof value !== 'function') {
          errors.push(`- ${key} must be a function. Got "${value}"`);
        } else {
          validOptions.onCommitFinish = value as () => void;
        }
        break;
      case 'onRender':
        if (typeof value !== 'function') {
          errors.push(`- ${key} must be a function. Got "${value}"`);
        } else {
          validOptions.onRender = value as (
            fiber: Fiber,
            renders: Array<Render>,
          ) => void;
        }
        break;
      case 'onPaintStart':
      case 'onPaintFinish':
        if (typeof value !== 'function') {
          errors.push(`- ${key} must be a function. Got "${value}"`);
        } else {
          validOptions[key] = value as (outlines: Array<Outline>) => void;
        }
        break;
      // case 'trackUnnecessaryRenders': {
      //   validOptions.trackUnnecessaryRenders =
      //     typeof value === 'boolean' ? value : false;
      //   break;
      // }
      // case 'smoothlyAnimateOutlines': {
      //   validOptions.smoothlyAnimateOutlines =
      //     typeof value === 'boolean' ? value : false;
      //   break;
      // }
      default:
        errors.push(`- Unknown option "${key}"`);
    }
  }

  if (errors.length > 0) {
    // biome-ignore lint/suspicious/noConsole: Intended debug output
    console.warn(`[React Scan] Invalid options:\n${errors.join('\n')}`);
  }

  return validOptions;
};

export const getReport = (type?: ComponentType<unknown>) => {
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

export const setOptions = (userOptions: Partial<Options>) => {
  try {
    const validOptions = validateOptions(userOptions);

    if (Object.keys(validOptions).length === 0) {
      return;
    }

    const shouldInitToolbar =
      'showToolbar' in validOptions && validOptions.showToolbar !== undefined;

    const newOptions = {
      ...ReactScanInternals.options.value,
      ...validOptions,
    };

    const { instrumentation } = ReactScanInternals;
    if (instrumentation && 'enabled' in validOptions) {
      instrumentation.isPaused.value = validOptions.enabled === false;
    }

    ReactScanInternals.options.value = newOptions;

    // temp hack since defaults override stored local storage values
    // we actually don't care about any other local storage option other than enabled, we should not be syncing those to local storage
    try {
      const existing = readLocalStorage<undefined | Record<string, unknown>>(
        'react-scan-options',
      )?.enabled;

      if (typeof existing === 'boolean') {
        newOptions.enabled = existing;
      }
    } catch (e) {
      if (ReactScanInternals.options.value._debug === 'verbose') {
        // biome-ignore lint/suspicious/noConsole: intended debug output
        console.error(
          '[React Scan Internal Error]',
          'Failed to create notifications outline canvas',
          e,
        );
      }
      /** */
    }

    saveLocalStorage<LocalStorageOptions>(
      'react-scan-options',
      filetLocalStorageOptions(newOptions),
    );

    if (shouldInitToolbar) {
      initToolbar(!!newOptions.showToolbar);
    }

    return newOptions;
  } catch (e) {
    if (ReactScanInternals.options.value._debug === 'verbose') {
      // biome-ignore lint/suspicious/noConsole: intended debug output
      console.error(
        '[React Scan Internal Error]',
        'Failed to create notifications outline canvas',
        e,
      );
    }
    /** */
  }
};

export const getOptions = () => ReactScanInternals.options;

// we only need to run this check once and will read the value in hot path
let isProduction: boolean | null = null;
let rdtHook: ReturnType<typeof getRDTHook>;
export const getIsProduction = () => {
  if (isProduction !== null) {
    return isProduction;
  }
  rdtHook ??= getRDTHook();
  for (const renderer of rdtHook.renderers.values()) {
    const buildType = detectReactBuildType(renderer);
    if (buildType === 'production') {
      isProduction = true;
    }
  }
  return isProduction;
};

export const start = () => {
  try {
    if (!IS_CLIENT) {
      return;
    }

    if (
      !ReactScanInternals.runInAllEnvironments &&
      getIsProduction() &&
      !ReactScanInternals.options.value.dangerouslyForceRunInProduction
    ) {
      return;
    }

    const localStorageOptions =
      readLocalStorage<LocalStorageOptions>('react-scan-options');

    if (localStorageOptions) {
      const validLocalOptions = validateOptions(localStorageOptions);

      if (Object.keys(validLocalOptions).length > 0) {
        ReactScanInternals.options.value = {
          ...ReactScanInternals.options.value,
          ...validLocalOptions,
        };
      }
    }

    const options = getOptions();

    initReactScanInstrumentation(() => {
      initToolbar(!!options.value.showToolbar);
    });

    if (!Store.monitor.value && IS_CLIENT) {
      setTimeout(() => {
        if (isInstrumentationActive()) return;
        // biome-ignore lint/suspicious/noConsole: Intended debug output
        console.error(
          '[React Scan] Failed to load. Must import React Scan before React runs.',
        );
      }, 5000);
    }
  } catch (e) {
    if (ReactScanInternals.options.value._debug === 'verbose') {
      // biome-ignore lint/suspicious/noConsole: intended debug output
      console.error(
        '[React Scan Internal Error]',
        'Failed to create notifications outline canvas',
        e,
      );
    }
  }
};

const initToolbar = (showToolbar: boolean) => {
  window.reactScanCleanupListeners?.();

  const cleanupTimingTracking = startTimingTracking();
  const cleanupOutlineCanvas = createNotificationsOutlineCanvas();

  window.reactScanCleanupListeners = () => {
    cleanupTimingTracking();
    cleanupOutlineCanvas?.();
  };

  const windowToolbarContainer = window.__REACT_SCAN_TOOLBAR_CONTAINER__;

  if (!showToolbar) {
    windowToolbarContainer?.remove();
    return;
  }

  windowToolbarContainer?.remove();
  const { shadowRoot } = initRootContainer();
  createToolbar(shadowRoot);
};

const createNotificationsOutlineCanvas = () => {
  try {
    const highlightRoot = document.documentElement;
    return createHighlightCanvas(highlightRoot);
  } catch (e) {
    if (ReactScanInternals.options.value._debug === 'verbose') {
      // biome-ignore lint/suspicious/noConsole: intended debug output
      console.error(
        '[React Scan Internal Error]',
        'Failed to create notifications outline canvas',
        e,
      );
    }
  }
};

export const scan = (options: Options = {}) => {
  setOptions(options);
  const isInIframe = Store.isInIframe.value;

  if (
    isInIframe &&
    !ReactScanInternals.options.value.allowInIframe &&
    !ReactScanInternals.runInAllEnvironments
  ) {
    return;
  }

  if (options.enabled === false && options.showToolbar !== true) {
    return;
  }

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
  Exclude<ReactNode, undefined | null | string | number | boolean | bigint>
>();

export const ignoreScan = (node: ReactNode) => {
  if (node && typeof node === 'object') {
    ignoredProps.add(node);
  }
};
