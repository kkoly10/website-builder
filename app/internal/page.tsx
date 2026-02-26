import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function countRows(table: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export default async function InternalHomePage() {
  const [opsIntakesCount, opsCallsCount, opsPieCount, webQuotesCount, webPieCount] = await Promise.all([
    countRows("ops_intakes"),
    countRows("ops_call_requests"),
    countRows("ops_pie_reports"),
    countRows("quotes"), // Website quotes
    countRows("pie_reports"), // Website PIE reports
  ]);

  const { data: recentOps } = await supabaseAdmin
    .from("ops_intakes")
    .select("id, company_name, contact_name, email, status, created_at, recommendation_tier, recommendation_price_range")
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: recentWeb } = await supabaseAdmin
    .from("quotes")
    .select("id, lead_email, estimate_total, tier_recommended, status, created_at")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Internal Hub
          </div>

          <div style={{ height: 10 }} />
          <h1 className="h2">Everything in one admin area</h1>
          <p className="p" style={{ marginTop: 8 }}>
            Welcome to the CEO dashboard. Jump into either your website project pipeline or your ops intake workflow.
          </p>
        </div>
      </div>

      <div className="grid2">
        {/* WEBSITES SNAPSHOT */}
        <div className="card">
          <div className="cardInner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 900, color: "var(--fg)", fontSize: 18 }}>Web Design Pipeline</div>
              <Link href="/internal/admin" className="btn btnPrimary" style={{ padding: "6px 12px", fontSize: 13 }}>
                Open Web Pipeline <span className="btnArrow">→</span>
              </Link>
            </div>

            <div className="statRow" style={{ padding: 0, gap: 10 }}>
              <div className="stat" style={{ background: "var(--panel2)" }}>
                <div className="statNum" style={{ color: "var(--accent)" }}>{webQuotesCount ?? "—"}</div>
                <div className="statLab">Total Quotes</div>
              </div>
              <div className="stat" style={{ background: "var(--panel2)" }}>
                <div className="statNum">{webPieCount ?? "—"}</div>
                <div className="statLab">PIE Reports</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 800, color: "var(--muted)", marginBottom: 8, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Recent Web Leads</div>
              <div style={{ display: "grid", gap: 8 }}>
                {(recentWeb ?? []).length === 0 ? (
                  <div className="pDark">No web quotes yet.</div>
                ) : (
                  (recentWeb ?? []).map((row) => (
                    <div key={row.id} style={{ borderRadius: 8, border: "1px solid var(--stroke)", background: "var(--bg2)", padding: 10 }}>
                      <div style={{ fontWeight: 800, color: "var(--fg)" }}>{row.lead_email || "No Email"}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <span className="badge" style={{ background: "var(--panel)" }}>${row.estimate_total}</span>
                        <span className="badge" style={{ background: "var(--panel)" }}>{row.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* OPS SNAPSHOT */}
        <div className="card">
          <div className="cardInner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 900, color: "var(--fg)", fontSize: 18 }}>Workflow Ops Pipeline</div>
              <Link href="/internal/ops" className="btn btnPrimary" style={{ padding: "6px 12px", fontSize: 13 }}>
                Open Ops Pipeline <span className="btnArrow">→</span>
              </Link>
            </div>

            <div className="statRow" style={{ padding: 0, gap: 10 }}>
              <div className="stat" style={{ background: "var(--panel2)" }}>
                <div className="statNum" style={{ color: "var(--accent)" }}>{opsIntakesCount ?? "—"}</div>
                <div className="statLab">Ops Intakes</div>
              </div>
              <div className="stat" style={{ background: "var(--panel2)" }}>
                <div className="statNum">{opsCallsCount ?? "—"}</div>
                <div className="statLab">Call Requests</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 800, color: "var(--muted)", marginBottom: 8, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Recent Ops Leads</div>
              <div style={{ display: "grid", gap: 8 }}>
                {(recentOps ?? []).length === 0 ? (
                  <div className="pDark">No ops intakes yet.</div>
                ) : (
                  (recentOps ?? []).map((row) => (
                    <div key={row.id} style={{ borderRadius: 8, border: "1px solid var(--stroke)", background: "var(--bg2)", padding: 10 }}>
                      <div style={{ fontWeight: 800, color: "var(--fg)" }}>{row.company_name || "Unnamed company"}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <span className="badge" style={{ background: "var(--panel)" }}>{row.recommendation_tier || "N/A"}</span>
                        <span className="badge" style={{ background: "var(--panel)" }}>{row.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
