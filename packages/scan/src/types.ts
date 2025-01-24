import type { Fiber } from 'bippy';

type ReactScanInternals = typeof import('./core/index')['ReactScanInternals'];
type Scan = typeof import('./index')['scan'];

export interface ExtendedReactRenderer {
  findFiberByHostInstance: (instance: Element) => Fiber | null;
  version: string;
  bundleType: number;
  rendererPackageName: string;
  overrideHookState?: (
    fiber: Fiber,
    id: string,
    path: string[],
    value: unknown,
  ) => void;
  overrideProps?: (fiber: Fiber, path: string[], value: unknown) => void;
  overrideContext?: (
    fiber: Fiber,
    contextType: unknown,
    path: string[],
    value: unknown,
  ) => void;
}

declare global {
  var __REACT_SCAN__: {
    ReactScanInternals: ReactScanInternals;
  };
  var reactScan: Scan;
  var scheduler: {
    postTask: (cb: unknown, options: { priority: string }) => void;
  };

  type TTimer = NodeJS.Timeout;

  interface Window {
    isReactScanExtension?: boolean;
    reactScan: Scan;
    __REACT_SCAN_TOOLBAR_CONTAINER__?: HTMLDivElement;
  }
}
