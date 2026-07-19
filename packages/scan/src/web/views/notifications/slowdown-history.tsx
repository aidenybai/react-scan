import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Accessor,
  type Setter,
} from "solid-js";
import { clearToolbarEvents } from "../../../core/notifications/event-tracking";
import { iife } from "../../../core/notifications/performance-utils";
import { cn } from "../../utils/helpers";
import {
  type CollapsedKeyboardInput,
  CollapsedDroppedFrame,
  CollapsedItem,
} from "./collapsed-event";
import {
  NotificationEvent,
  getComponentName,
  getEventSeverity,
  getTotalTime,
  useNotificationsContext,
} from "./data";
import { ClearIcon, KeyboardIcon, PointerIcon, TrendingDownIcon } from "./icons";
import { Popover } from "./popover";

const useFlashManager = (events: Accessor<Array<NotificationEvent>>) => {
  let previousEvents: Array<NotificationEvent> = [];
  let isInitialRun = true;
  const [newEventIds, setNewEventIds] = createSignal(new Set<string>());

  createEffect(() => {
    const currentEvents = events();
    if (isInitialRun) {
      isInitialRun = false;
      previousEvents = currentEvents;
      return;
    }

    const previousIds = new Set(previousEvents.map((event) => event.id));
    const addedIds = new Set(
      currentEvents.map((event) => event.id).filter((eventId) => !previousIds.has(eventId)),
    );

    if (addedIds.size > 0) {
      setNewEventIds(addedIds);
      const timer = setTimeout(() => setNewEventIds(new Set()), 2000);
      onCleanup(() => clearTimeout(timer));
    }

    previousEvents = currentEvents;
  });

  return (eventId: string) => newEventIds().has(eventId);
};

const useFlash = (shouldFlash: Accessor<boolean>) => {
  const [isFlashing, setIsFlashing] = createSignal(shouldFlash());

  createEffect(() => {
    if (!shouldFlash()) return;

    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), 1000);
    onCleanup(() => clearTimeout(timer));
  });

  return isFlashing;
};

export const SlowdownHistoryItem = (props: { event: NotificationEvent; shouldFlash: boolean }) => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const isFlashing = useFlash(() => props.shouldFlash);

  return (
    <>
      {createMemo(() => {
        const event = props.event;
        const severity = getEventSeverity(event);
        switch (event.kind) {
          case "interaction":
            return (
              <button
                onClick={() => {
                  setNotificationState({
                    selectedEvent: event,
                    route: "render-visualization",
                    selectedFiber: null,
                  });
                }}
                class={cn([
                  "pl-2 py-1.5 text-sm flex w-full items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden",
                  event.id === notificationState.selectedEvent?.id && "bg-[#18181B]",
                  isFlashing() &&
                    "after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]",
                ])}
              >
                <div class={cn(["w-4/5 flex items-center justify-start h-full gap-x-1.5"])}>
                  <span class={cn(["min-w-fit text-xs"])}>
                    {event.type === "click" ? (
                      <PointerIcon size={14} />
                    ) : (
                      <KeyboardIcon size={14} />
                    )}
                  </span>
                  <span class={cn(["text-xs pr-1 truncate"])}>
                    {getComponentName(event.componentPath)}
                  </span>
                </div>
                <div class={cn(["min-w-fit flex justify-end items-center ml-auto"])}>
                  <div
                    style={{ "line-height": "10px" }}
                    class={cn([
                      "gap-x-0.5 w-fit flex items-end justify-center h-full text-white px-1 py-1 rounded-sm font-semibold text-[10px]",
                      severity === "low" && "bg-green-500/50",
                      severity === "needs-improvement" && "bg-[#b77116] text-[10px]",
                      severity === "high" && "bg-[#b94040]",
                    ])}
                  >
                    <div
                      style={{ "line-height": "10px" }}
                      class={cn(["text-[10px] text-white flex items-end"])}
                    >
                      {getTotalTime(event.timing).toFixed(0)}ms
                    </div>
                  </div>
                </div>
              </button>
            );
          case "dropped-frames":
            return (
              <button
                onClick={() => {
                  setNotificationState({
                    selectedEvent: event,
                    route: "render-visualization",
                    selectedFiber: null,
                  });
                }}
                class={cn([
                  "pl-2 py-1.5 w-full text-sm flex items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden",
                  event.id === notificationState.selectedEvent?.id && "bg-[#18181B]",
                  isFlashing() &&
                    "after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]",
                ])}
              >
                <div class={cn(["w-4/5 flex items-center justify-start h-full text-xs truncate"])}>
                  <TrendingDownIcon size={14} class="mr-1.5" /> FPS Drop
                </div>
                <div class={cn(["min-w-fit flex justify-end items-center ml-auto"])}>
                  <div
                    style={{ "line-height": "10px" }}
                    class={cn([
                      "w-fit flex items-center justify-center h-full text-white px-1 py-1 rounded-sm text-[10px] font-bold",
                      severity === "low" && "bg-green-500/60",
                      severity === "needs-improvement" && "bg-[#b77116] text-[10px]",
                      severity === "high" && "bg-[#b94040]",
                    ])}
                  >
                    {event.fps} FPS
                  </div>
                </div>
              </button>
            );
        }
      })()}
    </>
  );
};

type HistoryEvent =
  | {
      kind: "single";
      event: NotificationEvent;
      timestamp: number;
    }
  | CollapsedKeyboardInput
  | CollapsedDroppedFrame;

