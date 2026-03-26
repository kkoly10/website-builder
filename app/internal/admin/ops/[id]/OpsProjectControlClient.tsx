"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { OpsWorkspaceBundle } from "@/lib/opsWorkspace/server";

/* ── helpers ── */

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
    return { bg: "rgba(46,160,67,0.14)", border: "rgba(46,160,67,0.34)", color: "#b7f5c4", label: pretty(status) };
  }
  if (["requested", "review", "new", "pending"].includes(s)) {
    return { bg: "rgba(201,168,76,0.14)", border: "rgba(201,168,76,0.34)", color: "#f1d98a", label: pretty(status) };
  }
  return { bg: "rgba(141,164,255,0.12)", border: "rgba(141,164,255,0.26)", color: "#d8e0ff", label: pretty(status || "new") };
}

/* ── tab definitions ── */

const TABS = [
  { key: "diagnosis", label: "Ops Diagnosis" },
  { key: "discovery", label: "Discovery" },
  { key: "callpie", label: "Call + PIE" },
  { key: "workflow", label: "Workflow Map" },
  { key: "systems", label: "Systems" },
  { key: "backlog", label: "Backlog" },
  { key: "quickwins", label: "Quick Wins" },
  { key: "plan", label: "Impl Plan" },
  { key: "sops", label: "SOPs" },
  { key: "kpis", label: "KPIs & Risks" },
  { key: "chat", label: "Ghost Admin" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── main component ── */

export default function OpsProjectControlClient({
  initialData,
}: {
  initialData: OpsWorkspaceBundle;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("diagnosis");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const intakeTone = useMemo(() => statusTone(initialData.intake.status), [initialData.intake.status]);
  const callTone = useMemo(() => statusTone(initialData.callRequest.status), [initialData.callRequest.status]);

  const handleNoteChange = useCallback((key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/internal/admin/ops/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId: initialData.intake.id, adminNotes: notes }),
      });
      const json = await res.json();
      setSaveMsg(json.ok ? "Saved" : json.error || "Save failed");
    } catch {
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }, [notes, initialData.intake.id]);

  return (
    <main className="section" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div className="card">
        <div className="cardInner">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="kicker"><span className="kickerDot" />Ops Project Control</div>
              <h1 className="h2" style={{ marginTop: 10 }}>{initialData.intake.companyName}</h1>
              <p className="pDark" style={{ marginTop: 6 }}>
                {initialData.intake.contactName} &bull; {initialData.intake.email}
              </p>
              <p className="pDark" style={{ marginTop: 6 }}>
                ID <code>{initialData.intake.id}</code> &bull; Created {fmtDate(initialData.intake.createdAt)}
              </p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Link href="/internal/admin/ops" className="btn btnGhost">Back to Ops HQ</Link>
              <Link href={`/portal/ops/${initialData.intake.id}`} className="btn btnPrimary">Client Workspace →</Link>
            </div>
          </div>

          <div className="grid4" style={{ marginTop: 18 }}>
            <StatCard label="Project Status" value={pretty(initialData.intake.status)} />
            <StatCard label="Recommendation" value={initialData.intake.recommendationTier} />
            <StatCard label="Best Tool" value={initialData.ghostAdmin.bestTool} />
            <StatCard label="Automation Readiness" value={initialData.ghostAdmin.automationReadiness} />
          </div>

          <div className="row" style={{ gap: 6, marginTop: 18 }}>
            <span style={{ ...badgeStyle(intakeTone) }}>Intake {intakeTone.label}</span>
            <span style={{ ...badgeStyle(callTone) }}>Call {callTone.label}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginTop: 18, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="btn"
            style={{
              background: activeTab === tab.key ? "var(--accent)" : "var(--panel2)",
              color: activeTab === tab.key ? "#000" : "var(--fg)",
              fontWeight: activeTab === tab.key ? 900 : 600,
              fontSize: 13,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Save bar */}
      <div className="row" style={{ marginTop: 12, gap: 10 }}>
        <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Notes"}
        </button>
        {saveMsg && <span className="smallNote">{saveMsg}</span>}
      </div>

      {/* Tab content */}
      <div style={{ marginTop: 18 }}>
        {activeTab === "diagnosis" && <DiagnosisTab data={initialData} notes={notes} onNote={handleNoteChange} />}
        {activeTab === "discovery" && <DiscoveryTab data={initialData} notes={notes} onNote={handleNoteChange} />}
        {activeTab === "callpie" && <CallPieTab data={initialData} notes={notes} onNote={handleNoteChange} />}
        {activeTab === "workflow" && <WorkflowTab data={initialData} notes={notes} onNote={handleNoteChange} />}
        {activeTab === "systems" && <SystemsTab data={initialData} notes={notes} onNote={handleNoteChange} />}
        {activeTab === "backlog" && <BacklogTab data={initialData} notes={notes} onNote={handleNoteChange} />}
        {activeTab === "quickwins" && <QuickWinsTab data={initialData} />}
        {activeTab === "plan" && <ImplPlanTab data={initialData} />}
        {activeTab === "sops" && <SopsTab data={initialData} />}
        {activeTab === "kpis" && <KpisRisksTab data={initialData} />}
        {activeTab === "chat" && <GhostAdminChat opsIntakeId={initialData.intake.id} starterPrompts={initialData.ghostAdmin.starterPrompts} />}
      </div>
    </main>
  );
}

