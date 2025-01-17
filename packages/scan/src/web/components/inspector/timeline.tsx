// TODO: @pivanov - improve UI and finish the implementation
import type { Fiber } from 'bippy';
import { useCallback, useRef } from 'preact/hooks';
import { Icon } from '~web/components/icon';
import { collectInspectorData, getStateNames } from './overlay/utils';
import { type TimelineUpdate, inspectorState, timelineState } from './states';
import { replayComponent } from './utils';

export const Timeline = () => {
  const refLastFiber = useRef<Fiber | null>(null);

  const handleRecord = useCallback(() => {
    if (!inspectorState.value.fiber) return;

    const fiber = inspectorState.value.fiber;
    const inspectorData = collectInspectorData(fiber);

    const initialUpdate: TimelineUpdate = {
      fiber,
      timestamp: Date.now(),
      props: inspectorData.fiberProps,
      state: inspectorData.fiberState,
      context: inspectorData.fiberContext,
      stateNames: getStateNames(fiber),
    };

    timelineState.value = {
      updates: [initialUpdate],
      currentIndex: 0,
      isReplaying: false,
      totalUpdates: 0,
    };
    refLastFiber.current = fiber;
  }, []);

  const handleStop = useCallback(() => {
    refLastFiber.current = null;
    timelineState.value = {
      updates: [],
      currentIndex: -1,
      isReplaying: false,
      totalUpdates: 0,
    };
  }, []);

  const handlePrevious = useCallback(async () => {
    const { updates, currentIndex } = timelineState.value;
    if (currentIndex <= 0) return;

    const newIndex = currentIndex - 1;
    const update = updates[newIndex];

    timelineState.value = {
      ...timelineState.value,
      currentIndex: newIndex,
      isReplaying: true,
    };

    await replayComponent(update.fiber);
  }, []);

  const handleNext = useCallback(async () => {
    const { updates, currentIndex } = timelineState.value;
    if (currentIndex >= updates.length - 1) return;

    const newIndex = currentIndex + 1;
    const update = updates[newIndex];

    timelineState.value = {
      ...timelineState.value,
      currentIndex: newIndex,
      isReplaying: true,
    };

    await replayComponent(update.fiber);
  }, []);

  const { updates, currentIndex, totalUpdates } = timelineState.value;
  const isRecording = refLastFiber.current !== null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 h-8">
      {isRecording ? (
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded"
          onClick={handleStop}
          title="Stop Recording"
        >
          <div className="w-3 h-3 bg-red-500 rounded" />
        </button>
      ) : (
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded"
          onClick={handleRecord}
          title="Start Recording"
        >
          <div className="w-3 h-3 border-2 border-gray-500 rounded-full" />
        </button>
      )}

      {isRecording && (
        <>
          <button
            type="button"
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 hover:!text-white"
            onClick={handlePrevious}
            disabled={currentIndex <= 0}
            title="Previous Update"
          >
            <Icon
              name="icon-chevron-right"
              className="rotate-180 group-hover:!text-white"
            />
          </button>
          <div className="text-xs text-gray-500">
            {updates.length > 0
              ? `${currentIndex}/${totalUpdates}`
              : '0/0'}
          </div>
          <button
            type="button"
            className="group p-1 hover:bg-gray-200 rounded disabled:opacity-50"
            onClick={handleNext}
            disabled={currentIndex >= updates.length - 1}
            title="Next Update"
          >
            <Icon
              name="icon-chevron-right"
              className="group-hover:!text-white"
            />
          </button>
        </>
      )}
    </div>
  );
};
