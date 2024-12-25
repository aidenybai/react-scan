import { useRef, useEffect } from 'preact/hooks';
import { getDisplayName } from 'bippy';
import { Store } from '../../../..';
import {
  getCompositeComponentFromElement,
  getOverrideMethods,
} from '../../inspect-element/utils';
import { replayComponent } from '../../inspect-element/view-state';
import { Icon } from '../icon';

const REPLAY_DELAY_MS = 300;

export const BtnReplay = () => {
  const replayState = useRef({
    isReplaying: false,
    timeoutId: undefined as TTimer,
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
      const { parentCompositeFiber } = getCompositeComponentFromElement(focusedElement);
      if (!parentCompositeFiber) return;

      const displayName = getDisplayName(parentCompositeFiber.type);
      const reportData = Store.reportData.get(parentCompositeFiber);
      const count = reportData?.count || 0;
      const time = reportData?.time || 0;

      if (refComponentName.current && refMetrics.current) {
        refComponentName.current.dataset.text = displayName ?? 'Unknown';
        const formattedTime = time > 0
          ? time < 0.1 - Number.EPSILON
            ? '< 0.1ms'
            : `${Number(time.toFixed(1))}ms`
          : '';

        refMetrics.current.dataset.text = `${count} re-renders${formattedTime ? ` • ${formattedTime}` : ''}`;
      }
    });
  });

  const handleClose = () => {
    if (Store.inspectState.value.propContainer) {
      Store.inspectState.value = {
        kind: 'inspect-off',
        propContainer: Store.inspectState.value.propContainer,
      };
    }
  };

  // fixme: replace inline styles with direct tailwind usage
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
