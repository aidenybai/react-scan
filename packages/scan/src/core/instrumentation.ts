import type { Fiber, FiberRoot } from 'react-reconciler';
import {
  getTimings,
  hasMemoCache,
  traverseContexts,
  traverseState,
  instrument,
  createFiberVisitor,
  getDisplayName,
  getType,
  isValidElement,
  didFiberCommit,
  getMutatedHostFibers,
  traverseProps,
} from 'bippy';
import { type Signal, signal } from '@preact/signals';
import { ReactScanInternals } from './index';

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

export interface Change {
  type: 'props' | 'context' | 'state';
  name: string;
  prevValue: unknown;
  nextValue: unknown;
  unstable: boolean;
}

export type Category = 'commit' | 'unstable' | 'unnecessary';

export interface Render {
  phase: string;
  componentName: string | null;
  time: number | null;
  count: number;
  forget: boolean;
  changes: Array<Change> | null;
  unnecessary: boolean;
  didCommit: boolean;
  fps: number;
}

const unstableTypes = ['function', 'object'];

export const fastSerialize = (value: unknown, depth = 0) => {
  if (depth < 0) return '…';
  switch (typeof value) {
    case 'function':
      return value.toString();
    case 'string':
      return value;
    case 'object':
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? `[${value.length}]` : '[]';
      }
      if (isValidElement(value)) {
        // attempt to extract some name from the component
        return `<${getDisplayName(value.type) ?? ''} ${
          Object.keys(value.props || {}).length
        }>`;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        value.constructor === Object
      ) {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            return `{${Object.keys(value).length}}`;
          }
        }
        return '{}';
      }
      // eslint-disable-next-line no-case-declarations
      const tagString = Object.prototype.toString.call(value).slice(8, -1);
      if (tagString === 'Object') {
        const proto = Object.getPrototypeOf(value);
        const constructor = proto?.constructor;
        if (typeof constructor === 'function') {
          return `${constructor.displayName || constructor.name || ''}{…}`;
        }
      }
      return `${tagString}{…}`;
    default:
      return String(value);
  }
};

export const getPropsChanges = (fiber: Fiber) => {
  const changes: Array<Change> = [];

  const prevProps = fiber.alternate?.memoizedProps || {};
  const nextProps = fiber.memoizedProps || {};

  // Get union props
  // TODO needs faster solution
  const props = new Set([
    ...Object.keys(prevProps),
    ...Object.keys(nextProps),
  ]);

  for (const propName in props) {
    const prevValue = prevProps?.[propName];
    const nextValue = nextProps?.[propName];

    if (
      Object.is(prevValue, nextValue) ||
      isValidElement(prevValue) ||
      isValidElement(nextValue)
    ) {
      continue;
    }
    const change: Change = {
      type: 'props',
      name: propName,
      prevValue,
      nextValue,
      unstable: false,
    };
    changes.push(change);

    if (isValueUnstable(prevValue, nextValue)) {
      change.unstable = true;
    }
  }

  return changes;
};

export const getStateChanges = (fiber: Fiber) => {
  const changes: Array<Change> = [];

  traverseState(fiber, (prevState, nextState) => {
    if (Object.is(prevState.memoizedState, nextState.memoizedState)) return;
    const change: Change = {
      type: 'state',
      name: '',
      prevValue: prevState.memoizedState,
      nextValue: nextState.memoizedState,
      unstable: false,
    };
    changes.push(change);
  });

  return changes;
};


export const getContextChanges = (fiber: Fiber) => {
  const changes: Array<Change> = [];

  traverseContexts(fiber, (prevContext, nextContext) => {
    const prevValue = prevContext.memoizedValue;
    const nextValue = nextContext.memoizedValue;

    const change: Change = {
      type: 'context',
      name: '',
      prevValue,
      nextValue,
      unstable: false,
    };
    changes.push(change);

    const prevValueString = fastSerialize(prevValue);
    const nextValueString = fastSerialize(nextValue);

    if (
      unstableTypes.includes(typeof prevValue) &&
      unstableTypes.includes(typeof nextValue) &&
      prevValueString === nextValueString
    ) {
      change.unstable = true;
    }
  });

  return changes;
};

