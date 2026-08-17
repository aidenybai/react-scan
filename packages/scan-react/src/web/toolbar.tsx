import { Component, type PropsWithChildren } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Icon } from './components/icon';
import { Widget } from './widget';
import { SvgSprite } from './components/svg-sprite';

class ToolbarErrorBoundary extends Component<PropsWithChildren> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-4 right-4 z-[124124124124]">
          <div className="p-3 bg-black rounded-lg shadow-lg w-80">
            <div className="flex items-center gap-2 mb-2 text-red-400 text-sm font-medium">
              <Icon name="icon-flame" className="text-red-500" size={14} />
              React Scan ran into a problem
            </div>
            <div className="p-2 bg-black rounded font-mono text-xs text-red-300 mb-3 break-words">
              {this.state.error?.message || JSON.stringify(this.state.error)}
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              Restart
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const createToolbar = (root: ShadowRoot): HTMLElement => {
  const container = document.createElement('div');
  container.id = 'react-scan-toolbar-root';
  window.__REACT_SCAN_TOOLBAR_CONTAINER__ = container;
  root.appendChild(container);

  const reactRoot: Root = createRoot(container);

  reactRoot.render(
    <ToolbarErrorBoundary>
      <>
        <SvgSprite />
        <Widget />
      </>
    </ToolbarErrorBoundary>,
  );

  const originalRemove = container.remove.bind(container);

  container.remove = () => {
    window.__REACT_SCAN_TOOLBAR_CONTAINER__ = undefined;

    if (container.hasChildNodes()) {
      reactRoot.unmount();
    }

    originalRemove();
  };

  return container;
};
