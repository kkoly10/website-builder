import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import GeneratePieButton from "./GeneratePieButton";

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default async function InternalPreview({
  searchParams,
}: {
  searchParams?: { quoteId?: string };
}) {
  const quoteId = searchParams?.quoteId;

  // If quoteId exists → render details view
  if (quoteId) {
    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (!quote) {
      return (
        <div className="container section">
          <div className="card">
            <div className="cardInner">
              <h2 className="h2">Quote not found</h2>
              <p className="p">That quoteId doesn’t exist.</p>
              <Link className="btn btnGhost" href="/internal/preview">
                ← Back to list
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const pieId = quote.latest_pie_report_id as string | null;

    const { data: pie } = pieId
      ? await supabaseAdmin.from("pie_reports").select("*").eq("id", pieId).maybeSingle()
      : await supabaseAdmin
          .from("pie_reports")
          .select("*")
          .eq("quote_id", quoteId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    return (
      <div className="container section">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <Link className="btn btnGhost" href="/internal/preview">
            ← Back to quotes
          </Link>
          <span className="badge badgeHot">Details</span>
          <span className="badge">quoteId: {quoteId}</span>
        </div>

        <div className="card">
          <div className="cardInner">
            <h2 className="h2">Quote</h2>
            <p className="p">
              <b>Status:</b> {quote.status} &nbsp;•&nbsp; <b>Tier:</b> {quote.tier_recommended ?? "—"} &nbsp;•&nbsp;{" "}
              <b>Total:</b> ${quote.estimate_total ?? "—"}
            </p>
            <p className="pDark">
              <b>Created:</b> {fmt(quote.created_at)} &nbsp;•&nbsp; <b>Lead:</b> {quote.lead_id ?? "—"}
            </p>

            <div style={{ marginTop: 14 }}>
              {!pie ? (
                <>
                  <div className="hint">
                    No PIE report is linked to this quote yet. Click “Generate PIE” to create + store one.
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <GeneratePieButton quoteId={quoteId} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="badge badgeHot">PIE ✅</span>
                    <span className="badge">pieId: {pie.id}</span>
                    <span className="badge">created: {fmt(pie.created_at)}</span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <GeneratePieButton quoteId={quoteId} />
                  </div>

                  <div className="panel" style={{ marginTop: 14 }}>
                    <div className="panelHeader">
                      <div style={{ fontWeight: 950 }}>PIE Report (stored)</div>
                    </div>
                    <div className="panelBody">
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {pie.report ?? "(no report text)"}
                      </pre>
                    </div>
                  </div>

                  <div className="panel" style={{ marginTop: 14 }}>
                    <div className="panelHeader">
                      <div style={{ fontWeight: 950 }}>PIE Payload (JSON)</div>
                    </div>
                    <div className="panelBody">
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {typeof pie.payload === "string" ? pie.payload : JSON.stringify(pie.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise → list view
  const { data: quotes } = await supabaseAdmin
    .from("quotes")
    .select("id, created_at, status, tier_recommended, estimate_total, latest_pie_report_id")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="container section">
      <h1 className="h1">Internal Preview</h1>
      <p className="p">Recent quotes (tap “View details”).</p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {(quotes ?? []).map((q) => (
          <div key={q.id} className="panel">
            <div className="panelBody" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <div style={{ fontWeight: 950 }}>
                  ${q.estimate_total ?? "—"} • {q.tier_recommended ?? "—"} • {q.status ?? "—"} •{" "}
                  {q.latest_pie_report_id ? <span className="badge badgeHot">PIE ✅</span> : <span className="badge">PIE —</span>}
                </div>
                <div className="pDark">{fmt(q.created_at)}</div>
                <div className="pDark" style={{ opacity: 0.85 }}>
                  {q.id}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Link className="btn btnPrimary" href={`/internal/preview?quoteId=${q.id}`}>
                  View details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}