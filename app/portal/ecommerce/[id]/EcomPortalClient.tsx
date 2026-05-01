"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { EcommerceWorkspaceBundle } from "@/lib/ecommerce/workspace";

function fmtDate(v: string | null | undefined, locale: string) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function money(v: number | null | undefined, locale: string) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function prettyFallback(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

type StoryKey =
  | "buildLaunch"
  | "buildBuild"
  | "buildProposal"
  | "buildDefault"
  | "fixTesting"
  | "fixWork"
  | "fixDefault"
  | "active"
  | "onboarding"
  | "default";

function getStoryKey(mode: string, phase: string): StoryKey {
  const m = String(mode).toLowerCase();
  const p = String(phase).toLowerCase();

  if (m === "build") {
    if (p.includes("launch")) return "buildLaunch";
    if (p.includes("build")) return "buildBuild";
    if (p.includes("proposal")) return "buildProposal";
    return "buildDefault";
  }

  if (m === "fix") {
    if (p.includes("testing") || p.includes("qa")) return "fixTesting";
    if (p.includes("build") || p.includes("fix") || p.includes("work")) return "fixWork";
    return "fixDefault";
  }

  if (p.includes("active") || p.includes("operations") || p.includes("report")) {
    return "active";
  }

  if (p.includes("onboarding")) {
    return "onboarding";
  }

  return "default";
}

function statusTone(value: string) {
  const v = String(value || "").toLowerCase();
  if (["done", "approved", "accepted", "live", "completed", "paid"].includes(v)) {
    return { color: "var(--success)", bg: "var(--success-bg)", border: "var(--success)" };
  }
  if (["building", "in_progress", "review", "sent", "scheduled", "testing", "planned"].includes(v)) {
    return { color: "var(--accent)", bg: "var(--accent-bg)", border: "var(--accent)" };
  }
  return { color: "var(--muted)", bg: "var(--paper-2)", border: "var(--rule)" };
}

function Drawer({ label, value, children, defaultOpen = false }: { label: string; value: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button className="portalDrawerToggle" onClick={() => setOpen(!open)}>
        <span className="portalDrawerToggleLabel">{label}</span>
        <span className="portalDrawerToggleValue">{value}<span className={`portalDrawerArrow ${open ? "portalDrawerArrowOpen" : ""}`}>▾</span></span>
      </button>
      <div className={`portalDrawerContent ${open ? "portalDrawerContentOpen" : ""}`}>{children}</div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="portalDrawerRow">
      <span className="portalDrawerKey">{label}</span>
      <span className="portalDrawerVal">{value}</span>
    </div>
  );
}

function ItemList({ items, lookupStatus }: {
  items: Array<{ id: string; title: string; status: string; notes: string }>;
  lookupStatus: (raw: string) => string;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => {
        const tone = statusTone(item.status);
        return (
          <div key={item.id} style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ color: "var(--fg)", fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <span style={{ padding: "4px 8px", borderRadius: 999, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{lookupStatus(item.status)}</span>
            </div>
            {item.notes ? <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13, lineHeight: 1.55 }}>{item.notes}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function EcomPortalClient({ data }: { data: EcommerceWorkspaceBundle }) {
  const locale = useLocale();
  const t = useTranslations("portalEcomToken");
  const tModes = useTranslations("portalEcomToken.modes");
  const tStories = useTranslations("portalEcomToken.stories");
  const tActions = useTranslations("portalEcomToken.actions");
  const tMeta = useTranslations("portalEcomToken.meta");
  const tWorkspace = useTranslations("portalEcomToken.workspaceOverview");
  const tProposal = useTranslations("portalEcomToken.proposalPricing");
  const tMetrics = useTranslations("portalEcomToken.metrics");
  const tMonthly = useTranslations("portalEcomToken.monthlyPlan");
  const tNext = useTranslations("portalEcomToken.nextActions");
  const tAgreement = useTranslations("portalEcomToken.drawers.agreement");
  const tDetails = useTranslations("portalEcomToken.drawers.projectDetails");
  const tFooter = useTranslations("portalEcomToken.footer");
  const tErrors = useTranslations("portalEcomToken.errors");
  const tStatuses = useTranslations("portalEcomToken.statuses");

  const lookupStatus = useCallback(
    (raw: string | null | undefined) => {
      const key = String(raw || "").toLowerCase().trim();
      if (!key) return "—";
      return tStatuses.has(key) ? tStatuses(key) : prettyFallback(raw);
    },
    [tStatuses]
  );

  const lookupMode = (raw: string | null | undefined) => {
    const key = String(raw || "").toLowerCase().trim();
    if (!key) return "—";
    return tModes.has(key) ? tModes(key) : prettyFallback(raw);
  };

  const [bundle, setBundle] = useState(data);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { intake, quote, call, workspace } = bundle;
  const storyKey = useMemo(() => getStoryKey(workspace.mode, workspace.phase), [workspace.mode, workspace.phase]);

  const callStatusLabel = call?.status
    ? lookupStatus(call.status)
    : tWorkspace("callNotRequested");
  const quoteStatusLabel = quote?.status
    ? lookupStatus(quote.status)
    : tWorkspace("quoteNotStarted");

  const refreshWorkspace = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/ecommerce/${intake.id}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("refreshFailed"));
      setBundle(json.data as EcommerceWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  }, [intake.id, tErrors]);

  const applyAction = useCallback(async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/ecommerce/${intake.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("actionFailed"));
      setBundle(json.data as EcommerceWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("actionFailed"));
    } finally {
      setSaving(false);
    }
  }, [intake.id, tErrors]);

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          {t("kicker", { mode: lookupMode(workspace.mode) })}
        </div>

        <h1 className="portalStoryHeadline">
          {t.rich("headline", {
            phase: tStories(`${storyKey}.headline`),
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>
        <p className="portalStoryBody">{tStories(`${storyKey}.body`)}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {workspace.previewUrl ? (
            <a href={workspace.previewUrl} target="_blank" rel="noreferrer" className="portalStoryCta">
              {tActions("openPreview")} <span className="portalStoryCtaArrow">→</span>
            </a>
          ) : null}
          {workspace.productionUrl ? (
            <a href={workspace.productionUrl} target="_blank" rel="noreferrer" className="btn btnGhost" style={{ fontSize: 13 }}>
              {tActions("visitLiveStore")}
            </a>
          ) : null}
          <button className="btn btnGhost" disabled={refreshing} onClick={refreshWorkspace} style={{ fontSize: 13 }}>
            {refreshing ? tActions("refreshing") : tActions("refresh")}
          </button>
          <Link href="/portal" className="btn btnGhost" style={{ fontSize: 13 }}>{tActions("backToPortal")}</Link>
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">{intake.business_name || tMeta("fallbackName")}</span>
          <span className="portalStoryMetaItem">{tMeta("started", { date: fmtDate(intake.created_at, locale) })}</span>
          <span className="portalStoryMetaItem">{tMeta("phase", { phase: prettyFallback(workspace.phase) })}</span>
          <span className="portalStoryMetaItem">{tMeta("waitingOn", { waitingOn: workspace.waitingOn })}</span>
        </div>
      </div>

      {error ? <div className="portalError">{error}</div> : null}

      {workspace.adminPublicNote ? (
        <div className="portalNote fadeUp">
          <div className="portalNoteIcon">C</div>
          <div>
            <div className="portalNoteLabel">{t("studioNote")}</div>
            <div className="portalNoteText">{workspace.adminPublicNote}</div>
          </div>
        </div>
      ) : null}

      <div className="portalGrid2 portalGrid2Wide">
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.1s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tWorkspace("panelTitle")}</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <Row label={tWorkspace("servicePath")} value={lookupMode(workspace.mode)} />
            <Row label={tWorkspace("currentPhase")} value={prettyFallback(workspace.phase)} />
            <Row label={tWorkspace("planningCall")} value={callStatusLabel} />
            <Row label={tWorkspace("quoteStatus")} value={quoteStatusLabel} />
            <Row label={tWorkspace("waitingOn")} value={workspace.waitingOn} />
          </div>
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{tWorkspace("serviceSummaryLabel")}</div>
            <div style={{ color: "var(--fg)", fontWeight: 700 }}>{workspace.serviceSummary}</div>
            {workspace.onboardingSummary ? <div style={{ marginTop: 6, color: "var(--muted)", lineHeight: 1.6, fontSize: 13 }}>{workspace.onboardingSummary}</div> : null}
          </div>
        </div>

        <div className="portalPanel fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tProposal("panelTitle")}</h2>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <MetricCard
                label={workspace.mode === "run" ? tProposal("setupFee") : tProposal("projectFee")}
                value={money(quote?.estimate_setup_fee, locale)}
              />
              <MetricCard label={tProposal("monthlyFee")} value={money(quote?.estimate_monthly_fee, locale)} />
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{tProposal("fulfillmentLabel")}</div>
              <div style={{ color: "var(--fg)", fontWeight: 700 }}>{quote?.estimate_fulfillment_model || tProposal("fulfillmentTbc")}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted2)" }}>{tProposal("lastUpdated", { date: fmtDate(quote?.updated_at || quote?.created_at, locale) })}</div>
          </div>
        </div>
      </div>

      {workspace.deliverables.length > 0 ? (
        <div className="portalPanel fadeUp" style={{ marginBottom: 24 }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{t("deliverables")}</h2>
            <span className="portalPanelCount">{workspace.deliverables.length}</span>
          </div>
          <ItemList items={workspace.deliverables} lookupStatus={lookupStatus} />
        </div>
      ) : null}

      <div className="portalGrid2">
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{t("milestones")}</h2>
            <span className="portalPanelCount">{workspace.milestones.length}</span>
          </div>
          <ItemList items={workspace.milestones} lookupStatus={lookupStatus} />
        </div>

        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{t("tasks")}</h2>
            <span className="portalPanelCount">{workspace.tasks.length}</span>
          </div>
          <ItemList items={workspace.tasks} lookupStatus={lookupStatus} />
        </div>
      </div>

      {(workspace.assetsNeeded.length > 0 || workspace.approvals.length > 0) ? (
        <div className="portalGrid2">
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("assetsNeeded")}</h2>
            </div>
            <ItemList items={workspace.assetsNeeded} lookupStatus={lookupStatus} />
          </div>
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("approvals")}</h2>
            </div>
            <ItemList items={workspace.approvals} lookupStatus={lookupStatus} />
          </div>
        </div>
      ) : null}

      {(workspace.metrics.length > 0 || workspace.issues.length > 0) ? (
        <div className="portalGrid2">
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{tMetrics("panelTitle")}</h2>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {workspace.metrics.map((metric) => (
                <div key={metric.id} style={{ border: "1px solid var(--stroke)", background: "var(--panel2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ color: "var(--fg)", fontWeight: 700 }}>{metric.label}</div>
                    <div style={{ color: "var(--accent)", fontWeight: 700 }}>{metric.value || tMetrics("fallback")}</div>
                  </div>
                  <div style={{ marginTop: 4, color: "var(--muted2)", fontSize: 12 }}>{tMetrics("target", { value: metric.target || tMetrics("fallback") })}</div>
                  {metric.notes ? <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{metric.notes}</div> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("issues")}</h2>
            </div>
            <ItemList items={[...workspace.issues, ...workspace.requests]} lookupStatus={lookupStatus} />
          </div>
        </div>
      ) : null}

      {(workspace.monthlyPlan.length > 0 || workspace.nextActions.length > 0) ? (
        <div className="portalGrid2">
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{tMonthly("panelTitle")}</h2></div>
            <SimpleList items={workspace.monthlyPlan} empty={tMonthly("empty")} />
          </div>
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{tNext("panelTitle")}</h2></div>
            <SimpleList items={workspace.nextActions} empty={tNext("empty")} />
          </div>
        </div>
      ) : null}

      <Drawer
        label={tAgreement("label")}
        value={lookupStatus(workspace.depositStatus || workspace.agreementStatus || "pending")}
      >
        <Row label={tAgreement("agreementStatus")} value={lookupStatus(workspace.agreementStatus || "pending")} />
        <Row label={tAgreement("accepted")} value={fmtDate(workspace.agreementAcceptedAt, locale)} />
        <Row label={tAgreement("depositStatus")} value={lookupStatus(workspace.depositStatus || "pending")} />
        <Row label={tAgreement("depositAmount")} value={money(workspace.depositAmount, locale)} />
        <Row label={tAgreement("paidAt")} value={fmtDate(workspace.depositPaidAt, locale)} />
        {workspace.agreementText ? (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--panel2)", whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--muted)", fontSize: 13 }}>{workspace.agreementText}</div>
        ) : null}
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {workspace.agreementStatus !== "accepted" ? (
            <button className="btn btnPrimary" disabled={saving} onClick={() => applyAction({ type: "agreement_accept" })}>
              {saving ? tActions("saving") : tActions("acceptAgreement")}
            </button>
          ) : null}
          {workspace.agreementStatus === "accepted" && !workspace.depositUrl && workspace.depositStatus !== "paid" ? (
            <button className="btn btnGhost" disabled={saving} onClick={() => applyAction({ type: "ensure_deposit_link" })}>
              {saving ? tActions("preparing") : tActions("prepareDeposit")}
            </button>
          ) : null}
          {workspace.depositUrl && workspace.depositStatus !== "paid" ? (
            <a className="btn btnPrimary" href={workspace.depositUrl} target="_blank" rel="noreferrer">
              {tActions("payDeposit")} <span className="btnArrow">→</span>
            </a>
          ) : null}
        </div>
      </Drawer>

      <Drawer label={tDetails("label")} value={lookupMode(workspace.mode)}>
        <Row label={tDetails("business")} value={intake.business_name || "—"} />
        <Row label={tDetails("contact")} value={intake.contact_name || "—"} />
        <Row label={tDetails("email")} value={intake.email || "—"} />
        <Row label={tDetails("storeUrl")} value={workspace.productionUrl || intake.store_url || "—"} />
        <Row label={tDetails("salesChannels")} value={(intake.sales_channels || []).join(", ") || "—"} />
        <Row label={tDetails("monthlyOrders")} value={intake.monthly_orders || "—"} />
        <Row label={tDetails("timeline")} value={intake.timeline || "—"} />
        <Row label={tDetails("budget")} value={intake.budget_range || "—"} />
      </Drawer>

      <div className="portalFooter">
        {tFooter("poweredBy")} <a href="/">Crecy Studio</a>{tFooter("tagline")}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ marginTop: 4, color: "var(--fg)", fontWeight: 800, fontSize: 24 }}>{value}</div>
    </div>
  );
}

function SimpleList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <div className="smallNote">{empty}</div>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => (
        <div key={item} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--panel2)", color: "var(--muted)", fontSize: 13, lineHeight: 1.55 }}>{item}</div>
      ))}
    </div>
  );
}
