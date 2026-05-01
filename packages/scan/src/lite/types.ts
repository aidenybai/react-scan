import type { BundleType, Fiber, Lanes, ReactRenderer } from 'bippy';
import type { FiberSource } from 'bippy/source';

export type { BundleType, Fiber, FiberSource, Lanes };

/**
 * Scheduler priority level. Sourced from the `scheduler` package
 * (`ImmediatePriority`/`UserBlockingPriority`/etc.). Distinct from
 * bippy's `LanePriority` (which models React's lane bitmask priority,
 * 0-17). React's reconciler maps event priorities to scheduler
 * priorities and passes one of these values to `onCommitFiberRoot`.
 *
 * @see https://github.com/facebook/react/blob/main/packages/scheduler/src/SchedulerPriorities.js
 */
export type SchedulerPriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ChangeDescription {
  isFirstMount: boolean;
  /**
   * Names of props whose reference identity changed. `null` when the fiber
   * type has no meaningful prop comparison (e.g. host components).
   */
  props: Array<string> | null;
  /**
   * `true` if any class-component state field changed. `false` for function
   * components (use `hooks` instead).
   */
  state: boolean;
  /**
   * `true` if any consumed context value changed (compared via `Object.is`).
   */
  context: boolean;
  /**
   * Indices of stateful hooks whose `memoizedState` changed. Approximate:
   * walks the `Hook` linked list and compares each `.memoizedState` by
   * reference. Will report `useMemo` / `useCallback` deltas as well.
   */
  hooks: Array<number>;
  /**
   * `true` if a parent fiber also rendered in this commit (signals a
   * cascade render rather than a self-triggered update).
   */
  parent: boolean;
}

export interface LiteFiberSummary {
  name: string;
  depth: number;
  /**
   * The fiber's `WorkTag`. Typed as `number` (not bippy's `WorkTag` union)
   * because newer React versions add tags faster than bippy bumps the union
   * (e.g. `ActivityComponentTag = 28`, `ViewTransitionComponentTag = 30`
   * exist as constants but aren't in the type union as of bippy 0.5.39).
   * Compare against bippy's exported constants
   * (`FunctionComponentTag`, `ClassComponentTag`, etc.) to interpret.
   */
  tag: number;
  actualDuration: number;
  actualStartTime: number;
  selfBaseDuration: number;
  treeBaseDuration: number;
  /**
   * Stable monotonic id assigned per logical fiber (alternate-aware).
   * Present when `includeFiberIdentity` is enabled.
   */
  fiberId?: number;
  /**
   * Where this fiber's element was created. Read from `_debugSource`
   * (React 16/17/18) or parsed out of `_debugStack` (React 19+).
   * Present when `includeFiberSource` is enabled.
   */
  source?: FiberSource | null;
  /**
   * Display name of `_debugOwner.type`: the component that rendered this
   * one (i.e. its parent in the JSX tree, not the fiber `return`).
   * Present when `includeFiberSource` is enabled.
   */
  ownerName?: string | null;
  /**
   * Why this fiber re-rendered. Present when `recordChangeDescriptions`
   * is enabled. `null` for fiber types we don't track (host nodes etc).
   */
  changeDescription?: ChangeDescription | null;
}

export type LiteEventKind =
  | 'renderer-injected'
  | 'profiling-hooks-status'
  | 'commit'
  | 'post-commit'
  | 'fiber-unmount'
  | 'commit-start'
  | 'commit-stop'
  | 'render-start'
  | 'render-yield'
  | 'render-stop'
  | 'render-scheduled'
  | 'layout-effects-start'
  | 'layout-effects-stop'
  | 'passive-effects-start'
  | 'passive-effects-stop'
  | 'component-render-start'
  | 'component-render-stop'
  | 'component-layout-effect-mount-start'
  | 'component-layout-effect-mount-stop'
  | 'component-layout-effect-unmount-start'
  | 'component-layout-effect-unmount-stop'
  | 'component-passive-effect-mount-start'
  | 'component-passive-effect-mount-stop'
  | 'component-passive-effect-unmount-start'
  | 'component-passive-effect-unmount-stop'
  | 'state-update'
  | 'force-update'
  | 'component-suspended'
  | 'component-errored';

