"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { EnrichedOpsWorkspaceBundle } from "@/lib/opsWorkspace/state";

function prettyFallback(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDate(v: string | null | undefined, locale: string) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function money(v: number | null | undefined, locale: string) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v));
}

type OpsPhase =
  | "live"
  | "partially_live"
  | "building"
  | "process_mapping"
  | "discovery"
  | "intake";

function getOpsPhase(bundle: EnrichedOpsWorkspaceBundle): OpsPhase {
  const phase = String(bundle.workspace.phase || "").toLowerCase();
  const hasLive = bundle.workspace.liveAutomations.length > 0;
  const building = bundle.workspace.automationBacklog.filter((a) =>
    ["building", "testing", "scoped"].includes(String(a.status).toLowerCase())
  ).length;

  if (hasLive && building === 0) return "live";
  if (hasLive) return "partially_live";
  if (building > 0) return "building";
  if (phase.includes("process") || phase.includes("mapping")) return "process_mapping";
  if (phase.includes("discovery") || bundle.callRequest.exists) return "discovery";
  return "intake";
}

const AUTOMATION_STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  live: { color: "var(--success)", bg: "var(--success-bg)", border: "var(--success)" },
  completed: { color: "var(--success)", bg: "var(--success-bg)", border: "var(--success)" },
  testing: { color: "var(--accent)", bg: "var(--accent-bg)", border: "var(--accent)" },
  building: { color: "var(--accent)", bg: "var(--accent-bg)", border: "var(--accent)" },
  scoped: { color: "var(--muted)", bg: "var(--paper-2)", border: "var(--rule)" },
  discovery: { color: "var(--muted)", bg: "var(--paper-2)", border: "var(--rule)" },
};

function autoMeta(status: string) {
  const s = status.toLowerCase();
  for (const key of Object.keys(AUTOMATION_STATUS_META)) {
    if (s.includes(key)) return AUTOMATION_STATUS_META[key];
  }
  return { color: "var(--muted)", bg: "var(--paper-2)", border: "var(--rule)" };
}

function Drawer({ label, value, children, defaultOpen = false }: { label: string; value: string; children: React.ReactNode; defaultOpen?: boolean; }) {
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

function ProgressRing({ percent, size = 66 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = Math.PI * 2 * r;
  const offset = c - (c * percent) / 100;
  const color = percent >= 80 ? "var(--success)" : percent >= 40 ? "var(--accent)" : "var(--muted)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--stroke)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.8s ease" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size > 48 ? 15 : 11} fontWeight="600" fontFamily="DM Sans">{percent}%</text>
    </svg>
  );
}

