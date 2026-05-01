import {
  type ReactDevToolsGlobalHook,
  type ReactRenderer,
  getRDTHook,
  isRealReactDevtools,
} from 'bippy';
import type { SchedulerPriorityLevel } from './types';
import {
  DEFAULT_MAX_FIBERS_PER_COMMIT,
  DEFAULT_MIN_FIBER_ACTUAL_DURATION_MS,
} from './constants';
import { createEmitter } from './create-emitter';
import { createProfilingHooks } from './create-profiling-hooks';
import { createLaneLabelTranslator } from './lane-labels';
import type {
  LiteHandle,
  LiteOptions,
  ProfilingHooks,
  ReactRendererWithProfiling,
} from './types';
import { walkFiber } from './walk-fiber';

const noopHandle: LiteHandle = {
  stop: () => {},
  isActive: () => false,
  subscribe: () => () => {},
};

interface ProfilingAttachOutcome {
  available: boolean;
  reason?: 'no-inject-method' | 'threw' | 'opted-out';
  error?: string;
}

const errorToMessage = (cause: unknown): string => {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  try {
    return JSON.stringify(cause);
  } catch {
    return String(cause);
  }
};

const tryInjectProfilingHooks = (
  renderer: ReactRenderer,
  profilingHooks: ProfilingHooks,
): ProfilingAttachOutcome => {
  const rendererWithProfiling = renderer as ReactRendererWithProfiling;
  if (typeof rendererWithProfiling.injectProfilingHooks !== 'function') {
    return { available: false, reason: 'no-inject-method' };
  }
  try {
    rendererWithProfiling.injectProfilingHooks(profilingHooks);
    return { available: true };
  } catch (cause) {
    return { available: false, reason: 'threw', error: errorToMessage(cause) };
  }
};

