/**
 * Regenerate public/brand/crecy-email-logo-dark.png from the brand
 * kit's dark horizontal SVG. Run after any change to the source
 * SVG so the email's dark-mode logo stays in sync.
 *
 *   npx tsx scripts/regen-email-logo-dark.ts
 *
 * Output: public/brand/crecy-email-logo-dark.png — 560×100 PNG
 * (rendered at 2× the email-display size of 280×50). Transparent
 * background; cream wordmark designed to pop on the dark card
 * background applied by emailHelpers.ts in dark mode.
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "public/brand/crecy-d1-horizontal-dark.svg");
const OUT = join(process.cwd(), "public/brand/crecy-email-logo-dark.png");

async function main() {
  const svg = readFileSync(SRC);
  await sharp(svg, { density: 560 }).resize(560, 100).png().toFile(OUT);
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
