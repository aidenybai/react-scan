import { signal } from '@preact/signals';
import type { Fiber } from 'bippy';
import { flashManager } from './flash-overlay';
import {
  type InspectorData,
  type SectionData,
  resetStateTracking,
} from './overlay/utils';

export interface TimelineUpdate {
  fiber: Fiber;
  timestamp: number;
  props: SectionData;
  state: SectionData;
  context: SectionData;
  stateNames: string[];
}

export interface TimelineState {
  updates: TimelineUpdate[];
  currentIndex: number;
  isReplaying: boolean;
  totalUpdates: number;
}

export const TIMELINE_MAX_UPDATES = 100;

const timelineStateDefault: TimelineState = {
  updates: [],
  currentIndex: -1,
  isReplaying: false,
  totalUpdates: 0,
};

export const timelineState = signal<TimelineState>(timelineStateDefault);

interface InspectorState extends InspectorData {
  fiber: Fiber | null;
}

const inspectorStateDefault: InspectorState = {
  fiber: null,
  fiberProps: {
    current: [],
    changes: new Set(),
    changesCounts: new Map(),
  },
  fiberState: {
    current: [],
    changes: new Set(),
    changesCounts: new Map(),
  },
  fiberContext: { current: [], changes: new Set(), changesCounts: new Map() },
};

export const inspectorState = signal<InspectorState>(inspectorStateDefault);

export const globalInspectorState = {
  lastRendered: new Map<string, unknown>(),
  expandedPaths: new Set<string>(),
  cleanup: () => {
    globalInspectorState.lastRendered.clear();
    globalInspectorState.expandedPaths.clear();
    flashManager.cleanupAll();
    resetStateTracking();
    inspectorState.value = inspectorStateDefault;
    timelineState.value = {
      updates: [],
      currentIndex: -1,
      isReplaying: false,
      totalUpdates: 0,
    };
  },
};
