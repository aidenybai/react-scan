// TODO: @pivanov - improve UI and finish the implementation
import type { Fiber } from 'bippy';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Icon } from '~web/components/icon';
import { cn } from '~web/utils/helpers';
import { Slider } from '../slider';
import {
  type TimelineState,
  type TimelineUpdate,
  inspectorState,
  timelineState,
} from './states';
import { replayComponent } from './utils';

export const Timeline = () => {
  const refLastFiber = useRef<Fiber | null>(null);
  const refPlayInterval = useRef<number | null>(null);
  const refStartIndex = useRef<number>(0);
  const refRecordedCount = useRef<number>(0);

  const { updates, currentIndex, isReplaying, playbackSpeed } =
    timelineState.value;

  useEffect(() => {
    if (refLastFiber.current) {
      refRecordedCount.current = updates.length - refStartIndex.current;
    }
  }, [updates]);

  const handleRecord = useCallback(() => {
    if (!inspectorState.value.fiber) return;
    refLastFiber.current = inspectorState.value.fiber;
    refStartIndex.current = timelineState.value.updates.length;
    timelineState.value = {
      ...timelineState.value,
      currentIndex: 0,
    };
  }, []);

  const handleStop = useCallback(() => {
    if (refPlayInterval.current) {
      clearInterval(refPlayInterval.current);
      refPlayInterval.current = null;
    }
    refLastFiber.current = null;
    timelineState.value = {
      ...timelineState.value,
      currentIndex: 0,
      isReplaying: false,
    };
  }, []);

  const handleNext = useCallback(async () => {
    const { updates, currentIndex } = timelineState.value;

    if (currentIndex >= refRecordedCount.current - 1) {
      if (timelineState.value.isReplaying && refPlayInterval.current) {
        clearInterval(refPlayInterval.current);
        refPlayInterval.current = null;
        timelineState.value = {
          ...timelineState.value,
          isReplaying: false,
        };
      }
      return;
    }

    const newIndex = currentIndex + 1;
    const update = updates[refStartIndex.current + newIndex] as TimelineUpdate;

    try {
      await replayComponent(update.fiber);
      await new Promise(resolve => setTimeout(resolve, 100));
      timelineState.value = {
        ...timelineState.value,
        currentIndex: newIndex,
        isReplaying: true,
      };
    } catch {
      if (refPlayInterval.current) {
        clearInterval(refPlayInterval.current);
        refPlayInterval.current = null;
      }
      timelineState.value = {
        ...timelineState.value,
        isReplaying: false,
      };
    }
  }, []);

  const handleSliderChange = useCallback(async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newIndex = Number.parseInt(target.value, 10);
    const { updates } = timelineState.value;

    if (newIndex >= 0 && newIndex < refRecordedCount.current) {
      timelineState.value = {
        ...timelineState.value,
        currentIndex: newIndex,
        isReplaying: true,
      };
      await replayComponent(updates[refStartIndex.current + newIndex].fiber);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, []);

  const handlePlayPause = useCallback(async () => {
    const { isReplaying, playbackSpeed, updates } = timelineState.value;

    if (isReplaying) {
      if (refPlayInterval.current) {
        clearInterval(refPlayInterval.current);
        refPlayInterval.current = null;
      }
      timelineState.value = {
        ...timelineState.value,
        isReplaying: false,
      };
    } else {
      if (refRecordedCount.current > 0) {
        try {
          timelineState.value.isReplaying = true;
          await replayComponent(updates[refStartIndex.current].fiber);
          timelineState.value = {
            ...timelineState.value,
            currentIndex: 0,
            isReplaying: true,
          };

          await new Promise(resolve => setTimeout(resolve, 300));
          refPlayInterval.current = window.setInterval(() => {
            handleNext();
          }, 750 / playbackSpeed);
        } catch {
          timelineState.value = {
            ...timelineState.value,
            isReplaying: false,
          };
        }
      }
    }
  }, [handleNext]);

  const handleSpeedChange = useCallback(() => {
    const { playbackSpeed } = timelineState.value;
    const newSpeed =
      playbackSpeed === 4
        ? 1
        : ((playbackSpeed * 2) as TimelineState['playbackSpeed']);

    if (refPlayInterval.current) {
      clearInterval(refPlayInterval.current);
      refPlayInterval.current = setInterval(() => {
        handleNext();
      }, 750 / newSpeed) as unknown as number;
    }

    timelineState.value = {
      ...timelineState.value,
      playbackSpeed: newSpeed,
    };
  }, [handleNext]);

  useEffect(() => {
    const { isReplaying } = timelineState.value;
    if (!isReplaying && refPlayInterval.current) {
      clearInterval(refPlayInterval.current);
      refPlayInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (refPlayInterval.current) {
        clearInterval(refPlayInterval.current);
        refPlayInterval.current = null;
      }
    };
  }, []);

  const isRecording = refLastFiber.current !== null || isReplaying;

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      className={cn(
        'sticky top-0',
        'flex items-center gap-2 px-3 h-7',
        'bg-[#0a0a0a] border-b-1 border-[#222]',
        'z-100',
      )}
    >
      <button
        type="button"
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onClick={isRecording ? handleStop : handleRecord}
        className={cn(
          'group',
          'button',
          'p-1',
          'rounded',
          'disabled:opacity-50'
        )}
      >
        <div
          style={{ '--pulse-duration': `${750 / playbackSpeed}ms` } as { [key: string]: string }}
          className={cn(
            'w-2.5 h-2.5',
            'rounded-full',
            'border-2 border-gray-500',
            'transition-colors duration-300',
            {
              'bg-red-500 border-red-500 animate-[pulse_var(--pulse-duration)_cubic-bezier(0.4,0,0.6,1)_infinite]': isRecording,
              'group-hover:border-red-500': !isRecording,
            }
          )}
        />
      </button>

      {
        isRecording && (
          <>
            <button
              type="button"
              className={cn(
                'button',
                'p-1',
                'rounded',
                'text-white/80',
                'hover:text-white',
                'disabled:opacity-50',
                {
                  'opacity-50 pointer-events-none': refRecordedCount.current === 0,
                }
              )}
              onClick={handlePlayPause}
              title={isReplaying ? 'Pause' : 'Play'}
            >
              <Icon
                name={isReplaying ? 'icon-pause' : 'icon-play'}
                size={12}
              />
            </button>
            <Slider
              value={currentIndex}
              min={0}
              max={refRecordedCount.current - 1}
              onChange={handleSliderChange}
              className="flex-1"
              showThumb={refRecordedCount.current > 0}
            />
            <div className="text-xs text-gray-500 min-w-[40px] text-right">
              {refRecordedCount.current > 0
                ? `${currentIndex + 1}/${refRecordedCount.current}`
                : '0/0'}
            </div>
            <button
              type="button"
              className="p-1 hover:bg-gray-200 rounded text-xs"
              onClick={handleSpeedChange}
              title="Playback Speed"
            >
              {playbackSpeed}x
            </button>
          </>
        )
      }
    </div>
  );
};
