import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { getInspectState, setInspectState } from "../../core/native-state";
import { Icon } from "../components/icon";
import { COPY_FEEDBACK_DURATION_MS, HEADER_TRANSITION_DELAY_MS } from "../constants";
import { createDelayedValue } from "../hooks/use-delayed-value";
import { getWidgetView, setWidgetView } from "../state";
import { copyFocusedElement } from "../utils/copy-focused-element";
import { hasNonEmptyTextSelection } from "../utils/has-non-empty-text-selection";
import { cn } from "../utils/helpers";
import { isInputLikeFocused } from "../utils/is-input-like-focused";
import { isMac } from "../utils/is-mac";
import { isUserReactGrabActive } from "../utils/is-user-react-grab-active";
import { HeaderInspect } from "../views/inspector/header";

export const Header = () => {
  const isInitialView = createDelayedValue(
    () => getInspectState().kind === "focused",
    HEADER_TRANSITION_DELAY_MS,
    0,
  );
  const [isCopied, setIsCopied] = createSignal(false);
  let copyTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const handleClose = () => {
    setWidgetView({
      view: "none",
    });
    setInspectState({
      kind: "inspect-off",
    });
  };

  const handleCopy = async () => {
    const state = getInspectState();
    if (state.kind !== "focused" || !state.focusedDomElement) return;
    const didCopy = await copyFocusedElement(state.focusedDomElement);
    if (!didCopy) return;
    setIsCopied(true);
    copyTimeoutId = setTimeout(() => {
      setIsCopied(false);
      handleClose();
    }, COPY_FEEDBACK_DURATION_MS);
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = getInspectState();
      if (state.kind !== "focused" || !state.focusedDomElement) return;
      if (isUserReactGrabActive()) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey || event.altKey) return;
      if (event.key !== "c" && event.code !== "KeyC") return;
      if (isInputLikeFocused() || hasNonEmptyTextSelection()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void handleCopy();
    };

    document.addEventListener("keydown", onKeyDown, { capture: true });
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown, { capture: true });
      clearTimeout(copyTimeoutId);
    });
  });

  const isFocused = () => getInspectState().kind === "focused";
  const copyShortcutLabel = isMac() ? "⌘C" : "Ctrl+C";

  return (
    <Show when={getWidgetView().view !== "notifications"}>
      <div class="react-scan-header">
        <div class="relative flex-1 h-full">
          <div class={cn("react-scan-header-item is-visible", !isInitialView() && "!duration-0")}>
            <HeaderInspect />
          </div>
        </div>

        <Show when={isFocused()}>
          <button
            type="button"
            title={`Copy element (${copyShortcutLabel})`}
            class="react-scan-close-button"
            onClick={handleCopy}
          >
            <Icon
              name={isCopied() ? "icon-check" : "icon-copy"}
              class={cn(isCopied() && "text-green-500")}
            />
          </button>
        </Show>

        <button type="button" title="Close" class="react-scan-close-button" onClick={handleClose}>
          <Icon name="icon-close" />
        </button>
      </div>
    </Show>
  );
};
