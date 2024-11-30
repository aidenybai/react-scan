/* eslint-disable no-var */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ReactScanInternals = (typeof import('./core/index'))['ReactScanInternals'];
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type Scan = (typeof import('./index'))['scan'];

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error ok
// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare module globalThis {
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: {
    checkDCE: () => void;
    supportsFiber: boolean;
    renderers: Map<number, any>;
    onScheduleFiberRoot: () => void;
    onCommitFiberRoot: (rendererID: number, root: any) => void;
    onCommitFiberUnmount: () => void;
    inject: (renderer: any) => number;
  };
  var __REACT_SCAN__: {
    ReactScanInternals: ReactScanInternals;
  };
  var reactScan: Scan;

  var scheduler: {
    postTask: (cb: any, options: { priority: string }) => void;
  };
}
declare function require(path: string): any;
