import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// e2e/admin-auth-setup.ts is gitignored — only present on the original
// developer's machine for authenticated test flows. When absent (CI or a
// fresh clone) we skip globalSetup so smoke and intake tests still run.
// Path is relative to playwright's working directory (project root); we
// avoid __dirname so this works whether the config is loaded as CJS or ESM.
const globalSetup = existsSync("e2e/admin-auth-setup.ts")
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
