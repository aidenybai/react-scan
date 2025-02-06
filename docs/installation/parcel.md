# Parcel Guide

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
// src/index.jsx
import { scan } from "react-scan"; // must be imported before React and React DOM
import React from "react";

scan({
  enabled: true,
});
```

> [!CAUTION]
> React Scan must be imported before React (and other React renderers like React DOM) in your entire project, as it needs to hijack React DevTools before React gets to access it.
