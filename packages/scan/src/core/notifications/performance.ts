import {
  Fiber,
  getDisplayName,
  getTimings,
  isHostFiber,
  traverseFiber,
} from 'bippy';
import { Store } from '../..';

import {
  BoundedArray,
  createChildrenAdjacencyList,
  invariantError,
} from '~core/notifications/performance-utils';
import {
  SectionData,
  collectInspectorDataWithoutCounts,
} from '~web/views/inspector/timeline/utils';
import {
  getFiberFromElement,
  getParentCompositeFiber,
} from '~web/views/inspector/utils';
import { performanceEntryChannels } from './performance-store';
import type {
  PerformanceInteraction,
  PerformanceInteractionEntry,
} from './types';
import { not_globally_unique_generateId } from '~core/monitor/utils';
import { getInteractionPath } from '~core/monitor/performance';

const getFirstNameFromAncestor = (
  fiber: Fiber,
  accept: (name: string) => boolean = () => true,
) => {
  let curr: Fiber | null = fiber;

  while (curr) {
    const currName = getDisplayName(curr.type);
    if (currName && accept(currName)) {
      return currName;
    }

    curr = curr.return;
  }
  return null;
};

let unsubscribeTrackVisibilityChange: (() => void) | undefined;
// fixme: compress me if this stays here for bad interaction time checks
let lastVisibilityHiddenAt: number | 'never-hidden' = 'never-hidden';

