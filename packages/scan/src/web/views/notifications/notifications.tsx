import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
  getToolbarEvents,
  subscribeToolbarEvents,
} from "../../../core/notifications/event-tracking";
import { FiberRenders } from "../../../core/notifications/performance";
import { invariantError } from "../../../core/notifications/performance-utils";
import { not_globally_unique_generateId, playNotificationSound } from "../../../core/utils";
import { cn } from "../../utils/helpers";
import {
  NotificationStateContext,
  NotificationsState,
  getEventSeverity,
  getTotalTime,
  useNotificationsContext,
} from "./data";
import { DetailsRoutes } from "./details-routes";
import { NotificationHeader } from "./notification-header";
import { fadeOutHighlights } from "./render-bar-chart";
import { SlowdownHistory, useLaggedEvents } from "./slowdown-history";

const AUDIO_DEBOUNCE_MS = 1000;
const ELEMENT_GARBAGE_COLLECTION_INTERVAL_MS = 5000;

const getGroupedFiberRenders = (fiberRenders: FiberRenders) =>
  Object.values(fiberRenders).map((render) => ({
    id: not_globally_unique_generateId(),
    totalTime: render.nodeInfo.reduce(
      (totalTime, nodeInformation) => totalTime + nodeInformation.selfTime,
      0,
    ),
    count: render.nodeInfo.length,
    name: render.nodeInfo[0].name,
    deletedAll: false,
    parents: render.parents,
    hasMemoCache: render.hasMemoCache,
    wasFiberRenderMount: render.wasFiberRenderMount,
    elements: render.nodeInfo.map((nodeInformation) => nodeInformation.element),
    changes: {
      context: render.changes.fiberContext.current
        .filter((change) => render.changes.fiberContext.changesCounts.get(change.name))
        .map((change) => ({
          name: String(change.name),
          count: render.changes.fiberContext.changesCounts.get(change.name) ?? 0,
        })),
      props: render.changes.fiberProps.current
        .filter((change) => render.changes.fiberProps.changesCounts.get(change.name))
        .map((change) => ({
          name: String(change.name),
          count: render.changes.fiberProps.changesCounts.get(change.name) ?? 0,
        })),
      state: render.changes.fiberState.current
        .filter((change) => render.changes.fiberState.changesCounts.get(Number(change.name)))
        .map((change) => ({
          index: Number(change.name),
          count: render.changes.fiberState.changesCounts.get(Number(change.name)) ?? 0,
        })),
    },
  }));

const useGarbageCollectElements = (notificationEvents: Accessor<NotificationsState["events"]>) => {
  onMount(() => {
    const checkElementsExistence = () => {
      notificationEvents().forEach((event) => {
        event.groupedFiberRenders.forEach((render) => {
          if (render.deletedAll) return;
          if (render.elements.length === 0) {
            render.deletedAll = true;
            return;
          }

          const initialLength = render.elements.length;
          render.elements = render.elements.filter((element) => element.isConnected);
          if (render.elements.length === 0 && initialLength > 0) {
            render.deletedAll = true;
          }
        });
      });
    };
    const intervalId = setInterval(checkElementsExistence, ELEMENT_GARBAGE_COLLECTION_INTERVAL_MS);
    onCleanup(() => clearInterval(intervalId));
  });
};

