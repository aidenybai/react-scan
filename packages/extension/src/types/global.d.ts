import * as reactScan from 'react-scan';

declare global {
  type BroadcastHandler = (type: BroadcastMessage['type'], data: Extract<BroadcastMessage, { type: typeof type }>['data']) => void;

  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      renderers: Map<number, { version?: string }>;
      supportsFiber: boolean;
      checkDCE: () => void;
      onCommitFiberRoot: (rendererID: number, root: unknown) => void;
      onCommitFiberUnmount: () => void;
      onScheduleFiberRoot: () => void;
      inject: (renderer: unknown) => number;
    };
    wrappedJSObject?: any;
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

export {};
