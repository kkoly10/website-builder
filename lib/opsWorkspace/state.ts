import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { OpsWorkspaceBundle } from "@/lib/opsWorkspace/server";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type WorkspaceSystem = {
  name: string;
  status: string;
  role: string;
  notes: string;
};

export type WorkspaceAutomation = {
  id: string;
  name: string;
  purpose: string;
  trigger: string;
  actions: string[];
  status: string;
  priority: string;
  toolRecommendation: string;
  fallback: string;
};

export type WorkspaceSop = {
  workflow: string;
  trigger: string;
  steps: string[];
  exceptions: string[];
  metrics: string[];
};

export type WorkspaceIncident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  summary: string;
  resolution: string;
};

export type WorkspaceChangeRequest = {
  id: string;
  title: string;
  urgency: string;
  status: string;
  reason: string;
  impact: string;
};

export type WorkspaceApproval = {
  id: string;
  label: string;
  status: string;
  notes: string;
};

export type WorkspaceKpi = {
  name: string;
  target: string;
  why: string;
};

export type WorkspaceRisk = {
  risk: string;
  mitigation: string;
};

export type WorkspaceQaItem = {
  id: string;
  label: string;
  status: string;
  notes: string;
};

export type WorkspaceState = {
  pipelineStatus?: string;
  proposalDraft?: string;
  phase?: string;
  waitingOn?: string;
  adminPublicNote?: string;
  internalDiagnosisNote?: string;
  agreementStatus?: string;
  agreementAcceptedAt?: string;
  depositNotice?: string;
  depositNoticeSentAt?: string;
  currentProcess?: string[];
  futureProcess?: string[];
  systems?: WorkspaceSystem[];
  automationBacklog?: WorkspaceAutomation[];
  sops?: WorkspaceSop[];
  incidents?: WorkspaceIncident[];
  changeRequests?: WorkspaceChangeRequest[];
  approvals?: WorkspaceApproval[];
  kpis?: WorkspaceKpi[];
  risks?: WorkspaceRisk[];
  qa?: WorkspaceQaItem[];
  nextActions?: string[];
  adminNotes?: Record<string, string>;
  chatMessages?: ChatMessage[];
  tabOverrides?: Record<string, unknown>;
  lastSavedAt?: string;
  lastSavedBy?: string;
};

export type EnrichedOpsWorkspaceBundle = OpsWorkspaceBundle & {
  workspace: {
    pipelineStatus: string;
    proposalDraft: string;
    phase: string;
    waitingOn: string;
    adminPublicNote: string;
    internalDiagnosisNote: string;
    currentProcess: string[];
    futureProcess: string[];
    systems: WorkspaceSystem[];
    automationBacklog: WorkspaceAutomation[];
    liveAutomations: WorkspaceAutomation[];
    sops: WorkspaceSop[];
    incidents: WorkspaceIncident[];
    changeRequests: WorkspaceChangeRequest[];
    approvals: WorkspaceApproval[];
    kpis: WorkspaceKpi[];
    risks: WorkspaceRisk[];
    qa: WorkspaceQaItem[];
    nextActions: string[];
    adminNotes: Record<string, string>;
    chatMessages: ChatMessage[];
    lastSavedAt: string;
    lastSavedBy: string;
  };
};

function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringList(value: unknown): string[] {
  return asArray<string>(value).map((item) => str(item)).filter(Boolean);
}

function normalizeSystems(value: unknown): WorkspaceSystem[] {
  return asArray<any>(value).map((item, index) => ({
    name: str(item?.name, `System ${index + 1}`),
    status: str(item?.status, "Needs review"),
    role: str(item?.role, "Connected system"),
    notes: str(item?.notes),
  }));
}

