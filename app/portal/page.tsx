import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import { ensureCustomerPortalForQuoteId } from "@/lib/customerPortal";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("portal.landing");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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

function fmtDate(v: string | null | undefined, locale: string) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function money(v: number | null | undefined, locale: string) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function prettyFallback(v: string | null | undefined) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

type PhaseKey = "kickoffReady" | "inProgress" | "preStart" | "intake";

function quotePhaseKey(q: QuoteRow): PhaseKey {
  const s = String(q.status || "").toLowerCase();
  const dep = String(q.deposit_status || "").toLowerCase();
  if (dep === "paid" || s === "paid") return "kickoffReady";
  if (["active", "closed_won", "deposit_paid"].includes(s)) return "inProgress";
  if (["proposal", "deposit"].includes(s)) return "preStart";
  return "intake";
}

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  await claimCustomerRecordsForUser({ userId: user.id, email: user.email });
  const admin = await isAdminUser({ userId: user.id, email: user.email });

  const t = await getTranslations("portal.landing");
  const tCommon = await getTranslations("portal.common");
  const tLanes = await getTranslations("portal.landing.lanes");
  const tPhases = await getTranslations("portal.landing.phases");
  const tStatuses = await getTranslations("portal.landing.statuses");
  // Resolve the active locale via getTranslations' message namespace; fmtDate
  // and Intl.NumberFormat both need a BCP-47 tag, and the request locale lives
  // in next-intl's request scope.
  const { getLocale } = await import("next-intl/server");
  const locale = await getLocale();

  const labelForStatus = (raw: string | null | undefined) => {
    const key = String(raw || "").toLowerCase().trim();
    if (!key) return "—";
    return tStatuses.has(key) ? tStatuses(key) : prettyFallback(raw);
  };

  const estimateLabel = (q: QuoteRow) => {
    if (q.estimate_total != null) return money(q.estimate_total, locale);
    if (q.estimate_low != null || q.estimate_high != null) {
      return `${money(q.estimate_low, locale)} – ${money(q.estimate_high, locale)}`;
    }
    return tCommon("scopedAfterReview");
  };

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

  // Auto-create workspaces for active/won/paid quotes that don't have one yet.
  const activeStatuses = new Set(["active", "closed_won", "deposit_paid", "paid"]);
  const quotesNeedingWorkspace = quoteRows.filter(
    (q) =>
      (activeStatuses.has(String(q.status || "").toLowerCase()) ||
        String(q.deposit_status || "").toLowerCase() === "paid") &&
      !portalTokenByQuoteId.has(q.id)
  );
  if (quotesNeedingWorkspace.length > 0) {
    const created = await Promise.allSettled(
      quotesNeedingWorkspace.map((q) => ensureCustomerPortalForQuoteId(q.id))
    );
    created.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value?.access_token) {
        portalTokenByQuoteId.set(quotesNeedingWorkspace[i].id, result.value.access_token);
      } else if (result.status === "rejected") {
        console.error("[portal] workspace auto-create failed for quote", quotesNeedingWorkspace[i].id, result.reason);
      }
    });
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
          {t("kicker")}
        </div>

        <h1 className="portalStoryHeadline">
          {websiteSummary
            ? t.rich("welcomeBackName", {
                name: websiteSummary,
                em: (chunks) => <em>{chunks}</em>,
              })
            : t("welcomeBack")}
        </h1>

        <p className="portalStoryBody">
          {totalProjects === 0
            ? t("emptyBody")
            : t("summaryBody", { count: totalProjects })}
        </p>

        <div className="portalStoryActions">
          <Link href="/build/intro" className="portalStoryCta">
            {t("ctaNewWebsite")} <span className="portalStoryCtaArrow">-&gt;</span>
          </Link>
          <Link href="/ops-intake" className="btn btnGhost productBtnSm">
            {t("ctaNewOps")}
          </Link>
          <Link href="/ecommerce/intake" className="btn btnGhost productBtnSm">
            {t("ctaNewEcom")}
          </Link>
          {admin ? (
            <Link href="/internal/admin" className="btn btnGhost productBtnSm">
              {t("ctaAdmin")}
            </Link>
          ) : null}
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">
            {t("signedInAs", { email: user.email ?? "" })}
          </span>
        </div>
      </div>

      <div className="portalHubSummary fadeUp">
        <LaneSummaryCard
          lane="website"
          title={tLanes("website.title")}
          description={tLanes("website.description")}
          countLabel={t("summaryCount", { count: quoteRows.length })}
          count={quoteRows.length}
          href={quoteRows.length > 0 ? "#website-projects" : "/build/intro"}
          cta={
            quoteRows.length > 0
              ? tLanes("website.viewCta")
              : tLanes("website.emptyCta")
          }
          primary
        />

        <div className="portalHubSummarySecondary">
          <LaneSummaryCard
            lane="ops"
            title={tLanes("ops.title")}
            description={tLanes("ops.description")}
            countLabel={t("summaryCount", { count: opsRows.length })}
            count={opsRows.length}
            href={opsRows.length > 0 ? "#ops-projects" : "/ops-intake"}
            cta={
              opsRows.length > 0
                ? tLanes("ops.viewCta")
                : tLanes("ops.emptyCta")
            }
          />
          <LaneSummaryCard
            lane="ecom"
            title={tLanes("ecom.title")}
            description={tLanes("ecom.description")}
            countLabel={t("summaryCount", { count: ecomRows.length })}
            count={ecomRows.length}
            href={ecomRows.length > 0 ? "#ecom-projects" : "/ecommerce/intake"}
            cta={
              ecomRows.length > 0
                ? tLanes("ecom.viewCta")
                : tLanes("ecom.emptyCta")
            }
          />
        </div>
      </div>

      {quoteRows.length > 0 ? (
        <section id="website-projects" className="productSection">
          <div
            className={`portalSectionLabel productSectionLabel portalHubSectionWebsite`}
          >
            <span className="productSectionDot" />
            {tLanes("website.label")}
          </div>

          <div className="productList">
            {quoteRows.map((q) => {
              const lead = q.lead_id ? leadById.get(q.lead_id) : null;
              return (
                <ProjectListCard
                  key={q.id}
                  title={lead?.name || tCommon("websiteFallbackTitle")}
                  status={<StatusPill label={labelForStatus(q.status)} />}
                  meta={[
                    fmtDate(q.created_at, locale),
                    q.tier_recommended || tCommon("websiteScopeFallback"),
                    estimateLabel(q),
                    tPhases(quotePhaseKey(q)),
                  ]}
                  action={(() => {
                    const portalToken = portalTokenByQuoteId.get(q.id);
                    if (portalToken) {
                      return (
                        <Link
                          href={`/portal/${portalToken}`}
                          className="btn btnPrimary productBtnSm"
                        >
                          {tCommon("openWorkspace")} -&gt;
                        </Link>
                      );
                    }
                    if (q.public_token) {
                      return (
                        <Link
                          href={`/book?quoteId=${q.id}&token=${q.public_token}`}
                          className="btn btnGhost productBtnSm"
                        >
                          {tCommon("viewEstimate")} -&gt;
                        </Link>
                      );
                    }
                    return (
                      <Link href="/contact" className="btn btnGhost productBtnSm">
                        {tCommon("getInTouch")} -&gt;
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
            className={`portalSectionLabel productSectionLabel portalHubSectionOps`}
          >
            <span className="productSectionDot" />
            {tLanes("ops.label")}
          </div>

          <div className="productList">
            {opsRows.map((o) => {
              const call = callByOps.get(o.id);
              const pie = pieByOps.get(o.id);
              const callStatusLabel = call?.status
                ? labelForStatus(call.status)
                : tCommon("callNotRequested");
              return (
                <ProjectListCard
                  key={o.id}
                  title={o.company_name || tCommon("opsFallbackTitle")}
                  status={<StatusPill label={labelForStatus(o.status)} />}
                  meta={[
                    fmtDate(o.created_at, locale),
                    o.industry || tCommon("opsScopeFallback"),
                    o.recommendation_tier || tCommon("tierPending"),
                    t("callStatusLabel", { status: callStatusLabel }),
                  ]}
                  summary={
                    pie?.summary
                      ? pie.summary.length > 120
                        ? `${pie.summary.slice(0, 120)}…`
                        : pie.summary
                      : undefined
                  }
                  action={
                    <Link href={`/portal/ops/${o.id}`} className="btn btnPrimary productBtnSm">
                      {tCommon("openWorkspace")} -&gt;
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
            className={`portalSectionLabel productSectionLabel portalHubSectionEcom`}
          >
            <span className="productSectionDot" />
            {tLanes("ecom.label")}
          </div>

          <div className="productList">
            {ecomRows.map((e) => (
              <ProjectListCard
                key={e.id}
                title={e.business_name || tCommon("ecomFallbackTitle")}
                status={<StatusPill label={labelForStatus(e.status)} />}
                meta={[fmtDate(e.created_at, locale), e.store_url || tCommon("noStoreUrl")]}
                action={
                  <Link href={`/portal/ecommerce/${e.id}`} className="btn btnPrimary productBtnSm">
                    {tCommon("openWorkspace")} -&gt;
                  </Link>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {totalProjects === 0 ? (
        <div className="productEmpty">
          <div className="productEmptyTitle">{t("empty.title")}</div>
          <div className="productEmptyBody">{t("empty.body")}</div>
        </div>
      ) : null}

      <div className="portalFooter">
        {tCommon("poweredBy")} <a href="/">Crecy Studio</a>
      </div>
    </div>
  );
}

function LaneSummaryCard({
  lane,
  title,
  description,
  count,
  countLabel,
  href,
  cta,
  primary = false,
}: {
  lane: "website" | "ops" | "ecom";
  title: string;
  description: string;
  count: number;
  countLabel: string;
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
        <span className="portalHubMeta">{countLabel}</span>
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
          {meta.map((v, i) => (
            <span key={`${v}-${i}`}>{v}</span>
          ))}
        </div>
        {summary ? <p className="productSummary">{summary}</p> : null}
      </div>
      <div>{action}</div>
    </article>
  );
}

function StatusPill({ label }: { label: string }) {
  return <span className="productChip portalHubStatus">{label}</span>;
}
