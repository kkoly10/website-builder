import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Website Building — CrecyStudio";

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesMeta.websites" });
  return renderOgImage({
    eyebrow: "Websites",
    headline: t("metaTitle").split("|")[0].trim(),
    tagline: "Premium build. Stronger trust. Better conversion.",
  });
}