function normalizeAutomationBacklog(value: unknown): WorkspaceAutomation[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `automation-${index + 1}`),
    name: str(item?.name, `Automation ${index + 1}`),
    purpose: str(item?.purpose),
    trigger: str(item?.trigger, "TBD"),
    actions: normalizeStringList(item?.actions),
    status: str(item?.status, "Scoped"),
    priority: str(item?.priority, "Medium"),
    toolRecommendation: str(item?.toolRecommendation, "Zapier"),
    fallback: str(item?.fallback, "Route failures into manual review."),
  }));
}

function normalizeSops(value: unknown): WorkspaceSop[] {
  return asArray<any>(value).map((item, index) => ({
    workflow: str(item?.workflow, `Workflow ${index + 1}`),
    trigger: str(item?.trigger, "Trigger"),
    steps: normalizeStringList(item?.steps),
    exceptions: normalizeStringList(item?.exceptions),
    metrics: normalizeStringList(item?.metrics),
  }));
}

function normalizeIncidents(value: unknown): WorkspaceIncident[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `incident-${index + 1}`),
    title: str(item?.title, `Issue ${index + 1}`),
    severity: str(item?.severity, "Medium"),
    status: str(item?.status, "Open"),
    summary: str(item?.summary),
    resolution: str(item?.resolution),
  }));
}

function normalizeChangeRequests(value: unknown): WorkspaceChangeRequest[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `change-${index + 1}`),
    title: str(item?.title, `Change request ${index + 1}`),
    urgency: str(item?.urgency, "Medium"),
    status: str(item?.status, "Pending"),
    reason: str(item?.reason),
    impact: str(item?.impact),
  }));
}

function normalizeApprovals(value: unknown): WorkspaceApproval[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `approval-${index + 1}`),
    label: str(item?.label, `Approval ${index + 1}`),
    status: str(item?.status, "Pending"),
    notes: str(item?.notes),
  }));
}

function normalizeKpis(value: unknown): WorkspaceKpi[] {
  return asArray<any>(value).map((item, index) => ({
    name: str(item?.name, `KPI ${index + 1}`),
    target: str(item?.target, "TBD"),
    why: str(item?.why),
  }));
}

function normalizeRisks(value: unknown): WorkspaceRisk[] {
  return asArray<any>(value).map((item, index) => ({
    risk: str(item?.risk, `Risk ${index + 1}`),
    mitigation: str(item?.mitigation, "Mitigation pending"),
  }));
}

function normalizeQa(value: unknown): WorkspaceQaItem[] {
  return asArray<any>(value).map((item, index) => ({
    id: str(item?.id, `qa-${index + 1}`),
    label: str(item?.label, `QA ${index + 1}`),
    status: str(item?.status, "Pending"),
    notes: str(item?.notes),
  }));
}

function asWorkspaceState(value: unknown): WorkspaceState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  return {
    pipelineStatus: str(raw.pipelineStatus),
    proposalDraft: str(raw.proposalDraft),
    phase: str(raw.phase),
    waitingOn: str(raw.waitingOn),
    adminPublicNote: str(raw.adminPublicNote),
    internalDiagnosisNote: str(raw.internalDiagnosisNote),
    currentProcess: normalizeStringList(raw.currentProcess),
    futureProcess: normalizeStringList(raw.futureProcess),
    systems: normalizeSystems(raw.systems),
    automationBacklog: normalizeAutomationBacklog(raw.automationBacklog),
    sops: normalizeSops(raw.sops),
    incidents: normalizeIncidents(raw.incidents),
    changeRequests: normalizeChangeRequests(raw.changeRequests),
    approvals: normalizeApprovals(raw.approvals),
    kpis: normalizeKpis(raw.kpis),
    risks: normalizeRisks(raw.risks),
    qa: normalizeQa(raw.qa),
    nextActions: normalizeStringList(raw.nextActions),
    adminNotes:
      raw.adminNotes && typeof raw.adminNotes === "object" && !Array.isArray(raw.adminNotes)
        ? Object.fromEntries(
            Object.entries(raw.adminNotes as Record<string, unknown>).map(([key, item]) => [
              key,
              str(item),
            ])
          )
        : {},
    chatMessages: asArray<any>(raw.chatMessages).map((item) => ({
      id: str(item?.id, `msg-${Date.now()}`),
      role: item?.role === "assistant" ? "assistant" : "user",
      content: str(item?.content),
      timestamp: str(item?.timestamp, new Date().toISOString()),
    })),
    tabOverrides:
      raw.tabOverrides && typeof raw.tabOverrides === "object" && !Array.isArray(raw.tabOverrides)
        ? (raw.tabOverrides as Record<string, unknown>)
        : {},
    lastSavedAt: str(raw.lastSavedAt),
    lastSavedBy: str(raw.lastSavedBy),
  };
}

