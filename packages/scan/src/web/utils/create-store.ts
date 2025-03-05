/**
 * Adapted from zustand v5.0.3
 * https://github.com/pmndrs/zustand
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

export type StoreMutators<_S = unknown, _A = unknown> = Record<never, never>;
export type StoreMutatorIdentifier = keyof StoreMutators;

type CreateStore = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ): Mutate<StoreApi<T>, Mos>;

  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>,
  ) => Mutate<StoreApi<T>, Mos>;
};

const createStoreImpl = <
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  createState: StateCreator<T, [], Mos>,
): Mutate<StoreApi<T>, Mos> => {
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
      for (const listener of listeners) {
        listener(state, previousState);
      }
    }
  };

  const getState: StoreApi<TState>['getState'] = () => state;

  const getInitialState: StoreApi<TState>['getInitialState'] = () =>
    initialState;

  const subscribe: StoreApi<TState>['subscribe'] = (
    selectorOrListener:
      | ((state: TState, prevState: TState) => void)
      | ((state: TState) => unknown),
    listener?: (selectedState: unknown, prevSelectedState: unknown) => void,
  ) => {
    let selector: ((state: TState) => unknown) | undefined;
    let actualListener: (state: TState, prevState: TState) => void;

    if (listener && selectorOrListener) {
      // Selector subscription case
      const typedSelector = selectorOrListener as (state: TState) => unknown;
      selector = typedSelector;
      actualListener = (state: TState, prevState: TState) => {
        const nextSlice = typedSelector(state);
        const prevSlice = typedSelector(prevState);
        listener(nextSlice, prevSlice);
      };
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
        if (!Object.is(currentSlice, nextSlice)) {
          currentSlice = nextSlice;
          actualListener(newState, previousState);
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
  const initialState = createState(setState, getState, api);
  state = initialState;
  return api as Mutate<StoreApi<T>, Mos>;
};

export const createStore = ((createState) =>
  createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore;
