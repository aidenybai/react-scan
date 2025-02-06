# Remix Guide

## As a script tag

Add the script tag to your `<Layout>` component in `app/root`:

```jsx
// app/root.jsx
import {
  Links,
  Meta,
  Outlet,
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

export default function App() {
  return <Outlet />;
}
```

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
