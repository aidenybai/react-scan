"use client";

import Link from "next/link";
import { useRef } from "react";
import Image from "next/image";

export default function Monitoring() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[2560px] mx-auto px-4 lg:px-8">
        <div className="max-w-xl">
          <div className="mt-8 space-y-4">
            <div>
              <h1 className="text-lg font-bold">Monitoring</h1>
              {/* <span className="font-bold">React Scan </span> helps you detect and solve performance problems in your React app that are causing users to churn 😬. */}

              <div className="flex flex-col gap-2">
                <p>
                  Automatically detect performance issues in your <span className="font-bold underline decoration-wavy text-scan-600"> production</span> React app that cause real users to churn.
                </p>
                <p className="italic">
                  Metrics like INP, and LCP (Core Web Vitals) leave gaps in understanding the complete user experience, which also depends on post-load performance, responsiveness under stress, and real-world usage patterns.
                </p>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-2">
              <li>Actionable insights - never read a performance trace again</li>
              <li>Prioritize problems coming from critical user journeys</li>
              <li>Know where performance problems are coming from</li>
            </ul>
            <div className="flex flex-col gap-2">
              <div className="flex gap-4">
                <Link
                  className="inline-flex items-center justify-center h-[38px] px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-200 ease-out bg-scan-600 hover:bg-scan-500 border border-scan-500 hover:border-scan-400 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-scan-400"
                  href="https://dashboard.react-scan.com/"
                >
                  Try Monitoring for free
                </Link>

                <Link
                  className="inline-flex items-center justify-center h-[38px] px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-200 ease-out bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-zinc-600"
                  href="https://dashboard.react-scan.com/project/demo"
                >
                  View a live demo
                </Link>
              </div>
              <Link className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors" href="https://cal.com/aiden/enterprise">
                Enterprise? Speak with a founder
              </Link>
            </div>
          </div>
        </div>

        {/* Demo iframe/image section */}
        <div className="mt-8 -mx-4 sm:-mx-20 lg:-mx-48 xl:-mx-64 2xl:-mx-[341.3333333333px]">
          <div className="relative w-full rounded-lg overflow-hidden shadow-2xl bg-zinc-900 aspect-[4/3] md:aspect-[16/9]">
            {/* Show image on small screens */}
            <div className="relative md:hidden w-full h-full group">
              <Image src="/monitoring.png" alt="React Scan Monitoring Dashboard" fill className="object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:brightness-[0.8]" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link
                  href="https://dashboard.react-scan.com/project/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-[38px] px-6 py-2 text-sm font-medium text-white rounded-md transition-all duration-200 ease-out bg-scan-600 hover:bg-scan-500 border border-scan-500 hover:border-scan-400 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-scan-400"
                >
                  View a live demo
                </Link>
              </div>
            </div>
            {/* Show iframe on medium screens and up */}
            <iframe
              ref={iframeRef}
              onLoad={() => {
                try {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current?.contentWindow?.scrollTo({
                      top: 1000,
                      left: 100,
                      behavior: "smooth",
                    });
                  }
                } catch {}
              }}
              src="https://dashboard.react-scan.com/project/demo"
              className="absolute inset-0 w-full h-full hidden md:block"
            />
          </div>
        </div>
        {/* View full page link */}
        <div className="mt-4 text-center">
          <Link href="https://dashboard.react-scan.com/project/demo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-black  transition-colors">
            This is a preview. <span className="text-scan-600 hover:text-scan-700 transition-colors ">View full page</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.5 3C3.5 2.72386 3.72386 2.5 4 2.5H8.5C8.77614 2.5 9 2.72386 9 3V7.5C9 7.77614 8.77614 8 8.5 8C8.22386 8 8 7.77614 8 7.5V4.20711L3.85355 8.35355C3.65829 8.54882 3.34171 8.54882 3.14645 8.35355C2.95118 8.15829 2.95118 7.84171 3.14645 7.64645L7.29289 3.5H4C3.72386 3.5 3.5 3.27614 3.5 3Z"
                fill="currentColor"
                className="text-scan-600 hover:text-scan-700 transition-colors"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
