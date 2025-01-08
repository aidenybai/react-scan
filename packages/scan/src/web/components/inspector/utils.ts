import {
  getDisplayName,
  isCompositeFiber,
  isHostFiber,
  traverseFiber,
} from 'bippy';
import { type Fiber } from 'react-reconciler';
import { ReactScanInternals } from '~core/index';
import { isEqual } from '~core/utils';

export type States =
  | {
      kind: 'inspecting';
      hoveredDomElement: HTMLElement | null;
    }
  | {
      kind: 'inspect-off';
    }
  | {
      kind: 'focused';
      focusedDomElement: HTMLElement;
    }
  | {
      kind: 'uninitialized';
    };

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

interface ReactRenderer {
  findFiberByHostInstance: (instance: Element) => Fiber | null;
  version: string;
  bundleType: number;
  rendererPackageName: string;
  overrideHookState?: (
    fiber: Fiber,
    id: string,
    path: Array<any>,
    value: any,
  ) => void;
  overrideProps?: (fiber: Fiber, path: Array<string>, value: any) => void;
  scheduleUpdate?: (fiber: Fiber) => void;
}

interface DevToolsHook {
  renderers: Map<number, ReactRenderer>;
}

export const getFiberFromElement = (element: Element): Fiber | null => {
  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ as DevToolsHook;
    if (!renderers) return null;
    for (const [, renderer] of Array.from(renderers)) {
      try {
        const fiber = renderer.findFiberByHostInstance(element);
        if (fiber) return fiber;
      } catch (e) {
        // If React is mid-render, references to previous nodes may disappear
      }
    }
  }

  if ('_reactRootContainer' in element) {
    const elementWithRoot = element as unknown as ReactRootContainer;
    const rootContainer = elementWithRoot._reactRootContainer;
    return rootContainer?._internalRoot?.current?.child ?? null;
  }

  for (const key in element) {
    if (
      key.startsWith('__reactInternalInstance$') ||
      key.startsWith('__reactFiber')
    ) {
      const elementWithFiber = element as unknown as ReactInternalProps;
      return elementWithFiber[key];
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

export const getNearestFiberFromElement = (
  element: Element | null,
): Fiber | null => {
  if (!element) return null;

  try {
    const fiber = getFiberFromElement(element);
    if (!fiber) return null;

    const res = getParentCompositeFiber(fiber);
    return res ? res[0] : null;
  } catch (error) {
    return null;
  }
};

export const getParentCompositeFiber = (fiber: Fiber) => {
  let curr: Fiber | null = fiber;
  let prevNonHost = null;

  while (curr) {
    if (isCompositeFiber(curr)) {
      return [curr, prevNonHost] as const;
    }
    if (isHostFiber(curr)) {
      prevNonHost = curr;
    }
    curr = curr.return;
  }
};

const isFiberInTree = (fiber: Fiber, root: Fiber): boolean => {
  return !!traverseFiber(root, (searchFiber) => searchFiber === fiber);
};

export const isCurrentTree = (fiber: Fiber) => {
  let curr: Fiber | null = fiber;
  let rootFiber: Fiber | null = null;

  while (curr) {
    if (
      curr.stateNode &&
      ReactScanInternals.instrumentation?.fiberRoots.has(curr.stateNode)
    ) {
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

export const getCompositeComponentFromElement = (element: Element) => {
  const associatedFiber = getNearestFiberFromElement(element);

  if (!associatedFiber) return {};
  const currentAssociatedFiber = isCurrentTree(associatedFiber)
    ? associatedFiber
    : (associatedFiber.alternate ?? associatedFiber);
  const stateNode = getFirstStateNode(currentAssociatedFiber);
  if (!stateNode) return {};
  const targetRect = stateNode.getBoundingClientRect(); // causes reflow, be careful
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

interface PropChange {
  name: string;
  value: unknown;
  prevValue?: unknown;
}

export const getChangedPropsDetailed = (fiber: Fiber): Array<PropChange> => {
  const currentProps = fiber.memoizedProps ?? {};
  const previousProps = fiber.alternate?.memoizedProps ?? {};
  const changes: Array<PropChange> = [];

  for (const key in currentProps) {
    if (key === 'children') continue;

    const currentValue = currentProps[key];
    const prevValue = previousProps[key];

    if (!isEqual(currentValue, prevValue)) {
      changes.push({
        name: key,
        value: currentValue,
        prevValue,
      });
    }
  }

  return changes;
};

interface OverrideMethods {
  overrideProps:
    | ((fiber: Fiber, path: Array<string>, value: unknown) => void)
    | null;
  overrideHookState:
    | ((fiber: Fiber, id: string, path: Array<unknown>, value: unknown) => void)
    | null;
}

export const getOverrideMethods = (): OverrideMethods => {
  let overrideProps = null;
  let overrideHookState = null;

  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ as DevToolsHook;
    if (renderers) {
      for (const [_, renderer] of Array.from(renderers)) {
        try {
          if (overrideHookState) {
            const prevOverrideHookState = overrideHookState;
            overrideHookState = (
              fiber: Fiber,
              id: string,
              path: Array<any>,
              value: any,
            ) => {
              // Find the hook
              let current = fiber.memoizedState;
              for (let i = 0; i < parseInt(id); i++) {
                current = current.next;
              }

              if (current && current.queue) {
                // Update through React's queue mechanism
                const dispatch = current.queue.dispatch;
                if (dispatch) {
                  dispatch(value);
                  return;
                }
              }

              // Fallback to direct override if queue dispatch isn't available
              prevOverrideHookState(fiber, id, path, value);
              renderer.overrideHookState?.(fiber, id, path, value);
            };
          } else if (renderer.overrideHookState) {
            overrideHookState = renderer.overrideHookState.bind(renderer);
          }

          if (overrideProps) {
            const prevOverrideProps = overrideProps;
            overrideProps = (fiber: Fiber, path: Array<string>, value: any) => {
              prevOverrideProps(fiber, path, value);
              renderer.overrideProps?.(fiber, path, value);
            };
          } else if (renderer.overrideProps) {
            overrideProps = renderer.overrideProps.bind(renderer);
          }
        } catch (e) {
          /**/
        }
      }
    }
  }

  return { overrideProps, overrideHookState };
};

const nonVisualTags = new Set([
  'HTML',
  'META',
  'SCRIPT',
  'LINK',
  'STYLE',
  'HEAD',
  'TITLE',
  'NOSCRIPT',
  'BASE',
  'TEMPLATE',
  'IFRAME',
  'EMBED',
  'OBJECT',
  'PARAM',
  'SOURCE',
  'TRACK',
  'AREA',
  'PORTAL',
  'SLOT',
  'XML',
  'DOCTYPE',
  'COMMENT'
]);
export const findComponentDOMNode = (
  fiber: Fiber,
  excludeNonVisualTags = true,
): HTMLElement | null => {
  if (fiber.stateNode && 'nodeType' in fiber.stateNode) {
    const element = fiber.stateNode as HTMLElement;
    if (
      excludeNonVisualTags &&
      nonVisualTags.has(element.tagName)
    ) {
      return null;
    }
    return element;
  }

  let child = fiber.child;
  while (child) {
    const result = findComponentDOMNode(child, excludeNonVisualTags);
    if (result) return result;
    child = child.sibling;
  }

  return null;
};

export interface InspectableElement {
  element: HTMLElement;
  depth: number;
  name: string;
}

export const getInspectableElements = (
  root: HTMLElement = document.body,
): Array<InspectableElement> => {
  const result: Array<InspectableElement> = [];

  const findInspectableFiber = (
    element: HTMLElement | null,
  ): HTMLElement | null => {
    if (!element) return null;
    const { parentCompositeFiber } = getCompositeComponentFromElement(element);
    if (!parentCompositeFiber) return null;

    const componentRoot = findComponentDOMNode(parentCompositeFiber);
    return componentRoot === element ? element : null;
  };

  const traverse = (element: HTMLElement, depth = 0) => {
    const inspectable = findInspectableFiber(element);
    if (inspectable) {
      const { parentCompositeFiber } =
        getCompositeComponentFromElement(inspectable);
      result.push({
        element: inspectable,
        depth,
        name:
          (parentCompositeFiber!.type &&
            getDisplayName(parentCompositeFiber!.type)) ??
          'Unknown',
      });
    }

    // Traverse children first (depth-first)
    Array.from(element.children).forEach((child) => {
      traverse(child as HTMLElement, inspectable ? depth + 1 : depth);
    });
  };

  traverse(root);
  return result;
};
