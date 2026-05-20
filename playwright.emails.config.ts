import { defineConfig, devices } from "@playwright/test";

// Email tests render templates in-memory and load them via page.setContent.
// They don't need the Next.js dev server, so this config omits webServer
// to keep the run fast and decoupled from the rest of the app.
//
// Usage:  npm run test:emails
export default defineConfig({
  testDir: "./e2e",
  testMatch: /emails\.spec\.ts$/,
  timeout: 30_000,
  retries: 0,
  use: {
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
