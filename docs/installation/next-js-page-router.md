# NextJS Page Router Guide

## As a script tag

Add the script tag to your `pages/_document`

Refer to the [CDN Guide](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```jsx
// pages/_document
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

## As a module import

Add the following code to your `App` component in `pages/_app`:

```jsx
// pages/_app

// react-scan must be the top-most import
import { scan } from "react-scan";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Make sure to run React Scan after hydration
    scan({
      enabled: true,
    });
  }, []);
  return <Component {...pageProps} />;
}
```


If you want react-scan to also run in production, use the react-scan/all-environments import path
```diff
- import { scan } from "react-scan";
+ import { scan } from "react-scan/all-environments";
```