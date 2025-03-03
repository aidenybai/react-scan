import { computed, untracked, useSignalEffect } from '@preact/signals';
import type { Fiber } from 'bippy';
import { useMemo, useRef, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { signalIsSettingsOpen } from '~web/state';
import { cn, getExtendedDisplayName } from '~web/utils/helpers';
import { timelineState } from './states';

const headerInspectClassName = computed(() =>
  cn(
    'absolute inset-0 flex items-center gap-x-2',
    'translate-y-0',
    'transition-transform duration-300',
    signalIsSettingsOpen.value && '-translate-y-[200%]',
  ),
);

export const HeaderInspect = () => {
  const refReRenders = useRef<HTMLSpanElement>(null);
  const refTiming = useRef<HTMLSpanElement>(null);
  const [currentFiber, setCurrentFiber] = useState<Fiber | null>(null);

  useSignalEffect(() => {
    const state = Store.inspectState.value;

    if (state.kind === 'focused') {
      setCurrentFiber(state.fiber);
    }
  });

  useSignalEffect(() => {
    const state = timelineState.value;
    untracked(() => {
      if (Store.inspectState.value.kind !== 'focused') return;
      if (!refReRenders.current || !refTiming.current) return;

      const { totalUpdates, currentIndex, updates, isVisible, windowOffset } =
        state;

      const reRenders = Math.max(0, totalUpdates - 1);
      const headerText = isVisible
        ? `#${windowOffset + currentIndex} Re-render`
        : reRenders > 0
          ? `×${reRenders}`
          : '';

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

      // TODO(Alexis): can be computed signal
      refReRenders.current.dataset.text = headerText ? ` • ${headerText}` : '';
      refTiming.current.dataset.text = formattedTime
        ? ` • ${formattedTime}`
        : '';
    });
  });

  const componentName = useMemo(() => {
    if (!currentFiber) return null;
    const { name, wrappers, wrapperTypes } =
      getExtendedDisplayName(currentFiber);

    const title = wrappers.length
      ? `${wrappers.join('(')}(${name})${')'.repeat(wrappers.length)}`
      : (name ?? '');

    const firstWrapperType = wrapperTypes[0];
    return (
      <span title={title} className="flex items-center gap-x-1">
        {name ?? 'Unknown'}
        <span
          title={firstWrapperType?.title}
          className="flex items-center gap-x-1 text-[10px] text-purple-400"
        >
          {!!firstWrapperType && (
            <>
              <span
                key={firstWrapperType.type}
                className={cn(
                  'rounded py-[1px] px-1',
                  'truncate',
                  firstWrapperType.compiler && 'bg-purple-800 text-neutral-400',
                  !firstWrapperType.compiler &&
                    'bg-neutral-700 text-neutral-300',
                  firstWrapperType.type === 'memo' && 'bg-[#5f3f9a] text-white',
                )}
              >
                {firstWrapperType.type}
              </span>
              {firstWrapperType.compiler && (
                <span className="text-yellow-300">✨</span>
              )}
            </>
          )}
        </span>
        {wrapperTypes.length > 1 && (
          <span className="text-[10px] text-neutral-400">
            ×{wrapperTypes.length - 1}
          </span>
        )}
      </span>
    );
  }, [currentFiber]);

  return (
    <div className={headerInspectClassName}>
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
