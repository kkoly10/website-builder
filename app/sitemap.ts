import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";
  const now = new Date().toISOString();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/websites`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/ecommerce`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/systems`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/process`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${siteUrl}/ecommerce/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/build/intro`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/ops-intake`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/ecommerce/intake`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
