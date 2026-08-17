import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Accessor,
  type JSX,
} from "solid-js";
import { cn } from "../../utils/helpers";
import { DroppedFramesEvent, InteractionEvent, getComponentName, getEventSeverity } from "./data";
import { ChevronRight } from "./icons";
import { SlowdownHistoryItem } from "./slowdown-history";

export interface CollapsedDroppedFrame {
  kind: "collapsed-frame-drops";
  events: Array<DroppedFramesEvent>;
  timestamp: number;
}

export interface CollapsedKeyboardInput {
  kind: "collapsed-keyboard";
  events: Array<InteractionEvent>;
  timestamp: number;
}

const useNestedFlash = (flashingItemsCount: Accessor<number>, totalEvents: Accessor<number>) => {
  const [isFlashing, setIsFlashing] = createSignal(false);
  let flashedFor = 0;
  let lastFlashTime = 0;

  createEffect(() => {
    flashingItemsCount();
    const eventCount = totalEvents();
    if (flashedFor >= eventCount) {
      return;
    }

    const delay = Math.max(0, 250 - (Date.now() - lastFlashTime));
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      setIsFlashing(false);
      flashTimer = setTimeout(() => {
        flashedFor = eventCount;
        lastFlashTime = Date.now();
        setIsFlashing(true);
        stopTimer = setTimeout(() => setIsFlashing(false), 2000);
      }, 50);
    }, delay);

    onCleanup(() => {
      clearTimeout(startTimer);
      if (flashTimer) clearTimeout(flashTimer);
      if (stopTimer) clearTimeout(stopTimer);
    });
  });

  return isFlashing;
};

export const CollapsedItem = (props: {
  item: CollapsedDroppedFrame | CollapsedKeyboardInput;
  shouldFlash: (id: string) => boolean;
}) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const severity = createMemo(() =>
    props.item.events
      .map(getEventSeverity)
      .reduce<"low" | "needs-improvement" | "high">((previousSeverity, currentSeverity) => {
        switch (currentSeverity) {
          case "high":
            return "high";
          case "needs-improvement":
            return previousSeverity === "high" ? "high" : "needs-improvement";
          case "low":
            return previousSeverity;
        }
      }, "low"),
  );
  const flashingItemsCount = createMemo(() =>
    props.item.events.reduce(
      (flashingCount, event) => (props.shouldFlash(event.id) ? flashingCount + 1 : flashingCount),
      0,
    ),
  );
  const shouldFlashAgain = useNestedFlash(flashingItemsCount, () => props.item.events.length);

  return (
    <div class={cn(["flex flex-col gap-y-0.5"])}>
      <button
        onClick={() => setIsExpanded((expanded) => !expanded)}
        class={cn([
          "pl-2 py-1.5 text-sm flex items-center rounded-sm hover:bg-[#18181B] relative overflow-hidden",
          shouldFlashAgain() &&
            !isExpanded() &&
            "after:absolute after:inset-0 after:bg-purple-500/30 after:animate-[fadeOut_1s_ease-out_forwards]",
        ])}
      >
        <div
          class={cn(["w-4/5 flex items-center justify-start h-full text-xs truncate gap-x-1.5"])}
        >
          <span class={cn(["min-w-fit"])}>
            <ChevronRight
              class={cn(["text-[#A1A1AA] transition-transform", isExpanded() ? "rotate-90" : ""])}
              size={14}
            />
          </span>
          <span class={cn(["text-xs"])}>
            {props.item.kind === "collapsed-frame-drops"
              ? "FPS Drops"
              : getComponentName(props.item.events.at(0)?.componentPath ?? [])}
          </span>
        </div>
        <div class={cn(["ml-auto min-w-fit flex justify-end items-center"])}>
          <div
            style={{ "line-height": "10px" }}
            class={cn([
              "w-fit flex items-center text-[10px] justify-center h-full text-white px-1 py-1 rounded-sm font-semibold",
              severity() === "low" && "bg-green-500/60",
              severity() === "needs-improvement" && "bg-[#b77116] text-[10px]",
              severity() === "high" && "bg-[#b94040]",
            ])}
          >
            x{props.item.events.length}
          </div>
        </div>
      </button>
      <Show when={isExpanded()}>
        <IndentedContent>
          <For
            each={props.item.events.toSorted((first, second) => second.timestamp - first.timestamp)}
          >
            {(event) => (
              <SlowdownHistoryItem event={event} shouldFlash={props.shouldFlash(event.id)} />
            )}
          </For>
        </IndentedContent>
      </Show>
    </div>
  );
};

const IndentedContent = (props: { children: JSX.Element }) => (
  <div class="relative pl-6 flex flex-col gap-y-1">
    <div class="absolute left-3 top-0 bottom-0 w-px bg-[#27272A]" />
    {props.children}
  </div>
);
