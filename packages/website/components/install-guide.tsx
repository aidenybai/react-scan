'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);

const COPY_FEEDBACK_DURATION_MS = 2000;

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/70">
    {children}
  </code>
);

interface InstallTab {
  id: string;
  label: string;
  description: React.ReactNode;
  lang: string;
  code: string;
}

const INSTALL_TABS: InstallTab[] = [
  {
    id: 'cli',
    label: 'CLI',
    description: '',
    lang: 'bash',
    code: `npx -y react-scan@latest init`,
  },
  {
    id: 'script',
    label: 'Script Tag',
    description: <>Paste this before any scripts in your <InlineCode>index.html</InlineCode></>,
    lang: 'xml',
    code: `<!-- paste this BEFORE any scripts -->
<script
  crossOrigin="anonymous"
  src="//unpkg.com/react-scan/dist/auto.global.js"
></script>`,
  },
  {
    id: 'nextjs-app',
    label: 'Next.js (App)',
    description: <>Add this inside of your <InlineCode>app/layout.tsx</InlineCode></>,
    lang: 'typescript',
    code: `import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
  },
  {
    id: 'nextjs-pages',
    label: 'Next.js (Pages)',
    description: <>Add this into your <InlineCode>pages/_document.tsx</InlineCode></>,
    lang: 'typescript',
    code: `import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}`,
  },
  {
    id: 'vite',
    label: 'Vite',
    description: <>Example <InlineCode>index.html</InlineCode> with React Scan enabled</>,
    lang: 'xml',
    code: `<!doctype html>
<html lang="en">
  <head>
    <script
      crossOrigin="anonymous"
      src="//unpkg.com/react-scan/dist/auto.global.js"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  },
  {
    id: 'remix',
    label: 'Remix',
    description: <>Add this inside your <InlineCode>app/root.tsx</InlineCode></>,
    lang: 'typescript',
    code: `import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <Meta />
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}`,
  },
];

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export default function InstallGuide() {
  const [activeTabId, setActiveTabId] = useState(INSTALL_TABS[0].id);
  const [didCopy, setDidCopy] = useState(false);
  const [height, setHeight] = useState('auto');
  const contentRef = useRef<HTMLPreElement>(null);

  const activeTab =
    INSTALL_TABS.find((tab) => tab.id === activeTabId) ?? INSTALL_TABS[0];

  const highlightedCode = hljs.highlight(activeTab.code, {
    language: activeTab.lang,
  }).value;

  const syncHeight = useCallback(() => {
    if (contentRef.current) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    }
  }, []);

  useEffect(syncHeight, [activeTabId, syncHeight]);

  const handleTabChange = (tabId: string) => {
    syncHeight();
    setActiveTabId(tabId);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(activeTab.code)
      .then(() => {
        setDidCopy(true);
        setTimeout(() => setDidCopy(false), COPY_FEEDBACK_DURATION_MS);
      })
      .catch(() => {});
  };

  const headingText =
    activeTabId === 'cli'
      ? 'Run this command to get started:'
      : 'It takes 1 script tag to get started:';

  return (
    <div>
      <span className="hidden sm:inline text-white">
        {headingText}
        {activeTabId === 'cli' && (
          <button
            type="button"
            onClick={() => handleTabChange('script')}
            className="ml-3 text-xs italic text-white/40 hover:text-white/60 hover:underline transition-colors sm:text-sm"
          >
            Prefer manual install?
          </button>
        )}
      </span>
      <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-white/5 text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
        <div className="flex items-center gap-4 overflow-x-auto border-b border-white/10 px-4 pt-2">
          {INSTALL_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`shrink-0 whitespace-nowrap border-b pb-2 font-sans text-sm transition-colors sm:text-base ${
                  isActive
                    ? 'border-white text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="relative bg-black/60">
          {activeTabId === 'cli' ? (
            <button
              type="button"
              onClick={handleCopy}
              className="group flex w-full items-center justify-between gap-4 px-4 py-6 transition-colors hover:bg-white/5"
            >
              <pre className="overflow-x-auto font-mono text-base leading-relaxed text-white/80">
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
              <span className="shrink-0 text-white/50 transition-colors group-hover:text-white">
                {didCopy ? <CheckIcon /> : <CopyIcon />}
              </span>
            </button>
          ) : (
            <div className="group relative">
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-4 top-4 z-10 text-white/50 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                aria-label="Copy code"
              >
                {didCopy ? <CheckIcon /> : <CopyIcon />}
              </button>
              <div
                className="overflow-hidden transition-[height] duration-200 ease-out"
                style={{ height }}
              >
                <pre
                  ref={contentRef}
                  className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-white/80"
                >
                  <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      {activeTab.id !== 'cli' && activeTab.description && (
        <span className="mt-4 block text-sm text-white/50 sm:text-base">
          {activeTab.description}
        </span>
      )}
    </div>
  );
}
