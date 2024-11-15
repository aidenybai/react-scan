import type { Fiber, FiberRoot } from 'react-reconciler';
import * as React from 'react';
import { type NO_OP } from '../utils';
import { ReactScanInternals } from '../index';
import { getDisplayName, fastSerialize, getType } from './utils';
import {
  didFiberRender,
  getSelfTime,
  hasMemoCache,
  registerDevtoolsHook,
  traverseFiber,
} from './fiber';

declare global {
  interface Window {
    __REACT_SCAN__?: {
      ReactScanInternals: typeof ReactScanInternals;
    };
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      checkDCE: typeof NO_OP;
      supportsFiber: boolean;
      renderers: Map<number, any>;
      onScheduleFiberRoot: typeof NO_OP;
      onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
      onCommitFiberUnmount: typeof NO_OP;
      inject: (renderer: any) => number;
    };
  }
}

export interface Change {
  name: string;
  prevValue: unknown;
  nextValue: unknown;
  unstable: boolean;
}

export interface Render {
  name: string | null;
  time: number;
  count: number;
  trigger: boolean;
  forget: boolean;
  changes: Change[] | null;
}

const unstableTypes = ['function', 'object'];

export const getPropsRender = (fiber: Fiber): Render | null => {
  if (!fiber || !didFiberRender(fiber) || ReactScanInternals.isPaused)
    return null;
  const type = getType(fiber.type);
  if (!type) return null;

  const changes: Change[] = [];

  const prevProps = fiber.alternate?.memoizedProps;
  const nextProps = fiber.memoizedProps;

  for (const propName in { ...prevProps, ...nextProps }) {
    const prevValue = prevProps?.[propName];
    const nextValue = nextProps?.[propName];

    if (
      Object.is(prevValue, nextValue) ||
      React.isValidElement(prevValue) ||
      React.isValidElement(nextValue) ||
      propName === 'children'
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
    count: 1,
    trigger: false,
    changes,
    name: getDisplayName(fiber.type),
    time: getSelfTime(fiber),
    forget: hasMemoCache(fiber),
  };
};

let inited = false;

export const monitor = (
  onMonitorStart: () => void,
  onRender: (fiber: Fiber, render: Render) => void,
  onMonitorFinish: () => void,
) => {
  if (inited) return;
  inited = true;

  const handleCommitFiberRoot = (_rendererID: number, root: FiberRoot) => {
    if (ReactScanInternals.isPaused) return;
    onMonitorStart();

    const handleFiber = (fiber: Fiber, trigger: boolean) => {
      const render = getPropsRender(fiber);
      if (!render) return null;
      render.trigger = trigger;

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
    };

    if (root.memoizedUpdaters) {
      for (const fiber of root.memoizedUpdaters) {
        const render = handleFiber(fiber, true);
        if (render) onRender(fiber, render);
      }
    }

    traverseFiber(root.current, (fiber) => {
      const render = handleFiber(fiber, false);
      if (render) onRender(fiber, render);
    });

    onMonitorFinish();
  };

  ReactScanInternals.onCommitFiberRoot = (
    rendererID: number,
    root: FiberRoot,
  ) => {
    try {
      handleCommitFiberRoot(rendererID, root);
    } catch (err) {
      /**/
    }
  };

  registerDevtoolsHook({
    onCommitFiberRoot: ReactScanInternals.onCommitFiberRoot,
  });
};
