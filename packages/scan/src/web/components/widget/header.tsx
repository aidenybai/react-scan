import { getDisplayName } from 'bippy';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';
import { Icon } from '../icon';
import { timelineState } from '../inspector/states';
import {
  getCompositeComponentFromElement,
  getOverrideMethods,
} from '../inspector/utils';
import { Arrows } from './toolbar/arrows';

// const REPLAY_DELAY_MS = 300;

export const BtnReplay = () => {
  // const refTimeout = useRef<TTimer>();
  // const replayState = useRef({
  //   isReplaying: false,
  //   toggleDisabled: (disabled: boolean, button: HTMLElement) => {
  //     button.classList[disabled ? 'add' : 'remove']('disabled');
  //   },
  // });

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
// const useSubscribeFocusedFiber = (onUpdate: () => void) => {
//   // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
//   useEffect(() => {
//     const subscribe = () => {
//       if (Store.inspectState.value.kind !== 'focused') {
//         return;
//       }
//       onUpdate();
//     };

//     const unSubReportTime = Store.lastReportTime.subscribe(subscribe);
//     const unSubState = Store.inspectState.subscribe(subscribe);
//     return () => {
//       unSubReportTime();
//       unSubState();
//     };
//   }, []);
// };

const HeaderInspect = () => {
  const refComponentName = useRef<HTMLSpanElement>(null);
  const refReRenders = useRef<HTMLSpanElement>(null);
  const refTiming = useRef<HTMLSpanElement>(null);
  const isSettingsOpen = signalIsSettingsOpen.value;

  useEffect(() => {
    const unSubState = Store.inspectState.subscribe((state) => {
      if (state.kind !== 'focused' || !refComponentName.current) return;

      const focusedElement = state.focusedDomElement;
      const { parentCompositeFiber } = getCompositeComponentFromElement(focusedElement);
      if (!parentCompositeFiber) return;

      const displayName = getDisplayName(parentCompositeFiber.type);
      refComponentName.current.dataset.text = displayName ?? 'Unknown';
    });

    return () => unSubState();
  }, []);

  useEffect(() => {
    const unSubTimeline = timelineState.subscribe((state) => {
      if (Store.inspectState.value.kind !== 'focused') return;
      if (!refReRenders.current || !refTiming.current) return;

      const { totalUpdates, currentIndex, updates, isVisible, windowOffset, latestFiber } = state;

      const reRenders = Math.max(0, totalUpdates - 1);
      const headerText = isVisible
        ? `#${windowOffset + currentIndex} Re-render`
        : `${reRenders} Re-renders`;

      let formattedTime = '';
      if (reRenders > 0 && currentIndex >= 0 && currentIndex < updates.length) {
        const time = latestFiber?.actualDuration ?? 0;
        formattedTime = time > 0
          ? time < 0.1 - Number.EPSILON
            ? '< 0.1ms'
            : `${Number(time.toFixed(1))}ms`
          : '';
      }

      refReRenders.current.dataset.text = `${headerText}${reRenders > 0 ? ' •' : ''}`;
      if (formattedTime) {
        refTiming.current.dataset.text = formattedTime;
      }
    });

    return () => unSubTimeline();
  }, []);

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
      <div className="flex items-center gap-x-2 mr-auto text-xs text-[#888]">
        <span
          ref={refReRenders}
          className="with-data-text cursor-pointer !overflow-visible"
          title="Click to toggle between rerenders and total renders"
        />
        <span
          ref={refTiming}
          className="with-data-text !overflow-visible"
        />
      </div>
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

      <Arrows />
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
