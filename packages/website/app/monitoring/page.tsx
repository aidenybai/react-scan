'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Monitoring() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mt-8 space-y-4">
        <div>
          <span className="font-bold">React Scan Monitoring</span> helps detect
          React components that cause the most lag for your users
        </div>

        <p>It takes less than 2 minutes to set up.</p>

        <Link
          className="inline-block whitespace-nowrap bg-black px-5 py-2 text-center font-medium text-white disabled:opacity-50"
          href="https://dashboard.react-scan.com/"
        >
          Try it out!
        </Link>

        <div className="relative my-8 h-[400px]">
          <Image
            src="/after.png"
            alt="React Scan Monitoring"
            fill
            className="object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="https://dashboard.react-scan.com/project/demo"
              className="bg-white px-6 py-2 font-medium text-black shadow-xl transition-colors hover:bg-gray-100"
            >
              View demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
