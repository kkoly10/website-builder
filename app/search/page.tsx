import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Site search fallback. We don't have a built-in search index — for a
// small studio site (~30 marketing pages + 8 city pages + 3 case
// studies) Google's `site:` operator is a better user experience
// than maintaining a local search index. This page exists to satisfy
// the WebSite.potentialAction.SearchAction in our JSON-LD: Google
// validates that the target URL resolves before enabling the
// sitelinks searchbox on brand SERPs. We 302 to Google's `site:`
// query so users land on a real result page.

export const dynamic = "force-dynamic";

// Noindex/nofollow on the route itself — the SearchAction validator
// hits this URL but we don't want it appearing as a thin landing
// page in search results, and we don't want crawlers following the
// outbound Google `site:` redirect (which would just bounce them
// back to our own pages they've already indexed).
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(sp: SearchParams, key: string): string {
  const raw = sp?.[key];
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = pickParam(sp, "q").trim();
  if (!query) {
    return (
      <main className="container section">
        <h1 className="h1">Search</h1>
        <p className="p" style={{ marginTop: 16 }}>
          Add a query to the URL: <code>/search?q=your+search</code>
        </p>
      </main>
    );
  }
  // Google site search keeps the user on the SERP they already trust
  // and surfaces our deep pages without us shipping a search index.
  const target = `https://www.google.com/search?q=${encodeURIComponent(`site:${SITE_HOST} ${query}`)}`;
  redirect(target);
}
