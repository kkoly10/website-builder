import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
  normalizeEmail,
} from "@/lib/supabase/server";
import { statusLabel } from "@/lib/ecommerce/status";

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  lead_id: string | null;
  created_at: string | null;
  status: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  public_token: string | null;
};

type LeadRow = { id: string; email: string | null; name: string | null };
type OpsIntakeRow = { id: string; created_at: string | null; company_name: string | null; status: string | null };
type OpsCallRow = { id: string; ops_intake_id: string; created_at: string | null; status: string | null };
type OpsPieRow = { id: string; ops_intake_id: string; created_at: string | null; summary: string | null };

type EcomIntakeRow = {
  id: string;
  created_at: string | null;
  business_name: string | null;
  email: string | null;
  status: string | null;
};

type EcomCallRow = { id: string; ecom_intake_id: string; created_at: string | null; status: string | null };
type EcomQuoteRow = { id: string; ecom_intake_id: string; created_at: string | null; status: string | null };

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function money(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function statusText(value: string | null | undefined, fallback: string) {
  return statusLabel(value, fallback);
}

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  const userEmailNorm = normalizeEmail(user.email);
  const claimResult = await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const [{ data: quotes }, { data: opsIntakes }, { data: ecomByAuth }, { data: ecomByEmail }] =
    await Promise.all([
      supabaseAdmin
        .from("quotes")
        .select("id, lead_id, created_at, status, estimate_total, estimate_low, estimate_high, public_token")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("ops_intakes")
        .select("id, created_at, company_name, status")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("ecom_intakes")
        .select("id, created_at, business_name, email, status")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      userEmailNorm
        ? supabaseAdmin
            .from("ecom_intakes")
            .select("id, created_at, business_name, email, status")
            .eq("email", userEmailNorm)
            .order("created_at", { ascending: false })
            .limit(25)
        : Promise.resolve({ data: [] as EcomIntakeRow[] }),
    ]);

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const opsRows = (opsIntakes ?? []) as OpsIntakeRow[];

  const ecomCombined = [
    ...((ecomByAuth ?? []) as EcomIntakeRow[]),
    ...((ecomByEmail ?? []) as EcomIntakeRow[]),
  ];
  const ecomRows = Array.from(new Map(ecomCombined.map((row) => [row.id, row])).values()).sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || "")
  );

  const leadIds = Array.from(new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[]));
  const opsIntakeIds = opsRows.map((r) => r.id);
  const ecomIntakeIds = ecomRows.map((r) => r.id);

  const [leadRowsRes, opsCallsRes, opsPiesRes, ecomCallsRes, ecomQuotesRes] = await Promise.all([
    leadIds.length
      ? supabaseAdmin.from("leads").select("id, email, name").in("id", leadIds)
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
          .select("id, ops_intake_id, created_at, summary")
          .in("ops_intake_id", opsIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsPieRow[] }),
    ecomIntakeIds.length
      ? supabaseAdmin
          .from("ecom_call_requests")
          .select("id, ecom_intake_id, created_at, status")
          .in("ecom_intake_id", ecomIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as EcomCallRow[] }),
    ecomIntakeIds.length
      ? supabaseAdmin
          .from("ecom_quotes")
          .select("id, ecom_intake_id, created_at, status")
          .in("ecom_intake_id", ecomIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as EcomQuoteRow[] }),
  ]);

  const leadRows = (leadRowsRes.data ?? []) as LeadRow[];
  const opsCalls = (opsCallsRes.data ?? []) as OpsCallRow[];
  const opsPies = (opsPiesRes.data ?? []) as OpsPieRow[];
  const ecomCalls = (ecomCallsRes.data ?? []) as EcomCallRow[];
  const ecomQuotes = (ecomQuotesRes.data ?? []) as EcomQuoteRow[];

  const leadById = new Map<string, LeadRow>();
  for (const l of leadRows) leadById.set(l.id, l);

  const latestCallByOpsIntakeId = new Map<string, OpsCallRow>();
  for (const c of opsCalls) if (!latestCallByOpsIntakeId.has(c.ops_intake_id)) latestCallByOpsIntakeId.set(c.ops_intake_id, c);

  const latestPieByOpsIntakeId = new Map<string, OpsPieRow>();
  for (const p of opsPies) if (!latestPieByOpsIntakeId.has(p.ops_intake_id)) latestPieByOpsIntakeId.set(p.ops_intake_id, p);

  const latestCallByEcomIntakeId = new Map<string, EcomCallRow>();
  for (const c of ecomCalls) if (!latestCallByEcomIntakeId.has(c.ecom_intake_id)) latestCallByEcomIntakeId.set(c.ecom_intake_id, c);

  const latestQuoteByEcomIntakeId = new Map<string, EcomQuoteRow>();
  for (const q of ecomQuotes) if (!latestQuoteByEcomIntakeId.has(q.ecom_intake_id)) latestQuoteByEcomIntakeId.set(q.ecom_intake_id, q);

  const websiteInProgress = quoteRows.filter((q) => (q.status || "").toLowerCase() !== "completed").length;
  const opsInProgress = opsRows.filter((o) => (o.status || "").toLowerCase() !== "completed").length;

  return (
    <main className="container" style={{ padding: "40px 0 80px" }}>
      <section className="heroGrid">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" /> Client Portal
            </div>
            <div style={{ height: 10 }} />
            <h1 className="h2">Welcome back</h1>
            <p className="pDark">
              Signed in as <strong>{user.email}</strong>
            </p>
            {claimResult.ok && !claimResult.skipped && (
              <div className="pills">
                <span className="pill">Records synced to your account</span>
              </div>
            )}
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/build/intro" className="btn btnPrimary">
                New Website Quote
              </Link>
              <Link href="/systems" className="btn btnGhost">
                New Ops Intake
              </Link>
              <Link href="/ecommerce" className="btn btnGhost">
                New E-Commerce Intake
              </Link>
              <Link href="/contact" className="btn btnGhost">
                Support
              </Link>
              {admin && (
                <Link
                  href="/internal/admin"
                  className="btn btnGhost"
                  style={{ borderColor: "var(--accentStroke)", color: "var(--accent)" }}
                >
                  Admin HQ
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
            <div className="statRow" style={{ padding: 0, gap: 12 }}>
              <div className="stat">
                <div className="statNum">{websiteInProgress}</div>
                <div className="statLab">Website In Progress</div>
              </div>
              <div className="stat">
                <div className="statNum">{opsInProgress}</div>
                <div className="statLab">Ops In Progress</div>
              </div>
            </div>
            <div className="pDark" style={{ marginTop: 12, fontSize: 13 }}>
              Keep project status current in your workspace for the fastest support turnaround.
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <div
          className="cardInner"
          style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}
        >
          <div>
            <div style={{ fontWeight: 800, color: "var(--fg)" }}>How status updates work</div>
            <div className="pDark" style={{ marginTop: 6 }}>
              Evaluating → Scoped → In Progress → Completed
            </div>
          </div>
          <Link href="/terms" className="btn btnGhost" style={{ padding: "8px 12px", fontSize: 13 }}>
            Service terms
          </Link>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ marginBottom: 16, fontSize: 20 }}>
              Website Projects
            </h2>
            {quoteRows.length === 0 ? (
              <div className="card" style={{ background: "var(--panel2)" }}>
                <div className="cardInner">
                  <p className="pDark">No website projects found yet.</p>
                  <Link href="/build/intro" className="btn btnPrimary">
                    Start a website quote
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {quoteRows.map((q) => {
                  const lead = q.lead_id ? leadById.get(q.lead_id) : null;
                  return (
                    <div
                      key={q.id}
                      style={{ border: "1px solid var(--stroke)", borderRadius: 12, padding: 16, background: "var(--panel2)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 16 }}>{lead?.name || "Website Project"}</div>
                          <div className="pDark" style={{ marginTop: 4 }}>
                            ID: #{String(q.id).slice(0, 8)} • {fmtDate(q.created_at)}
                          </div>
                        </div>
                        <span className="badge">{q.status || "evaluating"}</span>
                      </div>

                      <div className="pDark" style={{ marginTop: 12, fontSize: 13 }}>
                        Target Investment:{" "}
                        <strong>
                          {q.estimate_total != null
                            ? money(q.estimate_total)
                            : `${money(q.estimate_low)} - ${money(q.estimate_high)}`}
                        </strong>
                      </div>

                      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {q.public_token ? (
                          <Link
                            href={`/portal/${q.public_token}`}
                            className="btn btnPrimary"
                            style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}
                          >
                            Open Project Workspace →
                          </Link>
                        ) : (
                          <Link
                            href={`/book?quoteId=${encodeURIComponent(q.id)}`}
                            className="btn btnGhost"
                            style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}
                          >
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

        <section className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ marginBottom: 16, fontSize: 20 }}>
              Ops / Workflow Intakes
            </h2>
            {opsRows.length === 0 ? (
              <div className="card" style={{ background: "var(--panel2)" }}>
                <div className="cardInner">
                  <p className="pDark">No ops workflow requests found yet.</p>
                  <Link href="/ops-intake" className="btn btnPrimary">
                    Start ops intake
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {opsRows.map((o) => {
                  const latestCall = latestCallByOpsIntakeId.get(o.id) ?? null;
                  const latestPie = latestPieByOpsIntakeId.get(o.id) ?? null;

                  return (
                    <div
                      key={o.id}
                      style={{ border: "1px solid var(--stroke)", borderRadius: 12, padding: 16, background: "var(--panel2)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 16 }}>{o.company_name || "Ops Request"}</div>
                          <div className="pDark" style={{ marginTop: 4 }}>
                            ID: #{String(o.id).slice(0, 8)} • {fmtDate(o.created_at)}
                          </div>
                        </div>
                        <span className="badge">{o.status || "reviewing"}</span>
                      </div>

                      <div className="pDark" style={{ marginTop: 12, fontSize: 13 }}>
                        Call Request: <strong>{latestCall?.status || "not requested"}</strong>
                      </div>

                      {latestPie?.summary && (
                        <div className="pDark" style={{ marginTop: 6, fontSize: 13 }}>
                          <strong>Status Note:</strong> {latestPie.summary}
                        </div>
                      )}

                      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                        <Link
                          href={`/ops-book?opsIntakeId=${encodeURIComponent(o.id)}`}
                          className="btn btnGhost"
                          style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}
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
        </section>
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="cardInner">
          <h2 className="h2" style={{ marginBottom: 12, fontSize: 20 }}>
            E-Commerce Requests
          </h2>
          {ecomRows.length === 0 ? (
            <div className="card" style={{ background: "var(--panel2)" }}>
              <div className="cardInner">
                <p className="pDark">No e-commerce requests found yet.</p>
                <Link href="/ecommerce/intake" className="btn btnPrimary">
                  Start e-commerce intake
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {ecomRows.map((row) => {
                const latestCall = latestCallByEcomIntakeId.get(row.id) ?? null;
                const latestQuote = latestQuoteByEcomIntakeId.get(row.id) ?? null;

                return (
                  <div
                    key={row.id}
                    style={{ border: "1px solid var(--stroke)", borderRadius: 12, padding: 16, background: "var(--panel2)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 16 }}>{row.business_name || "E-Commerce Request"}</div>
                        <div className="pDark" style={{ marginTop: 4 }}>
                          ID: #{String(row.id).slice(0, 8)} • {fmtDate(row.created_at)}
                        </div>
                      </div>
                      <span className="badge">{statusText(row.status, "new")}</span>
                    </div>

                    <div className="pDark" style={{ marginTop: 10, fontSize: 13 }}>
                      Call Status: <strong>{statusText(latestCall?.status, "not requested")}</strong>
                    </div>
                    <div className="pDark" style={{ marginTop: 4, fontSize: 13 }}>
                      Quote Status: <strong>{statusText(latestQuote?.status, "not started")}</strong>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/portal/ecommerce/${row.id}`} className="btn btnPrimary" style={{ padding: "8px 12px", fontSize: 13 }}>
                        Open E-Commerce Workspace →
                      </Link>
                      <Link
                        href={`/ecommerce/book?ecomIntakeId=${encodeURIComponent(row.id)}`}
                        className="btn btnGhost"
                        style={{ padding: "8px 12px", fontSize: 13 }}
                      >
                        Book / Update Call
                      </Link>
                      <Link href="/ecommerce/pricing" className="btn btnGhost" style={{ padding: "8px 12px", fontSize: 13 }}>
                        Review Pricing
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
