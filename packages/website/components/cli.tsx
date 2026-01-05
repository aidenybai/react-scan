"use client";

import { copyText } from "@/utils/clipboard";
import React, { useState } from "react";

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

export default function CLI({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await copyText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-4 flex min-h-[160px] flex-col rounded-lg bg-[#171717] p-4">
      <div className="overflow-hidden border border-[#373737] bg-[#1e1e1e] text-white">
        <div className="flex items-center justify-between border-b border-[#333] bg-[#1e1e1e] px-4 py-1">
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#858585]/30"></span>
            <span className="size-2 rounded-full bg-[#858585]/30"></span>
            <span className="size-2 rounded-full bg-[#858585]/30"></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#858585]">~</span>
          </div>
        </div>
        <pre className="group relative whitespace-pre-wrap break-words bg-[#171717] p-4 font-mono text-sm">
          <span className="text-white">$ {command}</span>
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
      <div className="mt-auto pt-4 text-xs text-neutral-400">
        Install via {`<script>`} or npm instead?
        <a
          className="ml-1 text-neutral-400 underline hover:text-white"
          href="https://github.com/aidenybai/react-scan#readme"
        >
          Full installation guide →
        </a>
      </div>
    </div>
  );
}
