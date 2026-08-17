import { For, Show, createMemo, createSignal } from "solid-js";
import { getBatchedRectMap } from "../../../new-outlines";
import { getIsProduction } from "../../../core/index";
import { iife } from "../../../core/notifications/performance-utils";
import { cn } from "../../utils/helpers";
import {
  GroupedFiberRender,
  NotificationEvent,
  getTotalTime,
  isRenderMemoizable,
  useNotificationsContext,
} from "./data";
import {
  drawHighlights,
  getHighlightState,
  setHighlightState,
} from "../../../core/notifications/outline-overlay";
import { ChevronRight } from "./icons";

// todo: cleanup, convoluted ternaries
export const fadeOutHighlights = () => {
  const state = getHighlightState();
  const curr = state.current
    ? state.current
    : state.kind === "transition"
      ? state.transitionTo
      : null;
  if (!curr) {
    return;
  }

  if (state.kind === "transition") {
    setHighlightState({
      kind: "move-out",
      // because we want to dynamically fade this value
      current:
        state.current?.alpha === 0
          ? // we want to only start fading from transition if current is done animating out
            state.transitionTo
          : // if current doesn't exist then transition must exist
            (state.current ?? state.transitionTo),
    });
    return;
  }

  setHighlightState({
    kind: "move-out",
    current: {
      alpha: 0,
      ...curr,
    },
  });
};

type Bars = Array<
  | { kind: "other-frame-drop"; totalTime: number }
  | { kind: "other-not-javascript"; totalTime: number }
  | { kind: "other-javascript"; totalTime: number }
  | { kind: "render"; event: GroupedFiberRender; totalTime: number }
>;

export const RenderBarChart = (props: { selectedEvent: NotificationEvent }) => {
  const isProduction = getIsProduction();
  const bars = createMemo<Bars>(() => {
    const selectedEvent = props.selectedEvent;
    const totalInteractionTime = getTotalTime(selectedEvent.timing);
    const result: Bars = selectedEvent.groupedFiberRenders.map((event) => ({
      event,
      kind: "render",
      totalTime: isProduction ? event.count : event.totalTime,
    }));
    const isShowingExtraInfo =
      selectedEvent.kind === "dropped-frames"
        ? selectedEvent.timing.renderTime / totalInteractionTime < 0.1
        : (selectedEvent.timing.otherJSTime + selectedEvent.timing.renderTime) /
            totalInteractionTime <
          0.2;

    if (selectedEvent.kind === "interaction" && !isProduction) {
      result.push({
        kind: "other-javascript",
        totalTime: selectedEvent.timing.otherJSTime,
      });
    }
    if (isShowingExtraInfo && !isProduction) {
      if (selectedEvent.kind === "interaction") {
        result.push({
          kind: "other-not-javascript",
          totalTime:
            totalInteractionTime -
            selectedEvent.timing.renderTime -
            selectedEvent.timing.otherJSTime,
        });
      } else {
        result.push({
          kind: "other-frame-drop",
          totalTime: totalInteractionTime - selectedEvent.timing.renderTime,
        });
      }
    }
    return result;
  });

  const debouncedMouseEnter: {
    timer: ReturnType<typeof setTimeout> | null;
    lastCallAt: number | null;
  } = {
    lastCallAt: null,
    timer: null,
  };

  const totalBarTime = createMemo(() =>
    bars().reduce((totalTime, bar) => totalTime + bar.totalTime, 0),
  );

  return (
    <div class={cn(["flex flex-col h-full w-full gap-y-1"])}>
      {iife(() => {
        if (isProduction && bars().length === 0) {
          return (
            <div class="flex flex-col items-center justify-center h-full text-zinc-400">
              <p class="text-sm w-full text-left text-white mb-1.5">No data available</p>
              <p class="text-x w-full text-lefts">No data was collected during this period</p>
            </div>
          );
        }
        if (bars().length === 0) {
          return (
            <div class="flex flex-col items-center justify-center h-full text-zinc-400">
              <p class="text-sm w-full text-left text-white mb-1.5">No renders collected</p>
              <p class="text-x w-full text-lefts">There were no renders during this period</p>
            </div>
          );
        }
      })}

      <For
        each={bars().toSorted((firstBar, secondBar) => secondBar.totalTime - firstBar.totalTime)}
      >
        {(bar) => (
          <RenderBar
            bars={bars()}
            bar={bar}
            debouncedMouseEnter={debouncedMouseEnter}
            totalBarTime={totalBarTime()}
            isProduction={isProduction}
          />
        )}
      </For>
    </div>
  );
};

