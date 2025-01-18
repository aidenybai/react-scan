import {
  ClassComponentTag,
  Fiber,
  // type Fiber,
  ForwardRefTag,
  FunctionComponentTag,
  MemoComponentTag,
  MemoizedState,
  // type MemoizedState,
  SimpleMemoComponentTag,
} from 'bippy';
import { isEqual } from '~core/utils';
import { isCurrentTree } from '../utils';
// import { getAllFiberContexts } from '~core/web/inspect-element/utils';

interface ContextDependency<T = unknown> {
  context: ReactContext<T>;
  next: ContextDependency<T> | null;
}

interface ContextValue {
  displayValue: Record<string, unknown>;
  rawValue?: unknown;
  isUserContext?: boolean;
}

interface ReactContext<T = unknown> {
  $$typeof: symbol;
  Consumer: ReactContext<T>;
  Provider: {
    $$typeof: symbol;
    _context: ReactContext<T>;
  };
  _currentValue: T;
  _currentValue2: T;
  displayName?: string;
}

const stateChangeCounts = new Map<string, number>();
const propsChangeCounts = new Map<string, number>();
const contextChangeCounts = new Map<string, number>();
let lastRenderedStates = new WeakMap<Fiber, Record<string, unknown>>();

const STATE_NAME_REGEX = /\[(?<name>\w+),\s*set\w+\]/g;
const PROPS_ORDER_REGEX = /\(\s*{\s*(?<props>[^}]+)\s*}\s*\)/;

export const isPromise = (value: unknown): value is Promise<unknown> => {
  return (
    !!value &&
    (value instanceof Promise || (typeof value === 'object' && 'then' in value))
  );
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
            result.items = Array.from(value)
              .slice(0, 50)
              .map((item) => ensureRecord(item, maxDepth - 1, seen));
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
  lastRenderedStates = new WeakMap<Fiber, Record<string, unknown>>();
};

export const getStateChangeCount = (name: string): number =>
  stateChangeCounts.get(name) ?? 0;
export const getPropsChangeCount = (name: string): number =>
  propsChangeCounts.get(name) ?? 0;
export const getContextChangeCount = (name: string): number =>
  contextChangeCounts.get(name) ?? 0;

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

const getStateValue = (memoizedState: ExtendedMemoizedState): unknown => {
  if (!memoizedState) return undefined;

  const queue = memoizedState.queue;
  if (queue) {
    return queue.lastRenderedState;
  }

  return memoizedState.memoizedState;
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
    let memoizedState: MemoizedState | null = fiber.memoizedState;
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
export const getCurrentFiberState = (
  fiber: Fiber,
): Record<string, unknown> | null => {
  if (fiber.tag !== FunctionComponentTag || !isDirectComponent(fiber)) {
    return null;
  }

  const currentIsNewer = fiber.alternate
    ? (fiber.actualStartTime ?? 0) > (fiber.alternate.actualStartTime ?? 0)
    : true;

  let memoizedState: ExtendedMemoizedState | null = currentIsNewer
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

interface SectionData {
  current: Array<{ name: string; value: unknown }>;
  changes: Set<string>;
}

export interface InspectorData {
  fiberProps: SectionData;
  fiberState: SectionData;
  fiberContext: SectionData;
}

export const collectInspectorData = (recvFiber: Fiber): InspectorData => {
  if (!recvFiber) {
    return {
      fiberProps: { current: [], changes: new Set() },
      fiberState: { current: [], changes: new Set() },
      fiberContext: { current: [], changes: new Set() },
    };
  }

  const collectedProps: Record<string, unknown> = {};
  const collectedChanges = new Set<string>();
  const fiber = isCurrentTree(recvFiber)
    ? recvFiber
    : (recvFiber.alternate ?? recvFiber);

  if (fiber.memoizedProps) {
    const baseProps = fiber.memoizedProps;

    const orderedProps = getPropsOrder(fiber);
    const remainingProps = new Set(Object.keys(baseProps));

    for (const key of orderedProps) {
      if (key in baseProps) {
        const value = baseProps[key];
        collectedProps[key] = isPromise(value)
          ? { type: 'promise', displayValue: 'Promise' }
          : value;

        if (
          (value && typeof value === 'object') ||
          typeof value === 'function'
        ) {
          if (fiber.alternate?.memoizedProps) {
            const prevValue = fiber.alternate.memoizedProps[key];
            const status = value === prevValue ? 'memoized' : 'unmemoized';
            propsChangeCounts.set(`${key}:${status}`, 0);
          }
        }
        remainingProps.delete(key);
      }
    }

    for (const key of remainingProps) {
      const value = baseProps[key];
      collectedProps[key] = isPromise(value)
        ? { type: 'promise', displayValue: 'Promise' }
        : value;

      if ((value && typeof value === 'object') || typeof value === 'function') {
        if (fiber.alternate?.memoizedProps) {
          const prevValue = fiber.alternate.memoizedProps[key];
          const status = value === prevValue ? 'memoized' : 'unmemoized';
          propsChangeCounts.set(`${key}:${status}`, 0);
        }
      }
    }

    const currentProps = fiber.memoizedProps;
    // todo: get rid of this change logic its brutal
    for (const [key, currentValue] of Object.entries(currentProps)) {
      if (
        (currentValue && typeof currentValue === 'object') ||
        typeof currentValue === 'function'
      ) {
        if (fiber.alternate?.memoizedProps) {
          const prevValue = fiber.alternate.memoizedProps[key];
          const status = currentValue === prevValue ? 'memoized' : 'unmemoized';
          collectedChanges.add(`${key}:${status}`);
        }
        continue;
      }

      if (
        fiber.alternate?.memoizedProps &&
        key in fiber.alternate.memoizedProps &&
        !isEqual(fiber.alternate.memoizedProps[key], currentValue)
      ) {
        collectedChanges.add(key);
        const count = (propsChangeCounts.get(key) || 0) + 1;
        propsChangeCounts.set(key, count);
      }
    }
  }

  const fiberState: SectionData = {
    current: [...Object.entries(getStateFromFiber(fiber))].map(
      ([index, value]) => ({
        name: index.toString(),
        value,
      }),
    ),
    changes: new Set<string>(),
  };

  const contexts = getAllFiberContexts(fiber);

  const ctx: SectionData = {
    current: [...contexts.values()].map((ctx) => ({
      name: ctx.displayName,
      value: ctx.value,
    })),
    changes: collectedChanges,
  };

  return {
    fiberProps: {
      changes: new Set(),
      current: [...Object.entries(collectedProps)].map(([name, value]) => ({
        name,
        value,
      })),
    },
    fiberState,
    // todo: show the whole chain to reliably know context values
    // todo this is also just broken since it tries to stringify things that are incorrect, fix later
    // tod
    fiberContext: ctx,
  };
};

interface ContextInfo {
  value: unknown;
  displayName: string;
  contextType: any;
}
export const getAllFiberContexts = (fiber: Fiber): Map<any, ContextInfo> => {
  const contexts = new Map<any, ContextInfo>();

  if (!fiber) {
    return contexts;
  }

  let currentFiber: Fiber | null = fiber;

  while (currentFiber) {
    const dependencies = currentFiber.dependencies;

    if (dependencies?.firstContext) {
      let contextItem: any = dependencies.firstContext;

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
