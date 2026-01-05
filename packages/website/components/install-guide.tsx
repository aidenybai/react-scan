"use client";

import { copyText } from "@/utils/clipboard";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const ClipboardIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
    />
  </svg>
);

const CheckIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const Tabs = ["script", "nextjs-app", "nextjs-pages", "vite", "remix"] as const;
type Tab = (typeof Tabs)[number];

export default function InstallGuide() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("script");
  const [height, setHeight] = useState("auto");
  const contentRef = React.useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const newHeight = contentRef.current.scrollHeight;
      setHeight(`${newHeight}px`);
    }
  }, [activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (contentRef.current) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    }
    setActiveTab(tab);
  };

  const copyToClipboard = async () => {
    await copyText(getCodeForTab(activeTab));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCodeForTab = (tab: Tab) => {
    switch (tab) {
      case "script":
        return `<!-- paste this BEFORE any scripts -->
<script
  crossOrigin="anonymous"
  src="//unpkg.com/react-scan/dist/auto.global.js"
></script>
`;
      case "nextjs-app":
        return `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
        {/* rest of your scripts go under */}
      </head>
      <body>{children}</body>
    </html>
  )
}`;
      case "nextjs-pages":
        return `import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
        {/* rest of your scripts go under */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}`;
      case "vite":
        return `<!doctype html>
<html lang="en">
  <head>
    <script
      crossOrigin="anonymous"
      src="//unpkg.com/react-scan/dist/auto.global.js"
    />
    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>`;
      case "remix":
        return `import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <link
          rel="icon"
          href="data:image/x-icon;base64,AA"
        />
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
}
`;
    }
  };

  const highlightedCode = hljs.highlight(getCodeForTab(activeTab), {
    language: "javascript",
  }).value;

  return (
    <div className="mt-4">
      {/* Window frame */}
      <div className="overflow-hidden rounded-md border border-[#373737] bg-[#1e1e1e]">
        {/* Window title bar */}
        <div className="flex items-center justify-between border-b border-[#333] bg-[#1e1e1e] px-4 py-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]/60"></span>
            <span className="size-2.5 rounded-full bg-[#febc2e]/60"></span>
            <span className="size-2.5 rounded-full bg-[#28c840]/60"></span>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="react-scan-logo"
              width={16}
              height={16}
            />
            <span className="text-[#858585] text-sm">React Scan</span>
          </div>
        </div>

        <div>
          <div className="flex bg-[#252526]">
            {Tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`relative px-4 py-2 text-[15px] transition-colors ${
                  activeTab === tab
                    ? "bg-[#1e1e1e] text-white before:absolute before:left-0 before:top-0 before:h-[1px] before:w-full before:bg-[#7a68e7]"
                    : "text-[#969696] hover:text-white"
                }`}
              >
                {tab === "script"
                  ? "Script Tag"
                  : tab === "nextjs-app"
                  ? "Next.js (App)"
                  : tab === "nextjs-pages"
                  ? "Next.js (Pages)"
                  : tab === "vite"
                  ? "Vite"
                  : tab === "remix"
                  ? "Remix"
                  : ""}
              </button>
            ))}
          </div>

          <div className="grid grid-rows-[auto_1fr_auto] bg-[#1e1e1e]">
            <div className="flex items-center gap-2 shadow-xl px-3 py-1.5">
              <span className="text-xs text-neutral-300/50">
                {activeTab === "script"
                  ? "index.html"
                  : activeTab === "nextjs-app"
                  ? "app/layout.tsx"
                  : activeTab === "nextjs-pages"
                  ? "pages/_document.tsx"
                  : activeTab === "vite"
                  ? "index.html"
                  : activeTab === "remix"
                  ? "app/root.tsx"
                  : ""}
              </span>
            </div>

            <div
              className="overflow-hidden transition-[height] duration-150 ease-in-out"
              style={{ height }}
            >
              <div className="transform transition-all duration-500">
                <pre
                  ref={contentRef}
                  className="text-neutral-300 group relative whitespace-pre font-mono text-xs py-4 px-3"
                >
                  <code
                    className="language-javascript relative flex"
                    dangerouslySetInnerHTML={{
                      __html: `
                        <div class="select-none min-w-8 max-w-8 pr-2.5 inline-block text-right text-[#858585] opacity-50">${highlightedCode
                          .split("\n")
                          .map((_, i) => i + 1)
                          .join("\n")}</div>
                        <div class="flex-1">${highlightedCode}</div>
                      `,
                    }}
                  />
                  <button
                    onClick={() => {
                      void copyToClipboard();
                    }}
                    className="absolute right-4 top-4 rounded bg-[#333] p-1.5 opacity-0 transition-opacity hover:bg-[#444] group-hover:opacity-100"
                  >
                    {copied ? (
                      <CheckIcon className="size-4 text-green-500" />
                    ) : (
                      <ClipboardIcon className="size-4 text-white" />
                    )}
                  </button>
                </pre>
              </div>
            </div>

            <div className="border-t border-[#2d2d2d] bg-[#2d2d2d] px-3 py-1.5 text-xs text-[#8b949e]">
              <a
                className="hover:text-white"
                href="https://github.com/aidenybai/react-scan#readme"
              >
                → Full installation guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
