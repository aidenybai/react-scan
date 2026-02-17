# react-scan

## 0.5.1

### Patch Changes

- fix: infinite mounting

## 0.5.0

### Minor Changes

- cleanup
- 9d38ffe: Remove monitoring module, replace Playwright CLI with interactive init command, clean up dead code

  - Removed the entire monitoring system (`packages/scan/src/core/monitor/`) and all related exports, types, and build entries
  - Replaced the Playwright-based proxy CLI (`npx react-scan <url>`) with an interactive `npx react-scan init` command that auto-detects your framework and sets up React Scan
  - Removed unused code: old outline system, LRU cache, lazy refs, commented-out code blocks, and unused exports
  - Consolidated duplicate utilities (safeGetValue, RenderPhase types)
  - Simplified README to focus on the new init command
  - Added CLI quick-start command to the website homepage
