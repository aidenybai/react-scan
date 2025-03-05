import { useRef, useState } from 'preact/hooks';
import { getBatchedRectMap } from 'src/new-outlines';
import { getIsProduction } from '~core/index';
import { iife } from '~core/notifications/performance-utils';
import { cn } from '~web/utils/helpers';
import {
  type NotificationEvent,
  getTotalTime,
  isRenderMemoizable,
  useNotificationsContext,
} from './data';
import {
  HighlightStore,
  drawHighlights,
} from '~core/notifications/outline-overlay';

// todo: cleanup, convoluted ternaries
export const fadeOutHighlights = () => {
  const curr = HighlightStore.value.current
    ? HighlightStore.value.current
    : HighlightStore.value.kind === 'transition'
      ? HighlightStore.value.transitionTo
      : null;
  if (!curr) {
    return;
  }

  if (HighlightStore.value.kind === 'transition') {
    HighlightStore.value = {
      kind: 'move-out',
      // because we want to dynamically fade this value
      current:
        HighlightStore.value.current?.alpha === 0
          ? // we want to only start fading from transition if current is done animating out
            HighlightStore.value.transitionTo
          : // if current doesn't exist then transition must exist
            (HighlightStore.value.current ?? HighlightStore.value.transitionTo),
    };
    return;
  }

  HighlightStore.value = {
    kind: 'move-out',
    current: {
      alpha: 0,
      ...curr,
    },
  };
};

