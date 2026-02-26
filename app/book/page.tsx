// app/book/page.tsx
import Link from "next/link";
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const quoteId = pick(searchParams, "quoteId").trim();

  // Long-term UX: never render a broken booking form
  if (!quoteId) {
    return (
      <main className="container" style={{ padding: "28px 0 80px" }}>
        <section className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Missing quote reference
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2" style={{ margin: 0 }}>
              This booking page needs a quote ID
            </h1>

            <p className="p" style={{ marginTop: 10 }}>
              Please start from the estimate step so we can attach the call request to the correct quote.
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
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <BookClient quoteId={quoteId} />;
}