import { type ReactDevToolsGlobalHook } from 'bippy';

/* eslint-disable no-var */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ReactScanInternals = (typeof import('./core/index'))['ReactScanInternals'];
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type Scan = (typeof import('./index'))['scan'];

declare global {
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevToolsGlobalHook;
  var __REACT_SCAN__: {
    ReactScanInternals: ReactScanInternals;
  };
  var reactScan: Scan;
  var scheduler: {
    postTask: (cb: any, options: { priority: string }) => void;
  };

  type TTimer = ReturnType<typeof setTimeout> | undefined;
}

declare module '*.css' {
  const content: string;
  export default content;
}

interface StoreType {
  // ... existing properties ...
  wasDetailsOpen?: boolean;
}
