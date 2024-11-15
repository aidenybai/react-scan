import type { FiberRoot, Fiber } from 'react-reconciler';
import { NO_OP } from '../utils';

const PerformedWorkFlag = 0b01;
const ClassComponentTag = 1;
const FunctionComponentTag = 0;
const ContextConsumerTag = 9;
const ForwardRefTag = 11;
const MemoComponentTag = 14;
const SimpleMemoComponentTag = 15;

export const didFiberRender = (fiber: Fiber | null): boolean => {
  if (!fiber) return true; // mount (probably)
  const prevProps = fiber.alternate?.memoizedProps || {};
  const nextProps = fiber.memoizedProps || {};
  const flags = fiber.flags ?? (fiber as any).effectTag ?? 0;
  const didPerformWork = (flags & PerformedWorkFlag) === PerformedWorkFlag;

  switch (fiber.tag) {
    case ClassComponentTag:
    case FunctionComponentTag:
    case ContextConsumerTag:
    case ForwardRefTag:
      return didPerformWork;
    case MemoComponentTag:
    case SimpleMemoComponentTag:
      if (typeof fiber.type.compare === 'function') {
        // memo(Component, (p, n) => ...) / MemoComponent
        return !fiber.type.compare(prevProps, nextProps);
      }
      // compare == null for normal memo(Component) / SimpleMemoComponent
      if (prevProps && typeof prevProps === 'object') {
        for (const key in { ...prevProps, ...nextProps }) {
          if (!Object.is(prevProps[key], nextProps[key])) {
            return true;
          }
        }
      }
      return didPerformWork;
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

export const registerDevtoolsHook = ({
  onCommitFiberRoot,
}: {
  onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
}) => {
  let devtoolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const renderers = new Map();
  let i = 0;

  if (!devtoolsHook) {
    devtoolsHook = {
      checkDCE: NO_OP,
      supportsFiber: true,
      renderers,
      onScheduleFiberRoot: NO_OP,
      onCommitFiberRoot: NO_OP,
      onCommitFiberUnmount: NO_OP,
      inject(renderer) {
        const nextID = ++i;
        renderers.set(nextID, renderer);
        return nextID;
      },
    };
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = devtoolsHook;
  }

  const prevOnCommitFiberRoot = devtoolsHook.onCommitFiberRoot;
  devtoolsHook.onCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
    if (prevOnCommitFiberRoot) prevOnCommitFiberRoot(rendererID, root);
    onCommitFiberRoot(rendererID, root);
  };

  return devtoolsHook;
};

export const hasMemoCache = (fiber: Fiber) => {
  return Boolean((fiber.updateQueue as any)?.memoCache);
};
