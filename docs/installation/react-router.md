# React Router v7 Guide

## As a script tag

Add the script tag to your `Layout` component in the `app/root`.

Refer to the [CDN Guide](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```jsx
// app/root
// ...
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
// ...
```

> [!CAUTION]
> This only works for React 19

## As an import

Add the following code to your `app/root`

```jsx
// app/root

// Must be imported before React Router
import { scan } from "react-scan"; 
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import { useEffect } from "react";

export function Layout({ children }) {
  useEffect(() => {
    // Make sure to run react-scan only after hydration
    scan({
      enabled: true,
    });
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// ...
```

If you want react-scan to also run in production, use the react-scan/all-environments import path
```diff
- import { scan } from "react-scan";
+ import { scan } from "react-scan/all-environments";
```

> [!CAUTION]
> React Scan must be imported before React (and other React renderers like React DOM), as well as React Router, in your entire project, as it needs to hijack React DevTools before React gets to access it.
