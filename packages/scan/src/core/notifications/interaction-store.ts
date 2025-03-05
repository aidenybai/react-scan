import { BoundedArray } from "~core/notifications/performance-utils";
import type { CompletedInteraction } from './performance';

type Subscriber<T> = (data: T) => void;

export class Store<T> {
  private subscribers: Set<Subscriber<T>> = new Set();
  private currentValue: T;

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber);

    subscriber(this.currentValue);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  setState(data: T) {
    this.currentValue = data;
    for (const subscriber of this.subscribers) {
      subscriber(data);
    }
  }

  getCurrentState(): T {
    return this.currentValue;
  }
}
export const MAX_INTERACTION_BATCH = 150;
export const interactionStore = new Store<BoundedArray<CompletedInteraction>>(
  new BoundedArray(MAX_INTERACTION_BATCH)
);