const trackVisibilityChange = () => {
  unsubscribeTrackVisibilityChange?.();
  const onVisibilityChange = () => {
    if (document.hidden) {
      lastVisibilityHiddenAt = Date.now();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  unsubscribeTrackVisibilityChange = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
};
export type FiberRenders = Record<
  string,
  {
    renderCount: number;
    parents: Set<string>;
    selfTime: number;
    totalTime: number;
    nodeInfo: Array<{
      selfTime: number;
      element: Element;
      name: string;
    }>;
    changes: ReturnType<typeof collectInspectorDataWithoutCounts>;
  }
>;

/**
 * we need to fix:
 * - if there's a tab switch during a task being tracked, then u disregard that task (i hope this doesn't make tab switches hard to debug that cause slowdowns, ug i suppose it probably would, right? Depends how the browser queues it but i suppose u can think of a scenario. It would be most optimal to subtract the timing but not sure how reliable that would be)
 * - we need to see why the tracking is just off
 * - we need to correctly implement the precise activation this time
 */

type InteractionStartStage = {
  kind: 'interaction-start';
  interactionType: 'pointer' | 'keyboard';
  interactionUUID: string;
  interactionStartDetail: number;
  blockingTimeStart: number;
  componentPath: Array<string>;
  componentName: string;
  childrenTree: Record<
    string,
    { children: Array<string>; firstNamedAncestor: string; isRoot: boolean }
  >;
  fiberRenders: FiberRenders;
  stopListeningForRenders: () => void;
};

type JSEndStage = Omit<InteractionStartStage, 'kind'> & {
  kind: 'js-end-stage';
  jsEndDetail: number;
};

type RAFStage = Omit<JSEndStage, 'kind'> & {
  kind: 'raf-stage';
  rafStart: number;
};

export type TimeoutStage = Omit<RAFStage, 'kind'> & {
  kind: 'timeout-stage';
  commitEnd: number;
  blockingTimeEnd: number;
};

export type PerformanceEntryChannelEvent =
  | {
      kind: 'entry-received';
      entry: PerformanceInteraction;
    }
  | {
      kind: 'auto-complete-race';
      interactionUUID: string;
      detailedTiming: TimeoutStage;
    };

export type CompletedInteraction = {
  detailedTiming: TimeoutStage;
  latency: number;
  completedAt: number;
  flushNeeded: boolean;
};

type UnInitializedStage = {
  kind: 'uninitialized-stage';
  // todo: no longer a uuid
  interactionUUID: string;
  interactionType: 'pointer' | 'keyboard';
};

type CurrentInteraction = {
  kind: 'pointer' | 'keyboard';
  interactionUUID: string;
  pointerUpStart: number;
  // needed for when inputs that can be clicked and trigger on change (like checkboxes)
  clickChangeStart: number | null;
  clickHandlerMicroTaskEnd: number | null;
  rafStart: number | null;
  commmitEnd: number | null;
  timeorigin: number;

  // for now i don't trust performance now timing for UTC time...
  blockingTimeStart: number;
  blockingTimeEnd: number | null;
  fiberRenders: Map<
    string,
    {
      renderCount: number;
      parents: Set<string>;
      selfTime: number;
    }
  >;
  componentPath: Array<string>;
  componentName: string;
  childrenTree: Record<
    string,
    { children: Array<string>; firstNamedAncestor: string; isRoot: boolean }
  >;
};

export let currentInteractions: Array<CurrentInteraction> = [];
export const fastHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};
const getInteractionType = (
  eventName: string,
): 'pointer' | 'keyboard' | null => {
  // todo: track pointer down, but tends to not house expensive logic so not very high priority
  if (['pointerup', 'click'].includes(eventName)) {
    return 'pointer';
  }
  if (eventName.includes('key')) {
  }
  if (['keydown', 'keyup'].includes(eventName)) {
    return 'keyboard';
  }
  return null;
};
// biome-ignore lint/suspicious/noExplicitAny: shut up biome
export const getInteractionId = (interaction: any) => {
  return `${interaction.performanceEntry.type}::${normalizePath(interaction.componentPath)}::${interaction.url}`;
};
export function normalizePath(path: string[]): string {
  const cleaned = path.filter(Boolean);

  const deduped = cleaned.filter((name, i) => name !== cleaned[i - 1]);

  return deduped.join('.');
}
let onEntryAnimationId: number | null = null;
const setupPerformanceListener = (
  onEntry: (interaction: PerformanceInteraction) => void,
) => {
  trackVisibilityChange();
  const interactionMap = new Map<string, PerformanceInteraction>();
  const interactionTargetMap = new Map<string, Element>();

  const processInteractionEntry = (entry: PerformanceInteractionEntry) => {
    if (!entry.interactionId) return;

    if (
      entry.interactionId &&
      entry.target &&
      !interactionTargetMap.has(entry.interactionId)
    ) {
      interactionTargetMap.set(entry.interactionId, entry.target);
    }
    if (entry.target) {
      let current: Element | null = entry.target;
      while (current) {
        if (
          current.id === 'react-scan-toolbar-root' ||
          current.id === 'react-scan-root'
        ) {
          return;
        }
        current = current.parentElement;
      }
    }

    const existingInteraction = interactionMap.get(entry.interactionId);

    if (existingInteraction) {
      if (entry.duration > existingInteraction.latency) {
        existingInteraction.entries = [entry];
        existingInteraction.latency = entry.duration;
      } else if (
        entry.duration === existingInteraction.latency &&
        entry.startTime === existingInteraction.entries[0].startTime
      ) {
        existingInteraction.entries.push(entry);
      }
    } else {
      const interactionType = getInteractionType(entry.name);
      if (!interactionType) {
        return;
      }

      const interaction: PerformanceInteraction = {
        id: entry.interactionId,
        latency: entry.duration,
        entries: [entry],
        target: entry.target,
        type: interactionType,
        startTime: entry.startTime,
        endTime: Date.now(),
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        duration: entry.duration,
        inputDelay: entry.processingStart - entry.startTime,
        processingDuration: entry.processingEnd - entry.processingStart,
        presentationDelay:
          entry.duration - (entry.processingEnd - entry.startTime),
        // componentPath:
        timestamp: Date.now(),
        timeSinceTabInactive:
          lastVisibilityHiddenAt === 'never-hidden'
            ? 'never-hidden'
            : Date.now() - lastVisibilityHiddenAt,
        visibilityState: document.visibilityState,
        timeOrigin: performance.timeOrigin,
        referrer: document.referrer,
      };
      //
      interactionMap.set(interaction.id, interaction);

      /**
       * This seems odd, but it gives us determinism that we will receive an entry AFTER our detailed timing collection
       * runs because browser semantics (raf(() => setTimeout) will always run before a doubleRaf)
       *
       * this also handles the case where multiple entries are dispatched for semantically the same interaction,
       * they will get merged into a single interaction, where the largest latency is recorded, which is what
       * we are interested in this application
       */

      if (!onEntryAnimationId) {
        onEntryAnimationId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // biome-ignore lint/style/noNonNullAssertion: invariant
            onEntry(interactionMap.get(interaction.id)!);
            onEntryAnimationId = null;
          });
        });
      }
    }
  };

  const po = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (let i = 0, len = entries.length; i < len; i++) {
      const entry = entries[i];
      processInteractionEntry(entry as PerformanceInteractionEntry);
    }
  });

  try {
    po.observe({
      type: 'event',
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverInit);
    po.observe({
      type: 'first-input',
      buffered: true,
    });
  } catch {
    /* Should collect error logs*/
  }

  return () => po.disconnect();
};

