import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "AI Integration — CrecyStudio";

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesMeta.aiIntegration" });
  return renderOgImage({
    eyebrow: "AI integration",
    // Strip the "AI Integration | " prefix so the headline is the
    // descriptive part only — "Production AI, Built With Guardrails".
    headline: t("metaTitle").split("|")[1]?.trim() ?? "Production AI, built with guardrails",
    tagline: "Agents, copilots, RAG, GPT-4 / Claude — built by a practitioner.",
  });
}
