# <img src="https://github.com/aidenybai/react-scan/blob/main/.github/assets/logo.svg" width="30" height="30" align="center" /> React Scan

React Scan automatically detects performance issues in your React app.

- Requires no code changes -- just drop it in
- Highlights exactly the components you need to optimize
- Always accessible through a toolbar on page

### Quick Start

```bash
npx -y react-scan@latest init
```

### [**Try out a demo! →**](https://react-scan.million.dev)
<img
  src="https://github.com/user-attachments/assets/c21b3afd-c7e8-458a-a760-9a027be7dc02"
  alt="React Scan in action"
  width="600"
/>

## Install

The `init` command will automatically detect your framework and set up React Scan for you.

```bash
npx -y react-scan@latest init
```

### Manual Installation

#### Package managers

```bash
npm i -D react-scan
```

#### Script tag

```html
<script src="https://unpkg.com/react-scan/dist/auto.global.js" crossorigin="anonymous"></script>
```

#### Framework guides

- [Script Tag](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md)
- [NextJS App Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/next-js-app-router.md)
- [NextJS Page Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/next-js-page-router.md)
- [Vite](https://github.com/aidenybai/react-scan/blob/main/docs/installation/vite.md)
- [Create React App](https://github.com/aidenybai/react-scan/blob/main/docs/installation/create-react-app.md)
- [Remix](https://github.com/aidenybai/react-scan/blob/main/docs/installation/remix.md)
- [React Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/react-router.md)
- [Astro](https://github.com/aidenybai/react-scan/blob/main/docs/installation/astro.md)
- [TanStack Start](https://github.com/aidenybai/react-scan/blob/main/docs/installation/tanstack-start.md)
- [Rsbuild](https://github.com/aidenybai/react-scan/blob/main/docs/installation/rsbuild.md)

### Browser Extension

Install the extension by following the guide [here](https://github.com/aidenybai/react-scan/blob/main/BROWSER_EXTENSION_GUIDE.md).

## API Reference

<details>
<summary><code>Options</code></summary>

<br />

```tsx
export interface Options {
  /**
   * Enable/disable scanning
   * @default true
   */
  enabled?: boolean;

  /**
   * Force React Scan to run in production (not recommended)
   * @default false
   */
  dangerouslyForceRunInProduction?: boolean;

  /**
   * Log renders to the console
   * @default false
   */
  log?: boolean;

  /**
   * Show toolbar bar
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Animation speed
   * @default "fast"
   */
  animationSpeed?: "slow" | "fast" | "off";

  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish?: () => void;
}
```

</details>

- `scan(options: Options)`: Imperative API to start scanning
- `useScan(options: Options)`: Hook API to start scanning
- `setOptions(options: Options): void`: Set options at runtime
- `getOptions()`: Get the current options
- `onRender(Component, onRender: (fiber: Fiber, render: Render) => void)`: Hook into a specific component's renders

## Why React Scan?

React can be tricky to optimize.

The issue is that component props are compared by reference, not value. This is intentional -- rendering can be cheap to run.

However, this makes it easy to accidentally cause unnecessary renders, making the app slow. Even production apps with hundreds of engineers can't fully optimize their apps (see [GitHub](https://github.com/aidenybai/react-scan/blob/main/.github/assets/github.mp4), [Twitter](https://github.com/aidenybai/react-scan/blob/main/.github/assets/twitter.mp4), and [Instagram](https://github.com/aidenybai/react-scan/blob/main/.github/assets/instagram.mp4)).

```jsx
<ExpensiveComponent onClick={() => alert("hi")} style={{ color: "purple" }} />
```

React Scan helps you identify these issues by automatically detecting and highlighting renders that cause performance issues.

## Resources & Contributing

Want to try it out? Check the [demo](https://react-scan.million.dev).

Looking to contribute? Check the [Contributing Guide](https://github.com/aidenybai/react-scan/blob/main/CONTRIBUTING.md).

Want to talk to the community? Join our [Discord](https://discord.gg/X9yFbcV2rF).

Find a bug? Head to our [issue tracker](https://github.com/aidenybai/react-scan/issues).

[**→ Start contributing on GitHub**](https://github.com/aidenybai/react-scan/blob/main/CONTRIBUTING.md)

## Acknowledgments

- [React Devtools](https://react.dev/learn/react-developer-tools) for the initial idea of highlighting renders
- [Million Lint](https://million.dev) for scanning and linting approaches
- [Why Did You Render?](https://github.com/welldone-software/why-did-you-render) for the concept of detecting unnecessary renders

## License

React Scan is [MIT-licensed](LICENSE) open-source software by Aiden Bai, [Million Software, Inc.](https://million.dev), and [contributors](https://github.com/aidenybai/react-scan/graphs/contributors).
