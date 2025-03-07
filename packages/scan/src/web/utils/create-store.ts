/**
 * Adapted from zustand v5.0.3
 *
 * https://github.com/pmndrs/zustand
 *
 * Do not modify unless you know what you are doing
 */
type SetStateInternal<T> = {
  _(
    partial: T | Partial<T> | { _(state: T): T | Partial<T> }['_'],
    replace?: false,
  ): void;
  _(state: T | { _(state: T): T }['_'], replace: true): void;
}['_'];

export interface StoreApi<T> {
  setState: SetStateInternal<T>;
  getState: () => T;
  getInitialState: () => T;
  subscribe: {
    (listener: (state: T, prevState: T) => void): () => void;
    <U>(
      selector: (state: T) => U,
      listener: (selectedState: U, prevSelectedState: U) => void,
    ): () => void;
  };
}

export type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

type Get<T, K, F> = K extends keyof T ? T[K] : F;

export type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]
  ? S
  : Ms extends []
    ? S
    : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
      ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
      : never;

export type StateCreator<
  T,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
> = ((
  setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
  getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
  store: Mutate<StoreApi<T>, Mis>,
) => U) & { $$storeMutators?: Mos };

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
export interface StoreMutators<S, A> {}
export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>;

type CreateStore = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ): Mutate<StoreApi<T>, Mos>;

  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ) => Mutate<StoreApi<T>, Mos>;
};

type CreateStoreImpl = <
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>,
) => Mutate<StoreApi<T>, Mos>;

const createStoreImpl: CreateStoreImpl = (createState) => {
  type TState = ReturnType<typeof createState>;
  type Listener = (state: TState, prevState: TState) => void;
  let state: TState;
  const listeners: Set<Listener> = new Set();

  const setState: StoreApi<TState>['setState'] = (partial, replace) => {
    const nextState =
      typeof partial === 'function'
        ? (partial as (state: TState) => TState)(state)
        : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state =
        (replace ?? (typeof nextState !== 'object' || nextState === null))
          ? (nextState as TState)
          : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  const getState: StoreApi<TState>['getState'] = () => state;

  const getInitialState: StoreApi<TState>['getInitialState'] = () =>
    initialState;

  const subscribe: StoreApi<TState>['subscribe'] = (
    selectorOrListener:
      | ((state: TState, prevState: TState) => void)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      | ((state: TState) => any),
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    listener?: (selectedState: any, prevSelectedState: any) => void,
  ) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let selector: ((state: TState) => any) | undefined;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let actualListener: (state: any, prevState: any) => void;

    if (listener) {
      // Selector subscription case
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      selector = selectorOrListener as (state: TState) => any;
      actualListener = listener;
    } else {
      // Regular subscription case
      actualListener = selectorOrListener as (
        state: TState,
        prevState: TState,
      ) => void;
    }

    let currentSlice = selector ? selector(state) : undefined;

    const wrappedListener = (newState: TState, previousState: TState) => {
      if (selector) {
        const nextSlice = selector(newState);
        const prevSlice = selector(previousState);
        if (!Object.is(currentSlice, nextSlice)) {
          currentSlice = nextSlice;
          actualListener(nextSlice, prevSlice);
        }
      } else {
        actualListener(newState, previousState);
      }
    };

    listeners.add(wrappedListener);
    // Unsubscribe
    return () => listeners.delete(wrappedListener);
  };

  const api = { setState, getState, getInitialState, subscribe };
  const initialState = (state = createState(setState, getState, api));
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return api as any;
};

export const createStore = ((createState) =>
  createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore;
