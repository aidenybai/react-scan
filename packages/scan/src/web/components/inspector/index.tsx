import type { Fiber } from 'bippy';
import { Component } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { Icon } from '../icon';
import { flashManager } from './flash-overlay';
import {
  collectInspectorData,
  getStateNames,
  resetStateTracking,
} from './overlay/utils';
import { PropertySection } from './propeties';
import {
  TIMELINE_MAX_UPDATES,
  type TimelineUpdate,
  inspectorState,
  timelineState,
} from './states';
import { getCompositeFiberFromElement } from './utils';
import { WhatChanged } from './what-changed';

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
  const refLastInspectedFiber = useRef<Fiber | null>(null);
  const refPendingUpdates = useRef<Set<Fiber>>(new Set<Fiber>());
  const isSettingsOpen = signalIsSettingsOpen.value;

  useEffect(() => {
    const processUpdate = () => {
      if (refPendingUpdates.current.size === 0) return;

      const fiber = Array.from(refPendingUpdates.current)[0];
      refPendingUpdates.current.clear();

      const timeline = timelineState.value;
      if (timeline.isReplaying) {
        const update = timeline.updates[timeline.currentIndex];
        refLastInspectedFiber.current = update.fiber;

        inspectorState.value = {
          fiber: update.fiber,
          fiberProps: update.props,
          fiberState: update.state,
          fiberContext: update.context,
        };
        timelineState.value.isReplaying = false;
        return;
      }

      refLastInspectedFiber.current = fiber;
      inspectorState.value = {
        fiber,
        ...collectInspectorData(fiber),
      };

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

      if (refLastInspectedFiber.current?.type !== parentCompositeFiber.type) {
        refPendingUpdates.current.clear();
        globalInspectorState.cleanup();
        scheduleUpdate(parentCompositeFiber);
      }
    });

    const unSubLastReportTime = Store.lastReportTime.subscribe(() => {
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

      requestAnimationFrame(() => {
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
    });

    const unSubInspectorState = inspectorState.subscribe((state) => {
      if (!state.fiber || !refLastInspectedFiber.current) return;
      if (state.fiber.type !== refLastInspectedFiber.current.type) return;
      if (timelineState.value.isReplaying) return;

      const update: TimelineUpdate = {
        fiber: { ...state.fiber },
        timestamp: Date.now(),
        props: state.fiberProps,
        state: state.fiberState,
        context: state.fiberContext,
        stateNames: getStateNames(state.fiber),
      };

      const { updates, currentIndex, totalUpdates } = timelineState.value;
      let newUpdates: TimelineUpdate[];

      if (updates.length >= TIMELINE_MAX_UPDATES) {
        if (currentIndex < updates.length - 1) {
          newUpdates = [...updates.slice(0, currentIndex + 1), update].slice(
            -TIMELINE_MAX_UPDATES,
          );
        } else {
          newUpdates = [...updates.slice(1), update];
        }
      } else {
        if (currentIndex < updates.length - 1) {
          newUpdates = [...updates.slice(0, currentIndex + 1), update];
        } else {
          newUpdates = [...updates, update];
        }
      }

      const newIndex = newUpdates.length - 1;
      const newTotal =
        currentIndex < updates.length - 1
          ? totalUpdates - (updates.length - currentIndex - 1) + 1
          : totalUpdates + 1;

      timelineState.value = {
        ...timelineState.value,
        updates: newUpdates,
        currentIndex: newIndex,
        totalUpdates: newTotal,
      };
    });

    return () => {
      unSubState();
      unSubLastReportTime();
      unSubInspectorState();
      refPendingUpdates.current.clear();
      globalInspectorState.cleanup();
    };
  }, []);

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
        <WhatChanged />
        <PropertySection title="Props" section="props" />
        <PropertySection title="State" section="state" />
        <PropertySection title="Context" section="context" />
      </div>
    </InspectorErrorBoundary>
  );
});
