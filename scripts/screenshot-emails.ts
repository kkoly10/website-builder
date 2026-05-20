import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

// Quick visual check: render a few email previews in dark mode and
// save screenshots. Useful for spotting CTA / contrast regressions
// before they hit a customer inbox.
// Usage: tsx scripts/screenshot-emails.ts

const PREVIEW_DIR = resolve(process.cwd(), "scripts/email-previews/auth");
const OUT_DIR = resolve(process.cwd(), "scripts/email-previews/screenshots");

const TARGETS = [
  "signup-en.html",
  "recovery-fr.html",
  "magiclink-es.html",
  "email_change_current-en.html",
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const file of TARGETS) {
    for (const scheme of ["light", "dark"] as const) {
      const ctx = await browser.newContext({
        colorScheme: scheme,
        viewport: { width: 700, height: 1200 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(`file://${resolve(PREVIEW_DIR, file)}`, {
        waitUntil: "domcontentloaded",
      });
      const out = resolve(OUT_DIR, `${file.replace(/\.html$/, "")}-${scheme}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`✓ ${out}`);
      await ctx.close();
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
