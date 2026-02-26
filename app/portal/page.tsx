import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { claimCustomerRecordsForUser, createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuoteRow = { id: string; lead_id: string | null; created_at: string | null; status: string | null; tier_recommended: string | null; estimate_total: number | null; estimate_low: number | null; estimate_high: number | null; public_token: string | null; };
type LeadRow = { id: string; email: string | null; name: string | null; };
type OpsIntakeRow = { id: string; created_at: string | null; company_name: string | null; contact_name: string | null; email: string | null; industry: string | null; status: string | null; recommendation_tier: string | null; recommendation_price_range: string | null; recommendation_score: number | null; };
type OpsCallRow = { id: string; ops_intake_id: string; created_at: string | null; status: string | null; };

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function money(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  const claimResult = await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const [{ data: quotes }, { data: opsIntakes }] = await Promise.all([
    supabaseAdmin.from("quotes").select("id, lead_id, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, public_token").eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(25),
    supabaseAdmin.from("ops_intakes").select("id, created_at, company_name, contact_name, email, industry, status, recommendation_tier, recommendation_price_range, recommendation_score").eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(25),
  ]);

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const opsRows = (opsIntakes ?? []) as OpsIntakeRow[];

  const leadIds = Array.from(new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[]));
  const leadRowsRes = leadIds.length ? await supabaseAdmin.from("leads").select("id, email, name").in("id", leadIds) : { data: [] };
  const leadRows = (leadRowsRes.data ?? []) as LeadRow[];

  const leadById = new Map<string, LeadRow>();
  for (const l of leadRows) leadById.set(l.id, l);

  // RESTORED: Fetch Call Requests for Ops Intakes
  const opsIntakeIds = opsRows.map((r) => r.id);
  const opsCallsRes = opsIntakeIds.length 
    ? await supabaseAdmin.from("ops_call_requests").select("id, ops_intake_id, created_at, status").in("ops_intake_id", opsIntakeIds).order("created_at", { ascending: false }) 
    : { data: [] };
  
  const opsCalls = (opsCallsRes.data ?? []) as OpsCallRow[];
  const latestCallByOpsIntakeId = new Map<string, OpsCallRow>();
  for (const c of opsCalls) {
    if (!latestCallByOpsIntakeId.has(c.ops_intake_id)) {
      latestCallByOpsIntakeId.set(c.ops_intake_id, c);
    }
  }

  return (
    <main className="container" style={{ padding: "40px 0 80px" }}>
      <section className="heroGrid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="cardInner">
            <div className="kicker"><span className="kickerDot" aria-hidden="true" /> Client Portal</div>
            <div style={{ height: 10 }} />
            <h1 className="h2">Welcome back</h1>
            <p className="pDark" style={{ marginTop: 8 }}>Signed in as <strong style={{ color: "var(--fg)" }}>{user.email}</strong></p>

            {claimResult.ok && !claimResult.skipped && (
              <div className="pills" style={{ marginTop: 10 }}><span className="pill">Records synced to your account</span></div>
            )}

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/build" className="btn btnPrimary">New Website Quote</Link>
              <Link href="/systems" className="btn btnGhost">New Ops Intake</Link>
              {admin && <Link href="/internal/admin" className="btn btnGhost" style={{ borderColor: "var(--accentStroke)", color: "var(--accent)" }}>Admin HQ</Link>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="statRow" style={{ padding: 0, gap: 12 }}>
              <div className="stat" style={{ background: "var(--panel2)" }}>
                <div className="statNum">{quoteRows.length}</div>
                <div className="statLab">Active Projects</div>
              </div>
              <div className="stat" style={{ background: "var(--panel2)" }}>
                <div className="statNum">{opsRows.length}</div>
                <div className="statLab">Ops Requests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid2">
        {/* WEBSITES */}
        <section className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ marginBottom: 16, fontSize: 20 }}>Website Projects</h2>
            {quoteRows.length === 0 ? (
              <p className="pDark">No website projects found.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {quoteRows.map((q) => {
                  const lead = q.lead_id ? leadById.get(q.lead_id) : null;
                  return (
                    <div key={q.id} style={{ border: "1px solid var(--stroke)", borderRadius: 12, padding: 16, background: "var(--panel2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 16 }}>{lead?.name || "Website Project"}</div>
                          <div className="pDark" style={{ marginTop: 4 }}>ID: #{String(q.id).slice(0, 8)} • {fmtDate(q.created_at)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span className="badge">{q.status || "Evaluating"}</span>
                        </div>
                      </div>
                      
                      <div className="pDark" style={{ marginTop: 12, fontSize: 13 }}>
                        Target Investment: <strong style={{ color: "var(--fg)" }}>{q.estimate_total != null ? money(q.estimate_total) : `${money(q.estimate_low)} - ${money(q.estimate_high)}`}</strong>
                      </div>

                      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {q.public_token ? (
                          <Link href={`/portal/${q.public_token}`} className="btn btnPrimary" style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}>
                            Open Project Workspace →
                          </Link>
                        ) : (
                          <Link href={`/book?quoteId=${encodeURIComponent(q.id)}`} className="btn btnGhost" style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}>
                            Continue Booking
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* OPS INTAKES */}
        <section className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ marginBottom: 16, fontSize: 20 }}>Ops / Workflow Intakes</h2>
            {opsRows.length === 0 ? (
              <p className="pDark">No ops intakes found.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {opsRows.map((o) => {
                  const latestCall = latestCallByOpsIntakeId.get(o.id) ?? null;
                  
                  return (
                    <div key={o.id} style={{ border: "1px solid var(--stroke)", borderRadius: 12, padding: 16, background: "var(--panel2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 16 }}>{o.company_name || "Ops Request"}</div>
                          <div className="pDark" style={{ marginTop: 4 }}>ID: #{String(o.id).slice(0, 8)} • {fmtDate(o.created_at)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span className="badge">{o.status || "Reviewing"}</span>
                        </div>
                      </div>

                      <div className="pDark" style={{ marginTop: 12, fontSize: 13 }}>
                        Call Request: <strong style={{ color: "var(--fg)" }}>{latestCall?.status || "Not requested"}</strong>
                      </div>

                      {/* RESTORED: Book Call Button */}
                      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                        <Link href={`/ops-book?opsIntakeId=${encodeURIComponent(o.id)}`} className="btn btnGhost" style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}>
                          Book / Update Call
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
