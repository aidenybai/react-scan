"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Companies from "@/components/companies";
import TodoDemo from "@/components/todo-demo";
import InstallGuide from "@/components/installl-guide";

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mt-8 space-y-4">
        <div>
          React Scan automatically detects performance issues in your React app{" "}
          <div className={`flex ${!isMobile ? "visible" : "hidden"}`}>
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="mt-2 border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-gray-50 hover:text-black transition-colors"
            >
              {showDemo ? "Hide demo" : "Show demo"}
            </button>
          </div>
        </div>

        <div>
          Previously, existing tools required lots of code change, lacked simple
          visual cues, and didn{"'"}t have a simple, portable API
        </div>

        <div>
          Instead, React Scan:
          <ul className="list-inside list-disc space-y-2 pl-2 pt-2">
            <li>Requires no code changes</li>
            <li>Highlights exactly the components you need to optimize</li>
            <li>Available via script tag, npm, you name it!</li>
          </ul>
        </div>

        <div className="space-y-4">
          <InstallGuide />
        </div>

        {/*
          for testing purposes only
          <TestDataTypes />
          */}
        {/*
          for testing purposes only
          <CounterExample />
          */}

        <div className="!mb-8 mt-4 flex gap-2 flex-wrap-reverse">
          <Link
            href="https://github.com/aidenybai/react-scan#install"
            className="flex-3 sm:flex-initial sm:w-auto w-full order-2 sm:order-1 inline-block bg-black px-9 py-2 font-medium whitespace-nowrap text-white text-center"
          >
            Get started {"»"}
          </Link>
          <Link
            href="/monitoring"
            className="flex-2 order-1 sm:order-2 inline-block border-2 border-black px-5 py-2 font-medium whitespace-nowrap text-center"
          >
            React Scan Monitoring
          </Link>
          <Link
            href="https://discord.gg/KV3FhDq7FA"
            className="flex-1 order-1 sm:order-3 bg-[#5865F2] px-2 py-2 font-medium whitespace-nowrap text-white text-center flex items-center justify-center gap-x-1"
          >
            <span>Join Discord</span>
            <OutBoundLinkIcon size={18} />
          </Link>
        </div>

        {showDemo && isMobile && (
          <div className="mt-4">
            <TodoDemo closeAction={() => setShowDemo(false)} />
          </div>
        )}

        <Companies />
      </div>
      {showDemo && !isMobile && (
        <TodoDemo closeAction={() => setShowDemo(false)} />
      )}
    </div>
  );
}

const OutBoundLinkIcon = ({ size = 24, className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-square-arrow-out-up-right ${className}`}
    >
      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      <path d="m21 3-9 9" />
      <path d="M15 3h6v6" />
    </svg>
  );
};
