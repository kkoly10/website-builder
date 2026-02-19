// app/internal/preview/page.tsx
import Link from "next/link";
import GeneratePieButton from "./GeneratePieButton";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function extractTotalUSD(q: any): number {
  // Try a few shapes safely
  const direct =
    typeof q?.total === "number" ? q.total :
    typeof q?.total_usd === "number" ? q.total_usd :
    typeof q?.total_cents === "number" ? q.total_cents / 100 :
    typeof q?.estimate_total === "number" ? q.estimate_total :
    typeof q?.estimate?.total === "number" ? q.estimate.total :
    typeof q?.estimate?.totalUsd === "number" ? q.estimate.totalUsd :
    0;

  return Number.isFinite(direct) ? direct : 0;
}

function extractTier(q: any): string {
  const t =
    q?.tier ||
    q?.tier_recommended ||
    q?.estimate?.tierRecommended ||
    q?.estimate?.tier_recommended ||
    "";
  return String(t || "—");
}

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const quoteId = pick(searchParams, "quoteId").trim();

  // ============================
  // DETAILS MODE
  // ============================
  if (quoteId) {
    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("*, leads(*)")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return (
        <main className="container" style={{ padding: "48px 0 80px" }}>
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Internal Preview • Quote details
          </div>

          <div style={{ height: 12 }} />
          <h1 className="h1">Not found</h1>
          <p className="p">Couldn’t load quote: <code>{quoteId}</code></p>

          <div style={{ height: 18 }} />
          <Link className="btn btnGhost" href="/internal/preview">
            ← Back to list
          </Link>
        </main>
      );
    }

    const { data: callRequests } = await supabaseAdmin
      .from("call_requests")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Latest PIE: prefer quotes.latest_pie_report_id; fallback to newest by quote_id
    let pieReport: any = null;

    const latestId = String(quote?.latest_pie_report_id || "").trim();
    if (latestId) {
      const { data } = await supabaseAdmin
        .from("pie_reports")
        .select("*")
        .eq("id", latestId)
        .single();
      pieReport = data ?? null;
    }

    if (!pieReport) {
      const { data } = await supabaseAdmin
        .from("pie_reports")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })
        .limit(1);
      pieReport = data?.[0] ?? null;
    }

    const totalUSD = extractTotalUSD(quote);
    const tier = extractTier(quote);
    const status = String(quote?.status || "—");
    const email =
      quote?.leads?.email ||
      quote?.lead_email ||
      quote?.lead?.email ||
      "—";

    const intakeRaw = quote?.intake_raw ?? quote?.intakeRaw ?? null;
    const intakeNorm = quote?.intake_normalized ?? quote?.intakeNormalized ?? null;
    const estimate = quote?.estimate ?? null;

    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Internal Preview • Quote details
        </div>

        <div style={{ height: 12 }} />

        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="h1" style={{ margin: 0 }}>Quote</h1>
          <Link className="btn btnGhost" href="/internal/preview">
            ← Back to list
          </Link>
        </div>

        <div style={{ height: 14 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Summary</div>
            <div className="smallNote">Internal view — do not share</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            <div className="pDark">
              Quote ID: <strong><code>{quoteId}</code></strong>
            </div>
            <div className="pDark">
              Lead: <strong>{email}</strong>
            </div>
            <div className="pDark">
              Total: <strong>{money(totalUSD)}</strong> • Tier: <strong>{tier}</strong> • Status: <strong>{status}</strong>
            </div>

            <div className="row" style={{ marginTop: 6 }}>
              <GeneratePieButton quoteId={quoteId} hasPie={!!pieReport} />
              <Link className="btn btnGhost" href={`/internal/preview?quoteId=${encodeURIComponent(quoteId)}`}>
                Refresh
              </Link>
            </div>

            {!pieReport && (
              <div className="smallNote">
                PIE is currently <strong>missing</strong> for this quote. Click “Generate PIE report”.
              </div>
            )}
          </div>
        </section>

        <div style={{ height: 16 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Call requests</div>
            <div className="smallNote">Most recent first</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            {callRequests?.length ? (
              callRequests.map((r: any) => (
                <div
                  key={r.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {String(r.status || "—")} • {new Date(r.created_at).toLocaleString()}
                  </div>
                  <div className="smallNote" style={{ marginTop: 6 }}>
                    best_time_to_call: <code>{String(r.best_time_to_call ?? "—")}</code> • preferred_times:{" "}
                    <code>{String(r.preferred_times ?? "—")}</code> • timezone:{" "}
                    <code>{String(r.timezone ?? "—")}</code>
                  </div>
                  {r.notes ? (
                    <div className="smallNote" style={{ marginTop: 6 }}>
                      notes: {String(r.notes)}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="smallNote">No call requests found for this quote.</div>
            )}
          </div>
        </section>

        <div style={{ height: 16 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>PIE report</div>
            <div className="smallNote">Stored in <code>pie_reports.raw</code></div>
          </div>
          <div className="panelBody">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
              {JSON.stringify(pieReport?.raw ?? pieReport ?? null, null, 2)}
            </pre>
          </div>
        </section>

        <div style={{ height: 16 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Estimate</div>
            <div className="smallNote">What was computed at submit time</div>
          </div>
          <div className="panelBody">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
              {JSON.stringify(estimate ?? null, null, 2)}
            </pre>
          </div>
        </section>

        <div style={{ height: 16 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Intake (normalized)</div>
          </div>
          <div className="panelBody">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
              {JSON.stringify(intakeNorm ?? null, null, 2)}
            </pre>
          </div>
        </section>

        <div style={{ height: 16 }} />

        <section className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 950 }}>Intake (raw)</div>
          </div>
          <div className="panelBody">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
              {JSON.stringify(intakeRaw ?? null, null, 2)}
            </pre>
          </div>
        </section>
      </main>
    );
  }

  // ============================
  // LIST MODE
  // ============================
  const { data: quotes, error } = await supabaseAdmin
    .from("quotes")
    .select("*, leads(email)")
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Internal Preview
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Recent quotes (tap “View details”)</h1>

      <div style={{ height: 16 }} />

      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelBody" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800 }}>
            Error loading quotes: {error.message}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {(quotes || []).map((q: any) => {
          const total = extractTotalUSD(q);
          const tier = extractTier(q);
          const status = String(q?.status || "—");
          const hasPie = !!q?.latest_pie_report_id;
          const email = q?.leads?.email || q?.lead_email || "—";
          const created = q?.created_at ? new Date(q.created_at).toLocaleString() : "—";
          const href = `/internal/preview?quoteId=${encodeURIComponent(q.id)}`;

          return (
            <div key={q.id} className="panel">
              <div className="panelBody" style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950 }}>
                  {money(total)} • {tier} • {status} • PIE {hasPie ? "✓" : "—"}
                </div>

                <div className="smallNote">
                  {created}
                  <br />
                  {email} • <code>{q.id}</code>
                </div>

                <div className="row" style={{ justifyContent: "space-between" }}>
                  <Link className="btn btnPrimary" href={href}>
                    View details <span className="btnArrow">→</span>
                  </Link>

                  <Link className="btn btnGhost" href={href}>
                    Open link
                  </Link>
                </div>

                <div className="smallNote">
                  Link:{" "}
                  <code>
                    https://crecystudio.com{href}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}