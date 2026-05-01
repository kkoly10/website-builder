import Link from "next/link";
import type { ReactNode } from "react";
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
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function money(v?: number | null) {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function pretty(v?: string | null) {
  if (!v) return "-";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function estimateLabel(q: QuoteRow) {
  if (q.estimate_total != null) return money(q.estimate_total);
  if (q.estimate_low != null || q.estimate_high != null) {
    return `${money(q.estimate_low)} - ${money(q.estimate_high)}`;
  }
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

const LANE_META = {
  website: {
    title: "Websites",
    label: "Website projects",
    description: "Lead with the public-facing projects that need your review and approvals.",
    emptyHref: "/build/intro",
    emptyCta: "Start a quote",
    sectionClass: "portalHubSectionWebsite",
  },
  ops: {
    title: "Systems",
    label: "Workflow automation projects",
    description: "Internal systems and automation work running in your workspace.",
    emptyHref: "/ops-intake",
    emptyCta: "Start an audit",
    sectionClass: "portalHubSectionOps",
  },
  ecom: {
    title: "E-commerce",
    label: "E-commerce projects",
    description: "Storefront, checkout, and operations work for online selling.",
    emptyHref: "/ecommerce/intake",
    emptyCta: "Start an intake",
    sectionClass: "portalHubSectionEcom",
  },
} as const;

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const [{ data: quotes }, { data: opsIntakes }, { data: ecomIntakes }] =
    await Promise.all([
      supabaseAdmin
        .from("quotes")
        .select(
          "id, lead_id, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, public_token, deposit_status"
        )
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("ops_intakes")
        .select(
          "id, created_at, company_name, contact_name, email, industry, status, recommendation_tier, recommendation_price_range"
        )
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("ecom_intakes")
        .select("id, created_at, business_name, contact_name, email, status, store_url")
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const opsRows = (opsIntakes ?? []) as OpsIntakeRow[];
  const ecomRows = (ecomIntakes ?? []) as EcomIntakeRow[];

  const leadIds = Array.from(
    new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[])
  );
  const quoteIds = quoteRows.map((q) => q.id);
  const opsIds = opsRows.map((r) => r.id);

  const [leadRes, opsCallRes, opsPieRes, portalProjectsRes] = await Promise.all([
    leadIds.length
      ? supabaseAdmin.from("leads").select("id, email, name").in("id", leadIds)
      : Promise.resolve({ data: [] as LeadRow[] }),
    opsIds.length
      ? supabaseAdmin
          .from("ops_call_requests")
          .select("id, ops_intake_id, status")
          .in("ops_intake_id", opsIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsCallRow[] }),
    opsIds.length
      ? supabaseAdmin
          .from("ops_pie_reports")
          .select("id, ops_intake_id, summary")
          .in("ops_intake_id", opsIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsPieRow[] }),
    quoteIds.length
      ? supabaseAdmin
          .from("customer_portal_projects")
          .select("quote_id, access_token")
          .in("quote_id", quoteIds)
      : Promise.resolve({ data: [] as { quote_id: string; access_token: string }[] }),
  ]);

  const leadById = new Map<string, LeadRow>();
  for (const l of (leadRes.data ?? []) as LeadRow[]) leadById.set(l.id, l);

  const callByOps = new Map<string, OpsCallRow>();
  for (const c of (opsCallRes.data ?? []) as OpsCallRow[]) {
    if (!callByOps.has(c.ops_intake_id)) callByOps.set(c.ops_intake_id, c);
  }

  const pieByOps = new Map<string, OpsPieRow>();
  for (const p of (opsPieRes.data ?? []) as OpsPieRow[]) {
    if (!pieByOps.has(p.ops_intake_id)) pieByOps.set(p.ops_intake_id, p);
  }

  const portalTokenByQuoteId = new Map<string, string>();
  for (const pp of (portalProjectsRes.data ?? []) as { quote_id: string; access_token: string }[]) {
    if (pp.quote_id && pp.access_token) portalTokenByQuoteId.set(pp.quote_id, pp.access_token);
  }

  const totalProjects = quoteRows.length + opsRows.length + ecomRows.length;
  const websiteSummary = quoteRows[0]?.lead_id
    ? leadById.get(quoteRows[0].lead_id)?.name
    : null;

  return (
    <div className="container productWrap portalHub">
      <ScrollReveal />

      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          Client portal
        </div>

        <h1 className="portalStoryHeadline">
          Welcome back{websiteSummary ? <>, <em>{websiteSummary}</em></> : null}
        </h1>

        <p className="portalStoryBody">
          {totalProjects === 0
            ? "You do not have any active projects yet. Start a website quote, workflow audit, or e-commerce intake to get going."
            : `You have ${totalProjects} active project${totalProjects !== 1 ? "s" : ""}. Website work leads this page, with systems and e-commerce grouped underneath.`}
        </p>

        <div className="portalStoryActions">
          <Link href="/build/intro" className="portalStoryCta">
            New website quote <span className="portalStoryCtaArrow">-&gt;</span>
          </Link>
          <Link href="/ops-intake" className="btn btnGhost productBtnSm">
            New workflow audit
          </Link>
          <Link href="/ecommerce/intake" className="btn btnGhost productBtnSm">
            New e-commerce intake
          </Link>
          {admin ? (
            <Link href="/internal/admin" className="btn btnGhost productBtnSm">
              Admin HQ
            </Link>
          ) : null}
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">Signed in as {user.email}</span>
        </div>
      </div>

      <div className="portalHubSummary fadeUp">
        <LaneSummaryCard
          lane="website"
          title={LANE_META.website.title}
          description={LANE_META.website.description}
          count={quoteRows.length}
          href={quoteRows.length > 0 ? "#website-projects" : LANE_META.website.emptyHref}
          cta={quoteRows.length > 0 ? "View website projects" : LANE_META.website.emptyCta}
          primary
        />

        <div className="portalHubSummarySecondary">
          <LaneSummaryCard
            lane="ops"
            title={LANE_META.ops.title}
            description={LANE_META.ops.description}
            count={opsRows.length}
            href={opsRows.length > 0 ? "#ops-projects" : LANE_META.ops.emptyHref}
            cta={opsRows.length > 0 ? "View systems" : LANE_META.ops.emptyCta}
          />
          <LaneSummaryCard
            lane="ecom"
            title={LANE_META.ecom.title}
            description={LANE_META.ecom.description}
            count={ecomRows.length}
            href={ecomRows.length > 0 ? "#ecom-projects" : LANE_META.ecom.emptyHref}
            cta={ecomRows.length > 0 ? "View e-commerce" : LANE_META.ecom.emptyCta}
          />
        </div>
      </div>

      {quoteRows.length > 0 ? (
        <section id="website-projects" className="productSection">
          <div
            className={`portalSectionLabel productSectionLabel ${LANE_META.website.sectionClass}`}
          >
            <span className="productSectionDot" />
            {LANE_META.website.label}
          </div>

          <div className="productList">
            {quoteRows.map((q) => {
              const lead = q.lead_id ? leadById.get(q.lead_id) : null;
              return (
                <ProjectListCard
                  key={q.id}
                  title={lead?.name || "Website project"}
                  status={<StatusPill status={q.status} />}
                  meta={[
                    fmtDate(q.created_at),
                    q.tier_recommended || "Website scope",
                    estimateLabel(q),
                    quotePhase(q),
                  ]}
                  action={(() => {
                    const portalToken = portalTokenByQuoteId.get(q.id);
                    return portalToken ? (
                      <Link
                        href={`/portal/${portalToken}`}
                        className="btn btnPrimary productBtnSm"
                      >
                        Open workspace -&gt;
                      </Link>
                    ) : (
                      <Link href="/build/intro" className="btn btnGhost productBtnSm">
                        Continue -&gt;
                      </Link>
                    );
                  })()}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {opsRows.length > 0 ? (
        <section id="ops-projects" className="productSection">
          <div
            className={`portalSectionLabel productSectionLabel ${LANE_META.ops.sectionClass}`}
          >
            <span className="productSectionDot" />
            {LANE_META.ops.label}
          </div>

          <div className="productList">
            {opsRows.map((o) => {
              const call = callByOps.get(o.id);
              const pie = pieByOps.get(o.id);
              return (
                <ProjectListCard
                  key={o.id}
                  title={o.company_name || "Workflow request"}
                  status={<StatusPill status={o.status} />}
                  meta={[
                    fmtDate(o.created_at),
                    o.industry || "Workflow systems",
                    o.recommendation_tier || "Pending",
                    `Call: ${pretty(call?.status) || "Not requested"}`,
                  ]}
                  summary={
                    pie?.summary
                      ? pie.summary.length > 120
                        ? `${pie.summary.slice(0, 120)}...`
                        : pie.summary
                      : undefined
                  }
                  action={
                    <Link href={`/portal/ops/${o.id}`} className="btn btnPrimary productBtnSm">
                      Open workspace -&gt;
                    </Link>
                  }
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {ecomRows.length > 0 ? (
        <section id="ecom-projects" className="productSection">
          <div
            className={`portalSectionLabel productSectionLabel ${LANE_META.ecom.sectionClass}`}
          >
            <span className="productSectionDot" />
            {LANE_META.ecom.label}
          </div>

          <div className="productList">
            {ecomRows.map((e) => (
              <ProjectListCard
                key={e.id}
                title={e.business_name || "E-commerce request"}
                status={<StatusPill status={e.status} />}
                meta={[fmtDate(e.created_at), e.store_url || "No store URL"]}
                action={
                  <Link href={`/portal/ecommerce/${e.id}`} className="btn btnPrimary productBtnSm">
                    Open workspace -&gt;
                  </Link>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {totalProjects === 0 ? (
        <div className="productEmpty">
          <div className="productEmptyTitle">No projects yet</div>
          <div className="productEmptyBody">
            Start a website quote, workflow audit, or e-commerce intake. Your
            projects will appear here with their own workspaces.
          </div>
        </div>
      ) : null}

      <div className="portalFooter">
        Powered by <a href="/">Crecy Studio</a>
      </div>
    </div>
  );
}

function LaneSummaryCard({
  lane,
  title,
  description,
  count,
  href,
  cta,
  primary = false,
}: {
  lane: "website" | "ops" | "ecom";
  title: string;
  description: string;
  count: number;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`productCard portalHubCard ${
        primary ? "portalHubCardPrimary" : "portalHubCardSecondary"
      } portalHubCard${lane.charAt(0).toUpperCase()}${lane.slice(1)}`}
    >
      <div className="portalHubCardHead">
        <span className="portalHubEyebrow">{title}</span>
        <span className="portalHubMeta">
          {count} project{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="portalHubCount">{count}</div>
      <p className="portalHubBody">{description}</p>
      <div className="portalHubCta">{cta} -&gt;</div>
    </Link>
  );
}

function ProjectListCard({
  title,
  status,
  meta,
  summary,
  action,
}: {
  title: string;
  status: ReactNode;
  meta: string[];
  summary?: string;
  action: ReactNode;
}) {
  return (
    <article className="productCard productProjectCard portalHubProjectCard">
      <div>
        <div className="productTitleRow">
          <h3 className="productTitle">{title}</h3>
          {status}
        </div>
        <div className="productMetaRow">
          {meta.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
        {summary ? <p className="productSummary">{summary}</p> : null}
      </div>
      <div>{action}</div>
    </article>
  );
}

function StatusPill({ status }: { status: string | null }) {
  return <span className="productChip portalHubStatus">{pretty(status)}</span>;
}