export const setupPerformancePublisher = () => {
  return setupPerformanceListener((entry) => {
    performanceEntryChannels.publish(
      {
        kind: 'entry-received',
        entry,
      },
      'recording',
    );
  });
};

// we should actually only feed it the information it needs to complete so we can support safari
type Task = {
  completeInteraction: (
    entry: PerformanceEntryChannelEvent,
  ) => CompletedInteraction;
  startDateTime: number;
  endDateTime: number;
  type: 'keyboard' | 'pointer';
  interactionUUID: string;
};
export const MAX_INTERACTION_TASKS = 25;

let tasks = new BoundedArray<Task>(MAX_INTERACTION_TASKS);

const getAssociatedDetailedTimingInteraction = (
  entry: PerformanceInteraction,
  activeTasks: Array<Task>,
) => {
  let closestTask: Task | null = null;
  for (const task of activeTasks) {
    if (task.type !== entry.type) {
      continue;
    }

    if (closestTask === null) {
      closestTask = task;
      continue;
    }

    const getAbsoluteDiff = (task: Task, entry: PerformanceInteraction) =>
      Math.abs(task.startDateTime) - (entry.startTime + entry.timeOrigin);

    if (getAbsoluteDiff(task, entry) < getAbsoluteDiff(closestTask, entry)) {
      closestTask = task;
    }
  }

  return closestTask;
};

// this would be cool if it listened for merge, so it had to be after
export const listenForPerformanceEntryInteractions = (
  onComplete: (completedInteraction: CompletedInteraction) => void,
) => {
  // we make the assumption that the detailed timing will be ready before the performance timing
  const unsubscribe = performanceEntryChannels.subscribe(
    'recording',
    (event) => {
      const associatedDetailedInteraction =
        event.kind === 'auto-complete-race'
          ? tasks.find((task) => task.interactionUUID === event.interactionUUID)
          : getAssociatedDetailedTimingInteraction(event.entry, tasks);

      // REMINDME: this likely means we clicked a non interactable thing but our handler still ran
      // so we shouldn't treat this as an invariant, but instead use it to verify if we clicked
      // something interactable
      if (!associatedDetailedInteraction) {
        return;
      }

      const completedInteraction =
        associatedDetailedInteraction.completeInteraction(event);
      onComplete(completedInteraction);
    },
  );

  return unsubscribe;
};

type ShouldContinue = boolean;
const trackDetailedTiming = ({
  onMicroTask,
  onRAF,
  onTimeout,
  abort,
}: {
  onMicroTask: () => ShouldContinue;
  onRAF: () => ShouldContinue;
  onTimeout: () => void;
  abort?: () => boolean;
}) => {
  queueMicrotask(() => {
    if (abort?.() === true) {
      return;
    }

    if (!onMicroTask()) {
      return;
    }
    requestAnimationFrame(() => {
      if (abort?.() === true) {
        return;
      }
      if (!onRAF()) {
        return;
      }
      setTimeout(() => {
        if (abort?.() === true) {
          return;
        }
        onTimeout();
      }, 0);
    });
  });
};

