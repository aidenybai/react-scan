import { type Signal, signal } from '@preact/signals';
import {
  ClassComponentTag,
  type Fiber,
  type FiberRoot,
  ForwardRefTag,
  FunctionComponentTag,
  MemoComponentTag,
  type MemoizedState,
  SimpleMemoComponentTag,
  didFiberCommit,
  getDisplayName,
  getMutatedHostFibers,
  getTimings,
  getType,
  hasMemoCache,
  instrument,
  traverseContexts,
  traverseProps,
  traverseRenderedFibers,
} from 'bippy';
import { isValidElement } from 'preact';
import { isEqual } from '~core/utils';
import {
  RENDER_PHASE_STRING_TO_ENUM,
  type RenderPhase,
} from '~web/utils/outline';
import {
  collectContextChanges,
  collectPropsChanges,
  collectStateChanges,
} from '~web/views/inspector/timeline/utils';
import {
  type Change,
  type ContextChange,
  ReactScanInternals,
  type StateChange,
  Store,
} from './index';

let fps = 0;
let lastTime = performance.now();
let frameCount = 0;
let initedFps = false;

const updateFPS = () => {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(updateFPS);
};

export const getFPS = () => {
  if (!initedFps) {
    initedFps = true;
    updateFPS();
    fps = 60;
  }

  return fps;
};

export const isElementVisible = (el: Element) => {
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.contentVisibility !== 'hidden' &&
    style.opacity !== '0'
  );
};

export const isValueUnstable = (prevValue: unknown, nextValue: unknown) => {
  const prevValueString = fastSerialize(prevValue);
  const nextValueString = fastSerialize(nextValue);
  return (
    prevValueString === nextValueString &&
    unstableTypes.includes(typeof prevValue) &&
    unstableTypes.includes(typeof nextValue)
  );
};

export const isElementInViewport = (
  el: Element,
  rect = el.getBoundingClientRect(),
) => {
  const isVisible =
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth;

  return isVisible && rect.width && rect.height;
};

// biome-ignore lint/suspicious/noConstEnum: Using const enum for better performance since it's inlined at compile time and removed from the JS output
export const enum ChangeReason {
  Props = 0b001,
  FunctionalState = 0b010,
  ClassState = 0b011,
  Context = 0b100,
}

export interface AggregatedChange {
  type: number; // union of AggregatedChangeReason
  unstable: boolean;
}

export interface Render {
  phase: RenderPhase;
  componentName: string | null;
  time: number | null;
  count: number;
  forget: boolean;
  changes: Array<Change>;
  unnecessary: boolean | null;
  didCommit: boolean;
  fps: number;
}

const unstableTypes = ['function', 'object'];

const cache = new WeakMap<object, string>();

export function fastSerialize(value: unknown, depth = 0): string {
  if (depth < 0) return '…';

  switch (typeof value) {
    case 'function':
      return value.toString();
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'undefined':
      return String(value);
    case 'object':
      break;
    default:
      return String(value);
  }

  if (value === null) return 'null';

  if (cache.has(value)) {
    const cached = cache.get(value);
    if (cached !== undefined) {
      return cached;
    }
  }

  if (Array.isArray(value)) {
    const str = value.length ? `[${value.length}]` : '[]';
    cache.set(value, str);
    return str;
  }

  if (isValidElement(value)) {
    const type = getDisplayName(value.type) ?? '';
    const propCount = value.props ? Object.keys(value.props).length : 0;
    const str = `<${type} ${propCount}>`;
    cache.set(value, str);
    return str;
  }

  if (Object.getPrototypeOf(value) === Object.prototype) {
    const keys = Object.keys(value);
    const str = keys.length ? `{${keys.length}}` : '{}';
    cache.set(value, str);
    return str;
  }

  const ctor =
    value && typeof value === 'object' ? value.constructor : undefined;
  if (ctor && typeof ctor === 'function' && ctor.name) {
    const str = `${ctor.name}{…}`;
    cache.set(value, str);
    return str;
  }

  const tagString = Object.prototype.toString.call(value).slice(8, -1);
  const str = `${tagString}{…}`;
  cache.set(value, str);
  return str;
}

export const getPropsChanges = (fiber: Fiber) => {
  const changes: Array<Change> = [];

  const prevProps = fiber.alternate?.memoizedProps || {};
  const nextProps = fiber.memoizedProps || {};

  const allKeys = new Set([
    ...Object.keys(prevProps),
    ...Object.keys(nextProps),
  ]);
  for (const propName in allKeys) {
    // const prevValue = prevProps?.[propName];
    const nextValue = nextProps?.[propName];

    const change: Change = {
      type: ChangeReason.Props,
      name: propName,
      value: nextValue,
    };
    changes.push(change);
  }

  return changes;
};

