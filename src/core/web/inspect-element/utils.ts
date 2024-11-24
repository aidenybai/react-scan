import { Fiber, FiberRoot } from 'react-reconciler';
import { ReactScanInternals } from '../../index';
import {
  FunctionComponentTag,
  ClassComponentTag,
  isHostComponent,
  ForwardRefTag,
  traverseFiber,
} from '../../instrumentation/fiber';

export const getFiberFromElement = (element: HTMLElement): Fiber | null => {
  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__!;
    if (!renderers) return null;
    for (const [_, renderer] of Array.from(renderers)) {
      try {
        const fiber = renderer.findFiberByHostInstance(element);
        if (fiber) return fiber;
      } catch (e) {
        // If React is mid-render, references to previous nodes may disappear
      }
    }
  }

  if ('_reactRootContainer' in element) {
    // @ts-expect-error - Property '_reactRootContainer' does not exist on type 'HTMLElement'
    return element._reactRootContainer?._internalRoot?.current?.child;
  }

  for (const key in element) {
    if (
      key.startsWith('__reactInternalInstance$') ||
      key.startsWith('__reactFiber')
    ) {
      return element[key as keyof HTMLElement] as unknown as Fiber;
    }
  }
  return null;
};

export const getFirstStateNode = (fiber: Fiber): HTMLElement | null => {
  let current = fiber;
  while (current) {
    if (current.stateNode instanceof HTMLElement) {
      return current.stateNode;
    }

    if (!current.child) {
      return null;
    }
    current = current.child;
  }
  return null;
};

export const getNearestFiberFromElement = (element: HTMLElement | null) => {
  if (!element) return null;
  let target: HTMLElement | null = element;
  let originalFiber = getFiberFromElement(target);
  if (!originalFiber) {
    return null;
  }
  const res = getParentCompositeFiber(originalFiber);
  if (!res) {
    return null;
  }

  return [res[0], null] as const;
};

export const getParentCompositeFiber = (fiber: Fiber) => {
  let curr: Fiber | null = fiber;
  let prevNonHost = null;

  while (curr) {
    if (curr.tag === FunctionComponentTag || curr.tag === ClassComponentTag) {
      return [curr, prevNonHost] as const;
    }
    if (isHostComponent(curr)) {
      prevNonHost = curr;
    }
    curr = curr.return;
  }
};

export const getChangedProps = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();
  const currentProps = fiber.memoizedProps || {};
  const previousProps = fiber.alternate?.memoizedProps || {};

  Object.keys(currentProps).forEach((key) => {
    if (currentProps[key] !== previousProps[key]) {
      changes.add(key);
    }
  });

  return changes;
};

export const getStateFromFiber = (fiber: Fiber): any => {
  if (!fiber) return {};

  if (fiber.tag === FunctionComponentTag || fiber.tag === ForwardRefTag) {
    // Functional component, need to traverse hooks
    let memoizedState = fiber.memoizedState;
    const state: any = {};
    let index = 0;

    while (memoizedState) {
      if (memoizedState.queue && memoizedState.memoizedState !== undefined) {
        state[`Hook #${index}`] = memoizedState.memoizedState;
      }
      memoizedState = memoizedState.next;
      index++;
    }

    return state;
  } else if (fiber.tag === ClassComponentTag) {
    // Class component, memoizedState is the component state
    return fiber.memoizedState || {};
  } else {
    return {};
  }
};

export const getChangedState = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();

  const currentState = getStateFromFiber(fiber);
  const previousState = fiber.alternate
    ? getStateFromFiber(fiber.alternate)
    : {};

  Object.keys(currentState).forEach((key) => {
    if (currentState[key] !== previousState[key]) {
      changes.add(key);
    }
  });

  return changes;
};

const isFiberInTree = (fiber: Fiber, root: Fiber): boolean => {
  return !!traverseFiber(root, (searchFiber) => searchFiber === fiber);
};

export const isCurrentTree = (fiber: Fiber) => {
  let curr: Fiber | null = fiber;
  let rootFiber: Fiber | null = null;

  while (curr) {
    if (curr.stateNode && ReactScanInternals.fiberRoots.has(curr.stateNode)) {
      rootFiber = curr;
      break;
    }
    curr = curr.return;
  }

  if (!rootFiber) {
    return false;
  }

  const fiberRoot = rootFiber.stateNode as FiberRoot;
  const currentRootFiber = fiberRoot.current;

  return isFiberInTree(fiber, currentRootFiber);
};