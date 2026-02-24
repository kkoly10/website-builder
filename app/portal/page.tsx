import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  lead_id: string | null;
  created_at: string | null;
  status: string | null;
  tier_recommended: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  public_token: string | null;
};

type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
};

type OpsIntakeRow = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  industry: string | null;
  status: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
};

type OpsCallRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
};

type OpsPieRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
  summary: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function money(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/portal")}`);
  }

  // Safety net: claim any records submitted before signup/login
  const claimResult = await claimCustomerRecordsForUser({
    userId: user.id,
    email: user.email,
  });

  const admin = await isAdminUser({
    userId: user.id,
    email: user.email,
  });

  const [{ data: quotes }, { data: opsIntakes }] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select(
        "id, lead_id, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, public_token"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("ops_intakes")
      .select(
        "id, created_at, company_name, contact_name, email, industry, status, recommendation_tier, recommendation_price_range, recommendation_score"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const opsRows = (opsIntakes ?? []) as OpsIntakeRow[];

  const leadIds = Array.from(
    new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[])
  );

  const opsIntakeIds = opsRows.map((r) => r.id);

  const [leadRowsRes, opsCallsRes, opsPiesRes] = await Promise.all([
    leadIds.length
      ? supabaseAdmin
          .from("leads")
          .select("id, email, name")
          .in("id", leadIds)
      : Promise.resolve({ data: [] as LeadRow[] }),
    opsIntakeIds.length
      ? supabaseAdmin
          .from("ops_call_requests")
          .select("id, ops_intake_id, created_at, status")
          .in("ops_intake_id", opsIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsCallRow[] }),
    opsIntakeIds.length
      ? supabaseAdmin
          .from("ops_pie_reports")
          .select("id, ops_intake_id, created_at, status, summary")
          .in("ops_intake_id", opsIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsPieRow[] }),
  ]);

  const leadRows = (leadRowsRes.data ?? []) as LeadRow[];
  const opsCalls = (opsCallsRes.data ?? []) as OpsCallRow[];
  const opsPies = (opsPiesRes.data ?? []) as OpsPieRow[];

  const leadById = new Map<string, LeadRow>();
  for (const l of leadRows) leadById.set(l.id, l);

  const latestCallByOpsIntakeId = new Map<string, OpsCallRow>();
  for (const c of opsCalls) {
    if (!latestCallByOpsIntakeId.has(c.ops_intake_id)) {
      latestCallByOpsIntakeId.set(c.ops_intake_id, c);
    }
  }

  const latestPieByOpsIntakeId = new Map<string, OpsPieRow>();
  for (const p of opsPies) {
    if (!latestPieByOpsIntakeId.has(p.ops_intake_id)) {
      latestPieByOpsIntakeId.set(p.ops_intake_id, p);
    }
  }

  return (
    <main className="container">
      <section className="section">
        <div className="heroGrid">
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Client Portal
              </div>

              <div style={{ height: 10 }} />
              <h1 className="h2">Welcome back</h1>
              <p className="p" style={{ marginTop: 8 }}>
                Signed in as <strong>{user.email}</strong>
              </p>

              {claimResult.ok && !claimResult.skipped ? (
                <div className="pills" style={{ marginTop: 10 }}>
                  <span className="pill">Records synced to your account</span>
                </div>
              ) : null}

              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/build" className="btn btnPrimary">
                  Start Website Quote <span className="btnArrow">→</span>
                </Link>
                <Link href="/systems" className="btn btnGhost">
                  Start Ops Intake
                </Link>
                <Link href="/estimate" className="btn btnGhost">
                  Estimate Tool
                </Link>
                {admin ? (
                  <Link href="/internal/admin" className="btn btnGhost">
                    Internal Admin
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner">
              <div className="statRow">
                <div className="stat">
                  <div className="statNum">{quoteRows.length}</div>
                  <div className="statLab">Website Quotes</div>
                </div>
                <div className="stat">
                  <div className="statNum">{opsRows.length}</div>
                  <div className="statLab">Ops Intakes</div>
                </div>
              </div>

              <div className="p" style={{ marginTop: 12 }}>
                Any quote or ops intake submitted with your email will now be attached to this account automatically.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ marginBottom: 10 }}>
              Website Quotes
            </h2>

            {quoteRows.length === 0 ? (
              <p className="p">No website quotes yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {quoteRows.map((q) => {
                  const lead = q.lead_id ? leadById.get(q.lead_id) : null;
                  return (
                    <div
                      key={q.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>
                            {lead?.name || "Website Quote"}{" "}
                            <span style={{ opacity: 0.7, fontWeight: 500 }}>#{String(q.id).slice(0, 8)}</span>
                          </div>
                          <div className="p" style={{ marginTop: 4 }}>
                            {lead?.email || user.email} • {fmtDate(q.created_at)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {q.status ? <span className="pill">{q.status}</span> : null}
                          {q.tier_recommended ? <span className="pill">{q.tier_recommended}</span> : null}
                        </div>
                      </div>

                      <div className="p" style={{ marginTop: 8 }}>
                        Estimate: {money(q.estimate_low)} – {money(q.estimate_high)}
                        {q.estimate_total != null ? ` (target ${money(q.estimate_total)})` : ""}
                      </div>

                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href="/build" className="btn btnGhost">
                          Start Another Quote
                        </Link>
                        <Link href={`/book?quoteId=${encodeURIComponent(q.id)}`} className="btn btnGhost">
                          Continue Booking
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ marginBottom: 10 }}>
              Ops / Workflow Intakes
            </h2>

            {opsRows.length === 0 ? (
              <p className="p">No ops intakes yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {opsRows.map((o) => {
                  const latestCall = latestCallByOpsIntakeId.get(o.id) ?? null;
                  const latestPie = latestPieByOpsIntakeId.get(o.id) ?? null;

                  return (
                    <div
                      key={o.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>
                            {o.company_name || "Ops Intake"}{" "}
                            <span style={{ opacity: 0.7, fontWeight: 500 }}>#{String(o.id).slice(0, 8)}</span>
                          </div>
                          <div className="p" style={{ marginTop: 4 }}>
                            {o.contact_name || "—"} • {o.email || user.email} • {fmtDate(o.created_at)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {o.status ? <span className="pill">{o.status}</span> : null}
                          {o.recommendation_tier ? <span className="pill">{o.recommendation_tier}</span> : null}
                          {o.recommendation_price_range ? (
                            <span className="pill">{o.recommendation_price_range}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p" style={{ marginTop: 8 }}>
                        Industry: {o.industry || "—"} • Score: {o.recommendation_score ?? "—"}
                      </div>

                      <div className="p" style={{ marginTop: 6 }}>
                        Call: {latestCall?.status || "not booked yet"} • PIE: {latestPie?.status || "not generated yet"}
                      </div>

                      {latestPie?.summary ? (
                        <div className="p" style={{ marginTop: 6 }}>
                          PIE summary: {latestPie.summary}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link
                          href={`/ops-book?opsIntakeId=${encodeURIComponent(o.id)}`}
                          className="btn btnGhost"
                        >
                          Book / Update Call
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