export const useAppNotifications = () => {
  const [eventLog, setEventLog] = createSignal(getToolbarEvents());

  onMount(() => {
    const unsubscribe = subscribeToolbarEvents(() => {
      setEventLog(() => getToolbarEvents());
    });
    onCleanup(unsubscribe);
  });

  const notificationEvents = createMemo<NotificationsState["events"]>(() => {
    const events: NotificationsState["events"] = [];
    eventLog().forEach((event) => {
      const fiberRenders =
        event.kind === "interaction"
          ? event.data.meta.detailedTiming.fiberRenders
          : event.data.meta.fiberRenders;
      const groupedFiberRenders = getGroupedFiberRenders(fiberRenders);
      const renderTime = groupedFiberRenders.reduce(
        (totalTime, render) => totalTime + render.totalTime,
        0,
      );

      switch (event.kind) {
        case "interaction": {
          const { commitEnd, jsEndDetail, interactionStartDetail, rafStart } =
            event.data.meta.detailedTiming;
          if (jsEndDetail - interactionStartDetail - renderTime < 0) {
            invariantError("js time must be longer than render time");
          }
          const otherJSTime = Math.max(0, jsEndDetail - interactionStartDetail - renderTime);
          const frameDraw = Math.max(
            event.data.meta.latency - (commitEnd - interactionStartDetail),
            0,
          );
          events.push({
            componentPath: event.data.meta.detailedTiming.componentPath,
            groupedFiberRenders,
            id: event.id,
            kind: "interaction",
            memory: null,
            timestamp: event.data.startAt,
            type:
              event.data.meta.detailedTiming.interactionType === "keyboard" ? "keyboard" : "click",
            timing: {
              renderTime,
              kind: "interaction",
              otherJSTime,
              framePreparation: rafStart - jsEndDetail,
              frameConstruction: commitEnd - rafStart,
              frameDraw,
            },
          });
          break;
        }
        case "long-render":
          events.push({
            kind: "dropped-frames",
            id: event.id,
            memory: null,
            timing: {
              kind: "dropped-frames",
              renderTime,
              otherTime: event.data.meta.latency,
            },
            groupedFiberRenders,
            timestamp: event.data.startAt,
            fps: event.data.meta.fps,
          });
          break;
      }
    });
    return events;
  });

  useGarbageCollectElements(notificationEvents);
  return notificationEvents;
};

const NotificationAudio = () => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const [laggedEvents] = useLaggedEvents();
  let playedFor: number | null = null;
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
  let lastPlayedTime = 0;
  const alertEventsCount = createMemo(
    () => laggedEvents().filter((event) => getEventSeverity(event) === "high").length,
  );

  onMount(() => {
    const audioEnabledString = localStorage.getItem("react-scan-notifications-audio");
    if (audioEnabledString !== "false" && audioEnabledString !== "true") {
      localStorage.setItem("react-scan-notifications-audio", "false");
      return;
    }
    if (audioEnabledString === "true" && !notificationState.audioNotificationsOptions.enabled) {
      setNotificationState("audioNotificationsOptions", {
        enabled: true,
        audioContext: new AudioContext(),
      });
    }
  });

  createEffect(() => {
    const eventCount = alertEventsCount();
    const audioOptions = notificationState.audioNotificationsOptions;
    if (
      !audioOptions.enabled ||
      eventCount === 0 ||
      (playedFor !== null && playedFor >= eventCount)
    ) {
      return;
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const remainingDebounceTime = Math.max(0, AUDIO_DEBOUNCE_MS - (Date.now() - lastPlayedTime));
    debounceTimeout = setTimeout(() => {
      playNotificationSound(audioOptions.audioContext);
      playedFor = eventCount;
      lastPlayedTime = Date.now();
      debounceTimeout = undefined;
    }, remainingDebounceTime);
  });

  createEffect(() => {
    if (alertEventsCount() === 0) {
      playedFor = null;
    }
  });

  onCleanup(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  });

  return null;
};

export const NotificationWrapper = (props: { ref?: JSX.HTMLAttributes<HTMLDivElement>["ref"] }) => {
  const events = useAppNotifications();
  const initialEvents = events();
  const [notificationState, setNotificationState] = createStore<NotificationsState>({
    detailsExpanded: false,
    events: initialEvents,
    filterBy: "latest",
    moreInfoExpanded: false,
    route: "render-visualization",
    selectedEvent:
      initialEvents.toSorted((first, second) => first.timestamp - second.timestamp).at(-1) ?? null,
    selectedFiber: null,
    routeMessage: null,
    audioNotificationsOptions: {
      enabled: false,
      audioContext: null,
    },
  });

  createEffect(() => {
    setNotificationState("events", events());
  });

  const setRoute = ({
    route,
    routeMessage,
  }: {
    route: NotificationsState["route"];
    routeMessage: NotificationsState["routeMessage"];
  }) => {
    fadeOutHighlights();
    setNotificationState({
      route,
      routeMessage,
      selectedFiber: route === "render-explanation" ? notificationState.selectedFiber : null,
    });
  };

  return (
    <NotificationStateContext.Provider
      value={{ notificationState, setNotificationState, setRoute }}
    >
      <NotificationAudio />
      <Notifications ref={props.ref} />
    </NotificationStateContext.Provider>
  );
};

