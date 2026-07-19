import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { getFPS } from "../../core/instrumentation";
import { FPS_SAMPLE_INTERVAL_MS } from "../constants";
import { cn } from "../utils/helpers";

interface FpsMeterInnerProps {
  fps: number;
}

const FpsMeterInner = (props: FpsMeterInnerProps) => {
  const getColor = (fps: number) => {
    if (fps < 30) return "#EF4444";
    if (fps < 50) return "#F59E0B";
    return "rgb(214,132,245)";
  };

  return (
    <div
      class={cn(
        "flex items-center gap-x-1 px-2 w-full",
        "h-6",
        "rounded-md",
        "font-mono leading-none",
        "bg-[#141414]",
        "ring-1 ring-white/[0.08]",
      )}
    >
      <div
        style={{ color: getColor(props.fps) }}
        class="text-sm font-semibold tracking-wide transition-colors ease-in-out w-full flex justify-center items-center"
      >
        {props.fps}
      </div>
      <span class="text-white/30 text-[11px] font-medium tracking-wide ml-auto min-w-fit">FPS</span>
    </div>
  );
};

export const FPSMeter = () => {
  const [fps, setFps] = createSignal<number>();

  onMount(() => {
    const intervalId = setInterval(() => {
      setFps(getFPS());
    }, FPS_SAMPLE_INTERVAL_MS);
    onCleanup(() => clearInterval(intervalId));
  });

  return (
    <div
      class={cn(
        "flex items-center justify-end gap-x-2 px-1 ml-1 w-[72px]",
        "whitespace-nowrap text-sm text-white",
      )}
    >
      <Show when={fps()}>{(currentFps) => <FpsMeterInner fps={currentFps()} />}</Show>
    </div>
  );
};