const getTargetInteractionDetails = (target: Element) => {
  const associatedFiber = getFiberFromElement(target);
  if (!associatedFiber) {
    return;
  }

  // TODO: if element is minified, squash upwards till first non minified ancestor, and set name as ChildOf(<parent-name>)
  let componentName = associatedFiber
    ? getDisplayName(associatedFiber?.type)
    : 'N/A';

  if (!componentName) {
    componentName =
      getFirstNameFromAncestor(associatedFiber, (name) => name.length > 2) ??
      'N/A';
  }

  if (!componentName) {
    return;
  }

  const componentPath = getInteractionPath(associatedFiber);

  // const childrenTree = collectFiberSubtree(associatedFiber, 20); // this can be expensive if not limited

  // const firstChildSvg = Object.entries(childrenTree).find(([name, {isSvg  }]) => isSvg)

  // const firstSvg =
  //   associatedFiber.type === "svg"
  //     ? getFirstNameFromAncestor(associatedFiber)
  //     : Object.entries(childrenTree).find(([name, {isSvg  }]) => isSvg)

  // lowkey i have an idea
  return {
    componentPath,
    childrenTree: {},
    componentName,
  };
};

type LastInteractionRef = {
  current: (
    | InteractionStartStage
    | JSEndStage
    | RAFStage
    | TimeoutStage
    | UnInitializedStage
  ) & { stageStart: number };
};

/**
 *
 * handles tracking event timings for arbitrarily overlapping handlers with cancel logic
 */
