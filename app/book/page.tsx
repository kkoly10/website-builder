// app/book/page.tsx
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const quoteId = pick(searchParams, "quoteId").trim();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Book a Scope Call
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Confirm scope first</h1>
      <p className="p" style={{ maxWidth: 800 }}>
        We’ll confirm scope on a quick call first. Payment happens after the call if you want to move forward.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Your reference</div>
          <div className="smallNote">Save this ID for support.</div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <div className="pDark">
            Quote ID: <strong>{quoteId || "(missing)"}</strong>
          </div>

          {!quoteId ? (
            <>
              <div className="smallNote" style={{ color: "#ffb4b4", fontWeight: 800 }}>
                Missing quoteId. Please go back and click “Send estimate” first.
              </div>

              <Link className="btn btnGhost" href="/estimate">
                Back to estimate
              </Link>
            </>
          ) : (
            <form action="/api/request-call" method="post" style={{ display: "grid", gap: 12 }}>
              <input type="hidden" name="quoteId" value={quoteId} />

              <div>
                <div className="fieldLabel">Best time to reach you</div>
                <input
                  className="input"
                  name="bestTime"
                  placeholder="Example: Tue/Thu after 6pm ET"
                />
              </div>

              <div>
                <div className="fieldLabel">Anything we should know before the call? (optional)</div>
                <textarea
                  className="textarea"
                  name="message"
                  placeholder="Goals, must-haves, examples you like, deadline…"
                  rows={5}
                />
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <Link className="btn btnGhost" href={`/estimate?quoteId=${encodeURIComponent(quoteId)}`}>
                  Back to estimate
                </Link>

                <button className="btn btnPrimary" type="submit">
                  Request call <span className="btnArrow">→</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}