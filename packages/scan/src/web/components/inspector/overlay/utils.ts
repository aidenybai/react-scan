import { FunctionComponentTag } from 'bippy';
import { type Fiber } from 'react-reconciler';
import { type ComponentState } from 'react';
import { isEqual } from '~core/utils';

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

export const resetStateTracking = () => {
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

// Helper to check if a component is a direct component (not a wrapper/HOC)
export const isDirectComponent = (fiber: Fiber): boolean => {
  if (!fiber || !fiber.type) return false;

  // Check if it's a functional component or a class component
  const isFunctionalComponent = typeof fiber.type === 'function';
  const isClassComponent = fiber.type.prototype && fiber.type.prototype.isReactComponent;

  if (!(isFunctionalComponent || isClassComponent)) return false;

  // For class components, check if they have state
  if (isClassComponent) {
    return true; // Class components usually manage their own state
  }

  // For functional components, check for stateful hooks
  let memoizedState = fiber.memoizedState;
  while (memoizedState) {
    // Check for any state hook (useState/useReducer)
    // Both have a queue property in their memoizedState
    if (memoizedState.queue) {
      return true;
    }
    memoizedState = memoizedState.next;
  }

  return false;
};

export const getCurrentState = (fiber: Fiber | null) => {
  if (!fiber) return {};

  try {
    // Check if it's a direct function component
    if (fiber.tag === FunctionComponentTag && isDirectComponent(fiber)) {
      return getCurrentFiberState(fiber);
    }
  } catch {
    // Silently fail
  }
  return {};
};

export const getChangedState = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();
  if (
    !fiber
    || fiber.tag !== FunctionComponentTag
    || !isDirectComponent(fiber)
  ) return changes;

  try {
    // Get the current state
    const currentState = getCurrentFiberState(fiber);
    if (!currentState) return changes;

    // Handle initial render - don't mark anything as changed
    if (!fiber.alternate) {
      // Just store the initial state without marking changes
      lastRenderedStates.set(fiber, { ...currentState });
      return changes;
    }

    // Compare with last state and track changes
    const lastState = lastRenderedStates.get(fiber);
    if (lastState) {
      for (const name of Object.keys(currentState)) {
        if (!isEqual(currentState[name], lastState[name])) {
          changes.add(name);
          // Only increment change count if it's not the first render
          if (lastState[name] !== undefined) {
            const existingCount = stateChangeCounts.get(name) ?? 0;
            stateChangeCounts.set(name, existingCount + 1);
          }
        }
      }
    }

    lastRenderedStates.set(fiber, { ...currentState });
    if (fiber.alternate) {
      lastRenderedStates.set(fiber.alternate, { ...currentState });
    }
  } catch {
    // Silently fail
  }

  return changes;
};

// Helper to get current fiber state
const getCurrentFiberState = (fiber: Fiber): ComponentState | null => {
  // First check if this is a function component
  if (fiber.tag !== FunctionComponentTag || !isDirectComponent(fiber)) {
    return null;
  }

  const currentIsNewer = fiber.alternate
    ? (fiber.actualStartTime ?? 0) > (fiber.alternate.actualStartTime ?? 0)
    : true;

  let memoizedState = currentIsNewer
    ? fiber.memoizedState
    : fiber.alternate?.memoizedState ?? fiber.memoizedState;

  // Early return if no memoizedState
  if (!memoizedState) return null;

  const currentState: ComponentState = {};
  const stateNames = getStateNames(fiber);
  let index = 0;

  while (memoizedState) {
    // Check if this is a hook state (has queue property)
    if (memoizedState.queue) {
      const name = stateNames[index] || `{${index}}`;
      try {
        currentState[name] = getStateValue(memoizedState);
      } catch {
        // Silently fail
      }
      index++;
    }
    memoizedState = memoizedState.next;
  }

  return currentState;
};

// Helper to get state value including pending updates
const getStateValue = (memoizedState: any): any => {
  let value = memoizedState.memoizedState;

  if (memoizedState.queue?.pending) {
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

  return value;
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

    if (!isEqual(currentValue, previousValue)) {
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

const getContextDisplayName = (contextType: unknown): string => {
  if (typeof contextType !== 'object' || contextType === null) {
    return String(contextType);
  }

  return (contextType as any)?.displayName ??
    (contextType as any)?.Provider?.displayName ??
    (contextType as any)?.Consumer?.displayName ??
    (contextType as any)?.type?.name?.replace('Provider', '') ??
    'Unnamed';
};

export const getChangedContext = (fiber: Fiber): Set<string> => {
  const changes = new Set<string>();
  if (!fiber.alternate) return changes;

  const currentContexts = getAllFiberContexts(fiber);

  currentContexts.forEach((_currentValue, contextType) => {
    const contextName = getContextDisplayName(contextType);

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

      if (!isEqual(currentProviderValue, alternateValue)) {
        changes.add(contextName);
        contextChangeCounts.set(contextName, (contextChangeCounts.get(contextName) ?? 0) + 1);
      }
    }
  });

  return changes;
};