import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://crecystudio.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/internal/",
          "/api/",
          "/portal/",
          "/estimate",
          "/book",
          "/ops-book",
          "/deposit/",
          "/dashboard",
          "/editor",
          "/pie-lab",
          "/auth/",
          "/login",
          "/signup",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
