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
- MUST: Avoid dynamic imports unless they are required for meaningful code splitting or an otherwise unavoidable cycle.

## V8 Hot-Path Rules

For hot per-frame paths such as pointer handlers, animation ticks, outline drawing, and fiber walks:

- MUST: Keep indirect call sites monomorphic. Split hot iterators by callback shape or inline the loop.
- MUST: Mutate stable object fields in place instead of allocating replacement objects every frame.
- MUST: Keep numeric helpers in one number lane. Avoid mixing integer and double return shapes at the same hot call site.
- SHOULD: Prefer closed-form arithmetic over normalization loops.
- SHOULD: Reuse arrays, maps, rectangles, and coordinate records when profiling shows allocation pressure.

## SolidJS Rules

React Scan's overlay UI is a SolidJS app mounted inside the Shadow DOM created by [`packages/scan/src/core/index.ts`](packages/scan/src/core/index.ts).

### Mental Model

- MUST: Treat components as setup functions that run once.
- MUST: Put reactive work in Solid primitives and JSX control flow, not untracked component-body reads.
- MUST: Access signals only inside reactive contexts.

### Reactivity

- MUST: Read signals by calling their accessors.
- MUST: Use functional setters when the next value depends on the previous value.
- MUST: Keep signals focused and use stores for nested state that benefits from path updates.
- MUST: Use derived functions for cheap derivations and `createMemo` for expensive or frequently-read derivations.
- MUST: Use `createEffect` only for external side effects.
- MUST: Register listener, timer, observer, and subscription cleanup with `onCleanup`.
- SHOULD: Use `batch` when multiple writes outside an event handler form one logical update.
- SHOULD: Use `on` for explicit effect dependencies and `untrack` for intentional non-reactive reads.
- NEVER: Mirror one signal or store into another in an effect.
- NEVER: Put side effects inside `createMemo`.

### Effects

Before reaching for `createEffect`, classify the work:

- MUST: Use `createMemo` when the result is pure derived state.
- MUST: Use event handlers and direct action calls when work happens because the user clicked, dragged, or navigated. Do not watch a flag in an effect to trigger imperative logic.
- MUST: Use `onMount` and `onCleanup` for one-time lifecycle setup and teardown.
- MUST: Keep each effect single-purpose - one effect, one external bridge. Split mixed-responsibility effects.
- NEVER: Use an effect just to copy one signal into another.
- NEVER: Use an effect as an event bus (watching a trigger signal to run a command). Call the action directly from the event source.

### Props

- MUST: Access reactive props through `props.title`; do not destructure them.
- SHOULD: Use `splitProps` for local versus pass-through props and `mergeProps` for defaults.
- SHOULD: Use a getter when a derived prop name improves readability.

### Control Flow

- MUST: Use `<For>` for object arrays and `<Index>` for primitive arrays or editable items.
- SHOULD: Use `<Show>` for conditional branches and `<Switch>/<Match>` for multiple exclusive branches.
- NEVER: Use `.map()` directly in JSX.

### JSX & DOM

- MUST: Use `class`, not `className`.
- MUST: Use `classList` for reactive class toggles and `cn` for composed static classes.
- MUST: Read refs after mount or inside reactive callbacks where connection is guaranteed.
- MUST: Mount overlay UI under the existing shadow root from `initRootContainer()` in [`core/index.ts`](packages/scan/src/core/index.ts). Do not append directly to `document.body`.
- SHOULD: Use CSS variables for dynamic scalar styles and classes for boolean visual state.
- SHOULD: Type refs as `let element: HTMLElement | undefined` and guard before use.
- SHOULD: Use native `on:event` listeners when propagation, capture, passive options, or exact element ownership matters.
- NEVER: Mix a reactive `class` expression with `classList` on the same element.

## Build & Toolchain

This is a pnpm 10 monorepo with `packages/*` (libraries, extension, website) and a top-level `kitchen-sink/` (Playwright target). The toolchain is [Vite+](https://viteplus.dev) (`vp lint`, `vp fmt`, `vp check`) and `turbo` for pipeline orchestration.

### Approved built dependencies

The root [`package.json`](package.json) declares `pnpm.onlyBuiltDependencies` for `@parcel/watcher`, `esbuild`, `sharp`, `spawn-sync`, `unrs-resolver`. Without this list, `pnpm install` skips their native build steps and downstream packages fail.

### Build before test

`pnpm build` must complete before `pnpm test`, `pnpm test:e2e`, or `pnpm lint`. After modifying source files, always rebuild before running tests. Turbo enforces this via `dependsOn: ["^build"]` in [`turbo.json`](turbo.json).

### Playwright

`pnpm test:e2e` runs Playwright against the `kitchen-sink` Vite dev server on port 5173 (auto-started by [`playwright.config.ts`](playwright.config.ts)). Chromium must be installed: `npx playwright install chromium --with-deps`.

### Key commands

| Task         | Command                                          |
| ------------ | ------------------------------------------------ |
| Install      | `pnpm install`                                   |
| Build        | `pnpm build`                                     |
| Dev watch    | `pnpm dev` (watches `react-scan` + kitchen-sink) |
| Unit tests   | `pnpm test`                                      |
| E2E tests    | `pnpm test:e2e`                                  |
| Lint         | `pnpm lint` (oxlint via vite-plus)               |
| Lint + fix   | `pnpm lint:fix`                                  |
| Format       | `pnpm format` (oxfmt via vite-plus)              |
| Format check | `pnpm format:check`                              |
| Typecheck    | `pnpm typecheck`                                 |
| Combined     | `pnpm check` (lint + fmt check + typecheck)      |

## Testing

Run checks always before committing with:

```bash
pnpm build
pnpm lint
pnpm format
pnpm typecheck
pnpm test:e2e
```
