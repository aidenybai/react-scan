import { useRef, useEffect, useCallback } from "preact/hooks";
import { getDisplayName } from 'bippy';
import { Store } from "../../../..";
import { getCompositeComponentFromElement, getOverrideMethods } from "../../inspect-element/utils";
import { replayComponent } from "../../inspect-element/view-state";
import { Icon } from "../icon";
import type { States } from "../../inspect-element/inspect-state-machine";

const THROTTLE_MS = 32;
const REPLAY_DELAY_MS = 300;

const BtnReplay = () => {
  const replayState = useRef({
    isReplaying: false,
    timeoutId: undefined as TTimer,
    toggleDisabled(disabled: boolean, button: HTMLElement) {
      button.classList[disabled ? 'add' : 'remove']('disabled');
    }
  });

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = !!overrideProps;

  const handleReplay = (e: MouseEvent) => {
    e.stopPropagation();
    const state = replayState.current;
    const button = e.currentTarget as HTMLElement;

    const inspectState = Store.inspectState.value;
    if (state.isReplaying || inspectState.kind !== 'focused') return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(inspectState.focusedDomElement);
    if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

    state.isReplaying = true;
    state.toggleDisabled(true, button);

    void replayComponent(parentCompositeFiber)
      .catch(() => void 0)
      .finally(() => {
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
          state.timeoutId = undefined;
        }
        if (document.hidden) {
          state.isReplaying = false;
          state.toggleDisabled(false, button);
        } else {
          state.timeoutId = setTimeout(() => {
            state.isReplaying = false;
            state.toggleDisabled(false, button);
          }, REPLAY_DELAY_MS);
        }
      });
  };

  if (!canEdit) return null;

  return (
    <button
      title="Replay component"
      className="react-scan-replay-button"
      onClick={handleReplay}
    >
      <Icon name="icon-replay" />
    </button>
  );
};

export const Header = () => {
  const headerState = useRef({
    refs: {
      componentName: null as HTMLSpanElement | null,
      metrics: null as HTMLSpanElement | null,
    },
    timers: {
      update: undefined as TTimer,
      raf: 0 as number
    },
    values: {
      componentName: '',
      metrics: '',
      lastUpdate: 0,
      pendingUpdate: false,
      fiber: null as any
    },
    mounted: true
  });

  const handleClose = () => {
    if (Store.inspectState.value.propContainer) {
      Store.inspectState.value = {
        kind: 'inspect-off',
        propContainer: Store.inspectState.value.propContainer,
      };
    }
  };

  const formatMetrics = (count: number, time?: number) =>
    `${count} renders${time ? ` • ${time.toFixed(2)}ms` : ''}`;

  const updateHeaderContent = useCallback(() => {
    const state = headerState.current;
    if (!state.mounted) return;

    const inspectState = Store.inspectState.value;
    if (inspectState.kind !== 'focused') return;

    const focusedDomElement = inspectState.focusedDomElement;
    if (!focusedDomElement || !state.refs.componentName || !state.refs.metrics) return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(focusedDomElement);
    if (!parentCompositeFiber) return;

    const fiber = parentCompositeFiber.alternate ?? parentCompositeFiber;

    if (fiber !== state.values.fiber) {
      state.values.fiber = fiber;
      state.values.componentName = getDisplayName(parentCompositeFiber.type) ?? 'Unknown';
    }

    const reportData = Store.reportData.get(fiber);

    if (!reportData?.count) return;
    const newMetrics = formatMetrics(reportData.count, reportData.time);
    if (newMetrics === state.values.metrics && !state.values.pendingUpdate) return;

    if (!state.values.pendingUpdate) {
      state.values.pendingUpdate = true;
      cancelAnimationFrame(state.timers.raf);
      state.timers.raf = requestAnimationFrame(() => {
        if (state.refs.componentName && state.refs.metrics) {
          state.refs.componentName.dataset.text = state.values.componentName;
          state.refs.metrics.dataset.text = newMetrics;
          state.values.metrics = newMetrics;
          state.values.lastUpdate = Date.now();
          state.values.pendingUpdate = false;
          state.timers.raf = 0;
        }
      });
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    const state = headerState.current;
    const now = Date.now();
    const timeSinceLastUpdate = now - state.values.lastUpdate;

    if (timeSinceLastUpdate < THROTTLE_MS) return;

    if (state.timers.update) {
      clearTimeout(state.timers.update);
      state.timers.update = undefined;
    }

    state.timers.update = setTimeout(updateHeaderContent, THROTTLE_MS);
  }, [updateHeaderContent]);

  const handleInspectStateChange = useCallback((newState: States) => {
    const state = headerState.current;
    if (!state.mounted) return;

    if (state.timers.update) {
      clearTimeout(state.timers.update);
      state.timers.update = undefined;
    }
    if (state.timers.raf) {
      cancelAnimationFrame(state.timers.raf);
      state.timers.raf = 0;
    }
    state.values.pendingUpdate = false;

    if (newState.kind === 'focused') {
      updateHeaderContent();
    }
  }, [updateHeaderContent]);

  useEffect(() => {
    const state = headerState.current;

    Store.lastReportTime.subscribe(scheduleUpdate);
    Store.inspectState.subscribe(handleInspectStateChange);

    return () => {
      state.mounted = false;
      if (state.timers.update) {
        clearTimeout(state.timers.update);
        state.timers.update = undefined;
      }
      if (state.timers.raf) {
        cancelAnimationFrame(state.timers.raf);
        state.timers.raf = 0;
      }
      state.values.pendingUpdate = false;
    };
  }, [scheduleUpdate, handleInspectStateChange]);

  const setComponentNameRef = useCallback((node: HTMLSpanElement | null) => {
    headerState.current.refs.componentName = node;
  }, []);

  const setMetricsRef = useCallback((node: HTMLSpanElement | null) => {
    headerState.current.refs.metrics = node;
  }, []);

  return (
    <div className="react-scan-header">
      <span
        ref={setComponentNameRef}
        className="with-data-text"
      />
      <span
        ref={setMetricsRef}
        className="with-data-text mr-auto !overflow-visible text-xs text-[#888]"
      />

      <BtnReplay />

      <button
        title="Close"
        class="react-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
