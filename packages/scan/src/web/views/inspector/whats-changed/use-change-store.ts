import { useEffect, useRef, useState } from 'preact/hooks';
import {
  ChangesListener,
  ChangesPayload,
  ContextChange,
  Store,
} from '~core/index';
import { Fiber, getFiberId } from 'bippy';
import { isEqual } from '~core/utils';
import { signal } from '@preact/signals';

const CHANGES_QUEUE_INTERVAL = 50;

interface SectionData {
  current: Array<{ name: string; value: unknown }>;
  changes: Set<string>;
}

export interface InspectorData {
  fiberProps: SectionData;
  fiberState: SectionData;
  fiberContext: SectionData;
}
interface InspectorState extends InspectorData {
  fiber: Fiber | null;
}

export const inspectorState = signal<InspectorState>({
  fiber: null,
  fiberProps: { current: [], changes: new Set() },
  fiberState: { current: [], changes: new Set() },
  fiberContext: { current: [], changes: new Set() },
});

export type AggregatedChanges = {
  count: number;
  currentValue: unknown;
  previousValue: unknown;
  name: string;
  lastUpdated: number;
  id: string;
};

export type AllAggregatedChanges = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  propsChanges: Map<any, AggregatedChanges>;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  stateChanges: Map<any, AggregatedChanges>;
  contextChanges: Map<
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    any,
    | { changes: AggregatedChanges; kind: 'initialized' }
    | {
        // this looks weird, because it is
        // its a work around to allow context changes to be sent impotently
        // (react-scan internals do not yet handle sending context changes the render they change)
        kind: 'partially-initialized';
        value: unknown;
        name: string;
        lastUpdated: number;
        id: string;
      }
  >;
};

const getContextChangesValue = (
  discriminated:
    | { kind: 'partially-initialized'; value: unknown }
    | { kind: 'initialized'; changes: AggregatedChanges },
) => {
  switch (discriminated.kind) {
    case 'initialized': {
      return discriminated.changes.currentValue;
    }
    case 'partially-initialized': {
      return discriminated.value;
    }
  }
};
const processChanges = (
  changes: Array<{ name: string; value: unknown; prevValue?: unknown }>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  targetMap: Map<any, AggregatedChanges>,
) => {
  for (const change of changes) {
    const existing = targetMap.get(change.name);

    if (existing) {
      targetMap.set(existing.name, {
        count: existing.count + 1,
        currentValue: change.value,
        id: existing.name,
        lastUpdated: Date.now(),
        name: existing.name,
        previousValue: change.prevValue,
      });
      continue;
    }

    targetMap.set(change.name, {
      count: 1,
      currentValue: change.value,
      id: change.name,
      lastUpdated: Date.now(),
      name: change.name,
      previousValue: change.prevValue,
    });
  }
};

const processContextChanges = (
  contextChanges: Array<ContextChange>,
  aggregatedChanges: AllAggregatedChanges,
) => {
  for (const change of contextChanges) {
    const existing = aggregatedChanges.contextChanges.get(change.contextType);

    if (existing) {
      if (isEqual(getContextChangesValue(existing), change.value)) {
        continue;
      }
      if (existing.kind === 'partially-initialized') {
        aggregatedChanges.contextChanges.set(change.contextType, {
          kind: 'initialized',
          changes: {
            count: 1,
            currentValue: change.value,
            id: change.contextType.toString(), // come back to this why was this ever expected to be a number?
            lastUpdated: Date.now(),
            name: change.name,
            previousValue: existing.value,
          },
        });
        continue;
      }

      aggregatedChanges.contextChanges.set(change.contextType, {
        kind: 'initialized',
        changes: {
          count: existing.changes.count + 1,
          currentValue: change.value,
          id: change.contextType.toString(),
          lastUpdated: Date.now(),
          name: change.name,
          previousValue: existing.changes.currentValue,
        },
      });

      continue;
    }

    aggregatedChanges.contextChanges.set(change.contextType, {
      kind: 'partially-initialized',
      id: change.contextType.toString(),
      lastUpdated: Date.now(),
      name: change.name,
      value: change.value,
    });
  }
};

