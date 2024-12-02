import type { FiberRoot } from 'react-reconciler';

const NO_OP = () => {
  /**/
};

export const registerDevtoolsHook = ({
  onCommitFiberRoot,
}: {
  onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
}) => {
  let devtoolsHook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
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
    globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = devtoolsHook;
  }

  const prevOnCommitFiberRoot = devtoolsHook.onCommitFiberRoot;
  devtoolsHook.onCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
    if (prevOnCommitFiberRoot) prevOnCommitFiberRoot(rendererID, root);
    onCommitFiberRoot(rendererID, root);
  };

  return devtoolsHook;
};

// __REACT_DEVTOOLS_GLOBAL_HOOK__ must exist before React is ever executed
// this is the case with the React Devtools extension, but without it, we need
registerDevtoolsHook({
  onCommitFiberRoot() {
    /**/
  },
});
