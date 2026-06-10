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

// English regions the studio actively targets. Each gets its own
// hreflang alternate pointing at the same canonical English URL.
// This tells Google "the English page is the right result for users
// in the US, Canada, and UK" — without needing physical /en-us /en-gb
// URL variants. Search engines deduplicate to one canonical (the
// alternates[locale=en] entry) but use the region tag to pick which
// SERP to show this page in.
const ENGLISH_REGIONS = ["en-US", "en-CA", "en-GB"] as const;

function localeAwareLanguages(unprefixedPath: string) {
  // unprefixedPath always starts with "/". For each configured locale, build
  // the absolute href Next will join against metadataBase: default locale at
  // the root (no prefix), other locales prefixed (/fr..., /es...).
  //
  // English-only paths (/locations, /blog and their dynamic children)
  // skip the non-English alternates entirely. The underlying page calls
  // notFound() for non-default locales, so emitting /fr/locations or
  // /es/blog as a hreflang sends Googlebot to crawl a guaranteed 404
  // and ends up in Search Console as "Not found (404)" + "Excluded by
  // 'noindex' tag" reports. Matches the sitemap's englishOnly flag.
  const englishOnly = isEnglishOnlyPath(unprefixedPath);
  const emittedLocales = englishOnly
    ? ([routing.defaultLocale] as readonly string[])
    : routing.locales;

  const languages: Record<string, string> = {};
  for (const code of emittedLocales) {
    const prefix = code === routing.defaultLocale ? "" : `/${code}`;
    languages[code] = unprefixedPath === "/" ? prefix || "/" : `${prefix}${unprefixedPath}`;
  }
  // Map every targeted English region to the same English URL. Google
  // recognises both `en` (the language) and `en-US` / `en-CA` /
  // `en-GB` (the region-tagged variants) — emitting both ensures the
  // page surfaces in regional SERPs for the entire DMV + US + Canada
  // + UK English-speaking market.
  const englishHref = languages[routing.defaultLocale];
  if (englishHref) {
    for (const region of ENGLISH_REGIONS) {
      languages[region] = englishHref;
    }
  }
  languages["x-default"] =
    unprefixedPath === "/" ? "/" : unprefixedPath;
  return languages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Read the unprefixed pathname so hreflang for /pricing differs from
  // hreflang for /websites etc. next-intl exposes it as x-next-intl-pathname
  // on rewritten requests; we fall back to a few common alternatives and
  // strip any locale prefix ourselves so the result is locale-neutral.
  // proxy.ts stamps each request with x-pathname so we know which page is
  // rendering. Strip the locale prefix to get the locale-neutral path used
  // to build hreflang alternates for this specific page.
  const requestHeaders = await headers();
  const path = requestHeaders.get("x-pathname") || "/";
  const unprefixed = path.replace(
    new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`),
    ""
  ) || "/";

  // Self-canonical: each locale page canonicalizes to itself, with hreflang
  // alternates pointing at the other locales. This is what Google recommends
  // for multilingual sites — canonicalizing all locales to one URL would
  // cause non-English pages to drop from their localized SERPs.
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const canonicalPath =
    unprefixed === "/" ? (localePrefix || "/") : `${localePrefix}${unprefixed}`;

  return {
    alternates: {
      canonical: canonicalPath,
      languages: localeAwareLanguages(unprefixed),
    },
    openGraph: {
      // Per-page locale-aware OG URL so social previews link back to the
      // exact locale the user is reading, not the root.
      url: canonicalPath,
      locale: OG_LOCALES[locale] ?? OG_LOCALES[routing.defaultLocale],
      alternateLocale: routing.locales
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
