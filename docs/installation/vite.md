# Vite Guide

## As a script tag

Add the script tag to your `index.html`:

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

> [!CAUTION]
> React Scan must be imported before React (and other React renderers like React DOM) in your entire project, as it needs to hijack React DevTools before React gets to access it.

## Vite plugin

In your project's vite.config.ts, add the vite plugin

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

> Read more about [@react-scan/vite-plugin-react-scan](https://github.com/aidenybai/react-scan/blob/main/packages/vite-plugin-react-scan/README.md)

## Preserving component names

TODO