type OnRenderHandler = (fiber: Fiber, renders: Array<Render>) => void;
type OnCommitStartHandler = () => void;
type OnCommitFinishHandler = () => void;
type OnErrorHandler = (error: unknown) => void;
type IsValidFiberHandler = (fiber: Fiber) => boolean;

interface InstrumentationConfig {
  onCommitStart: OnCommitStartHandler;
  isValidFiber: IsValidFiberHandler;
  onRender: OnRenderHandler;
  onCommitFinish: OnCommitFinishHandler;
  onError: OnErrorHandler;
}

interface InstrumentationInstance {
  key: string;
  config: InstrumentationConfig;
  instrumentation: Instrumentation;
}

interface Instrumentation {
  isPaused: Signal<boolean>;
  fiberRoots: Set<FiberRoot>;
}

const instrumentationInstances = new Map<string, InstrumentationInstance>();
let inited = false;

const getAllInstances = () => Array.from(instrumentationInstances.values());

// FIXME: calculation is slow
export const isRenderUnnecessary = (fiber: Fiber) => {
  if (!didFiberCommit(fiber)) return true;

  const mutatedHostFibers = getMutatedHostFibers(fiber);
  for (const mutatedHostFiber of mutatedHostFibers) {
    let isRequiredChange = false;
    traverseProps(mutatedHostFiber, (prevValue, nextValue) => {
      if (
        !Object.is(prevValue, nextValue) &&
        !isValueUnstable(prevValue, nextValue)
      ) {
        isRequiredChange = true;
      }
    });
    if (isRequiredChange) return false;
  }
  return true;
};

export const createInstrumentation = (
  instanceKey: string,
  config: InstrumentationConfig,
) => {
  const instrumentation: Instrumentation = {
    // this will typically be false, but in cases where a user provides showToolbar: true, this will be true
    isPaused: signal(!ReactScanInternals.options.value.enabled),
    fiberRoots: new Set<FiberRoot>(),
  };
  instrumentationInstances.set(instanceKey, {
    key: instanceKey,
    config,
    instrumentation,
  });
  if (!inited) {
    inited = true;
    const visitor = createFiberVisitor({
      onRender(fiber, phase) {
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

        const propsChanges = getPropsChanges(fiber);
        const stateChanges = getStateChanges(fiber);
        const contextChanges = getContextChanges(fiber);

        for (let i = 0, len = propsChanges.length; i < len; i++) {
          const change = propsChanges[i];
          changes.push(change);
        }
        for (let i = 0, len = stateChanges.length; i < len; i++) {
          const change = stateChanges[i];
          changes.push(change);
        }
        for (let i = 0, len = contextChanges.length; i < len; i++) {
          const change = contextChanges[i];
          changes.push(change);
        }

        const { selfTime } = getTimings(fiber);

        const fps = getFPS();

        const render: Render = {
          phase,
          componentName: getDisplayName(type),
          count: 1,
          changes,
          time: selfTime,
          forget: hasMemoCache(fiber),
          unnecessary: isRenderUnnecessary(fiber),
          didCommit: didFiberCommit(fiber),
          fps,
        };

        for (let i = 0, len = validInstancesIndicies.length; i < len; i++) {
          const index = validInstancesIndicies[i];
          const instance = allInstances[index];
          instance.config.onRender(fiber, [render]);
        }
      },
      onError(error) {
        const allInstances = getAllInstances();
        for (const instance of allInstances) {
          instance.config.onError(error);
        }
      },
    });
    instrument({
      name: 'react-scan',
      onCommitFiberRoot: (rendererID, root) => {
        const allInstances = getAllInstances();
        for (const instance of allInstances) {
          instance.config.onCommitStart();
        }
        visitor(rendererID, root);
        for (const instance of allInstances) {
          instance.config.onCommitFinish();
        }
      },
    });
  }
  return instrumentation;
};
