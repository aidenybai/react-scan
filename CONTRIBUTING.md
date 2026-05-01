# Contributing to React Scan

Thanks for your interest in contributing to React Scan! This document covers the project layout, dev setup, and the workflow for getting your change merged.

## Project Structure

This is a pnpm 10 monorepo orchestrated by [turbo](https://turbo.build) and built on [Vite+](https://viteplus.dev) (oxlint, oxfmt, tsdown).

```
packages/
├── scan/                    # Core React Scan library + CLI
├── extension/               # Browser extension (Chrome / Firefox / Brave)
├── vite-plugin-react-scan/  # Vite plugin wrapper
└── website/                 # Marketing site (Next.js, react-scan.com)

kitchen-sink/                # Playwright target app (Vite, port 5173)
e2e/                         # Playwright specs
docs/installation/           # Per-framework install guides
```

## Development Setup

### Prerequisites

- Node.js >= 22
- pnpm >= 10

### Setup

```bash
git clone https://github.com/aidenybai/react-scan.git
cd react-scan
pnpm install
pnpm build
```

### Dev workflow

```bash
pnpm dev                                    # watches react-scan + kitchen-sink in parallel
pnpm --filter react-scan build:copy         # build and copy IIFE to clipboard for ad-hoc testing
pnpm --filter @react-scan/extension dev     # extension in Chrome
pnpm --filter @react-scan/website dev       # marketing site
```

## Code Style

We use [Vite+](https://viteplus.dev) which bundles oxlint and oxfmt. See [`AGENTS.md`](AGENTS.md) for the full rule set.

```bash
pnpm lint            # check
pnpm lint:fix        # auto-fix
pnpm format          # write
pnpm format:check    # verify
pnpm check           # lint + format:check + typecheck
pnpm typecheck
```

Highlights:

- TypeScript everywhere; avoid `any`.
- Interfaces over types; kebab-case filenames.
- Arrow functions over function declarations.
- No comments unless the "why" is non-obvious. Hacks must be prefixed with `// HACK: …`.
- Magic numbers in `constants.ts` with `_MS` / `_PX` unit suffixes.
- One utility per file under `utils/`.

## Tests

```bash
pnpm test              # vitest in each package
pnpm test:e2e          # Playwright against kitchen-sink (auto-started on :5173)
pnpm test:e2e:ui       # Playwright UI mode
```

## Pull Requests

1. Fork and create a branch (`git checkout -b feat/your-feature`).
2. Make your changes; run `pnpm check` and `pnpm test:e2e` before pushing.
3. If your change affects a published package, add a changeset:
   ```bash
   pnpm changeset
   ```
4. Open a PR against `main`. Tag [@aidenybai](https://github.com/aidenybai) for review.

### Commit Convention

We use conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `chore:` Maintenance
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Tests

Example: `fix(scan): handle null fiber in flash overlay`

## Getting Help

- Check existing [issues](https://github.com/aidenybai/react-scan/issues)
- Open a new issue with a minimal repro
- Join our [Discord](https://discord.gg/KV3FhDq7FA)

Happy contributing!
