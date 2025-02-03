import { useSyncExternalStore } from 'preact/compat';
import { useMemo, useState } from 'preact/hooks';
import { FiberRenders } from '~core/monitor/performance';
import {
  debugEventStore,
  toolbarEventStore,
  useToolbarEventLog,
} from '~core/precise-activation';

export const DebugRunTime = () => {
  const {
    state: { events: debugEvents },
  } = useSyncExternalStore(debugEventStore.subscribe, debugEventStore.getState);
  const { state } = useToolbarEventLog();
  const [filters, setFilters] = useState({
    showLongRender: true,
    showLongInteraction: true,
    minLatency: 0,
    searchQuery: '',
    timeRange: {
      start: 0,
      end: Infinity,
    },
  });

  const getRenderTime = (fiberRenders: FiberRenders) => {
    return Object.values(fiberRenders).reduce(
      (prev, curr) => prev + curr.selfTime,
      0,
    );
  };

  const filteredEvents = useMemo(() => {
    return state.events.filter((event) => {
      const isLongRender = event.kind === 'long-render';
      if (!filters.showLongRender && isLongRender) return false;
      if (!filters.showLongInteraction && !isLongRender) return false;
      if (event.data.meta.latency < filters.minLatency) return false;
      if (
        event.data.startAt < filters.timeRange.start ||
        event.data.endAt > filters.timeRange.end
      )
        return false;

      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const fiberRenders = isLongRender
          ? event.data.meta.fiberRenders
          : event.data.meta.detailedTiming.fiberRenders;
        const fiberKeys = Object.keys(fiberRenders).join(' ').toLowerCase();
        if (!fiberKeys.includes(searchLower)) return false;
      }

      return true;
    });
  }, [state.events, filters]);

  return (
    <div className="p-2 space-y-2 flex gap-4">
      <div className="flex-1">
        <div className="flex flex-wrap gap-2 text-xs mb-2">
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.showLongRender}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    showLongRender: e.currentTarget.checked,
                  }))
                }
              />
              Long Render
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.showLongInteraction}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    showLongInteraction: e.currentTarget.checked,
                  }))
                }
              />
              Long Interaction
            </label>
            <label className="flex items-center gap-1">
              Min Latency (ms):
              <input
                type="number"
                className="w-16 bg-gray-800 px-1 rounded"
                value={filters.minLatency}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minLatency: Number(e.currentTarget.value),
                  }))
                }
              />
            </label>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search fibers..."
              className="bg-gray-800 px-2 py-0.5 rounded w-32"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  searchQuery: e.currentTarget.value,
                }))
              }
            />
            <button
              onClick={() => toolbarEventStore.getState().actions.clear()}
              className="px-2 py-0.5 bg-red-900/50 hover:bg-red-900/70 rounded border border-red-800/50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {filteredEvents.toReversed().map((event, index, reversedArray) => {
            const isLongRender = event.kind === 'long-render';
            const latency = event.data.meta.latency;
            const fiberRenders = isLongRender
              ? event.data.meta.fiberRenders
              : event.data.meta.detailedTiming.fiberRenders;
            const fiberCount = Object.keys(fiberRenders).length;
            const totalRenderTime = getRenderTime(fiberRenders).toFixed(1);
            const prevEvent = reversedArray[index + 1];

            return (
              <div
                key={index}
                className={`text-xs p-1.5 rounded-md ${
                  isLongRender
                    ? 'bg-red-950/40 border-red-800/50'
                    : 'bg-yellow-950/40 border-yellow-800/50'
                } border`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`${isLongRender ? 'text-red-400' : 'text-yellow-400'}`}
                    >
                      {isLongRender ? '🔴' : '⚠️'}
                    </span>
                    <span className="font-mono">{latency.toFixed(1)}ms</span>
                    <span className="text-gray-400">({fiberCount} fibers)</span>
                    <span className="text-gray-400">
                      {totalRenderTime}ms render
                    </span>
                    <span className="text-gray-400">
                      {(event.data.endAt - event.data.startAt).toFixed(1)}ms
                      total
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="font-mono">{event.data.startAt}</span>
                    <span>→</span>
                    <span className="font-mono">{event.data.endAt}</span>
                    {prevEvent && (
                      <span className="text-blue-500 ml-1">
                        +
                        {(prevEvent.data.startAt - event.data.endAt).toFixed(1)}
                        ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium">Debug Events</div>
          <button
            onClick={() => debugEventStore.getState().actions.clear()}
            className="text-xs px-2 py-0.5 bg-red-900/50 hover:bg-red-900/70 rounded border border-red-800/50"
          >
            Clear
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {debugEvents.toReversed().map((event, index) => (
            <div
              key={index}
              className="text-xs p-1.5 rounded-md bg-gray-800/50 border border-gray-700/50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {event.kind === 'start-interaction' ? '▶️' : '⏹️'}
                  </span>
                  <span className="font-mono">{event.at.toFixed(1)}ms</span>
                  <span className="text-gray-400">{event.kind}</span>
                </div>
                {JSON.stringify(event.meta)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
