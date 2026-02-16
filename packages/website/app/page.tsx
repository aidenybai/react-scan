"use client";

import Link from "next/link";
import InstallGuide from "@/components/install-guide";
import Companies from "@/components/companies";
import { IconGithub } from "@/components/icons/icon-github";
import { IconDiscord } from "@/components/icons/icon-discord";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 text-base sm:text-lg">
      <div className="text-pretty text-white">
        <span className="font-bold">React&nbsp;Scan</span> automatically detects performance issues
        in your React&nbsp;app.
      </div>

      <div className="text-pretty text-white/70">
        Previously, existing tools required lots of code change, lacked simple visual cues, and
        didn&apos;t have a simple, portable&nbsp;API.
      </div>

      <div className="text-pretty text-white/70">Instead, React Scan:</div>
      <ul className="flex flex-col gap-1.5 text-white/70 pl-5 list-disc marker:text-white/30">
        <li>Requires no code changes</li>
        <li>Highlights exactly the components you need to optimize</li>
        <li>Available via script tag, npm, you name&nbsp;it!</li>
      </ul>

      <InstallGuide />

      <div className="flex gap-3 pt-2">
        <Link
          href="https://github.com/aidenybai/react-scan#install"
          className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white px-3 py-1.5 text-sm text-black transition-all hover:bg-white/90 active:scale-[0.98] sm:text-base"
        >
          <IconGithub className="h-[18px] w-[18px]" />
          Star on GitHub
        </Link>
        <Link
          href="https://discord.gg/KV3FhDq7FA"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition-all hover:bg-white/10 active:scale-[0.98] sm:text-base"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconDiscord className="h-[18px] w-[18px]" />
          Join Discord
        </Link>
      </div>

      <Companies />
    </div>
  );
}
