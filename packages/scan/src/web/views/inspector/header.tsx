import type { Fiber } from "bippy";
import { Show, createEffect, createMemo, untrack } from "solid-js";
import { getInspectState } from "../../../core/native-state";
import { cn, getExtendedDisplayName } from "../../utils/helpers";
import { getTimelineState } from "./states";

export const HeaderInspect = () => {
  let rerendersElement: HTMLSpanElement | undefined;
  let timingElement: HTMLSpanElement | undefined;

  const currentFiber = createMemo<Fiber | null>(() => {
    const inspectState = getInspectState();
    return inspectState.kind === "focused" ? inspectState.fiber : null;
  });

  createEffect(() => {
    const state = getTimelineState();
    untrack(() => {
      if (getInspectState().kind !== "focused") return;
      if (!rerendersElement || !timingElement) return;

      const { totalUpdates, currentIndex, updates, isVisible, windowOffset } = state;

      const reRenders = Math.max(0, totalUpdates - 1);
      const headerText = isVisible
        ? `#${windowOffset + currentIndex} Re-render`
        : reRenders > 0
          ? `×${reRenders}`
          : "";

      let formattedTime: string | undefined;
      if (reRenders > 0 && currentIndex >= 0 && currentIndex < updates.length) {
        const time = updates[currentIndex]?.fiberInfo?.selfTime;
        formattedTime =
          time > 0
            ? time < 0.1 - Number.EPSILON
              ? "< 0.1ms"
              : `${Number(time.toFixed(1))}ms`
            : undefined;
      }

      // TODO(Alexis): can be computed signal
      rerendersElement.dataset.text = headerText ? ` • ${headerText}` : "";
      timingElement.dataset.text = formattedTime ? ` • ${formattedTime}` : "";
    });
  });

  const componentName = createMemo(() => {
    const fiber = currentFiber();
    if (!fiber) return null;
    const { name, wrappers, wrapperTypes } = getExtendedDisplayName(fiber);

    const title = wrappers.length
      ? `${wrappers.join("(")}(${name})${")".repeat(wrappers.length)}`
      : (name ?? "");

    const firstWrapperType = wrapperTypes[0];
    return (
      <span title={title} class="flex items-center gap-x-1">
        {name ?? "Unknown"}
        <span
          title={firstWrapperType?.title}
          class="flex items-center gap-x-1 text-[10px] text-purple-400"
        >
          <Show when={firstWrapperType}>
            {(wrapperType) => (
              <>
                <span
                  class={cn(
                    "rounded py-[1px] px-1",
                    "truncate",
                    wrapperType().compiler && "bg-purple-800 text-neutral-400",
                    !wrapperType().compiler && "bg-neutral-700 text-neutral-300",
                    wrapperType().type === "memo" && "bg-[#5f3f9a] text-white",
                  )}
                >
                  {wrapperType().type}
                </span>
                <Show when={wrapperType().compiler}>
                  <span class="text-yellow-300">✨</span>
                </Show>
              </>
            )}
          </Show>
        </span>
        <Show when={wrapperTypes.length > 1}>
          <span class="text-[10px] text-neutral-400">×{wrapperTypes.length - 1}</span>
        </Show>
      </span>
    );
  });

  return (
    <div class="absolute inset-0 flex translate-y-0 items-center gap-x-2 transition-transform duration-300">
      {componentName()}
      {/* useless info */}
      <div class="flex items-center gap-x-2 mr-auto text-xs text-[#888]">
        <span
          ref={rerendersElement}
          class="with-data-text cursor-pointer !overflow-visible"
          title="Click to toggle between rerenders and total renders"
        />
        <span ref={timingElement} class="with-data-text !overflow-visible" />
      </div>
    </div>
  );
};
