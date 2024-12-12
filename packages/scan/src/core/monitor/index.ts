'use client';
import React from 'react';
import { getDisplayName, isCompositeFiber } from 'bippy';
import { type Fiber } from 'react-reconciler';
import {
  type MonitoringOptions,
  ReactScanInternals,
  reportRender,
  setOptions,
  Store,
} from '..';
import { createInstrumentation, type Render } from '../instrumentation';
import { addFiberToSet, isValidFiber, updateFiberRenderData } from '../utils';
import { initPerformanceMonitoring } from './performance';
import { getSession } from './utils';
import { flush } from './network';

// max retries before the set of components do not get reported (avoid memory leaks of the set of fibers stored on the component aggregation)
const MAX_RETRIES_BEFORE_COMPONENT_GC = 7;

export interface MonitoringProps {
  url?: string;
  apiKey: string;
  path: string;
  route: string | null;
  commit: string | null;
  branch: string | null;
}

export interface MonitoringWithoutRouteProps
  extends Omit<MonitoringProps, 'route' | 'path'> {}

export const Monitoring = ({
  url,
  apiKey,
  path,
  route,
  commit,
  branch,
}: MonitoringProps) => {
  if (!apiKey)
    throw new Error('Please provide a valid API key for React Scan monitoring');
  url ??= 'https://monitoring.react-scan.com/api/v1/ingest';

  Store.monitor.value ??= {
    pendingRequests: 0,
    url,
    apiKey,
    interactions: [],
    session: getSession().catch(() => null),
    route,
    path,
    commit,
    branch,
  };
  Store.monitor.value.route = route;
  Store.monitor.value.path = path;

  // eslint-disable-next-line import/no-named-as-default-member
  React.useEffect(() => {
    scanMonitoring({ enabled: true });
    return initPerformanceMonitoring();
  }, []);

  return null;
};

export const scanMonitoring = (options: MonitoringOptions) => {
  setOptions(options);
  startMonitoring();
};

let flushInterval: ReturnType<typeof setInterval>;

export const startMonitoring = () => {
  if (!Store.monitor.value) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        'Invariant: startMonitoring can never be called when monitoring is not initialized',
      );
    }
  }

  if (flushInterval) {
    clearInterval(flushInterval);
  }

  flushInterval = setInterval(() => {
    try {
      void flush();
    } catch {
      /* */
    }
  }, 2000);

  globalThis.__REACT_SCAN__ = {
    ReactScanInternals,
  };
  const instrumentation = createInstrumentation({
    kind: 'monitoring',
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
        aggregateComponentRenderToInteraction(fiber, renders);
      }
      ReactScanInternals.options.value.onRender?.(fiber, renders);
    },
    onCommitFinish() {
      ReactScanInternals.options.value.onCommitFinish?.();
    },
  });

  ReactScanInternals.instrumentation = instrumentation;
};

const aggregateComponentRenderToInteraction = (
  fiber: Fiber,
  renders: Array<Render>,
) => {
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
        retiresAllowed: MAX_RETRIES_BEFORE_COMPONENT_GC,
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