/* ── shared sub-components ── */

function badgeStyle(tone: { bg: string; border: string; color: string }) {
  return {
    padding: "8px 12px",
    borderRadius: 999,
    background: tone.bg,
    border: `1px solid ${tone.border}`,
    color: tone.color,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  };
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

function Editable({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <textarea
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ resize: "vertical", width: "100%" }}
      />
    </div>
  );
}

function ListBlock({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) return <div className="smallNote">{emptyLabel}</div>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

type TabProps = { data: OpsWorkspaceBundle; notes: Record<string, string>; onNote: (key: string, value: string) => void };

/* ── Tab 1: Ops Diagnosis ── */

function DiagnosisTab({ data, notes, onNote }: TabProps) {
  return (
    <div className="grid2stretch">
      <div className="panel">
        <div className="panelHeader"><div>Ghost Admin Diagnosis</div><div className="smallNote">Automated analysis from intake + PIE.</div></div>
        <div className="panelBody">
          <div className="grid2">
            <ReadOnly label="Business Objective" value={data.ghostAdmin.businessObjective} />
            <ReadOnly label="Main Bottleneck" value={data.ghostAdmin.mainBottleneck} />
            <ReadOnly label="Root Cause" value={data.ghostAdmin.rootCause} />
            <ReadOnly label="Best First Fix" value={data.ghostAdmin.bestFirstFix} />
            <ReadOnly label="Risk Level" value={data.ghostAdmin.riskLevel} />
            <ReadOnly label="Tool Recommendation" value={data.ghostAdmin.bestTool} />
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="fieldLabel">Missing Discovery Info</div>
            <ListBlock items={data.ghostAdmin.missingInfo} emptyLabel="No missing info listed yet." />
          </div>
          <div style={{ marginTop: 18 }}>
            <Editable label="Admin Notes — Diagnosis" value={notes["diagnosis"] ?? ""} onChange={(v) => onNote("diagnosis", v)} />
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panelHeader"><div>Starter Prompts</div><div className="smallNote">Use these in the Ghost Admin chat tab.</div></div>
        <div className="panelBody">
          <ListBlock items={data.ghostAdmin.starterPrompts} emptyLabel="No prompts listed yet." />
        </div>
      </div>
    </div>
  );
}

/* ── Tab 2: Discovery ── */

function DiscoveryTab({ data, notes, onNote }: TabProps) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>Discovery Snapshot</div><div className="smallNote">Core intake information and workflow request context.</div></div>
      <div className="panelBody">
        <div className="grid2">
          <ReadOnly label="Industry" value={data.intake.industry} />
          <ReadOnly label="Team Size" value={data.intake.teamSize} />
          <ReadOnly label="Job Volume" value={data.intake.jobVolume} />
          <ReadOnly label="Urgency" value={data.intake.urgency} />
          <ReadOnly label="Readiness" value={data.intake.readiness} />
          <ReadOnly label="Recommendation Range" value={data.intake.recommendationPriceRange} />
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="fieldLabel">Current Tools</div>
          <ListBlock items={data.intake.currentTools} emptyLabel="No tools listed in intake." />
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="fieldLabel">Pain Points</div>
          <ListBlock items={data.intake.painPoints} emptyLabel="No pain points listed." />
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="fieldLabel">Requested Workflows</div>
          <ListBlock items={data.intake.workflowsNeeded} emptyLabel="No workflow requests listed." />
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="fieldLabel">Intake Notes</div>
          <div className="panel" style={{ background: "var(--panel2)" }}>
            <div className="panelBody"><div className="pDark" style={{ whiteSpace: "pre-wrap" }}>{data.intake.notes || "No intake notes yet."}</div></div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Editable label="Admin Notes — Discovery" value={notes["discovery"] ?? ""} onChange={(v) => onNote("discovery", v)} />
        </div>
      </div>
    </div>
  );
}

