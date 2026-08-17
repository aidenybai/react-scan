import type { Fiber } from "bippy";
import { createSignal } from "solid-js";
import type { RenderData } from "../../../../core/instrumentation";

export interface TreeNode {
  label: string;
  title?: string;
  fiber: Fiber;
  element?: HTMLElement;
  children?: TreeNode[];
  renderData?: RenderData;
}

export interface FlattenedNode extends TreeNode {
  depth: number;
  nodeId: string;
  parentId: string | null;
  fiber: Fiber;
}

export interface SearchState {
  query: string;
  matches: FlattenedNode[];
  currentMatchIndex: number;
}

export const [getSearchState, setSearchState] =
  /* @__PURE__ */ createSignal<SearchState>({
    query: "",
    matches: [],
    currentMatchIndex: -1,
  });

export const [getShouldSkipTreeUpdate, setShouldSkipTreeUpdate] =
  /* @__PURE__ */ createSignal(false);
