# NextJS App Router Guide

## As a script tag

Add the script tag to your `app/layout`:

```jsx
// app/layout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        {/* rest of your scripts go under */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## As a module import

Create a `<ReactScan>` client component:

```jsx
// path/to/ReactScanComponent

"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { JSX, useEffect } from "react";

export function ReactScan(): JSX.Element {
  useEffect(() => {
    scan({
      enabled: true,
    });
  }, []);

  return <></>;
}
```

Import the `<ReactScan>` component into `app/layout`:

```jsx
// app/layout

// This component must be the top-most import in this file!
import { ReactScan } from "path/to/ReactScanComponent";

// ...

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ReactScan />
      <body>
        {children}
      </body>
    </html>
  );
}
```
