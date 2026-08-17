/**
 * React-idiomatic replacement for `@preact/signals`.
 *
 * The original Preact UI relied on signals' transparent auto-subscription:
 * reading `someSignal.value` inside a component body re-rendered that
 * component when the signal changed. React has no such mechanism, so this
 * module provides:
 *
 *   1. A tiny reactive core (`signal` / `computed`) that is API-compatible
 *      with the `.value` / `.peek()` / `.subscribe()` surface used by the
 *      non-component code (effects, event handlers, and the shared `~core`
 *      engine). These keep working unchanged.
 *
 *   2. React hooks (`useSignalValue`, `useComputed`, `useSignal`,
 *      `useSignalEffect`) that bridge those stores into React's render cycle
 *      via `useSyncExternalStore` / `useEffect`.
 *
 * PORTING RULE: anywhere a component USED to read `mySignal.value` in its
 * render body, read it through `useSignalValue(mySignal)` (or `useComputed`)
 * at the top of the component instead. Reads/writes OUTSIDE render (handlers,
 * effects, module scope) stay as plain `.value` / `.subscribe`.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

type Listener = () => void;

/** A tracking scope: a `computed` recompute or a `useSignalEffect` run. */
class Reaction {
  deps = new Set<ReactiveNode<unknown>>();

  constructor(public readonly run: () => void) {}

  /** Drop all current dependency edges (called before each re-track). */
  clearDeps(): void {
    for (const dep of this.deps) dep.reactions.delete(this);
    this.deps.clear();
  }

  dispose(): void {
    this.clearDeps();
  }
}

let activeReaction: Reaction | null = null;

/** Run `fn` while recording every signal/computed it reads as a dependency. */
function track(reaction: Reaction, fn: () => void): void {
  reaction.clearDeps();
  const prev = activeReaction;
  activeReaction = reaction;
  try {
    fn();
  } finally {
    activeReaction = prev;
  }
}

abstract class ReactiveNode<T> {
  /** Plain subscribers registered via `.subscribe()`. */
  protected subs = new Set<Listener>();
  /** Tracking reactions (computeds / effects) that depend on this node. */
  reactions = new Set<Reaction>();
  protected current!: T;

  protected abstract read(): T;

  get value(): T {
    const v = this.read();
    if (activeReaction) {
      activeReaction.deps.add(this as ReactiveNode<unknown>);
      this.reactions.add(activeReaction);
    }
    return v;
  }

  /** Read without subscribing the active reaction. */
  peek(): T {
    return this.read();
  }

  /**
   * Subscribe to changes. Matches `@preact/signals` semantics: the callback
   * fires immediately with the current value, then on every change.
   */
  subscribe(fn: (value: T) => void): () => void {
    const wrapped: Listener = () => fn(this.read());
    this.subs.add(wrapped);
    fn(this.read());
    return () => {
      this.subs.delete(wrapped);
    };
  }

  protected notify(): void {
    for (const sub of [...this.subs]) sub();
    for (const reaction of [...this.reactions]) reaction.run();
  }
}

class Signal<T> extends ReactiveNode<T> {
  constructor(initial: T) {
    super();
    this.current = initial;
  }

  protected read(): T {
    return this.current;
  }

  override get value(): T {
    return super.value;
  }

  set value(next: T) {
    if (Object.is(next, this.current)) return;
    this.current = next;
    this.notify();
  }
}

class Computed<T> extends ReactiveNode<T> {
  private reaction: Reaction;
  private dirty = true;

  constructor(private readonly compute: () => T) {
    super();
    this.reaction = new Reaction(() => this.recompute());
  }

  private recompute(): void {
    let next!: T;
    track(this.reaction, () => {
      next = this.compute();
    });
    const changed = this.dirty || !Object.is(next, this.current);
    this.current = next;
    this.dirty = false;
    if (changed) this.notify();
  }

  protected read(): T {
    if (this.dirty) this.recompute();
    return this.current;
  }
}

export type { Signal, Computed };
/** Read-only view used by code that only consumes a signal/computed. */
export type ReadonlySignal<T> = Pick<ReactiveNode<T>, "value" | "peek" | "subscribe">;

export function signal<T>(initial: T): Signal<T> {
  return new Signal(initial);
}

export function computed<T>(compute: () => T): Computed<T> {
  return new Computed(compute);
}

/** Imperative effect that re-runs whenever a tracked signal changes. */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  const reaction = new Reaction(() => {
    if (typeof cleanup === "function") cleanup();
    track(reaction, () => {
      cleanup = fn();
    });
  });
  track(reaction, () => {
    cleanup = fn();
  });
  return () => {
    if (typeof cleanup === "function") cleanup();
    reaction.dispose();
  };
}

/** Read a signal/computed inside a component, subscribing to its changes. */
export function useSignalValue<T>(source: ReadonlySignal<T>): T {
  const subscribe = useCallback(
    (onChange: () => void) => {
      // `.subscribe` invokes immediately; React ignores that initial call.
      let first = true;
      return source.subscribe(() => {
        if (first) {
          first = false;
          return;
        }
        onChange();
      });
    },
    [source],
  );
  const getSnapshot = useCallback(() => source.peek(), [source]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Derive a memoized value from signals inside a component, subscribing to the
 * signals it reads. For purely module-level derivations prefer a top-level
 * `computed(...)` + `useSignalValue`; use this for component-scoped derivations.
 */
export function useComputed<T>(compute: () => T): T {
  const ref = useRef<Computed<T> | null>(null);
  if (ref.current === null) ref.current = computed(compute);
  return useSignalValue(ref.current);
}

/**
 * Local component signal. Prefer plain `useState` for trivial local state;
 * this exists for cases ported 1:1 from `useSignal`, where `.value`
 * reads/writes are threaded through helpers. Writing `.value` re-renders.
 */
export function useSignal<T>(initial: T): Signal<T> {
  const ref = useRef<Signal<T> | null>(null);
  if (ref.current === null) ref.current = signal(initial);
  // Subscribe so `.value` mutations trigger a re-render of this component.
  useSignalValue(ref.current);
  return ref.current;
}

/** Run an effect that re-subscribes to whichever signals it reads. */
export function useSignalEffect(fn: () => void | (() => void)): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => effect(() => fnRef.current()), []);
}

/** `untracked(fn)` reads signals inside `fn` without creating dependencies. */
export function untracked<T>(fn: () => T): T {
  const prev = activeReaction;
  activeReaction = null;
  try {
    return fn();
  } finally {
    activeReaction = prev;
  }
}
