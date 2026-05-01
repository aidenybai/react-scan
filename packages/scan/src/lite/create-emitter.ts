import { DEFAULT_LOCATION } from './constants';
import type { LaneLabelTranslator } from './lane-labels';
import type { LiteEvent, LiteEventKind, LiteOptions } from './types';

/**
 * Surface used inside the lite module's hot path (event emission, listener
 * management). Does NOT include lifecycle controls like
 * `setLaneLabelTranslator` / `dispose` — those are returned separately so
 * downstream callers (e.g. profiling-hook closures) can't accidentally
 * tear down the emitter from inside an event handler.
 */
export interface Emitter {
  emit: (kind: LiteEventKind, partial?: Partial<LiteEvent>) => void;
  subscribe: (listener: (event: LiteEvent) => void) => () => void;
}

/**
 * Returned alongside the `emitter` to its sole owner (`instrument()`).
 * Holds the controls that must NOT leak into the per-event hot path.
 */
export interface EmitterControl {
  setLaneLabelTranslator: (translator: LaneLabelTranslator | null) => void;
  dispose: () => void;
}

export const createEmitter = (
  options: LiteOptions,
): { emitter: Emitter; control: EmitterControl } => {
  const listeners = new Set<(event: LiteEvent) => void>();
  if (options.onEvent) listeners.add(options.onEvent);

  const endpoint = options.endpoint;
  const sessionId = options.sessionId;
  const locationPrefix = options.location ?? DEFAULT_LOCATION;
  const canPostToEndpoint = Boolean(endpoint && sessionId);
  let isActive = true;
  let translator: LaneLabelTranslator | null = null;

  const emit = (kind: LiteEventKind, partial?: Partial<LiteEvent>): void => {
    if (!isActive) return;
    // Cheap fast-path: if nobody is listening AND we have no endpoint to
    // POST to, skip the timestamp call, the event allocation, and the
    // translator work entirely. Common when a consumer creates a handle
    // but never calls `subscribe()` / passes `onEvent` / sets `endpoint`.
    if (listeners.size === 0 && !canPostToEndpoint) return;
    const timestamp = performance.now();
    const event: LiteEvent = {
      kind,
      timestamp,
      ...partial,
    };
    if (translator) {
      if (event.lanes != null && event.laneLabels === undefined) {
        const labels = translator.laneLabels(event.lanes);
        if (labels) event.laneLabels = labels;
      }
      if (event.priorityLevel != null && event.priorityName === undefined) {
        const name = translator.priorityName(event.priorityLevel);
        if (name) event.priorityName = name;
      }
    }
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {}
    }
    if (canPostToEndpoint) {
      try {
        fetch(endpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            location: `${locationPrefix}:${kind}`,
            message: kind,
            data: event,
            timestamp,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }
  };

  const subscribe = (listener: (event: LiteEvent) => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const setLaneLabelTranslator = (next: LaneLabelTranslator | null): void => {
    translator = next;
  };

  const dispose = (): void => {
    isActive = false;
    listeners.clear();
    translator = null;
  };

  return {
    emitter: { emit, subscribe },
    control: { setLaneLabelTranslator, dispose },
  };
};
