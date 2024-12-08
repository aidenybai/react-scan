interface Window {
  __REACT_SCAN__?: {
    ReactScanInternals?: {
      isPaused: boolean;
    };
  };
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
    renderers: Map<number, { version?: string }>;
    supportsFiber: boolean;
    checkDCE: () => void;
    onCommitFiberRoot: (rendererID: number, root: unknown) => void;
    onCommitFiberUnmount: () => void;
    onScheduleFiberRoot: () => void;
    inject: (renderer: unknown) => number;
  };
}

declare global {
  interface Global {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: Window['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
  }
}
