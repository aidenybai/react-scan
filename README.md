> I'm working on something new (still free + open source!)
> 
> React Grab allows you to select an element and copy its context (like HTML, React component, and file source)
>
> Check it out: [**react-grab.com**](https://react-grab.com)

# <img src="https://github.com/aidenybai/react-scan/blob/main/.github/assets/logo.svg" width="30" height="30" align="center" /> React Scan

React Scan automatically detects performance issues in your React app.

Previously, tools like:

- [React Devtools](https://legacy.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html) can feel too complex and janky
- [Why Did You Render?](https://github.com/welldone-software/why-did-you-render) lacked simple visual cues

React Scan attempts to solve these problems:

- It requires no code changes – just drop it in
- It highlights exactly the components you need to optimize
- No more having to use flame graphs when profiling
- Always accessible through a toolbar on page

### Try it in 5 seconds
<pre>
npx react-scan airbnb.com
</pre>

or on your local website
<pre>
npx react-scan localhost:3000
</pre>

> all installation options below



### [**Try out a demo! →**](https://react-scan.million.dev)
<img
  src="https://github.com/user-attachments/assets/c21b3afd-c7e8-458a-a760-9a027be7dc02"
  alt="React Scan in action"
  width="600"
/>

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

## Usage

- [Script Tag](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md)
- [NextJS App Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/next-js-app-router.md)
- [NextJS Page Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/next-js-page-router.md)
- [Vite](https://github.com/aidenybai/react-scan/blob/main/docs/installation/vite.md)
- [Create React App](https://github.com/aidenybai/react-scan/blob/main/docs/installation/create-react-app.md)
- [Parcel](https://github.com/aidenybai/react-scan/blob/main/docs/installation/parcel.md)
- [Remix](https://github.com/aidenybai/react-scan/blob/main/docs/installation/remix.md)
- [React Router](https://github.com/aidenybai/react-scan/blob/main/docs/installation/react-router.md)
- [Astro](https://github.com/aidenybai/react-scan/blob/main/docs/installation/astro.md)
- [TanStack Start](https://github.com/aidenybai/react-scan/blob/main/docs/installation/tanstack-start.md)
- [Rsbuild](https://github.com/aidenybai/react-scan/blob/main/docs/installation/rsbuild.md)

### CLI

If you want to run react scan on any URL (including localhost) from the cli, you can run:

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


## After Setup

<details>
<summary><code>How to use/feature descriptions</code></summary>
  
### Toolbar
All react scan features are exposed through the toolbar that you will see in the bottom right corner of your page:

<img width="220" alt="image" src="https://github.com/user-attachments/assets/20b83531-7e06-48c2-92d4-07f398dcace4" />

> You can drag this toolbar to any corner of the page

### Render Outlines
By default, react scan will show outlines over components when they render.
> interact with your page to try it out!

If you want to turn the outlines off, you can use the toggle in the toolbar to turn them off. This will persist across page loads and will only re-enable when you toggle it back on:

<img width="211" alt="Pasted image 20250629130910" src="https://github.com/user-attachments/assets/d88852a1-0270-4d53-ad71-55a9f4b6c9ea" />


###  Why did my component render
If you want to find out why a component re-rendered, you can click the icon at the very left of the toolbar, and then click on the component you want to inspect
<img width="1079" alt="Pasted image 20250629131113" src="https://github.com/user-attachments/assets/56d926f7-07f4-40cb-a025-14f48b81de81" />
Anytime the component renders, React Scan will tell you what props, state, or context changed during the last render. If those values didn't change, and your component was wrapped in `React.memo`, it would not of rendered.

To the right of the of the "Why did this component render" view, you will see the component tree of your app. When a component re-renders, the count will be updated in the tree. You can click on any item in the tree to see why it rendered.


### Profiling slowdowns in your app

Re-render outlines are good for getting a high level overview of what's slowing down your app, and the "Why did this render" inspector is great when you know which component you want to debug. But, what if you don't know which components are causing your app to slowdown?

React Scan's profiler, accessible through the notification bell in the toolbar:

<img width="524" alt="image" src="https://github.com/user-attachments/assets/435c1c42-e1a1-4478-9e40-d0ef52f00bce" />


is an always on profiler that alerts you when there is an FPS drop or slow interaction (click, type). Every slowdown and interaction has an easy to understand profile associated with it.


https://github.com/user-attachments/assets/c7d72e57-d805-4f21-944b-2347b72b0304



The profile has 3 parts:
#### Ranked

This ranks how long it took to render your components. Every component instance that came from the same component will have its render time added together- if you render 1000 `ListItem`'s , and they each take 1s to render, we will say `ListItem` took 1000s to render )

<img width="438" alt="image" src="https://github.com/user-attachments/assets/9e8f4496-e975-4d4f-9519-4b5c653c4f94" />
  
If you click on any bar, it will tell you what caused those components to re-render:

<img width="424" alt="Pasted image 20250629132303" src="https://github.com/user-attachments/assets/79915809-64ae-4c32-abc8-89d83e775618" />

This table is telling you that there were 4 instances of this component rendered, and all 4 of them had their `close`, `style`, and `hide` props change. If those didn't change, and the component was `React.memo`'d, they would not have rendered

If you click the arrow on the side of each bar, it will show you the ancestors of the components that rendered that component, along with how long it took to render that ancestor. This is great for giving context to understand what component you're looking at:

<img width="425" alt="image" src="https://github.com/user-attachments/assets/7ad8f7f6-1514-4852-988a-63efb79c5cbf" />

If you hover your mouse over a bar, all instances of that component will be outlined in purple over the page:

<img width="1197" alt="image" src="https://github.com/user-attachments/assets/b1c6e9f4-97a7-4405-90f4-537938c7a2cc" />


#### Overview
The overview gives you a high level summary of what time was spent on during the slowdown or interaction.

This breaks down if the time spent was on renders, react hooks (or other javascript not from react), or the browser spending time to update the dom and draw the next frame

This is great to find out if React was really the problem, or if you should be optimizing other things, like CSS:
<img width="431" alt="Pasted image 20250629132429" src="https://github.com/user-attachments/assets/9552a802-eea4-4aa6-b46c-79318d4916ea" />

#### Prompts
The prompts section gives you 3 different kind of prompts that you can pass to an LLM based on what your goal is. These prompts automatically includes data about the profile:

<img width="438" alt="Pasted image 20250629132608" src="https://github.com/user-attachments/assets/20be5326-5355-4a6e-b049-746ed93a05ce" />



#### Misc
If you want to hear a sound every time a slowdown is collected, you can turn on audio alerts in this section  
<img src="https://github.com/user-attachments/assets/7c6fa96d-56be-427a-bb09-078df4223378" width="400" />

### Hiding the toolbar

The React Scan toolbar can be distracting when you're not using it. To hide the toolbar, you can drag/throw it into the side of the page.  

<video src="https://github.com/user-attachments/assets/358bbc63-d2e0-4e31-af85-2cece1f331b8" width="300" controls></video>



The toolbar will stay collapsed into the side of the page until you drag it back out. This will persist across page load


</details>

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
- `setOptions(options: Options): void`: Set options at runtime
- `getOptions()`: Get the current options
- `onRender(Component, onRender: (fiber: Fiber, render: Render) => void)`: Hook into a specific component's renders

## Why React Scan?

React can be tricky to optimize.

The issue is that component props are compared by reference, not value. This is intentional – this way rendering can be cheap to run.

However, this makes it easy to accidentally cause unnecessary renders, making the app slow. Even in production apps, with hundreds of engineers, can't fully optimize their apps (see [GitHub](https://github.com/aidenybai/react-scan/blob/main/.github/assets/github.mp4), [Twitter](https://github.com/aidenybai/react-scan/blob/main/.github/assets/twitter.mp4), and [Instagram](https://github.com/aidenybai/react-scan/blob/main/.github/assets/instagram.mp4)).

This often comes down to props that update in reference, like callbacks or object values. For example, the `onClick` function and `style` object are re-created on every render, causing `ExpensiveComponent` to re-render and slow down the app, even if `ExpensiveComponent` was wrapped in React.memo:

```jsx
<ExpensiveComponent onClick={() => alert("hi")} style={{ color: "purple" }} />
```

React Scan helps you identify these issues by automatically detecting and highlighting renders that cause performance issues. Now, instead of guessing, you can see exactly which components you need to fix.

> Want monitor issues in production? Check out [React Scan Monitoring](https://react-scan.com/monitoring)!


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
