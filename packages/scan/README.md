# <img src="https://github.com/aidenybai/react-scan/blob/main/.github/assets/logo.svg" width="30" height="30" align="center" /> React Scan

React Scan automatically detects performance issues in your React app.

Previously, tools like:

- [`<Profiler />`](https://react.dev/reference/react/Profiler) required lots of manual changes
- [Why Did You Render?](https://github.com/welldone-software/why-did-you-render) lacked simple visual cues
- [React Devtools](https://legacy.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html) didn't have a simple, portable, and programmatic API

React Scan attempts to solve these problems:

- It requires no code changes – just drop it in
- It highlights exactly the components you need to optimize
- Use it via script tag, npm, CLI, you name it!

Trusted by engineering teams at:

Airbnb&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://polaris.shopify.com/"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/shopify-logo.png" height="30" align="center" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://www.faire.com/"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/faire-logo.svg" height="20" align="center" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://perplexity.com/"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/perplexity-logo.png" height="30" align="center" /></a>

### [**Try it out! →**](https://react-scan.million.dev)

![React Scan in action](https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/demo.gif)

> [!IMPORTANT]
> Want to monitor issues in production? Check out [React Scan Monitoring](https://react-scan.com/monitoring)!

## Install

### Package managers

```bash
npm i react-scan
```

```bash
pnpm add react-scan
```

```bash
yarn add react-scan
```

### CDN

```html
<!-- import this BEFORE any scripts -->
<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>
```

## Usage

### As a script tag

<details>
<summary><b>NextJS (Page Router)</b></summary>

Add the script tag to your `pages/_document`:

```jsx
// pages/_document.jsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />

        {/* rest of your scripts go under */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

</details>

<details>
<summary><b>NextJS (App Router)</b></summary>

Add the script tag to your `app/layout`:

```jsx
// app/layout.jsx
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

</details>

<details>
<summary><b>Vite</b></summary>

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

</details>

<details>
<summary><b>CRA (Create React App)</b></summary>

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

</details>

<details>
<summary><b>Remix</b></summary>

Add the script tag to your `app/root`:

```jsx
// app/root.jsx
import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Hello world!</h1>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
```

</details>

<details>
<summary><b>Parcel</b></summary>

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

</details>

<details>
<summary><b>Astro</b></summary>

Add the script tag to your root layout

```astro
<!doctype html>
<html lang="en">
  <head>
    <script src="https://unpkg.com/react-scan/dist/auto.global.js" />

    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

</details>

<details>
<summary><b>TanStack Start</b></summary>

Add the script tag to your `<RootDocument>` component at `app/routes/__root`:

```jsx
// app/routes/__root.jsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Meta, Scripts } from '@tanstack/start'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }) {
  return (
    <html>
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        <Meta />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

</details>

### CLI

If you don't have a local version of the site or you want to test a React app remotely, you can use the CLI. This will spin up an isolated browser instance which you can interact or use React Scan with.

```bash
npx react-scan@latest http://localhost:3000
# you can technically scan ANY website on the web:
# npx react-scan@latest https://react.dev
```

You can add it to your existing dev process as well. Here's an example for Next.js:

```json
{
  "scripts": {
    "dev": "next dev",
    "scan": "next dev & npx react-scan@latest localhost:3000"
  }
}
```

### API

In your app, import this **BEFORE** `react`, ideally in your entrypoint file. This must run in a client context (e.g. not in a server component):

```js
import { scan } from "react-scan"; // import this BEFORE react
import React from "react";

if (typeof window !== "undefined") {
  scan({
    enabled: true,
    log: true, // logs render info to console (default: false)
  });
}
```

### Chrome Extension

If you want to install the Chrome extension, follow the guide [here](https://github.com/aidenybai/react-scan/blob/main/CHROME_EXTENSION_GUIDE.md).

### React Native

See [discussion](https://github.com/aidenybai/react-scan/pull/23)

## API Reference

<details>
<summary><code>Options</code></summary>

<br />

```tsx
export interface Options {
  /**
   * Enable/disable scanning
   *
   * Please use the recommended way:
   * enabled: process.env.NODE_ENV === 'development',
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Include children of a component applied with withScan
   *
   * @default true
   */
  includeChildren?: boolean;

  /**
   * Enable/disable geiger sound
   *
   * @default true
   */
  playSound?: boolean;

  /**
   * Log renders to the console
   *
   * @default false
   */
  log?: boolean;

  /**
   * Show toolbar bar
   *
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Render count threshold, only show
   * when a component renders more than this
   *
   * @default 0
   */
  renderCountThreshold?: number;

  /**
   * Clear aggregated fibers after this time in milliseconds
   *
   * @default 5000
   */
  resetCountTimeout?: number;

  /**
   * Maximum number of renders for red indicator
   *
   * @default 20
   * @deprecated
   */
  maxRenders?: number;

  /**
   * Report data to getReport()
   *
   * @default false
   */
  report?: boolean;

  /**
   * Always show labels
   *
   * @default false
   */
  alwaysShowLabels?: boolean;

  /**
   * Animation speed
   *
   * @default "fast"
   */
  animationSpeed?: "slow" | "fast" | "off";

  /**
   * Smoothly animate the re-render outline when the element moves
   *
   * @default true
   */
  smoothlyAnimateOutlines?: boolean;

  /**
   * Track unnecessary renders, and mark their outlines gray when detected
   *
   * An unnecessary render is defined as a component re-rendering with no change to the component's corresponding dom subtree (e.g. a component re-rendered, but nothing in the components UI did not change)
   *
   *  @default true
   *  @warning tracking unnecessary renders can add meaningful overhead to react-scan
   */
  trackUnnecessaryRenders?: boolean;

  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, render: Render) => void;
  onCommitFinish?: () => void;
  onPaintStart?: (outlines: PendingOutline[]) => void;
  onPaintFinish?: (outlines: PendingOutline[]) => void;
}
```

</details>

- `scan(options: Options)`: Imperative API to start scanning
- `useScan(options: Options)`: Hook API to start scanning
- `withScan(Component, options: Options)`: Whitelist a specific component, do not scan other components
- `getReport()`: Get a report of all the renders
- `setOptions(options: Options): void`: Set options at runtime
- `getOptions()`: Get the current options
- `onRender(Component, onRender: (fiber: Fiber, render: Render) => void)`: Hook into a specific component's renders
- `getRenderInfo(Component)`: Get the render info for a specific component

## Why React Scan?

React can be tricky to optimize.

The issue is that component props are compared by reference, not value. This is intentional – this way rendering can be cheap to run.

However, this makes it easy to accidentally cause unnecessary renders, making the app slow. Even in production apps, with hundreds of engineers, can't fully optimize their apps (see [GitHub](https://github.com/aidenybai/react-scan/blob/main/.github/assets/github.mp4), [Twitter](https://github.com/aidenybai/react-scan/blob/main/.github/assets/twitter.mp4), and [Instagram](https://github.com/aidenybai/react-scan/blob/main/.github/assets/instagram.mp4)).

This often comes down to props that update in reference, like callbacks or object values. For example, the `onClick` function and `style` object are re-created on every render, causing `ExpensiveComponent` to slow down the app:

```jsx
<ExpensiveComponent onClick={() => alert("hi")} style={{ color: "purple" }} />
```

React Scan helps you identify these issues by automatically detecting and highlighting renders that cause performance issues. Now, instead of guessing, you can see exactly which components you need to fix.

> Want monitor issues in production? Check out [React Scan Monitoring](https://react-scan.com/monitoring)!

### FAQ

**Q: Why this instead of React Devtools?**

React Devtools aims to be a general purpose tool for React. However, I deal with React performance issues every day, and React Devtools doesn't fix my problems well. There's a lot of noise (no obvious distinction between unnecessary and necessary renders), and there's no programmatic API. If it sounds like you have the same problems, then React Scan may be a better choice.

Also, some personal complaints about React Devtools' highlight feature:

- React Devtools "batches" paints, so if a component renders too fast, it will lag behind and only show 1 every second or so
- When you scroll/resize the boxes don't update position
- No count of how many renders there are
- I don't know what the bad/slow renders are without inspecting
- The menu is hidden away so it's annoying to turn on/off, user experience should be specifically tuned for debugging performance, instead of hidden behind a profiler/component tree
- No programmatic API
- It's stuck in a chrome extension, I want to run it anywhere on the web
- It looks subjectively ugly (lines look fuzzy, feels sluggish)
- I'm more ambitious with react-scan (see our roadmap)

## Resources & Contributing Back

Want to try it out? Check the [our demo](https://react-scan.million.dev).

Looking to contribute back? Check the [Contributing Guide](https://github.com/aidenybai/react-scan/blob/main/.github/CONTRIBUTING.md) out.

Want to talk to the community? Hop in our [Discord](https://discord.gg/X9yFbcV2rF) and share your ideas and what you've build with React Scan.

Find a bug? Head over to our [issue tracker](https://github.com/aidenybai/react-scan/issues) and we'll do our best to help. We love pull requests, too!

We expect all contributors to abide by the terms of our [Code of Conduct](https://github.com/aidenybai/react-scan/blob/main/.github/CODE_OF_CONDUCT.md).

[**→ Start contributing on GitHub**](https://github.com/aidenybai/react-scan/blob/main/.github/CONTRIBUTING.md)

## Roadmap

- [x] Scan only for unnecessary renders ("unstable" props)
- [x] Scan API (`withScan`, `scan`)
- [x] Cleanup config options
- [x] Chrome extension (h/t [@biw](https://github.com/biw))
- [x] Mode to highlight long tasks
- [x] Add context updates
- [x] Expose primitives / internals for advanced use cases
- [x] More explicit options override API (start log at certain area, stop log, etc.)
- [x] Don't show label if no reconciliation occurred ("client renders" in DevTools)
- [x] "global" counter using `sessionStorage`, aggregate count stats instead of immediate replacement
- [x] Give a general report of the app's performance
- [x] Select areas of the screen to scan
- [x] Report should include all renders
- [x] heatmap decay (stacked renders will be more intense)
- [x] Investigate components (UI allowlist)
- [ ] Offscreen canvas on worker thread
- [ ] UI for turning on/off options
- [ ] “PageSpeed insights” for React
- [ ] CLI
- [ ] React Native support
- [ ] Cleanup API reference
- [ ] Name / explain the actual problem, docs
- [ ] Simple FPS counter
- [ ] [Runtime version guarding](https://github.com/lahmatiy/react-render-tracker/blob/229ad0e9c28853615300724d5dc86c140f250f60/src/publisher/react-integration/utils/getInternalReactConstants.ts#L28)
- [ ] React as peer dependency (lock version to range)
- [ ] Add a funny mascot, like the ["Stop I'm Changing" dude](https://www.youtube.com/shorts/FwOZdX7bDKI?app=desktop)

## Acknowledgments

React Scan takes inspiration from the following projects:

- [React Devtools](https://react.dev/learn/react-developer-tools) for the initial idea of [highlighting renders](https://medium.com/dev-proto/highlight-react-components-updates-1b2832f2ce48). We chose to diverge from this to provide a [better developer experience](https://x.com/aidenybai/status/1857122670929969551)
- [Million Lint](https://million.dev) for scanning and linting approaches
- [Why Did You Render?](https://github.com/welldone-software/why-did-you-render) for the concept of hijacking internals to detect unnecessary renders caused by "unstable" props

## License

React Scan is [MIT-licensed](LICENSE) open-source software by Aiden Bai, [Million Software, Inc.](https://million.dev), and [contributors](https://github.com/aidenybai/react-scan/graphs/contributors):
