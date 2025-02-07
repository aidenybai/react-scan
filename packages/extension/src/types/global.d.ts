import type * as reactScan from 'react-scan';

declare global {
  type BroadcastHandler = (type: BroadcastMessage['type'], data: Extract<BroadcastMessage, { type: typeof type }>['data']) => void;

  interface Window {
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
    reactScan: typeof reactScan.setOptions;
  }

  interface globalThis {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: Window['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
    _reactScan: typeof reactScan;
  }

  var __REACT_DEVTOOLS_GLOBAL_HOOK__: Window['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
  type TTimer = NodeJS.Timeout;

  var _reactScan: typeof reactScan;
}
