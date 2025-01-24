import { signal } from '@preact/signals';
import type { Fiber } from 'bippy';
import type { ComponentType } from 'preact';
import { flashManager } from './flash-overlay';
import { type SectionData, resetStateTracking } from './overlay/utils';

export interface MinimalFiberInfo {
  key: string | null;
  id?: string | number;
  displayName: string;
  type: ComponentType<unknown> | string;
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
  updates: TimelineUpdate[];
  currentIndex: number;
  playbackSpeed: 1 | 2 | 4;
  totalUpdates: number;
  isVisible: boolean;
  windowOffset: number;
  isViewingHistory: boolean;
  latestFiber: Fiber | null;
}

export const TIMELINE_MAX_UPDATES = 1000;

const timelineStateDefault: TimelineState = {
  updates: [],
  currentIndex: 0,
  playbackSpeed: 1,
  totalUpdates: 0,
  isVisible: false,
  windowOffset: 0,
  isViewingHistory: false,
  latestFiber: null,
};

export const timelineState = signal<TimelineState>(timelineStateDefault);

export const inspectorUpdateSignal = signal<number>(0);

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
    const { updates, totalUpdates, currentIndex, isViewingHistory } =
      timelineState.value;

    const newUpdates = [...updates];
    const newTotalUpdates = totalUpdates + 1;

    if (newUpdates.length >= TIMELINE_MAX_UPDATES) {
      newUpdates.shift();
    }

    newUpdates.push(update);

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

    timelineState.value = {
      ...timelineState.value,
      latestFiber,
      updates: newUpdates,
      totalUpdates: newTotalUpdates,
      windowOffset: newWindowOffset,
      currentIndex: newCurrentIndex,
      isViewingHistory,
    };
  },

  reset: () => {
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
    resetStateTracking();
    timelineState.value = timelineStateDefault;
  },
};