const isValidEndpointUrl = (candidate: string): boolean => {
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const instrument = (options: LiteOptions = {}): LiteHandle => {
  if (typeof window === 'undefined') return noopHandle;
  if (window.__REACT_SCAN_LITE__) return window.__REACT_SCAN_LITE__;

  if (options.endpoint && !options.sessionId) {
    // oxlint-disable-next-line no-console
    console.warn(
      '[react-scan/lite] `endpoint` requires `sessionId`; events will not be POSTed.',
    );
  }

  // Validate the endpoint URL once at instrument() time and DROP it on failure
  // so `createEmitter`'s `canPostToEndpoint` calculation sees the disablement.
  // Without this, every emit would `fetch()` to the invalid URL and fail
  // silently per-event (caught Bugbot review on PR #435).
  let effectiveEndpoint = options.endpoint;
  if (effectiveEndpoint && !isValidEndpointUrl(effectiveEndpoint)) {
    // oxlint-disable-next-line no-console
    console.error(
      '[react-scan/lite] `endpoint` is not a valid http(s) URL; events will not be POSTed.',
    );
    effectiveEndpoint = undefined;
  }

  if (
    options.includeFiberTree === false &&
    (options.recordChangeDescriptions === true ||
      options.includeFiberSource === true ||
      options.includeFiberIdentity === true)
  ) {
    // oxlint-disable-next-line no-console
    console.warn(
      '[react-scan/lite] `includeFiberTree: false` disables per-fiber enrichment options (`recordChangeDescriptions`, `includeFiberSource`, `includeFiberIdentity`). Remove `includeFiberTree: false` to enable them.',
    );
  }

  const { emitter, control: emitterControl } = createEmitter({
    ...options,
    endpoint: effectiveEndpoint,
  });
  const profilingHooks = createProfilingHooks(emitter);
  const includeFiberTree = options.includeFiberTree !== false;
  const includeProfilingHooks = options.includeProfilingHooks !== false;
  const includeLaneLabels = options.includeLaneLabels !== false;
  const maxFibers = options.maxFibersPerCommit ?? DEFAULT_MAX_FIBERS_PER_COMMIT;
  const minActualDurationMs =
    options.minFiberActualDurationMs ?? DEFAULT_MIN_FIBER_ACTUAL_DURATION_MS;
  const recordChangeDescriptions = options.recordChangeDescriptions === true;
  const includeFiberSource = options.includeFiberSource === true;
  const includeFiberIdentity = options.includeFiberIdentity === true;
  const attachedRenderers = new WeakSet<ReactRenderer>();
  let isStopped = false;

  // Acquire the hook BEFORE defining closures that read it. We deliberately
  // do not pass an `onActive` callback to bippy: if a renderer was injected
  // before `instrument()` ran, bippy fires `onActive` synchronously inside
  // `getRDTHook(...)`, which would hit the `hook` const's TDZ. We instead
  // catch existing renderers explicitly via `attachAllExisting()` below,
  // and future renderers via our `ourInject` patch.
  const hook: ReactDevToolsGlobalHook = getRDTHook();

  let foundRealLaneLabelMap = false;
  const refreshLaneLabelTranslator = (): void => {
    if (!includeLaneLabels) return;
    if (foundRealLaneLabelMap) return; // cached: a real map never becomes "more real"
    const result = createLaneLabelTranslator(
      Array.from(hook.renderers.values()) as Array<ReactRendererWithProfiling>,
    );
    emitterControl.setLaneLabelTranslator(result.translator);
    if (result.hasLaneLabelMap) foundRealLaneLabelMap = true;
  };

  const attachOneRenderer = (renderer: ReactRenderer): void => {
    if (isStopped) return;
    if (attachedRenderers.has(renderer)) return;
    attachedRenderers.add(renderer);
    const outcome: ProfilingAttachOutcome = includeProfilingHooks
      ? tryInjectProfilingHooks(renderer, profilingHooks)
      : { available: false, reason: 'opted-out' };
    emitter.emit('renderer-injected', {
      data: { version: renderer.version, bundleType: renderer.bundleType },
    });
    emitter.emit('profiling-hooks-status', {
      available: outcome.available,
      reason: outcome.reason,
      error: outcome.error,
      reactVersion: renderer.version,
      bundleType: renderer.bundleType,
    });
    refreshLaneLabelTranslator();
  };

  const attachAllExisting = (): void => {
    if (isStopped) return;
    for (const renderer of Array.from(hook.renderers.values())) {
      attachOneRenderer(renderer);
    }
  };

  if (includeProfilingHooks && isRealReactDevtools(hook)) {
    // oxlint-disable-next-line no-console
    console.warn(
      '[react-scan/lite] React DevTools is also attached. Calling injectProfilingHooks replaces its profiling channel; the DevTools Timeline Profiler may stop receiving events while this instrumentation is active.',
    );
  }

  const originalInject = hook.inject;
  const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
  const originalOnPostCommitFiberRoot = hook.onPostCommitFiberRoot;
  const originalOnCommitFiberUnmount = hook.onCommitFiberUnmount;

  const ourInject: typeof hook.inject = (renderer) => {
    const rendererId = originalInject.call(hook, renderer);
    if (!isStopped) attachOneRenderer(renderer);
    return rendererId;
  };

  // React's reconciler actually calls `onCommitFiberRoot(rendererID, root,
  // schedulerPriority, didError)` with FOUR args. Bippy's type signature
  // omits `didError`, so we widen locally to capture it. Verified in
  // packages/react-reconciler/src/ReactFiberDevToolsHook.js.
  type WidenedOnCommitFiberRoot = (
    rendererId: number,
    root: Parameters<NonNullable<typeof hook.onCommitFiberRoot>>[1],
    priority?: number,
    didError?: boolean,
  ) => void;

  const ourOnCommitFiberRoot: WidenedOnCommitFiberRoot = (
    rendererId,
    root,
    priority,
    didError,
  ) => {
    if (originalOnCommitFiberRoot) {
      try {
        (originalOnCommitFiberRoot as WidenedOnCommitFiberRoot).call(
          hook,
          rendererId,
          root,
          priority,
          didError,
        );
      } catch {}
    }
    if (isStopped) return;
    const tree = includeFiberTree
      ? walkFiber(root.current, {
          maxFibers,
          minActualDurationMs,
          recordChangeDescriptions,
          includeFiberSource,
          includeFiberIdentity,
          isCancelled: () => isStopped,
        })
      : undefined;
    emitter.emit('commit', {
      rendererId,
      // HACK: bippy types `priority` as `number | void`. React actually
      // passes a Scheduler priority (1-5); narrow to `SchedulerPriorityLevel`.
      priorityLevel: priority as SchedulerPriorityLevel | undefined,
      didError: didError === true ? true : undefined,
      tree,
    });
  };

  const ourOnPostCommitFiberRoot: typeof hook.onPostCommitFiberRoot = (
    rendererId,
    root,
  ) => {
    if (originalOnPostCommitFiberRoot) {
      try {
        originalOnPostCommitFiberRoot.call(hook, rendererId, root);
      } catch {}
    }
    if (isStopped) return;
    emitter.emit('post-commit', { rendererId });
  };

  const ourOnCommitFiberUnmount: typeof hook.onCommitFiberUnmount = (
    rendererId,
    fiber,
  ) => {
    if (originalOnCommitFiberUnmount) {
      try {
        originalOnCommitFiberUnmount.call(hook, rendererId, fiber);
      } catch {}
    }
    if (isStopped) return;
    emitter.emit('fiber-unmount', { rendererId });
  };

  hook.inject = ourInject;
  hook.onCommitFiberRoot =
    ourOnCommitFiberRoot as typeof hook.onCommitFiberRoot;
  hook.onPostCommitFiberRoot = ourOnPostCommitFiberRoot;
  hook.onCommitFiberUnmount = ourOnCommitFiberUnmount;

  attachAllExisting();

  const handle: LiteHandle = {
    stop: () => {
      if (isStopped) return;
      isStopped = true;
      if (hook.inject === ourInject) hook.inject = originalInject;
      if (
        (hook.onCommitFiberRoot as unknown) === (ourOnCommitFiberRoot as unknown)
      ) {
        hook.onCommitFiberRoot = originalOnCommitFiberRoot;
      }
      if (hook.onPostCommitFiberRoot === ourOnPostCommitFiberRoot) {
        hook.onPostCommitFiberRoot = originalOnPostCommitFiberRoot;
      }
      if (hook.onCommitFiberUnmount === ourOnCommitFiberUnmount) {
        hook.onCommitFiberUnmount = originalOnCommitFiberUnmount;
      }
      emitterControl.dispose();
      if (window.__REACT_SCAN_LITE__ === handle) {
        delete window.__REACT_SCAN_LITE__;
      }
    },
    isActive: () => !isStopped,
    subscribe: (listener) => emitter.subscribe(listener),
  };

  window.__REACT_SCAN_LITE__ = handle;
  return handle;
};

export type {
  BundleType,
  ChangeDescription,
  Fiber,
  FiberSource,
  Lanes,
  LiteEvent,
  LiteEventKind,
  LiteFiberSummary,
  LiteHandle,
  LiteOptions,
  ProfilingHooksUnavailableReason,
  SchedulerPriorityLevel,
} from './types';
