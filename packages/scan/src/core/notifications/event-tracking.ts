import { not_globally_unique_generateId } from "../utils";
import {
  FiberRenders,
  PerformanceEntryChannelEvent,
  TimeoutStage,
  clearPerformanceEntries,
  hasPendingPerformanceEntries,
  listenForPerformanceEntryInteractions,
  listenForRenders,
  setupDetailedPointerTimingListener,
  setupPerformancePublisher,
} from "./performance";
import { BoundedArray } from "./performance-utils";

type FinalInteraction = {
  detailedTiming: TimeoutStage;
  latency: number;
  completedAt: number;
};

let accumulatedFiberRendersOverTask: null | FiberRenders = null;
type InteractionEvent = {
  kind: "interaction";
  data: {
    startAt: number;
    endAt: number;
    meta: {
      detailedTiming: TimeoutStage;
      latency: number;
      kind: PerformanceEntryChannelEvent["kind"];
    };
  };
};

type LongRenderPipeline = {
  kind: "long-render";
  data: {
    startAt: number;
    endAt: number;
    meta: {
      latency: number;
      fiberRenders: FiberRenders;
      fps: number;
    };
  };
};

export type SlowdownEvent = (InteractionEvent | LongRenderPipeline) & {
  id: string;
};

const EVENT_STORE_CAPACITY = 200;
let toolbarEvents = new BoundedArray<SlowdownEvent>(EVENT_STORE_CAPACITY);
const toolbarEventSubscribers = new Set<() => void>();

export const getToolbarEvents = (): BoundedArray<SlowdownEvent> => toolbarEvents;

export const subscribeToolbarEvents = (subscriber: () => void): (() => void) => {
  toolbarEventSubscribers.add(subscriber);
  return () => {
    toolbarEventSubscribers.delete(subscriber);
  };
};

export const clearToolbarEvents = (): void => {
  toolbarEvents = new BoundedArray(EVENT_STORE_CAPACITY);
  toolbarEventSubscribers.forEach((subscriber) => subscriber());
};

const addToolbarEvent = (event: SlowdownEvent): void => {
  const events = [...toolbarEvents, event];
  const applyOverlapCheckToLongRenderEvent = (
    longRenderEvent: LongRenderPipeline & { id: string },
    onOverlap: (overlapsWith: InteractionEvent & { id: string }) => void,
  ) => {
    const overlapsWith = events.find(
      (candidateEvent): candidateEvent is InteractionEvent & { id: string } => {
        if (candidateEvent.kind === "long-render") {
          return false;
        }

        if (candidateEvent.id === longRenderEvent.id) {
          return false;
        }

        /**
         * |---x-----------x------ (interaction)
         * |x-----------x          (long-render)
         */

        if (
          longRenderEvent.data.startAt <= candidateEvent.data.startAt &&
          longRenderEvent.data.endAt <= candidateEvent.data.endAt &&
          longRenderEvent.data.endAt >= candidateEvent.data.startAt
        ) {
          return true;
        }

        /**
             * |x-----------x---- (interaction)
             * |--x------------x  (long-render)
             *

             */

        if (
          candidateEvent.data.startAt <= longRenderEvent.data.startAt &&
          candidateEvent.data.endAt >= longRenderEvent.data.startAt
        ) {
          return true;
        }

        /**
         *
         * |--x-------------x    (interaction)
         * |x------------------x (long-render)
         *
         */

        if (
          longRenderEvent.data.startAt <= candidateEvent.data.startAt &&
          longRenderEvent.data.endAt >= candidateEvent.data.endAt
        ) {
          return true;
        }
        return false;
      },
    );

    if (overlapsWith) {
      onOverlap(overlapsWith);
    }
  };

  const eventIdsToRemove = new Set<string>();
  events.forEach((candidateEvent) => {
    if (candidateEvent.kind === "interaction") return;
    applyOverlapCheckToLongRenderEvent(candidateEvent, () => {
      eventIdsToRemove.add(candidateEvent.id);
    });
  });

  toolbarEvents = BoundedArray.fromArray(
    events.filter((candidateEvent) => !eventIdsToRemove.has(candidateEvent.id)),
    EVENT_STORE_CAPACITY,
  );
  toolbarEventSubscribers.forEach((subscriber) => subscriber());
};

let taskDirtyAt: null | number = null;
let taskDirtyOrigin: null | number = null;

let previousTrackCurrentMouseOverElementCallback: ((e: MouseEvent) => void) | null = null;

let overToolbar: boolean | null;

const trackCurrentMouseOverToolbar = () => {
  const callback = (e: MouseEvent) => {
    overToolbar = e
      .composedPath()
      .map((path) => (path as Element).id)
      .filter(Boolean)
      .includes("react-scan-toolbar");
  };

  document.addEventListener("mouseover", callback);
  previousTrackCurrentMouseOverElementCallback = callback;

  return () => {
    if (previousTrackCurrentMouseOverElementCallback) {
      document.removeEventListener("mouseover", previousTrackCurrentMouseOverElementCallback);
    }
  };
};

