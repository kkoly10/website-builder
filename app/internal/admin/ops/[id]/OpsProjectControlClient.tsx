"use client";

import Link from "next/link";
import type { OpsWorkspaceBundle } from "@/lib/opsWorkspace/server";

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (["active", "approved", "live", "completed", "ready"].includes(s)) {
    return {
      bg: "rgba(46, 160, 67, 0.14)",
      border: "rgba(46, 160, 67, 0.34)",
      color: "#b7f5c4",
      label: pretty(status),
    };
  }

  if (["requested", "review", "new", "pending"].includes(s)) {
    return {
      bg: "rgba(201, 168, 76, 0.14)",
      border: "rgba(201, 168, 76, 0.34)",
      color: "#f1d98a",
      label: pretty(status),
    };
  }

  return {
    bg: "rgba(141, 164, 255, 0.12)",
    border: "rgba(141, 164, 255, 0.26)",
    color: "#d8e0ff",
    label: pretty(status || "new"),
  };
}

export default function OpsProjectControlClient({
  initialData,
}: {
  initialData: OpsWorkspaceBundle;
}) {
  const intakeTone = statusTone(initialData.intake.status);
  const callTone = statusTone(initialData.callRequest.status);

  return (
    <main className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="kicker">
                <span className="kickerDot" />
                Ops Project Control
              </div>
              <h1 className="h2" style={{ marginTop: 10 }}>
                {initialData.intake.companyName}
              </h1>
              <p className="pDark" style={{ marginTop: 6 }}>
                {initialData.intake.contactName} • {initialData.intake.email}
              </p>
              <p className="pDark" style={{ marginTop: 6 }}>
                Ops Intake ID <code>{initialData.intake.id}</code> • Created {fmtDate(initialData.intake.createdAt)}
              </p>
            </div>

            <div className="row">
              <Link href="/internal/admin/ops" className="btn btnGhost">
                Back to Ops HQ
              </Link>
              <Link href={`/portal/ops/${initialData.intake.id}`} className="btn btnPrimary">
                Client Workspace →
              </Link>
            </div>
          </div>

          <div className="grid4" style={{ marginTop: 18 }}>
            <StatCard label="Project Status" value={pretty(initialData.intake.status)} />
            <StatCard label="Recommendation" value={initialData.intake.recommendationTier} />
            <StatCard label="Best Tool" value={initialData.ghostAdmin.bestTool} />
            <StatCard label="Automation Readiness" value={initialData.ghostAdmin.automationReadiness} />
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Ops Diagnosis</div>
            <div className="smallNote">Ghost Admin reads the intake and frames the project before build work starts.</div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <ReadOnly label="Business Objective" value={initialData.ghostAdmin.businessObjective} />
              <ReadOnly label="Main Bottleneck" value={initialData.ghostAdmin.mainBottleneck} />
              <ReadOnly label="Root Cause" value={initialData.ghostAdmin.rootCause} />
              <ReadOnly label="Best First Fix" value={initialData.ghostAdmin.bestFirstFix} />
              <ReadOnly label="Risk Level" value={initialData.ghostAdmin.riskLevel} />
              <ReadOnly label="Tool Recommendation" value={initialData.ghostAdmin.bestTool} />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Missing discovery info</div>
              <ListBlock items={initialData.ghostAdmin.missingInfo} emptyLabel="No missing info listed yet." />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Ghost Admin starter prompts</div>
              <ListBlock items={initialData.ghostAdmin.starterPrompts} emptyLabel="No prompts listed yet." />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>Discovery Snapshot</div>
            <div className="smallNote">Core intake information and workflow request context.</div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <ReadOnly label="Industry" value={initialData.intake.industry} />
              <ReadOnly label="Team Size" value={initialData.intake.teamSize} />
              <ReadOnly label="Job Volume" value={initialData.intake.jobVolume} />
              <ReadOnly label="Urgency" value={initialData.intake.urgency} />
              <ReadOnly label="Readiness" value={initialData.intake.readiness} />
              <ReadOnly label="Recommendation Range" value={initialData.intake.recommendationPriceRange} />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Current Tools</div>
              <ListBlock items={initialData.intake.currentTools} emptyLabel="No tools listed in intake." />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Pain Points</div>
              <ListBlock items={initialData.intake.painPoints} emptyLabel="No pain points listed in intake." />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Requested Workflows</div>
              <ListBlock items={initialData.intake.workflowsNeeded} emptyLabel="No workflow requests listed in intake." />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Intake Notes</div>
              <div className="panel" style={{ background: "var(--panel2)" }}>
                <div className="panelBody">
                  <div className="pDark" style={{ whiteSpace: "pre-wrap" }}>
                    {initialData.intake.notes || "No intake notes yet."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Call + PIE Intelligence</div>
            <div className="smallNote">Discovery progress and the current operations intelligence layer.</div>
          </div>
          <div className="panelBody">
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "8px 12px", borderRadius: 999, background: intakeTone.bg, border: `1px solid ${intakeTone.border}`, color: intakeTone.color, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Intake {intakeTone.label}
              </span>
              <span style={{ padding: "8px 12px", borderRadius: 999, background: callTone.bg, border: `1px solid ${callTone.border}`, color: callTone.color, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Call {callTone.label}
              </span>
            </div>

            <div className="grid2" style={{ marginTop: 18 }}>
              <ReadOnly label="Best Time" value={initialData.callRequest.bestTime} />
              <ReadOnly label="Timezone" value={initialData.callRequest.timezone} />
              <ReadOnly label="PIE Confidence" value={pretty(initialData.pie.confidence)} />
              <ReadOnly label="Recommended Package" value={initialData.pie.recommendedOffer.primaryPackage} />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">PIE Summary</div>
              <div className="panel" style={{ background: "var(--panel2)" }}>
                <div className="panelBody">
                  <div className="pDark" style={{ whiteSpace: "pre-wrap" }}>
                    {initialData.pie.summary}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Client Questions</div>
              <ListBlock items={initialData.pie.clientQuestions} emptyLabel="No follow-up questions generated yet." />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>Workflow Map</div>
            <div className="smallNote">Current-state pain versus future-state target process.</div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="fieldLabel">Current Process</div>
                <ListBlock items={initialData.workflowMap.currentState} emptyLabel="Current process not mapped yet." />
              </div>
              <div>
                <div className="fieldLabel">Future Process</div>
                <ListBlock items={initialData.workflowMap.futureState} emptyLabel="Future process not mapped yet." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Systems & Access</div>
            <div className="smallNote">Use this to confirm what tools exist and which one should become the source of truth.</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            {initialData.systems.length === 0 ? (
              <div className="smallNote">No systems have been mapped yet.</div>
            ) : (
              initialData.systems.map((system, index) => (
                <div key={`${system.name}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
                  <div className="panelBody">
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{system.name}</div>
                        <div className="smallNote" style={{ marginTop: 4 }}>
                          {system.role}
                        </div>
                      </div>
                      <span className="badge">{system.status}</span>
                    </div>
                    <div className="pDark" style={{ marginTop: 10 }}>
                      {system.notes}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>Automation Backlog</div>
            <div className="smallNote">This is the first version of the ops build board and automation blueprint.</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            {initialData.backlog.length === 0 ? (
              <div className="smallNote">No backlog cards generated yet.</div>
            ) : (
              initialData.backlog.map((item) => (
                <div key={item.id} className="panel" style={{ background: "var(--panel2)" }}>
                  <div className="panelBody">
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{item.name}</div>
                        <div className="smallNote" style={{ marginTop: 4 }}>
                          {item.status} • {item.priority} priority • {item.toolRecommendation}
                        </div>
                      </div>
                      <span className="badge">{item.trigger}</span>
                    </div>
                    <div className="pDark" style={{ marginTop: 10 }}>{item.purpose}</div>
                    <div style={{ marginTop: 12 }}>
                      <div className="fieldLabel">Actions</div>
                      <ListBlock items={item.actions} emptyLabel="No actions listed yet." />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div className="fieldLabel">Fallback</div>
                      <div className="pDark">{item.fallback}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Quick Wins + Implementation Plan</div>
            <div className="smallNote">Use this section to decide what gets built first and what phases come next.</div>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="fieldLabel">Quick Wins</div>
              {initialData.pie.quickWins.length === 0 ? (
                <div className="smallNote">No quick wins generated yet.</div>
              ) : (
                initialData.pie.quickWins.map((win, index) => (
                  <div key={`${win.title}-${index}`} className="panel" style={{ marginTop: 10, background: "var(--panel2)" }}>
                    <div className="panelBody">
                      <div style={{ fontWeight: 800 }}>{win.title}</div>
                      <div className="pDark" style={{ marginTop: 8 }}>{win.why}</div>
                      <div className="smallNote" style={{ marginTop: 8 }}>
                        Owner: {win.owner} • ETA: {win.eta}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <ListBlock items={win.steps} emptyLabel="No steps listed." />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Implementation Plan</div>
              {initialData.pie.implementationPlan.length === 0 ? (
                <div className="smallNote">No implementation plan generated yet.</div>
              ) : (
                initialData.pie.implementationPlan.map((phase, index) => (
                  <div key={`${phase.phase}-${index}`} className="panel" style={{ marginTop: 10, background: "var(--panel2)" }}>
                    <div className="panelBody">
                      <div style={{ fontWeight: 800 }}>{phase.phase}</div>
                      <div className="pDark" style={{ marginTop: 8 }}>{phase.goal}</div>
                      <div className="smallNote" style={{ marginTop: 8 }}>
                        Estimated days: {phase.estimateDays}
                      </div>
                      <div className="grid2" style={{ marginTop: 12 }}>
                        <div>
                          <div className="fieldLabel">Deliverables</div>
                          <ListBlock items={phase.deliverables} emptyLabel="No deliverables listed." />
                        </div>
                        <div>
                          <div className="fieldLabel">Automations</div>
                          <ListBlock items={phase.automations} emptyLabel="No automations listed." />
                        </div>
                        <div>
                          <div className="fieldLabel">Tech Stack</div>
                          <ListBlock items={phase.techStack} emptyLabel="No stack listed." />
                        </div>
                        <div>
                          <div className="fieldLabel">Acceptance Criteria</div>
                          <ListBlock items={phase.acceptanceCriteria} emptyLabel="No acceptance criteria listed." />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>SOPs, KPIs, and Risks</div>
            <div className="smallNote">This is the first Ghost Admin training center for the ops lane.</div>
          </div>
          <div className="panelBody">
            <div>
              <div className="fieldLabel">SOP Drafts</div>
              {initialData.pie.sops.length === 0 ? (
                <div className="smallNote">No SOP drafts generated yet.</div>
              ) : (
                initialData.pie.sops.map((sop, index) => (
                  <div key={`${sop.workflow}-${index}`} className="panel" style={{ marginTop: 10, background: "var(--panel2)" }}>
                    <div className="panelBody">
                      <div style={{ fontWeight: 800 }}>{sop.workflow}</div>
                      <div className="smallNote" style={{ marginTop: 4 }}>
                        Trigger: {sop.trigger}
                      </div>
                      <div className="grid2" style={{ marginTop: 12 }}>
                        <div>
                          <div className="fieldLabel">Steps</div>
                          <ListBlock items={sop.steps} emptyLabel="No steps listed." />
                        </div>
                        <div>
                          <div className="fieldLabel">Exceptions</div>
                          <ListBlock items={sop.exceptions} emptyLabel="No exceptions listed." />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">KPIs</div>
              {initialData.pie.kpis.length === 0 ? (
                <div className="smallNote">No KPIs generated yet.</div>
              ) : (
                initialData.pie.kpis.map((kpi, index) => (
                  <div key={`${kpi.name}-${index}`} className="panel" style={{ marginTop: 10, background: "var(--panel2)" }}>
                    <div className="panelBody">
                      <div style={{ fontWeight: 800 }}>{kpi.name}</div>
                      <div className="smallNote" style={{ marginTop: 4 }}>
                        Target: {kpi.target}
                      </div>
                      <div className="pDark" style={{ marginTop: 8 }}>{kpi.why}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Risks</div>
              {initialData.pie.risks.length === 0 ? (
                <div className="smallNote">No risk notes generated yet.</div>
              ) : (
                initialData.pie.risks.map((risk, index) => (
                  <div key={`${risk.risk}-${index}`} className="panel" style={{ marginTop: 10, background: "var(--panel2)" }}>
                    <div className="panelBody">
                      <div style={{ fontWeight: 800 }}>{risk.risk}</div>
                      <div className="pDark" style={{ marginTop: 8 }}>{risk.mitigation}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div className="smallNote">{label}</div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: 24 }}>{value}</div>
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <input className="input" value={value} disabled />
    </div>
  );
}

function ListBlock({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <div className="smallNote">{emptyLabel}</div>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
