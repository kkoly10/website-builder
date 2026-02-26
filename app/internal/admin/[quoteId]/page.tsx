import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import WebGeneratePieButton from "./WebGeneratePieButton";
import PieAdminReport from "@/app/components/internal/PieAdminReport"; 

export const dynamic = "force-dynamic";

type ParamsPromise = Promise<{ quoteId: string }>;

export default async function WebQuoteDetailPage(props: { params: ParamsPromise }) {
  const params = await props.params;
  const quoteId = params.quoteId;

  const [{ data: quote }, { data: pieReports }] = await Promise.all([
    supabaseAdmin.from("quotes").select("*, leads(email, name, phone)").eq("id", quoteId).single(),
    supabaseAdmin.from("pie_reports").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false })
  ]);

  if (!quote) return <main className="container"><p style={{ marginTop: 40 }}>Quote not found.</p></main>;

  const lead = quote.leads ? (Array.isArray(quote.leads) ? quote.leads[0] : quote.leads) : null;
  const leadEmail = lead?.email || quote.lead_email || quote.quote_json?.email || "No email";
  const leadName = lead?.name || quote.quote_json?.name || quote.quote_json?.contactName || "No name provided";
  
  const latestPie = pieReports?.[0];
  const pieData = latestPie?.report_json || latestPie?.report || null;
  const quoteTotal = quote.estimate_total || quote.quote_json?.estimate?.total || quote.quote_json?.estimate?.target || 0;

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker"><span className="kickerDot" /> Web Design Quote</div>
          <h1 className="h2" style={{ marginTop: 10 }}>${quoteTotal.toLocaleString()} — {leadEmail}</h1>
          <p className="pDark" style={{ marginTop: 6 }}>{leadName}</p>
          
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 20 }}>PIE Analysis</h2>
            <WebGeneratePieButton quoteId={quoteId} />
          </div>

          {/* Hands the generated JSON directly to your beautiful renderer */}
          {pieData ? (
            <PieAdminReport report={pieData} />
          ) : (
            <p className="pDark" style={{ fontStyle: "italic" }}>No PIE generated yet. Click the button above to analyze this lead.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <h2 className="h2" style={{ fontSize: 20, marginBottom: 12 }}>Raw Client Intake Data</h2>
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--fg)" }}>View Form Answers</summary>
            <pre style={{ background: "var(--bg2)", border: "1px solid var(--stroke)", padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap", marginTop: 10 }}>
              {JSON.stringify(quote.quote_json || quote.intake_normalized, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </section>
  );
}
