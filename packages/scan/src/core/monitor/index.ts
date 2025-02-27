"use client";
import {
  type Fiber,
  getDisplayName,
  getTimings,
  isCompositeFiber,
} from "bippy";
import { type FC, useEffect } from "react";
import {
  type MonitoringOptions,
  ReactScanInternals,
  Store,
  setOptions,
} from "..";
import { type Render, createInstrumentation } from "../instrumentation";
import { updateFiberRenderData } from "../utils";
import { flush } from "./network";
import { computeRoute } from "./params/utils";
import { initPerformanceMonitoring } from "./performance";
import { getSession } from "./utils";

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
  "route" | "path"
>;

const DEFAULT_URL = "https://monitoring.react-scan.com/api/v1/ingest";

function noopCatch() {
  return null;
}

export const Monitoring: FC<MonitoringProps> = ({
  url,
  apiKey,
  params,
  path = null, // path passed down would be reactive
  route = null,
  commit = null,
  branch = null,
}) => {
  if (!apiKey)
    throw new Error("Please provide a valid API key for React Scan monitoring");
  url ??= DEFAULT_URL;

  Store.monitor.value ??= {
    pendingRequests: 0,
    interactions: [],
    session: getSession({ commit, branch }).catch(noopCatch),
    url,
    apiKey,
    route,
    commit,
    branch,
    interactionListeningForRenders: null,
  };

  // When using Monitoring without framework, we need to compute the route from the path and params
  if (!route && path && params) {
    Store.monitor.value.route = computeRoute(path, params);
  } else if (typeof window !== "undefined") {
    Store.monitor.value.route =
      route ?? path ?? new URL(window.location.toString()).pathname; // this is inaccurate on vanilla react if the path is not provided but used for session route
  }

  useEffect(() => {
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

export const startMonitoring = (): void => {
  if (!Store.monitor.value) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "Invariant: startMonitoring can never be called when monitoring is not initialized"
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
  const instrumentation = createInstrumentation("monitoring", {
    onCommitStart() {
      // ReactScanInternals.options.value.onCommitStart?.();
    },
    onError() {
      // todo: report to server?
    },
    isValidFiber() {
      return true;
    },
    onRender(fiber, renders) {
      updateFiberRenderData(fiber, renders);

      if (isCompositeFiber(fiber)) {
        aggregateComponentRenderToInteraction(fiber, renders);
      }
      // ReactScanInternals.options.value.onRender?.(fiber, renders);
    },
    onCommitFinish() {
      // ReactScanInternals.options.value.onCommitFinish?.();
    },
    // onPostCommitFiberRoot() {
    //   // ...
    // },
    trackChanges: false,
    forceAlwaysTrackRenders: true,
  });

  ReactScanInternals.instrumentation = instrumentation;
};

const aggregateComponentRenderToInteraction = (
  fiber: Fiber,
  renders: Array<Render>
): void => {
  const monitor = Store.monitor.value;
  if (!monitor || !monitor.interactions || monitor.interactions.length === 0)
    return;
  const lastInteraction = monitor.interactions.at(-1); // Associate component render with last interaction
  if (!lastInteraction) return;

  const displayName = getDisplayName(fiber.type);
  if (!displayName) return; // TODO(nisarg): it may be useful to somehow report the first ancestor with a display name instead of completely ignoring

  let component = lastInteraction.components.get(displayName); // TODO(nisarg): Same names are grouped together which is wrong.

  if (!component) {
    component = {
      fibers: new Set(),
      name: displayName,
      renders: 0,
      retiresAllowed: MAX_RETRIES_BEFORE_COMPONENT_GC,
      uniqueInteractionId: lastInteraction.uniqueInteractionId,
    };
    lastInteraction.components.set(displayName, component);
  }

  if (fiber.alternate && !component.fibers.has(fiber.alternate)) {
    // then the alternate tree fiber exists in the weakset, don't double count the instance
    component.fibers.add(fiber.alternate);
  }

  const rendersCount = renders.length;
  component.renders += rendersCount;

  // We leave the times undefined to differentiate between a 0ms render and a non-profiled render.
  if (fiber.actualDuration) {
    const { selfTime, totalTime } = getTimings(fiber);
    if (!component.totalTime) component.totalTime = 0;
    if (!component.selfTime) component.selfTime = 0;
    component.totalTime += totalTime;
    component.selfTime += selfTime;
  }
};
