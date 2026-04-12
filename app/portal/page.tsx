import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import ScrollReveal from "@/components/site/ScrollReveal";

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
  deposit_status?: string | null;
};

type LeadRow = { id: string; email: string | null; name: string | null };

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
};

type EcomIntakeRow = {
  id: string;
  created_at: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  status: string | null;
  store_url: string | null;
};

type OpsCallRow = { id: string; ops_intake_id: string; status: string | null };
type OpsPieRow = { id: string; ops_intake_id: string; summary: string | null };

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function money(v?: number | null) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v));
}

function pretty(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function estimateLabel(q: QuoteRow) {
  if (q.estimate_total != null) return money(q.estimate_total);
  if (q.estimate_low != null || q.estimate_high != null) return `${money(q.estimate_low)} – ${money(q.estimate_high)}`;
  return "Scoped after review";
}

function quotePhase(q: QuoteRow) {
  const s = String(q.status || "").toLowerCase();
  const dep = String(q.deposit_status || "").toLowerCase();
  if (dep === "paid") return "Kickoff ready";
  if (["active", "closed_won"].includes(s)) return "In progress";
  if (["proposal", "deposit"].includes(s)) return "Pre-start";
  return "Intake";
}

const LANE_COLORS = {
  website: { accent: "#c9a84c", bg: "rgba(201,168,76,0.06)", border: "rgba(201,168,76,0.18)", dot: "#c9a84c" },
  ops: { accent: "#5DCAA5", bg: "rgba(46,160,67,0.06)", border: "rgba(46,160,67,0.18)", dot: "#5DCAA5" },
  ecom: { accent: "#8da4ff", bg: "rgba(141,164,255,0.06)", border: "rgba(141,164,255,0.18)", dot: "#8da4ff" },
};

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const [{ data: quotes }, { data: opsIntakes }, { data: ecomIntakes }] = await Promise.all([
    supabaseAdmin.from("quotes")
      .select("id, lead_id, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, public_token, deposit_status")
      .eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(25),
    supabaseAdmin.from("ops_intakes")
      .select("id, created_at, company_name, contact_name, email, industry, status, recommendation_tier, recommendation_price_range")
      .eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(25),
    supabaseAdmin.from("ecom_intakes")
      .select("id, created_at, business_name, contact_name, email, status, store_url")
      .eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(25),
  ]);

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const opsRows = (opsIntakes ?? []) as OpsIntakeRow[];
  const ecomRows = (ecomIntakes ?? []) as EcomIntakeRow[];

  const leadIds = Array.from(new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[]));
  const opsIds = opsRows.map((r) => r.id);

  const [leadRes, opsCallRes, opsPieRes] = await Promise.all([
    leadIds.length ? supabaseAdmin.from("leads").select("id, email, name").in("id", leadIds) : Promise.resolve({ data: [] as LeadRow[] }),
    opsIds.length ? supabaseAdmin.from("ops_call_requests").select("id, ops_intake_id, status").in("ops_intake_id", opsIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as OpsCallRow[] }),
    opsIds.length ? supabaseAdmin.from("ops_pie_reports").select("id, ops_intake_id, summary").in("ops_intake_id", opsIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as OpsPieRow[] }),
  ]);

  const leadById = new Map<string, LeadRow>();
  for (const l of (leadRes.data ?? []) as LeadRow[]) leadById.set(l.id, l);

  const callByOps = new Map<string, OpsCallRow>();
  for (const c of (opsCallRes.data ?? []) as OpsCallRow[]) { if (!callByOps.has(c.ops_intake_id)) callByOps.set(c.ops_intake_id, c); }

  const pieByOps = new Map<string, OpsPieRow>();
  for (const p of (opsPieRes.data ?? []) as OpsPieRow[]) { if (!pieByOps.has(p.ops_intake_id)) pieByOps.set(p.ops_intake_id, p); }

  const totalProjects = quoteRows.length + opsRows.length + ecomRows.length;
  const userName = quoteRows[0]?.lead_id ? leadById.get(quoteRows[0].lead_id)?.name : null;

  return (
    <div className="container productWrap">
      <ScrollReveal />

      {/* ── Hero ── */}
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          Client portal
        </div>

        <h1 className="portalStoryHeadline">
          Welcome back{userName ? <>, <em>{userName}</em></> : null}
        </h1>

        <p className="portalStoryBody">
          {totalProjects === 0
            ? "You don't have any projects yet. Start a website quote, workflow audit, or e-commerce intake to get going."
            : `You have ${totalProjects} active project${totalProjects !== 1 ? "s" : ""} across your service lanes. Open any workspace to check status, upload content, or leave feedback.`}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/build/intro" className="portalStoryCta">
            New website quote <span className="portalStoryCtaArrow">→</span>
          </Link>
          <Link href="/ops-intake" className="btn btnGhost" style={{ fontSize: 13 }}>
            New workflow audit
          </Link>
          <Link href="/ecommerce/intake" className="btn btnGhost" style={{ fontSize: 13 }}>
            New e-commerce intake
          </Link>
          {admin && (
            <Link href="/internal/admin" className="btn btnGhost" style={{ fontSize: 13 }}>
              Admin HQ
            </Link>
          )}
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">Signed in as {user.email}</span>
        </div>
      </div>

      {/* ── Lane Summary Cards ── */}
      <div className="productGrid3">
        <LaneSummaryCard
          lane="website"
          title="Websites"
          count={quoteRows.length}
          href={quoteRows.length > 0 ? "#website-projects" : "/build/intro"}
          cta={quoteRows.length > 0 ? "View projects" : "Start a quote"}
        />
        <LaneSummaryCard
          lane="ops"
          title="Automation"
          count={opsRows.length}
          href={opsRows.length > 0 ? "#ops-projects" : "/ops-intake"}
          cta={opsRows.length > 0 ? "View projects" : "Start an audit"}
        />
        <LaneSummaryCard
          lane="ecom"
          title="E-commerce"
          count={ecomRows.length}
          href={ecomRows.length > 0 ? "#ecom-projects" : "/ecommerce/intake"}
          cta={ecomRows.length > 0 ? "View projects" : "Start an intake"}
        />
      </div>

      {/* ── Website Projects ── */}
      {quoteRows.length > 0 && (
        <section id="website-projects" className="productSection">
          <div className="portalSectionLabel productSectionLabel">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: LANE_COLORS.website.dot }} />
            Website projects
          </div>

          <div className="productList">
            {quoteRows.map((q) => {
              const lead = q.lead_id ? leadById.get(q.lead_id) : null;
              const lc = LANE_COLORS.website;
              return (
                <div key={q.id} style={{
                  background: "var(--paper)", border: `1px solid ${lc.border}`,
                  borderRadius: 16, padding: "18px 22px",
                  display: "grid", gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 16, alignItems: "center",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 18, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em",
                      }}>
                        {lead?.name || "Website Project"}
                      </span>
                      <StatusPill status={q.status} lane="website" />
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12, color: "var(--muted-2)" }}>
                      <span>{fmtDate(q.created_at)}</span>
                      <span>{q.tier_recommended || "Website scope"}</span>
                      <span>{estimateLabel(q)}</span>
                      <span>{quotePhase(q)}</span>
                    </div>
                  </div>
                  <div>
                    {q.public_token ? (
                      <Link href={`/portal/${q.public_token}`} className="btn btnPrimary productBtnSm">
                        Open workspace →
                      </Link>
                    ) : (
                      <Link href="/build/intro" className="btn btnGhost productBtnSm">
                        Continue →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Ops Projects ── */}
      {opsRows.length > 0 && (
        <section id="ops-projects" className="productSection">
          <div className="portalSectionLabel productSectionLabel">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: LANE_COLORS.ops.dot }} />
            Workflow automation projects
          </div>

          <div className="productList">
            {opsRows.map((o) => {
              const call = callByOps.get(o.id);
              const pie = pieByOps.get(o.id);
              const lc = LANE_COLORS.ops;
              return (
                <div key={o.id} style={{
                  background: "var(--paper)", border: `1px solid ${lc.border}`,
                  borderRadius: 16, padding: "18px 22px",
                  display: "grid", gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 16, alignItems: "center",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 18, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em",
                      }}>
                        {o.company_name || "Workflow Request"}
                      </span>
                      <StatusPill status={o.status} lane="ops" />
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12, color: "var(--muted-2)" }}>
                      <span>{fmtDate(o.created_at)}</span>
                      <span>{o.industry || "Workflow systems"}</span>
                      <span>{o.recommendation_tier || "Pending"}</span>
                      <span>Call: {pretty(call?.status) || "Not requested"}</span>
                    </div>
                    {pie?.summary && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.5, maxWidth: 500 }}>
                        {pie.summary.length > 120 ? pie.summary.slice(0, 120) + "…" : pie.summary}
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/portal/ops/${o.id}`} className="btn btnPrimary productBtnSm">
                      Open workspace →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── E-Commerce Projects ── */}
      {ecomRows.length > 0 && (
        <section id="ecom-projects" className="productSection">
          <div className="portalSectionLabel productSectionLabel">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: LANE_COLORS.ecom.dot }} />
            E-commerce projects
          </div>

          <div className="productList">
            {ecomRows.map((e) => {
              const lc = LANE_COLORS.ecom;
              return (
                <div key={e.id} style={{
                  background: "var(--paper)", border: `1px solid ${lc.border}`,
                  borderRadius: 16, padding: "18px 22px",
                  display: "grid", gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 16, alignItems: "center",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 18, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em",
                      }}>
                        {e.business_name || "E-Commerce Request"}
                      </span>
                      <StatusPill status={e.status} lane="ecom" />
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12, color: "var(--muted-2)" }}>
                      <span>{fmtDate(e.created_at)}</span>
                      <span>{e.store_url || "No store URL"}</span>
                    </div>
                  </div>
                  <div>
                    <Link href={`/portal/ecommerce/${e.id}`} className="btn btnPrimary productBtnSm">
                      Open workspace →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {totalProjects === 0 && (
        <div className="productEmpty">
          <div className="productEmptyTitle">No projects yet</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
            Start a website quote, workflow audit, or e-commerce intake. Your projects will appear here with their own workspaces.
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="portalFooter">
        Powered by <a href="/">Crecy Studio</a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function LaneSummaryCard({ lane, title, count, href, cta }: {
  lane: "website" | "ops" | "ecom"; title: string; count: number; href: string; cta: string;
}) {
  const lc = LANE_COLORS[lane];
  return (
    <Link href={href} className="productCard" style={{
      display: "block", textDecoration: "none",
      background: lc.bg, borderColor: lc.border, padding: "20px 22px",
      transition: "transform 0.2s, border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: lc.dot }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: lc.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </span>
      </div>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em",
      }}>
        {count}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4 }}>
        project{count !== 1 ? "s" : ""}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: lc.accent }}>
        {cta} →
      </div>
    </Link>
  );
}

function StatusPill({ status, lane }: { status: string | null; lane: "website" | "ops" | "ecom" }) {
  const lc = LANE_COLORS[lane];
  return (
    <span className="productChip" style={{ background: lc.bg, border: `1px solid ${lc.border}`, color: lc.accent }}>
      {pretty(status)}
    </span>
  );
}