export const setupDetailedPointerTimingListener = (
  kind: 'pointer' | 'keyboard',
  options: {
    onStart?: (interactionUUID: string) => void;
    onComplete?: (
      interactionUUID: string,
      finalInteraction: {
        detailedTiming: TimeoutStage;
        latency: number;
        completedAt: number;
        flushNeeded: boolean;
      },
      entry: PerformanceEntryChannelEvent,
    ) => void;
    onError?: (interactionUUID: string) => void;
  },
) => {
  let instrumentationIdInControl: string | null = null;

  const getEvent = (
    info: { phase: 'start' } | { phase: 'end'; target: Element },
  ) => {
    switch (kind) {
      case 'pointer': {
        if (info.phase === 'start') {
          return 'pointerup';
        }
        if (
          info.target instanceof HTMLInputElement ||
          info.target instanceof HTMLSelectElement
        ) {
          return 'change';
        }
        return 'click';
      }
      case 'keyboard': {
        if (info.phase === 'start') {
          return 'keydown';
        }

        return 'change';
      }
    }
  };

  const lastInteractionRef: LastInteractionRef = {
    current: {
      kind: 'uninitialized-stage',
      interactionUUID: not_globally_unique_generateId(), // the first interaction uses this
      stageStart: Date.now(),
      interactionType: kind,
    },
  };

  const onInteractionStart = (e: Event) => {
    const path = e.composedPath();
    if (
      path.some(
        (el) => el instanceof Element && el.id === 'react-scan-toolbar-root',
      )
    ) {
      return;
    }
    if (Date.now() - lastInteractionRef.current.stageStart > 2000) {
      lastInteractionRef.current = {
        kind: 'uninitialized-stage',
        interactionUUID: not_globally_unique_generateId(),
        stageStart: Date.now(),
        interactionType: kind,
      };
    }

    if (lastInteractionRef.current.kind !== 'uninitialized-stage') {
      return;
    }

    const pointerUpStart = performance.now();

    options?.onStart?.(lastInteractionRef.current.interactionUUID);
    const details = getTargetInteractionDetails(e.target as HTMLElement);

    if (!details) {
      options?.onError?.(lastInteractionRef.current.interactionUUID);
      return;
    }

    const fiberRenders: InteractionStartStage['fiberRenders'] = {};
    const stopListeningForRenders = listenForRenders(fiberRenders);
    lastInteractionRef.current = {
      ...lastInteractionRef.current,
      interactionType: kind,
      blockingTimeStart: Date.now(),
      childrenTree: details.childrenTree,
      componentName: details.componentName,
      componentPath: details.componentPath,
      fiberRenders,
      kind: 'interaction-start',
      interactionStartDetail: pointerUpStart,
      stopListeningForRenders,
    };

    const event = getEvent({ phase: 'end', target: e.target as Element });
    // biome-ignore lint/suspicious/noExplicitAny: shut up biome
    document.addEventListener(event, onLastJS as any, {
      once: true,
    });

    // this is an edge case where a click event is not fired after a pointerdown
    // im not sure why this happens, but it seems to only happen on non intractable elements
    // it causes the event handler to stay alive until a future interaction, which can break timing (looks super long)
    // or invariants (the start metadata was removed, so now its an end metadata with no start)
    requestAnimationFrame(() => {
      // biome-ignore lint/suspicious/noExplicitAny: shut up biome
      document.removeEventListener(event as any, onLastJS as any);
    });
  };

  document.addEventListener(
    getEvent({ phase: 'start' }),
    // biome-ignore lint/suspicious/noExplicitAny: shut up biome
    onInteractionStart as any,
    {
      capture: true,
    },
  );

  /**
   *
   * TODO: IF WE DETECT RENDERS DURING THIS PERIOD WE CAN INCLUDE THAT IN THE RESULT AND THEN BACK THAT OUT OF COMPUTED STYLE TIME AND ADD IT BACK INTO JS TIME
   */
  const onLastJS = (
    e: { target: Element },
    instrumentationId: string,
    abort: () => boolean,
  ) => {
    if (
      lastInteractionRef.current.kind !== 'interaction-start' &&
      instrumentationId === instrumentationIdInControl
    ) {
      if (kind === 'pointer' && e.target instanceof HTMLSelectElement) {
        lastInteractionRef.current = {
          kind: 'uninitialized-stage',
          interactionUUID: not_globally_unique_generateId(),
          stageStart: Date.now(),
          interactionType: kind,
        };
        return;
      }

      options?.onError?.(lastInteractionRef.current.interactionUUID);
      lastInteractionRef.current = {
        kind: 'uninitialized-stage',
        interactionUUID: not_globally_unique_generateId(),
        stageStart: Date.now(),
        interactionType: kind,
      };
      invariantError('pointer -> click');
      return;
    }

    instrumentationIdInControl = instrumentationId;

    trackDetailedTiming({
      abort,
      onMicroTask: () => {
        if (lastInteractionRef.current.kind === 'uninitialized-stage') {
          return false;
        }

        lastInteractionRef.current = {
          ...lastInteractionRef.current,
          kind: 'js-end-stage',
          jsEndDetail: performance.now(),
        };
        return true;
      },
      onRAF: () => {
        if (
          lastInteractionRef.current.kind !== 'js-end-stage' &&
          lastInteractionRef.current.kind !== 'raf-stage'
        ) {
          options?.onError?.(lastInteractionRef.current.interactionUUID);
          invariantError('bad transition to raf');
          lastInteractionRef.current = {
            kind: 'uninitialized-stage',
            interactionUUID: not_globally_unique_generateId(),
            stageStart: Date.now(),
            interactionType: kind,
          };
          return false;
        }

        lastInteractionRef.current = {
          ...lastInteractionRef.current,
          kind: 'raf-stage',
          rafStart: performance.now(),
        };

        return true;
      },
      onTimeout: () => {
        if (lastInteractionRef.current.kind !== 'raf-stage') {
          options?.onError?.(lastInteractionRef.current.interactionUUID);
          lastInteractionRef.current = {
            kind: 'uninitialized-stage',
            interactionUUID: not_globally_unique_generateId(),
            stageStart: Date.now(),
            interactionType: kind,
          };
          invariantError('raf->timeout');
          return;
        }
        const now = Date.now();
        const timeoutStage: TimeoutStage = Object.freeze({
          ...lastInteractionRef.current,
          kind: 'timeout-stage',
          blockingTimeEnd: now,
          commitEnd: performance.now(),
        });

        lastInteractionRef.current = {
          kind: 'uninitialized-stage',
          interactionUUID: not_globally_unique_generateId(),
          stageStart: now,
          interactionType: kind,
        };
        let completed = false;
        const completeInteraction = (event: PerformanceEntryChannelEvent) => {
          completed = true;

          const latency =
            event.kind === 'auto-complete-race'
              ? event.detailedTiming.commitEnd -
                event.detailedTiming.interactionStartDetail
              : event.entry.latency;
          const finalInteraction = {
            detailedTiming: timeoutStage,
            latency,
            completedAt: Date.now(),
            flushNeeded: true,
          };

          options?.onComplete?.(
            timeoutStage.interactionUUID,
            finalInteraction,
            event,
          );
          const newTasks = tasks.filter(
            (task) => task.interactionUUID !== timeoutStage.interactionUUID,
          );
          tasks = BoundedArray.fromArray(newTasks, MAX_INTERACTION_TASKS);

          return finalInteraction;
        };

        const task = {
          completeInteraction,
          endDateTime: Date.now(),
          startDateTime: timeoutStage.blockingTimeStart,
          type: kind,
          interactionUUID: timeoutStage.interactionUUID,
        };
        tasks.push(task);

        if (!isPerformanceEventAvailable()) {
          const newTasks = tasks.filter(
            (task) => task.interactionUUID !== timeoutStage.interactionUUID,
          );
          tasks = BoundedArray.fromArray(newTasks, MAX_INTERACTION_TASKS);
          completeInteraction({
            kind: 'auto-complete-race',
            // redundant
            detailedTiming: timeoutStage,
            interactionUUID: timeoutStage.interactionUUID,
          });
        } else {
          setTimeout(() => {
            if (completed) {
              return;
            }
            completeInteraction({
              kind: 'auto-complete-race',
              // redundant
              detailedTiming: timeoutStage,
              interactionUUID: timeoutStage.interactionUUID,
            });
            const newTasks = tasks.filter(
              (task) => task.interactionUUID !== timeoutStage.interactionUUID,
            );
            tasks = BoundedArray.fromArray(newTasks, MAX_INTERACTION_TASKS);
            // this means the max frame presentation delta we can observe is 300ms, but this should catch >99% of cases, the trade off is to not accidentally miss slowdowns if the user quickly clicked something else while this race was happening
          }, 1000);
        }
      },
    });
  };

  const onKeyPress = (e: { target: Element }) => {
    const id = not_globally_unique_generateId();
    onLastJS(e, id, () => id !== instrumentationIdInControl);
  };

  if (kind === 'keyboard') {
    // biome-ignore lint/suspicious/noExplicitAny: shut up biome
    document.addEventListener('keypress', onKeyPress as any);
  }

  return () => {
    document.removeEventListener(
      getEvent({ phase: 'start' }),
      // biome-ignore lint/suspicious/noExplicitAny: shut up biome
      onInteractionStart as any,
      {
        capture: true,
      },
    );
    // biome-ignore lint/suspicious/noExplicitAny: shut up biome
    document.removeEventListener('keypress', onKeyPress as any);
  };
};

