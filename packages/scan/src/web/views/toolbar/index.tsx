import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js";
import { type LocalStorageOptions, ReactScanInternals } from "../../../core/index";
import { getInspectState, getOptionsState, setInspectState } from "../../../core/native-state";
import { Icon } from "../../components/icon";
import { Tooltip } from "../../components/tooltip";
import { Toggle } from "../../components/toggle";
import { NOTIFICATION_LAG_MS } from "../../constants";
import { getWidgetView, setWidgetView } from "../../state";
import { cn, readLocalStorage, saveLocalStorage } from "../../utils/helpers";
import { FPSMeter } from "../../widget/fps-meter";
import type { SnapEdge } from "../../widget/types";
import { getEventSeverity } from "../notifications/data";
import { Notification } from "../notifications/icons";
import { useAppNotifications } from "../notifications/notifications";

interface ToolbarProps {
  edge: SnapEdge;
  onCollapse: (event: MouseEvent) => void;
}

export const Toolbar = (props: ToolbarProps) => {
  const events = useAppNotifications();
  const [laggedEvents, setLaggedEvents] = createSignal(events());
  const [seenEvents, setSeenEvents] = createSignal<Array<string>>([]);
  const [hoveredControl, setHoveredControl] = createSignal<
    "inspect" | "notifications" | "collapse" | null
  >(null);
  const inspectState = getInspectState;
  const isInspectActive = () => inspectState().kind === "inspecting";
  const isInspectFocused = () => inspectState().kind === "focused";

  createEffect(() => {
    const nextEvents = events();
    const timeoutId = setTimeout(() => {
      setLaggedEvents(nextEvents);
    }, NOTIFICATION_LAG_MS);
    onCleanup(() => clearTimeout(timeoutId));
  });

  const onToggleInspect = () => {
    const currentState = getInspectState();

    switch (currentState.kind) {
      case "inspecting": {
        setWidgetView({ view: "none" });
        setInspectState({ kind: "inspect-off" });
        return;
      }
      case "focused": {
        setWidgetView({ view: "inspector" });
        setInspectState({
          kind: "inspecting",
          hoveredDomElement: null,
        });
        return;
      }
      case "inspect-off": {
        setWidgetView({ view: "none" });
        setInspectState({
          kind: "inspecting",
          hoveredDomElement: null,
        });
        return;
      }
      case "uninitialized": {
        return;
      }
    }
  };

  const onToggleActive = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!ReactScanInternals.instrumentation) {
      return;
    }
    const isPaused = !ReactScanInternals.instrumentation.getIsPaused();
    ReactScanInternals.instrumentation.setIsPaused(isPaused);
    const existingLocalStorageOptions = readLocalStorage<LocalStorageOptions>("react-scan-options");
    saveLocalStorage("react-scan-options", {
      ...existingLocalStorageOptions,
      enabled: !isPaused,
    });
  };

  createEffect(() => {
    const state = getInspectState();
    if (state.kind === "uninitialized") {
      setInspectState({ kind: "inspect-off" });
    }
  });

  createEffect(() => {
    if (getWidgetView().view !== "notifications") return;
    const ids = new Set(events().map((event) => event.id));
    setSeenEvents([...ids.values()]);
  });

  const inspectIconName = createMemo(() => (isInspectFocused() ? "icon-focus" : "icon-inspect"));
  const isInspectSelected = () => isInspectActive() || isInspectFocused();
  const collapseRotation = () => {
    switch (props.edge) {
      case "top":
        return "-rotate-90";
      case "bottom":
        return "rotate-90";
      case "left":
        return "rotate-180";
      case "right":
        return "";
    }
  };
  const tooltipPosition = (): "top" | "bottom" | "left" | "right" => {
    switch (props.edge) {
      case "top":
        return "bottom";
      case "bottom":
        return "top";
      case "left":
        return "right";
      case "right":
        return "left";
    }
  };

  const showNotifications = () => {
    if (getInspectState().kind !== "inspect-off") {
      setInspectState({ kind: "inspect-off" });
    }
    if (getWidgetView().view === "notifications") {
      setWidgetView({ view: "none" });
      return;
    }
    setSeenEvents(events().map((event) => event.id));
    setWidgetView({ view: "notifications" });
  };

  return (
    <div class="flex h-7 items-center gap-0.5 rounded-full border border-[var(--rs-border-subtle)] bg-[var(--rs-panel-bg)] px-1 text-[var(--rs-text-secondary)] [box-shadow:var(--rs-shadow)]">
      <div class="flex h-5 w-5 items-center justify-center text-[#8e61e3]">
        <Icon name="icon-react-scan-logo" size={14} />
      </div>
      <div
        class="relative size-5"
        onMouseEnter={() => setHoveredControl("inspect")}
        onMouseLeave={() => setHoveredControl(null)}
      >
        <button
          type="button"
          id="react-scan-inspect-element"
          title="Inspect element"
          aria-label="Inspect element"
          aria-pressed={isInspectSelected()}
          onClick={onToggleInspect}
          class={cn(
            "react-scan-interactive-scale react-scan-a11y-hitbox",
            "flex size-5 items-center justify-center rounded-full",
            "hover:bg-[var(--rs-surface-hover)]",
            isInspectSelected() && "bg-[#8e61e3] text-white",
          )}
        >
          <Icon name={inspectIconName()} size={13} />
        </button>
        <Tooltip visible={hoveredControl() === "inspect"} position={tooltipPosition()}>
          Inspect element
        </Tooltip>
      </div>
      <div
        class="relative size-5"
        onMouseEnter={() => setHoveredControl("notifications")}
        onMouseLeave={() => setHoveredControl(null)}
      >
        <button
          type="button"
          id="react-scan-notifications"
          title="Notifications"
          aria-label="Notifications"
          aria-pressed={getWidgetView().view === "notifications"}
          onClick={showNotifications}
          class={cn(
            "react-scan-interactive-scale react-scan-a11y-hitbox",
            "flex size-5 items-center justify-center rounded-full",
            "hover:bg-[var(--rs-surface-hover)]",
            getWidgetView().view === "notifications" &&
              "bg-[var(--rs-surface-active)] text-[#8e61e3]",
          )}
        >
          <Notification
            events={laggedEvents()
              .filter((event) => !seenEvents().includes(event.id))
              .map((event) => getEventSeverity(event) === "high")}
            size={13}
            class="text-current"
          />
        </button>
        <Tooltip visible={hoveredControl() === "notifications"} position={tooltipPosition()}>
          Notifications
        </Tooltip>
      </div>
      <Toggle
        checked={!ReactScanInternals.instrumentation?.getIsPaused()}
        onChange={onToggleActive}
        class="mx-0.5 scale-75"
        title="Outline re-renders"
        aria-label="Outline re-renders"
      />
      <Show when={getOptionsState().showFPS}>
        <FPSMeter />
      </Show>
      <div
        class="relative size-5"
        onMouseEnter={() => setHoveredControl("collapse")}
        onMouseLeave={() => setHoveredControl(null)}
      >
        <button
          type="button"
          title="Collapse React Scan"
          aria-label="Collapse React Scan"
          onClick={props.onCollapse}
          class="react-scan-interactive-scale react-scan-a11y-hitbox flex size-5 items-center justify-center rounded-full hover:bg-[var(--rs-surface-hover)]"
        >
          <Icon
            name="icon-chevron-right"
            size={11}
            class={cn("transition-transform duration-200", collapseRotation())}
          />
        </button>
        <Tooltip visible={hoveredControl() === "collapse"} position={tooltipPosition()}>
          Collapse
        </Tooltip>
      </div>
    </div>
  );
};
