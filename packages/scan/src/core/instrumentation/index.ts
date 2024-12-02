import type { Fiber, FiberRoot } from 'react-reconciler';
import * as React from 'react';
import { ReactScanInternals } from '../index';
import { isCompositeComponent } from '../web/inspect-element/utils';
import { getDisplayName, fastSerialize, getType } from './utils';
import {
  didFiberRender,
  getSelfTime,
  hasMemoCache,
  shouldFilterFiber,
  traverseContexts,
  traverseFiber,
  traverseState,
} from './fiber';
import { registerDevtoolsHook } from './init';

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
      React.isValidElement(prevValue) ||
      React.isValidElement(nextValue)
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

  return {
    type: 'props',
    count: 1,
    trigger: false,
    changes,
    name: getDisplayName(type),
    time: getSelfTime(fiber),
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

  return {
    type: 'context',
    count: 1,
    trigger: false,
    changes,
    name: getDisplayName(type),
    time: getSelfTime(fiber),
    forget: hasMemoCache(fiber),
  };
};
// back compat
export const reportRender = (
  name: string,
  fiber: Fiber,
  renders: Array<Render | null>,
) => {
  if (ReactScanInternals.options.report === false) return;
  const report = ReactScanInternals.reportData[name];
  if (report) {
    for (let i = 0, len = renders.length; i < len; i++) {
      const render = renders[i];
      if (render) {
        report.badRenders.push(render);
      }
    }
  }
  const time = getSelfTime(fiber) ?? 0;

  ReactScanInternals.reportData[name] = {
    count: (report?.count ?? 0) + 1,
    time: (report?.time ?? 0) + time,
    badRenders: report?.badRenders || [],
    type: getType(fiber.type) || fiber.type,
  };
};
export const reportRenderFiber = (fiber: Fiber, renders: Array<Render | null>) => {
  const [reportFiber, report] = (() => {
    const currentFiberData = ReactScanInternals.reportDataByFiber.get(fiber);
    if (currentFiberData) {
      return [fiber, currentFiberData] as const;
    }
    if (!fiber.alternate) {
      return [fiber, null] as const; // use the current fiber as a key
    }

    const alternateFiberData = ReactScanInternals.reportDataByFiber.get(
      fiber.alternate,
    );
    return [fiber.alternate, alternateFiberData] as const;
  })();

  if (report) {
    for (let i = 0, len = renders.length; i < len; i++) {
      const render = renders[i];
      if (render) {
        report.badRenders.push(render);
      }
    }
  }
  const time = getSelfTime(fiber);

  ReactScanInternals.reportDataByFiber.set(reportFiber, {
    count: (report?.count ?? 0) + 1,
    time: (report?.time ?? 0) + (time !== 0 ? time : 0.1), // .1ms lowest precision
    badRenders: report?.badRenders ?? [],
    displayName: getDisplayName(fiber.type),
  });
  ReactScanInternals.emit(
    'reportDataByFiber',
    ReactScanInternals.reportDataByFiber,
  );
};

export const instrument = ({
  onCommitStart,
  onRender,
  onCommitFinish,
}: {
  onCommitStart: () => void;
  onRender: (fiber: Fiber, render: Render) => void;
  onCommitFinish: () => void;
}) => {
  const handleCommitFiberRoot = (_rendererID: number, root: FiberRoot) => {
    if (
      (ReactScanInternals.isPaused &&
        ReactScanInternals.inspectState.kind === 'inspect-off') ||
      ReactScanInternals.options.enabled === false
    ) {
      return;
    }
    onCommitStart();
    const recordRender = (fiber: Fiber) => {
      const type = getType(fiber.type);
      if (!type) return null;
      if (!didFiberRender(fiber)) return null;

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
      if (name) {
        reportRender(name, fiber, [propsRender, contextRender]); // back compat
      }

      if (
        isCompositeComponent(fiber) // since we key on the fiber we don't need a display name (ex. memo compoenents are anonymous and dont have names)
      ) {
        reportRenderFiber(fiber, [propsRender, contextRender]);
      }

      if (!propsRender && !contextRender) return null;

      const allowList = ReactScanInternals.componentAllowList;
      const shouldAllow =
        allowList?.has(fiber.type) ?? allowList?.has(fiber.elementType);

      if (shouldAllow) {
        const parent = traverseFiber(
          fiber,
          (node) => {
            const options =
              allowList?.get(node.type) ?? allowList?.get(node.elementType);
            return options?.includeChildren;
          },
          true,
        );
        if (!parent && !shouldAllow) return null;
      }

      if (propsRender) {
        propsRender.trigger = trigger;
        onRender(fiber, propsRender);
      }
      if (contextRender) {
        contextRender.trigger = trigger;
        onRender(fiber, contextRender);
      }
      if (trigger) {
        onRender(fiber, {
          type: 'state',
          count: 1,
          trigger,
          changes: [],
          name: getDisplayName(type),
          time: getSelfTime(fiber),
          forget: hasMemoCache(fiber),
        });
      }
      if (!propsRender && !contextRender && !trigger) {
        onRender(fiber, {
          type: 'misc',
          count: 1,
          trigger,
          changes: [],
          name: getDisplayName(type),
          time: getSelfTime(fiber),
          forget: hasMemoCache(fiber),
        });
      }
    };

    const rootFiber = root.current;
    const wasMounted =
      rootFiber.alternate !== null &&
      Boolean(rootFiber.alternate.memoizedState?.element) &&
      // A dehydrated root is not considered mounted
      rootFiber.alternate.memoizedState.isDehydrated !== true;
    const isMounted = Boolean(rootFiber.memoizedState?.element);

    const mountFiber = (firstChild: Fiber, traverseSiblings: boolean) => {
      let fiber: Fiber | null = firstChild;

      // eslint-disable-next-line eqeqeq
      while (fiber != null) {
        const shouldIncludeInTree = !shouldFilterFiber(fiber);
        if (shouldIncludeInTree) {
          recordRender(fiber);
        }

        // eslint-disable-next-line eqeqeq
        if (fiber.child != null) {
          mountFiber(fiber.child, true);
        }
        fiber = traverseSiblings ? fiber.sibling : null;
      }
    };

    const updateFiber = (nextFiber: Fiber, prevFiber: Fiber) => {
      if (!prevFiber) return;

      const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
      if (shouldIncludeInTree) {
        recordRender(nextFiber);
      }

      if (nextFiber.child !== prevFiber.child) {
        let nextChild = nextFiber.child;

        while (nextChild) {
          const prevChild = nextChild.alternate;
          if (prevChild) {
            updateFiber(nextChild, prevChild);
          } else {
            mountFiber(nextChild, false);
          }

          nextChild = nextChild.sibling;
        }
      }
    };

    if (!wasMounted && isMounted) {
      mountFiber(rootFiber, false);
    } else if (wasMounted && isMounted) {
      updateFiber(rootFiber, rootFiber.alternate);
    }

    onCommitFinish();
  };

  ReactScanInternals.onCommitFiberRoot = (
    rendererID: number,
    root: FiberRoot,
  ) => {
    if (root) {
      ReactScanInternals.fiberRoots.add(root);
    }

    try {
      handleCommitFiberRoot(rendererID, root);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[React Scan] Error instrumenting: ', err);
    }
  };

  registerDevtoolsHook({
    onCommitFiberRoot: ReactScanInternals.onCommitFiberRoot,
  });
};
