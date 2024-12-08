import { NO_OP } from './helpers';

type Hook = {
  checkDCE: () => void;
  supportsFiber: boolean;
  renderers: Map<number, { version?: string }>;
  onScheduleFiberRoot: () => void;
  onCommitFiberRoot: (rendererID: number, root: unknown) => void;
  onCommitFiberUnmount: () => void;
  inject: (renderer: unknown) => number;
};

export const registerDevtoolsHook = ({
  onCommitFiberRoot,
}: {
  onCommitFiberRoot: Hook['onCommitFiberRoot'];
}) => {
  let devtoolsHook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ as Hook | undefined;
  const renderers = new Map();
  let i = 0;

  if (!devtoolsHook) {
    devtoolsHook = {
      checkDCE: NO_OP,
      supportsFiber: true,
      renderers,
      onScheduleFiberRoot: NO_OP,
      onCommitFiberRoot: NO_OP as Hook['onCommitFiberRoot'],
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
  devtoolsHook.onCommitFiberRoot = (rendererID: number, root: unknown) => {
    prevOnCommitFiberRoot(rendererID, root);
    onCommitFiberRoot(rendererID, root);
  };

  return devtoolsHook;
};

registerDevtoolsHook({
  onCommitFiberRoot: NO_OP as Hook['onCommitFiberRoot'],
});
