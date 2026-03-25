"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { OpsWorkspaceBundle } from "@/lib/opsWorkspace/server";

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function tone(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (["active", "approved", "live", "completed", "ready"].includes(s)) {
    return { bg: "rgba(46,160,67,0.14)", border: "rgba(46,160,67,0.34)", color: "#b7f5c4", label: pretty(status) };
  }
  if (["requested", "review", "new", "pending"].includes(s)) {
    return { bg: "rgba(201,168,76,0.14)", border: "rgba(201,168,76,0.34)", color: "#f1d98a", label: pretty(status) };
  }
  return { bg: "rgba(141,164,255,0.12)", border: "rgba(141,164,255,0.26)", color: "#d8e0ff", label: pretty(status || "new") };
}

function List({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) return <div className="smallNote">{emptyLabel}</div>;
  return <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export default function OpsPortalClient({ initialData }: { initialData: OpsWorkspaceBundle }) {
  const [bundle, setBundle] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/ops/${bundle.intake.id}`);
      const json = await res.json();
      if (!res.ok || !json?.ok || !json?.data) throw new Error(json?.error || "Failed to refresh workspace.");
      setBundle(json.data as OpsWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh workspace.");
    } finally {
      setRefreshing(false);
    }
  }, [bundle.intake.id]);

  const intakeTone = useMemo(() => tone(bundle.intake.status), [bundle.intake.status]);
  const callTone = useMemo(() => tone(bundle.callRequest.status), [bundle.callRequest.status]);

  return (
    <main className="container section" style={{ paddingBottom: 84 }}>
      <div className="heroFadeUp">
        <div className="kicker"><span className="kickerDot" aria-hidden="true" />Systems Lab</div>
        <div style={{ height: 12 }} />
        <h1 className="h1">{bundle.intake.companyName}</h1>
        <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>This workspace shows the operations problem we are solving, the systems involved, and the automation plan.</p>
        <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
          <span style={{ padding: "8px 12px", borderRadius: 999, background: intakeTone.bg, border: `1px solid ${intakeTone.border}`, color: intakeTone.color, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{intakeTone.label}</span>
          <span style={{ padding: "8px 12px", borderRadius: 999, background: callTone.bg, border: `1px solid ${callTone.border}`, color: callTone.color, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Call {callTone.label}</span>
          <span className="badge">{bundle.intake.recommendationTier}</span>
          <span className="badge">{bundle.ghostAdmin.bestTool}</span>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btnGhost" onClick={refresh} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh Workspace"}</button>
          <Link href="/portal" className="btn btnGhost">Back to Portal</Link>
        </div>
      </div>

      {error ? <div style={{ marginTop: 16, border: "1px solid rgba(255,0,0,0.35)", background: "rgba(255,0,0,0.08)", borderRadius: 14, padding: 14, fontWeight: 700 }}>{error}</div> : null}

      <div className="grid2stretch" style={{ marginTop: 24 }}>
        <div className="panel"><div className="panelHeader"><div>Problem We’re Solving</div><div className="smallNote">Client-facing summary.</div></div><div className="panelBody"><div className="pDark">{bundle.ghostAdmin.businessObjective}</div><div style={{ marginTop: 12 }}><List items={[bundle.ghostAdmin.mainBottleneck, bundle.ghostAdmin.rootCause, bundle.ghostAdmin.bestFirstFix]} emptyLabel="No diagnosis yet." /></div></div></div>
        <div className="panel"><div className="panelHeader"><div>Current vs New Process</div><div className="smallNote">How the workflow should improve.</div></div><div className="panelBody"><div className="fieldLabel">Current Process</div><List items={bundle.workflowMap.currentState} emptyLabel="Current process not mapped yet." /><div className="fieldLabel" style={{ marginTop: 14 }}>Future Process</div><List items={bundle.workflowMap.futureState} emptyLabel="Future process not mapped yet." /></div></div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel"><div className="panelHeader"><div>Connected Systems</div><div className="smallNote">Referenced tools and systems.</div></div><div className="panelBody">{bundle.systems.length === 0 ? <div className="smallNote">No systems mapped yet.</div> : bundle.systems.map((system, index) => <div key={`${system.name}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: 10 }}><div className="panelBody"><div style={{ fontWeight: 800 }}>{system.name}</div><div className="smallNote" style={{ marginTop: 4 }}>{system.role} • {system.status}</div><div className="pDark" style={{ marginTop: 8 }}>{system.notes}</div></div></div>)}</div></div>
        <div className="panel"><div className="panelHeader"><div>Waiting on Client</div><div className="smallNote">What still needs client input.</div></div><div className="panelBody"><List items={bundle.ghostAdmin.missingInfo} emptyLabel="Nothing is waiting on the client right now." /></div></div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel"><div className="panelHeader"><div>Automation Backlog</div><div className="smallNote">What we plan to build.</div></div><div className="panelBody">{bundle.backlog.length === 0 ? <div className="smallNote">No backlog items generated yet.</div> : bundle.backlog.map((item) => <div key={item.id} className="panel" style={{ background: "var(--panel2)", marginTop: 10 }}><div className="panelBody"><div style={{ fontWeight: 800 }}>{item.name}</div><div className="smallNote" style={{ marginTop: 4 }}>{item.status} • {item.priority} • {item.toolRecommendation}</div><div className="pDark" style={{ marginTop: 8 }}>{item.purpose}</div></div></div>)}</div></div>
        <div className="panel"><div className="panelHeader"><div>SOPs / Training</div><div className="smallNote">Operational instructions.</div></div><div className="panelBody">{bundle.pie.sops.length === 0 ? <div className="smallNote">No SOPs published yet.</div> : bundle.pie.sops.map((sop, index) => <div key={`${sop.workflow}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: 10 }}><div className="panelBody"><div style={{ fontWeight: 800 }}>{sop.workflow}</div><div className="smallNote" style={{ marginTop: 4 }}>Trigger: {sop.trigger}</div><div style={{ marginTop: 8 }}><List items={sop.steps} emptyLabel="No steps listed." /></div></div></div>)}</div></div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel"><div className="panelHeader"><div>KPI / Results</div><div className="smallNote">How improvement will be measured.</div></div><div className="panelBody">{bundle.pie.kpis.length === 0 ? <div className="smallNote">No KPIs generated yet.</div> : bundle.pie.kpis.map((kpi, index) => <div key={`${kpi.name}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: 10 }}><div className="panelBody"><div style={{ fontWeight: 800 }}>{kpi.name}</div><div className="smallNote" style={{ marginTop: 4 }}>Target: {kpi.target}</div><div className="pDark" style={{ marginTop: 8 }}>{kpi.why}</div></div></div>)}</div></div>
        <div className="panel"><div className="panelHeader"><div>Risk Log</div><div className="smallNote">What could go wrong and how it will be handled.</div></div><div className="panelBody">{bundle.pie.risks.length === 0 ? <div className="smallNote">No risks logged yet.</div> : bundle.pie.risks.map((risk, index) => <div key={`${risk.risk}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: 10 }}><div className="panelBody"><div style={{ fontWeight: 800 }}>{risk.risk}</div><div className="pDark" style={{ marginTop: 8 }}>{risk.mitigation}</div></div></div>)}</div></div>
      </div>
    </main>
  );
}
