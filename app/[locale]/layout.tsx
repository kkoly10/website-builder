import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import StructuredData from "@/components/seo/StructuredData";
import {
  founderNode,
  localBusinessNode,
  organizationNode,
  siteGraph,
  websiteNode,
} from "@/lib/seo/structuredData";
import { isEnglishOnlyPath } from "@/lib/seo/englishOnlyPaths";

// Pages here are server-rendered on every request (auth state, locale, and
// per-page metadata all vary). Locale validation happens in LocaleLayout
// below via hasLocale + notFound, so we don't need generateStaticParams.
export const dynamic = "force-dynamic";

const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Read the unprefixed pathname so the shared layout can build the correct
  // self-canonical and locale-aware Open Graph URL for the current route.
  // Hreflang itself is emitted from sitemap.xml; next-intl middleware
  // alternates are disabled because some route families are English-only.
  const requestHeaders = await headers();
  const path = requestHeaders.get("x-pathname") || "/";
  const unprefixed = path.replace(
    new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`),
    ""
  ) || "/";

  // Each locale page self-canonicalizes. Locale relationships are declared
  // in sitemap.xml, which has full knowledge of English-only route families.
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const canonicalPath =
    unprefixed === "/" ? (localePrefix || "/") : `${localePrefix}${unprefixed}`;

  return {
    alternates: {
      // Locale alternates live in sitemap.xml, where route existence is
      // deterministic. Keeping only the self-canonical here avoids a shared
      // layout advertising localized URLs for English-only route families.
      canonical: canonicalPath,
    },
    openGraph: {
      // Per-page locale-aware OG URL so social previews link back to the
      // exact locale the user is reading, not the root.
      url: canonicalPath,
      locale: OG_LOCALES[locale] ?? OG_LOCALES[routing.defaultLocale],
      // For English-only paths (/locations, /blog and their dynamic
      // children) skip the fr_FR / es_ES alternateLocale entries —
      // the localized variants 404, and listing them as OG alternates
      // misleads social/embed previewers the same way emitting fr/es
      // hreflang misled Googlebot. Mirrors the hreflang fix above so
      // hreflang and og:locale agree.
      alternateLocale: isEnglishOnlyPath(unprefixed)
        ? []
        : routing.locales
            .filter((l) => l !== locale)
            .map((l) => OG_LOCALES[l])
            .filter(Boolean),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables server-component translations for everything rendered below.
  setRequestLocale(locale);

  // Base JSON-LD @graph — present on every locale page. Page-specific
  // nodes (Service for service pages, Article for case studies) render
  // their own additional <StructuredData> blocks; crawlers merge nodes
  // across scripts on the same page, so the Org/Founder/WebSite entities
  // declared here are referenced by @id from the per-page nodes without
  // having to re-emit the full definition.
  const baseGraph = siteGraph([
    organizationNode(),
    localBusinessNode(),
    founderNode(),
    websiteNode(),
  ]);

  return (
    <>
      <StructuredData graph={baseGraph} />
      {children}
    </>
  );
}