/* ── Tab 3: Call + PIE ── */

function CallPieTab({ data, notes, onNote }: TabProps) {
  return (
    <div className="grid2stretch">
      <div className="panel">
        <div className="panelHeader"><div>Call + PIE Intelligence</div><div className="smallNote">Discovery progress and operations intelligence.</div></div>
        <div className="panelBody">
          <div className="grid2">
            <ReadOnly label="Best Time" value={data.callRequest.bestTime} />
            <ReadOnly label="Timezone" value={data.callRequest.timezone} />
            <ReadOnly label="PIE Confidence" value={pretty(data.pie.confidence)} />
            <ReadOnly label="Recommended Package" value={data.pie.recommendedOffer.primaryPackage} />
            <ReadOnly label="Project Range" value={data.pie.recommendedOffer.projectRange} />
            <ReadOnly label="Retainer Range" value={data.pie.recommendedOffer.retainerRange} />
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="fieldLabel">PIE Summary</div>
            <div className="panel" style={{ background: "var(--panel2)" }}>
              <div className="panelBody"><div className="pDark" style={{ whiteSpace: "pre-wrap" }}>{data.pie.summary}</div></div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="fieldLabel">Offer Rationale</div>
            <div className="pDark">{data.pie.recommendedOffer.why}</div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Editable label="Admin Notes — Call/PIE" value={notes["callpie"] ?? ""} onChange={(v) => onNote("callpie", v)} />
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panelHeader"><div>Client Questions</div><div className="smallNote">Follow-up questions from PIE.</div></div>
        <div className="panelBody">
          <ListBlock items={data.pie.clientQuestions} emptyLabel="No follow-up questions generated yet." />
        </div>
      </div>
    </div>
  );
}

/* ── Tab 4: Workflow Map ── */

function WorkflowTab({ data, notes, onNote }: TabProps) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>Workflow Map</div><div className="smallNote">Current-state versus future-state process.</div></div>
      <div className="panelBody">
        <div className="grid2">
          <div>
            <div className="fieldLabel">Current Process</div>
            <ListBlock items={data.workflowMap.currentState} emptyLabel="Current process not mapped yet." />
          </div>
          <div>
            <div className="fieldLabel">Future Process</div>
            <ListBlock items={data.workflowMap.futureState} emptyLabel="Future process not mapped yet." />
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Editable label="Admin Notes — Workflow" value={notes["workflow"] ?? ""} onChange={(v) => onNote("workflow", v)} />
        </div>
      </div>
    </div>
  );
}

/* ── Tab 5: Systems ── */