export const getStateChanges = (fiber: Fiber): StateChange[] => {
  if (!fiber) return [];
  const changes: StateChange[] = [];

  if (
    fiber.tag === FunctionComponentTag ||
    fiber.tag === ForwardRefTag ||
    fiber.tag === SimpleMemoComponentTag ||
    fiber.tag === MemoComponentTag
  ) {
    let memoizedState: MemoizedState | null = fiber.memoizedState;
    let prevState: MemoizedState | null | undefined =
      fiber.alternate?.memoizedState;
    let index = 0;

    while (memoizedState) {
      if (memoizedState.queue && memoizedState.memoizedState !== undefined) {
        const change: StateChange = {
          type: ChangeReason.FunctionalState,
          name: index.toString(),
          value: memoizedState.memoizedState,
          prevValue: prevState?.memoizedState,
        };
        if (!isEqual(change.prevValue, change.value)) {
          changes.push(change);
        }
      }
      memoizedState = memoizedState.next;
      prevState = prevState?.next;
      index++;
    }

    return changes;
  }

  if (fiber.tag === ClassComponentTag) {
    // when we have class component fiber, memoizedState is the component state
    const change: StateChange = {
      type: ChangeReason.ClassState,
      name: 'state',
      value: fiber.memoizedState,
      prevValue: fiber.alternate?.memoizedState,
    };
    if (!isEqual(change.prevValue, change.value)) {
      changes.push(change);
    }
    return changes;
  }

  return changes;
};
interface ContextFiber {
  context: unknown; // refers to Context<T>;
  memoizedValue: unknown;
}

let lastContextId = 0;
const contextIdMap = new WeakMap<ContextFiber, number>();
const getContextId = (contextFiber: ContextFiber) => {
  const existing = contextIdMap.get(contextFiber);
  if (existing) {
    return existing;
  }
  lastContextId++;
  contextIdMap.set(contextFiber, lastContextId);
  return lastContextId;
};

function getContextChangesTraversal(
  this: Array<Change>,
  nextValue: ContextFiber | null | undefined,
  prevValue: ContextFiber | null | undefined,
): void {
  if (!nextValue || !prevValue) return;
  // const prevMemoizedValue = prevValue.memoizedValue;
  const nextMemoizedValue = nextValue.memoizedValue;

  const change: ContextChange = {
    type: ChangeReason.Context,
    name:
      (nextValue.context as { displayName: string | undefined }).displayName ??
      'UnnamedContext',
    value: nextMemoizedValue,
    contextType: getContextId(nextValue.context as ContextFiber),

    // unstable: false,
  };
  this.push(change);

  // const prevValueString = fastSerialize(prevMemoizedValue);
  // const nextValueString = fastSerialize(nextMemoizedValue);

  // if (
  //   unstableTypes.includes(typeof prevMemoizedValue) &&
  //   unstableTypes.includes(typeof nextMemoizedValue) &&
  //   prevValueString === nextValueString
  // ) {
  //   change.unstable = true;
  // }
}

export const getContextChanges = (fiber: Fiber) => {
  const changes: Array<ContextChange> = [];

  // Alexis: we use bind functions so that the compiler doesn't produce
  // any closures
  traverseContexts(fiber, getContextChangesTraversal.bind(changes));

  return changes;
};

type OnRenderHandler = (fiber: Fiber, renders: Array<Render>) => void;
type OnCommitStartHandler = () => void;
type OnCommitFinishHandler = () => void;
type OnErrorHandler = (error: unknown) => void;
type IsValidFiberHandler = (fiber: Fiber) => boolean;
type OnActiveHandler = () => void;

interface InstrumentationConfig {
  onCommitStart: OnCommitStartHandler;
  isValidFiber: IsValidFiberHandler;
  onRender: OnRenderHandler;
  onCommitFinish: OnCommitFinishHandler;
  onError: OnErrorHandler;
  onActive?: OnActiveHandler;
  // monitoring does not need to track changes, and it adds overhead to leave it on
  trackChanges: boolean;
  // allows monitoring to continue tracking renders even if react scan dev mode is disabled
  forceAlwaysTrackRenders?: boolean;
}

interface InstrumentationInstance {
  key: string;
  config: InstrumentationConfig;
  instrumentation: Instrumentation;
}

interface Instrumentation {
  isPaused: Signal<boolean>;
  fiberRoots: WeakSet<FiberRoot>;
}

const instrumentationInstances = new Map<string, InstrumentationInstance>();
let inited = false;

const getAllInstances = () => Array.from(instrumentationInstances.values());

interface IsRenderUnnecessaryState {
  isRequiredChange: boolean;
}

function isRenderUnnecessaryTraversal(
  this: IsRenderUnnecessaryState,
  _propsName: string,
  prevValue: unknown,
  nextValue: unknown,
): void {
  if (
    !isEqual(prevValue, nextValue) &&
    !isValueUnstable(prevValue, nextValue)
  ) {
    this.isRequiredChange = true;
  }
}

// FIXME: calculation is slow
export const isRenderUnnecessary = (fiber: Fiber) => {
  if (!didFiberCommit(fiber)) return true;

  const mutatedHostFibers = getMutatedHostFibers(fiber);
  for (const mutatedHostFiber of mutatedHostFibers) {
    const state: IsRenderUnnecessaryState = {
      isRequiredChange: false,
    };
    traverseProps(mutatedHostFiber, isRenderUnnecessaryTraversal.bind(state));
    if (state.isRequiredChange) return false;
  }
  return true;
};

