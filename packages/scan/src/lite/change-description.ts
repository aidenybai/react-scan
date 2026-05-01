import {
  ClassComponentTag,
  type Fiber,
  ForwardRefTag,
  FunctionComponentTag,
  MemoComponentTag,
  SimpleMemoComponentTag,
  traverseContexts,
  traverseProps,
  traverseState,
} from 'bippy';
import type { ChangeDescription } from './types';

const objectIs = Object.is;

export const isCompositeTag = (tag: number): boolean =>
  tag === FunctionComponentTag ||
  tag === ClassComponentTag ||
  tag === ForwardRefTag ||
  tag === MemoComponentTag ||
  tag === SimpleMemoComponentTag;

const collectChangedProps = (fiber: Fiber): Array<string> => {
  // Precondition: caller must have already handled the mount path. Bippy's
  // `traverseProps` falls back to `prev = {}` when `fiber.alternate` is null,
  // which would mark every prop as "changed". `getChangeDescription` short-
  // circuits to `isFirstMount: true` before calling us; we mirror the guard
  // defensively in case anyone reuses this helper standalone.
  if (fiber.alternate === null) return [];
  const changed: Array<string> = [];
  traverseProps(fiber, (propName, nextValue, prevValue) => {
    if (!objectIs(prevValue, nextValue)) changed.push(propName);
  });
  return changed;
};

const didAnyContextChange = (fiber: Fiber): boolean => {
  let changed = false;
  traverseContexts(fiber, (nextContext, prevContext) => {
    if (!nextContext || !prevContext) return;
    // Order swap means a non-context change caused the rerender; bail.
    if (nextContext.context !== prevContext.context) {
      changed = false;
      return true;
    }
    if (!objectIs(prevContext.memoizedValue, nextContext.memoizedValue)) {
      changed = true;
      return true;
    }
  });
  return changed;
};

const didAnyClassStateChange = (fiber: Fiber): boolean => {
  // For class components, memoizedState is a single state object (not a Hook
  // chain), so traverseState only yields one node. Compare keys shallowly.
  const previousState = fiber.alternate?.memoizedState;
  const nextState = fiber.memoizedState;
  if (
    !previousState ||
    !nextState ||
    typeof previousState !== 'object' ||
    typeof nextState !== 'object'
  ) {
    return previousState !== nextState;
  }
  const previousObject = previousState as Record<string, unknown>;
  const nextObject = nextState as Record<string, unknown>;
  const allKeys = new Set<string>([
    ...Object.keys(previousObject),
    ...Object.keys(nextObject),
  ]);
  for (const key of allKeys) {
    if (!objectIs(previousObject[key], nextObject[key])) return true;
  }
  return false;
};

/**
 * Walks the Hook linked list on `fiber.memoizedState` and returns the indices
 * of hooks whose `memoizedState` changed by reference. Bippy's `traverseState`
 * iterates both fibers' Hook chains in parallel.
 *
 * APPROXIMATE: this conflates `useState` value changes with `useMemo` /
 * `useCallback` / `useEffect` deps changes (they share the same slot).
 * DevTools uses `react-debug-tools.inspectHooks` for precise attribution; we
 * deliberately skip that; bippy ships it as `inspectHooks` from `bippy/source`
 * if a caller wants the exact answer.
 */
const collectChangedHookIndices = (fiber: Fiber): Array<number> => {
  const indices: Array<number> = [];
  let index = 0;
  traverseState(fiber, (nextState, prevState) => {
    if (
      nextState &&
      prevState &&
      !objectIs(prevState.memoizedState, nextState.memoizedState)
    ) {
      indices.push(index);
    }
    index++;
  });
  return indices;
};

/**
 * Returns a change description for fibers whose tag we can attribute, or
 * `null` for everything else (host nodes, suspense, fragments, etc.).
 *
 * Ported from react-devtools-shared/src/backend/fiber/renderer.js
 * `getChangeDescription`, with bippy's `traverseProps`/`traverseState`/
 * `traverseContexts` doing the heavy lifting.
 *
 * The `parentRendered` flag is computed by the caller (the fiber walker)
 * which already traverses the tree top-down; re-walking `fiber.return`
 * here would be O(depth) per fiber and pointless.
 */
export const getChangeDescription = (
  fiber: Fiber,
  parentRendered: boolean,
): ChangeDescription | null => {
  const tag = fiber.tag;
  if (!isCompositeTag(tag)) return null;

  if (fiber.alternate === null) {
    return {
      isFirstMount: true,
      props: null,
      state: false,
      context: false,
      hooks: [],
      parent: false,
    };
  }

  if (tag === ClassComponentTag) {
    return {
      isFirstMount: false,
      props: collectChangedProps(fiber),
      state: didAnyClassStateChange(fiber),
      context: didAnyContextChange(fiber),
      hooks: [],
      parent: parentRendered,
    };
  }

  return {
    isFirstMount: false,
    props: collectChangedProps(fiber),
    state: false,
    context: didAnyContextChange(fiber),
    hooks: collectChangedHookIndices(fiber),
    parent: parentRendered,
  };
};
