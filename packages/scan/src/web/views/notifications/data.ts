import { createContext } from 'preact';
import { SetStateAction } from 'preact/compat';
import { Dispatch, useContext } from 'preact/hooks';
import { HIGH_SEVERITY_FPS_DROP_TIME } from '~core/notifications/event-tracking';
import { getFiberFromElement } from '../inspector/utils';
import { hasMemoCache } from 'bippy';

export type GroupedFiberRender = {
  id: string;
  name: string;
  count: number;
  changes: {
    props: Array<{ name: string; count: number }>;
    state: Array<{ index: number; count: number }>;
    context: Array<{ name: string; count: number }>;
  };
  // fixme: incorrect assumption, make this nullable
  /** Not available when running in production, but we will not render notifications in production */
  totalTime: number;
  elements: Array<Element>; // can't do a weak set because need to iterate over them......
  deletedAll: boolean;
  parents: Set<string>;
  hasMemoCache: boolean;
};
export const getComponentName = (path: Array<string>) => {
  const filteredPath = path.filter((item) => item.length > 2);
  // in production, all names can be minified
  if (filteredPath.length === 0) {
    return path.at(-1) ?? 'Unknown';
  }
  // biome-ignore lint/style/noNonNullAssertion: invariant
  return filteredPath.at(-1)!;
};

export const getTotalTime = (
  timing: InteractionTiming | DroppedFramesTiming,
) => {
  switch (timing.kind) {
    case 'interaction': {
      const {
        renderTime,
        otherJSTime,
        framePreparation,
        frameConstruction,
        frameDraw,
      } = timing;
      return (
        renderTime +
        otherJSTime +
        framePreparation +
        frameConstruction +
        (frameDraw ?? 0)
      );
    }
    case 'dropped-frames': {
      return timing.otherTime + timing.renderTime;
    }
  }
};

export type DroppedFramesTiming = {
  kind: 'dropped-frames';
  renderTime: number;
  otherTime: number;
};
export type InteractionTiming = {
  kind: 'interaction';
  renderTime: number;
  otherJSTime: number;
  /** After JS, before paint. Things like layerize, css style recalcs */
  framePreparation: number;
  /** paint/commit. This is where the browser constructs the data structure that represents what will be drawn to screen */
  frameConstruction: number;
  /** GPU/compositing/rasterization. This is where, off the main thread, the data structure built is used to draw the next frame. This value is not available on safari due to lack of PerformanceEntry API */
  frameDraw: number | null;
};

export const isRenderMemoizable = (
  groupedFiberRender: GroupedFiberRender,
): boolean => {
  // this shouldn't be needed, it implies we either are tracking renders wrong, are tracking changes wrong, or are not tracking some other "state" that can cause re-renders
  if (groupedFiberRender.hasMemoCache) {
    return false;
  }

  return (
    groupedFiberRender.changes.context.length === 0 &&
    groupedFiberRender.changes.props.length === 0 &&
    groupedFiberRender.changes.state.length === 0
  );
};

export const getTimeSplit = (
  timing: DroppedFramesTiming | InteractionTiming,
) => {
  switch (timing.kind) {
    case 'dropped-frames': {
      return {
        render: timing.renderTime,
        other: timing.otherTime,
      };
    }
    case 'interaction': {
      return {
        render: timing.renderTime,
        other: getTotalTime(timing) + timing.renderTime,
      };
    }
  }
};

export type InteractionEvent = {
  kind: 'interaction';
  type: 'click' | 'keyboard';
  id: string;
  componentPath: Array<string>;
  groupedFiberRenders: Array<GroupedFiberRender>;
  timing: InteractionTiming;
  /** Not available in safari, and API used to get value is not stable on chrome */
  memory: number | null;
  timestamp: number;
};
export type DroppedFramesEvent = {
  kind: 'dropped-frames';
  id: string;
  groupedFiberRenders: Array<GroupedFiberRender>;
  timing: DroppedFramesTiming;
  /** Not available in safari, and API used to get value is not stable on chrome */
  memory: number | null;
  timestamp: number;
  fps: number;
};
export type NotificationEvent = InteractionEvent | DroppedFramesEvent;

export type NotificationsState = {
  events: Array<NotificationEvent>;
  // todo: discriminated union this all, i don't want to do it yet till i stabilize the data i need/ implement it all
  selectedEvent: NotificationEvent | null;
  filterBy: 'severity' | 'latest';
  selectedFiber: NotificationEvent['groupedFiberRenders'][number] | null;
  detailsExpanded: boolean;
  moreInfoExpanded: boolean;
  route:
    | 'render-visualization'
    | 'other-visualization'
    // | "render-guide"
    | 'render-explanation'
    // | "other-guide"
    | 'optimize';
  /**
   * Conceptually a synthetic query parameter
   */
  routeMessage: null | {
    kind: 'auto-open-overview-accordion';
    name:
      | 'other-not-javascript'
      | 'other-javascript'
      | 'render'
      | 'other-frame-drop';
  };
  audioNotificationsOptions:
    | {
        audioContext: null;
        enabled: false;
      }
    | {
        enabled: true;
        audioContext: AudioContext;
      };
};

export const getEventSeverity = (event: NotificationEvent) => {
  const totalTime = getTotalTime(event.timing);
  switch (event.kind) {
    case 'interaction': {
      if (totalTime < 200) return 'low';
      if (totalTime < 500) return 'needs-improvement';
      return 'high';
    }
    case 'dropped-frames': {
      if (totalTime < 50) return 'low';
      if (totalTime < HIGH_SEVERITY_FPS_DROP_TIME) return 'needs-improvement';
      return 'high';
    }
  }
};

export const getReadableSeverity = (
  severity: 'low' | 'needs-improvement' | 'high',
) => {
  switch (severity) {
    case 'high': {
      return 'Poor';
    }
    case 'needs-improvement': {
      return 'Laggy';
    }
    case 'low': {
      return 'Good';
    }
  }
};
export const NOTIFICATIONS_BORDER = '#27272A';
export const useNotificationsContext = () =>
  useContext(NotificationStateContext);

export const NotificationStateContext = createContext<{
  notificationState: NotificationsState;
  setNotificationState: Dispatch<SetStateAction<NotificationsState>>;
  setRoute: ({
    route,
    routeMessage,
  }: {
    route: NotificationsState['route'];
    routeMessage: NotificationsState['routeMessage'] | null;
  }) => void;
  // biome-ignore lint/style/noNonNullAssertion: we do not use default context values
}>(null!);
