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
bun add react-scan
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

- [NextJS App Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/next-js-app-router.md)
- [NextJS Page Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/next-js-page-router.md)
- [Create React App](https://github.com/aidenybai/react-scan/blob/main/docs/installation/create-react-app.md)
- [Vite](https://github.com/aidenybai/react-scan/blob/main/docs/installation/vite.md)
- [Parcel](https://github.com/aidenybai/react-scan/blob/main/docs/installation/parcel.md)
- [Remix](https://github.com/aidenybai/react-scan/blob/main/docs/installation/remix.md)
- [React Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/react-router.md)
- [Astro](https://github.com/aidenybai/react-scan/blob/main/docs/installation/astro.md)
- [TanStack Start](https://github.com/aidenybai/react-scan/blob/main/docs/installation/tanstack-start.md)

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

### Browser Extension

If you want to install the extension, follow the guide [here](https://github.com/aidenybai/react-scan/blob/main/BROWSER_EXTENSION_GUIDE.md).

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
   * Force React Scan to run in production (not recommended)
   *
   * @default false
   */
  dangerouslyForceRunInProduction?: boolean;
  /**
   * Log renders to the console
   *
   * WARNING: This can add significant overhead when the app re-renders frequently
   *
   * @default false
   */
  log?: boolean;

  /**
   * Show toolbar bar
   *
   * If you set this to true, and set {@link enabled} to false, the toolbar will still show, but scanning will be disabled.
   *
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Animation speed
   *
   * @default "fast"
   */
  animationSpeed?: "slow" | "fast" | "off";

  /**
   * Track unnecessary renders, and mark their outlines gray when detected
   *
   * An unnecessary render is defined as the component re-rendering with no change to the component's
   * corresponding dom subtree
   *
   *  @default false
   *  @warning tracking unnecessary renders can add meaningful overhead to react-scan
   */
  trackUnnecessaryRenders?: boolean;

  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish?: () => void;
  onPaintStart?: (outlines: Array<Outline>) => void;
  onPaintFinish?: (outlines: Array<Outline>) => void;
}
```

</details>

- `scan(options: Options)`: Imperative API to start scanning
- `useScan(options: Options)`: Hook API to start scanning
- `getReport()`: Get a report of all the renders
- `setOptions(options: Options): void`: Set options at runtime
- `getOptions()`: Get the current options
- `onRender(Component, onRender: (fiber: Fiber, render: Render) => void)`: Hook into a specific component's renders

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
- I'm more ambitious with react-scan

## Resources & Contributing Back

Want to try it out? Check the [our demo](https://react-scan.million.dev).

Looking to contribute back? Check the [Contributing Guide](https://github.com/aidenybai/react-scan/blob/main/CONTRIBUTING.md) out.

Want to talk to the community? Hop in our [Discord](https://discord.gg/X9yFbcV2rF) and share your ideas and what you've build with React Scan.

Find a bug? Head over to our [issue tracker](https://github.com/aidenybai/react-scan/issues) and we'll do our best to help. We love pull requests, too!

We expect all contributors to abide by the terms of our [Code of Conduct](https://github.com/aidenybai/react-scan/blob/main/.github/CODE_OF_CONDUCT.md).

[**→ Start contributing on GitHub**](https://github.com/aidenybai/react-scan/blob/main/CONTRIBUTING.md)

## Acknowledgments

React Scan takes inspiration from the following projects:

- [React Devtools](https://react.dev/learn/react-developer-tools) for the initial idea of [highlighting renders](https://medium.com/dev-proto/highlight-react-components-updates-1b2832f2ce48). We chose to diverge from this to provide a [better developer experience](https://x.com/aidenybai/status/1857122670929969551)
- [Million Lint](https://million.dev) for scanning and linting approaches
- [Why Did You Render?](https://github.com/welldone-software/why-did-you-render) for the concept of hijacking internals to detect unnecessary renders caused by "unstable" props

## License

React Scan is [MIT-licensed](LICENSE) open-source software by Aiden Bai, [Million Software, Inc.](https://million.dev), and [contributors](https://github.com/aidenybai/react-scan/graphs/contributors).
