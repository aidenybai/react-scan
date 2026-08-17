import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

export interface V8CoverageEntry {
  url: string;
  source?: string;
  scriptId?: string;
  functions?: unknown[];
}

export const cleanRawCoverage = (rawDirectory: string): void => {
  rmSync(rawDirectory, { recursive: true, force: true });
  mkdirSync(rawDirectory, { recursive: true });
};

export const writeRawCoverage = (
  rawDirectory: string,
  coverageEntries: V8CoverageEntry[],
): void => {
  if (coverageEntries.length === 0) return;

  try {
    mkdirSync(rawDirectory, { recursive: true });
    writeFileSync(join(rawDirectory, `${randomUUID()}.json`), JSON.stringify(coverageEntries));
  } catch {
    return;
  }
};

export const captureCoverage = async (
  page: Page,
  rawDirectory: string,
  use: () => Promise<void>,
): Promise<void> => {
  let didStartCoverage = false;

  try {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    didStartCoverage = true;
  } catch {
    didStartCoverage = false;
  }

  try {
    await use();
  } finally {
    if (didStartCoverage) {
      try {
        writeRawCoverage(rawDirectory, await page.coverage.stopJSCoverage());
      } catch {
        // Coverage must not affect test results.
      }
    }
  }
};