function derivePhase(bundle: OpsWorkspaceBundle): string {
  if (bundle.pie.exists && bundle.callRequest.exists) return "Process Mapping";
  if (bundle.callRequest.exists) return "Discovery";
  return "Intake Received";
}

function defaultApprovals(bundle: OpsWorkspaceBundle): WorkspaceApproval[] {
  return [
    {
      id: "approval-source-of-truth",
      label: "Confirm source-of-truth app",
      status: "Pending",
      notes: bundle.systems[0]?.name
        ? `Validate whether ${bundle.systems[0].name} should be the operational source of truth.`
        : "Source-of-truth app not confirmed yet.",
    },
    {
      id: "approval-first-automation",
      label: "Approve first automation priority",
      status: "Pending",
      notes: bundle.backlog[0]?.name
        ? `Proposed first automation: ${bundle.backlog[0].name}.`
        : "First automation priority still needs scoping.",
    },
    {
      id: "approval-go-live",
      label: "Approve go-live sequence",
      status: "Pending",
      notes: "Go-live should happen only after test data and exception handling are reviewed.",
    },
  ];
}

function mapBundleSops(bundle: OpsWorkspaceBundle): WorkspaceSop[] {
  return bundle.pie.sops.map((item) => ({
    workflow: item.workflow,
    trigger: item.trigger,
    steps: item.steps,
    exceptions: item.exceptions,
    metrics: item.metrics,
  }));
}

function mapBundleKpis(bundle: OpsWorkspaceBundle): WorkspaceKpi[] {
  return bundle.pie.kpis.map((item) => ({
    name: item.name,
    target: item.target,
    why: item.why,
  }));
}

function mapBundleRisks(bundle: OpsWorkspaceBundle): WorkspaceRisk[] {
  return bundle.pie.risks.map((item) => ({
    risk: item.risk,
    mitigation: item.mitigation,
  }));
}

export async function getWorkspaceState(opsIntakeId: string): Promise<WorkspaceState> {
  const { data, error } = await supabaseAdmin
    .from("ops_intakes")
    .select("workspace_state")
    .eq("id", opsIntakeId)
    .maybeSingle();

  if (error) {
    if (String(error.message || "").toLowerCase().includes("workspace_state")) return {};
    return {};
  }
  if (!data) return {};

  return asWorkspaceState((data as { workspace_state?: unknown }).workspace_state);
}