// stops long tasks b/c backgrounded from being reported
const startDirtyTaskTracking = () => {
  const onVisibilityChange = () => {
    taskDirtyAt = performance.now();
    taskDirtyOrigin = performance.timeOrigin;
  };

  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
};

export const HIGH_SEVERITY_FPS_DROP_TIME = 150;

let framesDrawnInTheLastSecond: Array<number> = [];

function startLongPipelineTracking() {
  let rafHandle: number;
  let timeoutHandle: ReturnType<typeof setTimeout>;

  function measure() {
    let unSub: (() => void) | null = null;
    accumulatedFiberRendersOverTask = null;
    accumulatedFiberRendersOverTask = {};
    unSub = listenForRenders(accumulatedFiberRendersOverTask);
    const startOrigin = performance.timeOrigin;
    const startTime = performance.now();
    rafHandle = requestAnimationFrame(() => {
      // very low overhead, on the order of dozens of microseconds to run
      timeoutHandle = setTimeout(() => {
        const endNow = performance.now();
        const duration = endNow - startTime;
        const endOrigin = performance.timeOrigin;
        framesDrawnInTheLastSecond.push(endNow + endOrigin);

        const framesInTheLastSecond = framesDrawnInTheLastSecond.filter(
          (frameAt) => endNow + endOrigin - frameAt <= 1000,
        );

        const fps = framesInTheLastSecond.length;
        framesDrawnInTheLastSecond = framesInTheLastSecond;

        const taskConsideredDirty =
          taskDirtyAt !== null && taskDirtyOrigin !== null
            ? endNow + endOrigin - (taskDirtyOrigin + taskDirtyAt) < 100
            : null;
        // not useful to report slowdowns caused by things like outlines (can get expensive not fully optimized)
        const wasTaskInfluencedByToolbar = overToolbar !== null && overToolbar;

        if (
          duration > HIGH_SEVERITY_FPS_DROP_TIME &&
          !taskConsideredDirty &&
          document.visibilityState === "visible" &&
          !wasTaskInfluencedByToolbar
        ) {
          const endAt = endOrigin + endNow;
          const startAt = startTime + startOrigin;

          addToolbarEvent({
            kind: "long-render",
            id: not_globally_unique_generateId(),
            data: {
              endAt: endAt,
              startAt: startAt,
              meta: {
                // oxlint-disable-next-line typescript/no-non-null-assertion
                fiberRenders: accumulatedFiberRendersOverTask!,
                latency: duration,
                fps,
              },
            },
          });
        }

        taskDirtyAt = null;
        taskDirtyOrigin = null;

        unSub?.();
        measure();
      }, 0);
    });
    return unSub;
  }

  const measureUnSub = measure();

  return () => {
    measureUnSub();
    cancelAnimationFrame(rafHandle);
    clearTimeout(timeoutHandle);
  };
}
export const startTimingTracking = () => {
  const unSubPerformance = setupPerformancePublisher();
  const unSubMouseOver = trackCurrentMouseOverToolbar();
  const unSubDirtyTaskTracking = startDirtyTaskTracking();
  const unSubLongPipelineTracking = startLongPipelineTracking();

  const onComplete = async (
    _: string,
    finalInteraction: FinalInteraction,
    event: PerformanceEntryChannelEvent,
  ) => {
    addToolbarEvent({
      kind: "interaction",
      id: not_globally_unique_generateId(),
      data: {
        startAt: finalInteraction.detailedTiming.blockingTimeStart,
        endAt: performance.now() + performance.timeOrigin,
        meta: { ...finalInteraction, kind: event.kind }, // TODO, will need interaction specific metadata here
      },
    });

    finalInteraction.detailedTiming.stopListeningForRenders();

    if (hasPendingPerformanceEntries()) {
      // then performance entry and our detailed timing handlers are out of sync, we disregard that entry
      // it may be possible the performance entry returned before detailed timing. If that's the case we should update
      // assumptions and deal with mapping the entry back to the detailed timing here
      clearPerformanceEntries();
    }
  };
  const unSubDetailedPointerTiming = setupDetailedPointerTimingListener("pointer", {
    onComplete,
  });
  const unSubDetailedKeyboardTiming = setupDetailedPointerTimingListener("keyboard", {
    onComplete,
  });

  const unSubInteractions = listenForPerformanceEntryInteractions();

  return () => {
    unSubMouseOver();
    unSubDirtyTaskTracking();
    unSubLongPipelineTracking();
    unSubPerformance();
    unSubDetailedPointerTiming();
    unSubInteractions();
    unSubDetailedKeyboardTiming();
  };
};