const collapseQueue = (queue: Array<ChangesPayload>) => {
  const localAggregatedChanges: AllAggregatedChanges = {
    contextChanges: new Map(),
    propsChanges: new Map(),
    stateChanges: new Map(),
  };

  queue.forEach((changes) => {
    // context is a special case since we don't send precise diffs and need to be idempotent
    processContextChanges(changes.contextChanges, localAggregatedChanges);

    processChanges(changes.stateChanges, localAggregatedChanges.stateChanges);

    processChanges(changes.propsChanges, localAggregatedChanges.propsChanges);
  });

  return localAggregatedChanges;
};
const mergeSimpleChanges = <
  T extends
    | AllAggregatedChanges['propsChanges']
    | AllAggregatedChanges['stateChanges'],
>(
  existingChanges: T,
  incomingChanges: T,
): T => {
  const mergedChanges = new Map();

  existingChanges.forEach((value, key) => {
    mergedChanges.set(key, value);
  });

  incomingChanges.forEach((incomingChange, key) => {
    const existing = mergedChanges.get(key);

    if (!existing) {
      mergedChanges.set(key, incomingChange);
      return;
    }

    mergedChanges.set(key, {
      count: existing.count + incomingChange.count,
      currentValue: incomingChange.currentValue,
      id: incomingChange.id,
      lastUpdated: incomingChange.lastUpdated,
      name: incomingChange.name,
      previousValue: incomingChange.previousValue,
    });
  });

  return mergedChanges as T;
};

const mergeContextChanges = (
  existing: AllAggregatedChanges,
  incoming: AllAggregatedChanges,
) => {
  const contextChanges: AllAggregatedChanges['contextChanges'] = new Map();

  existing.contextChanges.forEach((value, key) => {
    contextChanges.set(key, value);
  });

  incoming.contextChanges.forEach((incomingChange, key) => {
    const existingChange = contextChanges.get(key);

    if (!existingChange) {
      contextChanges.set(key, incomingChange);
      return;
    }
    if (
      getContextChangesValue(incomingChange) ===
      getContextChangesValue(existingChange)
    ) {
      // we do this for a second time just in context merge to handle the partial initialization case (the collapsed queue will not have the information to remove the partially initialized set of changes)
      return;
    }

    switch (existingChange.kind) {
      case 'initialized': {
        switch (incomingChange.kind) {
          case 'initialized': {
            const preInitEntryOffset = 1;
            contextChanges.set(key, {
              kind: 'initialized',
              changes: {
                ...incomingChange.changes,
                // if existing was initialized, the pre-initialization done by the collapsed queue was not necessary, so we need to increment count to account for the preInit entry
                count:
                  incomingChange.changes.count +
                  existingChange.changes.count +
                  preInitEntryOffset,
                currentValue: incomingChange.changes.currentValue,

                previousValue: incomingChange.changes.previousValue, // we always want to show this value, since this will be the true state transition (if you make the previousValue the last seen currentValue, u will have weird behavior with primitive state updates)
              },
            });
            return;
          }
          case 'partially-initialized': {
            contextChanges.set(key, {
              kind: 'initialized',
              changes: {
                count: existingChange.changes.count + 1,
                currentValue: incomingChange.value,
                id: incomingChange.id,
                lastUpdated: incomingChange.lastUpdated,
                name: incomingChange.name,
                previousValue: existingChange.changes.currentValue,
              },
            });
            return;
          }
        }
      }
      case 'partially-initialized': {
        switch (incomingChange.kind) {
          case 'initialized': {
            contextChanges.set(key, {
              kind: 'initialized',
              changes: {
                count: incomingChange.changes.count + 1,
                currentValue: incomingChange.changes.currentValue,
                id: incomingChange.changes.id,
                lastUpdated: incomingChange.changes.lastUpdated,
                name: incomingChange.changes.name,
                previousValue: existingChange.value,
              },
            });
            return;
          }
          case 'partially-initialized': {
            contextChanges.set(key, {
              kind: 'initialized',
              changes: {
                count: 1,
                currentValue: incomingChange.value,
                id: incomingChange.id,
                lastUpdated: incomingChange.lastUpdated,
                name: incomingChange.name,
                previousValue: existingChange.value,
              },
            });
            return;
          }
        }
      }
    }
  });

  return contextChanges;
};

