// One-off script to render an OG image to a local PNG so we can
// preview it before committing the new service OGs. Run with:
//   npx tsx scripts/preview-og.ts <variant>
// Variants: ai-integration, faq, locations, city
import { writeFileSync } from "node:fs";
import { renderOgImage } from "../lib/seo/ogImage.js";

const variant = process.argv[2] || "ai-integration";

const PRESETS: Record<string, { eyebrow: string; headline: string; tagline: string }> = {
  "ai-integration": {
    eyebrow: "AI integration",
    headline: "Production AI, built with guardrails",
    tagline: "Agents, copilots, RAG, GPT-4 / Claude — built by a practitioner.",
  },
  faq: {
    eyebrow: "FAQ",
    headline: "Answers before you commit",
    tagline: "Scope, ownership, timelines, and how the workspace works.",
  },
  locations: {
    eyebrow: "DMV · US · CA · UK",
    headline: "Web studio serving the DMV",
    tagline: "Stafford, Fredericksburg, Richmond, DC, Maryland — and remote across English-speaking markets.",
  },
  city: {
    eyebrow: "Stafford, VA",
    headline: "Web design & AI integration in Stafford",
    tagline: "Independent studio. Premium craft. Same time zone, same accountability.",
  },
};

async function main() {
  const preset = PRESETS[variant];
  if (!preset) {
    console.error(`Unknown variant: ${variant}`);
    process.exit(1);
  }

  const response = await renderOgImage(preset);
  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = `/tmp/og-${variant}.png`;
  writeFileSync(outPath, buffer);
  console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
