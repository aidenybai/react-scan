'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Companies from '@/components/companies';
import CLI from '@/components/cli';
import TodoDemo from '@/components/todo-demo';

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mt-8 space-y-4">
        <div>
          React Scan automatically detects performance issues in your React app{' '}
          <div className={`flex ${!isMobile ? 'visible' : 'hidden'}`}>
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="text-neutral-600 underline hover:text-black"
            >
              (show demo)
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
            <li>Requires no code changes – just drop it in</li>
            <li>Highlights exactly the components you need to optimize</li>
            <li>Available via script tag, npm, CLI, you name it!</li>
          </ul>
        </div>

        <CLI command="npx react-scan@latest <URL>" />

        <div className="!mb-8 mt-4 flex gap-2">
          <Link
            href="https://github.com/aidenybai/react-scan#install"
            className="inline-block bg-black px-5 py-2 font-medium text-white"
          >
            Get started {'»'}
          </Link>
          <Link
            href="/monitoring"
            className="inline-block border-2 border-black px-5 py-2 font-medium"
          >
            React Scan Monitoring
          </Link>
        </div>

        {showDemo && isMobile && (
          <div className="mt-4">
            <TodoDemo closeAction={() => setShowDemo(false)} />
          </div>
        )}

        <Companies />
      </div>
      {showDemo && !isMobile && <TodoDemo closeAction={() => setShowDemo(false)} />}
    </div>
  );
}
