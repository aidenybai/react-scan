import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { Store } from "~core/index";
import { Icon } from "~web/components/icon";
import { COPY_FEEDBACK_DURATION_MS } from "~web/constants";
import { useDelayedValue } from "~web/hooks/use-delayed-value";
import { signalWidgetViews } from "~web/state";
import { copyFocusedElement } from "~web/utils/copy-focused-element";
import { hasNonEmptyTextSelection } from "~web/utils/has-non-empty-text-selection";
import { cn } from "~web/utils/helpers";
import { isInputLikeFocused } from "~web/utils/is-input-like-focused";
import { isMac } from "~web/utils/is-mac";
import { isUserReactGrabActive } from "~web/utils/is-user-react-grab-active";
import { HeaderInspect } from "~web/views/inspector/header";

export const Header = () => {
  const isInitialView = useDelayedValue(Store.inspectState.value.kind === "focused", 150, 0);
  const isCopied = useSignal(false);

  const handleClose = () => {
    signalWidgetViews.value = {
      view: "none",
    };
    Store.inspectState.value = {
      kind: "inspect-off",
    };
  };

  const handleCopy = async () => {
    const state = Store.inspectState.value;
    if (state.kind !== "focused" || !state.focusedDomElement) return;
    const didCopy = await copyFocusedElement(state.focusedDomElement);
    if (!didCopy) return;
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
      handleClose();
    }, COPY_FEEDBACK_DURATION_MS);
  };

  const refHandleCopy = useRef(handleCopy);
  refHandleCopy.current = handleCopy;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = Store.inspectState.value;
      if (state.kind !== "focused" || !state.focusedDomElement) return;
      if (isUserReactGrabActive()) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey || event.altKey) return;
      if (event.key !== "c" && event.code !== "KeyC") return;
      if (isInputLikeFocused() || hasNonEmptyTextSelection()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void refHandleCopy.current();
    };

    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);

  const isHeaderIsNotifications = signalWidgetViews.value.view === "notifications";

  if (isHeaderIsNotifications) {
    return;
  }

  const isFocused = Store.inspectState.value.kind === "focused";
  const copyShortcutLabel = isMac() ? "⌘C" : "Ctrl+C";

  return (
    <div className="react-scan-header">
      <div className="relative flex-1 h-full">
        <div className={cn("react-scan-header-item is-visible", !isInitialView && "!duration-0")}>
          <HeaderInspect />
        </div>
      </div>

      {isFocused && (
        <button
          type="button"
          title={`Copy element (${copyShortcutLabel})`}
          className="react-scan-close-button"
          onClick={handleCopy}
        >
          <Icon
            name={isCopied.value ? "icon-check" : "icon-copy"}
            className={cn(isCopied.value && "text-green-500")}
          />
        </button>
      )}

      <button type="button" title="Close" className="react-scan-close-button" onClick={handleClose}>
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
