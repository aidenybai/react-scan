import type { Fiber } from "bippy";
import { ErrorBoundary, Show, createEffect, onCleanup, untrack } from "solid-js";
import { getInspectState, setInspectState } from "../../../core/native-state";
import { Icon } from "../../components/icon";
import { setWidgetView } from "../../state";
import { cn } from "../../utils/helpers";
import { ComponentsTree } from "./components-tree";
import { flashManager } from "./flash-overlay";
import {
  globalInspectorState,
  getInspectorUpdateVersion,
  type TimelineUpdate,
  timelineActions,
} from "./states";
import {
  collectInspectorData,
  getStateNames,
  resetTracking,
} from "../../../core/inspection/change-collection";
import { extractMinimalFiberInfo, getCompositeFiberFromElement } from "./utils";
import { WhatChanged } from "./what-changed";

const cleanupInspectorState = () => {
  globalInspectorState.lastRendered.clear();
  globalInspectorState.expandedPaths.clear();
  flashManager.cleanupAll();
  resetTracking();
  timelineActions.reset();
};

const InspectorErrorFallback = (error: Error, reset: () => void) => {
  const handleReset = () => {
    cleanupInspectorState();
    reset();
  };

  return (
    <div class="p-4 bg-red-950/50 h-screen backdrop-blur-sm">
      <div class="flex items-center gap-2 mb-3 text-red-400 font-medium">
        <Icon name="icon-flame" class="text-red-500" size={16} />
        Something went wrong in the inspector
      </div>
      <div class="p-3 bg-black/40 rounded font-mono text-xs text-red-300 mb-4 break-words">
        {error.message || JSON.stringify(error)}
      </div>
      <button
        type="button"
        onClick={handleReset}
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        Reset Inspector
      </button>
    </div>
  );
};

const inspectorContainerClassName = cn(
  "react-scan-inspector",
  "flex-1",
  "opacity-100",
  "overflow-y-auto overflow-x-hidden",
  "transition-opacity delay-300",
  "pointer-events-auto",
);

const Inspector = () => {
  let lastInspectedFiber: Fiber | null = null;

  const processUpdate = (fiber: Fiber) => {
    if (!fiber) return;

    lastInspectedFiber = fiber;
    const { data: inspectorData, shouldUpdate } = collectInspectorData(fiber);

    if (shouldUpdate) {
      const update: TimelineUpdate = {
        timestamp: Date.now(),
        fiberInfo: extractMinimalFiberInfo(fiber),
        props: inspectorData.fiberProps,
        state: inspectorData.fiberState,
        context: inspectorData.fiberContext,
        stateNames: getStateNames(fiber),
      };

      timelineActions.addUpdate(update, fiber);
    }
  };

  createEffect(() => {
    const state = getInspectState();
    untrack(() => {
      if (state.kind !== "focused" || !state.focusedDomElement) {
        lastInspectedFiber = null;
        cleanupInspectorState();
        return;
      }

      const { parentCompositeFiber } = getCompositeFiberFromElement(
        state.focusedDomElement,
        state.fiber,
      );

      if (!parentCompositeFiber) {
        setInspectState({
          kind: "inspect-off",
        });
        setWidgetView({
          view: "none",
        });
        return;
      }

      const isNewComponent = lastInspectedFiber?.type !== parentCompositeFiber.type;

      if (isNewComponent) {
        lastInspectedFiber = parentCompositeFiber;
        cleanupInspectorState();
        processUpdate(parentCompositeFiber);
      }
    });
  });

  createEffect(() => {
    getInspectorUpdateVersion();
    untrack(() => {
      const inspectState = getInspectState();
      if (inspectState.kind !== "focused" || !inspectState.focusedDomElement) {
        lastInspectedFiber = null;
        cleanupInspectorState();
        return;
      }

      const { parentCompositeFiber } = getCompositeFiberFromElement(
        inspectState.focusedDomElement,
        inspectState.fiber,
      );

      if (!parentCompositeFiber) {
        setInspectState({
          kind: "inspect-off",
        });
        setWidgetView({
          view: "none",
        });
        return;
      }

      processUpdate(parentCompositeFiber);

      if (!inspectState.focusedDomElement.isConnected) {
        lastInspectedFiber = null;
        cleanupInspectorState();
        setInspectState({
          kind: "inspecting",
          hoveredDomElement: null,
        });
      }
    });
  });

  onCleanup(() => {
    cleanupInspectorState();
  });

  return (
    <ErrorBoundary fallback={InspectorErrorFallback}>
      <div class={inspectorContainerClassName}>
        <div class="w-full h-full">
          <WhatChanged />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const ViewInspector = () => {
  return (
    <ErrorBoundary fallback={InspectorErrorFallback}>
      <Show when={getInspectState().kind === "focused"}>
        <Inspector />
        <ComponentsTree />
      </Show>
    </ErrorBoundary>
  );
};
