import { type Fiber, isCompositeFiber, isHostFiber } from "bippy";
import { ChangeReason } from "../instrumentation";
import { isEqual } from "../utils";

interface ReactRootContainer {
  _reactRootContainer?: {
    _internalRoot?: {
      current?: {
        child: Fiber;
      };
    };
  };
}

interface ReactInternalProps {
  [key: string]: Fiber;
}

export interface DetailedPropsChange {
  name: string;
  value: unknown;
  prevValue: unknown;
  type: ChangeReason.Props;
}

export const getFiberFromElement = (element: Element): Fiber | null => {
  if ("__REACT_DEVTOOLS_GLOBAL_HOOK__" in window) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook?.renderers) return null;

    for (const [, renderer] of Array.from(hook.renderers)) {
      try {
        const fiber = renderer.findFiberByHostInstance?.(element);
        if (fiber) return fiber;
      } catch {
        // If React is mid-render, references to previous nodes may disappear
      }
    }
  }

  if ("_reactRootContainer" in element) {
    const elementWithRoot = element as unknown as ReactRootContainer;
    return elementWithRoot._reactRootContainer?._internalRoot?.current?.child ?? null;
  }

  for (const key in element) {
    if (key.startsWith("__reactInternalInstance$") || key.startsWith("__reactFiber")) {
      const elementWithFiber = element as unknown as ReactInternalProps;
      return elementWithFiber[key];
    }
  }

  return null;
};

export const getParentCompositeFiber = (fiber: Fiber): readonly [Fiber, Fiber | null] | null => {
  let current: Fiber | null = fiber;
  let previousHost: Fiber | null = null;

  while (current) {
    if (isCompositeFiber(current)) return [current, previousHost] as const;
    if (isHostFiber(current) && !previousHost) previousHost = current;
    current = current.return;
  }

  return null;
};

export const getChangedPropsDetailed = (fiber: Fiber): Array<DetailedPropsChange> => {
  const currentProps = fiber.memoizedProps ?? {};
  const previousProps = fiber.alternate?.memoizedProps ?? {};
  const changes: Array<DetailedPropsChange> = [];

  for (const key in currentProps) {
    if (key === "children") continue;

    const currentValue = currentProps[key];
    const previousValue = previousProps[key];

    if (!isEqual(currentValue, previousValue)) {
      changes.push({
        name: key,
        value: currentValue,
        prevValue: previousValue,
        type: ChangeReason.Props,
      });
    }
  }

  return changes;
};

export const isPromise = (value: unknown): value is Promise<unknown> =>
  value instanceof Promise || (typeof value === "object" && value !== null && "then" in value);
