import type { Fiber, FiberRoot } from 'react-reconciler';
import type * as React from 'react';
import {
  getTimings,
  hasMemoCache,
  traverseContexts,
  traverseState,
  instrument,
  createFiberVisitor,
  getDisplayName,
  getType,
} from 'bippy';
import { signal } from '@preact/signals';
import { ReactScanInternals } from '.';

export interface Change {
  name: string;
  prevValue: unknown;
  nextValue: unknown;
  unstable: boolean;
}

export interface Render {
  type: 'props' | 'context' | 'state' | 'misc';
  name: string | null;
  time: number;
  count: number;
  trigger: boolean;
  forget: boolean;
  changes: Array<Change> | null;
  label?: string;
}

const unstableTypes = ['function', 'object'];

export const isValidElement = (value: unknown): value is React.ReactElement => {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$$typeof' in value &&
    typeof value.$$typeof === 'symbol' &&
    String(value.$$typeof) === 'Symbol(react.element)'
  );
};

export const fastSerialize = (value: unknown) => {
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
        return value.length > 0 ? '[…]' : '[]';
      }
      if (isValidElement(value)) {
        // attempt to extract some name from the component
        return `<${getDisplayName(value.type) ?? ''}${
          Object.keys(value.props || {}).length > 0 ? ' …' : ''
        }>`;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        value.constructor === Object
      ) {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            return '{…}';
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

// eslint-disable-next-line @typescript-eslint/ban-types
export const getPropsRender = (fiber: Fiber, type: Function): Render | null => {
  const changes: Array<Change> = [];

  const prevProps = fiber.alternate?.memoizedProps;
  const nextProps = fiber.memoizedProps;

  for (const propName in { ...prevProps, ...nextProps }) {
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
      name: propName,
      prevValue,
      nextValue,
      unstable: false,
    };
    changes.push(change);

    const prevValueString = fastSerialize(prevValue);
    const nextValueString = fastSerialize(nextValue);

    if (
      !unstableTypes.includes(typeof prevValue) ||
      !unstableTypes.includes(typeof nextValue) ||
      prevValueString !== nextValueString
    ) {
      continue;
    }

    change.unstable = true;
  }
  const { selfTime } = getTimings(fiber);

  return {
    type: 'props',
    count: 1,
    trigger: false,
    changes,
    name: getDisplayName(type),
    time: selfTime,
    forget: hasMemoCache(fiber),
  };
};

export const getContextRender = (
  fiber: Fiber,
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: Function,
): Render | null => {
  const changes: Array<Change> = [];

  const result = traverseContexts(fiber, (prevContext, nextContext) => {
    const prevValue = prevContext.memoizedValue;
    const nextValue = nextContext.memoizedValue;

    const change: Change = {
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

  if (!result) return null;

  const { selfTime } = getTimings(fiber);

  return {
    type: 'context',
    count: 1,
    trigger: false,
    changes,
    name: getDisplayName(type),
    time: selfTime,
    forget: hasMemoCache(fiber),
  };
};

export const createInstrumentation = ({
  onCommitStart,
  isValidFiber,
  onRender,
  onCommitFinish,
}: {
  onCommitStart: () => void;
  isValidFiber: (fiber: Fiber) => boolean;
  onRender: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish: () => void;
}) => {
  const instrumentation = {
    isPaused: signal(!ReactScanInternals.options.value.enabled), // this will typically be false, but in cases where a user provides showToolbar: true, this will be true
    fiberRoots: new Set<FiberRoot>(),
    onCommitFiberRoot: (_rendererID: number, _root: FiberRoot) => {
      /**/
    },
  };

  const handleRender = (fiber: Fiber) => {
    const type = getType(fiber.type);
    if (!type) return null;
    if (!isValidFiber(fiber)) return null;

    const propsRender = getPropsRender(fiber, type);
    const contextRender = getContextRender(fiber, type);

    let trigger = false;
    if (fiber.alternate) {
      const didStateChange = traverseState(fiber, (prevState, nextState) => {
        return !Object.is(prevState.memoizedState, nextState.memoizedState);
      });
      if (didStateChange) {
        trigger = true;
      }
    }
    const name = getDisplayName(type);
    if (name === 'Million(Profiler)') return;

    if (!propsRender && !contextRender) return null;

    const renders: Array<Render> = [];
    if (propsRender) {
      propsRender.trigger = trigger;
      renders.push(propsRender);
    }
    if (contextRender) {
      contextRender.trigger = trigger;
      renders.push(contextRender);
    }
    const { selfTime } = getTimings(fiber);
    if (trigger) {
      renders.push({
        type: 'state',
        count: 1,
        trigger,
        changes: [],
        name: getDisplayName(type),
        time: selfTime,
        forget: hasMemoCache(fiber),
      });
    }
    if (!propsRender && !contextRender && !trigger) {
      renders.push({
        type: 'misc',
        count: 1,
        trigger,
        changes: [],
        name: getDisplayName(type),
        time: selfTime,
        forget: hasMemoCache(fiber),
      });
    }
    onRender(fiber, renders);
  };

  const visitor = createFiberVisitor({
    onRender: handleRender,
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('[React Scan] Error instrumenting: ', error);
    },
  });

  const onCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
    if (instrumentation.isPaused.value) return;
    onCommitStart();
    if (root) {
      instrumentation.fiberRoots.add(root);
    }
    visitor(rendererID, root);

    onCommitFinish();
  };

  instrument({ onCommitFiberRoot });

  instrumentation.onCommitFiberRoot = onCommitFiberRoot;

  return instrumentation;
};
