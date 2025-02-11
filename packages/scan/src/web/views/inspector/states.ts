import { signal } from '@preact/signals';
import type { Fiber } from 'bippy';
import type { ComponentType } from 'preact';
import { flashManager } from './flash-overlay';
import { type SectionData, resetTracking } from './timeline/utils';

export interface MinimalFiberInfo {
  id?: string | number;
  key: string | null;
  type: ComponentType<unknown> | string;
  displayName: string;
  selfTime: number;
  totalTime: number;
}

export interface TimelineUpdate {
  timestamp: number;
  fiberInfo: MinimalFiberInfo;
  props: SectionData;
  state: SectionData;
  context: SectionData;
  stateNames: string[];
}

export interface TimelineState {
  updates: Array<TimelineUpdate>;
  currentFiber: Fiber | null;
  totalUpdates: number;
  windowOffset: number;
  currentIndex: number;
  isViewingHistory: boolean;
  latestFiber: Fiber | null;
  isVisible: boolean;
  playbackSpeed: 1 | 2 | 4;
}

export const TIMELINE_MAX_UPDATES = 1000;

export const timelineStateDefault: TimelineState = {
  updates: [],
  currentFiber: null,
  totalUpdates: 0,
  windowOffset: 0,
  currentIndex: 0,
  isViewingHistory: false,
  latestFiber: null,
  isVisible: false,
  playbackSpeed: 1,
};

export const timelineState = signal<TimelineState>(timelineStateDefault);

export const inspectorUpdateSignal = signal<number>(0);

let pendingUpdates: Array<{ update: TimelineUpdate; fiber: Fiber | null }> = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

const batchUpdates = () => {
  if (pendingUpdates.length === 0) return;

  const batchedUpdates = [...pendingUpdates];

  const { updates, totalUpdates, currentIndex, isViewingHistory } =
    timelineState.value;
  const newUpdates = [...updates];
  let newTotalUpdates = totalUpdates;

  for (const { update } of batchedUpdates) {
    if (newUpdates.length >= TIMELINE_MAX_UPDATES) {
      newUpdates.shift();
    }
    newUpdates.push(update);
    newTotalUpdates++;
  }

  const newWindowOffset = Math.max(0, newTotalUpdates - TIMELINE_MAX_UPDATES);

  let newCurrentIndex: number;
  if (isViewingHistory) {
    if (currentIndex === totalUpdates - 1) {
      newCurrentIndex = newUpdates.length - 1;
    } else if (currentIndex === 0) {
      newCurrentIndex = 0;
    } else {
      if (newWindowOffset === 0) {
        newCurrentIndex = currentIndex;
      } else {
        newCurrentIndex = currentIndex - 1;
      }
    }
  } else {
    newCurrentIndex = newUpdates.length - 1;
  }

  const lastUpdate = batchedUpdates[batchedUpdates.length - 1];

  timelineState.value = {
    ...timelineState.value,
    latestFiber: lastUpdate.fiber,
    updates: newUpdates,
    totalUpdates: newTotalUpdates,
    windowOffset: newWindowOffset,
    currentIndex: newCurrentIndex,
    isViewingHistory,
  };

  // Only after signal is updated, remove the processed updates
  pendingUpdates = pendingUpdates.slice(batchedUpdates.length);
};

export const timelineActions = {
  showTimeline: () => {
    timelineState.value = {
      ...timelineState.value,
      isVisible: true,
    };
  },

  hideTimeline: () => {
    timelineState.value = {
      ...timelineState.value,
      isVisible: false,
      currentIndex: timelineState.value.updates.length - 1,
    };
  },

  updateFrame: (index: number, isViewingHistory: boolean) => {
    timelineState.value = {
      ...timelineState.value,
      currentIndex: index,
      isViewingHistory,
    };
  },

  updatePlaybackSpeed: (speed: TimelineState['playbackSpeed']) => {
    timelineState.value = {
      ...timelineState.value,
      playbackSpeed: speed,
    };
  },

  addUpdate: (update: TimelineUpdate, latestFiber: Fiber | null) => {
    pendingUpdates.push({ update, fiber: latestFiber });

    if (!batchTimeout) {
      const processBatch = () => {
        batchUpdates();

        batchTimeout = null;

        if (pendingUpdates.length > 0) {
          batchTimeout = setTimeout(processBatch, 96);
        }
      };

      batchTimeout = setTimeout(processBatch, 96);
    }
  },

  reset: () => {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    pendingUpdates = [];
    timelineState.value = timelineStateDefault;
  },
};

export const globalInspectorState = {
  lastRendered: new Map<string, unknown>(),
  expandedPaths: new Set<string>(),
  cleanup: () => {
    globalInspectorState.lastRendered.clear();
    globalInspectorState.expandedPaths.clear();
    flashManager.cleanupAll();
    resetTracking();
    timelineState.value = timelineStateDefault;
  },
};
