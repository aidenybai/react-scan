import { getDisplayName } from 'bippy';
import { useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { replayComponent } from '~web/components/inspector';
import { Icon } from '../icon';
import {
  getCompositeComponentFromElement,
  getOverrideMethods,
} from '../inspector/utils';

const REPLAY_DELAY_MS = 300;

export const BtnReplay = () => {
  const refTimeout = useRef<TTimer>();
  const replayState = useRef({
    isReplaying: false,
    toggleDisabled: (disabled: boolean, button: HTMLElement) => {
      button.classList[disabled ? 'add' : 'remove']('disabled');
    },
  });

  const { overrideProps, overrideHookState } = getOverrideMethods();
  const canEdit = !!overrideProps;

  const handleReplay = (e: MouseEvent) => {
    e.stopPropagation();
    const state = replayState.current;
    const button = e.currentTarget as HTMLElement;

    const inspectState = Store.inspectState.value;
    if (state.isReplaying || inspectState.kind !== 'focused') return;

    const { parentCompositeFiber } = getCompositeComponentFromElement(
      inspectState.focusedDomElement,
    );
    if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

    state.isReplaying = true;
    state.toggleDisabled(true, button);

    void replayComponent(parentCompositeFiber)
      .catch(() => void 0)
      .finally(() => {
        clearTimeout(refTimeout.current);
        if (document.hidden) {
          state.isReplaying = false;
          state.toggleDisabled(false, button);
        } else {
          refTimeout.current = setTimeout(() => {
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
const useSubscribeFocusedFiber = (onUpdate: () => void) => {
  useEffect(() => {
    const subscribe = () => {
      if (Store.inspectState.value.kind !== 'focused') {
        return;
      }
      onUpdate();
    };

    const unSubReportTime = Store.lastReportTime.subscribe(subscribe);
    const unSubState = Store.inspectState.subscribe(subscribe);
    return () => {
      unSubReportTime();
      unSubState();
    };
  }, []);
};

export const Header = () => {
  const refRaf = useRef<number | null>(null);
  const refComponentName = useRef<HTMLSpanElement>(null);
  const refMetrics = useRef<HTMLSpanElement>(null);

  useSubscribeFocusedFiber(() => {
    cancelAnimationFrame(refRaf.current ?? 0);
    refRaf.current = requestAnimationFrame(() => {
      if (Store.inspectState.value.kind !== 'focused') return;
      const focusedElement = Store.inspectState.value.focusedDomElement;
      const { parentCompositeFiber } =
        getCompositeComponentFromElement(focusedElement);
      if (!parentCompositeFiber) return;

      const displayName = getDisplayName(parentCompositeFiber.type);
      const reportData = Store.reportData.get(parentCompositeFiber);
      const count = reportData?.count || 0;
      const time = reportData?.time || 0;

      if (refComponentName.current && refMetrics.current) {
        refComponentName.current.dataset.text = displayName ?? 'Unknown';
        const formattedTime =
          time > 0
            ? time < 0.1 - Number.EPSILON
              ? '< 0.1ms'
              : `${Number(time.toFixed(1))}ms`
            : '';

        refMetrics.current.dataset.text = `${count} re-renders${formattedTime ? ` • ${formattedTime}` : ''}`;
      }
    });
  });

  const handleClose = () => {
    Store.inspectState.value = {
      kind: 'inspect-off',
    };
  };

  return (
    <div className="react-scan-header">
      <span ref={refComponentName} className="with-data-text" />
      <span
        ref={refMetrics}
        className="with-data-text mr-auto cursor-pointer !overflow-visible text-xs text-[#888]"
        title="Click to toggle between rerenders and total renders"
      />
      <BtnReplay />
      <button
        title="Close"
        className="react-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
