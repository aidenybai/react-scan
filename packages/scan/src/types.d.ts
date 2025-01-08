/* eslint-disable no-var */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ReactScanInternals = (typeof import('./core/index'))['ReactScanInternals'];
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type Scan = (typeof import('./index'))['scan'];

interface ReactRenderer {
  findFiberByHostInstance: (instance: Element) => Fiber | null;
  version: string;
  bundleType: number;
  rendererPackageName: string;
  overrideHookState?: (fiber: Fiber, id: string, path: Array<any>, value: any) => void;
  overrideProps?: (fiber: Fiber, path: Array<string>, value: any) => void;
  scheduleUpdate?: (fiber: Fiber) => void;
}

interface DevToolsHook {
  renderers: Map<number, ReactRenderer>;
}

declare global {
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: DevToolsHook;
  var __REACT_SCAN__: {
    ReactScanInternals: ReactScanInternals;
  };
  var reactScan: Scan;
  var scheduler: {
    postTask: (cb: any, options: { priority: string }) => void;
  };

  type TTimer = NodeJS.Timeout;

  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: DevToolsHook;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface globalThis {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: DevToolsHook;
    __REACT_SCAN__: {
      ReactScanInternals: ReactScanInternals;
    };
    reactScan: Scan;
    scheduler: {
      postTask: (cb: any, options: { priority: string }) => void;
    };
  }
}


declare module '*.css' {
  const content: string;
  export default content;
}

interface StoreType {
  wasDetailsOpen?: boolean;
}


export {};
