"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  EnrichedOpsWorkspaceBundle,
  WorkspaceApproval,
  WorkspaceAutomation,
  WorkspaceChangeRequest,
  WorkspaceIncident,
  WorkspaceKpi,
  WorkspaceQaItem,
  WorkspaceRisk,
  WorkspaceSop,
  WorkspaceSystem,
} from "@/lib/opsWorkspace/state";

type TabKey =
  | "overview"
  | "workflow"
  | "systems"
  | "backlog"
  | "operations"
  | "chat";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "workflow", label: "Workflow" },
  { key: "systems", label: "Systems" },
  { key: "backlog", label: "Backlog" },
  { key: "operations", label: "Ops Control" },
  { key: "chat", label: "Ghost Admin" },
];

const OPS_PIPELINE_STAGES = [
  "new",
  "discovery",
  "scoping",
  "proposal_sent",
  "agreement_sent",
  "agreement_accepted",
  "deposit_sent",
  "deposit_paid",
  "in_progress",
  "process_mapping",
  "building",
  "testing",
  "live",
  "retainer_active",
  "completed",
  "closed_lost",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

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

function tone(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (["active", "approved", "live", "completed", "ready"].includes(s)) {
    return {
      bg: "rgba(46,160,67,0.14)",
      border: "rgba(46,160,67,0.34)",
      color: "#b7f5c4",
      label: pretty(status),
    };
  }
  if (
    ["requested", "review", "new", "pending", "scoped", "planning", "process mapping", "discovery"].includes(
      s
    )
  ) {
    return {
      bg: "rgba(201,168,76,0.14)",
      border: "rgba(201,168,76,0.34)",
      color: "#f1d98a",
      label: pretty(status),
    };
  }
  return {
    bg: "rgba(141,164,255,0.12)",
    border: "rgba(141,164,255,0.26)",
    color: "#d8e0ff",
    label: pretty(status || "new"),
  };
}

function linesToList(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toJson<T>(value: T) {
  return JSON.stringify(value, null, 2);
}

function parseArrayJson<T>(value: string, fieldLabel: string): T[] {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldLabel} must be a JSON array.`);
    }
    return parsed as T[];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : `${fieldLabel} is invalid JSON.`);
  }
}

export default function OpsProjectControlClient({
  initialData,
}: {
  initialData: EnrichedOpsWorkspaceBundle;
}) {
  const [bundle, setBundle] = useState(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [pipelineStatus, setPipelineStatus] = useState(
    initialData.workspace.pipelineStatus || "new"
  );
  const [phase, setPhase] = useState(initialData.workspace.phase);
  const [waitingOn, setWaitingOn] = useState(initialData.workspace.waitingOn);
  const [adminPublicNote, setAdminPublicNote] = useState(
    initialData.workspace.adminPublicNote
  );
  const [internalDiagnosisNote, setInternalDiagnosisNote] = useState(
    initialData.workspace.internalDiagnosisNote
  );
  const [currentProcessText, setCurrentProcessText] = useState(
    initialData.workspace.currentProcess.join("\n")
  );
  const [futureProcessText, setFutureProcessText] = useState(
    initialData.workspace.futureProcess.join("\n")
  );
  const [nextActionsText, setNextActionsText] = useState(
    initialData.workspace.nextActions.join("\n")
  );

  const [systemsJson, setSystemsJson] = useState(toJson(initialData.workspace.systems));
  const [backlogJson, setBacklogJson] = useState(
    toJson(initialData.workspace.automationBacklog)
  );
  const [sopsJson, setSopsJson] = useState(toJson(initialData.workspace.sops));
  const [approvalsJson, setApprovalsJson] = useState(
    toJson(initialData.workspace.approvals)
  );
  const [incidentsJson, setIncidentsJson] = useState(
    toJson(initialData.workspace.incidents)
  );
  const [changeRequestsJson, setChangeRequestsJson] = useState(
    toJson(initialData.workspace.changeRequests)
  );
  const [kpisJson, setKpisJson] = useState(toJson(initialData.workspace.kpis));
  const [risksJson, setRisksJson] = useState(toJson(initialData.workspace.risks));
  const [qaJson, setQaJson] = useState(toJson(initialData.workspace.qa));

  const [proposalDraft, setProposalDraft] = useState(initialData.workspace.proposalDraft || "");
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const intakeTone = useMemo(() => tone(bundle.intake.status), [bundle.intake.status]);
  const phaseTone = useMemo(() => tone(phase), [phase]);

  async function generateProposal() {
    setGeneratingProposal(true);
    try {
      const prompt = `Write a professional automation services proposal for ${bundle.intake.companyName}. Include: project overview, pain points addressed, proposed solution (${bundle.ghostAdmin.bestTool}), key automations, estimated outcomes, and next steps. Keep it clear, concise, and client-ready.`;
      const res = await fetch("/api/internal/admin/ops/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId: bundle.intake.id, message: prompt }),
      });
      const json = await res.json();
      if (res.ok && json?.ok && json.assistantMessage?.content) {
        setProposalDraft(json.assistantMessage.content);
      }
    } catch {
      // ignore
    } finally {
      setGeneratingProposal(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");

    try {
      const workspace = {
        pipelineStatus,
        proposalDraft,
        phase,
        waitingOn,
        adminPublicNote,
        internalDiagnosisNote,
        currentProcess: linesToList(currentProcessText),
        futureProcess: linesToList(futureProcessText),
        nextActions: linesToList(nextActionsText),
        systems: parseArrayJson<WorkspaceSystem>(systemsJson, "Systems"),
        automationBacklog: parseArrayJson<WorkspaceAutomation>(
          backlogJson,
          "Automation backlog"
        ),
        sops: parseArrayJson<WorkspaceSop>(sopsJson, "SOPs"),
        approvals: parseArrayJson<WorkspaceApproval>(approvalsJson, "Approvals"),
        incidents: parseArrayJson<WorkspaceIncident>(incidentsJson, "Incidents"),
        changeRequests: parseArrayJson<WorkspaceChangeRequest>(
          changeRequestsJson,
          "Change requests"
        ),
        kpis: parseArrayJson<WorkspaceKpi>(kpisJson, "KPIs"),
        risks: parseArrayJson<WorkspaceRisk>(risksJson, "Risks"),
        qa: parseArrayJson<WorkspaceQaItem>(qaJson, "QA"),
      };

      const res = await fetch("/api/internal/admin/ops/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId: bundle.intake.id, workspace }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Save failed");
      }

      setBundle((prev) => ({
        ...prev,
        workspace: {
          ...prev.workspace,
          ...workspace,
          liveAutomations: workspace.automationBacklog.filter(
            (item) => String(item.status || "").toLowerCase() === "live"
          ),
          lastSavedAt: new Date().toISOString(),
          lastSavedBy: "admin",
        },
      }));

      setSaveMsg("Saved");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="kicker">
                <span className="kickerDot" />
                Ops Project Control
              </div>
              <h1 className="h2" style={{ marginTop: 10 }}>
                {bundle.intake.companyName}
              </h1>
              <p className="pDark" style={{ marginTop: 6 }}>
                {bundle.intake.contactName} • {bundle.intake.email}
              </p>
              <p className="pDark" style={{ marginTop: 6 }}>
                Intake {bundle.intake.id} • Created {fmtDate(bundle.intake.createdAt)}
              </p>
            </div>

            <div className="row" style={{ gap: 8 }}>
              <Link href="/internal/admin/ops" className="btn btnGhost">
                Back to Ops HQ
              </Link>
              <Link href={`/portal/ops/${bundle.intake.id}`} className="btn btnPrimary">
                Client Workspace →
              </Link>
            </div>
          </div>

          <div className="grid4" style={{ marginTop: 18 }}>
            <StatCard label="Project Status" value={pretty(bundle.intake.status)} />
            <StatCard label="Phase" value={phase} />
            <StatCard label="Best Tool" value={bundle.ghostAdmin.bestTool} />
            <StatCard label="Waiting On" value={waitingOn} />
          </div>

          <div className="row" style={{ gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <StatusBadge toneValue={intakeTone}>Intake {intakeTone.label}</StatusBadge>
            <StatusBadge toneValue={phaseTone}>Phase {phaseTone.label}</StatusBadge>
            <span className="badge">Readiness {bundle.ghostAdmin.automationReadiness}</span>
            <span className="badge">Risk {bundle.ghostAdmin.riskLevel}</span>
            {bundle.workspace.lastSavedAt ? (
              <span className="badge">Saved {fmtDate(bundle.workspace.lastSavedAt)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 18, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className="btn"
            style={{
              background: activeTab === tab.key ? "var(--accent)" : "var(--panel2)",
              color: activeTab === tab.key ? "#000" : "var(--fg)",
              border: "none",
              fontSize: 13,
              padding: "8px 14px",
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="row" style={{ marginTop: 12, gap: 10 }}>
        <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Workspace"}
        </button>
        {saveMsg ? <span className="smallNote">{saveMsg}</span> : null}
      </div>

      <div style={{ marginTop: 18 }}>
        {activeTab === "overview" ? (
          <div style={{ display: "grid", gap: 16 }}>
          <div className="grid2stretch">
            <Panel title="Pipeline & Diagnosis" note="Stage progression and core ops framing.">
              <div>
                <div className="fieldLabel">Pipeline Stage</div>
                <select
                  className="select"
                  value={pipelineStatus}
                  onChange={(e) => setPipelineStatus(e.target.value)}
                  style={{ width: "100%" }}
                >
                  {OPS_PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <ReadOnly label="Business Objective" value={bundle.ghostAdmin.businessObjective} />
              <ReadOnly label="Main Bottleneck" value={bundle.ghostAdmin.mainBottleneck} />
              <ReadOnly label="Root Cause" value={bundle.ghostAdmin.rootCause} />
              <ReadOnly label="Best First Fix" value={bundle.ghostAdmin.bestFirstFix} />
              <Editable label="Phase" value={phase} onChange={setPhase} rows={2} />
              <Editable label="Waiting On" value={waitingOn} onChange={setWaitingOn} rows={2} />
              <Editable
                label="Public Note (client-safe)"
                value={adminPublicNote}
                onChange={setAdminPublicNote}
                rows={4}
              />
              <Editable
                label="Internal Diagnosis Note"
                value={internalDiagnosisNote}
                onChange={setInternalDiagnosisNote}
                rows={5}
              />
            </Panel>

            <Panel title="Discovery Snapshot" note="Intake context and ask.">
              <ReadOnly label="Industry" value={bundle.intake.industry} />
              <ReadOnly label="Team Size" value={bundle.intake.teamSize} />
              <ReadOnly label="Job Volume" value={bundle.intake.jobVolume} />
              <ReadOnly label="Urgency" value={bundle.intake.urgency} />
              <ReadOnly label="Recommendation" value={bundle.intake.recommendationTier} />
              <ReadOnly label="Range" value={bundle.intake.recommendationPriceRange} />
              <SubList
                title="Pain Points"
                items={bundle.intake.painPoints}
                emptyLabel="No pain points listed."
              />
              <SubList
                title="Requested Workflows"
                items={bundle.intake.workflowsNeeded}
                emptyLabel="No workflows listed."
              />
            </Panel>
          </div>

          <Panel title="Proposal Draft" note="AI-generated proposal for this automation project. Edit before sending.">
            <div className="row" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btnPrimary"
                disabled={generatingProposal || saving}
                onClick={generateProposal}
                style={{ fontSize: 13 }}
              >
                {generatingProposal ? "Generating..." : proposalDraft ? "Regenerate via Ghost Admin" : "Generate proposal via Ghost Admin"}
              </button>
              {proposalDraft ? (
                <button
                  type="button"
                  className="btn btnGhost"
                  style={{ fontSize: 13 }}
                  onClick={() => navigator.clipboard.writeText(proposalDraft)}
                >
                  Copy
                </button>
              ) : null}
            </div>
            <Editable
              label="Proposal text"
              value={proposalDraft}
              onChange={setProposalDraft}
              rows={18}
            />
            <div className="smallNote" style={{ marginTop: 4 }}>
              Saved with "Save Workspace" above. Share with the client when ready.
            </div>
          </Panel>
          </div>
        ) : null}

        {activeTab === "workflow" ? (
          <div className="grid2stretch">
            <Panel title="Current Process" note="One step per line.">
              <Editable
                label="Current Process"
                value={currentProcessText}
                onChange={setCurrentProcessText}
                rows={12}
              />
            </Panel>

            <Panel title="Future Process + Next Actions" note="Map the target flow and sequence.">
              <Editable
                label="Future Process"
                value={futureProcessText}
                onChange={setFutureProcessText}
                rows={10}
              />
              <Editable
                label="Next Actions"
                value={nextActionsText}
                onChange={setNextActionsText}
                rows={8}
              />
            </Panel>
          </div>
        ) : null}

        {activeTab === "systems" ? (
          <div className="grid2stretch">
            <Panel title="Systems Preview" note="Current systems list.">
              <ObjectCards
                items={bundle.workspace.systems.map((item) => ({
                  title: item.name,
                  subtitle: `${item.role} • ${item.status}`,
                  body: item.notes,
                }))}
                emptyLabel="No systems saved."
              />
            </Panel>

            <Panel title="Systems JSON Editor" note="Edit as a JSON array.">
              <Editable
                label="Systems JSON"
                value={systemsJson}
                onChange={setSystemsJson}
                rows={24}
                mono
              />
            </Panel>
          </div>
        ) : null}

        {activeTab === "backlog" ? (
          <div className="grid2stretch">
            <Panel title="Backlog Preview" note="Current automation backlog.">
              <ObjectCards
                items={bundle.workspace.automationBacklog.map((item) => ({
                  title: item.name,
                  subtitle: `${item.status} • ${item.priority} • ${item.toolRecommendation}`,
                  body: item.purpose,
                }))}
                emptyLabel="No backlog items saved."
              />
            </Panel>

            <Panel title="Backlog JSON Editor" note="Edit as a JSON array.">
              <Editable
                label="Backlog JSON"
                value={backlogJson}
                onChange={setBacklogJson}
                rows={24}
                mono
              />
            </Panel>
          </div>
        ) : null}

        {activeTab === "operations" ? (
          <div className="grid2stretch">
            <Panel title="Approvals, Incidents, Change Requests" note="Edit these as JSON arrays.">
              <Editable
                label="Approvals JSON"
                value={approvalsJson}
                onChange={setApprovalsJson}
                rows={7}
                mono
              />
              <Editable
                label="Incidents JSON"
                value={incidentsJson}
                onChange={setIncidentsJson}
                rows={7}
                mono
              />
              <Editable
                label="Change Requests JSON"
                value={changeRequestsJson}
                onChange={setChangeRequestsJson}
                rows={7}
                mono
              />
            </Panel>

            <Panel title="SOPs, KPIs, Risks, QA" note="Edit these as JSON arrays.">
              <Editable label="SOPs JSON" value={sopsJson} onChange={setSopsJson} rows={7} mono />
              <Editable label="KPIs JSON" value={kpisJson} onChange={setKpisJson} rows={6} mono />
              <Editable
                label="Risks JSON"
                value={risksJson}
                onChange={setRisksJson}
                rows={6}
                mono
              />
              <Editable label="QA JSON" value={qaJson} onChange={setQaJson} rows={6} mono />
            </Panel>
          </div>
        ) : null}

        {activeTab === "chat" ? (
          <GhostAdminChat
            opsIntakeId={bundle.intake.id}
            starterPrompts={bundle.ghostAdmin.starterPrompts}
          />
        ) : null}
      </div>
    </main>
  );
}

function StatusBadge({
  toneValue,
  children,
}: {
  toneValue: { bg: string; border: string; color: string };
  children: any;
}) {
  return (
    <span
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        background: toneValue.bg,
        border: `1px solid ${toneValue.border}`,
        color: toneValue.color,
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div className="smallNote">{label}</div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: 22, lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: any;
}) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>{title}</div>
        <div className="smallNote">{note}</div>
      </div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {children}
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

function Editable({
  label,
  value,
  onChange,
  rows = 4,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <textarea
        className="input"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          resize: "vertical",
          width: "100%",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          fontSize: mono ? 12 : undefined,
          minHeight: rows * 22,
        }}
      />
    </div>
  );
}

function SubList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="fieldLabel">{title}</div>
      {items.length === 0 ? (
        <div className="smallNote">{emptyLabel}</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ObjectCards({
  items,
  emptyLabel,
}: {
  items: Array<{ title: string; subtitle: string; body: string }>;
  emptyLabel: string;
}) {
  if (!items.length) return <div className="smallNote">{emptyLabel}</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
          <div className="panelBody">
            <div style={{ fontWeight: 800 }}>{item.title}</div>
            <div className="smallNote" style={{ marginTop: 4 }}>
              {item.subtitle}
            </div>
            <div className="pDark" style={{ marginTop: 8 }}>
              {item.body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GhostAdminChat({
  opsIntakeId,
  starterPrompts,
}: {
  opsIntakeId: string;
  starterPrompts: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadHistory() {
    if (loaded) return;
    setLoaded(true);
    try {
      const res = await fetch(
        `/api/internal/admin/ops/chat?opsIntakeId=${encodeURIComponent(opsIntakeId)}`
      );
      const json = await res.json();
      if (res.ok && json?.ok && Array.isArray(json.messages)) {
        setMessages(json.messages as ChatMessage[]);
      }
    } catch {
      // ignore
    }
  }

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || loading) return;

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/internal/admin/ops/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId, message: value }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setMessages((prev) => [
          ...prev,
          json.userMessage as ChatMessage,
          json.assistantMessage as ChatMessage,
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    void loadHistory();
  }

  return (
    <Panel title="Ghost Admin Chat" note="Project-aware AI operations advisor.">
      {messages.length === 0 ? (
        <div>
          <div className="fieldLabel">Starter Prompts</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
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
      ) : null}

      <div style={{ display: "grid", gap: 10, maxHeight: 520, overflowY: "auto" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: 14,
              borderRadius: 12,
              background:
                msg.role === "user"
                  ? "rgba(141,164,255,0.12)"
                  : "rgba(46,160,67,0.08)",
              border:
                msg.role === "user"
                  ? "1px solid rgba(141,164,255,0.22)"
                  : "1px solid rgba(46,160,67,0.20)",
            }}
          >
            <div className="smallNote" style={{ marginBottom: 6 }}>
              {msg.role === "user" ? "You" : "Ghost Admin"} • {fmtDate(msg.timestamp)}
            </div>
            <div className="pDark" style={{ whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading ? <div className="smallNote">Ghost Admin is thinking...</div> : null}
      </div>

      <div className="row" style={{ gap: 8 }}>
        <textarea
          className="input"
          rows={3}
          style={{ flex: 1, resize: "vertical" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Ghost Admin about workflow fixes, tool selection, SOPs, risks, or testing."
        />
        <button
          className="btn btnPrimary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </Panel>
  );
}