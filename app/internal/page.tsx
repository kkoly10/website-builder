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
  const [opsIntakesCount, opsCallsCount, opsPieCount] = await Promise.all([
    countRows("ops_intakes"),
    countRows("ops_call_requests"),
    countRows("ops_pie_reports"),
  ]);

  const { data: recentOps } = await supabaseAdmin
    .from("ops_intakes")
    .select("id, company_name, contact_name, email, status, created_at, recommendation_tier, recommendation_price_range")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="heroGrid">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Internal Hub
            </div>

            <div style={{ height: 10 }} />
            <h1 className="h2">Everything in one admin area</h1>
            <p className="p" style={{ marginTop: 8 }}>
              Use this page as your admin landing page, then jump into either your website project
              pipeline or your ops intake/PIE workflow.
            </p>

            <div className="heroActions" style={{ marginTop: 12 }}>
              <Link href="/internal/admin" className="btn btnGhost">
                Open Website Pipeline
              </Link>
              <Link href="/internal/ops" className="btn btnPrimary">
                Open Ops Dashboard <span className="btnArrow">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Ops snapshot</div>

            <div className="statRow">
              <div className="stat">
                <div className="statNum">{opsIntakesCount ?? "—"}</div>
                <div className="statLab">Ops intakes</div>
              </div>

              <div className="stat">
                <div className="statNum">{opsCallsCount ?? "—"}</div>
                <div className="statLab">Call requests</div>
              </div>
            </div>

            <div className="statRow" style={{ marginTop: 10 }}>
              <div className="stat">
                <div className="statNum">{opsPieCount ?? "—"}</div>
                <div className="statLab">PIE reports</div>
              </div>

              <div className="stat">
                <div className="statNum">Live</div>
                <div className="statLab">Admin access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Recent Ops Intakes</div>
              <div className="p" style={{ marginTop: 6 }}>
                Quick preview before opening the full ops dashboard.
              </div>
            </div>

            <Link href="/internal/ops" className="btn btnGhost">
              View full ops dashboard
            </Link>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {(recentOps ?? []).length === 0 ? (
              <div className="p">No ops intakes yet.</div>
            ) : (
              (recentOps ?? []).map((row) => (
                <div
                  key={row.id}
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{row.company_name || "Unnamed company"}</div>
                  <div className="p" style={{ marginTop: 4 }}>
                    {row.contact_name || "—"} • {row.email || "—"}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {row.recommendation_tier ? <span className="pill">{row.recommendation_tier}</span> : null}
                    {row.recommendation_price_range ? (
                      <span className="pill">{row.recommendation_price_range}</span>
                    ) : null}
                    <span className="pill">{row.status || "new"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}