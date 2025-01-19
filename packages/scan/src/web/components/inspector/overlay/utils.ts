import {
  ClassComponentTag,
  type ContextDependency,
  type Fiber,
  ForwardRefTag,
  FunctionComponentTag,
  MemoComponentTag,
  type MemoizedState,
  SimpleMemoComponentTag,
} from 'bippy';
import { isEqual } from '~core/utils';

const stateChangeCounts = new Map<string, number>();
const propsChangeCounts = new Map<string, number>();
const contextChangeCounts = new Map<string, number>();

// Track last component type to detect switches
let lastComponentType: unknown = null;

const STATE_NAME_REGEX = /\[(?<name>\w+),\s*set\w+\]/g;
const PROPS_ORDER_REGEX = /\(\s*{\s*(?<props>[^}]+)\s*}\s*\)/;

export const isPromise = (value: unknown): value is Promise<unknown> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  try {
    return (
      value instanceof Promise ||
      ('then' in value &&
        typeof (value as { then: unknown }).then === 'function')
    );
  } catch {
    return false;
  }
};

export const ensureRecord = (
  value: unknown,
  maxDepth = 2,
  seen = new WeakSet<object>(),
): Record<string, unknown> => {
  if (isPromise(value)) {
    return { type: 'promise', displayValue: 'Promise' };
  }

  if (value === null) {
    return { type: 'null', displayValue: 'null' };
  }

  if (value === undefined) {
    return { type: 'undefined', displayValue: 'undefined' };
  }

  switch (typeof value) {
    case 'object': {
      if (seen.has(value)) {
        return { type: 'circular', displayValue: '[Circular Reference]' };
      }

      if (!value) return { type: 'null', displayValue: 'null' };

      seen.add(value);

      try {
        const result: Record<string, unknown> = {};

        if (value instanceof Element) {
          result.type = 'Element';
          result.tagName = value.tagName.toLowerCase();
          result.displayValue = value.tagName.toLowerCase();
          return result;
        }

        if (value instanceof Map) {
          result.type = 'Map';
          result.size = value.size;
          result.displayValue = `Map(${value.size})`;

          if (maxDepth > 0) {
            const entries: Record<string, unknown> = {};
            let index = 0;
            for (const [key, val] of value.entries()) {
              if (index >= 50) break;
              try {
                entries[String(key)] = ensureRecord(val, maxDepth - 1, seen);
              } catch {
                entries[String(index)] = {
                  type: 'error',
                  displayValue: 'Error accessing Map entry',
                };
              }
              index++;
            }
            result.entries = entries;
          }
          return result;
        }

        if (value instanceof Set) {
          result.type = 'Set';
          result.size = value.size;
          result.displayValue = `Set(${value.size})`;

          if (maxDepth > 0) {
            const items = [];
            let count = 0;
            for (const item of value) {
              if (count >= 50) break;
              items.push(ensureRecord(item, maxDepth - 1, seen));
              count++;
            }
            result.items = items;
          }
          return result;
        }

        if (value instanceof Date) {
          result.type = 'Date';
          result.value = value.toISOString();
          result.displayValue = value.toLocaleString();
          return result;
        }

        if (value instanceof RegExp) {
          result.type = 'RegExp';
          result.value = value.toString();
          result.displayValue = value.toString();
          return result;
        }

        if (value instanceof Error) {
          result.type = 'Error';
          result.name = value.name;
          result.message = value.message;
          result.displayValue = `${value.name}: ${value.message}`;
          return result;
        }

        if (value instanceof ArrayBuffer) {
          result.type = 'ArrayBuffer';
          result.byteLength = value.byteLength;
          result.displayValue = `ArrayBuffer(${value.byteLength})`;
          return result;
        }

        if (value instanceof DataView) {
          result.type = 'DataView';
          result.byteLength = value.byteLength;
          result.displayValue = `DataView(${value.byteLength})`;
          return result;
        }

        if (ArrayBuffer.isView(value)) {
          const typedArray = value as unknown as {
            length: number;
            constructor: { name: string };
            buffer: ArrayBuffer;
          };
          result.type = typedArray.constructor.name;
          result.length = typedArray.length;
          result.byteLength = typedArray.buffer.byteLength;
          result.displayValue = `${typedArray.constructor.name}(${typedArray.length})`;
          return result;
        }

        if (Array.isArray(value)) {
          result.type = 'array';
          result.length = value.length;
          result.displayValue = `Array(${value.length})`;

          if (maxDepth > 0) {
            result.items = value
              .slice(0, 50)
              .map((item) => ensureRecord(item, maxDepth - 1, seen));
          }
          return result;
        }

        const keys = Object.keys(value);
        result.type = 'object';
        result.size = keys.length;
        result.displayValue =
          keys.length <= 5
            ? `{${keys.join(', ')}}`
            : `{${keys.slice(0, 5).join(', ')}, ...${keys.length - 5}}`;

        if (maxDepth > 0) {
          const entries: Record<string, unknown> = {};
          for (const key of keys.slice(0, 50)) {
            try {
              entries[key] = ensureRecord(
                (value as Record<string, unknown>)[key],
                maxDepth - 1,
                seen,
              );
            } catch {
              entries[key] = {
                type: 'error',
                displayValue: 'Error accessing property',
              };
            }
          }
          result.entries = entries;
        }
        return result;
      } finally {
        seen.delete(value);
      }
    }
    case 'string':
      return {
        type: 'string',
        value,
        displayValue: `"${value}"`,
      };
    case 'function':
      return {
        type: 'function',
        displayValue: 'ƒ()',
        name: value.name || 'anonymous',
      };
    default:
      return {
        type: typeof value,
        value,
        displayValue: String(value),
      };
  }
};

