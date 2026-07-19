import { createSignal, type Accessor } from "solid-js";

export interface ReadonlySignal<Value> {
  readonly value: Value;
}

export interface Signal<Value> extends ReadonlySignal<Value> {
  value: Value;
  subscribe: (listener: (value: Value) => void) => () => void;
}

export interface CompatibleSignal<Value> {
  get: Accessor<Value>;
  set: (value: Value) => Value;
  facade: Signal<Value>;
}

export const createCompatibleSignal = <Value>(initialValue: Value): CompatibleSignal<Value> => {
  const [get, setValue] = createSignal(initialValue);
  const listeners = new Set<(value: Value) => void>();

  const set = (value: Value): Value => {
    const previousValue = get();
    if (Object.is(previousValue, value)) return previousValue;
    setValue(() => value);
    listeners.forEach((listener) => listener(value));
    return value;
  };

  return {
    get,
    set,
    facade: {
      get value() {
        return get();
      },
      set value(nextValue: Value) {
        set(nextValue);
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
  };
};
