import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Params = Promise<{ opsIntakeId: string }> | { opsIntakeId: string };

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default async function OpsIntakeDetailPage({
  params,
}: {
  params: Params;
}) {
  const p = await Promise.resolve(params);
  const opsIntakeId = p.opsIntakeId;

  const [{ data: intake }, { data: calls }, { data: reports }] = await Promise.all([
    supabaseAdmin
      .from("ops_intakes")
      .select("*")
      .eq("id", opsIntakeId)
      .maybeSingle(),
    supabaseAdmin
      .from("ops_call_requests")
      .select("*")
      .eq("ops_intake_id", opsIntakeId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("ops_pie_reports")
      .select("*")
      .eq("ops_intake_id", opsIntakeId)
      .order("created_at", { ascending: false }),
  ]);

  if (!intake) notFound();

  const latestCall = calls?.[0] ?? null;
  const latestReport = reports?.[0] ?? null;

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
          <p className="p" style={{ marginTop: 8 }}>
            {intake.contact_name || "—"} • {intake.email || "—"} • {intake.phone || "—"}
          </p>

          <div className="pills" style={{ marginTop: 10 }}>
            <span className="pill">Status: {intake.status || "new"}</span>
            {intake.recommendation_tier ? <span className="pill">{intake.recommendation_tier}</span> : null}
            {intake.recommendation_price_range ? (
              <span className="pill">{intake.recommendation_price_range}</span>
            ) : null}
            <span className="pill">Submitted: {fmtDate(intake.created_at)}</span>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/internal/ops" className="btn btnGhost">
              Back to Ops Dashboard
            </Link>
            <Link href={`/ops-book?opsIntakeId=${intake.id}`} className="btn btnGhost">
              Open Public Booking Page
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Intake Snapshot</div>
            <div className="p">
              <strong>Industry:</strong> {intake.industry || "—"}
              <br />
              <strong>Team size:</strong> {intake.team_size || "—"}
              <br />
              <strong>Job volume:</strong> {intake.job_volume || "—"}
              <br />
              <strong>Urgency:</strong> {intake.urgency || "—"}
              <br />
              <strong>Readiness:</strong> {intake.readiness || "—"}
              <br />
              <strong>Recommendation score:</strong> {intake.recommendation_score ?? "—"}
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 800 }}>Notes</div>
              <div className="p" style={{ marginTop: 4 }}>
                {intake.notes || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Latest Call Request</div>
            {latestCall ? (
              <div className="p">
                <strong>Status:</strong> {latestCall.status || "submitted"}
                <br />
                <strong>Created:</strong> {fmtDate(latestCall.created_at)}
                <br />
                <strong>Best time:</strong> {latestCall.best_time_to_call || "—"}
                <br />
                <strong>Preferred window:</strong> {latestCall.preferred_times || "—"}
                <br />
                <strong>Timezone:</strong> {latestCall.timezone || "—"}
                <br />
                <strong>Notes:</strong> {latestCall.notes || "—"}
              </div>
            ) : (
              <div className="p">No call request yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Latest PIE Report</div>
            {latestReport ? (
              <div className="p">
                <strong>Status:</strong> {latestReport.status || "generated"}
                <br />
                <strong>Created:</strong> {fmtDate(latestReport.created_at)}
                <br />
                <strong>Generator:</strong> {latestReport.generator || "—"}
                <br />
                <strong>Model:</strong> {latestReport.model || "—"}
                <br />
                <strong>Summary:</strong> {latestReport.summary || "—"}
              </div>
            ) : (
              <div className="p">No PIE report yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="cardInner">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Raw Intake Data</div>
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            {JSON.stringify(
              {
                current_tools: intake.current_tools,
                pain_points: intake.pain_points,
                workflows_needed: intake.workflows_needed,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="cardInner">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Latest PIE JSON</div>
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            {latestReport?.report_json ? JSON.stringify(latestReport.report_json, null, 2) : "No PIE report yet."}
          </pre>
        </div>
      </div>
    </section>
  );
}
