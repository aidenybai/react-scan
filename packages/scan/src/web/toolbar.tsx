import { render } from 'preact';
import { Widget } from './components/widget';

export const createToolbar = (root: ShadowRoot): HTMLElement => {
  const container = document.createElement('div');
  root.appendChild(container);

  render(<Widget />, container);

  const originalRemove = container.remove.bind(container);

  container.remove = function () {
    if (container.hasChildNodes()) {
      // Double render(null) is needed to fully unmount Preact components.
      // The first call initiates unmounting, while the second ensures
      // cleanup of internal VNode references and event listeners.
      render(null, container);
      render(null, container);
    }

    originalRemove();
  };

  return container;
};
