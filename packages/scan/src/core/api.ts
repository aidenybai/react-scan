import { FiberRenders } from "./notifications/performance";
import { PerformanceInteraction } from "./notifications/types";

type LongFrameListener = (data: {
  duration: number;
  renders: FiberRenders;
  fps: number;
}) => void;

type InteractionListener = (data: {
  kind: "interaction-start"
} | {
  kind: "interaction-end"
  duration: number;
  type: "keyboard" | "pointer";
  performanceEntry: PerformanceInteraction | null;
  renders: FiberRenders;
}) => void;

export const longFrameSubscribers: Array<LongFrameListener> = [];
export const interactionSubscribers: Array<InteractionListener> = [];

/**
 *
 */
export const onLongFrame = (subscribe: LongFrameListener) => {
  longFrameSubscribers.push(subscribe);
};

/**
 *
 *
 */
export const onInteraction = (subscribe: InteractionListener) => {
  interactionSubscribers.push(subscribe);
};

/**
 *
 */
export const mergeSlowdowns = () => {};

/**
 *
 */
export const onReportCommit = () => {};

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    // 'entry' is a PerformanceResourceTiming object
    // console.log(`entry:`, entry);

    // if (
    //   // @ts-expect-error
    //   entry.initiatorType === "fetch" ||
    //   // @ts-expect-error
    //   entry.initiatorType === "xmlhttprequest"
    // ) {
    //   // This is a good point to consider the "start" of your listener
    //   // listener(entry.name, 'start');

    //   // The 'responseEnd' indicates the resource has been fully downloaded.
    //   // If it's a JSON response, this is when you'd know it's "done".

    //   // @ts-expect-error
    //   console.log(`Response End: ${entry.responseEnd}`); // "end"
    //   // listener(entry.name, 'end');
    // }
  });
});

observer.observe({ type: "resource", buffered: true });
