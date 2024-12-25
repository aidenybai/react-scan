import {
  FunctionComponentTag,
  ForwardRefTag,
  SimpleMemoComponentTag,
  MemoComponentTag,
} from 'bippy';
import { type Fiber } from 'react-reconciler';
import { type ComponentState } from 'react';

// Types
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

// Constants
const stateChangeCounts = new Map<string, number>();
const propsChangeCounts = new Map<string, number>();
const contextChangeCounts = new Map<string, number>();
let lastRenderedStates = new WeakMap<Fiber>();

// Regex patterns
const STATE_NAME_REGEX = /\[(?<name>\w+),\s*set\w+\]/g;
const PROPS_ORDER_REGEX = /\(\s*{\s*(?<props>[^}]+)\s*}\s*\)/;

const ensureRecord = (value: unknown): Record<string, unknown> => {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return { value };
};

export const resetStateTracking = (): void => {
  stateChangeCounts.clear();
  propsChangeCounts.clear();
  contextChangeCounts.clear();
  lastRenderedStates = new WeakMap<Fiber>();
};

export const getStateChangeCount = (name: string): number => stateChangeCounts.get(name) ?? 0;
export const getPropsChangeCount = (name: string): number => propsChangeCounts.get(name) ?? 0;
export const getContextChangeCount = (name: string): number => contextChangeCounts.get(name) ?? 0;

// States
export const getStateNames = (fiber: Fiber): Array<string> => {
  const componentSource = fiber.type?.toString?.() || '';
  // Return the matches if we found any, otherwise return empty array
  // Empty array means we'll use numeric indices as fallback
  return componentSource ? Array.from(
    componentSource.matchAll(STATE_NAME_REGEX),
    (m: RegExpMatchArray) => m.groups?.name ?? ''
  ) : [];
};

export const getCurrentState = (fiber: Fiber | null) => {
  if (!fiber) return {};

  try {
    if (
      fiber.tag === FunctionComponentTag ||
      fiber.tag === ForwardRefTag ||
      fiber.tag === SimpleMemoComponentTag ||
      fiber.tag === MemoComponentTag
    ) {
      const currentIsNewer = fiber && fiber.alternate
        ? (fiber.actualStartTime ?? 0) > (fiber.alternate?.actualStartTime ?? 0)
        : true;

      let memoizedState = currentIsNewer
        ? fiber.memoizedState
        : fiber.alternate?.memoizedState ?? fiber.memoizedState;

      const state: ComponentState = {};
      const stateNames = getStateNames(fiber);

      let index = 0;
      while (memoizedState) {
        if (memoizedState.queue) {
          // Use state name if available, otherwise use index with curly braces
          const name = stateNames[index] || `{${index}}`;
          let value = memoizedState.memoizedState;

          if (memoizedState.queue.pending) {
            const pending = memoizedState.queue.pending;
            let update = pending.next;
            do {
              if (update?.payload) {
                value = typeof update.payload === 'function'
                  ? update.payload(value)
                  : update.payload;
              }
              update = update.next;
            } while (update !== pending.next);
          }

          state[name] = value;
          index++;
        }
        memoizedState = memoizedState.next;
      }

      return state;
    }
  } catch {
  // Silently fail
  }
  return {};
};

export const getChangedState = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();
  if (!fiber.alternate) return changes;

  try {
    if (
      fiber.tag === FunctionComponentTag ||
      fiber.tag === ForwardRefTag ||
      fiber.tag === SimpleMemoComponentTag ||
      fiber.tag === MemoComponentTag
    ) {
      const currentState: ComponentState = {};
      const stateNames = getStateNames(fiber);
      let memoizedState = fiber.memoizedState;
      let index = 0;

      while (memoizedState) {
        if (memoizedState.queue) {
          // Use state name if available, otherwise use index with curly braces
          const name = stateNames[index] || `{${index}}`;
          let value = memoizedState.memoizedState;

          if (memoizedState.queue.pending) {
            const pending = memoizedState.queue.pending;
            let update = pending.next;
            do {
              if (update?.payload) {
                value = typeof update.payload === 'function'
                  ? update.payload(value)
                  : update.payload;
              }
              update = update.next;
            } while (update !== pending.next);
          }

          currentState[name] = value;
          index++;
        }
        memoizedState = memoizedState.next;
      }

      const lastState = lastRenderedStates.get(fiber.alternate) || {};

      for (const name of Object.keys(currentState)) {
        const currentValue = currentState[name];
        const lastValue = lastState[name];

        if (!Object.is(currentValue, lastValue)) {
          changes.add(name);
          const count = (stateChangeCounts.get(name) ?? 0) + 1;
          stateChangeCounts.set(name, count);
        }
      }

      lastRenderedStates.set(fiber, { ...currentState });
    }
  } catch {
    // Silently fail
  }

  return changes;
};

