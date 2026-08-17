import { For, Show, createEffect, createMemo, createSignal, useContext } from "solid-js";
import { getIsProduction } from "../../../core/index";
import { iife } from "../../../core/notifications/performance-utils";
import { cn } from "../../utils/helpers";
import { InteractionEvent, NotificationEvent, getTotalTime, useNotificationsContext } from "./data";
import { ToolbarElementContext } from "../../widget";
type BaseTimeDataItem = {
  name: string;
  time: number;
  color: string;
  kind:
    | "other-not-javascript"
    | "other-javascript"
    | "render"
    | "other-frame-drop"
    | "total-processing-time";
};

type TimeData = Array<BaseTimeDataItem>;

const getTimeData = (selectedEvent: NotificationEvent, isProduction: boolean) => {
  switch (selectedEvent.kind) {
    // todo: push instead of conditional spread
    case "dropped-frames": {
      const timeData: TimeData = [
        ...(isProduction
          ? [
              {
                name: "Total Processing Time",
                time: getTotalTime(selectedEvent.timing),
                color: "bg-red-500",
                kind: "total-processing-time" as const,
              },
            ]
          : [
              {
                name: "Renders",
                time: selectedEvent.timing.renderTime,
                color: "bg-purple-500",
                kind: "render" as const,
              },
              {
                name: "JavaScript, DOM updates, Draw Frame",
                time: selectedEvent.timing.otherTime,
                color: "bg-[#4b4b4b]",
                kind: "other-frame-drop" as const,
              },
            ]),
      ];
      return timeData;
    }
    case "interaction": {
      const timeData: TimeData = [
        ...(!isProduction
          ? [
              {
                name: "Renders",
                time: selectedEvent.timing.renderTime,
                color: "bg-purple-500",
                kind: "render" as const,
              },
            ]
          : []),
        {
          name: isProduction ? "React Renders, Hooks, Other JavaScript" : "JavaScript/React Hooks ",
          time: selectedEvent.timing.otherJSTime,
          color: "bg-[#EFD81A]",

          kind: "other-javascript",
        },

        {
          name: "Update DOM and Draw New Frame",
          time:
            getTotalTime(selectedEvent.timing) -
            selectedEvent.timing.renderTime -
            selectedEvent.timing.otherJSTime,
          color: "bg-[#1D3A66]",
          kind: "other-not-javascript",
        },
      ];

      return timeData;
    }
  }
};