// // re-implement this in new-outlines
// const shouldRunUnnecessaryRenderCheck = () => {
//   // yes, this can be condensed into one conditional, but ifs are easier to reason/build on than long boolean expressions
//   if (!ReactScanInternals.options.value.trackUnnecessaryRenders) {
//     return false;
//   }

//   // only run unnecessaryRenderCheck when monitoring is active in production if the user set dangerouslyForceRunInProduction
//   if (
//     getIsProduction() &&
//     Store.monitor.value &&
//     ReactScanInternals.options.value.dangerouslyForceRunInProduction &&
//     ReactScanInternals.options.value.trackUnnecessaryRenders
//   ) {
//     return true;
//   }

//   if (getIsProduction() && Store.monitor.value) {
//     return false;
//   }

//   return ReactScanInternals.options.value.trackUnnecessaryRenders;
// };

const TRACK_UNNECESSARY_RENDERS = false;


export const createInstrumentation = (
  instanceKey: string,
  config: InstrumentationConfig,
) => {
  const instrumentation: Instrumentation = {
    // this will typically be false, but in cases where a user provides showToolbar: true, this will be true
    isPaused: signal(!ReactScanInternals.options.value.enabled),
    fiberRoots: new WeakSet<FiberRoot>(),
  };
  instrumentationInstances.set(instanceKey, {
    key: instanceKey,
    config,
    instrumentation,
  });
  if (!inited) {
    inited = true;

    instrument({
      name: 'react-scan',
      onActive: config.onActive,
      onCommitFiberRoot(_rendererID, root) {
        instrumentation.fiberRoots.add(root);
        if (
          ReactScanInternals.instrumentation?.isPaused.value &&
          (Store.inspectState.value.kind === 'inspect-off' ||
            Store.inspectState.value.kind === 'uninitialized') &&
          !config.forceAlwaysTrackRenders
        ) {
          return;
        }
        const allInstances = getAllInstances();
        for (const instance of allInstances) {
          instance.config.onCommitStart();
        }

        traverseRenderedFibers(
          root.current,
          (fiber: Fiber, phase: 'mount' | 'update' | 'unmount') => {
            const type = getType(fiber.type);
            if (!type) return null;

            const allInstances = getAllInstances();
            const validInstancesIndicies: Array<number> = [];
            for (let i = 0, len = allInstances.length; i < len; i++) {
              const instance = allInstances[i];
              if (!instance.config.isValidFiber(fiber)) continue;
              validInstancesIndicies.push(i);
            }
            if (!validInstancesIndicies.length) return null;

            const changes: Array<Change> = [];

            if (allInstances.some((instance) => instance.config.trackChanges)) {
              const changesProps = collectPropsChanges(fiber).changes;
              const changesState = collectStateChanges(fiber).changes;
              const changesContext = collectContextChanges(fiber).changes;

              // Convert props changes
              changes.push.apply(
                null,
                changesProps.map(
                  (change) =>
                    ({
                      type: ChangeReason.Props,
                      name: change.name,
                      value: change.value,
                    }) as Change,
                ),
              );

              // Convert state changes
              for (const change of changesState) {
                if (fiber.tag === ClassComponentTag) {
                  changes.push({
                    type: ChangeReason.ClassState,
                    name: change.name.toString(),
                    value: change.value,
                  } as Change);
                } else {
                  changes.push({
                    type: ChangeReason.FunctionalState,
                    name: change.name.toString(),
                    value: change.value,
                  } as Change);
                }
              }

              // Convert context changes
              changes.push.apply(
                null,
                changesContext.map(
                  (change) =>
                    ({
                      type: ChangeReason.Context,
                      name: change.name,
                      value: change.value,
                      contextType: Number(change.contextType),
                    }) as Change,
                ),
              );
            }

            const { selfTime } = getTimings(fiber);

            const fps = getFPS();
            const render: Render = {
              phase: RENDER_PHASE_STRING_TO_ENUM[phase],
              componentName: getDisplayName(type),
              count: 1,
              changes,
              time: selfTime,
              forget: hasMemoCache(fiber),
              // todo: allow this to be toggle-able through toolbar
              // todo: performance optimization: if the last fiber measure was very off screen, do not run isRenderUnnecessary
              unnecessary: TRACK_UNNECESSARY_RENDERS
                ? isRenderUnnecessary(fiber)
                : null,

              didCommit: didFiberCommit(fiber),
              fps,
            };
            for (let i = 0, len = validInstancesIndicies.length; i < len; i++) {
              const index = validInstancesIndicies[i];
              const instance = allInstances[index];
              instance.config.onRender(fiber, [render]);
            }
          },
        );

        for (const instance of allInstances) {
          instance.config.onCommitFinish();
        }
      },
    });
  }
  return instrumentation;
};
