import type { Fiber } from "bippy";

export interface InspectingState {
  kind: "inspecting";
  hoveredDomElement: Element | null;
}

export interface InspectOffState {
  kind: "inspect-off";
}

export interface FocusedState {
  kind: "focused";
  focusedDomElement: Element;
  fiber: Fiber;
}

export interface UninitializedState {
  kind: "uninitialized";
}

export type States = InspectingState | InspectOffState | FocusedState | UninitializedState;
