'use client';
import { getDisplayName, isCompositeFiber } from 'bippy';
import { type Fiber } from 'react-reconciler';
import { useEffect } from 'react';
import {
  type MonitoringOptions,
  ReactScanInternals,
  reportRender,
  setOptions,
  Store,
} from '..';
import { createInstrumentation, type Render } from '../instrumentation';
import { updateFiberRenderData } from '../utils';
import { initPerformanceMonitoring } from './performance';
import { getSession } from './utils';
import { flush } from './network';
import { computeRoute } from './params/utils';

// max retries before the set of components do not get reported (avoid memory leaks of the set of fibers stored on the component aggregation)
const MAX_RETRIES_BEFORE_COMPONENT_GC = 7;

export interface MonitoringProps {
  url?: string;
  apiKey: string;

  // For Session and Interaction
  path?: string | null; // pathname (i.e /foo/2/bar/3)
  route?: string | null; // computed from path and params (i.e /foo/:fooId/bar/:barId)

  // Only used / should be provided to compute the route when using Monitoring without supported framework
  params?: Record<string, string>;

  // Tracking regressions across commits and branches
  commit?: string | null;
  branch?: string | null;
}

export type MonitoringWithoutRouteProps = Omit<
  MonitoringProps,
  'route' | 'path'
>;

export const Monitoring = ({
  url,
  apiKey,
  params,
  path = null, // path passed down would be reactive
  route = null,
  commit = null,
  branch = null,
}: MonitoringProps) => {
  if (!apiKey)
    throw new Error('Please provide a valid API key for React Scan monitoring');
  url ??= 'https://monitoring.react-scan.com/api/v1/ingest';

  Store.monitor.value ??= {
    pendingRequests: 0,
    interactions: [],
    session: getSession({ commit, branch }).catch(() => null),
    url,
    apiKey,
    route,
    commit,
    branch,
  };

  // When using Monitoring without framework, we need to compute the route from the path and params
  if (!route && path && params) {
    Store.monitor.value.route = computeRoute(path, params);
  } else if (typeof window !== 'undefined') {
    Store.monitor.value.route =
      route ?? path ?? new URL(window.location.toString()).pathname; // this is inaccurate on vanilla react if the path is not provided but used for session route
  }

  useEffect(() => {
    scanMonitoring({
      enabled: true,
    });
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
  const instrumentation = createInstrumentation('monitoring', {
    onCommitStart() {
      ReactScanInternals.options.value.onCommitStart?.();
    },
    onError() {
      // todo: report to server?
    },
    isValidFiber() {
      return true;
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
      totalTime += render.time ?? 0;
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

    if (fiber.alternate && !component.fibers.has(fiber.alternate)) {
      // then the alternate tree fiber exists in the weakset, don't double count the instance
      component.fibers.add(fiber.alternate);
    }

    component.renders += renders.length;
    if (!component.totalTime) {
      component.totalTime = 0;
    }
    component.totalTime += component.totalTime
      ? component.totalTime + totalTime
      : totalTime;
  }
};
