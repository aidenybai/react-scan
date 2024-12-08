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
    <div className="max-w-xl mx-auto">
      <div className="space-y-4 mt-8">
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
          <ul className="list-disc list-inside pl-2 space-y-2 pt-2">
            <li>Requires no code changes – just drop it in</li>
            <li>Highlights exactly the components you need to optimize</li>
            <li>Available via script tag, npm, CLI, you name it!</li>
          </ul>
        </div>

        <CLI command="npx react-scan@latest <URL>" />

        <div className="flex gap-2 mt-4 !mb-8">
          <Link
            href="https://github.com/aidenybai/react-scan#install"
            className="inline-block px-5 py-2 font-medium text-white bg-black"
          >
            Get started {'»'}
          </Link>
          <Link
            href="/monitoring"
            className="inline-block px-5 py-2 font-medium border-2 border-black"
          >
            React Scan Monitoring
          </Link>
        </div>

        {showDemo && isMobile && (
          <div className="mt-4">
            <TodoDemo onClose={() => setShowDemo(false)} />
          </div>
        )}

        <Companies />
      </div>
      {showDemo && !isMobile && <TodoDemo onClose={() => setShowDemo(false)} />}
    </div>
  );
}