const collapseEvents = (events: Array<NotificationEvent>) =>
  events.reduce<Array<HistoryEvent>>((collapsedEvents, currentEvent) => {
    const lastEvent = collapsedEvents.at(-1);
    if (!lastEvent) {
      return [{ kind: "single", event: currentEvent, timestamp: currentEvent.timestamp }];
    }

    switch (lastEvent.kind) {
      case "collapsed-keyboard":
        if (
          currentEvent.kind === "interaction" &&
          currentEvent.type === "keyboard" &&
          currentEvent.componentPath.join("-") === lastEvent.events[0].componentPath.join("-")
        ) {
          const groupedEvents = [...lastEvent.events, currentEvent];
          return [
            ...collapsedEvents.filter((event) => event !== lastEvent),
            {
              kind: "collapsed-keyboard",
              events: groupedEvents,
              timestamp: Math.max(...groupedEvents.map((event) => event.timestamp)),
            },
          ];
        }
        break;
      case "single":
        if (
          lastEvent.event.kind === "interaction" &&
          lastEvent.event.type === "keyboard" &&
          currentEvent.kind === "interaction" &&
          currentEvent.type === "keyboard" &&
          lastEvent.event.componentPath.join("-") === currentEvent.componentPath.join("-")
        ) {
          return [
            ...collapsedEvents.filter((event) => event !== lastEvent),
            {
              kind: "collapsed-keyboard",
              events: [lastEvent.event, currentEvent],
              timestamp: Math.max(lastEvent.event.timestamp, currentEvent.timestamp),
            },
          ];
        }
        if (lastEvent.event.kind === "dropped-frames" && currentEvent.kind === "dropped-frames") {
          return [
            ...collapsedEvents.filter((event) => event !== lastEvent),
            {
              kind: "collapsed-frame-drops",
              events: [lastEvent.event, currentEvent],
              timestamp: Math.max(lastEvent.event.timestamp, currentEvent.timestamp),
            },
          ];
        }
        break;
      case "collapsed-frame-drops":
        if (currentEvent.kind === "dropped-frames") {
          const groupedEvents = [...lastEvent.events, currentEvent];
          return [
            ...collapsedEvents.filter((event) => event !== lastEvent),
            {
              kind: "collapsed-frame-drops",
              events: groupedEvents,
              timestamp: Math.max(...groupedEvents.map((event) => event.timestamp)),
            },
          ];
        }
        break;
    }

    return [
      ...collapsedEvents,
      { kind: "single", event: currentEvent, timestamp: currentEvent.timestamp },
    ];
  }, []);

export const useLaggedEvents = (
  lagMilliseconds = 150,
): [Accessor<Array<NotificationEvent>>, Setter<Array<NotificationEvent>>] => {
  const { notificationState } = useNotificationsContext();
  const [laggedEvents, setLaggedEvents] = createSignal<Array<NotificationEvent>>([
    ...notificationState.events,
  ]);

  createEffect(() => {
    const currentEvents = [...notificationState.events];
    const timer = setTimeout(() => setLaggedEvents(currentEvents), lagMilliseconds);
    onCleanup(() => clearTimeout(timer));
  });

  return [laggedEvents, setLaggedEvents];
};

export const SlowdownHistory = () => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const shouldFlash = useFlashManager(() => notificationState.events);
  const [laggedEvents, setLaggedEvents] = useLaggedEvents();
  const collapsedEvents = createMemo(() =>
    collapseEvents(laggedEvents()).toSorted(
      (firstEvent, secondEvent) => secondEvent.timestamp - firstEvent.timestamp,
    ),
  );

  return (
    <div
      class={cn(["w-full h-full gap-y-2 flex flex-col border-r border-[#27272A] overflow-y-auto"])}
    >
      <div
        class={cn(["text-sm text-[#65656D] pl-3 pr-1 w-full flex items-center justify-between"])}
      >
        <span>History</span>
        <Popover
          wrapperProps={{ class: "h-full flex items-center justify-center ml-auto" }}
          triggerContent={
            <button
              class={cn(["hover:bg-[#18181B] rounded-full p-2"])}
              title="Clear all events"
              onClick={() => {
                clearToolbarEvents();
                setNotificationState({
                  selectedEvent: null,
                  selectedFiber: null,
                  route:
                    notificationState.route === "other-visualization"
                      ? "other-visualization"
                      : "render-visualization",
                });
                setLaggedEvents([]);
              }}
            >
              <ClearIcon size={16} />
            </button>
          }
        >
          <div class={cn(["w-full flex justify-center"])}>Clear all events</div>
        </Popover>
      </div>
      <div class={cn(["flex flex-col px-1 gap-y-1"])}>
        <Show
          when={collapsedEvents().length > 0}
          fallback={
            <div class={cn(["flex items-center justify-center text-zinc-500 text-sm py-4"])}>
              No Events
            </div>
          }
        >
          <For each={collapsedEvents()}>
            {(historyItem) =>
              iife(() => {
                switch (historyItem.kind) {
                  case "collapsed-keyboard":
                  case "collapsed-frame-drops":
                    return <CollapsedItem shouldFlash={shouldFlash} item={historyItem} />;
                  case "single":
                    return (
                      <SlowdownHistoryItem
                        event={historyItem.event}
                        shouldFlash={shouldFlash(historyItem.event.id)}
                      />
                    );
                }
              })
            }
          </For>
        </Show>
      </div>
    </div>
  );
};
