import type { Fiber } from 'bippy';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn, getExtendedDisplayName } from '~web/utils/helpers';
import { Icon } from '../icon';
import { timelineState } from '../inspector/states';
import { getOverrideMethods } from '../inspector/utils';

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
  const refReRenders = useRef<HTMLSpanElement>(null);
  const refTiming = useRef<HTMLSpanElement>(null);
  const isSettingsOpen = signalIsSettingsOpen.value;
  const [currentFiber, setCurrentFiber] = useState<Fiber | null>(null);

  useEffect(() => {
    const unSubState = Store.inspectState.subscribe((state) => {
      if (state.kind !== 'focused') return;

      const fiber = state.fiber;
      if (!fiber) return;

      setCurrentFiber(fiber);
    });

    return unSubState;
  }, []);

  useEffect(() => {
    const unSubTimeline = timelineState.subscribe((state) => {
      if (Store.inspectState.value.kind !== 'focused') return;
      if (!refReRenders.current || !refTiming.current) return;

      const { totalUpdates, currentIndex, updates, isVisible, windowOffset } =
        state;

      const reRenders = Math.max(0, totalUpdates - 1);
      const headerText = isVisible
        ? `#${windowOffset + currentIndex} Re-render`
        : `${reRenders} Re-renders`;

      let formattedTime: string | undefined;
      if (reRenders > 0 && currentIndex >= 0 && currentIndex < updates.length) {
        const time = updates[currentIndex]?.fiberInfo?.selfTime;
        formattedTime =
          time > 0
            ? time < 0.1 - Number.EPSILON
              ? '< 0.1ms'
              : `${Number(time.toFixed(1))}ms`
            : undefined;
      }

      refReRenders.current.dataset.text = `${headerText}${reRenders > 0 && formattedTime ? ' •' : ''}`;
      if (formattedTime) {
        refTiming.current.dataset.text = formattedTime;
      }
    });

    return unSubTimeline;
  }, []);

  const componentName = useMemo(() => {
    if (!currentFiber) return null;
    const { name, wrappers, wrapperTypes } = getExtendedDisplayName(currentFiber);

    const title = wrappers.length
      ? `${wrappers.join('(')}(${name})${')'.repeat(wrappers.length)}`
      : name ?? '';

    const firstWrapperType = wrapperTypes[0];
    return (
      <span
        title={title}
        className="flex items-center gap-x-1"
      >
        {name ?? 'Unknown'}
        <span
          title={firstWrapperType?.title}
          className="flex items-center gap-x-1 text-[10px] text-purple-400"
        >
          {
            !!firstWrapperType && (
              <>
                <span
                  key={firstWrapperType.type}
                  className={cn(
                    'rounded py-[1px] px-1',
                    'truncate',
                    {
                      'bg-purple-800 text-neutral-400': firstWrapperType.compiler,
                      'bg-neutral-700 text-neutral-300': !firstWrapperType.compiler,
                      'bg-[#5f3f9a] text-white': firstWrapperType.type === 'memo',
                    }
                  )}
                >
                  {firstWrapperType.type}
                </span>
                {firstWrapperType.compiler && (
                  <span className="text-yellow-300">✨</span>
                )}
              </>
            )
          }
        </span>
        {
          wrapperTypes.length > 1 && (
            <span className="text-[10px] text-neutral-400">
              ×{wrapperTypes.length - 1}
            </span>
          )
        }
        <samp className="text-neutral-500">
          {' • '}
        </samp>
      </span>
    );
  }, [currentFiber]);

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
      {componentName}
      <div className="flex items-center gap-x-2 mr-auto text-xs text-[#888]">
        <span
          ref={refReRenders}
          className="with-data-text cursor-pointer !overflow-visible"
          title="Click to toggle between rerenders and total renders"
        />
        <span ref={refTiming} className="with-data-text !overflow-visible" />
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

      {/* <Arrows /> */}
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
