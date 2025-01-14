import { type Fiber, FunctionComponentTag, type MemoizedState } from 'bippy';
import { isEqual } from '~core/utils';

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
const stateChanges = new Set<string>();
const propsChanges = new Set<string>();
const contextChanges = new Set<string>();
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
  stateChanges.clear();
  propsChanges.clear();
  contextChanges.clear();
  lastRenderedStates = new WeakMap();
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

  const currentState: Record<string, unknown> = {};
  const stateNames = getStateNames(fiber);
  let index = 0;

  while (memoizedState !== null) {
    if (memoizedState.queue) {
      const name = stateNames[index] || `{${index}}`;
      const value = getStateValue(memoizedState);
      currentState[name] = isPromise(value)
        ? { type: 'promise', displayValue: 'Promise' }
        : value;
      index++;
    }
    const nextState: ExtendedMemoizedState | null = memoizedState.next;
    if (!nextState) break;
    memoizedState = nextState;
  }

  return currentState;
};

const getAllFiberContexts = (fiber: Fiber): Map<string, ContextValue> => {
  const contexts = new Map<string, ContextValue>();
  if (!fiber) return contexts;

  const findProviderValue = (
    contextType: ReactContext,
  ): { value: ContextValue; displayName: string } | null => {
    let searchFiber: Fiber | null = fiber;
    while (searchFiber) {
      if (searchFiber.type?.Provider) {
        const providerValue = searchFiber.memoizedProps?.value;
        const pendingValue = searchFiber.pendingProps?.value;
        const currentValue = contextType._currentValue;

        if (contextType.displayName) {
          if (currentValue === null) {
            return null;
          }
          return {
            value: {
              displayValue: ensureRecord(currentValue),
              isUserContext: false,
              rawValue: currentValue,
            },
            displayName: contextType.displayName,
          };
        }

        const providerName =
          searchFiber.type.name?.replace('Provider', '') ??
          searchFiber._debugOwner?.type?.name ??
          'Unnamed';

        const valueToUse =
          pendingValue !== undefined
            ? pendingValue
            : providerValue !== undefined
              ? providerValue
              : currentValue;

        return {
          value: {
            displayValue: ensureRecord(valueToUse),
            isUserContext: true,
            rawValue: valueToUse,
          },
          displayName: providerName,
        };
      }
      searchFiber = searchFiber.return;
    }
    return null;
  };

  let currentFiber: Fiber | null = fiber;
  while (currentFiber) {
    if (currentFiber.dependencies?.firstContext) {
      let contextItem = currentFiber.dependencies
        .firstContext as ContextDependency | null;
      while (contextItem !== null) {
        const context = contextItem.context;
        if (context && '_currentValue' in context) {
          const result = findProviderValue(context);
          if (result) {
            contexts.set(result.displayName, result.value);
          }
        }
        contextItem = contextItem.next;
      }
    }
    currentFiber = currentFiber.return;
  }

  return contexts;
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
  current: Record<string, unknown>;
  changes: Set<string>;
  changesCounts: Map<string, number>;
}

export interface InspectorData {
  fiberProps: SectionData;
  fiberState: SectionData;
  fiberContext: SectionData;
}

