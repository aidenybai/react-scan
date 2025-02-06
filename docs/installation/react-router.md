# React Router v7 Guide

## As a script tag

Add the script tag to your `Layout` component in the `app/root`:

```jsx
// app/root.jsx
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

## As an import

Add the following code to your `app/root`

```jsx
// app/root.jsx
import { scan } from 'react-scan'; // Must be imported before React Router
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

if (typeof window !== 'undefined') {
  scan({
    enabled: true,
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
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
> React Scan must be imported before React (and other React renderers like React DOM), as well as React Router, in your entire project, as it needs to hijack React DevTools before React gets to access it.
