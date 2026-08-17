import { cn } from "../../utils/helpers";
import { NotificationEvent, getComponentName, getEventSeverity, getTotalTime } from "./data";
import { CloseIcon } from "./icons";
import { setWidgetView } from "../../state";
import { createMemo } from "solid-js";

export const NotificationHeader = (props: { selectedEvent: NotificationEvent }) => {
  const content = createMemo(() => {
    const selectedEvent = props.selectedEvent;
    const severity = getEventSeverity(selectedEvent);
    switch (selectedEvent.kind) {
      case "interaction": {
        return (
          // h-[48px] is a hack to adjust for header size
          <div class={cn([`w-full flex border-b border-[#27272A] min-h-[48px]`])}>
            {/* todo: make css variables for colors */}
            <div
              class={cn([
                "min-w-fit w-full justify-start flex items-center border-r border-[#27272A] pl-5 pr-2 text-sm gap-x-4",
              ])}
            >
              <div class={cn(["flex items-center gap-x-2 "])}>
                <span class={cn(["text-[#5a5a5a] mr-0.5"])}>
                  {selectedEvent.type === "click" ? "Clicked " : "Typed in "}
                </span>
                <span>{getComponentName(selectedEvent.componentPath)}</span>
                <div
                  class={cn([
                    "w-fit flex items-center justify-center h-fit text-white px-1 rounded-sm font-semibold text-[10px] whitespace-nowrap",
                    severity === "low" && "bg-green-500/50",
                    severity === "needs-improvement" && "bg-[#b77116]",
                    severity === "high" && "bg-[#b94040]",
                  ])}
                >
                  {getTotalTime(selectedEvent.timing).toFixed(0)}ms processing time
                </div>
              </div>
              <div class={cn(["flex items-center gap-x-2  justify-end ml-auto"])}>
                <div class={cn(["p-2 flex justify-center items-center border-[#27272A]"])}>
                  <button
                    onClick={() => {
                      setWidgetView({
                        view: "none",
                      });
                    }}
                    title="Close"
                  >
                    <CloseIcon size={18} class="text-[#6F6F78]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case "dropped-frames": {
        return (
          <div class={cn([`w-full flex border-b border-[#27272A] min-h-[48px]`])}>
            <div
              class={cn([
                "min-w-fit w-full justify-start flex items-center border-r border-[#27272A] pl-5 pr-2 text-sm gap-x-4",
              ])}
            >
              <div class={cn(["flex items-center gap-x-2 "])}>
                FPS Drop
                <div
                  class={cn([
                    "w-fit flex items-center justify-center h-fit text-white px-1 rounded-sm font-semibold text-[10px] whitespace-nowrap",
                    severity === "low" && "bg-green-500/50",
                    severity === "needs-improvement" && "bg-[#b77116]",
                    severity === "high" && "bg-[#b94040]",
                  ])}
                >
                  dropped to {selectedEvent.fps} FPS
                </div>
              </div>

              <div class={cn(["flex items-center gap-x-2 w-2/4 justify-end ml-auto"])}>
                <div class={cn(["p-2 flex justify-center items-center border-[#27272A]"])}>
                  <button
                    onClick={() => {
                      setWidgetView({
                        view: "none",
                      });
                    }}
                  >
                    <CloseIcon size={18} class="text-[#6F6F78]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  });
  return <>{content()}</>;
};
