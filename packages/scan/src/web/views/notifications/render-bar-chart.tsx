import { useRef, useState } from 'preact/hooks';
import { getBatchedRectMap } from 'src/new-outlines';
import { getIsProduction } from '~core/index';
import { iife } from '~core/notifications/performance-utils';
import { cn } from '~web/utils/helpers';
import {
  GroupedFiberRender,
  NotificationEvent,
  getTotalTime,
  isRenderMemoizable,
  useNotificationsContext,
} from './data';
import {
  HighlightStore,
  drawHighlights,
} from '~core/notifications/outline-overlay';
import { ChevronRight } from './icons';

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

type Bars = Array<
  | { kind: 'other-frame-drop'; totalTime: number }
  | { kind: 'other-not-javascript'; totalTime: number }
  | { kind: 'other-javascript'; totalTime: number }
  | { kind: 'render'; event: GroupedFiberRender; totalTime: number }
>;

export const NO_PURGE = ['hover:bg-[#0f0f0f]'];

export const RenderBarChart = ({
  selectedEvent,
}: { selectedEvent: NotificationEvent }) => {
  const totalInteractionTime = getTotalTime(selectedEvent.timing);
  const nonRender = totalInteractionTime - selectedEvent.timing.renderTime;
  const [isProduction] = useState(getIsProduction());
  const events = selectedEvent.groupedFiberRenders;
  const bars: Bars = events.map((event) => ({
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
    <div className={cn(['flex flex-col h-full w-full gap-y-1'])}>
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
        .map((bar) => (
          <RenderBar
            key={bar.kind === 'render' ? bar.event.id : bar.kind}
            bars={bars}
            bar={bar}
            debouncedMouseEnter={debouncedMouseEnter}
            totalBarTime={totalBarTime}
            isProduction={isProduction}
          />
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

const RenderBar = ({
  bar,
  debouncedMouseEnter,
  totalBarTime,
  isProduction,
  bars,
  depth = 0,
}: {
  depth?: number;
  bars: Bars;
  bar: Bars[number];
  debouncedMouseEnter: {
    current: {
      timer: ReturnType<typeof setTimeout> | null;
      lastCallAt: number | null;
    };
  };
  totalBarTime: number;
  isProduction: boolean | null;
}) => {
  const { setNotificationState, setRoute } = useNotificationsContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLeaf = bar.kind === 'render' ? bar.event.parents.size === 0 : true;

  const parentBars = bars.filter((otherBar) =>
    otherBar.kind === 'render' && bar.kind === 'render'
      ? bar.event.parents.has(otherBar.event.name) &&
        otherBar.event.name !== bar.event.name
      : false,
  );

  const missingParentNames =
    bar.kind === 'render'
      ? Array.from(bar.event.parents).filter(
          (parentName) =>
            !bars.some(
              (b) => b.kind === 'render' && b.event.name === parentName,
            ),
        )
      : [];

  const handleBarClick = () => {
    if (bar.kind === 'render') {
      setNotificationState((prev) => ({
        ...prev,
        selectedFiber: bar.event,
      }));

      setRoute({
        route: 'render-explanation',
        routeMessage: null,
      });
    } else {
      setRoute({
        route: 'other-visualization',
        routeMessage: {
          kind: 'auto-open-overview-accordion',
          name: bar.kind,
        },
      });
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(['w-full flex items-center relative text-xs min-w-0'])}
      >
        <button
          onMouseLeave={() => {
            debouncedMouseEnter.current.timer &&
              clearTimeout(debouncedMouseEnter.current.timer);
            fadeOutHighlights();
          }}
          onMouseEnter={async () => {
            const highlightBars = async () => {
              debouncedMouseEnter.current.lastCallAt = Date.now();
              if (bar.kind !== 'render') {
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
                    return state.transitionTo;
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

              const trueElements = bar.event.elements.filter(
                (element) => element instanceof Element,
              );

              for await (const entries of getBatchedRectMap(trueElements)) {
                entries.forEach(({ boundingClientRect }) => {
                  stateRects.push(boundingClientRect);
                });
                drawHighlights();
              }
            };

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
          onClick={handleBarClick}
          className={cn([
            'h-full w-[90%] flex items-center hover:bg-[#0f0f0f] rounded-l-md min-w-0 relative',
          ])}
        >
          <div
            style={{
              minWidth: 'fit-content',
              width: `${(bar.totalTime / totalBarTime) * 100}%`,
            }}
            className={cn([
              'flex items-center rounded-sm text-white text-xs h-[28px] shrink-0',
              bar.kind === 'render' && 'bg-[#412162] group-hover:bg-[#5b2d89]',
              bar.kind === 'other-frame-drop' &&
                'bg-[#44444a] group-hover:bg-[#6a6a6a]',
              bar.kind === 'other-javascript' &&
                'bg-[#efd81a6b] group-hover:bg-[#efda1a2f]',
              bar.kind === 'other-not-javascript' &&
                'bg-[#214379d4] group-hover:bg-[#21437982]',
            ])}
          />
          <div
            className={cn([
              'absolute inset-0 flex items-center px-2',
              'min-w-0',
            ])}
          >
            <div className="flex items-center gap-x-2 min-w-0 w-full">
              <span className={cn(['truncate'])}>
                {iife(() => {
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
                })}
              </span>
              {bar.kind === 'render' && isRenderMemoizable(bar.event) && (
                <div
                  style={{
                    lineHeight: '10px',
                  }}
                  className={cn([
                    'px-1 py-0.5 bg-[#6a369e] flex items-center rounded-sm font-semibold text-[8px] shrink-0',
                  ])}
                >
                  Memoizable
                </div>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={() =>
            bar.kind === 'render' && !isLeaf && setIsExpanded(!isExpanded)
          }
          className={cn([
            'flex items-center min-w-fit shrink-0 rounded-r-md h-[28px]',
            !isLeaf && 'hover:bg-[#0f0f0f]',
            bar.kind === 'render' && !isLeaf
              ? 'cursor-pointer'
              : 'cursor-default',
          ])}
        >
          <div className="w-[20px] flex items-center justify-center">
            {bar.kind === 'render' && !isLeaf && (
              <ChevronRight
                className={cn(
                  'transition-transform',
                  isExpanded && 'rotate-90',
                )}
                size={16}
              />
            )}
          </div>

          <div
            style={{
              minWidth: isLeaf ? 'fit-content' : isProduction ? '30px' : '60px',
            }}
            className="flex items-center justify-end gap-x-1"
          >
            {bar.kind === 'render' && (
              <span className={cn(['text-[10px]'])}>x{bar.event.count}</span>
            )}

            {(bar.kind !== 'render' || !isProduction) && (
              <span className="text-[10px] text-[#7346a0] pr-1">
                {bar.totalTime < 1 ? '<1' : bar.totalTime.toFixed(0)}
                ms
              </span>
            )}
          </div>
        </button>

        {depth === 0 && (
          <div
            className={cn([
              'absolute right-0 top-1/2 transition-none -translate-y-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity mr-16',
              'pointer-events-none',
            ])}
          >
            Click to learn more
          </div>
        )}
      </div>

      {isExpanded &&
        (parentBars.length > 0 || missingParentNames.length > 0) && (
          <div className="pl-3 flex flex-col gap-y-1 mt-1">
            {parentBars
              .toSorted((a, b) => b.totalTime - a.totalTime)
              .map((parentBar, i) => (
                <RenderBar
                  depth={depth + 1}
                  key={i}
                  bar={parentBar}
                  debouncedMouseEnter={debouncedMouseEnter}
                  totalBarTime={totalBarTime}
                  isProduction={isProduction}
                  bars={bars}
                />
              ))}
            {missingParentNames.map((parentName) => (
              <div key={parentName} className="w-full">
                <div className="w-full flex items-center relative text-xs">
                  <div className="h-full w-full flex items-center relative">
                    <div className="flex items-center rounded-sm text-white text-xs h-[28px] w-full" />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="truncate whitespace-nowrap text-white/70 w-full">
                        {parentName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};
