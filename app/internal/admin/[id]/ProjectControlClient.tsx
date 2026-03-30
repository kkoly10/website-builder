"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

/* ═══════════════════════════════════
   TYPES
   ═══════════════════════════════════ */

type Milestone = { key: string; label: string; done: boolean; updatedAt?: string | null };
type ClientAsset = { id: string; category: string; label: string; url: string; notes?: string; status: string; createdAt: string };
type ClientRevision = { id: string; message: string; priority: string; status: string; createdAt: string };
type ScopeVersion = { id: string; createdAt: string; label: string; summary: string; tierLabel: string; platform: string; timeline: string; revisionPolicy: string; pagesIncluded: string[]; featuresIncluded: string[]; exclusions: string[] };
type ChangeOrder = { id: string; createdAt: string; title: string; summary: string; priceImpact: string; timelineImpact: string; scopeImpact: string; status: string };

type ProjectControlData = {
  quoteId: string;
  publicToken: string;
  workspaceUrl: string;
  createdAt: string;
  status: string;
  tier: string;
  leadName: string;
  leadEmail: string;
  estimate: { target: number; min: number; max: number };
  pie: { exists: boolean; score: number | null; tier: string | null; summary: string };
  callRequest: { status: string; bestTime: string; timezone: string; notes: string } | null;
  adminPricing: { discountPercent: number; flatAdjustment: number; hourlyRate: number; notes: string };
  scopeSnapshot: { tierLabel: string; platform: string; timeline: string; revisionPolicy: string; pagesIncluded: string[]; featuresIncluded: string[]; exclusions: string[] };
  portalAdmin: PortalAdminView;
  depositStatus: string;
  portalStateAdmin: { clientStatus: string; clientNotes: string; adminPublicNote: string; depositAmount: number; depositNotes: string; milestones: Milestone[] };
  clientSync: { lastClientUpdate: string; assets: ClientAsset[]; revisions: ClientRevision[] };
  workspaceHistory: { scopeVersions: ScopeVersion[]; changeOrders: ChangeOrder[] };
  proposalText: string;
  preContractDraft: string;
  publishedAgreementText: string;
};

type PortalAdminView = {
  previewUrl: string; productionUrl: string; previewStatus: string; previewNotes: string;
  previewUpdatedAt: string; clientReviewStatus: string; agreementStatus: string;
  agreementModel: string; ownershipModel: string; agreementPublishedAt: string;
  launchStatus: string; domainStatus: string; analyticsStatus: string; formsStatus: string;
  seoStatus: string; handoffStatus: string; launchNotes: string;
};

/* ═══════════════════════════════════
   HELPERS
   ═══════════════════════════════════ */

function money(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v || 0));
}
function fmtDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function pretty(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
function listToText(v: string[]) { return v.join("\n"); }
function textToList(v: string) { return v.split(/\n|,/).map((s) => s.trim()).filter(Boolean); }

function isReadyState(v?: string | null) {
  const s = String(v || "").toLowerCase();
  return s === "ready" || s === "complete";
}

function isAgreementPublished(input: { agreementStatus: string; publishedAgreementText: string }) {
  const s = String(input.agreementStatus || "").toLowerCase();
  return !!input.publishedAgreementText.trim() || s === "published to client" || s === "signed" || s === "kickoff ready";
}

function computeLaunchReadiness(data: ProjectControlData) {
  const checks = [
    { key: "agreement", label: "Agreement published", done: isAgreementPublished({ agreementStatus: data.portalAdmin.agreementStatus, publishedAgreementText: data.publishedAgreementText }) },
    { key: "preview", label: "Preview published", done: !!data.portalAdmin.previewUrl.trim() },
    { key: "domain", label: "Domain ready", done: isReadyState(data.portalAdmin.domainStatus) },
    { key: "analytics", label: "Analytics ready", done: isReadyState(data.portalAdmin.analyticsStatus) },
    { key: "forms", label: "Forms ready", done: isReadyState(data.portalAdmin.formsStatus) },
    { key: "seo", label: "SEO basics ready", done: isReadyState(data.portalAdmin.seoStatus) },
    { key: "handoff", label: "Handoff ready", done: isReadyState(data.portalAdmin.handoffStatus) },
  ];
  const completed = checks.filter((c) => c.done).length;
  const percent = Math.round((completed / checks.length) * 100);
  const blockers = checks.filter((c) => !c.done).map((c) => c.label);
  return { checks, completed, percent, blockers, canMarkLaunchReady: percent === 100, canMarkLive: percent === 100 && !!data.portalAdmin.productionUrl.trim() };
}

function setMilestoneDone(milestones: Milestone[], key: string, label: string, done: boolean): Milestone[] {
  const now = new Date().toISOString();
  const found = milestones.some((m) => m.key === key);
  if (!found) return [...milestones, { key, label, done, updatedAt: now }];
  return milestones.map((m) => m.key === key ? { ...m, label: m.label || label, done, updatedAt: now } : m);
}

function pieTone(score: number | null) {
  if (score == null) return { color: "var(--muted2)", label: "—" };
  if (score >= 80) return { color: "#5DCAA5", label: "Strong" };
  if (score >= 60) return { color: "#c9a84c", label: "Good" };
  if (score >= 40) return { color: "#dfc06a", label: "Fair" };
  return { color: "#F09595", label: "Low" };
}

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function PieRing({ score, size = 56 }: { score: number | null; size?: number }) {
  const tone = pieTone(score);
  const r = (size - 6) / 2;
  const c = Math.PI * 2 * r;
  const pct = score != null ? score / 100 : 0;
  const offset = c - c * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--stroke)" strokeWidth="4" />
      {score != null && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone.color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.8s ease" }} />
      )}
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
        fill={tone.color} fontSize={size > 48 ? 15 : 11} fontWeight="600" fontFamily="DM Sans">
        {score != null ? score : "—"}
      </text>
    </svg>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ padding: "14px 16px", background: "var(--panel2)", borderRadius: 12, border: "1px solid var(--stroke)", flex: "1 1 0", minWidth: 100 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600,
        color: accent ? "var(--accent)" : "var(--fg)", marginTop: 4, letterSpacing: "-0.02em",
      }}>{value}</div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string; badge?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div style={{
      display: "flex", gap: 2, borderBottom: "1px solid var(--stroke)",
      marginBottom: 24, overflowX: "auto",
    }}>
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            padding: "12px 18px", background: "none", border: "none",
            borderBottom: active === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
            color: active === tab.key ? "var(--fg)" : "var(--muted2)",
            cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}>
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
              background: "rgba(201,168,76,0.12)", color: "var(--accent)",
            }}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div className="fieldLabel">{label}</div>
      {children}
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <Field label={label}><input className="input" value={value} disabled /></Field>;
}

function LaunchCheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 14px", border: "1px solid var(--stroke)", borderRadius: 10,
      background: done ? "rgba(46,160,67,0.04)" : "transparent",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: done ? "rgba(46,160,67,0.15)" : "var(--stroke)",
        }}>
          {done && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: done ? "var(--fg)" : "var(--muted)" }}>{label}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: done ? "#5DCAA5" : "var(--muted2)" }}>
        {done ? "Ready" : "Pending"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */

export default function ProjectControlClient({ initialData }: { initialData: ProjectControlData }) {
  const [data, setData] = useState<ProjectControlData>(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [newChangeOrder, setNewChangeOrder] = useState({ title: "", summary: "", priceImpact: "", timelineImpact: "", scopeImpact: "", status: "draft" });

  const readiness = useMemo(() => computeLaunchReadiness(data), [data]);
  const adjustedTarget = useMemo(() => {
    const d = Math.round(data.estimate.target * (1 - data.adminPricing.discountPercent / 100));
    return d + data.adminPricing.flatAdjustment;
  }, [data.estimate.target, data.adminPricing]);

  /* ── API ── */
  async function savePatch(payload: Record<string, any>, successMsg: string) {
    setBusy(true); setMessage("Saving..."); setMessageIsError(false);
    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: data.quoteId, ...payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to save.");
      setMessageIsError(false); setMessage(successMsg);
    } catch (err) {
      setMessageIsError(true); setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally { setBusy(false); }
  }

  async function generatePreContract() {
    setBusy(true); setMessage("Generating pre-contract..."); setMessageIsError(false);
    try {
      const res = await fetch("/api/internal/admin/pre-contract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: data.quoteId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to generate.");
      setData((p) => ({ ...p, preContractDraft: String(json.draft || "") }));
      setMessageIsError(false); setMessage("Pre-contract generated.");
    } catch (err) {
      setMessageIsError(true); setMessage(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  function copyDraftToPublished() {
    if (!data.preContractDraft.trim()) { setMessageIsError(true); setMessage("Generate a draft first."); return; }
    setData((p) => ({ ...p, publishedAgreementText: p.preContractDraft }));
    setMessageIsError(false); setMessage("Draft copied to published agreement.");
  }

  function requestPublishAgreement() {
    if (!data.publishedAgreementText.trim()) { setMessageIsError(true); setMessage("Add agreement text first."); return; }
    setConfirmAction({ title: "Publish agreement to client", description: "The client will see the full agreement text in their workspace immediately.", onConfirm: executePublishAgreement });
  }

  async function executePublishAgreement() {
    setConfirmAction(null);
    const next = { ...data.portalAdmin, agreementStatus: "Published to client", agreementPublishedAt: new Date().toISOString() };
    setData((p) => ({ ...p, portalAdmin: next }));
    await savePatch({ publishedAgreementText: data.publishedAgreementText, portalAdmin: next, _event: "agreement_published" }, "Agreement published.");
  }

  async function unpublishAgreement() {
    const next = { ...data.portalAdmin, agreementStatus: "Pre-draft / agreement stage", agreementPublishedAt: "" };
    setData((p) => ({ ...p, portalAdmin: next, publishedAgreementText: "" }));
    await savePatch({ publishedAgreementText: "", portalAdmin: next }, "Agreement unpublished.");
  }

  function requestMarkLaunchReady() {
    if (!readiness.canMarkLaunchReady) { setMessageIsError(true); setMessage("Complete all readiness items first."); return; }
    setConfirmAction({ title: "Mark ready for launch", description: "The client workspace will show the project is ready. Build and review milestones will be marked complete.", onConfirm: executeMarkLaunchReady });
  }

  async function executeMarkLaunchReady() {
    setConfirmAction(null);
    const nextPA = { ...data.portalAdmin, launchStatus: "Ready for launch" };
    let ms = [...data.portalStateAdmin.milestones];
    ms = setMilestoneDone(ms, "build_in_progress", "Build in progress", true);
    ms = setMilestoneDone(ms, "review_round", "Review / revisions", true);
    const nextPS = { ...data.portalStateAdmin, clientStatus: "launch_ready", milestones: ms };
    setData((p) => ({ ...p, portalAdmin: nextPA, portalStateAdmin: nextPS }));
    await savePatch({ portalAdmin: nextPA, portalStateAdmin: nextPS, _event: "launch_ready" }, "Marked ready for launch.");
  }

  function requestMarkLive() {
    if (!readiness.canMarkLive) { setMessageIsError(true); setMessage("Add production URL and complete all items first."); return; }
    setConfirmAction({ title: "Mark project live", description: "This is the final lifecycle step. The client workspace will show the project is launched.", onConfirm: executeMarkLive });
  }

  async function executeMarkLive() {
    setConfirmAction(null);
    const nextPA = { ...data.portalAdmin, launchStatus: "Live", previewStatus: "Live", clientReviewStatus: "Live" };
    let ms = [...data.portalStateAdmin.milestones];
    ms = setMilestoneDone(ms, "build_in_progress", "Build in progress", true);
    ms = setMilestoneDone(ms, "review_round", "Review / revisions", true);
    ms = setMilestoneDone(ms, "launch", "Launch completed", true);
    const nextPS = { ...data.portalStateAdmin, clientStatus: "live", milestones: ms };
    setData((p) => ({ ...p, portalAdmin: nextPA, portalStateAdmin: nextPS }));
    await savePatch({ portalAdmin: nextPA, portalStateAdmin: nextPS, _event: "site_live" }, "Project marked live.");
  }

  async function revertLaunchStatus(targetStatus: string, clientStatus: string) {
    const nextPA = { ...data.portalAdmin, launchStatus: targetStatus, previewStatus: targetStatus === "Not ready" ? "Awaiting published preview" : data.portalAdmin.previewStatus, clientReviewStatus: targetStatus === "Not ready" ? "Preview pending" : data.portalAdmin.clientReviewStatus };
    let ms = [...data.portalStateAdmin.milestones];
    if (targetStatus !== "Live") ms = setMilestoneDone(ms, "launch", "Launch completed", false);
    const nextPS = { ...data.portalStateAdmin, clientStatus, milestones: ms };
    setData((p) => ({ ...p, portalAdmin: nextPA, portalStateAdmin: nextPS }));
    await savePatch({ portalAdmin: nextPA, portalStateAdmin: nextPS }, `Launch reverted to "${targetStatus}".`);
  }

  function toggleMilestone(key: string) {
    setData((p) => ({ ...p, portalStateAdmin: { ...p.portalStateAdmin, milestones: p.portalStateAdmin.milestones.map((m) => m.key === key ? { ...m, done: !m.done } : m) } }));
  }

  async function createDepositLink() {
    setBusy(true); setMessage("Creating Stripe deposit link..."); setMessageIsError(false);
    try {
      const res = await fetch("/api/internal/create-deposit-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: data.quoteId, depositAmount: data.portalStateAdmin.depositAmount || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to create deposit link.");
      setMessageIsError(false); setMessage(`Deposit link created ($${json.depositAmount}). Client portal will now show the Pay button.`);
    } catch (err) {
      setMessageIsError(true); setMessage(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  function requestMarkDepositPaid() {
    if (data.depositStatus === "paid") return;
    setConfirmAction({ title: "Mark deposit paid", description: "Use this for payments received outside Stripe (bank transfer, check, etc.). The client workspace will reflect the deposit as paid.", onConfirm: executeMarkDepositPaid });
  }

  async function executeMarkDepositPaid() {
    setConfirmAction(null);
    setBusy(true); setMessage("Marking deposit paid..."); setMessageIsError(false);
    try {
      const res = await fetch("/api/internal/quote-action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_deposit_paid", quoteId: data.quoteId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 303) throw new Error(json?.error || "Failed to mark deposit paid.");
      setData((p) => ({ ...p, depositStatus: "paid" }));
      let ms = [...data.portalStateAdmin.milestones];
      ms = setMilestoneDone(ms, "deposit_paid", "Deposit paid", true);
      setData((p) => ({ ...p, depositStatus: "paid", portalStateAdmin: { ...p.portalStateAdmin, milestones: ms } }));
      setMessageIsError(false); setMessage("Deposit marked as paid.");
    } catch (err) {
      setMessageIsError(true); setMessage(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  function updateAssetStatus(id: string, status: string) {
    setData((p) => ({ ...p, clientSync: { ...p.clientSync, assets: p.clientSync.assets.map((a) => a.id === id ? { ...a, status } : a) } }));
  }

  function updateRevisionStatus(id: string, status: string) {
    setData((p) => ({ ...p, clientSync: { ...p.clientSync, revisions: p.clientSync.revisions.map((r) => r.id === id ? { ...r, status } : r) } }));
  }

  function captureScopeVersion() {
    const sv: ScopeVersion = {
      id: `scope-${Date.now()}`, createdAt: new Date().toISOString(),
      label: `${data.scopeSnapshot.tierLabel || "Scope"} snapshot`,
      summary: `${data.scopeSnapshot.pagesIncluded.length} pages · ${data.scopeSnapshot.featuresIncluded.length} features`,
      ...data.scopeSnapshot,
    };
    setData((p) => ({ ...p, workspaceHistory: { ...p.workspaceHistory, scopeVersions: [sv, ...p.workspaceHistory.scopeVersions] } }));
    setMessageIsError(false); setMessage("Scope captured. Save history to persist.");
  }

  function addChangeOrder() {
    if (!newChangeOrder.title.trim() || !newChangeOrder.summary.trim()) { setMessageIsError(true); setMessage("Add title and summary."); return; }
    const co: ChangeOrder = { id: `co-${Date.now()}`, createdAt: new Date().toISOString(), title: newChangeOrder.title.trim(), summary: newChangeOrder.summary.trim(), priceImpact: newChangeOrder.priceImpact.trim(), timelineImpact: newChangeOrder.timelineImpact.trim(), scopeImpact: newChangeOrder.scopeImpact.trim(), status: newChangeOrder.status };
    setData((p) => ({ ...p, workspaceHistory: { ...p.workspaceHistory, changeOrders: [co, ...p.workspaceHistory.changeOrders] } }));
    setNewChangeOrder({ title: "", summary: "", priceImpact: "", timelineImpact: "", scopeImpact: "", status: "draft" });
    setMessageIsError(false); setMessage("Change order added. Save history to persist.");
  }

  function updateChangeOrderStatus(id: string, status: string) {
    setData((p) => ({ ...p, workspaceHistory: { ...p.workspaceHistory, changeOrders: p.workspaceHistory.changeOrders.map((c) => c.id === id ? { ...c, status } : c) } }));
  }

  /* ── Options ── */
  const statusOptions = ["new", "call_requested", "call", "proposal", "deposit", "active", "closed_won"];
  const workspaceStatusOptions = ["new", "intake_review", "content_submitted", "preview_ready", "revision_requested", "launch_ready", "live"];
  const previewStatusOptions = ["Awaiting published preview", "Ready for review", "Revision in progress", "Approved for launch", "Live"];
  const reviewStatusOptions = ["Preview pending", "Pending review", "Changes requested", "Approved", "Live"];
  const agreementStatusOptions = ["Not published yet", "Pre-draft / agreement stage", "Published to client", "Signed", "Kickoff ready"];
  const ownershipOptions = ["Managed with project handoff options", "Client-owned / handoff"];
  const launchStatusOptions = ["Not ready", "Pre-launch", "Ready for launch", "Live"];
  const readinessOptions = ["Pending", "In progress", "Ready", "Complete"];
  const assetStatusOptions = ["submitted", "received", "approved"];
  const revisionStatusOptions = ["new", "reviewed", "scheduled", "done"];
  const changeOrderStatusOptions = ["draft", "sent", "approved", "declined"];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "scope", label: "Scope & build" },
    { key: "workspace", label: "Workspace" },
    { key: "agreement", label: "Agreement" },
    { key: "launch", label: "Launch", badge: readiness.blockers.length },
    { key: "client", label: "Client sync", badge: data.clientSync.assets.length + data.clientSync.revisions.length },
  ];

  const pt = pieTone(data.pie.score);

  /* ═══════════════════════════════════
     RENDER
     ═══════════════════════════════════ */

  return (
    <main className="container" style={{ paddingTop: 0, paddingBottom: 48 }}>

      {/* ── Command Header ── */}
      <div style={{
        padding: "28px 0", borderBottom: "1px solid var(--stroke)", marginBottom: 24,
        display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 20, alignItems: "start",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div className="kicker"><span className="kickerDot" /> Project control</div>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 3.5vw, 38px)",
            fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.03em", margin: "8px 0 6px",
          }}>
            {data.leadName}
          </h1>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            {data.leadEmail} · ID <code style={{ fontSize: 12 }}>{data.quoteId.slice(0, 8)}</code> · Created {fmtDate(data.createdAt)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/internal/admin" className="btn btnGhost" style={{ fontSize: 13, padding: "8px 14px" }}>
            Pipeline
          </Link>
          {data.workspaceUrl && (
            <Link href={data.workspaceUrl} className="btn btnPrimary" style={{ fontSize: 13, padding: "8px 14px" }}>
              Client workspace →
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <Stat label="Status" value={pretty(data.status)} />
        <Stat label="Tier" value={data.tier} />
        <Stat label="Target" value={money(adjustedTarget)} accent />
        <Stat label="Launch" value={`${readiness.percent}%`} />
        <div style={{
          padding: "12px 16px", background: "var(--panel2)", borderRadius: 12,
          border: "1px solid var(--stroke)", display: "flex", alignItems: "center", gap: 12,
        }}>
          <PieRing score={data.pie.score} size={46} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>PIE</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: pt.color }}>{data.pie.exists ? pt.label : "Missing"}</div>
          </div>
        </div>
      </div>

      {/* ── Message ── */}
      {message && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: messageIsError ? "rgba(255,0,0,0.06)" : "rgba(46,160,67,0.06)",
          border: `1px solid ${messageIsError ? "rgba(255,0,0,0.15)" : "rgba(46,160,67,0.15)"}`,
          color: messageIsError ? "#F09595" : "#5DCAA5",
        }}>
          {message}
        </div>
      )}

      {/* ── Tab Bar ── */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ═══ TAB: OVERVIEW ═══ */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,0.7fr)", gap: 16 }}>
          {/* Pricing */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 16px" }}>Pricing controls</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Discount %"><input className="input" type="number" value={data.adminPricing.discountPercent}
                onChange={(e) => setData((p) => ({ ...p, adminPricing: { ...p.adminPricing, discountPercent: Number(e.target.value || 0) } }))} /></Field>
              <Field label="Flat adjustment"><input className="input" type="number" value={data.adminPricing.flatAdjustment}
                onChange={(e) => setData((p) => ({ ...p, adminPricing: { ...p.adminPricing, flatAdjustment: Number(e.target.value || 0) } }))} /></Field>
              <Field label="Hourly rate"><input className="input" type="number" value={data.adminPricing.hourlyRate}
                onChange={(e) => setData((p) => ({ ...p, adminPricing: { ...p.adminPricing, hourlyRate: Number(e.target.value || 40) } }))} /></Field>
              <ReadOnly label="Adjusted target" value={money(adjustedTarget)} />
            </div>
            <Field label="Pricing notes"><textarea className="textarea" rows={3} value={data.adminPricing.notes}
              onChange={(e) => setData((p) => ({ ...p, adminPricing: { ...p.adminPricing, notes: e.target.value } }))} /></Field>
            <div style={{ marginTop: 12 }}>
              <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "7px 14px" }}
                onClick={() => savePatch({ adminPricing: data.adminPricing }, "Pricing updated.")}>Save pricing</button>
            </div>
          </div>

          {/* PIE + Proposal */}
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 12px" }}>PIE snapshot</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <ReadOnly label="Score" value={data.pie.score != null ? String(data.pie.score) : "—"} />
                <ReadOnly label="Tier" value={data.pie.tier || "—"} />
              </div>
              {data.pie.summary && (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxHeight: 120, overflow: "auto" }}>
                  {data.pie.summary}
                </div>
              )}
              {data.callRequest && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted2)" }}>
                  Call: {data.callRequest.status} · {data.callRequest.bestTime || "No time set"}
                </div>
              )}
            </div>

            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 12px" }}>Proposal</h3>
              <textarea className="textarea" rows={5} value={data.proposalText}
                onChange={(e) => setData((p) => ({ ...p, proposalText: e.target.value }))} placeholder="Draft proposal..." />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "7px 14px" }}
                  onClick={() => savePatch({ proposalText: data.proposalText }, "Proposal saved.")}>Save</button>
                <button className="btn btnGhost" style={{ fontSize: 12, padding: "7px 14px" }}
                  onClick={() => navigator.clipboard.writeText(data.proposalText || "")}>Copy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: SCOPE ═══ */}
      {activeTab === "scope" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 16px" }}>Scope snapshot</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Tier label"><input className="input" value={data.scopeSnapshot.tierLabel} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, tierLabel: e.target.value } }))} /></Field>
              <Field label="Platform"><input className="input" value={data.scopeSnapshot.platform} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, platform: e.target.value } }))} /></Field>
              <Field label="Timeline"><input className="input" value={data.scopeSnapshot.timeline} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, timeline: e.target.value } }))} /></Field>
              <Field label="Revision policy"><input className="input" value={data.scopeSnapshot.revisionPolicy} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, revisionPolicy: e.target.value } }))} /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Pages included"><textarea className="textarea" rows={4} value={listToText(data.scopeSnapshot.pagesIncluded)} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, pagesIncluded: textToList(e.target.value) } }))} placeholder="One page per line" /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Features"><textarea className="textarea" rows={4} value={listToText(data.scopeSnapshot.featuresIncluded)} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, featuresIncluded: textToList(e.target.value) } }))} placeholder="One feature per line" /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Exclusions"><textarea className="textarea" rows={3} value={listToText(data.scopeSnapshot.exclusions)} onChange={(e) => setData((p) => ({ ...p, scopeSnapshot: { ...p.scopeSnapshot, exclusions: textToList(e.target.value) } }))} /></Field>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "8px 16px" }}
                onClick={() => savePatch({ scopeSnapshot: data.scopeSnapshot }, "Scope saved.")}>Save scope →</button>
              <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "8px 16px" }}
                onClick={captureScopeVersion}>Capture version</button>
            </div>
          </div>

          {/* Scope History + Change Orders */}
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 12px" }}>Scope history</h3>
              {data.workspaceHistory.scopeVersions.length === 0
                ? <div style={{ fontSize: 13, color: "var(--muted2)" }}>No saved versions yet.</div>
                : data.workspaceHistory.scopeVersions.map((v) => (
                  <div key={v.id} style={{ padding: "10px 14px", border: "1px solid var(--stroke)", borderRadius: 10, background: "var(--panel2)", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{v.label}</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>{fmtDate(v.createdAt)} · {v.summary}</div>
                  </div>
                ))}
            </div>

            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 12px" }}>Change orders</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Title"><input className="input" value={newChangeOrder.title} onChange={(e) => setNewChangeOrder((p) => ({ ...p, title: e.target.value }))} placeholder="Add booking flow" /></Field>
                <Field label="Status"><select className="select" value={newChangeOrder.status} onChange={(e) => setNewChangeOrder((p) => ({ ...p, status: e.target.value }))}>{changeOrderStatusOptions.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}</select></Field>
              </div>
              <div style={{ marginTop: 10 }}><Field label="Summary"><textarea className="textarea" rows={2} value={newChangeOrder.summary} onChange={(e) => setNewChangeOrder((p) => ({ ...p, summary: e.target.value }))} /></Field></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <Field label="Price impact"><input className="input" value={newChangeOrder.priceImpact} onChange={(e) => setNewChangeOrder((p) => ({ ...p, priceImpact: e.target.value }))} placeholder="+$300" /></Field>
                <Field label="Timeline impact"><input className="input" value={newChangeOrder.timelineImpact} onChange={(e) => setNewChangeOrder((p) => ({ ...p, timelineImpact: e.target.value }))} placeholder="+3 days" /></Field>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "7px 14px" }} onClick={addChangeOrder}>Add change order</button>
              </div>

              {data.workspaceHistory.changeOrders.map((co) => (
                <div key={co.id} style={{ padding: "12px 14px", border: "1px solid var(--stroke)", borderRadius: 10, background: "var(--panel2)", marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{co.title}</div>
                      <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>{fmtDate(co.createdAt)} · {co.priceImpact || "—"} · {co.timelineImpact || "—"}</div>
                    </div>
                    <select className="select" style={{ maxWidth: 140, fontSize: 12 }} value={co.status}
                      onChange={(e) => updateChangeOrderStatus(co.id, e.target.value)}>
                      {changeOrderStatusOptions.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}
                    </select>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "8px 16px" }}
                  onClick={() => savePatch({ workspaceHistory: data.workspaceHistory }, "History saved.")}>Save history →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: WORKSPACE ═══ */}
      {activeTab === "workspace" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 16px" }}>Publishing controls</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Preview URL"><input className="input" value={data.portalAdmin.previewUrl} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, previewUrl: e.target.value } }))} placeholder="https://preview.vercel.app" /></Field>
              <Field label="Production URL"><input className="input" value={data.portalAdmin.productionUrl} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, productionUrl: e.target.value } }))} placeholder="https://client.com" /></Field>
              <Field label="Preview status"><select className="select" value={data.portalAdmin.previewStatus} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, previewStatus: e.target.value } }))}>{previewStatusOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
              <Field label="Client review"><select className="select" value={data.portalAdmin.clientReviewStatus} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, clientReviewStatus: e.target.value } }))}>{reviewStatusOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
              <Field label="Agreement"><select className="select" value={data.portalAdmin.agreementStatus} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, agreementStatus: e.target.value } }))}>{agreementStatusOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
              <Field label="Ownership"><select className="select" value={data.portalAdmin.ownershipModel} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, ownershipModel: e.target.value } }))}>{ownershipOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
              <Field label="Agreement model"><input className="input" value={data.portalAdmin.agreementModel} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, agreementModel: e.target.value } }))} /></Field>
              <Field label="Launch status"><select className="select" value={data.portalAdmin.launchStatus} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, launchStatus: e.target.value } }))}>{launchStatusOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 12 }}>
              {(["domainStatus", "analyticsStatus", "formsStatus", "seoStatus", "handoffStatus"] as const).map((k) => (
                <Field key={k} label={k.replace("Status", "")}><select className="select" value={data.portalAdmin[k]} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, [k]: e.target.value } }))}>{readinessOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
              ))}
            </div>
            <div style={{ marginTop: 12 }}><Field label="Preview notes"><textarea className="textarea" rows={3} value={data.portalAdmin.previewNotes} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, previewNotes: e.target.value } }))} /></Field></div>
            <div style={{ marginTop: 12 }}><Field label="Launch notes"><textarea className="textarea" rows={3} value={data.portalAdmin.launchNotes} onChange={(e) => setData((p) => ({ ...p, portalAdmin: { ...p.portalAdmin, launchNotes: e.target.value } }))} /></Field></div>
            <div style={{ marginTop: 14 }}>
              <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "8px 16px" }}
                onClick={() => savePatch({ portalAdmin: data.portalAdmin }, "Publishing updated.")}>Save publishing →</button>
            </div>
          </div>

          {/* State + Timeline */}
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 16px" }}>Workspace state</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Quote status"><select className="select" value={data.status} onChange={(e) => setData((p) => ({ ...p, status: e.target.value }))}>{statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
                <Field label="Workspace status"><select className="select" value={data.portalStateAdmin.clientStatus} onChange={(e) => setData((p) => ({ ...p, portalStateAdmin: { ...p.portalStateAdmin, clientStatus: e.target.value } }))}>{workspaceStatusOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
                <Field label="Deposit amount"><input className="input" type="number" value={data.portalStateAdmin.depositAmount} onChange={(e) => setData((p) => ({ ...p, portalStateAdmin: { ...p.portalStateAdmin, depositAmount: Number(e.target.value || 0) } }))} /></Field>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  {data.depositStatus === "paid" ? (
                    <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(46,160,67,0.1)", border: "1px solid rgba(46,160,67,0.3)", color: "#5DCAA5", fontSize: 12, fontWeight: 700 }}>
                      Deposit paid ✓
                    </div>
                  ) : (
                    <>
                      <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "8px 14px" }} onClick={createDepositLink}>
                        Create Stripe link
                      </button>
                      <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "8px 14px" }} onClick={requestMarkDepositPaid}>
                        Mark paid manually
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 12 }}><Field label="Admin public note"><textarea className="textarea" rows={3} value={data.portalStateAdmin.adminPublicNote} onChange={(e) => setData((p) => ({ ...p, portalStateAdmin: { ...p.portalStateAdmin, adminPublicNote: e.target.value } }))} placeholder="Client-facing update" /></Field></div>
              <div style={{ marginTop: 12 }}><Field label="Client notes"><textarea className="textarea" rows={2} value={data.portalStateAdmin.clientNotes} onChange={(e) => setData((p) => ({ ...p, portalStateAdmin: { ...p.portalStateAdmin, clientNotes: e.target.value } }))} /></Field></div>
              <div style={{ marginTop: 12 }}><Field label="Deposit notes"><textarea className="textarea" rows={2} value={data.portalStateAdmin.depositNotes} onChange={(e) => setData((p) => ({ ...p, portalStateAdmin: { ...p.portalStateAdmin, depositNotes: e.target.value } }))} /></Field></div>
            </div>

            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 14px" }}>Milestones</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {data.portalStateAdmin.milestones.map((m) => (
                  <label key={m.key} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    border: "1px solid var(--stroke)", borderRadius: 8, background: m.done ? "rgba(46,160,67,0.04)" : "var(--panel2)", cursor: "pointer",
                  }}>
                    <input type="checkbox" checked={m.done} onChange={() => toggleMilestone(m.key)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: m.done ? "var(--fg)" : "var(--muted)" }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: "var(--muted2)" }}>{m.updatedAt ? fmtDate(m.updatedAt) : "Not updated"}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "8px 16px" }}
                  onClick={() => savePatch({ status: data.status, portalStateAdmin: data.portalStateAdmin }, "Workspace state saved.")}>Save state →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: AGREEMENT ═══ */}
      {activeTab === "agreement" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 12px" }}>Pre-contract draft</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "7px 14px" }} onClick={generatePreContract}>
                {data.preContractDraft ? "Regenerate →" : "Generate draft →"}
              </button>
              <button className="btn btnGhost" disabled={busy || !data.preContractDraft.trim()} style={{ fontSize: 12, padding: "7px 14px" }}
                onClick={() => savePatch({ preContractDraft: data.preContractDraft }, "Draft saved.")}>Save</button>
            </div>
            <textarea className="textarea" rows={20} value={data.preContractDraft}
              onChange={(e) => setData((p) => ({ ...p, preContractDraft: e.target.value }))} placeholder="Generate a pre-contract draft to review and edit." />
          </div>

          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: "0 0 12px" }}>Published agreement</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "7px 14px" }} onClick={copyDraftToPublished}>Copy from draft</button>
              <button className="btn btnGhost" disabled={busy || !data.publishedAgreementText.trim()} style={{ fontSize: 12, padding: "7px 14px" }}
                onClick={() => savePatch({ publishedAgreementText: data.publishedAgreementText }, "Agreement saved.")}>Save</button>
              <button className="btn btnPrimary" disabled={busy || !data.publishedAgreementText.trim()} style={{ fontSize: 12, padding: "7px 14px" }}
                onClick={requestPublishAgreement}>Publish to client →</button>
              {isAgreementPublished({ agreementStatus: data.portalAdmin.agreementStatus, publishedAgreementText: data.publishedAgreementText }) && (
                <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "7px 14px", color: "#F09595" }}
                  onClick={unpublishAgreement}>Unpublish</button>
              )}
            </div>
            <textarea className="textarea" rows={20} value={data.publishedAgreementText}
              onChange={(e) => setData((p) => ({ ...p, publishedAgreementText: e.target.value }))} placeholder="Agreement text shown to the client once published." />
          </div>
        </div>
      )}

      {/* ═══ TAB: LAUNCH ═══ */}
      {activeTab === "launch" && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <PieRing score={readiness.percent} size={64} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Launch readiness</h3>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {readiness.completed} of {readiness.checks.length} checks passed · {readiness.blockers.length} remaining
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {readiness.checks.map((c) => <LaunchCheckItem key={c.key} label={c.label} done={c.done} />)}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn btnGhost" disabled={busy || !readiness.canMarkLaunchReady} style={{ fontSize: 12, padding: "8px 16px" }}
                onClick={requestMarkLaunchReady}>Mark ready for launch</button>
              <button className="btn btnPrimary" disabled={busy || !readiness.canMarkLive} style={{ fontSize: 12, padding: "8px 16px" }}
                onClick={requestMarkLive}>Mark live →</button>
              {(data.portalAdmin.launchStatus === "Ready for launch" || data.portalAdmin.launchStatus === "Live") && (
                <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "8px 16px", color: "#F09595" }}
                  onClick={() => revertLaunchStatus("Not ready", "preview_ready")}>Revert to not ready</button>
              )}
              {data.portalAdmin.launchStatus === "Live" && (
                <button className="btn btnGhost" disabled={busy} style={{ fontSize: 12, padding: "8px 16px", color: "#F09595" }}
                  onClick={() => revertLaunchStatus("Ready for launch", "launch_ready")}>Revert to ready</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: CLIENT SYNC ═══ */}
      {activeTab === "client" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
          {/* Assets */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Submitted assets</h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted2)", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 999 }}>
                {data.clientSync.assets.length}
              </span>
            </div>
            {data.clientSync.assets.length === 0
              ? <div style={{ fontSize: 13, color: "var(--muted2)", padding: 14, border: "1px dashed var(--stroke)", borderRadius: 10, textAlign: "center" }}>No assets yet</div>
              : data.clientSync.assets.map((a) => (
                <div key={a.id} style={{ padding: "12px 14px", border: "1px solid var(--stroke)", borderRadius: 10, background: "var(--panel2)", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 2 }}>{a.category} · {fmtDate(a.createdAt)}</div>
                      {a.notes && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{a.notes}</div>}
                      <a href={a.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginTop: 4, display: "inline-block" }}>Open</a>
                    </div>
                    <select className="select" style={{ maxWidth: 120, fontSize: 12 }} value={a.status}
                      onChange={(e) => updateAssetStatus(a.id, e.target.value)}>
                      {assetStatusOptions.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}
                    </select>
                  </div>
                </div>
              ))}
          </div>

          {/* Revisions */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--fg)", margin: 0 }}>Revision requests</h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted2)", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 999 }}>
                {data.clientSync.revisions.length}
              </span>
            </div>
            {data.clientSync.revisions.length === 0
              ? <div style={{ fontSize: 13, color: "var(--muted2)", padding: 14, border: "1px dashed var(--stroke)", borderRadius: 10, textAlign: "center" }}>No revisions yet</div>
              : data.clientSync.revisions.map((r) => (
                <div key={r.id} style={{
                  padding: "12px 14px", borderRadius: 10, background: "var(--panel2)", marginBottom: 6,
                  borderLeft: `3px solid ${r.priority === "high" ? "rgba(226,75,74,0.5)" : r.status === "new" ? "rgba(201,168,76,0.5)" : "var(--stroke)"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: r.priority === "high" ? "#F09595" : "var(--muted2)", textTransform: "uppercase" }}>{r.priority} priority</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{r.message}</div>
                      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>{fmtDate(r.createdAt)}</div>
                    </div>
                    <select className="select" style={{ maxWidth: 120, fontSize: 12 }} value={r.status}
                      onChange={(e) => updateRevisionStatus(r.id, e.target.value)}>
                      {revisionStatusOptions.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted2)" }}>Last client update: {fmtDate(data.clientSync.lastClientUpdate)}</div>
          </div>

          {/* Save button spans full width */}
          <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
            <button className="btn btnPrimary" disabled={busy} style={{ fontSize: 12, padding: "8px 16px" }}
              onClick={() => savePatch({ clientSync: { assets: data.clientSync.assets, revisions: data.clientSync.revisions } }, "Client sync updated.")}>
              Save client sync →
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setConfirmAction(null)}>
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke2)", borderRadius: 18, padding: "28px 28px 22px", maxWidth: 460, width: "90%" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500, fontSize: 20, color: "var(--fg)" }}>{confirmAction.title}</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{confirmAction.description}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn btnGhost" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn btnPrimary" disabled={busy} onClick={confirmAction.onConfirm}>Confirm →</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
