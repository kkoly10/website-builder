import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { allLocationSlugs } from "@/lib/seo/locations";
import { BLOG_POSTS } from "@/lib/blog/posts";

type Page = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  // English-only pages skip the FR/ES sitemap entries and the
  // FR/ES hreflang alternates. Set for /locations and the city
  // landing pages: those routes 404 on /fr/ /es/ by design
  // (English-language local-SEO landing pages targeting the
  // anglophone DMV — see app/[locale]/locations/[city]/page.tsx).
  englishOnly?: boolean;
  // Optional override for the sitemap's `lastModified` field.
  // Blog posts pass their updatedAt (or publishedAt) so search
  // engines see the real freshness of the content rather than a
  // generated-at-build-time timestamp that resets every deploy
  // (which dilutes the "this content was updated" signal).
  lastModified?: string;
};

const STATIC_PAGES: Page[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/websites", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ecommerce", priority: 0.9, changeFrequency: "monthly" },
  { path: "/systems", priority: 0.9, changeFrequency: "monthly" },
  { path: "/saas", priority: 0.9, changeFrequency: "monthly" },
  { path: "/custom-web-apps", priority: 0.8, changeFrequency: "monthly" },
  { path: "/client-portals", priority: 0.8, changeFrequency: "monthly" },
  { path: "/website-rescue", priority: 0.8, changeFrequency: "monthly" },
  { path: "/care-plans", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-integration", priority: 0.9, changeFrequency: "monthly" },
  { path: "/process", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work/fleiko", priority: 0.7, changeFrequency: "monthly" },
  { path: "/work/proveo", priority: 0.7, changeFrequency: "monthly" },
  { path: "/work/techdesk", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/locations", priority: 0.8, changeFrequency: "monthly", englishOnly: true },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly", englishOnly: true },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/aup", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refunds", priority: 0.3, changeFrequency: "yearly" },
  { path: "/security", priority: 0.3, changeFrequency: "yearly" },
];

// City landing pages — one per slug in LOCATIONS. Generated rather
// than hardcoded so adding a new city to lib/seo/locations.ts
// automatically registers it in the sitemap.
const LOCATION_PAGES: Page[] = allLocationSlugs().map((slug) => ({
  path: `/locations/${slug}`,
  priority: 0.7,
  changeFrequency: "monthly" as const,
  englishOnly: true,
}));

// Blog posts — auto-registered from lib/blog/posts.ts so adding a
// new post registers in the sitemap without touching this file.
// Slightly higher priority than location pages (blog posts are the
// primary inbound-traffic surface for non-brand keyword queries).
const BLOG_POST_PAGES: Page[] = BLOG_POSTS.map((post) => ({
  path: `/blog/${post.slug}`,
  priority: 0.75,
  changeFrequency: "monthly" as const,
  englishOnly: true,
  // Use the post's own freshness signal instead of build time.
  lastModified: post.updatedAt || post.publishedAt,
}));

const PAGES: Page[] = [...STATIC_PAGES, ...LOCATION_PAGES, ...BLOG_POST_PAGES];

function localizedHref(siteUrl: string, locale: string, path: string) {
  // Default locale stays at the root (no prefix). Other locales get a prefix.
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  if (path === "/") return `${siteUrl}${prefix || "/"}`;
  return `${siteUrl}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com").replace(/\/$/, "");
  const now = new Date().toISOString();

  return PAGES.flatMap((page) => {
    // Locales this page actually exists at. englishOnly pages skip
    // FR/ES entirely — both sitemap entries and hreflang alternates —
    // because the page 404s on those locales.
    const emittedLocales = page.englishOnly
      ? ([routing.defaultLocale] as readonly string[])
      : routing.locales;

    const languages: Record<string, string> = {};
    for (const locale of emittedLocales) {
      languages[locale] = localizedHref(siteUrl, locale, page.path);
    }
    // Multi-region English: map en-US, en-CA, en-GB to the same
    // canonical English URL so the page surfaces in regional SERPs
    // across the DMV + US + Canada + UK. Mirrors localeAwareLanguages()
    // in app/[locale]/layout.tsx — sitemap + page-level hreflang need
    // to agree or Google ignores both.
    const englishHref = languages[routing.defaultLocale];
    if (englishHref) {
      languages["en-US"] = englishHref;
      languages["en-CA"] = englishHref;
      languages["en-GB"] = englishHref;
    }
    languages["x-default"] = localizedHref(siteUrl, routing.defaultLocale, page.path);

    return emittedLocales.map((locale) => ({
      url: localizedHref(siteUrl, locale, page.path),
      lastModified: page.lastModified ?? now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
