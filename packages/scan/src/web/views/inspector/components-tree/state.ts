import { signal } from '@preact/signals';
import type { Fiber } from 'bippy';
import type { RenderData } from '~core/instrumentation';

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

export const searchState = signal<{
  query: string;
  matches: FlattenedNode[];
  currentMatchIndex: number;
}>({
  query: '',
  matches: [],
  currentMatchIndex: -1,
});

export interface TreeItem {
  name: string;
  depth: number;
  element: HTMLElement;
  fiber: Fiber;
}

export const signalSkipTreeUpdate = /* @__PURE__ */ signal(false);
