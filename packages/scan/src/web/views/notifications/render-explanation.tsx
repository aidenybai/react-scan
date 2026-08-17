import { cn } from "../../utils/helpers";
import { NotificationEvent, useNotificationsContext } from "./data";
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, CloseIcon } from "./icons";
import { getIsProduction } from "../../../core/index";

export const RenderExplanation = (props: {
  selectedFiber: NotificationEvent["groupedFiberRenders"][number];
  selectedEvent: NotificationEvent;
}) => {
  const { setRoute } = useNotificationsContext();
  const [isTipShown, setIsTipShown] = createSignal(true);
  const isProduction = getIsProduction();

  onMount(() => {
    const res = localStorage.getItem("react-scan-tip-shown");
    const asBool = res === "true" ? true : res === "false" ? false : null;
    if (asBool === null) {
      setIsTipShown(true);
      localStorage.setItem("react-scan-tip-is-shown", "true");
      return;
    }
    if (!asBool) {
      setIsTipShown(false);
    }
  });
  const isMemoizable = () =>
    props.selectedFiber.changes.context.length === 0 &&
    props.selectedFiber.changes.props.length === 0 &&
    props.selectedFiber.changes.state.length === 0;
  return (
    <div class={cn(["w-full min-h-fit h-full flex flex-col py-4 pt-0 rounded-sm"])}>
      <div class={cn(["flex items-start gap-x-4 "])}>
        <button
          onClick={() => {
            setRoute({
              route: "render-visualization",
              routeMessage: null,
            });
          }}
          class={cn([
            "text-white hover:bg-[#34343b] flex gap-x-1 justify-center items-center mb-4 w-fit px-2.5 py-1.5 text-xs rounded-sm bg-[#18181B]",
          ])}
        >
          <ArrowLeft size={14} /> <span>Overview</span>
        </button>
        <div class={cn(["flex flex-col gap-y-1"])}>
          <div class={cn(["text-sm font-bold text-white overflow-x-hidden"])}>
            <div class="flex items-center gap-x-2 truncate">{props.selectedFiber.name}</div>
          </div>
          <div class={cn(["flex gap-x-2"])}>
            {!isProduction && (
              <>
                <div class={cn(["text-xs text-gray-400"])}>
                  • Render time: {props.selectedFiber.totalTime.toFixed(0)}ms
                </div>
              </>
            )}
            <div class={cn(["text-xs text-gray-400 mb-4"])}>
              • Renders: {props.selectedFiber.count}x
            </div>
          </div>
        </div>
      </div>
      <Show when={isTipShown() && !isMemoizable()}>
        <div
          class={cn([
            "w-full mb-4 bg-[#0A0A0A] border border-[#27272A] rounded-sm overflow-hidden flex relative",
          ])}
        >
          <button
            onClick={() => {
              setIsTipShown(false);

              localStorage.setItem("react-scan-tip-shown", "false");
            }}
            class={cn(["absolute right-2 top-2 rounded-sm p-1 hover:bg-[#18181B]"])}
          >
            <CloseIcon size={12} />
          </button>
          <div class={cn(["w-1 bg-[#d36cff]"])} />
          <div class={cn(["flex-1"])}>
            <div class={cn(["px-3 py-2 text-gray-100 text-xs font-semibold"])}>
              How to stop renders
            </div>
            <div class={cn(["px-3 pb-2 text-gray-400 text-[10px]"])}>
              Stop the following props, state and context from changing between renders, and wrap
              the component in React.memo if not already
            </div>
          </div>
        </div>
      </Show>

      <Show when={isMemoizable()}>
        <div
          class={cn([
            "w-full mb-4 bg-[#0A0A0A] border border-[#27272A] rounded-sm overflow-hidden flex",
          ])}
        >
          <div class={cn(["w-1 bg-[#d36cff]"])} />
          <div class={cn(["flex-1"])}>
            <div class={cn(["px-3 py-2 text-gray-100 text-sm font-semibold"])}>
              No changes detected
            </div>
            <div class={cn(["px-3 pb-2 text-gray-400 text-xs"])}>
              This component would not have rendered if it was memoized
            </div>
          </div>
        </div>
      </Show>
      <div class={cn(["flex w-full"])}>
        <div
          class={cn(["flex flex-col border border-[#27272A] rounded-l-sm overflow-hidden w-1/3"])}
        >
          <div
            class={cn([
              "text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center",
            ])}
          >
            Changed Props
          </div>
          <Show
            when={props.selectedFiber.changes.props.length > 0}
            fallback={
              <div
                class={cn([
                  "flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A]",
                ])}
              >
                No changes
              </div>
            }
          >
            <For each={props.selectedFiber.changes.props.toSorted((a, b) => b.count - a.count)}>
              {(change) => (
                <div
                  class={cn([
                    "flex flex-col justify-between items-center border-t overflow-x-auto border-[#27272A] px-1 py-1 text-wrap bg-[#0A0A0A] text-[10px]",
                  ])}
                >
                  <span class={cn(["text-white "])}>{change.name}</span>
                  <div class={cn([" text-[8px]  text-[#d36cff] pl-1 py-1 "])}>
                    {change.count}/{props.selectedFiber.count}x
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
        <div class={cn(["flex flex-col border border-[#27272A] border-l-0 overflow-hidden w-1/3"])}>
          <div
            class={cn([
              " text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center",
            ])}
          >
            Changed State
          </div>
          <Show
            when={props.selectedFiber.changes.state.length > 0}
            fallback={
              <div
                class={cn([
                  "flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A]",
                ])}
              >
                No changes
              </div>
            }
          >
            <For each={props.selectedFiber.changes.state.toSorted((a, b) => b.count - a.count)}>
              {(change) => (
                <div
                  class={cn([
                    "flex flex-col justify-between items-center border-t overflow-x-auto border-[#27272A] px-1 py-1 text-wrap bg-[#0A0A0A] text-[10px]",
                  ])}
                >
                  <span class={cn(["text-white "])}>index {change.index}</span>
                  <div class={cn(["rounded-full  text-[#d36cff] pl-1 py-1 text-[8px]"])}>
                    {change.count}/{props.selectedFiber.count}x
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
        <div
          class={cn([
            "flex flex-col border border-[#27272A] border-l-0 rounded-r-sm overflow-hidden w-1/3",
          ])}
        >
          <div
            class={cn([
              " text-[14px] font-semibold px-2 py-2 bg-[#18181B] text-white flex justify-center",
            ])}
          >
            Changed Context
          </div>
          <Show
            when={props.selectedFiber.changes.context.length > 0}
            fallback={
              <div
                class={cn([
                  "flex items-center justify-center h-full bg-[#0A0A0A] text-[#A1A1AA] border-t border-[#27272A] py-2",
                ])}
              >
                No changes
              </div>
            }
          >
            <For each={props.selectedFiber.changes.context.toSorted((a, b) => b.count - a.count)}>
              {(change) => (
                <div
                  class={cn([
                    "flex flex-col justify-between items-center border-t  border-[#27272A] px-1 py-1 bg-[#0A0A0A] text-[10px] overflow-x-auto",
                  ])}
                >
                  <span class={cn(["text-white "])}>{change.name}</span>
                  <div class={cn(["rounded-full text-[#d36cff] pl-1 py-1 text-[8px] text-wrap"])}>
                    {change.count}/{props.selectedFiber.count}x
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
};
