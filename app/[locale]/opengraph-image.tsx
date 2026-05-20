import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

// Default OG card for every [locale] page that doesn't supply its own
// opengraph-image.tsx. Per-page overrides (case studies, future services)
// can live alongside the page.tsx in their own folder.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "CrecyStudio — Websites, web systems, and AI integration";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tHome = await getTranslations({ locale, namespace: "home" });

  return renderOgImage({
    headline: tHome("metaTitle").replace(/^CrecyStudio\s*\|\s*/, ""),
    tagline: "Independent web studio. Premium craft.",
  });
}