export const resetStateTracking = () => {
  stateChangeCounts.clear();
  propsChangeCounts.clear();
  contextChangeCounts.clear();
  lastComponentType = null;
};

export const getStateNames = (fiber: Fiber): Array<string> => {
  const componentSource = fiber.type?.toString?.() || '';
  return componentSource
    ? Array.from(
        componentSource.matchAll(STATE_NAME_REGEX),
        (m: RegExpMatchArray) => m.groups?.name ?? '',
      )
    : [];
};

export const isDirectComponent = (fiber: Fiber): boolean => {
  if (!fiber || !fiber.type) return false;

  const isFunctionalComponent = typeof fiber.type === 'function';
  const isClassComponent = fiber.type?.prototype?.isReactComponent ?? false;

  if (!(isFunctionalComponent || isClassComponent)) return false;

  if (isClassComponent) {
    return true;
  }

  let memoizedState = fiber.memoizedState;
  while (memoizedState) {
    if (memoizedState.queue) {
      return true;
    }
    const nextState: ExtendedMemoizedState | null = memoizedState.next;
    if (!nextState) break;
    memoizedState = nextState;
  }

  return false;
};

// be careful, this is an implementation detail is not stable or reliable across all react versions https://github.com/facebook/react/pull/15124
// type UpdateQueue<S, A> = {
//   last: Update<S, A> | null,
//   dispatch: (A => mixed) | null,
//   eagerReducer: ((S, A) => S) | null,
//   eagerState: S | null,
// };
interface ExtendedMemoizedState extends MemoizedState {
  queue?: {
    lastRenderedState: unknown;
  } | null;
  element?: unknown;
}

export const getStateFromFiber = (fiber: Fiber) => {
  if (!fiber) return {};

  // only funtional components have memo tags,
  if (
    fiber.tag === FunctionComponentTag ||
    fiber.tag === ForwardRefTag ||
    fiber.tag === SimpleMemoComponentTag ||
    fiber.tag === MemoComponentTag
  ) {
    // Functional component, need to traverse hooks
    let memoizedState: MemoizedState | null = fiber.memoizedState;
    const state: Record<string, unknown> = {};
    let index = 0;

    while (memoizedState) {
      if (memoizedState.queue && memoizedState.memoizedState !== undefined) {
        state[index.toString()] = memoizedState.memoizedState;
      }
      memoizedState = memoizedState.next;
      index++;
    }

    return state;
  }

  if (fiber.tag === ClassComponentTag) {
    // Class component, memoizedState is the component state
    return fiber.memoizedState || {};
  }

  return {};
};

export const getCurrentFiberState = (
  fiber: Fiber,
): Record<string, unknown> | null => {
  if (fiber.tag !== FunctionComponentTag || !isDirectComponent(fiber)) {
    return null;
  }

  const currentIsNewer = fiber.alternate
    ? (fiber.actualStartTime ?? 0) > (fiber.alternate.actualStartTime ?? 0)
    : true;

  const memoizedState: ExtendedMemoizedState | null = currentIsNewer
    ? fiber.memoizedState
    : (fiber.alternate?.memoizedState ?? fiber.memoizedState);

  if (!memoizedState) return null;

  return memoizedState;
};

const getPropsOrder = (fiber: Fiber): Array<string> => {
  const componentSource = fiber.type?.toString?.() || '';
  const match = componentSource.match(PROPS_ORDER_REGEX);
  if (!match?.groups?.props) return [];

  return match.groups.props
    .split(',')
    .map((prop: string) => prop.trim().split(':')[0].split('=')[0].trim())
    .filter(Boolean);
};

export interface SectionData {
  current: Array<{ name: string; value: unknown }>;
  changes: Set<string>;
  changesCounts: Map<string, number>;
}

export interface InspectorData {
  fiberProps: SectionData;
  fiberState: SectionData;
  fiberContext: SectionData;
}

