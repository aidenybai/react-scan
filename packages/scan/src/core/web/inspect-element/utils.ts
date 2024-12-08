import type { Fiber } from 'react-reconciler';
import { ReactScanInternals } from '../../index';
import {
  FunctionComponentTag,
  ClassComponentTag,
  isHostComponent,
  traverseFiber,
  MemoComponentTag,
  SimpleMemoComponentTag,
  ForwardRefTag,
} from '../../instrumentation/fiber';
import { getRect } from '../outline';

export const getFiberFromElement = (element: HTMLElement): Fiber | null => {
  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
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

export const getFirstStateNode = (fiber: Fiber): Element | null => {
  let current: Fiber | null = fiber;
  while (current) {
    if (current.stateNode instanceof Element) {
      return current.stateNode;
    }

    if (!current.child) {
      break;
    }
    current = current.child;
  }

  while (current) {
    if (current.stateNode instanceof Element) {
      return current.stateNode;
    }

    if (!current.return) {
      break;
    }
    current = current.return;
  }
  return null;
};

export const getNearestFiberFromElement = (element: HTMLElement | null) => {
  if (!element) return null;
  const target: HTMLElement | null = element;
  const originalFiber = getFiberFromElement(target);
  if (!originalFiber) {
    return null;
  }
  const res = getParentCompositeFiber(originalFiber);
  if (!res) {
    return null;
  }

  return res[0];
};

export const getParentCompositeFiber = (fiber: Fiber) => {
  let curr: Fiber | null = fiber;
  let prevNonHost = null;

  while (curr) {
    if (isCompositeComponent(curr)) {
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
    if (currentProps[key] !== previousProps[key] && key !== 'children') {
      changes.add(key);
    }
  });

  return changes;
};

export const getStateFromFiber = (fiber: Fiber): any => {
  if (!fiber) return {};
  // only funtional components have memo tags,
  if (
    fiber.tag === FunctionComponentTag ||
    fiber.tag === ForwardRefTag ||
    fiber.tag === SimpleMemoComponentTag ||
    fiber.tag === MemoComponentTag
  ) {
    // Functional component, need to traverse hooks
    let memoizedState = fiber.memoizedState;
    const state: any = {};
    let index = 0;

    while (memoizedState) {
      if (memoizedState.queue && memoizedState.memoizedState !== undefined) {
        state[index] = memoizedState.memoizedState;
      }
      memoizedState = memoizedState.next;
      index++;
    }

    return state;
  } else if (fiber.tag === ClassComponentTag) {
    // Class component, memoizedState is the component state
    return fiber.memoizedState || {};
  }
  return {};
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

  const fiberRoot = rootFiber.stateNode;
  const currentRootFiber = fiberRoot.current;

  return isFiberInTree(fiber, currentRootFiber);
};

export const getCompositeComponentFromElement = (element: HTMLElement) => {
  const associatedFiber = getNearestFiberFromElement(element);
  if (!associatedFiber) return {};
  const currentAssociatedFiber = isCurrentTree(associatedFiber)
    ? associatedFiber
    : (associatedFiber.alternate ?? associatedFiber);
  const stateNode = getFirstStateNode(currentAssociatedFiber);
  if (!stateNode) return {};
  const targetRect = getRect(stateNode);
  if (!targetRect) return {};
  const anotherRes = getParentCompositeFiber(currentAssociatedFiber);
  if (!anotherRes) {
    return {};
  }
  let [parentCompositeFiber] = anotherRes;
  parentCompositeFiber =
    (isCurrentTree(parentCompositeFiber)
      ? parentCompositeFiber
      : parentCompositeFiber.alternate) ?? parentCompositeFiber;

  return {
    parentCompositeFiber,
    targetRect,
  };
};

export const getAllFiberContexts = (fiber: Fiber): Map<any, unknown> => {
  const contexts = new Map<any, unknown>();

  if (!fiber) return contexts;

  let currentFiber: Fiber | null = fiber;

  while (currentFiber) {
    const dependencies = currentFiber.dependencies;
    if (dependencies?.firstContext) {
      let contextItem: any = dependencies.firstContext;

      while (contextItem) {
        const contextType = contextItem.context;
        // The actual value is stored in _currentValue or _currentValue2 depending on the thread
        const contextValue = contextType._currentValue;

        if (!contexts.has(contextType)) {
          contexts.set(contextType, contextValue);
        }

        contextItem = contextItem.next;
      }
    }

    // Check for context providers
    if (currentFiber.type?._context) {
      const providerContext = currentFiber.type._context;
      const providerValue = currentFiber.memoizedProps?.value;

      if (!contexts.has(providerContext)) {
        contexts.set(providerContext, providerValue);
      }
    }

    currentFiber = currentFiber.return;
  }

  return contexts;
};

export const hasValidParent = () => {
  if (ReactScanInternals.inspectState.kind !== 'focused') {
    return false;
  }

  const { focusedDomElement } = ReactScanInternals.inspectState;
  if (!focusedDomElement) {
    return false;
  }

  let hasValidParent = false;
  if (focusedDomElement.parentElement) {
    const currentFiber = getNearestFiberFromElement(focusedDomElement);
    let nextParent: typeof focusedDomElement.parentElement | null =
      focusedDomElement.parentElement;

    while (nextParent) {
      const parentFiber = getNearestFiberFromElement(nextParent);
      if (!parentFiber || parentFiber !== currentFiber) {
        hasValidParent = true;
        break;
      }
      nextParent = nextParent.parentElement;
    }
  }
  return hasValidParent;
};

export const isCompositeComponent = (fiber: Fiber) => {
  return (
    fiber.tag === FunctionComponentTag ||
    fiber.tag === ClassComponentTag ||
    fiber.tag === SimpleMemoComponentTag ||
    fiber.tag === MemoComponentTag ||
    fiber.tag === ForwardRefTag
  );
};

export const getOverrideMethods = () => {
  let overrideProps = null;
  let overrideHookState = null;
  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (renderers) {
      for (const [_, renderer] of Array.from(renderers)) {
        try {
          if (overrideProps) {
            const prevOverrideProps = overrideProps;
            overrideProps = (fiber: Fiber, key: string, value: any) => {
              prevOverrideProps(fiber, key, value);
              renderer.overrideProps(fiber, key, value);
            };
          } else {
            overrideProps = renderer.overrideProps;
          }

          if (overrideHookState) {
            const prevOverrideHookState = overrideHookState;
            overrideHookState = (fiber: Fiber, key: string, value: any) => {
              prevOverrideHookState(fiber, key, value);
              renderer.overrideHookState(fiber, key, value);
            };
          } else {
            overrideHookState = renderer.overrideHookState;
          }
        } catch (e) {
          /**/
        }
      }
    }
  }
  return { overrideProps, overrideHookState };
};
