import { createMemo, type Accessor, type JSX } from "solid-js";
import { getInspectState } from "../../core/native-state";
import { getWidgetView } from "../state";
import { cn } from "../utils/helpers";
import { Header } from "../widget/header";
import { ViewInspector } from "./inspector";
import { NotificationWrapper } from "./notifications/notifications";

const isInspecting = () => getInspectState().kind === "inspecting";

const headerClassName = () =>
  cn(
    "relative flex flex-1 flex-col overflow-hidden rounded-xl opacity-100",
    "transition-opacity",
    isInspecting() && "opacity-0 duration-0 delay-0",
  );

const isInspectorViewOpen = () => getWidgetView().view === "inspector";
const isNotificationsViewOpen = () => getWidgetView().view === "notifications";

export const Content = () => (
  <div
    class={cn(
      "react-scan-panel-content flex flex-1 flex-col overflow-hidden rounded-xl",
      "border border-[var(--rs-border-subtle)]",
      "bg-[var(--rs-panel-bg)] text-[var(--rs-text-primary)]",
      "[box-shadow:var(--rs-shadow)]",
    )}
  >
    <div class={headerClassName()}>
      <Header />
      <div
        class={cn(
          "relative flex flex-1 overflow-hidden",
          "bg-[var(--rs-panel-bg)] text-[var(--rs-text-primary)]",
          "transition-opacity delay-150",
        )}
      >
        <ContentView isOpen={isInspectorViewOpen}>
          <ViewInspector />
        </ContentView>
        <ContentView isOpen={isNotificationsViewOpen}>
          <NotificationWrapper />
        </ContentView>
      </div>
    </div>
  </div>
);

interface ContentViewProps {
  isOpen: Accessor<boolean>;
  children: JSX.Element;
}

const ContentView = (props: ContentViewProps) => {
  const className = createMemo(() =>
    cn(
      "flex-1 opacity-0 overflow-y-auto overflow-x-hidden",
      "transition-opacity delay-0 pointer-events-none",
      props.isOpen() && "opacity-100 delay-150 pointer-events-auto",
    ),
  );

  return (
    <div class={className()}>
      <div class="absolute inset-0 flex">{props.children}</div>
    </div>
  );
};
