import type * as reactScan from 'react-scan';

declare global {
  var __REACT_SCAN__: unknown;
  var __REACT_SCAN_TOOLBAR_CONTAINER__: HTMLElement | null;

  interface Window {
    __REACT_SCAN__: unknown;
    __REACT_SCAN_TOOLBAR_CONTAINER__: HTMLElement | null;
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      checkDCE: (fn: unknown) => void;
      supportsFiber: boolean;
      supportsFlight: boolean;
      renderers: Map<number, ReactRenderer>;
      hasUnsupportedRendererAttached: boolean;
      onCommitFiberRoot: (
        rendererID: number,
        root: FiberRoot,
        // biome-ignore lint/suspicious/noConfusingVoidType: may or may not exist
        priority: void | number,
      ) => void;
      onCommitFiberUnmount: (rendererID: number, fiber: Fiber) => void;
      onPostCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
      inject: (renderer: ReactRenderer) => number;
      _instrumentationSource?: string;
      _instrumentationIsActive?: boolean;
    };
    hideIntro: boolean;
    reactScan: typeof reactScan.setOptions | undefined;
  }

  interface globalThis {
    _reactScan: typeof reactScan;
  }
}