export const collectInspectorData = (fiber: Fiber): InspectorData => {
  if (!fiber) {
    return {
      fiberProps: {
        current: {},
        changes: new Set(),
        changesCounts: new Map<string, number>(),
      },
      fiberState: {
        current: {},
        changes: new Set(),
        changesCounts: new Map<string, number>(),
      },
      fiberContext: {
        current: {},
        changes: new Set(),
        changesCounts: new Map<string, number>(),
      },
    };
  }

  const fiberProps = {
    current: {} as Record<string, unknown>,
    changes: propsChanges,
    changesCounts: new Map<string, number>(),
  };

  if (fiber.memoizedProps) {
    const propsOrder = getPropsOrder(fiber);
    const orderedProps = propsOrder.length
      ? [
          ...propsOrder,
          ...Object.keys(fiber.memoizedProps).filter(
            (key) => !propsOrder.includes(key),
          ),
        ]
      : Object.keys(fiber.memoizedProps);

    const currentIsNewer = fiber?.alternate
      ? (fiber.actualStartTime ?? 0) > (fiber.alternate.actualStartTime ?? 0)
      : true;

    const baseProps = currentIsNewer
      ? fiber.memoizedProps || fiber.pendingProps
      : fiber.alternate?.memoizedProps ||
        fiber.alternate?.pendingProps ||
        fiber.memoizedProps;

    for (const key of orderedProps) {
      const value = baseProps[key];
      fiberProps.current[key] = value;
      if ((value && typeof value === 'object') || typeof value === 'function') {
        if (fiber.alternate?.memoizedProps) {
          const prevValue = fiber.alternate.memoizedProps[key];
          const status = value === prevValue ? 'memoized' : 'unmemoized';
          propsChangeCounts.set(`${key}:${status}`, 0);
        }
      }
    }

    for (const key of orderedProps) {
      const currentValue = fiber.memoizedProps[key];
      fiberProps.current[key] = isPromise(currentValue)
        ? { type: 'promise', displayValue: 'Promise' }
        : currentValue;

      if (
        (currentValue && typeof currentValue === 'object') ||
        typeof currentValue === 'function'
      ) {
        if (fiber.alternate?.memoizedProps) {
          const prevValue = fiber.alternate.memoizedProps[key];
          const status = currentValue === prevValue ? 'memoized' : 'unmemoized';
          propsChanges.add(`${key}:${status}`);
        }
        continue;
      }

      if (fiber.alternate?.memoizedProps) {
        if (!isEqual(fiber.alternate.memoizedProps[key], currentValue)) {
          if (propsChanges.has(key)) {
            propsChanges.add(key);
            const count = (propsChangeCounts.get(key) || 0) + 1;
            propsChangeCounts.set(key, count);
          } else {
            propsChanges.add(key);
            propsChangeCounts.set(key, 0);
          }
        }
      } else {
        propsChanges.add(key);
        propsChangeCounts.set(key, 0);
      }
    }
  }

  fiberProps.changesCounts = new Map(propsChangeCounts);

  const fiberState = {
    current: {} as Record<string, unknown>,
    changes: stateChanges,
    changesCounts: stateChangeCounts,
  };

  if (fiber.tag === FunctionComponentTag && isDirectComponent(fiber)) {
    const stateNames = getStateNames(fiber);
    const currentIsNewer = fiber.alternate
      ? (fiber.actualStartTime ?? 0) > (fiber.alternate.actualStartTime ?? 0)
      : true;

    let memoizedState: ExtendedMemoizedState | null = currentIsNewer
      ? fiber.memoizedState
      : (fiber.alternate?.memoizedState ?? fiber.memoizedState);

    let index = 0;
    const lastState = lastRenderedStates.get(fiber);

    while (memoizedState !== null) {
      if (memoizedState.queue) {
        const name = stateNames[index] || `{${index}}`;
        const value = getStateValue(memoizedState);
        fiberState.current[name] = isPromise(value)
          ? { type: 'promise', displayValue: 'Promise' }
          : value;
        index++;
      }
      const nextState: ExtendedMemoizedState | null = memoizedState.next;
      if (!nextState) break;
      memoizedState = nextState;
    }

    if (lastState) {
      for (const name of Object.keys(fiberState.current)) {
        if (!isEqual(fiberState.current[name], lastState[name])) {
          fiberState.changes.add(name);
          if (lastState[name] !== undefined) {
            const existingCount = stateChangeCounts.get(name) ?? 0;
            stateChangeCounts.set(name, existingCount + 1);
          }
        }
      }
    }

    if (Object.keys(fiberState.current).length > 0) {
      lastRenderedStates.set(fiber, { ...fiberState.current });
      if (fiber.alternate) {
        lastRenderedStates.set(fiber.alternate, { ...fiberState.current });
      }
    }
  }

  fiberState.changesCounts = new Map(stateChangeCounts);

  const fiberContext = {
    current: {} as Record<string, unknown>,
    changes: contextChanges,
    changesCounts: new Map<string, number>(),
  };

  const contexts = getAllFiberContexts(fiber);
  for (const [contextName, value] of contexts) {
    if (isPromise(value.rawValue)) {
      fiberContext.current[contextName] = {
        type: 'promise',
        displayValue: 'Promise',
      };
    } else {
      fiberContext.current[contextName] = value.displayValue;
    }

    let searchFiber: Fiber | null = fiber;
    let providerFiber: Fiber | null = null;

    while (searchFiber) {
      if (searchFiber.type?.Provider) {
        providerFiber = searchFiber;
        break;
      }
      searchFiber = searchFiber.return;
    }

    if (providerFiber?.alternate) {
      const currentProviderValue = providerFiber.memoizedProps?.value;
      const alternateValue = providerFiber.alternate.memoizedProps?.value;

      if (!isEqual(currentProviderValue, alternateValue)) {
        fiberContext.changes.add(contextName);
        contextChangeCounts.set(
          contextName,
          (contextChangeCounts.get(contextName) ?? 0) + 1,
        );
      }
    }
  }

  fiberContext.changesCounts = new Map(contextChangeCounts);

  return {
    fiberProps,
    fiberState,
    fiberContext,
  };
};