export default function OpsPortalClient({ initialData }: { initialData: EnrichedOpsWorkspaceBundle }) {
  const locale = useLocale();
  const t = useTranslations("portalOpsToken");
  const tPhases = useTranslations("portalOpsToken.phases");
  const tStories = useTranslations("portalOpsToken.stories");
  const tActions = useTranslations("portalOpsToken.actions");
  const tMeta = useTranslations("portalOpsToken.meta");
  const tFound = useTranslations("portalOpsToken.whatWeFound");
  const tProgress = useTranslations("portalOpsToken.automationProgress");
  const tProcess = useTranslations("portalOpsToken.process");
  const tTracker = useTranslations("portalOpsToken.automationTracker");
  const tLive = useTranslations("portalOpsToken.liveAutomations");
  const tResults = useTranslations("portalOpsToken.results");
  const tQuestions = useTranslations("portalOpsToken.questions");
  const tApprovals = useTranslations("portalOpsToken.approvals");
  const tDrawers = useTranslations("portalOpsToken.drawers");
  const tConnected = useTranslations("portalOpsToken.drawers.connectedSystems");
  const tSops = useTranslations("portalOpsToken.drawers.sops");
  const tRisks = useTranslations("portalOpsToken.drawers.risks");
  const tIncidents = useTranslations("portalOpsToken.drawers.incidents");
  const tChangeRequests = useTranslations("portalOpsToken.drawers.changeRequests");
  const tAgreement = useTranslations("portalOpsToken.drawers.agreement");
  const tPricing = useTranslations("portalOpsToken.drawers.servicePricing");
  const tFooter = useTranslations("portalOpsToken.footer");
  const tErrors = useTranslations("portalOpsToken.errors");
  const tStatuses = useTranslations("portalOpsToken.statuses");

  const lookupStatus = useCallback(
    (raw: string | null | undefined) => {
      const key = String(raw || "").toLowerCase().trim();
      if (!key) return "—";
      return tStatuses.has(key) ? tStatuses(key) : prettyFallback(raw);
    },
    [tStatuses]
  );

  const [bundle, setBundle] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const phase = useMemo(() => getOpsPhase(bundle), [bundle]);

  const backlogStats = useMemo(() => {
    const all = bundle.workspace.automationBacklog;
    const live = all.filter((a) => String(a.status).toLowerCase() === "live").length;
    const building = all.filter((a) => ["building", "testing", "scoped"].includes(String(a.status).toLowerCase())).length;
    const percent = all.length > 0 ? Math.round((live / all.length) * 100) : 0;
    return { total: all.length, live, building, planned: all.length - live - building, percent };
  }, [bundle]);

  const refreshWorkspace = useCallback(async () => {
    setRefreshing(true); setError("");
    try {
      const res = await fetch(`/api/portal/ops/${bundle.intake.id}`);
      const json = await res.json();
      if (!res.ok || !json?.ok || !json?.data) throw new Error(json?.error || tErrors("refreshFailed"));
      setBundle(json.data as EnrichedOpsWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("refreshFailed"));
    } finally { setRefreshing(false); }
  }, [bundle.intake.id, tErrors]);

  const applyAction = useCallback(async (body: Record<string, unknown>) => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/portal/ops/${bundle.intake.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("actionFailed"));
      if (json.data) setBundle(json.data as EnrichedOpsWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("actionFailed"));
    } finally { setSaving(false); }
  }, [bundle.intake.id, tErrors]);

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          {t("kicker")}
        </div>

        <h1 className="portalStoryHeadline">
          {t.rich("headline", {
            phase: tPhases(phase),
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>

        <p className="portalStoryBody">{tStories(phase)}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btnGhost" disabled={refreshing} onClick={refreshWorkspace} style={{ fontSize: 13 }}>
            {refreshing ? tActions("refreshing") : tActions("refresh")}
          </button>
          <Link href="/portal" className="btn btnGhost" style={{ fontSize: 13 }}>{tActions("backToPortal")}</Link>
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">{bundle.intake.companyName}</span>
          <span className="portalStoryMetaItem">{tMeta("started", { date: fmtDate(bundle.intake.createdAt, locale) })}</span>
          <span className="portalStoryMetaItem">{bundle.intake.recommendationTier}</span>
          <span className="portalStoryMetaItem">{tMeta("toolLabel", { tool: bundle.ghostAdmin.bestTool })}</span>
        </div>
      </div>

      {error && <div className="portalError">{error}</div>}

      {bundle.workspace.adminPublicNote && (
        <div className="portalNote fadeUp">
          <div className="portalNoteIcon">C</div>
          <div>
            <div className="portalNoteLabel">{t("studioNote")}</div>
            <div className="portalNoteText">{bundle.workspace.adminPublicNote}</div>
          </div>
        </div>
      )}

      <div className="portalGrid2 portalGrid2Wide">
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.1s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tFound("panelTitle")}</h2>
          </div>

          <div style={{ padding: "4px 0", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{tFound("mainBottleneck")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", maxWidth: 320, textAlign: "right" }}>{bundle.ghostAdmin.mainBottleneck}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{tFound("businessObjective")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", maxWidth: 320, textAlign: "right" }}>{bundle.ghostAdmin.businessObjective}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{tFound("bestFirstFix")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", maxWidth: 320, textAlign: "right" }}>{bundle.ghostAdmin.bestFirstFix}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{tFound("bestTool")}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{bundle.ghostAdmin.bestTool}</span>
            </div>
          </div>

          {bundle.intake.painPoints.length > 0 && (
            <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{tFound("painPointsLabel")}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {bundle.intake.painPoints.map((p) => (
                  <span key={p} className="portalFeatureTag">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="portalPanel fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tProgress("panelTitle")}</h2>
          </div>

          <div className="portalLaunchSummary">
            <ProgressRing percent={backlogStats.percent} />
            <div className="portalLaunchInfo">
              <h4>
                {backlogStats.live === backlogStats.total && backlogStats.total > 0
                  ? tProgress("allLive")
                  : tProgress("remaining", { count: backlogStats.total - backlogStats.live })}
              </h4>
              <p>{tProgress("statusLine", { live: backlogStats.live, building: backlogStats.building, planned: backlogStats.planned })}</p>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: "var(--muted2)", lineHeight: 1.6 }}>
            {tProgress("waitingOnLabel")} <strong style={{ color: "var(--fg)" }}>{bundle.workspace.waitingOn}</strong>
          </div>

          {bundle.workspace.nextActions.length > 0 && (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{tProgress("nextSteps")}</div>
              {bundle.workspace.nextActions.slice(0, 3).map((a) => (
                <div key={a} style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, paddingLeft: 12, borderLeft: "2px solid var(--rule)", marginBottom: 6 }}>{a}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(bundle.workspace.currentProcess.length > 0 || bundle.workspace.futureProcess.length > 0) && (
        <div className="portalGrid2" style={{ marginTop: 0 }}>
          <div className="portalPanel fadeUp" style={{ animationDelay: "0.2s" }}>
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{tProcess("before")}</h2>
              <span className="portalPanelCount">{tProcess("stepsCount", { count: bundle.workspace.currentProcess.length })}</span>
            </div>
            <div style={{ display: "grid", gap: 0 }}>
              {bundle.workspace.currentProcess.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < bundle.workspace.currentProcess.length - 1 ? "1px solid var(--rule)" : "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="portalPanel fadeUp" style={{ animationDelay: "0.25s" }}>
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{tProcess("after")}</h2>
              <span className="portalPanelCount">{tProcess("stepsCount", { count: bundle.workspace.futureProcess.length })}</span>
            </div>
            <div style={{ display: "grid", gap: 0 }}>
              {bundle.workspace.futureProcess.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < bundle.workspace.futureProcess.length - 1 ? "1px solid var(--rule)" : "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--success)", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--success)", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {bundle.workspace.automationBacklog.length > 0 && (
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.3s", marginBottom: 40 }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tTracker("panelTitle")}</h2>
            <span className="portalPanelCount">{tTracker("count", { count: bundle.workspace.automationBacklog.length })}</span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {bundle.workspace.automationBacklog.map((auto) => {
              const meta = autoMeta(auto.status);
              return (
                <div key={auto.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: "14px 16px", border: `1px solid ${meta.border}`, borderRadius: 12, background: meta.bg }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>{auto.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>{auto.purpose}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--rule)", border: "1px solid var(--stroke)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{auto.priority}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--rule)", border: "1px solid var(--stroke)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{auto.toolRecommendation}</span>
                    </div>
                  </div>
                  <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{lookupStatus(auto.status)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {bundle.workspace.liveAutomations.length > 0 && bundle.workspace.kpis.length > 0 && (
        <div className="portalGrid2" style={{ marginTop: 0 }}>
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{tLive("panelTitle")}</h2>
              <span className="portalPanelCount">{tLive("count", { count: bundle.workspace.liveAutomations.length })}</span>
            </div>
            {bundle.workspace.liveAutomations.map((auto) => (
              <div key={auto.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{auto.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>{auto.toolRecommendation}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--success)", textTransform: "uppercase" }}>{tLive("liveBadge")}</span>
              </div>
            ))}
          </div>

          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{tResults("panelTitle")}</h2>
            </div>
            {bundle.workspace.kpis.map((kpi) => (
              <div key={kpi.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--rule)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{kpi.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{tResults("target", { value: kpi.target })}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 3 }}>{kpi.why}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(bundle.pie.clientQuestions.length > 0 || bundle.workspace.approvals.length > 0) && (
        <div className="portalGrid2">
          {bundle.pie.clientQuestions.length > 0 && (
            <div className="portalPanel fadeUp">
              <div className="portalPanelHeader">
                <h2 className="portalPanelTitle">{tQuestions("panelTitle")}</h2>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {bundle.pie.clientQuestions.map((q) => (
                  <div key={q} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--panel2)", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{q}</div>
                ))}
              </div>
            </div>
          )}

          {bundle.workspace.approvals.length > 0 && (
            <div className="portalPanel fadeUp">
              <div className="portalPanelHeader">
                <h2 className="portalPanelTitle">{tApprovals("panelTitle")}</h2>
              </div>
              {bundle.workspace.approvals.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--stroke)", background: "transparent", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{a.label}</div>
                    {a.notes && <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>{a.notes}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: a.status.toLowerCase() === "pending" ? "var(--accent)" : "var(--success)" }}>{lookupStatus(a.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="portalSectionLabel fadeUp" style={{ marginTop: 8 }}>{t("detailsTitle")}</div>

      <Drawer
        label={tConnected("label")}
        value={tConnected("value", { count: bundle.workspace.systems.length })}
      >
        {bundle.workspace.systems.map((s) => (
          <div key={s.name} className="portalDrawerRow"><span className="portalDrawerKey">{s.name}</span><span className="portalDrawerVal">{s.role} · {lookupStatus(s.status)}</span></div>
        ))}
      </Drawer>

      {bundle.workspace.sops.length > 0 && (
        <Drawer
          label={tSops("label")}
          value={tSops("value", { count: bundle.workspace.sops.length })}
        >
          {bundle.workspace.sops.map((sop) => (
            <div key={sop.workflow} style={{ padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{sop.workflow}</div>
              <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>{tSops("trigger", { trigger: sop.trigger })}</div>
              {sop.steps.length > 0 && <div style={{ marginTop: 6, display: "grid", gap: 3 }}>{sop.steps.map((step, i) => (<div key={i} style={{ fontSize: 13, color: "var(--muted)", paddingLeft: 14, borderLeft: "2px solid var(--stroke)" }}>{step}</div>))}</div>}
            </div>
          ))}
        </Drawer>
      )}

      {bundle.workspace.risks.length > 0 && (
        <Drawer
          label={tRisks("label")}
          value={tRisks("value", { count: bundle.workspace.risks.length })}
        >
          {bundle.workspace.risks.map((r) => (
            <div key={r.risk} className="portalDrawerRow" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}><span className="portalDrawerVal">{r.risk}</span><span className="portalDrawerKey">{tRisks("mitigation", { mitigation: r.mitigation })}</span></div>
          ))}
        </Drawer>
      )}

      {bundle.workspace.incidents.length > 0 && (
        <Drawer label={tIncidents("label")} value={`${bundle.workspace.incidents.length}`}>
          {bundle.workspace.incidents.map((inc) => (
            <div key={inc.id} className="portalDrawerRow" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="portalDrawerVal">{inc.title}</span><span style={{ fontSize: 10, fontWeight: 600, color: inc.severity.toLowerCase() === "high" ? "var(--accent)" : "var(--muted)", textTransform: "uppercase" }}>{inc.severity}</span></div>
              <span className="portalDrawerKey">{inc.summary || inc.resolution}</span>
            </div>
          ))}
        </Drawer>
      )}

      {bundle.workspace.changeRequests.length > 0 && (
        <Drawer label={tChangeRequests("label")} value={`${bundle.workspace.changeRequests.length}`}>
          {bundle.workspace.changeRequests.map((cr) => (
            <div key={cr.id} className="portalDrawerRow" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}><span className="portalDrawerVal">{cr.title} · {lookupStatus(cr.status)}</span><span className="portalDrawerKey">{cr.reason || cr.impact}</span></div>
          ))}
        </Drawer>
      )}

      <Drawer
        label={tAgreement("label")}
        value={lookupStatus(bundle.workspace.depositStatus || bundle.workspace.agreementStatus || "pending")}
      >
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tAgreement("agreementStatus")}</span><span className="portalDrawerVal">{lookupStatus(bundle.workspace.agreementStatus || "pending")}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tAgreement("accepted")}</span><span className="portalDrawerVal">{fmtDate(bundle.workspace.agreementAcceptedAt, locale)}</span></div>
        {(bundle.workspace as any).agreementText ? (
          <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--stroke)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{tAgreement("agreementHeader")}</div>
            <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{(bundle.workspace as any).agreementText}</div>
          </div>
        ) : null}
        <div className="portalDrawerRow" style={{ marginTop: 8 }}><span className="portalDrawerKey">{tAgreement("depositStatus")}</span><span className="portalDrawerVal">{lookupStatus(bundle.workspace.depositStatus || "pending")}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tAgreement("depositAmount")}</span><span className="portalDrawerVal">{money(bundle.workspace.depositAmount, locale)}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tAgreement("paidAt")}</span><span className="portalDrawerVal">{fmtDate(bundle.workspace.depositPaidAt, locale)}</span></div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {bundle.workspace.agreementStatus !== "accepted" ? (
            <button className="btn btnPrimary" disabled={saving} onClick={() => applyAction({ type: "agreement_accept" })}>{saving ? tActions("saving") : tActions("acceptAgreement")}</button>
          ) : null}
          {bundle.workspace.agreementStatus === "accepted" && !bundle.workspace.depositUrl && bundle.workspace.depositStatus !== "paid" ? (
            <button className="btn btnGhost" disabled={saving} onClick={() => applyAction({ type: "ensure_deposit_link" })}>{saving ? tActions("preparing") : tActions("prepareDeposit")}</button>
          ) : null}
          {bundle.workspace.depositUrl && bundle.workspace.depositStatus !== "paid" ? (
            <a className="btn btnPrimary" href={bundle.workspace.depositUrl} target="_blank" rel="noreferrer">{tActions("payDeposit")} <span className="btnArrow">→</span></a>
          ) : null}
        </div>
      </Drawer>

      <Drawer label={tPricing("label")} value={bundle.pie.recommendedOffer.primaryPackage}>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tPricing("package")}</span><span className="portalDrawerVal">{bundle.pie.recommendedOffer.primaryPackage}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tPricing("projectRange")}</span><span className="portalDrawerVal">{bundle.pie.recommendedOffer.projectRange}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tPricing("retainerRange")}</span><span className="portalDrawerVal">{bundle.pie.recommendedOffer.retainerRange}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tPricing("industry")}</span><span className="portalDrawerVal">{bundle.intake.industry}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">{tPricing("teamSize")}</span><span className="portalDrawerVal">{bundle.intake.teamSize}</span></div>
      </Drawer>

      <div className="portalFooter">
        {tFooter("poweredBy")} <a href="/">Crecy Studio</a>{tFooter("tagline")}
      </div>
    </div>
  );
}
