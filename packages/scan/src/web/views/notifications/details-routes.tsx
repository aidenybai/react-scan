import { Show, Switch, Match, createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { playNotificationSound } from "../../../core/utils";
import { setWidgetView } from "../../state";
import { cn } from "../../utils/helpers";
import { useNotificationsContext } from "./data";
import { CloseIcon } from "./icons";
import { NotificationTabs } from "./notification-tabs";
import { OtherVisualization } from "./other-visualization";
import { RenderBarChart } from "./render-bar-chart";
import { RenderExplanation } from "./render-explanation";

export const DetailsRoutes = () => {
  const { notificationState, setNotificationState } = useNotificationsContext();
  const [dots, setDots] = createSignal("...");

  onMount(() => {
    const interval = setInterval(() => {
      setDots((previousDots) => (previousDots === "..." ? "" : `${previousDots}.`));
    }, 500);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <Show
      when={notificationState.selectedEvent}
      fallback={
        <div
          class={cn(["h-full w-full flex flex-col items-center justify-center relative py-2 px-4"])}
        >
          <div
            class={cn([
              "p-2 flex justify-center items-center border-[#27272A] absolute top-0 right-0",
            ])}
          >
            <button
              onClick={() => {
                setWidgetView({ view: "none" });
              }}
            >
              <CloseIcon size={18} class="text-[#6F6F78]" />
            </button>
          </div>
          <div
            class={cn([
              "flex flex-col items-start pt-5 bg-[#0A0A0A] p-5 rounded-sm max-w-md",
              "shadow-lg",
            ])}
          >
            <div class={cn(["flex flex-col items-start gap-y-4"])}>
              <div class={cn(["flex items-center"])}>
                <span class={cn(["text-zinc-400 font-medium text-[17px]"])}>
                  Scanning for slowdowns{dots()}
                </span>
              </div>
              <Show when={notificationState.events.length !== 0}>
                <p class={cn(["text-xs"])}>
                  Click on an item in the <span class={cn(["text-purple-400"])}>History</span> list
                  to get started
                </p>
              </Show>
              <p class={cn(["text-zinc-600 text-xs"])}>
                You don't need to keep this panel open for React Scan to record slowdowns
              </p>
              <p class={cn(["text-zinc-600 text-xs"])}>
                Enable audio alerts to hear a delightful ding every time a large slowdown is
                recorded
              </p>
              <button
                onClick={() => {
                  const audioOptions = notificationState.audioNotificationsOptions;
                  if (audioOptions.enabled) {
                    if (audioOptions.audioContext.state !== "closed") {
                      void audioOptions.audioContext.close();
                    }
                    localStorage.setItem("react-scan-notifications-audio", "false");
                    setNotificationState("audioNotificationsOptions", {
                      audioContext: null,
                      enabled: false,
                    });
                    return;
                  }

                  localStorage.setItem("react-scan-notifications-audio", "true");
                  const audioContext = new AudioContext();
                  playNotificationSound(audioContext);
                  setNotificationState("audioNotificationsOptions", {
                    enabled: true,
                    audioContext,
                  });
                }}
                class={cn([
                  "px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-sm w-full",
                  "text-sm flex items-center gap-x-2 justify-center",
                ])}
              >
                <span class="flex items-center gap-x-1">
                  {notificationState.audioNotificationsOptions.enabled
                    ? "Disable audio alerts"
                    : "Enable audio alerts"}
                </span>
              </button>
            </div>
          </div>
        </div>
      }
    >
      {(selectedEvent) => (
        <Switch>
          <Match when={notificationState.route === "render-visualization"}>
            <TabLayout>
              <RenderBarChart selectedEvent={selectedEvent()} />
            </TabLayout>
          </Match>
          <Match when={notificationState.route === "render-explanation"}>
            <Show
              when={notificationState.selectedFiber}
              fallback={<div>Unable to show render details</div>}
            >
              {(selectedFiber) => (
                <TabLayout>
                  <RenderExplanation
                    selectedFiber={selectedFiber()}
                    selectedEvent={selectedEvent()}
                  />
                </TabLayout>
              )}
            </Show>
          </Match>
          <Match when={notificationState.route === "other-visualization"}>
            <TabLayout>
              <div
                class={cn(["flex w-full h-full flex-col overflow-y-auto"])}
                id="overview-scroll-container"
              >
                <OtherVisualization selectedEvent={selectedEvent()} />
              </div>
            </TabLayout>
          </Match>
        </Switch>
      )}
    </Show>
  );
};

const TabLayout = (props: { children: JSX.Element }) => {
  const { notificationState } = useNotificationsContext();

  return (
    <div class={cn(["w-full h-full flex flex-col gap-y-2"])}>
      <div class={cn(["h-[50px] w-full"])}>
        <Show when={notificationState.selectedEvent}>
          {(selectedEvent) => <NotificationTabs selectedEvent={selectedEvent()} />}
        </Show>
      </div>
      <div class={cn(["h-calc(100%-50px) flex flex-col overflow-y-auto px-3"])}>
        {props.children}
      </div>
    </div>
  );
};
