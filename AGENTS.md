## General Rules

- MUST: Use TypeScript interfaces over types.
- MUST: Keep all types in the global scope.
- MUST: Use arrow functions over function declarations.
- MUST: Default to NO comments. Only add a comment when the user explicitly asks, or when the "why" is truly non-obvious - browser quirks, platform bugs, performance tradeoffs, fragile internal patching, or counter-intuitive design decisions. Never add comments that restate what the code does or what a well-named function/variable already conveys. When in doubt, leave the comment out.
  - If a hack is required (like a `setTimeout` that hides a race), prefix with `// HACK: reason for hack`.
  - Do not delete descriptive comments >3 lines without confirming with the user.
- MUST: Use kebab-case for files.
- MUST: Use descriptive names for variables (avoid shorthands, or 1-2 character names).
  - Example: for `.map()`, use `innerNode` instead of `n`.
  - Example: instead of `moved` use `didPositionChange`.
- MUST: Frequently re-evaluate and refactor variable names to be more accurate and descriptive.
- MUST: Do not type cast (`as`) unless absolutely necessary.
- MUST: Remove unused code and don't repeat yourself.
- MUST: Always search the codebase, think of many solutions, then implement the most _elegant_ solution.
- MUST: Put all magic numbers in `constants.ts` using `SCREAMING_SNAKE_CASE` with unit suffixes (`_MS`, `_PX`).
- MUST: Put small, focused utility functions in `utils/` with one utility per file.
- MUST: Use `Boolean(x)` over `!!x`.

## Preact + @preact/signals Rules

React Scan's overlay UI runs as a Preact app mounted inside a Shadow DOM (see [`packages/scan/src/core/index.ts`](packages/scan/src/core/index.ts)). Reactivity is driven by `@preact/signals`, not React state.

### Signals

- MUST: Read signals via `.value` inside JSX/effects: `signalWidget.value` not `signalWidget()`.
- MUST: Write signals atomically: `signalWidget.value = { ...signalWidget.value, dimensions: ... }`. One signal per logical slice.
- MUST: Use `useSignal(initial)` for component-local reactive state, `useComputed(() => ...)` for derived values, `useSignalEffect(() => ...)` for subscriptions/DOM imperative work.
- MUST: Wrap module-level signals exported from a tree-shaken bundle with `/* @__PURE__ */ signal(...)` so production builds can drop unused state.
- SHOULD: Persist user-facing state via `readLocalStorage`/`saveLocalStorage` from [`~web/utils/helpers`](packages/scan/src/web/utils/helpers.ts) and seed the signal with the persisted value.
- NEVER: Mirror one signal into another inside `useSignalEffect` - find the single source of truth (compute on read).

### Effects

Before reaching for `useEffect`/`useSignalEffect`, classify the work:

- MUST: Use `useComputed` when the result is pure derived state from other signals. If no external system is touched, it is not an effect.
- MUST: Use event handlers and direct action calls when work happens because the user clicked, dragged, or navigated. Do not watch a flag in an effect to trigger imperative logic.
- MUST: Use `useEffect(..., [])` (or `useSignalEffect` with no deps) for one-time mount/cleanup of subscriptions, timers, listeners, and `MutationObserver`s. Always return the cleanup.
- MUST: Keep each effect single-purpose - one effect, one external bridge. Split mixed-responsibility effects.
- NEVER: Use an effect just to copy one signal into another.
- NEVER: Use an effect as an event bus (watching a trigger signal to run a command). Call the action directly from the event source.

### Props

- MUST: Access props via `props.title`, not destructuring, when the prop is read inside an event handler that fires later or inside an effect.
- SHOULD: Destructure props at the top of the body for purely-rendered values (read once during render).
- NEVER: Destructure a prop that is itself a signal-driven slice if you intend to re-read it after async work.

### JSX & DOM

- MUST: Use `className` (we render via Preact's React-compat JSX in [`tsconfig.json`](tsconfig.json) `jsxImportSource: preact`).
- MUST: Combine static `className="btn"` with reactive `className={cn("btn", isActive.value && "active")}` via [`cn`](packages/scan/src/web/utils/helpers.ts).
- MUST: Read refs in `useEffect` or via the callback ref pattern - DOM refs are populated after render.
- MUST: Mount overlay UI under the existing shadow root from `initRootContainer()` in [`core/index.ts`](packages/scan/src/core/index.ts). Do not append directly to `document.body`.
- SHOULD: Use `style={{ "--css-var": value }}` for dynamic CSS variables; class toggles for boolean states.
- SHOULD: Type refs as `let element: HTMLElement | null = null` with a guard.

## Build & Toolchain

This is a pnpm 10 monorepo with `packages/*` (libraries, extension, website) and a top-level `kitchen-sink/` (Playwright target). The toolchain is [Vite+](https://viteplus.dev) (`vp lint`, `vp fmt`, `vp check`) and `turbo` for pipeline orchestration.

### Approved built dependencies

The root [`package.json`](package.json) declares `pnpm.onlyBuiltDependencies` for `@parcel/watcher`, `esbuild`, `sharp`, `spawn-sync`, `unrs-resolver`. Without this list, `pnpm install` skips their native build steps and downstream packages fail.

### Build before test

`pnpm build` must complete before `pnpm test`, `pnpm test:e2e`, or `pnpm lint`. After modifying source files, always rebuild before running tests. Turbo enforces this via `dependsOn: ["^build"]` in [`turbo.json`](turbo.json).

### Playwright

`pnpm test:e2e` runs Playwright against the `kitchen-sink` Vite dev server on port 5173 (auto-started by [`playwright.config.ts`](playwright.config.ts)). Chromium must be installed: `npx playwright install chromium --with-deps`.

### Key commands

| Task           | Command                                      |
| -------------- | -------------------------------------------- |
| Install        | `pnpm install`                               |
| Build          | `pnpm build`                                 |
| Dev watch      | `pnpm dev` (watches `react-scan` + kitchen-sink) |
| Unit tests     | `pnpm test`                                  |
| E2E tests      | `pnpm test:e2e`                              |
| Lint           | `pnpm lint` (oxlint via vite-plus)           |
| Lint + fix     | `pnpm lint:fix`                              |
| Format         | `pnpm format` (oxfmt via vite-plus)          |
| Format check   | `pnpm format:check`                          |
| Typecheck      | `pnpm typecheck`                             |
| Combined       | `pnpm check` (lint + fmt check + typecheck)  |

## Testing

Run checks always before committing with:

```bash
pnpm build
pnpm lint
pnpm format
pnpm typecheck
pnpm test:e2e
```
