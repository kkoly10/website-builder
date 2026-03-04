import Link from "next/link";
import BookClient from "./BookClient";
import RecoverQuoteRedirect from "./RecoverQuoteRedirect";

export const dynamic = "force-dynamic";

// NEXT.JS 15+ FIX: searchParams is now a Promise
type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

function pick(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function pickAny(sp: Record<string, string | string[] | undefined>, keys: string[]) {
  for (const k of keys) {
    const v = pick(sp, k).trim();
    if (v) return v;
  }
  return "";
}

export default async function BookPage(props: { searchParams: SearchParamsPromise }) {
  // NEXT.JS 15+ FIX: Await the searchParams before using them
  const sp = await props.searchParams;
  
  // Long-term robustness: accept common variants
  const quoteId = pickAny(sp, ["quoteId", "quoteid", "qid", "id"]);

  if (!quoteId) {
    return (
      <main className="container" style={{ padding: "28px 0 80px" }}>
        {/* Auto-recover from localStorage if possible */}
        <RecoverQuoteRedirect />

        <section className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Continue your quote to book
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2" >
              We need your quote reference before scheduling
            </h1>

            <p className="p">
              Start from your estimate so we can attach the call request to the correct project.
              If you recently submitted an estimate, this page may redirect automatically in a moment.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnPrimary" href="/estimate">
                Go to Estimate <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/build">
                Edit answers
              </Link>
              <Link className="btn btnGhost" href="/portal">
                Client Portal
              </Link>
              <Link className="btn btnGhost" href="mailto:hello@crecystudio.com?subject=Help%20finding%20my%20quote">
                Help me find my quote
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <BookClient quoteId={quoteId} />;
}
