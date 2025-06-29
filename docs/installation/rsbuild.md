# Rsbuild Guide

## As a script tag

If you are using Rsbuild's default HTML template, add the script tag via [html.tags](https://rsbuild.dev/config/html/tags).

Refer to the [CDN Guide](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```ts
// rsbuild.config.ts
export default {
  html: {
    tags: [
      {
        tag: "script",
        attrs: {
          src: "https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js",
        },
        append: false,
      },
    ],
  },
};
```

If you are using a custom HTML template, add the script tag to your template file.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js"></script>

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
// src/index.jsx

// must be imported before React and React DOM
import { scan } from "react-scan";
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