export type ProfilingHooksUnavailableReason =
  /** Renderer doesn't expose `injectProfilingHooks` (R19.2+ prod, non-`__PROFILE__` builds). */
  | 'no-inject-method'
  /** `injectProfilingHooks` threw when called. */
  | 'threw'
  /** Caller passed `includeProfilingHooks: false`; we never tried to attach. */
  | 'opted-out';

export interface LiteEvent {
  kind: LiteEventKind;
  timestamp: number;
  /**
   * Set on the per-component `mark*` events: every `component-*-start`/`-stop`
   * pair, every `component-{layout,passive}-effect-{mount,unmount}-{start,stop}`,
   * `state-update`, `force-update`, `component-suspended`, `component-errored`.
   * Absent on `commit`/`commit-start`/`render-start`/etc. (which span all
   * components in the commit, not one).
   */
  componentName?: string;
  /** Raw lanes bitmask. */
  lanes?: Lanes;
  /** Human-readable lane labels (e.g. ["SyncLane", "DefaultLane"]). */
  laneLabels?: Array<string>;
  rendererId?: number;
  /** Numeric scheduler priority (1=Immediate, 5=Idle). */
  priorityLevel?: SchedulerPriorityLevel;
  /** Resolved scheduler priority name (e.g. "UserBlocking"). */
  priorityName?: string;
  /**
   * Set on `commit` events when React encountered an error during the
   * commit (root captured a `DidCapture` flag). Forwarded directly from
   * React's `onCommitFiberRoot(rendererID, root, priority, didError)`
   * 4th argument; bippy's type omits this so we read it via a widened
   * handler signature.
   */
  didError?: boolean;
  tree?: Array<LiteFiberSummary>;
  message?: string;
  data?: Record<string, unknown>;

  // Fields for `profiling-hooks-status` events:
  /** True if `injectProfilingHooks` succeeded for this renderer. */
  available?: boolean;
  /** Reason `injectProfilingHooks` was unavailable, when `available === false`. */
  reason?: ProfilingHooksUnavailableReason;
  /** Error message when `reason === 'threw'`; otherwise undefined. */
  error?: string;
  /** React version reported by the renderer. */
  reactVersion?: string;
  /** Renderer bundle type (0 = production, 1 = development). */
  bundleType?: BundleType;
}

export interface LiteOptions {
  /**
   * Receives every emitted event. Combine with `endpoint` if you want both
   * a callback and POSTs (callback fires first).
   */
  onEvent?: (event: LiteEvent) => void;
  /**
   * If set, every event is `fetch`-POSTed to this URL with `keepalive: true`.
   * Each request body is `{ sessionId, location, message, data, timestamp }`
   * matching the `debug-agent` ingest contract. Note: `keepalive` has a
   * ~64KB body limit; large `tree` payloads may be silently dropped.
   */
  endpoint?: string;
  /**
   * Included in every endpoint POST under `sessionId`. Required when
   * `endpoint` is set; otherwise POSTs are skipped (with a console warning).
   */
  sessionId?: string;
  /**
   * Walk the fiber tree on every commit and include a `tree` of per-fiber
   * `actualDuration` (DevTools flame-graph data).
   * @default true
   */
  includeFiberTree?: boolean;
  /**
   * Subscribe to the `mark*` profiling hooks (component renders, effect
   * boundaries, scheduled state updates, suspends, errors).
   * Only fires in `__PROFILE__` builds of React 16.5–19.1.
   * @default true
   */
  includeProfilingHooks?: boolean;
  /**
   * Compute a `changeDescription` for each fiber summary, attributing the
   * re-render to props / state / context / hooks / parent.
   * @default false
   */
  recordChangeDescriptions?: boolean;
  /**
   * Attach `source` and `ownerName` to each fiber summary using
   * `_debugSource` (React 16/17/18) or `_debugStack` (React 19+).
   * Sync extraction only; no source-map symbolication.
   * @default false
   */
  includeFiberSource?: boolean;
  /**
   * Attach a stable monotonic `fiberId` to each fiber summary so the agent
   * can correlate the same logical fiber across commits.
   * @default false
   */
  includeFiberIdentity?: boolean;
  /**
   * Translate `lanes` bitmasks to human-readable labels via
   * `renderer.getLaneLabelMap?.()`, and `priorityLevel` to `priorityName`.
   * @default true
   */
  includeLaneLabels?: boolean;
  /**
   * Prefix applied to the `location` field of every endpoint POST.
   * @default "ReactScanLite"
   */
  location?: string;
  /**
   * Maximum number of fibers walked per commit. Cuts off the tail to avoid
   * unbounded payload sizes on huge trees.
   * @default 5000
   */
  maxFibersPerCommit?: number;
  /**
   * Skip walking subtrees whose `actualDuration` is below this threshold (ms).
   * Set to 0 to include every committed fiber.
   * @default 0
   */
  minFiberActualDurationMs?: number;
}

