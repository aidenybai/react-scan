import { createEffect, createSignal, onCleanup, Show, type JSX } from "solid-js";
import { TOOLBAR_Z_INDEX, TOOLTIP_DELAY_MS, TOOLTIP_GRACE_PERIOD_MS } from "../../constants";
import { cn } from "../../utils/helpers";

interface TooltipProps {
  visible: boolean;
  position: "top" | "bottom" | "left" | "right";
  children: JSX.Element;
}

let lastCloseTimestamp = 0;

export const Tooltip = (props: TooltipProps) => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [shouldAnimate, setShouldAnimate] = createSignal(true);
  let delayTimeoutId: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    clearTimeout(delayTimeoutId);
    if (!props.visible) {
      if (isVisible()) lastCloseTimestamp = Date.now();
      setIsVisible(false);
      return;
    }

    if (Date.now() - lastCloseTimestamp < TOOLTIP_GRACE_PERIOD_MS) {
      setShouldAnimate(false);
      setIsVisible(true);
      return;
    }

    setShouldAnimate(true);
    delayTimeoutId = setTimeout(() => setIsVisible(true), TOOLTIP_DELAY_MS);
  });

  onCleanup(() => {
    clearTimeout(delayTimeoutId);
    if (isVisible()) lastCloseTimestamp = Date.now();
  });

  const positionStyle = (): JSX.CSSProperties =>
    props.position === "top" || props.position === "bottom"
      ? {
          left: "50%",
          translate: "-50%",
          "z-index": TOOLBAR_Z_INDEX,
        }
      : {
          top: "50%",
          translate: "0 -50%",
          "z-index": TOOLBAR_Z_INDEX,
        };

  return (
    <Show when={isVisible()}>
      <div
        class={cn(
          "absolute whitespace-nowrap px-2 py-0.5 rounded-full",
          "text-[10px] font-sans font-medium leading-4 pointer-events-none",
          "bg-[var(--rs-panel-bg)] text-[var(--rs-text-primary)]",
          "[box-shadow:var(--rs-shadow)]",
          props.position === "top" && "bottom-full mb-2.5",
          props.position === "bottom" && "top-full mt-2.5",
          props.position === "left" && "right-full mr-2.5",
          props.position === "right" && "left-full ml-2.5",
          shouldAnimate() && "animate-[react-scan-tooltip-in_100ms_ease-out]",
        )}
        style={positionStyle()}
      >
        {props.children}
      </div>
    </Show>
  );
};
