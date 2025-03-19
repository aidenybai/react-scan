# Remix Guide

## As a script tag

Add the script tag to your `<Layout>` component in `app/root`.

Refer to the [CDN Guide](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```jsx
// app/root.jsx
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Must run before any of your scripts */}
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

## As a module import

Add the following code to your `app/root`:

```jsx
// app/root.jsx
import { scan } from "react-scan"; // Must be imported before Remix
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export function Layout({ children }) {
  useEffect(() => {
    // Make sure to run React Scan after hydration
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

export default function App() {
  return <Outlet />;
}
```

> [!CAUTION]
> React Scan must be imported before React (and other React renderers like React DOM), as well as Remix, in your entire project, as it needs to hijack React DevTools before React gets to access it.

Alternatively you can also do the following code in `app/entry.client`:

```jsx
// app/entry.client.jsx
import { RemixBrowser } from "@remix-run/react";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { scan } from "react-scan";

scan({
  enabled: true,
});

// Hydration must happen in sync!
// startTransition(() => {
hydrateRoot(
  document,
  <StrictMode>
    <RemixBrowser />
  </StrictMode>
);
// });
```

> [!CAUTION]
> This only works for React 19