// unused, but will be soon for monitoring
export const collectFiberSubtree = (
  fiber: Fiber,
  limit: number,
): Record<
  string,
  {
    children: Array<string>;
    firstNamedAncestor: string;
    isRoot: boolean;
    isSvg: boolean;
  }
> => {
  const adjacencyList = createChildrenAdjacencyList(fiber, limit).entries();
  const fiberToNames = Array.from(adjacencyList).map(
    ([fiber, { children, parent, isRoot, isSVG }]) => [
      getDisplayName(fiber.type) ?? 'N/A',
      {
        children: children.map((fiber) => getDisplayName(fiber.type) ?? 'N/A'),
        firstNamedAncestor: parent
          ? (getFirstNameFromAncestor(parent) ?? 'No Parent')
          : 'No Parent',
        isRoot,
        isSVG,
      },
    ],
  );

  return Object.fromEntries(fiberToNames);
};

const getHostFromFiber = (fiber: Fiber) => {
  return traverseFiber(fiber, (node) => {
    // shouldn't be too slow
    if (isHostFiber(node)) {
      return true;
    }
  })?.stateNode;
};

const isPerformanceEventAvailable = () => {
  return 'PerformanceEventTiming' in globalThis;
};

export const listenForRenders = (
  fiberRenders: InteractionStartStage['fiberRenders'],
) => {
  const listener = (fiber: Fiber) => {
    const displayName = getDisplayName(fiber.type);
    if (!displayName) {
      return;
    }
    const existing = fiberRenders[displayName];
    if (!existing) {
      const parents = new Set<string>();
      const parentCompositeName = getDisplayName(
        getParentCompositeFiber(fiber),
      );
      if (parentCompositeName) {
        parents.add(parentCompositeName);
      }
      const { selfTime, totalTime } = getTimings(fiber);

      const newChanges = collectInspectorDataWithoutCounts(fiber);
      const emptySection: SectionData = {
        current: [],
        changes: new Set<string | number>(),
        changesCounts: new Map<string | number, number>(),
      };
      const changes = {
        fiberProps: newChanges.fiberProps || emptySection,
        fiberState: newChanges.fiberState || emptySection,
        fiberContext: newChanges.fiberContext || emptySection,
      };
      fiberRenders[displayName] = {
        renderCount: 1,
        parents: parents,
        selfTime,
        totalTime,
        nodeInfo: [
          {
            element: getHostFromFiber(fiber),
            name: getDisplayName(fiber.type) ?? 'Unknown',
            selfTime: getTimings(fiber).selfTime,
          },
        ],
        changes,
      };

      return;
    }
    const parentType = getParentCompositeFiber(fiber)?.[0]?.type;
    if (parentType) {
      const parentCompositeName = getDisplayName(parentType);
      if (parentCompositeName) {
        existing.parents.add(parentCompositeName);
      }
    }
    const { selfTime, totalTime } = getTimings(fiber);

    const newChanges = collectInspectorDataWithoutCounts(fiber);

    if (!newChanges) return;

    const emptySection: SectionData = {
      current: [],
      changes: new Set<string | number>(),
      changesCounts: new Map<string | number, number>(),
    };

    existing.changes = {
      fiberProps: mergeSectionData(
        existing.changes?.fiberProps || emptySection,
        newChanges.fiberProps || emptySection,
      ),
      fiberState: mergeSectionData(
        existing.changes?.fiberState || emptySection,
        newChanges.fiberState || emptySection,
      ),
      fiberContext: mergeSectionData(
        existing.changes?.fiberContext || emptySection,
        newChanges.fiberContext || emptySection,
      ),
    };

    existing.renderCount += 1;
    existing.selfTime += selfTime;
    existing.totalTime += totalTime;
    existing.nodeInfo.push({
      element: getHostFromFiber(fiber),
      name: getDisplayName(fiber.type) ?? 'Unknown',
      selfTime: getTimings(fiber).selfTime,
    });
  };
  Store.interactionListeningForRenders = listener;

  return () => {
    if (Store.interactionListeningForRenders === listener) {
      Store.interactionListeningForRenders = null;
    }
  };
};

const mergeSectionData = (
  existing: SectionData,
  newData: SectionData,
): SectionData => {
  const mergedSection: SectionData = {
    current: [...existing.current],
    changes: new Set<string | number>(),
    changesCounts: new Map<string | number, number>(),
  };

  for (const value of newData.current) {
    if (!mergedSection.current.some((item) => item.name === value.name)) {
      mergedSection.current.push(value);
    }
  }

  for (const change of newData.changes) {
    if (typeof change === 'string' || typeof change === 'number') {
      mergedSection.changes.add(change);
      const existingCount = existing.changesCounts.get(change) || 0;
      const newCount = newData.changesCounts.get(change) || 0;
      mergedSection.changesCounts.set(change, existingCount + newCount);
    }
  }

  return mergedSection;
};
