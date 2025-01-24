import type { Fiber } from 'bippy';
import { Component } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { Icon } from '../icon';
import { StickySection } from '../sticky-section';
import { flashManager } from './flash-overlay';
import {
  collectInspectorData,
  getStateNames,
  resetStateTracking,
} from './overlay/utils';
import { PropertySection } from './propeties';
import {
  type TimelineUpdate,
  inspectorUpdateSignal,
  timelineActions,
} from './states';
import { Timeline } from './timeline';
import { extractMinimalFiberInfo, getCompositeFiberFromElement } from './utils';
import { WhatChanged } from './what-changed';

export const globalInspectorState = {
  lastRendered: new Map<string, unknown>(),
  expandedPaths: new Set<string>(),
  cleanup: () => {
    globalInspectorState.lastRendered.clear();
    globalInspectorState.expandedPaths.clear();
    flashManager.cleanupAll();
    resetStateTracking();
    timelineActions.reset();
  },
};

// todo: add reset button and error message
class InspectorErrorBoundary extends Component {
  state: { error: Error | null; hasError: boolean } = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    globalInspectorState.cleanup();
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
            type="button"
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
  const refInspector = useRef<HTMLDivElement>(null);
  const refLastInspectedFiber = useRef<Fiber | null>(null);
  const refPendingUpdates = useRef<Set<Fiber>>(new Set<Fiber>());
  const isSettingsOpen = signalIsSettingsOpen.value;

  useEffect(() => {
    const processUpdate = () => {
      if (refPendingUpdates.current.size === 0) return;

      const fiber = Array.from(refPendingUpdates.current)[0];
      refPendingUpdates.current.clear();

      refLastInspectedFiber.current = fiber;
      const inspectorData = collectInspectorData(fiber);

      const update: TimelineUpdate = {
        timestamp: Date.now(),
        fiberInfo: extractMinimalFiberInfo(fiber),
        props: inspectorData.fiberProps,
        state: inspectorData.fiberState,
        context: inspectorData.fiberContext,
        stateNames: getStateNames(fiber),
      };

      timelineActions.addUpdate(update, fiber);

      if (refPendingUpdates.current.size > 0) {
        queueMicrotask(processUpdate);
      }
    };

    const scheduleUpdate = (fiber: Fiber) => {
      refPendingUpdates.current.add(fiber);
      queueMicrotask(processUpdate);
    };

    const unSubState = Store.inspectState.subscribe((state) => {
      if (state.kind !== 'focused' || !state.focusedDomElement) {
        refPendingUpdates.current.clear();
        refLastInspectedFiber.current = null;
        globalInspectorState.cleanup();
        return;
      }

      if (state.kind === 'focused') {
        signalIsSettingsOpen.value = false;
      }

      const { parentCompositeFiber } = getCompositeFiberFromElement(
        state.focusedDomElement,
      );

      if (!parentCompositeFiber) return;

      const isNewComponent = refLastInspectedFiber.current?.type !== parentCompositeFiber.type;

      if (isNewComponent) {
        refLastInspectedFiber.current = parentCompositeFiber;
        refPendingUpdates.current.clear();
        globalInspectorState.cleanup();
        scheduleUpdate(parentCompositeFiber);
      }
    });

    const unSubInspectorUpdate = inspectorUpdateSignal.subscribe(() => {
      const inspectState = Store.inspectState.value;
      if (inspectState.kind !== 'focused' || !inspectState.focusedDomElement) {
        refPendingUpdates.current.clear();
        refLastInspectedFiber.current = null;
        globalInspectorState.cleanup();
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

      scheduleUpdate(parentCompositeFiber);

      if (!element.isConnected) {
        refPendingUpdates.current.clear();
        refLastInspectedFiber.current = null;
        globalInspectorState.cleanup();
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: null,
        };
      }
    });

    return () => {
      unSubState();
      unSubInspectorUpdate();
      refPendingUpdates.current.clear();
      globalInspectorState.cleanup();
    };
  }, []);

  return (
    <InspectorErrorBoundary>
      <div
        ref={refInspector}
        className={cn(
          'react-scan-inspector',
          'opacity-0',
          'h-full',
          'overflow-y-auto overflow-x-hidden',
          'transition-opacity duration-150 delay-0',
          'pointer-events-none',
          {
            'opacity-100 delay-300 pointer-events-auto': !isSettingsOpen,
          },
        )}
      >
        <StickySection>
          {(props) => <Timeline {...props} />}
        </StickySection>
        <StickySection>
          {(props) => <WhatChanged {...props} />}
        </StickySection>
        <StickySection>
          {(props) => <PropertySection section="props" {...props} />}
        </StickySection>
        <StickySection>
          {(props) => <PropertySection section="state" {...props} />}
        </StickySection>
        <StickySection>
          {(props) => <PropertySection section="context" {...props} />}
        </StickySection>
      </div>
    </InspectorErrorBoundary>
  );
});