// Props
export const getPropsOrder = (fiber: Fiber): Array<string> => {
  const componentSource = fiber.type?.toString?.() || '';
  const match = componentSource.match(PROPS_ORDER_REGEX);
  if (!match?.groups?.props) return [];

  return match.groups.props
    .split(',')
    .map((prop: string) => prop.trim().split(':')[0].split('=')[0].trim())
    .filter(Boolean);
};

export const getCurrentProps = (fiber: Fiber): Record<string, unknown> => {
  const currentIsNewer = fiber && fiber.alternate
    ? (fiber.actualStartTime ?? 0) > (fiber.alternate?.actualStartTime ?? 0)
    : true;

  const baseProps = currentIsNewer
    ? fiber.memoizedProps || fiber.pendingProps
    : fiber.alternate?.memoizedProps || fiber.alternate?.pendingProps || fiber.memoizedProps;

  return { ...baseProps };
};

export const getChangedProps = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();
  if (!fiber.alternate) return changes;

  const previousProps = fiber.alternate.memoizedProps ?? {};
  const currentProps = fiber.memoizedProps ?? {};

  const propsOrder = getPropsOrder(fiber);
  const orderedProps = [...propsOrder, ...Object.keys(currentProps)];
  const uniqueOrderedProps = [...new Set(orderedProps)];

  for (const key of uniqueOrderedProps) {
    if (key === 'children') continue;
    if (!(key in currentProps)) continue;

    const currentValue = currentProps[key];
    const previousValue = previousProps[key];

    if (!Object.is(currentValue, previousValue)) {
      changes.add(key);

      if (typeof currentValue !== 'function') {
        const count = (propsChangeCounts.get(key) ?? 0) + 1;
        propsChangeCounts.set(key, count);
      }
    }
  }

  for (const key in previousProps) {
    if (key === 'children') continue;
    if (!(key in currentProps)) {
      changes.add(key);
      const count = (propsChangeCounts.get(key) ?? 0) + 1;
      propsChangeCounts.set(key, count);
    }
  }

  return changes;
};

// Contexts
export const getAllFiberContexts = (fiber: Fiber): Map<string, ContextValue> => {
  const contexts = new Map<string, ContextValue>();
  if (!fiber) return contexts;

  const findProviderValue = (contextType: ReactContext): { value: ContextValue; displayName: string } | null => {
    let searchFiber: Fiber | null = fiber;
    while (searchFiber) {
      if (searchFiber.type?.Provider) {
        const providerValue = searchFiber.memoizedProps?.value;
        const pendingValue = searchFiber.pendingProps?.value;
        const currentValue = contextType._currentValue;

        // For built-in contexts
        if (contextType.displayName) {
          if (currentValue === null) {
            return null;
          }
          return {
            value: {
              displayValue: ensureRecord(currentValue),
              isUserContext: false,
              rawValue: currentValue
            },
            displayName: contextType.displayName
          };
        }

        // For user-defined contexts
        const providerName = searchFiber.type.name?.replace('Provider', '') ??
          searchFiber._debugOwner?.type?.name ??
          'Unnamed';

        const valueToUse = pendingValue !== undefined ? pendingValue :
          providerValue !== undefined ? providerValue :
            currentValue;

        return {
          value: {
            displayValue: ensureRecord(valueToUse),
            isUserContext: true,
            rawValue: valueToUse
          },
          displayName: providerName
        };
      }
      searchFiber = searchFiber.return;
    }
    return null;
  };

  let currentFiber: Fiber | null = fiber;
  while (currentFiber) {
    if (currentFiber.dependencies?.firstContext) {
      let contextItem = currentFiber.dependencies.firstContext as ContextDependency | null;
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

export const getCurrentContext = (fiber: Fiber) => {
  const contexts = getAllFiberContexts(fiber);
  const contextObj: Record<string, unknown> = {};

  contexts.forEach((value, contextName) => {
    contextObj[contextName] = value.displayValue;
  });

  return contextObj;
};

export const getChangedContext = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();
  if (!fiber.alternate) return changes;

  const currentContexts = getAllFiberContexts(fiber);

  currentContexts.forEach((_currentValue, contextType) => {
    const contextName = (typeof contextType === 'object' && contextType !== null)
      ? (contextType as any)?.displayName ??
      (contextType as any)?.Provider?.displayName ??
      (contextType as any)?.Consumer?.displayName ??
      (contextType as any)?.type?.name?.replace('Provider', '') ??
      'Unnamed'
      : contextType;

    let searchFiber: Fiber | null = fiber;
    let providerFiber: Fiber | null = null;

    while (searchFiber) {
      if (searchFiber.type?.Provider) {
        providerFiber = searchFiber;
        break;
      }
      searchFiber = searchFiber.return;
    }

    if (providerFiber && providerFiber.alternate) {
      const currentProviderValue = providerFiber.memoizedProps?.value;
      const alternateValue = providerFiber.alternate.memoizedProps?.value;

      if (!Object.is(currentProviderValue, alternateValue)) {
        changes.add(contextName);
        contextChangeCounts.set(contextName, (contextChangeCounts.get(contextName) ?? 0) + 1);
      }
    }
  });

  return changes;
};
