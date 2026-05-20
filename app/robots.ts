import type { MetadataRoute } from "next";

// Surfaces blocked for every crawler: admin/portal/auth/payment/editor/api.
// Public marketing pages live at the root and are allowed.
const DISALLOW = [
  "/internal/",
  "/api/",
  "/portal/",
  "/demos/",
  "/editor/",
  "/pie-lab/",
  "/auth/",
  "/deposit/",
  "/reset-password",
];

// AI search crawlers. Listed explicitly (rather than relying on the "*" rule)
// to make consent unambiguous — some operators interpret the absence of a
// named rule as a soft refusal. Allow surface mirrors the public crawler.
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_USER_AGENTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
