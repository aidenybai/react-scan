import { ErrorBoundary } from "solid-js";
import { render } from "solid-js/web";
import { Icon } from "./components/icon";
import { SvgSprite } from "./components/svg-sprite";
import { Widget } from "./widget";

export interface ToolbarController {
  container: HTMLDivElement;
  dispose: () => void;
}

const ToolbarErrorFallback = (error: Error, reset: () => void) => (
  <div class="fixed bottom-4 right-4 z-[124124124124]">
    <div class="p-3 bg-black rounded-lg shadow-lg w-80">
      <div class="flex items-center gap-2 mb-2 text-red-400 text-sm font-medium">
        <Icon name="icon-flame" class="text-red-500" size={14} />
        React Scan ran into a problem
      </div>
      <div class="p-2 bg-black rounded font-mono text-xs text-red-300 mb-3 break-words">
        {error.message || JSON.stringify(error)}
      </div>
      <button
        type="button"
        onClick={reset}
        class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
      >
        Restart
      </button>
    </div>
  </div>
);

export const createToolbar = (root: ShadowRoot): ToolbarController => {
  const container = document.createElement("div");
  container.id = "react-scan-toolbar-root";
  window.__REACT_SCAN_TOOLBAR_CONTAINER__ = container;
  root.appendChild(container);

  const dispose = render(
    () => (
      <ErrorBoundary fallback={ToolbarErrorFallback}>
        <>
          <SvgSprite />
          <Widget />
        </>
      </ErrorBoundary>
    ),
    container,
  );

  return {
    container,
    dispose: () => {
      if (window.__REACT_SCAN_TOOLBAR_CONTAINER__ === container) {
        window.__REACT_SCAN_TOOLBAR_CONTAINER__ = undefined;
      }
      dispose();
      container.remove();
    },
  };
};