export async function saveWorkspaceState(
  opsIntakeId: string,
  patch: Partial<WorkspaceState>,
  savedBy?: string
): Promise<{ ok: boolean; error?: string }> {
  const current = await getWorkspaceState(opsIntakeId);

  const merged: WorkspaceState = {
    ...current,
    ...patch,
    adminNotes: { ...(current.adminNotes ?? {}), ...(patch.adminNotes ?? {}) },
    tabOverrides: { ...(current.tabOverrides ?? {}), ...(patch.tabOverrides ?? {}) },
    chatMessages: patch.chatMessages ?? current.chatMessages ?? [],
    systems: patch.systems ?? current.systems ?? [],
    automationBacklog: patch.automationBacklog ?? current.automationBacklog ?? [],
    sops: patch.sops ?? current.sops ?? [],
    incidents: patch.incidents ?? current.incidents ?? [],
    changeRequests: patch.changeRequests ?? current.changeRequests ?? [],
    approvals: patch.approvals ?? current.approvals ?? [],
    kpis: patch.kpis ?? current.kpis ?? [],
    risks: patch.risks ?? current.risks ?? [],
    qa: patch.qa ?? current.qa ?? [],
    currentProcess: patch.currentProcess ?? current.currentProcess ?? [],
    futureProcess: patch.futureProcess ?? current.futureProcess ?? [],
    nextActions: patch.nextActions ?? current.nextActions ?? [],
    lastSavedAt: new Date().toISOString(),
    lastSavedBy: savedBy ?? current.lastSavedBy ?? "admin",
  };

  const { error } = await supabaseAdmin
    .from("ops_intakes")
    .update({ workspace_state: merged as unknown as Record<string, unknown> })
    .eq("id", opsIntakeId);

  if (error) {
    if (String(error.message || "").toLowerCase().includes("workspace_state")) {
      return { ok: false, error: 'Missing "workspace_state" column on ops_intakes. Run the migration first.' };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function appendChatMessage(
  opsIntakeId: string,
  message: ChatMessage
): Promise<{ ok: boolean; error?: string }> {
  const current = await getWorkspaceState(opsIntakeId);
  const messages = [...(current.chatMessages ?? []), message];
  return saveWorkspaceState(opsIntakeId, { chatMessages: messages });
}

export function enrichOpsBundle(
  bundle: OpsWorkspaceBundle,
  state: WorkspaceState
): EnrichedOpsWorkspaceBundle {
  return {
    ...bundle,
    workspace: {
      pipelineStatus: state.pipelineStatus || "new",
      proposalDraft: state.proposalDraft || "",
      phase: state.phase || derivePhase(bundle),
      waitingOn: state.waitingOn || bundle.ghostAdmin.missingInfo[0] || "CrecyStudio internal review",
      adminPublicNote: state.adminPublicNote || "",
      internalDiagnosisNote: state.internalDiagnosisNote || "",
      currentProcess: state.currentProcess?.length ? state.currentProcess : bundle.workflowMap.currentState,
      futureProcess: state.futureProcess?.length ? state.futureProcess : bundle.workflowMap.futureState,
      systems: state.systems?.length ? state.systems : bundle.systems,
      automationBacklog: state.automationBacklog?.length ? state.automationBacklog : bundle.backlog,
      liveAutomations: (state.automationBacklog?.length ? state.automationBacklog : bundle.backlog).filter(
        (item) => String(item.status || "").toLowerCase() === "live"
      ),
      sops: state.sops?.length ? state.sops : mapBundleSops(bundle),
      incidents: state.incidents ?? [],
      changeRequests: state.changeRequests ?? [],
      approvals: state.approvals?.length ? state.approvals : defaultApprovals(bundle),
      kpis: state.kpis?.length ? state.kpis : mapBundleKpis(bundle),
      risks: state.risks?.length ? state.risks : mapBundleRisks(bundle),
      qa: state.qa ?? [],
      nextActions: state.nextActions?.length ? state.nextActions : bundle.pie.nextActions,
      adminNotes: state.adminNotes ?? {},
      chatMessages: state.chatMessages ?? [],
      lastSavedAt: state.lastSavedAt || "",
      lastSavedBy: state.lastSavedBy || "",
    },
  };
}

export function makeClientSafeOpsBundle(
  bundle: EnrichedOpsWorkspaceBundle,
  options?: { isAdmin?: boolean }
): EnrichedOpsWorkspaceBundle {
  if (options?.isAdmin) return bundle;

  return {
    ...bundle,
    intake: {
      ...bundle.intake,
      notes: "",
    },
    ghostAdmin: {
      ...bundle.ghostAdmin,
      starterPrompts: [],
    },
    workspace: {
      ...bundle.workspace,
      internalDiagnosisNote: "",
      adminNotes: {},
      chatMessages: [],
    },
  };
}