export const collectInspectorData = (fiber: Fiber): InspectorData => {
  const emptyData = {
    current: [],
    changes: new Set<string>(),
    changesCounts: new Map<string, number>(),
  };

  if (!fiber) {
    return {
      fiberProps: emptyData,
      fiberState: emptyData,
      fiberContext: emptyData,
    };
  }

  // Always use the current fiber and its alternate for comparison
  const alternateFiber = fiber.alternate;

  // Props
  const propsData: SectionData = {
    current: [],
    changes: new Set(),
    changesCounts: new Map(),
  };

  if (fiber.memoizedProps) {
    const currentProps = fiber.memoizedProps;
    const prevProps = alternateFiber?.memoizedProps;
    const orderedProps = getPropsOrder(fiber);
    const remainingProps = new Set(Object.keys(currentProps));

    // First add props in their original order
    for (const key of orderedProps) {
      if (key in currentProps) {
        const value = currentProps[key];
        propsData.current.push({
          name: key,
          value: isPromise(value)
            ? { type: 'promise', displayValue: 'Promise' }
            : value,
        });

        // Check for changes
        if (prevProps && key in prevProps && !isEqual(prevProps[key], value)) {
          propsData.changes.add(key);
          const count = (propsChangeCounts.get(key) ?? 0) + 1;
          propsChangeCounts.set(key, count);
          propsData.changesCounts.set(key, count);
        }
        remainingProps.delete(key);
      }
    }

    // Then add any remaining props that weren't in the original order
    for (const key of remainingProps) {
      const value = currentProps[key];
      propsData.current.push({
        name: key,
        value: isPromise(value)
          ? { type: 'promise', displayValue: 'Promise' }
          : value,
      });

      // Check for changes
      if (prevProps && key in prevProps && !isEqual(prevProps[key], value)) {
        propsData.changes.add(key);
        const count = (propsChangeCounts.get(key) ?? 0) + 1;
        propsChangeCounts.set(key, count);
        propsData.changesCounts.set(key, count);
      }
    }
  }

  // State
  const stateData: SectionData = {
    current: [],
    changes: new Set(),
    changesCounts: new Map(),
  };

  const currentState = getStateFromFiber(fiber);
  const prevState = alternateFiber ? getStateFromFiber(alternateFiber) : {};

  // Track state changes - only increment counters if we have a previous render
  for (const [index, value] of Object.entries(currentState)) {
    stateData.current.push({
      name: index.toString(),
      value,
    });

    // Only track changes after first render and when values actually differ
    if (alternateFiber && !isEqual(prevState[index], value)) {
      stateData.changes.add(index);
      const count = stateChangeCounts.get(index) ?? 0;
      const newCount = count + 1;
      stateChangeCounts.set(index, newCount);
      stateData.changesCounts.set(index, newCount);
    }
  }

  // Track context values and their changes
  const contextData: SectionData = {
    current: [],
    changes: new Set(),
    changesCounts: new Map(),
  };

  const currentContexts = getAllFiberContexts(fiber);
  const prevContexts = alternateFiber
    ? getAllFiberContexts(alternateFiber)
    : new Map();

  // Track current contexts and detect value changes
  const seenContexts = new Set<string>();
  for (const [contextType, ctx] of currentContexts) {
    const name = ctx.displayName;
    const contextKey = `${name}-${contextType?.toString()}`;

    if (seenContexts.has(contextKey)) {
      continue;
    }
    seenContexts.add(contextKey);

    contextData.current.push({
      name,
      value: ctx.value,
    });

    const prevCtx = prevContexts.get(contextType);
    const isComponentSwitch = fiber.type !== lastComponentType;
    lastComponentType = fiber.type;

    if (
      !isComponentSwitch &&
      prevCtx &&
      prevContexts.size > 0 &&
      fiber.type === alternateFiber?.type
    ) {
      const prevValue = prevCtx.value;
      const currentValue = ctx.value;

      const hasChanged = !isEqual(prevValue, currentValue);

      if (hasChanged) {
        contextData.changes.add(name);
        const count = (contextChangeCounts.get(name) ?? 0) + 1;
        contextChangeCounts.set(name, count);
        contextData.changesCounts.set(name, count);
      }
    }
  }

  return {
    fiberProps: propsData,
    fiberState: stateData,
    fiberContext: contextData,
  };
};

interface ContextInfo {
  value: unknown;
  displayName: string;
  contextType: unknown;
}

export const getAllFiberContexts = (
  fiber: Fiber,
): Map<unknown, ContextInfo> => {
  const contexts = new Map<unknown, ContextInfo>();

  if (!fiber) {
    return contexts;
  }

  let currentFiber: Fiber | null = fiber;

  while (currentFiber) {
    const dependencies = currentFiber.dependencies;

    if (dependencies?.firstContext) {
      let contextItem: ContextDependency<unknown> | null =
        dependencies.firstContext;

      while (contextItem) {
        const memoizedValue = contextItem.memoizedValue;
        const displayName = contextItem.context?.displayName;

        if (!contexts.has(memoizedValue)) {
          contexts.set(contextItem.context, {
            value: memoizedValue,
            displayName: displayName ?? 'UnnamedContext',
            contextType: null,
          });
        } else {
        }

        if (contextItem === contextItem.next) {
          break;
        }

        contextItem = contextItem.next;
      }
    } else {
    }

    currentFiber = currentFiber.return;
  }

  return contexts;
};
