import { cn } from "../../utils/helpers";
import { NotificationEvent, useNotificationsContext } from "./data";
import { Popover } from "./popover";
import { VolumeOffIcon, VolumeOnIcon } from "./icons";
import { playNotificationSound } from "../../../core/utils";

export const NotificationTabs = (_props: { selectedEvent: NotificationEvent }) => {
  const { notificationState, setNotificationState, setRoute } = useNotificationsContext();
  return (
    <div class={cn(["flex w-full justify-between items-center px-3 py-2 text-xs"])}>
      <div class={cn(["bg-[#18181B] flex items-center gap-x-1 p-1 rounded-sm"])}>
        <button
          onClick={() => {
            setRoute({
              route: "render-visualization",
              routeMessage: null,
            });
          }}
          class={cn([
            "w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1",
            notificationState.route === "render-visualization" ||
            notificationState.route === "render-explanation"
              ? "text-white bg-[#7521c8] rounded-sm"
              : "text-[#6E6E77] bg-[#18181B] rounded-sm",
          ])}
        >
          Ranked
        </button>
        <button
          onClick={() => {
            setRoute({
              route: "other-visualization",
              routeMessage: null,
            });
          }}
          class={cn([
            "w-1/2 flex items-center justify-center whitespace-nowrap py-[5px] px-1 gap-x-1",
            notificationState.route === "other-visualization"
              ? "text-white bg-[#7521c8] rounded-sm"
              : "text-[#6E6E77] bg-[#18181B] rounded-sm",
          ])}
        >
          Overview
        </button>
      </div>
      <Popover
        triggerContent={
          <button
            onClick={() => {
              const audioOptions = notificationState.audioNotificationsOptions;
              if (audioOptions.enabled && audioOptions.audioContext.state !== "closed") {
                void audioOptions.audioContext.close();
              }
              localStorage.setItem("react-scan-notifications-audio", String(!audioOptions.enabled));

              if (audioOptions.enabled) {
                setNotificationState("audioNotificationsOptions", {
                  audioContext: null,
                  enabled: false,
                });
                return;
              }

              const audioContext = new AudioContext();
              playNotificationSound(audioContext);
              setNotificationState("audioNotificationsOptions", {
                audioContext,
                enabled: true,
              });
            }}
            class="ml-auto"
          >
            <div class={cn(["flex gap-x-2 justify-center items-center text-[#6E6E77]"])}>
              <span>Alerts</span>
              {notificationState.audioNotificationsOptions.enabled ? (
                <VolumeOnIcon size={16} class="text-[#6E6E77]" />
              ) : (
                <VolumeOffIcon size={16} class="text-[#6E6E77]" />
              )}
            </div>
          </button>
        }
      >
        <>Play a chime when a slowdown is recorded</>
      </Popover>
    </div>
  );
};