export const OtherVisualization = (props: { selectedEvent: NotificationEvent }) => {
  const isProduction = getIsProduction() ?? false;
  const { notificationState } = useNotificationsContext();
  const [expandedItems, setExpandedItems] = createSignal<string[]>(
    notificationState.routeMessage?.name ? [notificationState.routeMessage.name] : [],
  );
  const timeData = createMemo(() => getTimeData(props.selectedEvent, isProduction));
  const root = useContext(ToolbarElementContext);

  // for when a user clicks a bar of a non render, and gets sent to the other visualization and passes a route message on the way
  createEffect(() => {
    if (notificationState.route !== "other-visualization") return;
    if (notificationState.routeMessage?.name) {
      const container = root?.querySelector("#overview-scroll-container");
      const element = root?.querySelector(
        `#react-scan-overview-bar-${notificationState.routeMessage.name}`,
      );

      if (container instanceof HTMLElement && element instanceof HTMLElement) {
        const elementTop = element.getBoundingClientRect().top;
        const containerTop = container.getBoundingClientRect().top;
        const scrollOffset = elementTop - containerTop;
        container.scrollTop = container.scrollTop + scrollOffset;
      }
    }
  });

  createEffect(() => {
    if (notificationState.route === "other-visualization") {
      setExpandedItems((previousItems) =>
        notificationState.routeMessage?.name
          ? [notificationState.routeMessage.name]
          : previousItems,
      );
    }
  });

  const totalTime = createMemo(() => timeData().reduce((total, item) => total + item.time, 0));

  return (
    <div class="rounded-sm border border-zinc-800 text-xs">
      <div class="p-2 border-b border-zinc-800 bg-zinc-900/50">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-medium">What was time spent on?</h3>
          <span class="text-xs text-zinc-400">Total: {totalTime().toFixed(0)}ms</span>
        </div>
      </div>
      <div class="divide-y divide-zinc-800">
        <For each={timeData()}>
          {(entry) => {
            const isExpanded = () => expandedItems().includes(entry.kind);
            return (
              <div id={`react-scan-overview-bar-${entry.kind}`}>
                <button
                  onClick={() =>
                    setExpandedItems((previousItems) =>
                      previousItems.includes(entry.kind)
                        ? previousItems.filter((item) => item !== entry.kind)
                        : [...previousItems, entry.kind],
                    )
                  }
                  class="w-full px-3 py-2 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-0.5">
                        <svg
                          class={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded() ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <span class="font-medium flex items-center text-left">{entry.name}</span>
                      </div>
                      <span class=" text-zinc-400">{entry.time.toFixed(0)}ms</span>
                    </div>
                    <div class="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        class={`h-full ${entry.color} transition-all`}
                        style={{
                          width: `${(entry.time / totalTime()) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </button>
                <Show when={isExpanded()}>
                  <div class="bg-zinc-900/30 border-t border-zinc-800 px-2.5 py-3">
                    <p class=" text-zinc-400 mb-4 text-xs">
                      {iife(() => {
                        const selectedEvent = props.selectedEvent;
                        switch (selectedEvent.kind) {
                          case "interaction": {
                            switch (entry.kind) {
                              case "render": {
                                return <Explanation input={getRenderInput(selectedEvent)} />;
                              }

                              case "other-javascript": {
                                return <Explanation input={getJSInput(selectedEvent)} />;
                              }

                              case "other-not-javascript": {
                                return <Explanation input={getDrawInput(selectedEvent)} />;
                              }
                            }
                          }
                          case "dropped-frames": {
                            switch (entry.kind) {
                              case "total-processing-time": {
                                return (
                                  <Explanation
                                    input={{
                                      kind: "total-processing",
                                      data: {
                                        time: getTotalTime(selectedEvent.timing),
                                      },
                                    }}
                                  />
                                );
                              }
                              case "render": {
                                return (
                                  <>
                                    <Explanation
                                      input={{
                                        kind: "render",
                                        data: {
                                          topByTime: selectedEvent.groupedFiberRenders
                                            .toSorted((a, b) => b.totalTime - a.totalTime)
                                            .slice(0, 3)
                                            .map((render) => ({
                                              name: render.name,
                                              percentage:
                                                render.totalTime /
                                                getTotalTime(selectedEvent.timing),
                                            })),
                                        },
                                      }}
                                    />
                                  </>
                                );
                              }
                              case "other-frame-drop": {
                                return (
                                  <Explanation
                                    input={{
                                      kind: "other",
                                    }}
                                  />
                                );
                              }
                            }
                          }
                        }
                      })}
                    </p>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

type OverviewInput =
  | {
      kind: "js-explanation-base";
    }
  | {
      kind: "total-processing";
      data: {
        time: number;
      };
    }
  | {
      kind: "high-render-count-high-js";
      data: {
        renderCount: number;
        topByCount: Array<{ name: string; count: number }>;
      };
    }
  | {
      kind: "low-render-count-high-js";
      data: {
        renderCount: number;
      };
    }
  | {
      kind: "high-render-count-update-dom-draw-frame";
      data: {
        count: number;
        percentageOfTotal: number;
      };
    }
  | {
      kind: "update-dom-draw-frame";
    }
  | {
      kind: "render";
      data: { topByTime: Array<{ name: string; percentage: number }> };
    }
  | {
      kind: "other";
    };

const getDrawInput = (event: InteractionEvent): OverviewInput => {
  const renderCount = event.groupedFiberRenders.reduce((prev, curr) => prev + curr.count, 0);

  const renderTime = event.timing.renderTime;
  const totalTime = getTotalTime(event.timing);
  const renderPercentage = (renderTime / totalTime) * 100;

  if (renderCount > 100) {
    return {
      kind: "high-render-count-update-dom-draw-frame",
      data: {
        count: renderCount,
        percentageOfTotal: renderPercentage,
      },
    };
  }

  return {
    kind: "update-dom-draw-frame",
  };
};

const getRenderInput = (event: InteractionEvent): OverviewInput => {
  if (event.timing.renderTime / getTotalTime(event.timing) > 0.3) {
    return {
      kind: "render",
      data: {
        topByTime: event.groupedFiberRenders
          .toSorted((a, b) => b.totalTime - a.totalTime)
          .slice(0, 3)
          .map((e) => ({
            percentage: e.totalTime / getTotalTime(event.timing),
            name: e.name,
          })),
      },
    };
  }

  return {
    kind: "other",
  };
};

const getJSInput = (event: InteractionEvent): OverviewInput => {
  const renderCount = event.groupedFiberRenders.reduce((prev, curr) => prev + curr.count, 0);
  if (event.timing.otherJSTime / getTotalTime(event.timing) < 0.2) {
    return {
      kind: "js-explanation-base",
    };
  }
  if (
    event.groupedFiberRenders.find((render) => render.count > 200) ||
    event.groupedFiberRenders.reduce((prev, curr) => prev + curr.count, 0) > 500
  ) {
    // not sure a great heuristic for picking the render count
    return {
      kind: "high-render-count-high-js",
      data: {
        renderCount,
        topByCount: event.groupedFiberRenders
          .filter((groupedRender) => groupedRender.count > 100)
          .toSorted((a, b) => b.count - a.count)
          .slice(0, 3),
      },
    };
  }
  if (event.timing.otherJSTime / getTotalTime(event.timing) > 0.3) {
    if (event.timing.renderTime > 0.2) {
      return {
        kind: "js-explanation-base",
      };
    }

    return {
      kind: "low-render-count-high-js",
      data: {
        renderCount,
      },
    };
  }

  return {
    kind: "js-explanation-base",
  };
};

const Explanation = (props: { input: OverviewInput }) => {
  const content = createMemo(() => {
    const input = props.input;
    switch (input.kind) {
      case "total-processing": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              This is the time it took to draw the entire frame that was presented to the user. To
              be at 60FPS, this number needs to be {"<=16ms"}
            </p>

            <p>
              To debug the issue, check the "Ranked" tab to see if there are significant component
              renders
            </p>
            <p>
              On a production React build, React Scan can't access the time it took for component to
              render. To get that information, run React Scan on a development build
            </p>

            <p>
              To understand precisely what caused the slowdown while in production, use the{" "}
              <strong>Chrome profiler</strong> and analyze the function call times.
            </p>

            <p></p>
          </div>
        );
      }
      case "render": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              This is the time it took React to run components, and internal logic to handle the
              output of your component.
            </p>

            <div class={cn(["flex flex-col"])}>
              <p>The slowest components for this time period were:</p>
              <For each={input.data.topByTime}>
                {(item) => (
                  <div>
                    <strong>{item.name}</strong>: {(item.percentage * 100).toFixed(0)}% of total
                  </div>
                )}
              </For>
            </div>
            <p>
              To view the render times of all your components, and what caused them to render, go to
              the "Ranked" tab
            </p>
            <p>The "Ranked" tab shows the render times of every component.</p>
            <p>The render times of the same components are grouped together into one bar.</p>
            <p>
              Clicking the component will show you what props, state, or context caused the
              component to re-render.
            </p>
          </div>
        );
      }
      case "js-explanation-base": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              This is the period when JavaScript hooks and other JavaScript outside of React Renders
              run.
            </p>
            <p>
              The most common culprit for high JS time is expensive hooks, like expensive callbacks
              inside of <code>useEffect</code>'s or a large number of useEffect's called, but this
              can also be JavaScript event handlers (<code>'onclick'</code>, <code>'onchange'</code>
              ) that performed expensive computation.
            </p>
            <p>
              If you have lots of components rendering that call hooks, like useEffect, it can add
              significant overhead even if the callbacks are not expensive. If this is the case, you
              can try optimizing the renders of those components to avoid the hook from having to
              run.
            </p>
            <p>
              You should profile your app using the <strong>Chrome DevTools profiler</strong> to
              learn exactly which functions took the longest to execute.
            </p>
          </div>
        );
      }
      case "high-render-count-high-js": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              This is the period when JavaScript hooks and other JavaScript outside of React Renders
              run.
            </p>
            {input.data.renderCount === 0 ? (
              <>
                <p>
                  There were no renders, which means nothing related to React caused this slowdown.
                  The most likely cause of the slowdown is a slow JavaScript event handler, or code
                  related to a Web API
                </p>
                <p>
                  You should try to reproduce the slowdown while profiling your website with the
                  <strong>Chrome DevTools profiler</strong> to see exactly what functions took the
                  longest to execute.
                </p>
              </>
            ) : (
              <>
                {" "}
                <p>
                  There were <strong>{input.data.renderCount}</strong> renders, which could have
                  contributed to the high JavaScript/Hook time if they ran lots of hooks, like{" "}
                  <code>useEffects</code>.
                </p>
                <div class={cn(["flex flex-col"])}>
                  <p>You should try optimizing the renders of:</p>
                  <For each={input.data.topByCount}>
                    {(item) => (
                      <div>
                        - <strong>{item.name}</strong> (rendered {item.count}x)
                      </div>
                    )}
                  </For>
                </div>
                and then checking if the problem still exists.
                <p>
                  You can also try profiling your app using the{" "}
                  <strong>Chrome DevTools profiler</strong> to see exactly what functions took the
                  longest to execute.
                </p>
              </>
            )}
          </div>
        );
      }
      case "low-render-count-high-js": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              This is the period when JavaScript hooks and other JavaScript outside of React Renders
              run.
            </p>
            <p>
              There were only <strong>{input.data.renderCount}</strong> renders detected, which
              means either you had very expensive hooks like <code>useEffect</code>/
              <code>useLayoutEffect</code>, or there is other JavaScript running during this
              interaction that took up the majority of the time.
            </p>
            <p>
              To understand precisely what caused the slowdown, use the{" "}
              <strong>Chrome profiler</strong> and analyze the function call times.
            </p>
          </div>
        );
      }
      case "high-render-count-update-dom-draw-frame": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              These are the calculations the browser is forced to do in response to the JavaScript
              that ran during the interaction.
            </p>
            <p>
              This can be caused by CSS updates/CSS recalculations, or new DOM elements/DOM
              mutations.
            </p>
            <p>
              During this interaction, there were <strong>{input.data.count}</strong> renders, which
              was <strong>{input.data.percentageOfTotal.toFixed(0)}%</strong> of the time spent
              processing
            </p>
            <p>
              The work performed as a result of the renders may have forced the browser to spend a
              lot of time to draw the next frame.
            </p>
            <p>
              You can try optimizing the renders to see if the performance problem still exists
              using the "Ranked" tab.
            </p>
          </div>
        );
      }
      case "update-dom-draw-frame": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              These are the calculations the browser is forced to do in response to the JavaScript
              that ran during the interaction.
            </p>
            <p>
              This can be caused by CSS updates/CSS recalculations, or new DOM elements/DOM
              mutations.
            </p>
          </div>
        );
      }
      case "other": {
        return (
          <div class={cn(["text-[#E4E4E7] text-[10px] leading-6 flex flex-col gap-y-2"])}>
            <p>
              This is the time it took to run everything other than React renders. This can be hooks
              like <code>useEffect</code>, other JavaScript not part of React, or work the browser
              has to do to update the DOM and draw the next frame.
            </p>
            <p>
              To get a better picture of what happened, profile your app using the{" "}
              <strong>Chrome profiler</strong> when the performance problem arises.
            </p>
          </div>
        );
      }
    }
  });
  return <>{content()}</>;
};
