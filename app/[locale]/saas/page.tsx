import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServicePage from "@/components/service-page/ServicePage";
import StructuredData from "@/components/seo/StructuredData";
import { getServicePageData } from "@/lib/service-pages";
import {
  breadcrumbListNode,
  faqPageNode,
  serviceNode,
  siteGraph,
  speakableNode,
} from "@/lib/seo/structuredData";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesMeta.saas" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    twitter: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function SaasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = getServicePageData(locale, "saas");

  const pagePath =
    locale === routing.defaultLocale ? "/saas" : `/${locale}/saas`;

  // Rich @graph: Service node with SaaS-specific sub-offerings catalog,
  // FAQPage (still authored even though Google deprecated FAQ rich
  // results in May 2026 — AI Overviews / Bing / Perplexity / ChatGPT
  // Search still parse FAQPage JSON-LD for citation extraction),
  // Speakable spec for voice/AI search, and breadcrumb trail.
  const saasGraph = siteGraph([
    serviceNode({
      slug: "saas",
      name: data.title,
      description: data.intro,
      pageUrl: pagePath,
      offerings: [
        "SaaS development",
        "MVP development",
        "SaaS architecture and multi-tenancy",
        "Stripe billing integration",
        "SaaS rescue and rebuild",
        "Build & operate retainer",
      ],
    }),
    faqPageNode(data.faqs, pagePath),
    speakableNode({
      pageUrl: pagePath,
      selectors: ["main h1", "main h1 + p"],
    }),
    breadcrumbListNode([
      { name: "Home", url: "/" },
      { name: "SaaS development", url: pagePath },
    ]),
  ]);

  return (
    <>
      <StructuredData graph={saasGraph} />
      <ServicePage {...data} serviceSlug="saas" />
    </>
  );
}
