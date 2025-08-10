# Vite Guide

## As a script tag

Add the script tag to your `index.html`.

Refer to the [CDN Guide](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```html
<!doctype html>
<html lang="en">
  <head>
    <script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>

    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

## As a module import

In your project entrypoint (e.g. `src/index`, `src/main`):

```jsx
// src/index
import { scan } from "react-scan"; // must be imported before React and React DOM
import React from "react";

scan({
  enabled: true,
});
```

If you want react-scan to also run in production, use the react-scan/all-environments import path

```diff
- import { scan } from "react-scan";
+ import { scan } from "react-scan/all-environments";
```


> [!CAUTION]
> React Scan must be imported before React (and other React renderers like React DOM) in your entire project, as it needs to hijack React DevTools before React gets to access it.

## Vite plugin

### @react-scan/vite-plugin-react-scan

- A Vite plugin that integrates React Scan into your Vite application, automatically detecting performance issues in your React components.

## Installation

```bash
# npm
npm install -D @react-scan/vite-plugin-react-scan react-scan

# pnpm
pnpm add -D @react-scan/vite-plugin-react-scan react-scan

# yarn
yarn add -D @react-scan/vite-plugin-react-scan react-scan
```

> **Note:** Make sure `react-scan` is installed as a peer dependency. The plugin will automatically locate it in your project's dependency tree.

## Usage

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@react-scan/vite-plugin-react-scan';

export default defineConfig({
  plugins: [
    react(),
    reactScan({
      autoDisplayNames: true,
      debug: false, // Disable debug logs
      enable: process.env["NODE_ENV"] === "development",
      scanOptions: {
        animationSpeed: "fast",
        dangerouslyForceRunInProduction: false,
        enabled: process.env["NODE_ENV"] === "development",
        log: false,
        showToolbar: process.env["NODE_ENV"] === "development",
        trackUnnecessaryRenders: true,
      },
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | `boolean` | `process.env.NODE_ENV === 'development'` | Enable/disable scanning |
| `autoDisplayNames` | `boolean` | `false` | Automatically add display names to React components |
| `debug` | `boolean` | `false` | Enable debug logging |
| `scanOptions` | `object` | `{ ... }` | Custom React Scan options |
|--------|------|---------|-------------|
| `scanOptions.animationSpeed` | `string` | `"fast"` | Speed of UI animations (e.g., overlays/toolbar) |
| `scanOptions.dangerouslyForceRunInProduction` | `boolean` | `false` | Force React Scan to run in production (use with caution) |
| `scanOptions.enabled` | `boolean` | `process.env["NODE_ENV"] === "development"` | Enable/disable scanning from React Scan itself |
| `scanOptions.log` | `boolean` | `false` | Enable console logging from React Scan |
| `scanOptions.showToolbar` | `boolean` | `process.env["NODE_ENV"] === "development"` | Show the in-page React Scan toolbar |
| `scanOptions.trackUnnecessaryRenders` | `boolean` | `true` | Track and highlight unnecessary renders |

- React scanOptions.options must be placed in an array under the scanOptions key.

## Example Configuration

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@react-scan/vite-plugin-react-scan';

export default defineConfig({
  plugins: [
    react(),
    reactScan({
      enable: true,
      autoDisplayNames: true,
      scanOptions: {} // React Scan specific options
    }),
  ],
});
```

## Development vs Production

- In development: The plugin injects React Scan directly into your application for real-time analysis
- In production: The plugin can be disabled/enabled by default with specific options

## Preserving component names

TODO
