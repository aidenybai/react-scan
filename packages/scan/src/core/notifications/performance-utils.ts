const THROW_INVARIANTS = false;

export const invariantError = (message: string | undefined) => {
  if (THROW_INVARIANTS) {
    throw new Error(message);
  }
};

export const iife = <T>(fn: () => T): T => fn();

export class BoundedArray<T> extends Array<T> {
  constructor(private capacity: number = 25) {
    super();
  }

  push(...items: T[]): number {
    const result = super.push(...items);
    while (this.length > this.capacity) {
      this.shift();
    }
    return result;
  }
  // do not couple capacity with a default param, it must be explicit
  static fromArray<T>(array: Array<T>, capacity: number) {
    const arr = new BoundedArray<T>(capacity);
    arr.push(...array);
    return arr;
  }
}
