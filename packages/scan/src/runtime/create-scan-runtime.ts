import { createRoot, onCleanup } from "solid-js";
import { startTimingTracking } from "../core/notifications/event-tracking";
import { createHighlightCanvas } from "../core/notifications/outline-overlay";
import { createRootContainer, type RootContainerController } from "./root-container";

export interface ScanRuntimeOptions {
  showToolbar: boolean;
  isVerbose: () => boolean;
}

let disposeActiveRuntime: (() => void) | null = null;

const createNotificationsOutlineCanvas = (isVerbose: () => boolean) => {
  try {
    return createHighlightCanvas(document.documentElement);
  } catch (error) {
    if (isVerbose()) {
      console.error(
        "[React Scan Internal Error]",
        "Failed to create notifications outline canvas",
        error,
      );
    }
  }
};

export const disposeScanRuntime = (): void => {
  disposeActiveRuntime?.();
  disposeActiveRuntime = null;
  window.reactScanCleanupListeners = undefined;
};

export const createScanRuntime = (options: ScanRuntimeOptions): void => {
  disposeScanRuntime();

  const disposeRuntime = createRoot((dispose) => {
    let isDisposed = false;
    let rootController: RootContainerController | null = null;
    let disposeToolbar: (() => void) | null = null;
    const stopTimingTracking = startTimingTracking();
    const stopOutlineCanvas = createNotificationsOutlineCanvas(options.isVerbose);

    onCleanup(() => {
      isDisposed = true;
      disposeToolbar?.();
      rootController?.dispose();
      stopTimingTracking();
      stopOutlineCanvas?.();
      window.__REACT_SCAN_TOOLBAR_CONTAINER__ = undefined;
    });

    if (options.showToolbar) {
      rootController = createRootContainer();
      void import("../web/toolbar").then(({ createToolbar }) => {
        if (isDisposed || !rootController) return;
        const toolbar = createToolbar(rootController.shadowRoot);
        disposeToolbar = toolbar.dispose;
      });
    }

    return dispose;
  });

  disposeActiveRuntime = disposeRuntime;
  window.reactScanCleanupListeners = disposeRuntime;
};
