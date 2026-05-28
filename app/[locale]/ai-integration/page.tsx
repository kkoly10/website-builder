import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServicePage from "@/components/service-page/ServicePage";
import StructuredData from "@/components/seo/StructuredData";
import { getServicePageData } from "@/lib/service-pages";
import {
  aiIntegrationServiceNode,
  breadcrumbListNode,
  siteGraph,
  speakableNode,
} from "@/lib/seo/structuredData";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

// Locale → BCP-47 lang for the AI service @graph node. Must match the
// page's <html lang> or Google rejects the schema for mixed-signal.
const LOCALE_TO_BCP47: Record<string, string> = {
  en: "en",
  fr: "fr",
  es: "es",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesMeta.aiIntegration" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function AiIntegrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = getServicePageData(locale, "ai_integration");

  // Locale-aware canonical path. Default locale lives at /ai-integration
  // (no prefix, per routing.localePrefix = "as-needed"); other locales
  // prefix with /{locale}. Reads routing.defaultLocale rather than
  // hardcoding "en" so a future locale-default change stays consistent.
  const pagePath =
    locale === routing.defaultLocale
      ? "/ai-integration"
      : `/${locale}/ai-integration`;

  // Rich AI-specific @graph: dedicated Service node with sub-offerings
  // catalog (RAG, OpenAI integration, AI agents, etc.) + mentions of
  // tools the studio works with + Speakable spec for voice/AI search +
  // breadcrumb trail. This sits ALONGSIDE the basic Service node that
  // ServicePage emits inline; both reference the same Org @id so
  // Knowledge Graph collapses them. The rich one is the canonical
  // (it has the @id `${url}#ai-integration-service`).
  //
  // Speakable selectors: target stable semantic selectors, NOT CSS-
  // module class names (Next hashes those to e.g. `heroTitle_a1b2c3`
  // at build time, so `.heroTitle` wouldn't match the live DOM).
  // ServicePage renders the hero as a `<section>` with the first `<h1>`
  // on the page (the service title) followed by the lead paragraph;
  // `main h1` + `main h1 + p` is stable across rebuilds.
  const aiGraph = siteGraph([
    aiIntegrationServiceNode({
      pageUrl: pagePath,
      inLanguage: LOCALE_TO_BCP47[locale] ?? "en",
      serviceName: data.title,
      serviceDescription: data.intro,
    }),
    speakableNode({
      pageUrl: pagePath,
      selectors: ["main h1", "main h1 + p"],
    }),
    breadcrumbListNode([
      { name: "Home", url: "/" },
      { name: "AI integration", url: pagePath },
    ]),
  ]);

  return (
    <>
      <StructuredData graph={aiGraph} />
      <ServicePage {...data} />
    </>
  );
}
