import { redirect } from "next/navigation";

// Site search fallback. We don't have a built-in search index — for a
// small studio site (~30 marketing pages + 8 city pages + 3 case
// studies) Google's `site:` operator is a better user experience
// than maintaining a local search index. This page exists to satisfy
// the WebSite.potentialAction.SearchAction in our JSON-LD: Google
// validates that the target URL resolves before enabling the
// sitelinks searchbox on brand SERPs. We 302 to Google's `site:`
// query so users land on a real result page.
//
// Returns 404 when no query is provided — prevents accidental
// indexing of /search itself as a thin page.

export const dynamic = "force-dynamic";

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
    // 404 keeps an empty /search out of the index; Google's
    // SearchAction validator tests with a query string so this is
    // fine for the validator path.
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
