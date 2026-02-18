// app/book/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const quoteId = pick(searchParams, "quoteId").trim();
  const token = pick(searchParams, "token").trim();
  const sent = pick(searchParams, "sent").trim() === "1";

  let quote: any = null;
  let lead: any = null;
  let errorMsg: string | null = null;

  if (quoteId || token) {
    const query = supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        public_token,
        created_at,
        status,
        tier_recommended,
        estimate_total,
        estimate_low,
        estimate_high,
        intake_normalized,
        leads ( email, phone, name )
      `
      );

    const res = quoteId
      ? await query.eq("id", quoteId).single()
      : await query.eq("public_token", token).single();

    if (res.error || !res.data) {
      errorMsg = res.error?.message ?? "Not found";
    } else {
      quote = res.data;
      lead = Array.isArray(quote.leads) ? quote.leads[0] : quote.leads;
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Book a quick scope call
      </div>

      <div style={{ height: 12 }} />
      <h1 className="h1">Lock scope first. Payment after.</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        You were right: people shouldn’t feel like they have to pay before speaking to a human.
        We confirm scope on a quick call, then send a deposit link only if you want to move forward.
      </p>

      <div style={{ height: 18 }} />

      {errorMsg ? (
        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>We couldn’t load that quote</div>
            <div className="smallNote">{errorMsg}</div>
          </div>
          <div className="panelBody">
            <a className="btn btnPrimary" href="/build">
              Start intake <span className="btnArrow">→</span>
            </a>
          </div>
        </section>
      ) : (
        <>
          {quote && (
            <section className="panel">
              <div className="panelHeader">
                <div style={{ fontWeight: 950 }}>Your estimate reference</div>
                <div className="smallNote">
                  Save this for later. We’ll use it to pull your scope quickly.
                </div>
              </div>
              <div className="panelBody" style={{ display: "grid", gap: 10 }}>
                <div className="smallNote">
                  <strong>Reference:</strong>{" "}
                  <code>{quote.public_token ?? quote.id}</code>
                </div>
                <div className="smallNote">
                  <strong>Estimate:</strong> ${quote.estimate_total}{" "}
                  <span style={{ opacity: 0.75 }}>
                    (range ${quote.estimate_low}–${quote.estimate_high})
                  </span>
                </div>
                <div className="smallNote">
                  <strong>Recommended tier:</strong> {quote.tier_recommended ?? "—"}
                </div>
              </div>
            </section>
          )}

          <div style={{ height: 18 }} />

          <section className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 950 }}>Request your call</div>
              <div className="smallNote">
                Tell us a couple times that work. We’ll confirm by email.
              </div>
            </div>

            <div className="panelBody">
              {sent ? (
                <div className="smallNote" style={{ fontWeight: 900 }}>
                  ✅ Request sent. Check your email — we’ll confirm a time.
                </div>
              ) : (
                <form method="POST" action="/api/request-call" style={{ display: "grid", gap: 12 }}>
                  <input type="hidden" name="quoteId" value={quote?.id ?? quoteId} />
                  <input type="hidden" name="token" value={quote?.public_token ?? token} />

                  <div className="grid2">
                    <div>
                      <div className="fieldLabel">Email</div>
                      <input
                        className="input"
                        name="email"
                        defaultValue={lead?.email ?? ""}
                        placeholder="you@company.com"
                        required
                      />
                    </div>
                    <div>
                      <div className="fieldLabel">Phone (optional)</div>
                      <input
                        className="input"
                        name="phone"
                        defaultValue={lead?.phone ?? ""}
                        placeholder="(555) 555-5555"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="fieldLabel">Preferred times</div>
                    <textarea
                      className="textarea"
                      name="preferred_times"
                      placeholder="Example: Tue 2–4pm, Wed 10–12, Thu after 6pm"
                      required
                    />
                  </div>

                  <div className="grid2">
                    <div>
                      <div className="fieldLabel">Timezone</div>
                      <input className="input" name="timezone" defaultValue="America/New_York" />
                    </div>
                    <div>
                      <div className="fieldLabel">Notes (optional)</div>
                      <input className="input" name="notes" placeholder="Anything we should know?" />
                    </div>
                  </div>

                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <a className="btn btnGhost" href="/build">
                      Edit answers
                    </a>
                    <button className="btn btnPrimary" type="submit">
                      Send request <span className="btnArrow">→</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}