const getTransitionState = (state: {
  current: { alpha: number } | null;
  transitionTo: { alpha: number };
}) => {
  if (!state.current) {
    return "fading-in";
  }
  if (state.current.alpha > 0) {
    return "fading-out" as const;
  }
  return "fading-in" as const;
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
    timer: ReturnType<typeof setTimeout> | null;
    lastCallAt: number | null;
  };
  totalBarTime: number;
  isProduction: boolean | null;
}) => {
  const { setNotificationState, setRoute } = useNotificationsContext();
  const [isExpanded, setIsExpanded] = createSignal(false);

  const isLeaf = bar.kind === "render" ? bar.event.parents.size === 0 : true;

  const parentBars = bars.filter((otherBar) =>
    otherBar.kind === "render" && bar.kind === "render"
      ? bar.event.parents.has(otherBar.event.name) && otherBar.event.name !== bar.event.name
      : false,
  );

  const missingParentNames =
    bar.kind === "render"
      ? Array.from(bar.event.parents).filter(
          (parentName) => !bars.some((b) => b.kind === "render" && b.event.name === parentName),
        )
      : [];

  const handleBarClick = () => {
    if (bar.kind === "render") {
      setNotificationState("selectedFiber", bar.event);

      setRoute({
        route: "render-explanation",
        routeMessage: null,
      });
    } else {
      setRoute({
        route: "other-visualization",
        routeMessage: {
          kind: "auto-open-overview-accordion",
          name: bar.kind,
        },
      });
    }
  };

  return (
    <div class="w-full">
      <div class={cn(["w-full flex items-center relative text-xs min-w-0"])}>
        <button
          onMouseLeave={() => {
            if (debouncedMouseEnter.timer) {
              clearTimeout(debouncedMouseEnter.timer);
            }
            fadeOutHighlights();
          }}
          onMouseEnter={async () => {
            const highlightBars = async () => {
              debouncedMouseEnter.lastCallAt = Date.now();
              if (bar.kind !== "render") {
                const highlightState = getHighlightState();
                const curr = highlightState.current
                  ? highlightState.current
                  : highlightState.kind === "transition"
                    ? highlightState.transitionTo
                    : null;

                if (!curr) {
                  setHighlightState({
                    kind: "idle",
                    current: null,
                  });
                  return;
                }
                setHighlightState({
                  kind: "move-out",
                  current: {
                    alpha: 0,
                    ...curr,
                  },
                });
                return;
              }
              const state = getHighlightState();
              const currentState = iife(() => {
                switch (state.kind) {
                  case "transition": {
                    return state.transitionTo;
                  }
                  case "idle":
                  case "move-out": {
                    return state.current;
                  }
                }
              });
              const stateRects: Array<DOMRect> = [];

              if (state.kind === "transition") {
                const transitionState = getTransitionState(state);
                iife(() => {
                  switch (transitionState) {
                    case "fading-in": {
                      setHighlightState({
                        kind: "transition",
                        current: state.transitionTo,
                        transitionTo: {
                          rects: stateRects,
                          alpha: 0,
                          name: bar.event.name,
                        },
                      });
                      return;
                    }
                    case "fading-out": {
                      setHighlightState({
                        kind: "transition",
                        current: state.current
                          ? {
                              ...state.current,
                            }
                          : null,
                        transitionTo: {
                          rects: stateRects,
                          alpha: 0,
                          name: bar.event.name,
                        },
                      });
                      return;
                    }
                  }
                });
              } else {
                setHighlightState({
                  kind: "transition",
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
                });
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
              debouncedMouseEnter.lastCallAt &&
              Date.now() - debouncedMouseEnter.lastCallAt < 200
            ) {
              if (debouncedMouseEnter.timer) {
                clearTimeout(debouncedMouseEnter.timer);
              }
              debouncedMouseEnter.timer = setTimeout(() => {
                highlightBars();
              }, 200);
              return;
            }

            highlightBars();
          }}
          onClick={handleBarClick}
          class={cn([
            "h-full w-[90%] flex items-center hover:bg-[#0f0f0f] rounded-l-md min-w-0 relative",
          ])}
        >
          <div
            style={{
              "min-width": "fit-content",
              width: `${(bar.totalTime / totalBarTime) * 100}%`,
            }}
            class={cn([
              "flex items-center rounded-sm text-white text-xs h-[28px] shrink-0",
              bar.kind === "render" && "bg-[#412162] group-hover:bg-[#5b2d89]",
              bar.kind === "other-frame-drop" && "bg-[#44444a] group-hover:bg-[#6a6a6a]",
              bar.kind === "other-javascript" && "bg-[#efd81a6b] group-hover:bg-[#efda1a2f]",
              bar.kind === "other-not-javascript" && "bg-[#214379d4] group-hover:bg-[#21437982]",
            ])}
          />
          <div class={cn(["absolute inset-0 flex items-center px-2", "min-w-0"])}>
            <div class="flex items-center gap-x-2 min-w-0 w-full">
              <span class={cn(["truncate"])}>
                {iife(() => {
                  switch (bar.kind) {
                    case "other-frame-drop": {
                      return "JavaScript, DOM updates, Draw Frame";
                    }
                    case "other-javascript": {
                      return "JavaScript/React Hooks";
                    }
                    case "other-not-javascript": {
                      return "Update DOM and Draw New Frame";
                    }
                    case "render": {
                      return bar.event.name;
                    }
                  }
                })}
              </span>
              {bar.kind === "render" && isRenderMemoizable(bar.event) && (
                <div
                  style={{
                    "line-height": "10px",
                  }}
                  class={cn([
                    "px-1 py-0.5 bg-[#6a369e] flex items-center rounded-sm font-semibold text-[8px] shrink-0",
                  ])}
                >
                  Memoizable
                </div>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={() => bar.kind === "render" && !isLeaf && setIsExpanded(!isExpanded())}
          class={cn([
            "flex items-center min-w-fit shrink-0 rounded-r-md h-[28px]",
            !isLeaf && "hover:bg-[#0f0f0f]",
            bar.kind === "render" && !isLeaf ? "cursor-pointer" : "cursor-default",
          ])}
        >
          <div class="w-[20px] flex items-center justify-center">
            {bar.kind === "render" && !isLeaf && (
              <ChevronRight
                class={cn("transition-transform", isExpanded() && "rotate-90")}
                size={16}
              />
            )}
          </div>

          <div
            style={{
              "min-width": isLeaf ? "fit-content" : isProduction ? "30px" : "60px",
            }}
            class="flex items-center justify-end gap-x-1"
          >
            {bar.kind === "render" && <span class={cn(["text-[10px]"])}>x{bar.event.count}</span>}

            {(bar.kind !== "render" || !isProduction) && (
              <span class="text-[10px] text-[#7346a0] pr-1">
                {bar.totalTime < 1 ? "<1" : bar.totalTime.toFixed(0)}
                ms
              </span>
            )}
          </div>
        </button>

        {depth === 0 && (
          <div
            class={cn([
              "absolute right-0 top-1/2 transition-none -translate-y-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity mr-16",
              "pointer-events-none",
            ])}
          >
            Click to learn more
          </div>
        )}
      </div>

      <Show when={isExpanded() && (parentBars.length > 0 || missingParentNames.length > 0)}>
        <div class="pl-3 flex flex-col gap-y-1 mt-1">
          <For
            each={parentBars.toSorted(
              (firstBar, secondBar) => secondBar.totalTime - firstBar.totalTime,
            )}
          >
            {(parentBar) => (
              <RenderBar
                depth={depth + 1}
                bar={parentBar}
                debouncedMouseEnter={debouncedMouseEnter}
                totalBarTime={totalBarTime}
                isProduction={isProduction}
                bars={bars}
              />
            )}
          </For>
          <For each={missingParentNames}>
            {(parentName) => (
              <div class="w-full">
                <div class="w-full flex items-center relative text-xs">
                  <div class="h-full w-full flex items-center relative">
                    <div class="flex items-center rounded-sm text-white text-xs h-[28px] w-full" />
                    <div class="absolute inset-0 flex items-center px-2">
                      <span class="truncate whitespace-nowrap text-white/70 w-full">
                        {parentName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
