import type { SnapEdge } from "./types";
import { Icon } from "../components/icon";

interface CollapsedIndicatorProps {
  edge: SnapEdge;
  onExpand: (event: MouseEvent) => void;
}

export const CollapsedIndicator = (props: CollapsedIndicatorProps) => (
  <button
    type="button"
    aria-label="Expand React Scan"
    title="Expand React Scan"
    onClick={props.onExpand}
    class="react-scan-interactive-scale relative flex size-full items-center justify-center overflow-hidden rounded-full bg-[#8e61e3] text-white"
  >
    <span
      class="absolute rounded-full bg-white/25"
      classList={{
        "inset-x-0 top-0 h-px": props.edge === "top",
        "inset-x-0 bottom-0 h-px": props.edge === "bottom",
        "inset-y-0 left-0 w-px": props.edge === "left",
        "inset-y-0 right-0 w-px": props.edge === "right",
      }}
    />
    <Icon name="icon-react-scan-logo" size={12} />
  </button>
);
