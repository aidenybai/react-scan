import { signal } from '@preact/signals';
import { type Fiber, getFiberId } from 'bippy';
import { Component } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { Icon } from '../icon';
import { ComponentStack } from './component-stack';
import { flashManager } from './flash-overlay';
import {
  type InspectorData,
  collectInspectorData,
  resetStateTracking,
} from './overlay/utils';
import { PropertySection } from './propeties';
import { getCompositeFiberFromElement } from './utils';
import { WhatChanged } from './what-changed';

interface InspectorState extends InspectorData {
  fiber: Fiber | null;
}

export const globalInspectorState = {
  lastRendered: new Map<string, unknown>(),
  expandedPaths: new Set<string>(),
  cleanup: () => {
    globalInspectorState.lastRendered.clear();
    globalInspectorState.expandedPaths.clear();
    flashManager.cleanupAll();
    resetStateTracking();
    inspectorState.value = {
      fiber: null,
      fiberProps: { current: [], changes: new Set() },
      fiberState: { current: [], changes: new Set() },
      fiberContext: { current: [], changes: new Set() },
    };
  },
};

export const inspectorState = signal<InspectorState>({
  fiber: null,
  fiberProps: { current: [], changes: new Set() },
  fiberState: { current: [], changes: new Set() },
  fiberContext: { current: [], changes: new Set() },
});

// todo: add reset button and error message
class InspectorErrorBoundary extends Component {
  state: { error: any; hasError: boolean } = { hasError: false, error: null };

  static getDerivedStateFromError(e: any) {
    return { hasError: true, error: e };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-950/50 h-screen backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3 text-red-400 font-medium">
            <Icon name="icon-flame" className="text-red-500" size={16} />
            Something went wrong in the inspector
          </div>
          <div className="p-3 bg-black/40 rounded font-mono text-xs text-red-300 mb-4 break-words">
            {this.state.error?.message || JSON.stringify(this.state.error)}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
          >
            Reset Inspector
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const Inspector = constant(() => {
  const refLastInspectedFiber = useRef<Fiber | null>(null);

  const isSettingsOpen = signalIsSettingsOpen.value;

  useEffect(() => {
    let isProcessing = false;
    const pendingUpdates = new Set<Fiber>();

    const processNextUpdate = () => {
      if (pendingUpdates.size === 0) {
        isProcessing = false;
        return;
      }

      const nextFiber = Array.from(pendingUpdates)[0];
      pendingUpdates.delete(nextFiber);

      try {
        refLastInspectedFiber.current = nextFiber;
        const collectedData = collectInspectorData(nextFiber);

        inspectorState.value = {
          fiber: nextFiber,
          ...collectedData,
        };
      } finally {
        if (pendingUpdates.size > 0) {
          queueMicrotask(processNextUpdate);
        } else {
          isProcessing = false;
        }
      }
    };

    const unSubState = Store.inspectState.subscribe((state) => {
      if (state.kind !== 'focused' || !state.focusedDomElement) {
        pendingUpdates.clear();
        return;
      }

      if (state.kind === 'focused') {
        signalIsSettingsOpen.value = false;
      }

      const { parentCompositeFiber } = getCompositeFiberFromElement(
        state.focusedDomElement,
      );
      if (!parentCompositeFiber) return;

      pendingUpdates.clear();
      globalInspectorState.cleanup();
      refLastInspectedFiber.current = parentCompositeFiber;

      const { fiberProps, fiberState, fiberContext } =
        collectInspectorData(parentCompositeFiber);

      inspectorState.value = {
        fiber: parentCompositeFiber,
        fiberProps: {
          ...fiberProps,
          changes: new Set(),
        },
        fiberState: {
          ...fiberState,
          changes: new Set(),
        },
        fiberContext: {
          ...fiberContext,
          changes: new Set(),
        },
      };
    });

    const unSubReport = Store.lastReportTime.subscribe(() => {
      const inspectState = Store.inspectState.value;
      if (inspectState.kind !== 'focused') {
        pendingUpdates.clear();
        return;
      }

      const element = inspectState.focusedDomElement;
      const { parentCompositeFiber } = getCompositeFiberFromElement(element);

      if (!parentCompositeFiber) {
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
        return;
      }

      if (parentCompositeFiber.type === refLastInspectedFiber.current?.type) {
        pendingUpdates.add(parentCompositeFiber);

        if (!isProcessing) {
          isProcessing = true;
          queueMicrotask(processNextUpdate);
        }
      }
    });

    return () => {
      unSubState();
      unSubReport();
      pendingUpdates.clear();
      globalInspectorState.cleanup();
      resetStateTracking();
    };
  }, []);
  const fiber = inspectorState.value.fiber;
  const fiberID = fiber ? getFiberId(fiber) : null;

  return (
    <InspectorErrorBoundary>
      <div
        className={cn(
          'react-scan-inspector',
          'opacity-0',
          'max-h-0',
          'overflow-hidden',
          'transition-opacity duration-150 delay-0',
          'pointer-events-none',
          {
            'opacity-100 delay-300 pointer-events-auto max-h-["auto"]':
              !isSettingsOpen,
          },
        )}
      >
        <WhatChanged key={fiberID} />
        <PropertySection title="Props" section="props" />
        <PropertySection title="State" section="state" />
        <PropertySection title="Context" section="context" />
        <ComponentStack />
      </div>
    </InspectorErrorBoundary>
  );
});
