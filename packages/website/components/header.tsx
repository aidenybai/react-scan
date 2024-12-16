import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <nav className="flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-3 text-inherit no-underline"
      >
        <Image src="/logo.svg" alt="react-scan-logo" width={30} height={30} />
        <h3>
          <strong className="text-xl">React Scan</strong>
        </h3>
      </Link>
      <div className="flex gap-4">
        <Link
          href="/monitoring"
          className="text-neutral-600 underline hover:text-black"
          target="_blank"
          rel="noopener noreferrer"
        >
          monitoring
        </Link>
        <Link
          href="https://github.com/aidenybai/react-scan#readme"
          className="text-neutral-600 underline hover:text-black"
          target="_blank"
          rel="noopener noreferrer"
        >
          docs
        </Link>
        <Link
          href="https://github.com/aidenybai/react-scan"
          className="text-neutral-600 underline hover:text-black"
          target="_blank"
          rel="noopener noreferrer"
        >
          source ↗
        </Link>
      </div>
    </nav>
  );
}
