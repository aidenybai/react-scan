import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { scan } from '~core/index';
import type { Options } from '~core/index';
import styles from '~web/assets/css/styles.css';
import { SvgSprite } from '~web/components/svg-sprite';
import { ToolbarElementContext } from '~web/toolbar-context';
import { Content } from '~web/views';
import { ScanOverlay } from '~web/views/inspector/overlay';

// Structural type matching TanStackDevtoolsPlugin — no runtime @tanstack/devtools dependency.
export interface ReactScanTanStackPlugin {
  id?: string;
  name: string;
  defaultOpen?: boolean;
  render: (el: HTMLDivElement, props: Record<string, unknown>) => void;
  destroy?: (pluginId: string) => void;
}

const TanStackPanel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Force a re-render after mount so ToolbarElementContext receives the live DOM ref,
  // enabling portal targets in popovers and other-visualization.
  const [, forceUpdate] = useState(false);
  useEffect(() => {
    forceUpdate(true);
  }, []);

  return (
    <ToolbarElementContext.Provider value={containerRef.current}>
      <ScanOverlay />
      <div
        ref={containerRef}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Content />
      </div>
    </ToolbarElementContext.Provider>
  );
};

/**
 * Creates a TanStack DevTools plugin that embeds React Scan's inspector,
 * notifications, and scan controls inside the TanStack DevTools panel.
 *
 * @example
 * ```tsx
 * import { TanStackDevtools } from '@tanstack/react-devtools';
 * import { createReactScanPlugin } from 'react-scan/tanstack-plugin';
 *
 * <TanStackDevtools plugins={[createReactScanPlugin()]} />
 * ```
 *
 * React Scan's render outline overlays continue to appear on the page as usual.
 * The floating toolbar is suppressed — all controls live inside the TanStack panel.
 */
export function createReactScanPlugin(
  options: Omit<Options, 'showToolbar'> = {},
): ReactScanTanStackPlugin {
  let shadowRoot: ShadowRoot | null = null;
  let container: HTMLDivElement | null = null;

  return {
    id: 'react-scan',
    name: 'React Scan',
    render(el) {
      // Start scanning without the floating widget.
      scan({ ...options, showToolbar: false });

      // Create an isolated shadow root — same pattern as initRootContainer in core/index.ts.
      shadowRoot = el.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      shadowRoot.appendChild(styleEl);

      container = document.createElement('div');
      container.style.cssText = 'height:100%;display:flex;flex-direction:column;';
      shadowRoot.appendChild(container);

      render(
        <>
          <SvgSprite />
          <TanStackPanel />
        </>,
        container,
      );
    },
    destroy() {
      if (container) {
        // Double render(null) is required to fully unmount Preact components
        // and flush internal VNode references and event listeners.
        render(null, container);
        render(null, container);
        container = null;
        shadowRoot = null;
      }
    },
  };
}
