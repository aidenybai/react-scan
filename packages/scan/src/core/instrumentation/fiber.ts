// Note: do not import React in this file
// since it will be executed before the react devtools hook is created

import type * as React from 'react';
import type { Fiber } from 'react-reconciler';

export const PerformedWorkFlag = 0b01;
export const ClassComponentTag = 1;
export const FunctionComponentTag = 0;
export const ContextConsumerTag = 9;
export const ForwardRefTag = 11;
export const MemoComponentTag = 14;
export const SimpleMemoComponentTag = 15;
export const HostComponentTag = 5;
export const HostHoistableTag = 26;
export const HostSingletonTag = 27;
export const DehydratedSuspenseComponent = 18;
export const HostText = 6;
export const Fragment = 7;
export const LegacyHiddenComponent = 23;
export const OffscreenComponent = 22;
export const HostRoot = 3;
export const CONCURRENT_MODE_NUMBER = 0xeacf;
export const CONCURRENT_MODE_SYMBOL_STRING = 'Symbol(react.concurrent_mode)';
export const DEPRECATED_ASYNC_MODE_SYMBOL_STRING = 'Symbol(react.async_mode)';

export const traverseContexts = (
  fiber: Fiber,
  selector: (
    prevValue: { context: React.Context<unknown>; memoizedValue: unknown },
    nextValue: { context: React.Context<unknown>; memoizedValue: unknown },
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => boolean | void,
) => {
  const nextDependencies = fiber.dependencies;
  const prevDependencies = fiber.alternate?.dependencies;

  if (!nextDependencies || !prevDependencies) return false;
  if (
    typeof nextDependencies !== 'object' ||
    !('firstContext' in nextDependencies) ||
    typeof prevDependencies !== 'object' ||
    !('firstContext' in prevDependencies)
  ) {
    return false;
  }
  let nextContext = nextDependencies.firstContext;
  let prevContext = prevDependencies.firstContext;
  while (
    nextContext &&
    typeof nextContext === 'object' &&
    'memoizedValue' in nextContext &&
    prevContext &&
    typeof prevContext === 'object' &&
    'memoizedValue' in prevContext
  ) {
    if (selector(nextContext as any, prevContext as any) === true) return true;

    nextContext = nextContext.next;
    prevContext = prevContext.next;
  }
  return false;
};

export const traverseState = (
  fiber: Fiber,
  selector: (
    prevValue: { memoizedState: unknown },
    nextValue: { memoizedState: unknown },
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => boolean | void,
) => {
  let prevState = fiber.memoizedState;
  let nextState = fiber.alternate?.memoizedState;

  while (prevState && nextState) {
    if (selector(prevState, nextState) === true) return true;

    prevState = prevState.next;
    nextState = nextState.next;
  }

  return false;
};

export const isHostComponent = (fiber: Fiber) =>
  fiber.tag === HostComponentTag ||
  // @ts-expect-error: it exists
  fiber.tag === HostHoistableTag ||
  // @ts-expect-error: it exists
  fiber.tag === HostSingletonTag;

export const didFiberRender = (fiber: Fiber): boolean => {
  const nextProps = fiber.memoizedProps;
  const prevProps = fiber.alternate?.memoizedProps || {};
  const flags = fiber.flags ?? (fiber as any).effectTag ?? 0;

  switch (fiber.tag) {
    case ClassComponentTag:
    case FunctionComponentTag:
    case ContextConsumerTag:
    case ForwardRefTag:
    case MemoComponentTag:
    case SimpleMemoComponentTag: {
      return (flags & PerformedWorkFlag) === PerformedWorkFlag;
    }
    default:
      // Host nodes (DOM, root, etc.)
      if (!fiber.alternate) return true;
      return (
        prevProps !== nextProps ||
        fiber.alternate.memoizedState !== fiber.memoizedState ||
        fiber.alternate.ref !== fiber.ref
      );
  }
};

export const shouldFilterFiber = (fiber: Fiber) => {
  switch (fiber.tag) {
    case DehydratedSuspenseComponent:
      // TODO: ideally we would show dehydrated Suspense immediately.
      // However, it has some special behavior (like disconnecting
      // an alternate and turning into real Suspense) which breaks DevTools.
      // For now, ignore it, and only show it once it gets hydrated.
      // https://github.com/bvaughn/react-devtools-experimental/issues/197
      return true;

    case HostText:
    case Fragment:
    case LegacyHiddenComponent:
    case OffscreenComponent:
      return true;

    case HostRoot:
      // It is never valid to filter the root element.
      return false;

    default: {
      const symbolOrNumber =
        typeof fiber.type === 'object' && fiber.type !== null
          ? fiber.type.$$typeof
          : fiber.type;

      const typeSymbol =
        typeof symbolOrNumber === 'symbol'
          ? symbolOrNumber.toString()
          : symbolOrNumber;

      switch (typeSymbol) {
        case CONCURRENT_MODE_NUMBER:
        case CONCURRENT_MODE_SYMBOL_STRING:
        case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
          return true;

        default:
          return false;
      }
    }
  }
};

export const getNearestHostFiber = (fiber: Fiber) => {
  let hostFiber = traverseFiber(fiber, isHostComponent);
  if (!hostFiber) {
    hostFiber = traverseFiber(fiber, isHostComponent, true);
  }
  return hostFiber;
};

export const traverseFiber = (
  fiber: Fiber | null,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  selector: (node: Fiber) => boolean | void,
  ascending = false,
): Fiber | null => {
  if (!fiber) return null;
  if (selector(fiber) === true) return fiber;

  let child = ascending ? fiber.return : fiber.child;
  while (child) {
    const match = traverseFiber(child, selector, ascending);
    if (match) return match;

    child = ascending ? null : child.sibling;
  }
  return null;
};

export const getSelfTime = (fiber?: Fiber | null | undefined) => {
  const totalTime = fiber?.actualDuration ?? 0;
  let selfTime = totalTime;
  let child = fiber?.child ?? null;
  // eslint-disable-next-line eqeqeq
  while (totalTime > 0 && child != null) {
    selfTime -= child.actualDuration ?? 0;
    child = child.sibling;
  }
  return selfTime;
};

export const hasMemoCache = (fiber: Fiber) => {
  return Boolean((fiber.updateQueue as any)?.memoCache);
};
