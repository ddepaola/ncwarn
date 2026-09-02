import { defineConfig } from "@playwright/test";

/** Smoke tests against a running instance: `E2E_BASE_URL=https://staging.ncwarn.com npx playwright test`. */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3020",
    trace: "retain-on-failure",
    ...(process.env.PLAYWRIGHT_EXECUTABLE ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } } : {}),
  },
  reporter: [["list"]],
});
