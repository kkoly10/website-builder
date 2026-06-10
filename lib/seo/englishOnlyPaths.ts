// Single source of truth for paths that exist ONLY in the default
// (English) locale. The page-level `notFound()` in /locations and /blog
// hard-404s these URLs when accessed via /fr/... or /es/..., and the
// sitemap correctly omits them — but the locale layout's hreflang
// emission needs the same list to avoid telling Google those URLs
// exist as alternates (which sends Googlebot to crawl them, get 404s,
// and surface "Not found (404)" + "Excluded by 'noindex' tag" reports
// in Search Console).
//
// Matching rule:
//   path === prefix             (e.g. "/locations" matches "/locations")
//   OR path.startsWith(`${prefix}/`)
//                                (e.g. "/locations/stafford-va" matches "/locations")
//
// Add a prefix here AND ensure the underlying page calls notFound() for
// non-default locales; the two need to stay aligned.

export const ENGLISH_ONLY_PATH_PREFIXES = ["/locations", "/blog"] as const;

export function isEnglishOnlyPath(unprefixedPath: string): boolean {
  return ENGLISH_ONLY_PATH_PREFIXES.some(
    (prefix) => unprefixedPath === prefix || unprefixedPath.startsWith(`${prefix}/`),
  );
}
