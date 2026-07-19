import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;
const IS_COVERAGE_RUN = Boolean(process.env.COVERAGE);
const WEB_SERVER_COMMAND = IS_COVERAGE_RUN
  ? "pnpm --filter react-scan build:coverage && pnpm --filter @react-scan/kitchen-sink dev"
  : "pnpm --filter @react-scan/kitchen-sink dev";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: IS_COVERAGE_RUN ? "./e2e/coverage/setup.ts" : undefined,
  globalTeardown: IS_COVERAGE_RUN ? "./e2e/coverage/teardown.ts" : undefined,

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: WEB_SERVER_COMMAND,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI && !IS_COVERAGE_RUN,
    timeout: 30_000,
  },
});
