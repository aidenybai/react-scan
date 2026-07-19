interface ReactScanE2ESignal<Value> {
  value: Value;
}

interface ReactScanE2EOptions {
  enabled?: boolean;
  dangerouslyForceRunInProduction?: boolean;
  showToolbar?: boolean;
  useOffscreenCanvasWorker?: boolean;
  onRender?: (...arguments_: Array<unknown>) => void;
}

interface ReactScanE2EInternals {
  options?: ReactScanE2ESignal<ReactScanE2EOptions>;
  Store?: {
    inspectState?: ReactScanE2ESignal<{
      kind?: "uninitialized" | "inspect-off" | "inspecting" | "focused";
      focusedDomElement?: unknown;
    }>;
    interactionListeningForRenders?: unknown;
  };
  instrumentation?: {
    isPaused?: ReactScanE2ESignal<boolean>;
  };
}

interface Window {
  __E2E_RENDER_COUNT__?: number;
  __REACT_SCAN__?: {
    ReactScanInternals?: ReactScanE2EInternals;
  };
}