export interface LiteHandle {
  /**
   * Stop emitting events. Idempotent. Bippy's instrumentation chain stays
   * installed but our handlers become no-ops.
   */
  stop: () => void;
  /**
   * Whether the handle is currently emitting events.
   */
  isActive: () => boolean;
  /**
   * Add a listener that receives every emitted event. Returns an unsubscribe.
   */
  subscribe: (listener: (event: LiteEvent) => void) => () => void;
}

export interface ProfilingHooks {
  markCommitStarted: (lanes: Lanes) => void;
  markCommitStopped: () => void;
  markRenderStarted: (lanes: Lanes) => void;
  markRenderYielded: () => void;
  markRenderStopped: () => void;
  markRenderScheduled: (lane: Lanes) => void;
  markLayoutEffectsStarted: (lanes: Lanes) => void;
  markLayoutEffectsStopped: () => void;
  markPassiveEffectsStarted: (lanes: Lanes) => void;
  markPassiveEffectsStopped: () => void;
  markComponentRenderStarted: (fiber: Fiber) => void;
  markComponentRenderStopped: () => void;
  markComponentLayoutEffectMountStarted: (fiber: Fiber) => void;
  markComponentLayoutEffectMountStopped: () => void;
  markComponentLayoutEffectUnmountStarted: (fiber: Fiber) => void;
  markComponentLayoutEffectUnmountStopped: () => void;
  markComponentPassiveEffectMountStarted: (fiber: Fiber) => void;
  markComponentPassiveEffectMountStopped: () => void;
  markComponentPassiveEffectUnmountStarted: (fiber: Fiber) => void;
  markComponentPassiveEffectUnmountStopped: () => void;
  markStateUpdateScheduled: (fiber: Fiber, lane: Lanes) => void;
  markForceUpdateScheduled: (fiber: Fiber, lane: Lanes) => void;
  markComponentSuspended: (fiber: Fiber, wakeable: unknown, lanes: Lanes) => void;
  markComponentErrored: (fiber: Fiber, thrownValue: unknown, lanes: Lanes) => void;
}

/**
 * `injectProfilingHooks` and `getLaneLabelMap` are public-by-accident methods
 * on the renderer object that React DevTools uses for the Timeline Profiler.
 * Not declared on bippy's `ReactRenderer`, so we extend locally.
 */
export interface ReactRendererWithProfiling extends ReactRenderer {
  injectProfilingHooks?: (hooks: ProfilingHooks) => void;
  getLaneLabelMap?: () => Map<number, string> | null;
}

declare global {
  interface Window {
    __REACT_SCAN_LITE__?: LiteHandle;
  }
}
