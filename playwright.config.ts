import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

// e2e/admin-auth-setup.ts is gitignored — only present on the original
// developer's machine for authenticated test flows. When absent (CI or a
// fresh clone) we skip globalSetup so smoke and intake tests still run.
const adminAuthSetupPath = path.resolve(
  __dirname,
  "e2e",
  "admin-auth-setup.ts",
);
const globalSetup = existsSync(adminAuthSetupPath)
  ? "./e2e/admin-auth-setup"
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 1,
  globalSetup,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NODE_TLS_REJECT_UNAUTHORIZED: "0" },
  },
});
