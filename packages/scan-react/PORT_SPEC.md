# react-scan Preact → idiomatic React port spec

This package (`packages/scan-react`) is a **parallel** React port of the
Preact toolbar UI that lives in `packages/scan/src/web`. The original files
were copied verbatim into `packages/scan-react/src/web`; your job is to rewrite
the Preact-specific bits of a single file into idiomatic React **in place** in
this package. Do not touch `packages/scan` (the Preact original) — it stays.

The shared profiling engine under `~core/*` is re-used as-is from the original
package (the tsconfig alias points `~core/*` at `../scan/src/core/*`). Do NOT
copy or port core; only adapt how the UI consumes it (see "Core hooks" below).

## Module / import mapping

| Preact                                   | React equivalent |
|------------------------------------------|------------------|
| `from "preact/hooks"` (useState/useEffect/useRef/useMemo/useCallback/useLayoutEffect/useContext) | `from "react"` |
| `from "preact"` `createElement`, `Component`, `createContext`, `Fragment`, `cloneElement`, `isValidElement`, `toChildArray` | `from "react"` (`toChildArray` → `React.Children.toArray`) |
| `from "preact"` types `ComponentType`, `FunctionComponent`, `ComponentChildren`, `VNode`, `Attributes`, `RefObject` | `from "react"` (`ComponentChildren` → `ReactNode`, `VNode` → `ReactElement`) |
| `import type { JSX } from "preact"` | `import type { JSX } from "react"` (or use `React.JSX`) |
| `from "preact/compat"` `memo`, `forwardRef`, `ForwardedRef`, `ReactNode`, `SetStateAction`, `Dispatch`, `useSyncExternalStore`, `createPortal` | `from "react"` (and `createPortal` from `"react-dom"`) |
| `render(vnode, container)` (`from "preact"`) | `createRoot(container).render(vnode)` (`from "react-dom/client"`); keep the root to call `root.unmount()` later |
| `@preact/signals` (`signal`, `computed`, `effect`, `untracked`, `useSignal`, `useSignalEffect`, `useComputed`, `type Signal`, `type ReadonlySignal`) | `~web/utils/signals` — a compat module already written for you (see below) |

Use the `~web/*` and `~core/*` path aliases that already exist in this
package's tsconfig. Keep relative imports between web files working.

## Signals → React (the important part)

`~web/utils/signals` provides API-compatible `signal`, `computed`, `effect`,
`untracked` plus the React hooks `useSignalValue`, `useComputed`, `useSignal`,
`useSignalEffect`. Read its doc comment.

Rules:

1. **Module-level `signal(...)` / `computed(...)` definitions** (e.g. in
   `state.ts`, `views/index.tsx`, `inspector/states.ts`): keep them as
   `signal()` / `computed()` imported from `~web/utils/signals`. Their
   `.value` / `.peek()` / `.subscribe()` API is preserved, so non-component
   consumers (event handlers, `effect`s, `~core` code) keep working unchanged.

2. **Reading a signal inside a component's render body**: the Preact code read
   `someSignal.value` directly and relied on auto-subscription. That does NOT
   work in React. Replace each such read with a hook call at the top of the
   component:
   ```tsx
   // before (Preact):  const widget = signalWidget.value;
   const widget = useSignalValue(signalWidget);
   // before (Preact, derived):  className={someComputed.value}
   const className = useSignalValue(someComputed);
   ```
   Reads of `.value` that are NOT in render (inside `onClick`, `useEffect`,
   helpers, module scope) stay as plain `.value`.

3. **`useSignal(x)`**: prefer converting trivially-local signals to `useState`
   when the `.value` call sites are few and local (more idiomatic). If `.value`
   is threaded through many helpers, keep `useSignal` from the compat module.
   State which you did in your summary.

4. **`useSignalEffect(fn)`**: use `useSignalEffect` from the compat module
   (it re-subscribes to whatever signals `fn` reads). If the effect's
   dependencies are obvious and stable, an idiomatic `useEffect` with explicit
   `useSignalValue` reads + a dep array is preferred — use judgment.

5. **`computed(...)` read in a component**: read via `useSignalValue(theComputed)`.

## Core hooks

`~core/notifications/event-tracking` exports `useToolbarEventLog`, which in the
original imports `useSyncExternalStore` from `preact/compat`. When a file in
this package consumes that hook it must use React's hook dispatcher. If you hit
this, do NOT edit core; instead read `toolbarEventStore` from
`~core/notifications/event-tracking` and subscribe to it with React's
`useSyncExternalStore` locally (or via a small `~web` wrapper hook). Note this
in your summary so it can be centralized.

## JSX idiom differences (apply everywhere)

- `class=` → `className=` (Preact allows both; React requires `className`).
- `for=` → `htmlFor=`.
- `onInput` on form controls → `onChange` (React's `onChange` fires on input).
  Preserve the handler body; the event type becomes
  `React.ChangeEvent<HTMLInputElement>` etc.
- `onDblClick` → `onDoubleClick`.
- Event handler param types: `JSX.TargetedEvent<...>` → the matching React
  synthetic event type (`React.MouseEvent`, `React.ChangeEvent`,
  `React.KeyboardEvent`, `React.PointerEvent`, ...).
- `ref` callbacks returning a value: React 18 ref callbacks must return void or
  a cleanup; keep them returning nothing unless on React 19.
- `style` accepts an object — unchanged. Numeric values unchanged.
- `dangerouslySetInnerHTML` — unchanged.
- Boolean/aria/data attributes — unchanged.
- SVG: `class` → `className`; most attrs unchanged in React 19. Keep
  `xmlns`, `viewBox`, etc.
- Inline `key` usage — unchanged.

## Class components & error boundaries

`toolbar.tsx` has a `Component`-based error boundary and `inspector/index.tsx`
has a class component. Port these to `React.Component` with the same lifecycle
methods (`getDerivedStateFromError`, `componentDidCatch`, `render`,
`componentDidMount`, `componentWillUnmount`). `this.props.children` is typed via
`PropsWithChildren`. Keep behavior identical.

## Mounting (`toolbar.tsx`)

Replace Preact `render(vnode, container)` with React 18+ `createRoot`:
```ts
import { createRoot, type Root } from "react-dom/client";
// mount
const root = createRoot(container);
root.render(<ToolbarErrorBoundary>...</ToolbarErrorBoundary>);
// unmount (replaces the double `render(null, container)` hack)
root.unmount();
```
Store the `Root` so the patched `container.remove` can call `root.unmount()`
once (the Preact "double render(null)" comment/hack is no longer needed).

## General rules

- **Preserve behavior, logic, comments, and public exports exactly.** This is a
  port, not a refactor. Do not rename exports, change algorithms, or drop
  comments. Only change framework API surface and JSX idioms.
- Match the surrounding code style (the repo uses double quotes, 2-space
  indent, named exports).
- Keep `/* @__PURE__ */` annotations.
- Do not add new dependencies beyond `react` / `react-dom`.
- Leave non-Preact `.ts` utility files alone — they already work.
- If you discover a cross-file concern (e.g. a shared type that needs a React
  equivalent, or a core hook issue), implement the local fix AND flag it in
  your summary.
