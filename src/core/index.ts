import type { FiberRoot } from 'react-reconciler';
import * as React from 'react';
import { instrument } from './instrumentation/index';
import {
  type ActiveOutline,
  flushOutlines,
  getOutline,
  type PendingOutline,
} from './web/outline';
import { createCanvas } from './web/index';
import { logIntro } from './web/log';
import { createStatus } from './web/status';
import { playGeigerClickSound } from './web/geiger';

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

  /**
   * Run in production
   *
   * @default false
   */
  runInProduction?: boolean;

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

  onCommitStart?: () => void;
  onCommitFinish?: () => void;
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
  scheduledOutlines: PendingOutline[];
  activeOutlines: ActiveOutline[];
  selectedArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export const ReactScanInternals: Internals = {
  onCommitFiberRoot: (_rendererID: number, _root: FiberRoot): void => {
    /**/
  },
  selectedArea: null,
  get isProd() {
    return (
      '_self' in React.createElement('div') &&
      !ReactScanInternals.options.runInProduction
    );
  },
  isInIframe: window.self !== window.top,
  isPaused: false,
  componentAllowList: null,
  options: {
    enabled: true,
    includeChildren: true,
    runInProduction: false,
    log: false,
    playSound: false,
  },
  scheduledOutlines: [],
  activeOutlines: [],
};

export const setOptions = (options: Options) => {
  ReactScanInternals.options = {
    ...ReactScanInternals.options,
    ...options,
  };
};

export const getOptions = () => ReactScanInternals.options;

let inited = false;

export const start = () => {
  if (inited) return;
  inited = true;
  const ctx = createCanvas();
  const status = createStatus();
  const audioContext =
    typeof window !== 'undefined'
      ? new (window.AudioContext ||
          // @ts-expect-error -- This is a fallback for Safari
          window.webkitAudioContext)()
      : null;

  if (!ctx) return;
  logIntro();

  globalThis.__REACT_SCAN__ = {
    ReactScanInternals,
  };

  const { options } = ReactScanInternals;
  instrument({
    onCommitStart() {
      options.onCommitStart?.();
    },
    onRender(fiber, render) {
      const outline = getOutline(fiber, render);
      if (outline) {
        ReactScanInternals.scheduledOutlines.push(outline);
      }

      if (options.playSound && audioContext) {
        const renderTimeThreshold = 10;
        const amplitude = Math.min(
          1,
          (render.time - renderTimeThreshold) / (renderTimeThreshold * 2),
        );
        playGeigerClickSound(audioContext, amplitude);
      }

      requestAnimationFrame(() => {
        flushOutlines(ctx, new Map(), status);
      });
    },
    onCommitFinish() {
      options.onCommitFinish?.();
    },
  });
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

  start();

  return component;
};

export const scan = (options: Options = {}) => {
  setOptions(options);
  const { isInIframe, isProd } = ReactScanInternals;
  if (isInIframe || isProd || options.enabled === false) return;

  start();
};
