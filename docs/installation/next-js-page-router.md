# NextJS Page Router Guide

## As a script tag

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

## As a module import

Add the following code to your `App` component in `pages/_app`:

```jsx
// react-scan must be the top-most import
import { scan } from "react-scan";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Make sure to run React Scan after hydration
    scan({
      enabled: true,
    });
  }, []);
  return <Component {...pageProps} />;
}
```
