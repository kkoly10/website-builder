import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import GeneratePieButton from "./GeneratePieButton";
import PieAdminReport from "@/app/components/internal/PieAdminReport";

export const dynamic = "force-dynamic";

type ParamsPromise = Promise<{ opsIntakeId: string }>;

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default async function OpsIntakeDetailPage(props: { params: ParamsPromise }) {
  const p = await props.params;
  const opsIntakeId = p.opsIntakeId;

  const [{ data: intake }, { data: calls }, { data: reports }] = await Promise.all([
    supabaseAdmin.from("ops_intakes").select("*").eq("id", opsIntakeId).maybeSingle(),
    supabaseAdmin.from("ops_call_requests").select("*").eq("ops_intake_id", opsIntakeId).order("created_at", { ascending: false }),
    supabaseAdmin.from("ops_pie_reports").select("*").eq("ops_intake_id", opsIntakeId).order("created_at", { ascending: false }),
  ]);

  if (!intake) notFound();

  const latestCall = calls?.[0] ?? null;
  const latestReport = reports?.[0] ?? null;
  const pieData = latestReport?.report_json || latestReport?.report || null;

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Ops Intake Details
          </div>

          <div style={{ height: 10 }} />
          <h1 className="h2">{intake.company_name || "Unnamed company"}</h1>
          <p className="pDark" style={{ marginTop: 8 }}>
            {intake.contact_name || "—"} • {intake.email || "—"} • {intake.phone || "—"}
          </p>

          <div className="pills" style={{ marginTop: 10 }}>
            <span className="pill">Status: {intake.status || "new"}</span>
            {intake.recommendation_tier && <span className="pill">Tier: {intake.recommendation_tier}</span>}
            {intake.recommendation_price_range && <span className="pill">{intake.recommendation_price_range}</span>}
            <span className="pill">Submitted: {fmtDate(intake.created_at)}</span>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/internal/ops" className="btn btnGhost">
              ← Back to Ops Dashboard
            </Link>
            <Link href={`/ops-book?opsIntakeId=${intake.id}`} className="btn btnGhost" style={{ borderColor: "var(--accentStroke)", color: "var(--accent)" }}>
              Open Public Booking Page
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        
        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 900, marginBottom: 10, color: "var(--fg)" }}>Intake Snapshot</div>
            <div className="pDark" style={{ lineHeight: 1.6 }}>
              <strong style={{ color: "var(--fg)" }}>Industry:</strong> {intake.industry || "—"}<br />
              <strong style={{ color: "var(--fg)" }}>Team size:</strong> {intake.team_size || "—"}<br />
              <strong style={{ color: "var(--fg)" }}>Job volume:</strong> {intake.job_volume || "—"}<br />
              <strong style={{ color: "var(--fg)" }}>Urgency:</strong> {intake.urgency || "—"}<br />
              <strong style={{ color: "var(--fg)" }}>Readiness:</strong> {intake.readiness || "—"}<br />
              <strong style={{ color: "var(--fg)" }}>Score:</strong> {intake.recommendation_score ?? "—"}
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--stroke)" }}>
              <div style={{ fontWeight: 800, color: "var(--fg)" }}>Admin Notes</div>
              <div className="pDark" style={{ marginTop: 4 }}>
                {intake.notes || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 900, marginBottom: 10, color: "var(--fg)" }}>Latest Call Request</div>
            {latestCall ? (
              <div className="pDark" style={{ lineHeight: 1.6 }}>
                <strong style={{ color: "var(--fg)" }}>Status:</strong> <span className="badge">{latestCall.status || "submitted"}</span><br />
                <strong style={{ color: "var(--fg)" }}>Created:</strong> {fmtDate(latestCall.created_at)}<br />
                <strong style={{ color: "var(--fg)" }}>Best time:</strong> {latestCall.best_time_to_call || "—"}<br />
                <strong style={{ color: "var(--fg)" }}>Preferred window:</strong> {latestCall.preferred_times || "—"}<br />
                <strong style={{ color: "var(--fg)" }}>Timezone:</strong> {latestCall.timezone || "—"}<br />
                <div style={{ marginTop: 8, padding: 8, background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--stroke)" }}>
                  <strong style={{ color: "var(--fg)", fontSize: 13 }}>Client Notes:</strong><br/>
                  {latestCall.notes || "—"}
                </div>
              </div>
            ) : (
              <div className="pDark">No call request yet.</div>
            )}
          </div>
        </div>

      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 20 }}>PIE Analysis</h2>
            <GeneratePieButton opsIntakeId={opsIntakeId} />
          </div>

          {pieData ? (
            <PieAdminReport report={pieData} />
          ) : (
            <p className="pDark" style={{ fontStyle: "italic" }}>No PIE generated yet. Click the button above to analyze this workflow request.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <h2 className="h2" style={{ fontSize: 16, marginBottom: 8 }}>Raw Intake Data</h2>
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--fg)" }}>View Client Problem Statements</summary>
            <pre style={{ margin: 0, marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--bg2)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, lineHeight: 1.45 }}>
              {JSON.stringify({
                  current_tools: intake.current_tools,
                  pain_points: intake.pain_points,
                  workflows_needed: intake.workflows_needed,
                }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </section>
  );
}
