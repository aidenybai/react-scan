import { computed, useComputed } from '@preact/signals';
import { isInstrumentationActive } from 'bippy';
import { memo } from 'preact/compat';
import { useCallback } from 'preact/hooks';
import { Icon } from '~web/components/icon';
import { Slider } from '~web/components/slider';
import type { useMergedRefs } from '~web/hooks/use-merged-refs';
import { timelineActions, timelineState } from '../states';
import { calculateSliderValues } from '../utils';

interface TimelineProps {
  refSticky?:
    | ReturnType<typeof useMergedRefs<HTMLElement>>
    | ((node: HTMLElement | null) => void);
}

const buttonTitle = computed(() =>
  timelineState.value.isVisible
    ? 'Hide Re-renders History'
    : 'View Re-renders History',
);

export const Timeline = memo(({ refSticky }: TimelineProps) => {
  const sliderValues = useComputed(() => {
    return calculateSliderValues(
      timelineState.value.totalUpdates,
      timelineState.value.currentIndex,
    );
  });

  const handleSliderChange = async (e: Event) => {
    const { updates } = timelineState.value;
    const target = e.target as HTMLInputElement;
    const value = Number.parseInt(target.value, 10);

    const newIndex = Math.min(updates.length - 1, Math.max(0, value));

    let isViewingHistory = false;
    if (newIndex > 0 && newIndex < updates.length - 1) {
      isViewingHistory = true;
    }
    timelineActions.updateFrame(newIndex, isViewingHistory);
  };

  const handleShowTimeline = () => {
    if (!timelineState.value.isVisible) {
      timelineActions.showTimeline();
    }
  };

  const handleHideTimeline = useCallback((e: Event) => {
    if (timelineState.value.isVisible) {
      e.preventDefault();
      e.stopPropagation();
      timelineActions.hideTimeline();
    }
  }, []);

  return useComputed(() => {
    if (!isInstrumentationActive()) {
      return null;
    }

    if (timelineState.value.totalUpdates <= 1) {
      return null;
    }

    return (
      <button
        ref={refSticky}
        type="button"
        onClick={handleShowTimeline}
        className="react-section-header"
        data-disable-scroll="true"
      >
        <button
          type="button"
          onClick={handleHideTimeline}
          title={buttonTitle}
          className="w-4 h-4 flex items-center justify-center"
        >
          <Icon name="icon-gallery-horizontal-end" size={12} />
        </button>
        {timelineState.value.isVisible ? (
          <>
            <div className="text-xs text-gray-500">
              {sliderValues.value.leftValue}
            </div>
            <Slider
              min={sliderValues.value.min}
              max={sliderValues.value.max}
              value={sliderValues.value.value}
              onChange={handleSliderChange}
              className="flex-1"
              totalUpdates={sliderValues.value.rightValue + 1}
            />
            <div className="text-xs text-gray-500">
              {sliderValues.value.rightValue}
            </div>
          </>
        ) : (
          'View Re-renders History'
        )}
      </button>
    );
  });
});
