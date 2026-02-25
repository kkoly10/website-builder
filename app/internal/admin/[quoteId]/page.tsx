import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import WebGeneratePieButton from "./WebGeneratePieButton";

export const dynamic = "force-dynamic";

export default async function WebQuoteDetailPage({ params }: { params: { quoteId: string } }) {
  const quoteId = params.quoteId;

  const [{ data: quote }, { data: pieReports }] = await Promise.all([
    supabaseAdmin.from("quotes").select("*, leads(email, name, phone)").eq("id", quoteId).single(),
    supabaseAdmin.from("pie_reports").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false })
  ]);

  if (!quote) return <main className="container"><p style={{ marginTop: 40 }}>Quote not found.</p></main>;

  const lead = Array.isArray(quote.leads) ? quote.leads[0] : quote.leads;
  const latestPie = pieReports?.[0];
  const pieData = latestPie?.report || latestPie?.report_json;

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker"><span className="kickerDot" /> Web Design Quote</div>
          <h1 className="h2" style={{ marginTop: 10 }}>${quote.estimate_total} — {quote.tier_recommended}</h1>
          <p className="p" style={{ marginTop: 6 }}>
            {lead?.name || "No name provided"} • {lead?.email || "No email"}
          </p>
          <div className="pills" style={{ marginTop: 10 }}>
            <span className="pill">Status: {quote.status || "new"}</span>
            <span className="pill">Created: {new Date(quote.created_at).toLocaleDateString()}</span>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Link href="/internal/admin" className="btn btnGhost">← Back to Pipeline</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h2 className="h2" style={{ fontSize: 20 }}>PIE Analysis</h2>
            
            {/* Using the safe JSON Client Component */}
            <WebGeneratePieButton quoteId={quoteId} />
          </div>

          <div style={{ marginTop: 16 }}>
            {pieData ? (
              <div style={{ display: "grid", gap: 16 }}>
                <div className="grid2">
                  <div>
                    <div className="fieldLabel">Lead Score</div>
                    <div className="p" style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6" }}>
                      {latestPie.score || pieData.lead_score || "N/A"}/100
                    </div>
                  </div>
                  <div>
                    <div className="fieldLabel">Recommended Tier</div>
                    <div className="p" style={{ fontSize: 24, fontWeight: 900 }}>
                      {latestPie.tier || pieData.recommended_tier || "N/A"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="fieldLabel" style={{ color: "#3b82f6" }}>Executive Summary</div>
                  <div className="p" style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                    {latestPie.summary || pieData.summary || "No summary provided."}
                  </div>
                </div>

                {pieData.risks && Array.isArray(pieData.risks) && pieData.risks.length > 0 && (
                  <div>
                    <div className="fieldLabel" style={{ color: "#ffb4b4" }}>Complexity & Risks</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                      {pieData.risks.map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <details>
                  <summary style={{ cursor: "pointer", opacity: 0.7, fontWeight: 700, marginTop: 10 }}>View Raw JSON</summary>
                  <pre style={{ marginTop: 10, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, fontSize: 12, overflowX: "auto" }}>
                    {JSON.stringify(pieData, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="p" style={{ opacity: 0.7 }}>No PIE generated yet. Click the button above to analyze this lead.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <h2 className="h2" style={{ fontSize: 20, marginBottom: 12 }}>Raw Client Intake Data</h2>
          <pre style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(quote.intake_normalized, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
