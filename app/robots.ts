import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/internal/",
          "/api/",
          "/portal/",
          "/demos/",
          "/editor/",
          "/pie-lab/",
          "/auth/",
          "/deposit/",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
