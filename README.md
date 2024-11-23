# <img src="https://github.com/aidenybai/react-scan/blob/main/.github/assets/logo.svg" width="30" height="30" align="center" /> React Scan

React Scan detects performance issues in your React app.

Previously, tools like [`<Profiler />`](https://react.dev/reference/react-devtools), [Why Did You Render?](https://github.com/welldone-software/why-did-you-render), and [React Devtools](https://legacy.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html) required lots of manual code change, lacked simple visual cues, or didn't have a simple, programmatic API.

Instead, React Scan automatically detects and highlights renders that cause performance issues. This shows you exactly which components you need to fix.

It's also just JavaScript, so you drop it in anywhere – script tag, npm, you name it!

### [**Try it out! →**](https://react-scan.million.dev)

![React Scan in action](https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/demo.gif?token=GHSAT0AAAAAAB4IOFACRC6P6E45TB2FPYFCZZV2AYA)

---

Engineering teams use React Scan to optimize their React apps:

<a href="https://airbnb.com"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/airbnb-logo.png" height="30" align="center" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://polaris.shopify.com/"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/shopify-logo.png" height="30" align="center" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://www.faire.com/"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/faire-logo.svg" height="20" align="center" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://perplexity.com/"><img src="https://raw.githubusercontent.com/aidenybai/react-scan/refs/heads/main/.github/assets/perplexity-logo.png" height="30" align="center" /></a>

> Looking for a more advanced version? Check out [Million Lint](https://million.dev)!

## Install

Get started in 5 seconds, add this script to your app:

```html
<!-- import this BEFORE any scripts -->
<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>
```

Or, run it on any website:

```bash
npx react-scan@latest https://react.dev
```

Examples:

<details>
<summary><b>Next.js (pages)</b></summary>

<br />

Add the script tag to your `pages/_document.tsx`:

```jsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>

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
<summary><b>Next.js (app)</b></summary>

<br />

Add the script tag to your `app/layout.tsx`:

```jsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
        {/* rest of your scripts go under */}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

</details>

<details>
<summary><b>Vite / Create React App</b></summary>

<br />

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

---

**_Or_**, install it via npm:

```bash
npm install react-scan
```

Then, in your app, import this **BEFORE** `react`:

```js
import { scan } from 'react-scan'; // import this BEFORE react
import React from 'react';

scan({
  enabled: true,
  log: true, // logs render info to console (default: false)
});
```

## API Reference

<details>
<summary><code>scan(options)</code></summary>

<br />

Automatically scan your app for renders.

```jsx
scan({
  /**
   * Enable/disable scanning
   */
  enabled: true,
  // Recommended way:
  // enabled: process.env.NODE_ENV === 'development',

  /**
   * Include children of a component applied with withScan
   */
  includeChildren: true,

  /**
   * Enable/disable geiger sound
   */
  playSound: true,

  /**
   * Log renders to the console
   */
  log: false,

  /**
   * Show toolbar bar
   */
  showToolbar: true,

  /**
   * Render count threshold, only show
   * when a component renders more than this
   */
  renderCountThreshold: 0,

  /**
   * Report data to getReport()
   */
  report: false,

  onCommitStart: () => {},
  onRender: (fiber, render) => {},
  onCommitFinish: () => {},
  onPaintStart: (outline) => {},
  onPaintFinish: (outline) => {},
});
```

</details>

<details>
<summary><code>withScan(Component, options)</code></summary>

<br />

Scan a specific component for renders.

```jsx
function Component(props) {
  // ...
}

withScan(Component, {
  /**
   * Enable/disable scanning
   */
  enabled: true,
  // Recommended way:
  // enabled: process.env.NODE_ENV === 'development',

  /**
   * Include children of a component applied with withScan
   */
  includeChildren: true,

  /**
   * Enable/disable geiger sound
   */
  playSound: true,

  /**
   * Log renders to the console
   */
  log: false,

  /**
   * Show toolbar bar
   */
  showToolbar: true,

  /**
   * Render count threshold, only show
   * when a component renders more than this
   */
  renderCountThreshold: 0,

  /**
   * Report data to getReport()
   */
  report: false,

  onCommitStart: () => {},
  onRender: (fiber, render) => {},
  onCommitFinish: () => {},
  onPaintStart: (outline) => {},
  onPaintFinish: (outline) => {},
});
```

</details>

<details>
<summary><code>getReport()</code></summary>

<br />

Get a aggregated report of all components and renders.

```jsx
scan({ report: true });

const report = getReport();

for (const component in report) {
  const { count, time } = report[component];

  console.log(`${component} rendered ${count} times, took ${time}ms`);
}
```

</details>

<details>
<summary><code>setOptions(options)</code></summary>

```jsx
function Component(props) {
  // ...
}

setOptions({
  /**
   * Enable/disable scanning
   */
  enabled: true,
  // Recommended way:
  // enabled: process.env.NODE_ENV === 'development',

  /**
   * Include children of a component applied with withScan
   */
  includeChildren: true,

  /**
   * Enable/disable geiger sound
   */
  playSound: true,

  /**
   * Log renders to the console
   */
  log: false,

  /**
   * Show toolbar bar
   */
  showToolbar: true,

  /**
   * Render count threshold, only show
   * when a component renders more than this
   */
  renderCountThreshold: 0,

  /**
   * Report data to getReport()
   */
  report: false,

  onCommitStart: () => {},
  onRender: (fiber, render) => {},
  onCommitFinish: () => {},
  onPaintStart: (outline) => {},
  onPaintFinish: (outline) => {},
});
```

</details>

<details>
<summary><code>getOptions()</code></summary>

```jsx
const {
  enabled,
  includeChildren,
  runInProduction,
  playSound,
  log,
  showToolbar,
  longTaskThreshold,
  resetCountTimeout,
} = getOptions();
```

</details>

## Why React Scan?

React can be tricky to optimize.

The issue is that component props are compared by reference, not value. This is intentional – this way rendering can be cheap to run.

However, this makes it easy to accidentally cause unnecessary renders, making the the app slow. Even in production apps, with hundreds of engineers, can't fully optimize their apps (see [GitHub](https://github.com/aidenybai/react-scan/blob/main/.github/assets/github.mp4), [Twitter](https://github.com/aidenybai/react-scan/blob/main/.github/assets/twitter.mp4), and [Instagram](https://github.com/aidenybai/react-scan/blob/main/.github/assets/instagram.mp4)).

This often comes down to props that update in reference, like callbacks or object values. For example, the `onClick` function and `style` object are re-created on every render, causing `ExpensiveComponent` to slow down the app:

```jsx
<ExpensiveComponent onClick={() => alert('hi')} style={{ color: 'purple' }} />
```

React Scan helps you identify these issues by automatically detecting and highlighting renders that cause performance issues. Now, instead of guessing, you can see exactly which components you need to fix.

> Want to automatically fix these issues? Check out [Million Lint](https://million.dev)!

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

**Q: React Native when?**

Soon :)

**Q: Chrome Extension when?**

Soon :)

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
- [ ] checkbox filtering API, leaderboard
- [ ] Offscreen canvas on worker thread
- [x] heatmap decay (stacked renders will be more intense)
- [ ] Investigate components (UI allowlist)
- [ ] UI for turning on/off options
- [ ] “PageSpeed insights” for React
- [ ] React Native support
- [ ] Name / explain the actual problem, docs
- [ ] Simple FPS counter
- [ ] Drag and select areas of the screen to scan
- [ ] Long task progress bar filter
- [x] Report should include all renders
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
