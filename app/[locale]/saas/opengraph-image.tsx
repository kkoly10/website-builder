import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "SaaS Development — CrecyStudio";

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesMeta.saas" });
  return renderOgImage({
    eyebrow: "SaaS development",
    headline: t("metaTitle").split("|")[0].trim(),
    tagline: "Multi-tenant. Billing-ready. Built by a founder shipping 4 SaaS products.",
  });
}
