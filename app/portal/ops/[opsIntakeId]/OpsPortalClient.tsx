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

function Badge({ style: s }: { style: { bg: string; border: string; color: string; label: string } }) {
  return (
    <span style={{ padding: "8px 12px", borderRadius: 999, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {s.label}
    </span>
  );
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
      {/* Hero */}
      <div className="heroFadeUp">
        <div className="kicker"><span className="kickerDot" aria-hidden="true" />Systems Lab</div>
        <div style={{ height: 12 }} />
        <h1 className="h1">{bundle.intake.companyName}</h1>
        <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
          This workspace shows the operations problem we are solving, the systems involved, and the full automation plan.
        </p>
        <div className="row" style={{ marginTop: 16, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <Badge style={intakeTone} />
          <Badge style={{ ...callTone, label: `Call ${callTone.label}` }} />
          <span className="badge">{bundle.intake.recommendationTier}</span>
          <span className="badge">{bundle.ghostAdmin.bestTool}</span>
          <span className="badge">{bundle.ghostAdmin.automationReadiness} readiness</span>
        </div>
        <div className="row" style={{ marginTop: 16, gap: 8 }}>
          <button className="btn btnGhost" onClick={refresh} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh Workspace"}</button>
          <Link href="/portal" className="btn btnGhost">Back to Portal</Link>
        </div>
      </div>

      {error ? <div style={{ marginTop: 16, border: "1px solid rgba(255,0,0,0.35)", background: "rgba(255,0,0,0.08)", borderRadius: 14, padding: 14, fontWeight: 700 }}>{error}</div> : null}

      {/* 1. Problem We're Solving */}
      <div className="grid2stretch" style={{ marginTop: 24 }}>
        <div className="panel">
          <div className="panelHeader"><div>Problem We&apos;re Solving</div><div className="smallNote">Client-facing summary of the ops challenge.</div></div>
          <div className="panelBody">
            <div className="pDark" style={{ fontSize: 16, fontWeight: 700 }}>{bundle.ghostAdmin.businessObjective}</div>
            <div style={{ marginTop: 14 }}>
              <div className="fieldLabel">Key Findings</div>
              <List items={[bundle.ghostAdmin.mainBottleneck, bundle.ghostAdmin.rootCause, bundle.ghostAdmin.bestFirstFix].filter(Boolean)} emptyLabel="No diagnosis yet." />
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="fieldLabel">Risk Level</div>
              <span className="badge">{bundle.ghostAdmin.riskLevel}</span>
            </div>
          </div>
        </div>

        {/* 2. Current vs New Process */}
        <div className="panel">
          <div className="panelHeader"><div>Current vs New Process</div><div className="smallNote">How the workflow should improve.</div></div>
          <div className="panelBody">
            <div className="fieldLabel">Current Process</div>
            <List items={bundle.workflowMap.currentState} emptyLabel="Current process not mapped yet." />
            <div className="fieldLabel" style={{ marginTop: 14 }}>Future Process</div>
            <List items={bundle.workflowMap.futureState} emptyLabel="Future process not mapped yet." />
          </div>
        </div>
      </div>

      {/* 3. Connected Systems + 4. Waiting on Client */}
      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader"><div>Connected Systems</div><div className="smallNote">Tools and platforms in scope.</div></div>
          <div className="panelBody">
            {bundle.systems.length === 0 ? <div className="smallNote">No systems mapped yet.</div> : bundle.systems.map((system, index) => (
              <div key={`${system.name}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: index > 0 ? 10 : 0 }}>
                <div className="panelBody">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{system.name}</div>
                      <div className="smallNote" style={{ marginTop: 4 }}>{system.role}</div>
                    </div>
                    <span className="badge">{system.status}</span>
                  </div>
                  <div className="pDark" style={{ marginTop: 8 }}>{system.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader"><div>Waiting on Client</div><div className="smallNote">What still needs your input.</div></div>
          <div className="panelBody">
            <List items={bundle.ghostAdmin.missingInfo} emptyLabel="Nothing is waiting on the client right now." />
          </div>
        </div>
      </div>

      {/* 5. Automation Backlog + 6. Quick Wins */}
      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader"><div>Automation Backlog</div><div className="smallNote">What we plan to build.</div></div>
          <div className="panelBody">
            {bundle.backlog.length === 0 ? <div className="smallNote">No backlog items generated yet.</div> : bundle.backlog.map((item) => (
              <div key={item.id} className="panel" style={{ background: "var(--panel2)", marginTop: 10 }}>
                <div className="panelBody">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{item.name}</div>
                      <div className="smallNote" style={{ marginTop: 4 }}>{item.status} &bull; {item.priority} &bull; {item.toolRecommendation}</div>
                    </div>
                    <span className="badge">{item.trigger}</span>
                  </div>
                  <div className="pDark" style={{ marginTop: 8 }}>{item.purpose}</div>
                  <div style={{ marginTop: 10 }}>
                    <div className="fieldLabel">Actions</div>
                    <List items={item.actions} emptyLabel="No actions listed." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader"><div>Quick Wins</div><div className="smallNote">Fast improvements we can make now.</div></div>
          <div className="panelBody">
            {bundle.pie.quickWins.length === 0 ? <div className="smallNote">No quick wins identified yet.</div> : bundle.pie.quickWins.map((win, index) => (
              <div key={`${win.title}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: index > 0 ? 10 : 0 }}>
                <div className="panelBody">
                  <div style={{ fontWeight: 800 }}>{win.title}</div>
                  <div className="pDark" style={{ marginTop: 6 }}>{win.why}</div>
                  <div className="smallNote" style={{ marginTop: 6 }}>Owner: {win.owner} &bull; ETA: {win.eta}</div>
                  <div style={{ marginTop: 8 }}><List items={win.steps} emptyLabel="No steps listed." /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Implementation Plan + 8. SOPs */}
      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader"><div>Implementation Plan</div><div className="smallNote">Phased build roadmap.</div></div>
          <div className="panelBody">
            {bundle.pie.implementationPlan.length === 0 ? <div className="smallNote">No plan generated yet.</div> : bundle.pie.implementationPlan.map((phase, index) => (
              <div key={`${phase.phase}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: index > 0 ? 10 : 0 }}>
                <div className="panelBody">
                  <div style={{ fontWeight: 800 }}>{phase.phase}</div>
                  <div className="pDark" style={{ marginTop: 6 }}>{phase.goal}</div>
                  <div className="smallNote" style={{ marginTop: 6 }}>Est: {phase.estimateDays} days</div>
                  <div style={{ marginTop: 8 }}>
                    <div className="fieldLabel">Deliverables</div>
                    <List items={phase.deliverables} emptyLabel="No deliverables listed." />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div className="fieldLabel">Automations</div>
                    <List items={phase.automations} emptyLabel="No automations listed." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader"><div>SOPs / Training</div><div className="smallNote">Operational instructions for your team.</div></div>
          <div className="panelBody">
            {bundle.pie.sops.length === 0 ? <div className="smallNote">No SOPs published yet.</div> : bundle.pie.sops.map((sop, index) => (
              <div key={`${sop.workflow}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: index > 0 ? 10 : 0 }}>
                <div className="panelBody">
                  <div style={{ fontWeight: 800 }}>{sop.workflow}</div>
                  <div className="smallNote" style={{ marginTop: 4 }}>Trigger: {sop.trigger}</div>
                  <div style={{ marginTop: 8 }}><List items={sop.steps} emptyLabel="No steps listed." /></div>
                  {sop.exceptions.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div className="fieldLabel">Exceptions</div>
                      <List items={sop.exceptions} emptyLabel="" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9. KPIs + 10. Risk Log */}
      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader"><div>KPI / Results</div><div className="smallNote">How improvement will be measured.</div></div>
          <div className="panelBody">
            {bundle.pie.kpis.length === 0 ? <div className="smallNote">No KPIs generated yet.</div> : bundle.pie.kpis.map((kpi, index) => (
              <div key={`${kpi.name}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: index > 0 ? 10 : 0 }}>
                <div className="panelBody">
                  <div style={{ fontWeight: 800 }}>{kpi.name}</div>
                  <div className="smallNote" style={{ marginTop: 4 }}>Target: {kpi.target}</div>
                  <div className="pDark" style={{ marginTop: 8 }}>{kpi.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader"><div>Risk Log</div><div className="smallNote">What could go wrong and how it will be handled.</div></div>
          <div className="panelBody">
            {bundle.pie.risks.length === 0 ? <div className="smallNote">No risks logged yet.</div> : bundle.pie.risks.map((risk, index) => (
              <div key={`${risk.risk}-${index}`} className="panel" style={{ background: "var(--panel2)", marginTop: index > 0 ? 10 : 0 }}>
                <div className="panelBody">
                  <div style={{ fontWeight: 800 }}>{risk.risk}</div>
                  <div className="pDark" style={{ marginTop: 8 }}>{risk.mitigation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 11. Recommended Offer + 12. Next Actions */}
      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader"><div>Recommended Service</div><div className="smallNote">What we recommend based on the audit.</div></div>
          <div className="panelBody">
            <div style={{ fontWeight: 800, fontSize: 20 }}>{bundle.pie.recommendedOffer.primaryPackage}</div>
            <div className="pDark" style={{ marginTop: 8 }}>{bundle.pie.recommendedOffer.why}</div>
            <div className="grid2" style={{ marginTop: 14 }}>
              <div>
                <div className="fieldLabel">Project Range</div>
                <div className="pDark">{bundle.pie.recommendedOffer.projectRange}</div>
              </div>
              <div>
                <div className="fieldLabel">Retainer Range</div>
                <div className="pDark">{bundle.pie.recommendedOffer.retainerRange}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader"><div>Next Actions</div><div className="smallNote">What happens next in your project.</div></div>
          <div className="panelBody">
            <List items={bundle.pie.nextActions} emptyLabel="No next actions defined yet. Check back after your discovery call." />
            {bundle.pie.clientQuestions.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div className="fieldLabel">Questions for You</div>
                <List items={bundle.pie.clientQuestions} emptyLabel="" />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
