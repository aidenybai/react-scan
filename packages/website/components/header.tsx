"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="relative flex items-center justify-between text-base sm:text-lg">
      <Link href="/" className="flex items-center gap-3 text-inherit no-underline">
        <Image src="/logo.svg" alt="React Scan" width={30} height={30} />
      </Link>

      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden p-2 hover:bg-white/10 rounded-md text-white/60"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <div className="hidden md:flex gap-4 text-sm sm:text-base">
        <Link
          href="https://github.com/aidenybai/react-scan#readme"
          className="text-white/50 underline hover:text-white transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          docs
        </Link>
        <Link
          href="https://github.com/aidenybai/react-scan"
          className="text-white/50 underline hover:text-white transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          github
        </Link>
      </div>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-[calc(100%+0.5rem)] w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden md:hidden z-[100]"
        >
          <div className="divide-y divide-white/10">
            <Link
              href="https://github.com/aidenybai/react-scan#readme"
              className="block px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              docs
            </Link>
            <Link
              href="https://github.com/aidenybai/react-scan"
              className="block px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              github
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
