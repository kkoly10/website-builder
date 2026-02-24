// app/internal/admin/OpsIntakesMiniPanel.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AnyRow = Record<string, any>;

function ts(v: any): number {
  const d = new Date(v ?? 0).getTime();
  return Number.isFinite(d) ? d : 0;
}

function latestBy<T extends AnyRow>(rows: T[], dateKeys = ["created_at", "updated_at"]): T | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const aTs = ts(a?.[dateKeys[0]] ?? a?.[dateKeys[1]]);
    const bTs = ts(b?.[dateKeys[0]] ?? b?.[dateKeys[1]]);
    return bTs - aTs;
  })[0];
}

function groupBy<T extends AnyRow>(rows: T[], key: string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const r of rows) {
    const k = r?.[key];
    if (!k) continue;
    const id = String(k);
    if (!map[id]) map[id] = [];
    map[id].push(r);
  }
  return map;
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function asScore(row: AnyRow | null) {
  if (!row) return null;
  const report = row.report_json && typeof row.report_json === "object" ? row.report_json : {};
  const s = (report as any)?.score;
  return Number.isFinite(Number(s)) ? Number(s) : null;
}

export default async function OpsIntakesMiniPanel() {
  const [{ data: intakes }, { data: calls }, { data: pieReports }] = await Promise.all([
    supabaseAdmin.from("ops_intakes").select("*").order("created_at", { ascending: false }).limit(200),
    supabaseAdmin.from("ops_call_requests").select("*").order("created_at", { ascending: false }).limit(500),
    supabaseAdmin.from("ops_pie_reports").select("*").order("created_at", { ascending: false }).limit(500),
  ]);

  const intakeRows = intakes ?? [];
  const callRows = calls ?? [];
  const pieRows = pieReports ?? [];

  const callsByIntake = groupBy(callRows.filter((r) => r?.ops_intake_id), "ops_intake_id");
  const pieByIntake = groupBy(pieRows.filter((r) => r?.ops_intake_id), "ops_intake_id");

  const rows = intakeRows.map((intake) => {
    const id = String(intake.id);
    const latestCall = latestBy(callsByIntake[id] ?? []);
    const latestPie = latestBy(pieByIntake[id] ?? []);

    return {
      id,
      createdAt: intake.created_at,
      company: intake.company_name || "Unnamed business",
      contact: intake.contact_name || "—",
      email: intake.email || "—",
      status: intake.status || "new",
      tier: intake.recommendation_tier || "—",
      recScore: intake.recommendation_score,
      pieScore: asScore(latestPie),
      pieStatus: latestPie?.status || null,
      pieSummary: latestPie?.summary || null,
      booked: !!latestCall,
      callStatus: latestCall?.status || null,
      link: `/internal/ops/${id}`,
    };
  });

  return (
    <section
      style={{
        marginTop: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 800 }}>Ops Intakes</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Workflow automation/billing/CRM requests + PIE status
          </div>
        </div>

        <Link
          href="/internal/ops"
          style={{
            color: "white",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 8,
            padding: "8px 10px",
            background: "rgba(255,255,255,0.04)",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Open OPS Queue →
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "rgba(255,255,255,0.03)" }}>
              <th style={{ padding: 10 }}>Created</th>
              <th style={{ padding: 10 }}>Business</th>
              <th style={{ padding: 10 }}>Contact</th>
              <th style={{ padding: 10 }}>Tier</th>
              <th style={{ padding: 10 }}>Call</th>
              <th style={{ padding: 10 }}>PIE</th>
              <th style={{ padding: 10 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 10, whiteSpace: "nowrap" }}>{fmtDate(row.createdAt)}</td>
                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700 }}>{row.company}</div>
                    <div style={{ opacity: 0.75 }}>{row.email}</div>
                  </td>
                  <td style={{ padding: 10 }}>{row.contact}</td>
                  <td style={{ padding: 10 }}>
                    <div>{row.tier}</div>
                    <div style={{ opacity: 0.75 }}>
                      Intake {row.recScore ?? "—"}{row.pieScore != null ? ` • PIE ${row.pieScore}` : ""}
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>
                    {row.booked ? (
                      <span style={{ color: "#9cf3b0" }}>{row.callStatus || "requested"}</span>
                    ) : (
                      <span style={{ opacity: 0.7 }}>Not booked</span>
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    {row.pieStatus ? (
                      <div>
                        <div style={{ color: "#9cf3b0" }}>{row.pieStatus}</div>
                        <div
                          style={{
                            opacity: 0.75,
                            maxWidth: 280,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={row.pieSummary || ""}
                        >
                          {row.pieSummary || "PIE report available"}
                        </div>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.7 }}>No PIE yet</span>
                    )}
                  </td>
                  <td style={{ padding: 10 }}>
                    <Link
                      href={row.link}
                      style={{
                        color: "white",
                        textDecoration: "none",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "rgba(255,255,255,0.04)",
                        fontWeight: 700,
                      }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 14, opacity: 0.75 }}>
                  No OPS intakes found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
