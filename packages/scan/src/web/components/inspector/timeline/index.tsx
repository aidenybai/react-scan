import { isInstrumentationActive } from 'bippy';
import { memo } from 'preact/compat';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';
import { Icon } from '~web/components/icon';
import type { useMergedRefs } from '~web/hooks/use-merged-refs';
import { cn } from '~web/utils/helpers';
import { Slider } from '../../slider';
import {
  timelineActions,
  timelineState,
} from '../states';
import { calculateSliderValues } from '../utils';

export const Timeline = memo(
  ({
    refSticky,
  }: {
    refSticky?:
    | ReturnType<typeof useMergedRefs<HTMLElement>>
    | ((node: HTMLElement | null) => void);
  }) => {

    const refPlayInterval = useRef<number | null>(null);
    const refChangeInterval = useRef<number | null>(null);

    const { currentIndex, isVisible, totalUpdates, updates } =
      timelineState.value;

    const sliderValues = useMemo(() => {
      return calculateSliderValues(totalUpdates, currentIndex);
    }, [totalUpdates, currentIndex]);

    const handleSliderChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = Number.parseInt(target.value, 10);

      const newIndex = Math.min(updates.length - 1, Math.max(0, value));


      let isViewingHistory = false;
      if (newIndex > 0 && newIndex < updates.length - 1) {
        isViewingHistory = true;
      }
      timelineActions.updateFrame(newIndex, isViewingHistory);
    };

    useEffect(() => {
      return () => {
        if (refPlayInterval.current) {
          clearInterval(refPlayInterval.current);
        }
        if (refChangeInterval.current) {
          cancelAnimationFrame(refChangeInterval.current);
        }
      };
    }, []);

    const handleShowTimeline = useCallback(() => {
      if (!isVisible) {
        timelineActions.showTimeline();
      }
    }, [isVisible]);

    const handleHideTimeline = useCallback((e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (refPlayInterval.current) {
        clearInterval(refPlayInterval.current);
        refPlayInterval.current = null;
      }
      timelineActions.hideTimeline();
    }, []);

    // If instrumentation is not active, don't render anything
    if (!isInstrumentationActive()) {
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
          onClick={isVisible ? handleHideTimeline : undefined}
          title={isVisible ? 'Hide Re-renders History' : 'View Re-renders History'}
          className="w-4 h-4 flex items-center justify-center"
        >
          <Icon name="icon-gallery-horizontal-end" size={12} />
        </button>
        {
          isVisible
            ? (
              <>
                <div className="text-xs text-gray-500">
                  {sliderValues.leftValue}
                </div>
                <Slider
                  min={sliderValues.min}
                  max={sliderValues.max}
                  value={sliderValues.value}
                  onChange={handleSliderChange}
                  className="flex-1"
                  totalUpdates={sliderValues.rightValue + 1}
                />
                <div className="text-xs text-gray-500">
                  {sliderValues.rightValue}
                </div>
                <button
                  type="button"
                  className={cn(
                    'button',
                    'p-1',
                    'rounded',
                    'text-white/80',
                    'hover:text-white',
                  )}
                  onClick={handleHideTimeline}
                  title="Hide Re-renders History"
                >
                  <div
                    className={cn(
                      'w-2 h-2',
                      'rounded-full',
                      'border-0 bg-red-500',
                      'animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]'
                    )}
                  />
                </button>
              </>
            )
            : (
              <>
                View Re-renders History
              </>
            )
        }
      </button>
    );
  },
);
