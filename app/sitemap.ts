import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

type Page = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const PAGES: Page[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/websites", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ecommerce", priority: 0.9, changeFrequency: "monthly" },
  { path: "/systems", priority: 0.9, changeFrequency: "monthly" },
  { path: "/custom-web-apps", priority: 0.8, changeFrequency: "monthly" },
  { path: "/client-portals", priority: 0.8, changeFrequency: "monthly" },
  { path: "/website-rescue", priority: 0.8, changeFrequency: "monthly" },
  { path: "/care-plans", priority: 0.8, changeFrequency: "monthly" },
  { path: "/process", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work/fleiko", priority: 0.7, changeFrequency: "monthly" },
  { path: "/work/proveo", priority: 0.7, changeFrequency: "monthly" },
  { path: "/work/techdesk", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/build/intro", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ops-intake", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ecommerce/intake", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/aup", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refunds", priority: 0.3, changeFrequency: "yearly" },
  { path: "/security", priority: 0.3, changeFrequency: "yearly" },
];

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
    // One sitemap entry per (locale × page). Each carries alternates.languages
    // so search engines learn the hreflang relationships in a single fetch.
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = localizedHref(siteUrl, locale, page.path);
    }
    languages["x-default"] = localizedHref(siteUrl, routing.defaultLocale, page.path);

    return routing.locales.map((locale) => ({
      url: localizedHref(siteUrl, locale, page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