export const RenderBarChart = ({
  selectedEvent,
}: { selectedEvent: NotificationEvent }) => {
  const { setNotificationState, setRoute } = useNotificationsContext();
  const totalInteractionTime = getTotalTime(selectedEvent.timing);
  const nonRender = totalInteractionTime - selectedEvent.timing.renderTime;
  const [isProduction] = useState(getIsProduction());
  const events = selectedEvent.groupedFiberRenders;
  const bars: Array<
    | { kind: 'other-frame-drop'; totalTime: number }
    | { kind: 'other-not-javascript'; totalTime: number }
    | { kind: 'other-javascript'; totalTime: number }
    | { kind: 'render'; event: (typeof events)[number]; totalTime: number }
  > = events.map((event) => ({
    event,
    kind: 'render',
    totalTime: isProduction ? event.count : event.totalTime,
  }));

  const isShowingExtraInfo = iife(() => {
    switch (selectedEvent.kind) {
      case 'dropped-frames': {
        return selectedEvent.timing.renderTime / totalInteractionTime < 0.1;
      }
      case 'interaction': {
        return (
          (selectedEvent.timing.otherJSTime + selectedEvent.timing.renderTime) /
            totalInteractionTime <
          0.2
        );
      }
    }
  });
  /**
   * We don't add the extra bars in production because we can't compare them to the renders, so the bar is useless, user can use overview tab to see times
   */
  if (selectedEvent.kind === 'interaction' && !isProduction) {
    bars.push({
      kind: 'other-javascript',
      totalTime: selectedEvent.timing.otherJSTime,
    });
  }

  if (isShowingExtraInfo && !isProduction) {
    if (selectedEvent.kind === 'interaction') {
      bars.push({
        kind: 'other-not-javascript',
        totalTime:
          getTotalTime(selectedEvent.timing) -
          selectedEvent.timing.renderTime -
          selectedEvent.timing.otherJSTime,
      });
    } else {
      bars.push({
        kind: 'other-frame-drop',
        totalTime: nonRender,
      });
    }
  }

  const debouncedMouseEnter = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    lastCallAt: number | null;
  }>({
    lastCallAt: null,
    timer: null,
  });

  const totalBarTime = bars.reduce((prev, curr) => prev + curr.totalTime, 0);

  return (
    <div
      onMouseLeave={fadeOutHighlights}
      className="flex flex-col h-full w-full gap-y-1"
    >
      {iife(() => {
        if (isProduction && bars.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <p className="text-sm w-full text-left text-white mb-1.5">
                No data available
              </p>
              <p className="text-x w-full text-lefts">
                No data was collected during this period
              </p>
            </div>
          );
        }
        if (bars.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <p className="text-sm w-full text-left text-white mb-1.5">
                No renders collected
              </p>
              <p className="text-x w-full text-lefts">
                There were no renders during this period
              </p>
            </div>
          );
        }
      })}

      {bars
        .toSorted((a, b) => b.totalTime - a.totalTime)
        .map((bar, index) => (
          <button
            type="button"
            onMouseLeave={() => {
              debouncedMouseEnter.current.timer &&
                clearTimeout(debouncedMouseEnter.current.timer);
            }}
            onMouseEnter={async () => {
              const highlightBars = async () => {
                debouncedMouseEnter.current.lastCallAt = Date.now();
                if (bar.kind !== 'render') {
                  // todo: generalize this, its duplicated in onMouseLeave of bar chart
                  const curr = HighlightStore.value.current
                    ? HighlightStore.value.current
                    : HighlightStore.value.kind === 'transition'
                      ? HighlightStore.value.transitionTo
                      : null;

                  if (!curr) {
                    HighlightStore.value = {
                      kind: 'idle',
                      current: null,
                    };
                    return;
                  }
                  HighlightStore.value = {
                    kind: 'move-out',
                    current: {
                      alpha: 0,
                      ...curr,
                    },
                  };
                  return;
                }
                const state = HighlightStore.value;
                const currentState = iife(() => {
                  switch (state.kind) {
                    case 'transition': {
                      // because we want to dynamically fade this one out starting from its alpha
                      return state.transitionTo; // but this breaks cause then we aren't passing current around current which should stay ;
                    }
                    case 'idle':
                    case 'move-out': {
                      return state.current;
                    }
                  }
                });
                const stateRects: Array<DOMRect> = [];

                if (state.kind === 'transition') {
                  const transitionState = getTransitionState(state);
                  iife(() => {
                    switch (transitionState) {
                      case 'fading-in': {
                        HighlightStore.value = {
                          kind: 'transition',
                          current: state.transitionTo,
                          transitionTo: {
                            rects: stateRects,
                            alpha: 0,
                            name: bar.event.name,
                          },
                        };
                        return;
                      }
                      case 'fading-out': {
                        HighlightStore.value = {
                          kind: 'transition',
                          current: HighlightStore.value.current
                            ? {
                                alpha: 0,
                                ...HighlightStore.value.current,
                              }
                            : null,
                          transitionTo: {
                            rects: stateRects,
                            alpha: 0,
                            name: bar.event.name,
                          },
                        };
                        return;
                      }
                    }
                  });
                } else {
                  HighlightStore.value = {
                    kind: 'transition',
                    transitionTo: {
                      rects: stateRects,
                      alpha: 0,
                      name: bar.event.name,
                    },
                    current: currentState
                      ? {
                          alpha: 0,
                          ...currentState,
                        }
                      : null,
                  };
                }

                // we need to filter this at source this is just a hack to keep moving
                const trueElements = bar.event.elements.filter(
                  (element) => element instanceof Element,
                );
                // todo only draw onscreen rects, but make it clear there are rects off the screen, this needs to be uber clear shouldn't just not draw it that's sub optimal

                for await (const entries of getBatchedRectMap(trueElements)) {
                  // we draw the boundingClientRect instead of intersectionRect for better viability, as a trade off against aesthetics
                  for (const { boundingClientRect } of entries) {
                    stateRects.push(boundingClientRect);
                  }
                  drawHighlights();
                }
              };

              // we need to debounce this incase the user quickly scrolls/moves their mouse
              // while getBatchedRectMap is async, the work still has to be done at some point, and it can get expensive
              // and add overhead
              if (
                debouncedMouseEnter.current.lastCallAt &&
                Date.now() - debouncedMouseEnter.current.lastCallAt < 200
              ) {
                debouncedMouseEnter.current.timer &&
                  clearTimeout(debouncedMouseEnter.current.timer);
                debouncedMouseEnter.current.timer = setTimeout(() => {
                  highlightBars();
                }, 200);
                return;
              }

              highlightBars();
            }}
            onClick={() => {
              switch (bar.kind) {
                case 'render': {
                  setNotificationState((prev) => ({
                    ...prev,
                    selectedFiber: bar.event,
                  }));

                  setRoute({
                    route: 'render-explanation',
                    routeMessage: null,
                  });
                  return;
                }
                case 'other-not-javascript':
                case 'other-javascript':
                case 'other-frame-drop': {
                  setRoute({
                    route: 'other-visualization',
                    routeMessage: {
                      kind: 'auto-open-overview-accordion',
                      name: bar.kind,
                    },
                  });
                  return;
                }
              }
            }}
            // THIS IS ON PURPOSE, WE USE INDEX AS EQUALITY OF ANIMATION,
            // THIS WILL NOT REORDER AND DOESN'T HOLD INTERNAL STATE, IF IT DID, IT MAY CREATE A BUG
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}

            // @TODO: @pivanov clean up
            className="w-full flex items-center group hover:bg-[#0f0f0f] rounded-md relative transition-colors text-xs"
          >
            <div className="h-full w-[90%]">
              <div
                style={{
                  minWidth: 'fit-content',
                  width: `${(bar.totalTime / totalBarTime) * 100}%`,
                }}
                // @TODO: @pivanov clean up
                className={cn([
                  'group-hover:bg-[#5b2d89] flex items-center bg-[#412162] rounded-sm text-white text-xs relative h-[28px] transition-all',
                  bar.kind === 'other-frame-drop' &&
                    'bg-[#18181B] group-hover:bg-[#272727]',
                  bar.kind === 'other-javascript' &&
                    'bg-[#efd81a6b] group-hover:bg-[#efda1a2f]',
                  bar.kind === 'other-not-javascript' &&
                    'bg-[#214379d4] group-hover:bg-[#21437982]',
                ])}
              >
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-x-2">
                  <span className="flex items-center whitespace-nowrap">
                    {
                      iife(() => {
                        switch (bar.kind) {
                          case 'other-frame-drop': {
                            return 'JavaScript, DOM updates, Draw Frame';
                          }
                          case 'other-javascript': {
                            return 'JavaScript/React Hooks';
                          }
                          case 'other-not-javascript': {
                            return 'Update DOM and Draw New Frame';
                          }
                          case 'render': {
                            return bar.event.name;
                          }
                        }
                      })
                    }
                  </span>
                  {
                    // @TODO: @pivanov clean up
                    bar.kind === 'render' && isRenderMemoizable(bar.event) && (
                      <div className="px-1 py-0.5 bg-[#6a369e] flex items-center rounded-sm font-semibold text-[8px] w-fit leading-[10px]">
                        Memoizable
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            {/* @TODO: @pivanov clean up */}
            <div className="w-[5%] min-w-fit h-full flex items-center justify-end text-[10px] pr-1 gap-x-1">
              {bar.kind === 'render' && `x${bar.event.count}`}
            </div>

            {/* @TODO: @pivanov clean up */}
            {/* we don't have render times in production, so we just visualize the count (impl is hacky) */}
            {(bar.kind !== 'render' || !isProduction) && (
              <div className="w-[5%] min-w-fit text-[#7346a0] h-full flex items-center justify-end text-[10px] pr-1 gap-x-1">
                {bar.totalTime < 1 ? '<1' : bar.totalTime.toFixed(0)}ms
              </div>
            )}

            {/* @TODO: @pivanov clean up */}
            <div className="absolute right-0 top-1/2 transition-none  -translate-y-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity mr-16 pointer-events-none">
              Click to learn more
            </div>
          </button>
        ))}
    </div>
  );
};

const getTransitionState = (state: {
  current: { alpha: number } | null;
  transitionTo: { alpha: number };
}) => {
  if (!state.current) {
    return 'fading-in';
  }
  if (state.current.alpha > 0) {
    return 'fading-out' as const;
  }
  return 'fading-in' as const;
};
