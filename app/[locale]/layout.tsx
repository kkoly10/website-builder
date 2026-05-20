import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";

// Pages here are server-rendered on every request (auth state, locale, and
// per-page metadata all vary). Locale validation happens in LocaleLayout
// below via hasLocale + notFound, so we don't need generateStaticParams.
export const dynamic = "force-dynamic";

const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
};

function localeAwareLanguages(unprefixedPath: string) {
  // unprefixedPath always starts with "/". For each configured locale, build
  // the absolute href Next will join against metadataBase: default locale at
  // the root (no prefix), other locales prefixed (/fr..., /es...).
  const languages: Record<string, string> = {};
  for (const code of routing.locales) {
    const prefix = code === routing.defaultLocale ? "" : `/${code}`;
    languages[code] = unprefixedPath === "/" ? prefix || "/" : `${prefix}${unprefixedPath}`;
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

  return <>{children}</>;
}
