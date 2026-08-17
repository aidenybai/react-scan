import { expect, test as base } from "@playwright/test";
import { captureCoverage } from "./coverage/capture";
import { COVERAGE_RAW_DIRECTORY } from "./coverage/config";

const IS_COVERAGE_ENABLED = Boolean(process.env.COVERAGE);

interface CoverageFixtures {
  coverageCapture: void;
}

export const test = base.extend<CoverageFixtures>({
  coverageCapture: [
    async ({ page }, use) => {
      if (!IS_COVERAGE_ENABLED) {
        await use();
        return;
      }

      await captureCoverage(page, COVERAGE_RAW_DIRECTORY, use);
    },
    { auto: true },
  ],
});

export { expect };