const Notifications = (props: { ref?: JSX.HTMLAttributes<HTMLDivElement>["ref"] }) => {
  const { notificationState } = useNotificationsContext();

  return (
    <div ref={props.ref} class={cn(["h-full w-full flex flex-col"])}>
      <Show when={notificationState.selectedEvent}>
        {(selectedEvent) => (
          <div
            class={cn([
              "w-full h-[48px] flex flex-col",
              notificationState.moreInfoExpanded && "h-[235px]",
              notificationState.moreInfoExpanded &&
                selectedEvent().kind === "dropped-frames" &&
                "h-[150px]",
            ])}
          >
            <NotificationHeader selectedEvent={selectedEvent()} />
            <Show when={notificationState.moreInfoExpanded}>
              <MoreInfo />
            </Show>
          </div>
        )}
      </Show>
      <div
        class={cn([
          "flex",
          notificationState.selectedEvent ? "h-[calc(100%-48px)]" : "h-full",
          notificationState.moreInfoExpanded && "h-[calc(100%-200px)]",
          notificationState.moreInfoExpanded &&
            notificationState.selectedEvent?.kind === "dropped-frames" &&
            "h-[calc(100%-150px)]",
        ])}
      >
        <div class={cn(["h-full min-w-[200px]"])}>
          <SlowdownHistory />
        </div>
        <div class={cn(["w-[calc(100%-200px)] h-full overflow-y-auto"])}>
          <DetailsRoutes />
        </div>
      </div>
    </div>
  );
};

const MoreInfo = () => {
  const { notificationState } = useNotificationsContext();
  const interactionEvent = createMemo(() =>
    notificationState.selectedEvent?.kind === "interaction"
      ? notificationState.selectedEvent
      : null,
  );

  return (
    <Show when={notificationState.selectedEvent}>
      {(event) => (
        <div
          class={cn([
            "px-4 py-2 border-b border-[#27272A] bg-[#18181B]/50 h-[calc(100%-40px)]",
            event().kind === "dropped-frames" && "h-[calc(100%-25px)]",
          ])}
        >
          <div class={cn(["flex flex-col gap-y-4 h-full"])}>
            <Show when={event().kind === "interaction"}>
              <div class={cn(["flex items-center gap-x-3"])}>
                <span class="text-[#6F6F78] text-xs font-medium">
                  {interactionEvent()?.type === "click"
                    ? "Clicked component location"
                    : "Typed in component location"}
                </span>
                <div class="font-mono text-[#E4E4E7] flex items-center bg-[#27272A] pl-2 py-1 rounded-sm overflow-x-auto">
                  <For each={interactionEvent()?.componentPath.toReversed() ?? []}>
                    {(part, index) => (
                      <>
                        <span
                          style={{ "line-height": "14px" }}
                          class="text-[10px] whitespace-nowrap"
                        >
                          {part}
                        </span>
                        <Show when={index() < (interactionEvent()?.componentPath.length ?? 0) - 1}>
                          <span class="text-[#6F6F78] mx-0.5">‹</span>
                        </Show>
                      </>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <div class={cn(["flex items-center gap-x-3"])}>
              <span class="text-[#6F6F78] text-xs font-medium">Total Time</span>
              <span class="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">
                {getTotalTime(event().timing).toFixed(0)}ms
              </span>
            </div>
            <div class={cn(["flex items-center gap-x-3"])}>
              <span class="text-[#6F6F78] text-xs font-medium">Occurred</span>
              <span class="text-[#E4E4E7] bg-[#27272A] px-1.5 py-1 rounded-sm text-xs">
                {`${((Date.now() - event().timestamp) / 1000).toFixed(0)}s ago`}
              </span>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
};
