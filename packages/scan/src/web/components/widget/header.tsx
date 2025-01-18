import { getDisplayName, getFiberId } from 'bippy';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { Icon } from '../icon';
import {
  getCompositeComponentFromElement,
  getOverrideMethods,
} from '../inspector/utils';
import { Arrows } from './toolbar/arrows';

const REPLAY_DELAY_MS = 300;

export const BtnReplay = () => {
  const refTimeout = useRef<TTimer>();
  const replayState = useRef({
    isReplaying: false,
    toggleDisabled: (disabled: boolean, button: HTMLElement) => {
      button.classList[disabled ? 'add' : 'remove']('disabled');
    },
  });

  const [canEdit, setCanEdit] = useState(false);
  const isSettingsOpen = signalIsSettingsOpen.value;

  useEffect(() => {
    const { overrideProps } = getOverrideMethods();
    const canEdit = !!overrideProps;

    requestAnimationFrame(() => {
      setCanEdit(canEdit);
    });
  }, []);

  // const handleReplay = (e: MouseEvent) => {
  //   e.stopPropagation();
  //   const { overrideProps, overrideHookState } = getOverrideMethods();
  //   const state = replayState.current;
  //   const button = e.currentTarget as HTMLElement;

  //   const inspectState = Store.inspectState.value;
  //   if (state.isReplaying || inspectState.kind !== 'focused') return;

  //   const { parentCompositeFiber } = getCompositeComponentFromElement(
  //     inspectState.focusedDomElement,
  //   );
  //   if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

  //   state.isReplaying = true;
  //   state.toggleDisabled(true, button);

  //   void replayComponent(parentCompositeFiber)
  //     .catch(() => void 0)
  //     .finally(() => {
  //       clearTimeout(refTimeout.current);
  //       if (document.hidden) {
  //         state.isReplaying = false;
  //         state.toggleDisabled(false, button);
  //       } else {
  //         refTimeout.current = setTimeout(() => {
  //           state.isReplaying = false;
  //           state.toggleDisabled(false, button);
  //         }, REPLAY_DELAY_MS);
  //       }
  //     });
  // };

  if (!canEdit) return null;

  return (
    <button
      type="button"
      title="Replay component"
      // onClick={handleReplay}
      className={cn('react-scan-replay-button', {
        'opacity-0 pointer-events-none': isSettingsOpen,
      })}
    >
      <Icon name="icon-replay" />
    </button>
  );
};
const useSubscribeFocusedFiber = (onUpdate: () => void) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
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

const HeaderInspect = () => {
  const refRaf = useRef<number | null>(null);
  const refComponentName = useRef<HTMLSpanElement>(null);
  const refMetrics = useRef<HTMLSpanElement>(null);

  const isSettingsOpen = signalIsSettingsOpen.value;

  useSubscribeFocusedFiber(() => {
    cancelAnimationFrame(refRaf.current ?? 0);
    refRaf.current = requestAnimationFrame(() => {
      if (Store.inspectState.value.kind !== 'focused') return;
      const focusedElement = Store.inspectState.value.focusedDomElement;
      const { parentCompositeFiber } =
        getCompositeComponentFromElement(focusedElement);
      if (!parentCompositeFiber) return;

      const displayName = getDisplayName(parentCompositeFiber.type);
      const reportData = Store.reportData.get(getFiberId(parentCompositeFiber));

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

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center gap-x-2',
        'translate-y-0',
        'transition-transform duration-300',
        {
          '-translate-y-[200%]': isSettingsOpen,
        },
      )}
    >
      <span ref={refComponentName} className="with-data-text" />
      <span
        ref={refMetrics}
        className="with-data-text mr-auto cursor-pointer !overflow-visible text-xs text-[#888]"
        title="Click to toggle between rerenders and total renders"
      />
    </div>
  );
};

const HeaderSettings = () => {
  const isSettingsOpen = signalIsSettingsOpen.value;
  return (
    <span
      data-text="Settings"
      className={cn(
        'absolute inset-0 flex items-center',
        'with-data-text',
        '-translate-y-[200%]',
        'transition-transform duration-300',
        {
          'translate-y-0': isSettingsOpen,
        },
      )}
    />
  );
};

export const Header = () => {
  const handleClose = () => {
    if (signalIsSettingsOpen.value) {
      signalIsSettingsOpen.value = false;
      return;
    }

    Store.inspectState.value = {
      kind: 'inspect-off',
    };
  };

  return (
    <div className="react-scan-header">
      <div className="relative flex-1 h-full">
        <HeaderSettings />
        <HeaderInspect />
      </div>
      {Store.inspectState.value.kind === 'focused' ? <Arrows /> : null}
      {/* {Store.inspectState.value.kind !== 'inspect-off' && <BtnReplay />} */}
      <button
        type="button"
        title="Close"
        className="react-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
