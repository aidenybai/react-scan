import { render } from 'preact';
import { Widget } from './components/widget';

const defaultWidth = 360;

export const restoreSizeFromLocalStorage = (): number => {
  const width = localStorage.getItem('react-scan-toolbar-width');
  return width ? parseInt(width, 10) : defaultWidth;
};

export function createToolbar(shadow: ShadowRoot): HTMLElement | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const ToolbarWrapper = () => (
    <>
      {/* <Toolbar
        inspectState={Store.inspectState}
        isPaused={ReactScanInternals.instrumentation?.isPaused!}
        isSoundOn={isSoundOnSignal}
        x={toolbarX}
        y={toolbarY}
        isDragging={isDragging}
        isResizing={isResizing}
      /> */}
      <Widget />
    </>
  );

  const root = document.createElement('div');
  shadow.appendChild(root);
  render(<ToolbarWrapper />, root);

  return root;
}