function SystemsTab({ data, notes, onNote }: TabProps) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>Systems & Access</div><div className="smallNote">Connected tools and source-of-truth mapping.</div></div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {data.systems.length === 0 ? (
          <div className="smallNote">No systems mapped yet.</div>
        ) : (
          data.systems.map((system, index) => (
            <div key={`${system.name}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
              <div className="panelBody">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{system.name}</div>
                    <div className="smallNote" style={{ marginTop: 4 }}>{system.role}</div>
                  </div>
                  <span className="badge">{system.status}</span>
                </div>
                <div className="pDark" style={{ marginTop: 10 }}>{system.notes}</div>
              </div>
            </div>
          ))
        )}
        <div style={{ marginTop: 12 }}>
          <Editable label="Admin Notes — Systems" value={notes["systems"] ?? ""} onChange={(v) => onNote("systems", v)} />
        </div>
      </div>
    </div>
  );
}

/* ── Tab 6: Backlog ── */

function BacklogTab({ data, notes, onNote }: TabProps) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>Automation Backlog</div><div className="smallNote">Build board and automation blueprint.</div></div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {data.backlog.length === 0 ? (
          <div className="smallNote">No backlog cards generated yet.</div>
        ) : (
          data.backlog.map((item) => (
            <div key={item.id} className="panel" style={{ background: "var(--panel2)" }}>
              <div className="panelBody">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{item.name}</div>
                    <div className="smallNote" style={{ marginTop: 4 }}>{item.status} &bull; {item.priority} priority &bull; {item.toolRecommendation}</div>
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
        <div style={{ marginTop: 12 }}>
          <Editable label="Admin Notes — Backlog" value={notes["backlog"] ?? ""} onChange={(v) => onNote("backlog", v)} />
        </div>
      </div>
    </div>
  );
}

/* ── Tab 7: Quick Wins ── */

function QuickWinsTab({ data }: { data: OpsWorkspaceBundle }) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>Quick Wins</div><div className="smallNote">Low-effort, high-impact automations to start with.</div></div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {data.pie.quickWins.length === 0 ? (
          <div className="smallNote">No quick wins generated yet.</div>
        ) : (
          data.pie.quickWins.map((win, index) => (
            <div key={`${win.title}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
              <div className="panelBody">
                <div style={{ fontWeight: 800 }}>{win.title}</div>
                <div className="pDark" style={{ marginTop: 8 }}>{win.why}</div>
                <div className="smallNote" style={{ marginTop: 8 }}>Owner: {win.owner} &bull; ETA: {win.eta}</div>
                <div style={{ marginTop: 10 }}><ListBlock items={win.steps} emptyLabel="No steps listed." /></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Tab 8: Implementation Plan ── */

function ImplPlanTab({ data }: { data: OpsWorkspaceBundle }) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>Implementation Plan</div><div className="smallNote">Phased build roadmap.</div></div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {data.pie.implementationPlan.length === 0 ? (
          <div className="smallNote">No implementation plan generated yet.</div>
        ) : (
          data.pie.implementationPlan.map((phase, index) => (
            <div key={`${phase.phase}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
              <div className="panelBody">
                <div style={{ fontWeight: 800 }}>{phase.phase}</div>
                <div className="pDark" style={{ marginTop: 8 }}>{phase.goal}</div>
                <div className="smallNote" style={{ marginTop: 8 }}>Estimated days: {phase.estimateDays}</div>
                <div className="grid2" style={{ marginTop: 12 }}>
                  <div><div className="fieldLabel">Deliverables</div><ListBlock items={phase.deliverables} emptyLabel="No deliverables listed." /></div>
                  <div><div className="fieldLabel">Automations</div><ListBlock items={phase.automations} emptyLabel="No automations listed." /></div>
                  <div><div className="fieldLabel">Tech Stack</div><ListBlock items={phase.techStack} emptyLabel="No stack listed." /></div>
                  <div><div className="fieldLabel">Acceptance Criteria</div><ListBlock items={phase.acceptanceCriteria} emptyLabel="No criteria listed." /></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Tab 9: SOPs ── */

function SopsTab({ data }: { data: OpsWorkspaceBundle }) {
  return (
    <div className="panel">
      <div className="panelHeader"><div>SOP Drafts</div><div className="smallNote">Standard operating procedures generated from PIE.</div></div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {data.pie.sops.length === 0 ? (
          <div className="smallNote">No SOP drafts generated yet.</div>
        ) : (
          data.pie.sops.map((sop, index) => (
            <div key={`${sop.workflow}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
              <div className="panelBody">
                <div style={{ fontWeight: 800 }}>{sop.workflow}</div>
                <div className="smallNote" style={{ marginTop: 4 }}>Trigger: {sop.trigger}</div>
                <div className="grid2" style={{ marginTop: 12 }}>
                  <div><div className="fieldLabel">Steps</div><ListBlock items={sop.steps} emptyLabel="No steps listed." /></div>
                  <div><div className="fieldLabel">Exceptions</div><ListBlock items={sop.exceptions} emptyLabel="No exceptions listed." /></div>
                </div>
                <div style={{ marginTop: 12 }}><div className="fieldLabel">Metrics</div><ListBlock items={sop.metrics} emptyLabel="No metrics listed." /></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Tab 10: KPIs & Risks ── */

function KpisRisksTab({ data }: { data: OpsWorkspaceBundle }) {
  return (
    <div className="grid2stretch">
      <div className="panel">
        <div className="panelHeader"><div>KPIs</div><div className="smallNote">Measurement targets.</div></div>
        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          {data.pie.kpis.length === 0 ? (
            <div className="smallNote">No KPIs generated yet.</div>
          ) : (
            data.pie.kpis.map((kpi, index) => (
              <div key={`${kpi.name}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
                <div className="panelBody">
                  <div style={{ fontWeight: 800 }}>{kpi.name}</div>
                  <div className="smallNote" style={{ marginTop: 4 }}>Target: {kpi.target}</div>
                  <div className="pDark" style={{ marginTop: 8 }}>{kpi.why}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="panel">
        <div className="panelHeader"><div>Risk Log</div><div className="smallNote">Known risks and mitigations.</div></div>
        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          {data.pie.risks.length === 0 ? (
            <div className="smallNote">No risks logged yet.</div>
          ) : (
            data.pie.risks.map((risk, index) => (
              <div key={`${risk.risk}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
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
  );
}

/* ── Tab 11: Ghost Admin Chat ── */

type ChatMsg = { id: string; role: "user" | "assistant"; content: string; timestamp: string };

function GhostAdminChat({ opsIntakeId, starterPrompts }: { opsIntakeId: string; starterPrompts: string[] }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/internal/admin/ops/chat?opsIntakeId=${encodeURIComponent(opsIntakeId)}`);
      const json = await res.json();
      if (json.ok && json.messages) setMessages(json.messages);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, [opsIntakeId]);

  if (!loaded) loadHistory();

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/internal/admin/ops/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId, message: msg }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessages((prev) => [...prev, json.userMessage, json.assistantMessage]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [input, loading, opsIntakeId]);

  return (
    <div className="panel">
      <div className="panelHeader"><div>Ghost Admin Chat</div><div className="smallNote">Project-aware AI operations advisor.</div></div>
      <div className="panelBody">
        {/* Starter prompts */}
        {messages.length === 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="fieldLabel">Quick Prompts</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="btn btnGhost"
                  style={{ fontSize: 13 }}
                  onClick={() => send(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ display: "grid", gap: 12, maxHeight: 500, overflowY: "auto", marginBottom: 18 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: 14,
                borderRadius: 12,
                background: msg.role === "user" ? "rgba(141,164,255,0.1)" : "rgba(46,160,67,0.08)",
                border: `1px solid ${msg.role === "user" ? "rgba(141,164,255,0.2)" : "rgba(46,160,67,0.2)"}`,
              }}
            >
              <div className="smallNote" style={{ marginBottom: 6 }}>
                {msg.role === "user" ? "You" : "Ghost Admin"} &bull; {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
              <div className="pDark" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(46,160,67,0.08)", border: "1px solid rgba(46,160,67,0.2)" }}>
              <div className="smallNote">Ghost Admin is thinking...</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="row" style={{ gap: 8 }}>
          <textarea
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Ghost Admin about this project..."
            rows={2}
            style={{ flex: 1, resize: "vertical" }}
          />
          <button className="btn btnPrimary" onClick={() => send()} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
