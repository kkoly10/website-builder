import { Link } from "@/i18n/navigation";
import BookClient from "./BookClient";
import RecoverQuoteRedirect from "./RecoverQuoteRedirect";

export const dynamic = "force-dynamic";

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
  const sp = await props.searchParams;

  const quoteId = pickAny(sp, ["quoteId", "quoteid", "qid", "id"]);
  const quoteToken = pickAny(sp, ["token", "quoteToken", "quote_token", "t"]);

  if (!quoteId) {
    return (
      <main className="container" style={{ padding: "28px 0 80px" }}>
        <RecoverQuoteRedirect />

        <section className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Continue your quote to book
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2">
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
              <Link href="mailto:hello@crecystudio.com?subject=Help%20finding%20my%20quote" className="btn btnGhost">
                Help me find my quote
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <BookClient quoteId={quoteId} quoteToken={quoteToken || undefined} />;
}