const mergeChanges = (
  existing: AllAggregatedChanges,
  incoming: AllAggregatedChanges,
): AllAggregatedChanges => {
  const contextChanges = mergeContextChanges(existing, incoming);

  const propChanges = mergeSimpleChanges(
    existing.propsChanges,
    incoming.propsChanges,
  );
  const stateChanges = mergeSimpleChanges(
    existing.stateChanges,
    incoming.stateChanges,
  );

  return {
    contextChanges,
    propsChanges: propChanges,
    stateChanges,
  };
};

/**
 * Calculate total count of changes across props, state and context
 */
export const calculateTotalChanges = (changes: AllAggregatedChanges) => {
  return (
    Array.from(changes.propsChanges.values()).reduce(
      (acc, change) => acc + change.count,
      0,
    ) +
    Array.from(changes.stateChanges.values()).reduce(
      (acc, change) => acc + change.count,
      0,
    ) +
    Array.from(changes.contextChanges.values())
      .filter(
        (change): change is Extract<typeof change, { kind: 'initialized' }> =>
          change.kind === 'initialized',
      )
      .reduce((acc, change) => acc + change.changes.count, 0)
  );
};

export const useInspectedFiberChangeStore = (opts?: {
  onChangeUpdate?: (countUpdated: number) => void;
}) => {
  const pendingChanges = useRef<{ queue: ChangesPayload[] }>({ queue: [] });
  // flushed state read from queue stream
  const [aggregatedChanges, setAggregatedChanges] =
    useState<AllAggregatedChanges>({
      propsChanges: new Map(),
      stateChanges: new Map(),
      contextChanges: new Map(),
    });

  const fiber =
    Store.inspectState.value.kind === 'focused'
      ? Store.inspectState.value.fiber
      : null;
  const fiberId = fiber ? getFiberId(fiber) : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const interval = setInterval(() => {
      // optimization to avoid unconditional renders
      if (pendingChanges.current.queue.length === 0) return;

      setAggregatedChanges((prevAggregatedChanges) => {
        const queueChanges = collapseQueue(pendingChanges.current.queue);
        const merged = mergeChanges(prevAggregatedChanges, queueChanges);
        const prevTotal = calculateTotalChanges(prevAggregatedChanges);
        const newTotal = calculateTotalChanges(merged);
        const changeCount = newTotal - prevTotal;
        opts?.onChangeUpdate?.(changeCount);

        return merged;
      });

      pendingChanges.current.queue = [];
    }, CHANGES_QUEUE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [fiber]);

  // un-throttled subscription
  useEffect(() => {
    if (!fiberId) {
      return;
    }
    const listener: ChangesListener = (change) => {
      pendingChanges.current?.queue.push(change);
    };

    let listeners = Store.changesListeners.get(fiberId);

    if (!listeners) {
      listeners = [];
      Store.changesListeners.set(fiberId, listeners);
    }

    listeners.push(listener);

    return () => {
      setAggregatedChanges({
        propsChanges: new Map(),
        stateChanges: new Map(),
        contextChanges: new Map(),
      });
      pendingChanges.current.queue = [];
      Store.changesListeners.set(
        fiberId,
        Store.changesListeners.get(fiberId)?.filter((l) => l !== listener) ??
          [],
      );
    };
  }, [fiberId]);

  // cleanup
  // biome-ignore lint/correctness/useExhaustiveDependencies: component should really remount when fiber changes, but instead we just re-run effects (should fix)
  useEffect(() => {
    return () => {
      setAggregatedChanges({
        propsChanges: new Map(),
        stateChanges: new Map(),
        contextChanges: new Map(),
      });
      pendingChanges.current.queue = [];
    };
  }, [fiberId]);

  return aggregatedChanges;
};
