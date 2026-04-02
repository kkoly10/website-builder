import { formatRange, OPS_TIER_CONFIG } from "@/lib/pricing/config";
import { getOpsPricing } from "@/lib/pricing/ops";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type JsonRecord = Record<string, any>;

type OpsIntakeRow = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  team_size: string | null;
  job_volume: string | null;
  monthly_revenue?: string | null;
  current_website?: string | null;
  budget_range?: string | null;
  urgency: string | null;
  readiness: string | null;
  current_tools: string[] | null;
  pain_points: string[] | null;
  workflows_needed: string[] | null;
  notes: string | null;
  tried_before?: string | null;
  status: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
  auth_user_id?: string | null;
  workspace_state?: unknown;
};

type OpsCallRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
  best_time_to_call: string | null;
  preferred_times: string | null;
  timezone: string | null;
  notes: string | null;
};

type OpsPieRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
  summary: string | null;
  report_json: unknown;
};

export type OpsAdminRow = {
  opsIntakeId: string;
  createdAt: string | null;
  companyName: string;
  contactName: string;
  email: string;
  industry: string;
  status: string;
  recommendationTier: string;
  recommendationPriceRange: string;
  recommendationScore: number | null;
  callStatus: string;
  pieStatus: string;
  pieSummary: string;
  bestTool: string;
  phase: string;
  waitingOn: string;
  links: {
    detail: string;
    portal: string;
  };
};

export type OpsWorkspaceBundle = {
  intake: {
    id: string;
    createdAt: string | null;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    industry: string;
    teamSize: string;
    jobVolume: string;
    urgency: string;
    readiness: string;
    status: string;
    recommendationTier: string;
    recommendationPriceRange: string;
    recommendationScore: number | null;
    currentTools: string[];
    painPoints: string[];
    workflowsNeeded: string[];
    notes: string;
  };
  callRequest: {
    exists: boolean;
    status: string;
    bestTime: string;
    preferredTimes: string;
    timezone: string;
    notes: string;
  };
  pie: {
    exists: boolean;
    id: string | null;
    status: string;
    summary: string;
    confidence: string;
    recommendedOffer: {
      primaryPackage: string;
      projectRange: string;
      retainerRange: string;
      why: string;
    };
    diagnosis: Array<{
      problem: string;
      impact: string;
      evidence: string;
      priority: string;
    }>;
    quickWins: Array<{
      title: string;
      why: string;
      steps: string[];
      owner: string;
      eta: string;
    }>;
    implementationPlan: Array<{
      phase: string;
      goal: string;
      deliverables: string[];
      automations: string[];
      techStack: string[];
      dataFields: string[];
      acceptanceCriteria: string[];
      estimateDays: string;
    }>;
    sops: Array<{
      workflow: string;
      trigger: string;
      steps: string[];
      exceptions: string[];
      metrics: string[];
    }>;
    kpis: Array<{
      name: string;
      target: string;
      why: string;
    }>;
    clientQuestions: string[];
    risks: Array<{
      risk: string;
      mitigation: string;
    }>;
    nextActions: string[];
  };
  ghostAdmin: {
    businessObjective: string;
    mainBottleneck: string;
    rootCause: string;
    automationReadiness: string;
    riskLevel: string;
    bestFirstFix: string;
    bestTool: string;
    missingInfo: string[];
    starterPrompts: string[];
  };
  workflowMap: {
    currentState: string[];
    futureState: string[];
  };
  systems: Array<{
    name: string;
    status: string;
    role: string;
    notes: string;
  }>;
  backlog: Array<{
    id: string;
    name: string;
    purpose: string;
    trigger: string;
    actions: string[];
    status: string;
    priority: string;
    toolRecommendation: string;
    fallback: string;
  }>;
};

function asObj(value: unknown): JsonRecord {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as JsonRecord;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function asArray<T = any>(value: unknown): T[] {
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

function bestToolFromSignals(input: {
  tools: string[];
  workflows: string[];
  diagnosisCount: number;
  riskCount: number;
}) {
  const tools = input.tools.map((t) => t.toLowerCase());
  const workflows = input.workflows.map((w) => w.toLowerCase());
  const complexityScore = tools.length + workflows.length + input.diagnosisCount + input.riskCount;

  if (workflows.some((w) => w.includes("dashboard") || w.includes("sync"))) return "Make";
  if (complexityScore >= 8) return "Make";
  if (complexityScore >= 4) return "Zapier";
  return "Manual first";
}

function riskLevelFromDiagnosis(count: number, urgency: string) {
  const u = urgency.toLowerCase();
  if (u.includes("asap") || count >= 3) return "High";
  if (count >= 2) return "Medium";
  return "Low";
}

function automationReadiness(readiness: string, tools: string[], pains: string[]) {
  const r = readiness.toLowerCase();
  if (r.includes("ready") || (tools.length >= 2 && pains.length >= 2)) return "High";
  if (tools.length > 0 || pains.length > 0) return "Medium";
  return "Needs discovery";
}

function buildCurrentState(intake: OpsIntakeRow, call: OpsCallRow | null) {
  const pains = intake.pain_points ?? [];
  const workflow = intake.workflows_needed?.[0] || "workflow request";
  return [
    `Client identifies a need around ${workflow.toLowerCase()}.`,
    pains.length ? `Current pain points include ${pains.join(", ").toLowerCase()}.` : "Current pain points still need to be clarified in discovery.",
    call ? `Discovery timing is captured as ${str(call.best_time_to_call, "not finalized")}.` : "Discovery call has not been finalized yet.",
    "Business process likely depends on manual steps, follow-up, and disconnected tools.",
  ];
}

function buildFutureState(intake: OpsIntakeRow, pieReport: JsonRecord) {
  const implementationPlan = asArray<JsonRecord>(pieReport.implementation_plan);
  const quickWins = asArray<JsonRecord>(pieReport.quick_wins);
  const firstAutomation = quickWins[0]?.title || implementationPlan[1]?.goal || "Core automation";
  return [
    `Create one clear source of truth for ${str(intake.company_name, "the client")} operations.`,
    `Launch ${str(firstAutomation, "the first automation")} as the initial systems win.`,
    "Document human checkpoints, exception handling, and approvals before go-live.",
    "Track KPI improvements so the client sees hours saved and cleaner handoffs.",
  ];
}

function buildSystems(intake: OpsIntakeRow) {
  const tools = intake.current_tools ?? [];
  if (!tools.length) {
    return [{ name: "Source of truth not confirmed", status: "Needs discovery", role: "Core system decision", notes: "Confirm where client records, status, and reporting should live before automating." }];
  }

  return tools.map((tool, index) => ({
    name: tool,
    status: index === 0 ? "Referenced in intake" : "Needs access check",
    role: index === 0 ? "Likely active system" : "Connected tool",
    notes: index === 0 ? "Validate whether this is the source of truth or just one step in the workflow." : "Confirm ownership, API limits, and what data needs to move in or out.",
  }));
}

function buildBacklog(intake: OpsIntakeRow, pieReport: JsonRecord, toolRecommendation: string) {
  const quickWins = asArray<JsonRecord>(pieReport.quick_wins);
  const implementationPlan = asArray<JsonRecord>(pieReport.implementation_plan);

  const cardsFromQuickWins = quickWins.map((win, index) => ({
    id: `quick-${index + 1}`,
    name: str(win.title, `Quick win ${index + 1}`),
    purpose: str(win.why, "Reduce admin drag and improve process reliability."),
    trigger: index === 0 ? "New submission / process start" : "Workflow event",
    actions: asArray<string>(win.steps).filter(Boolean),
    status: index === 0 ? "Recommended first" : "Backlog",
    priority: index === 0 ? "High" : "Medium",
    toolRecommendation,
    fallback: "Route exceptions into manual review until behavior is stable.",
  }));

  const cardsFromPlan = implementationPlan.map((phase, index) => ({
    id: `phase-${index + 1}`,
    name: str(phase.phase, `Phase ${index + 1}`),
    purpose: str(phase.goal, "Advance the workflow build."),
    trigger: "Phase start",
    actions: asArray<string>(phase.automations).filter(Boolean),
    status: index === 0 ? "Discovery" : "Planned",
    priority: index === 0 ? "High" : "Medium",
    toolRecommendation,
    fallback: "Keep scope tight and validate each phase before advancing.",
  }));

  const merged = [...cardsFromQuickWins, ...cardsFromPlan];
  if (merged.length > 0) return merged;

  return (intake.workflows_needed ?? []).map((workflow, index) => ({
    id: `workflow-${index + 1}`,
    name: workflow,
    purpose: "Requested by the client during intake.",
    trigger: "TBD in discovery",
    actions: ["Define trigger", "Define actions", "Define fallback"],
    status: "Needs scoping",
    priority: index === 0 ? "High" : "Medium",
    toolRecommendation,
    fallback: "Do not automate until the source of truth and approval point are clear.",
  }));
}

function buildGhostAdmin(intake: OpsIntakeRow, pieReport: JsonRecord, bestTool: string) {
  const diagnosis = asArray<JsonRecord>(pieReport.diagnosis);
  const clientQuestions = asArray<string>(pieReport.client_questions).filter(Boolean);
  const quickWins = asArray<JsonRecord>(pieReport.quick_wins);
  const bottleneck = str(diagnosis[0]?.problem, intake.pain_points?.[0] || "Workflow bottleneck needs diagnosis");
  const rootCause = str(diagnosis[0]?.evidence, "Process probably depends on manual handoffs and disconnected systems.");
  const bestFirstFix = str(quickWins[0]?.title, intake.workflows_needed?.[0] || "Define the first automation");
  const missingInfo = [
    "Which app should be the source of truth?",
    "Where should exceptions go?",
    "Which steps require human approval?",
    ...clientQuestions.slice(0, 3),
  ];

  return {
    businessObjective: intake.workflows_needed?.length ? `Clean up ${intake.workflows_needed[0].toLowerCase()} and make operations easier to run.` : "Turn the client’s messy process into a repeatable system.",
    mainBottleneck: bottleneck,
    rootCause,
    automationReadiness: automationReadiness(str(intake.readiness), intake.current_tools ?? [], intake.pain_points ?? []),
    riskLevel: riskLevelFromDiagnosis(diagnosis.length, str(intake.urgency)),
    bestFirstFix,
    bestTool,
    missingInfo,
    starterPrompts: [
      "Diagnose this workflow for me like I’m a beginner.",
      "What should I automate first for this client?",
      `Should I use ${bestTool} or custom code here?`,
      "What edge cases should I test before going live?",
      "Write the SOP for the first automation.",
    ],
  };
}

function getSharedOpsRecommendation(intake: OpsIntakeRow) {
  return getOpsPricing({
    companyName: intake.company_name || "",
    industry: intake.industry || "",
    teamSize: intake.team_size || "",
    jobVolume: intake.job_volume || "",
    monthlyRevenue: intake.monthly_revenue || "",
    budgetRange: intake.budget_range || "",
    currentTools: intake.current_tools ?? [],
    painPoints: intake.pain_points ?? [],
    triedBefore: intake.tried_before || "",
    workflowsNeeded: intake.workflows_needed ?? [],
    urgency: intake.urgency || "",
    readiness: intake.readiness || "",
    notes: intake.notes || "",
  });
}

function normalizePie(report: JsonRecord | null, intake: OpsIntakeRow) {
  const sharedPricing = getSharedOpsRecommendation(intake);
  const partnerBand = OPS_TIER_CONFIG.ongoing_systems_partner;
  const retainerRange = formatRange(partnerBand.min, partnerBand.max, { monthly: true });

  return {
    exists: !!report,
    id: str(report?._id, null as any) ?? null,
    status: report ? "completed" : "pending",
    summary: str(report?.summary, `PIE will summarize the ops strategy for ${str(intake.company_name, "this client")}.`),
    confidence: str(report?.confidence, "medium"),
    recommendedOffer: {
      primaryPackage: str(intake.recommendation_tier, sharedPricing.tierLabel),
      projectRange: str(intake.recommendation_price_range, sharedPricing.displayRange),
      retainerRange,
      why: str(asObj(report?.recommended_offer).why, "Recommended from shared ops pricing and workflow scope."),
    },
    diagnosis: asArray<JsonRecord>(report?.diagnosis).map((item) => ({
      problem: str(item.problem, "Problem not specified"),
      impact: str(item.impact, "Impact not specified"),
      evidence: str(item.evidence, "Evidence not specified"),
      priority: str(item.priority, "medium"),
    })),
    quickWins: asArray<JsonRecord>(report?.quick_wins).map((item) => ({
      title: str(item.title, "Quick win"),
      why: str(item.why, "Improve workflow speed and clarity."),
      steps: asArray<string>(item.steps).filter(Boolean),
      owner: str(item.owner, "CrecyStudio"),
      eta: str(item.eta, "TBD"),
    })),
    implementationPlan: asArray<JsonRecord>(report?.implementation_plan).map((item) => ({
      phase: str(item.phase, "Phase"),
      goal: str(item.goal, "Advance the workflow build."),
      deliverables: asArray<string>(item.deliverables).filter(Boolean),
      automations: asArray<string>(item.automations).filter(Boolean),
      techStack: asArray<string>(item.tech_stack).filter(Boolean),
      dataFields: asArray<string>(item.data_fields).filter(Boolean),
      acceptanceCriteria: asArray<string>(item.acceptance_criteria).filter(Boolean),
      estimateDays: str(item.estimate_days, "TBD"),
    })),
    sops: asArray<JsonRecord>(report?.sops).map((item) => ({
      workflow: str(item.workflow, "Workflow"),
      trigger: str(item.trigger, "Trigger"),
      steps: asArray<string>(item.steps).filter(Boolean),
      exceptions: asArray<string>(item.exceptions).filter(Boolean),
      metrics: asArray<string>(item.metrics).filter(Boolean),
    })),
    kpis: asArray<JsonRecord>(report?.kpis).map((item) => ({
      name: str(item.name, "KPI"),
      target: str(item.target, "TBD"),
      why: str(item.why, "Measure the value of the automation."),
    })),
    clientQuestions: asArray<string>(report?.client_questions).filter(Boolean),
    risks: asArray<JsonRecord>(report?.risks).map((item) => ({
      risk: str(item.risk, "Risk not specified"),
      mitigation: str(item.mitigation, "Mitigation not specified"),
    })),
    nextActions: asArray<string>(report?.next_actions).filter(Boolean),
  };
}

export async function getOpsAdminRows(): Promise<OpsAdminRow[]> {
  let intakes: OpsIntakeRow[] | null = null;
  let intakeError: { message: string } | null = null;

  const result = await supabaseAdmin
    .from("ops_intakes")
    .select("id, created_at, company_name, contact_name, email, industry, team_size, job_volume, monthly_revenue, budget_range, urgency, readiness, status, recommendation_tier, recommendation_price_range, recommendation_score, current_tools, pain_points, workflows_needed, tried_before, notes, workspace_state")
    .order("created_at", { ascending: false });

  if (result.error && /workspace_state/i.test(result.error.message)) {
    const fallback = await supabaseAdmin
      .from("ops_intakes")
      .select("id, created_at, company_name, contact_name, email, industry, team_size, job_volume, monthly_revenue, budget_range, urgency, readiness, status, recommendation_tier, recommendation_price_range, recommendation_score, current_tools, pain_points, workflows_needed, tried_before, notes")
      .order("created_at", { ascending: false });
    intakes = (fallback.data ?? []) as OpsIntakeRow[];
    intakeError = fallback.error;
  } else {
    intakes = (result.data ?? []) as OpsIntakeRow[];
    intakeError = result.error;
  }

  const [{ data: calls, error: callError }, { data: pies, error: pieError }] = await Promise.all([
    supabaseAdmin.from("ops_call_requests").select("id, ops_intake_id, created_at, status").order("created_at", { ascending: false }),
    supabaseAdmin.from("ops_pie_reports").select("id, ops_intake_id, created_at, status, summary, report_json").order("created_at", { ascending: false }),
  ]);

  if (intakeError) throw new Error(intakeError.message);
  if (callError) throw new Error(callError.message);
  if (pieError) throw new Error(pieError.message);

  const latestCallByIntake = new Map<string, OpsCallRow>();
  for (const call of (calls ?? []) as OpsCallRow[]) {
    if (!latestCallByIntake.has(call.ops_intake_id)) latestCallByIntake.set(call.ops_intake_id, call);
  }

  const latestPieByIntake = new Map<string, OpsPieRow>();
  for (const pie of (pies ?? []) as OpsPieRow[]) {
    if (!latestPieByIntake.has(pie.ops_intake_id)) latestPieByIntake.set(pie.ops_intake_id, pie);
  }

  return ((intakes ?? []) as OpsIntakeRow[]).map((intake) => {
    const call = latestCallByIntake.get(intake.id) ?? null;
    const pie = latestPieByIntake.get(intake.id) ?? null;
    const pieReport = asObj(pie?.report_json);
    const bestTool = bestToolFromSignals({ tools: intake.current_tools ?? [], workflows: intake.workflows_needed ?? [], diagnosisCount: asArray(pieReport.diagnosis).length, riskCount: asArray(pieReport.risks).length });
    const ws = asObj(intake.workspace_state);
    const phase = str(ws.phase) || (call && pie ? "Process Mapping" : call ? "Discovery" : "Intake Received");
    const waitingOn = str(ws.waitingOn) || "CrecyStudio review";
    const sharedPricing = getSharedOpsRecommendation(intake);

    return {
      opsIntakeId: intake.id,
      createdAt: intake.created_at,
      companyName: str(intake.company_name, "Ops Request"),
      contactName: str(intake.contact_name, "Unknown contact"),
      email: str(intake.email, "No email"),
      industry: str(intake.industry, "Workflow Systems"),
      status: str(intake.status, "new"),
      recommendationTier: str(intake.recommendation_tier, sharedPricing.tierLabel),
      recommendationPriceRange: str(intake.recommendation_price_range, sharedPricing.displayRange),
      recommendationScore: intake.recommendation_score ?? null,
      callStatus: str(call?.status, "Not requested"),
      pieStatus: pie ? str(pie.status, "completed") : "Pending",
      pieSummary: str(pie?.summary, "PIE summary pending"),
      bestTool,
      phase,
      waitingOn,
      links: { detail: `/internal/admin/ops/${intake.id}`, portal: `/portal/ops/${intake.id}` },
    };
  });
}

export async function getOpsWorkspaceBundle(opsIntakeId: string): Promise<OpsWorkspaceBundle | null> {
  const [{ data: intake, error: intakeError }, { data: calls, error: callError }, { data: pies, error: pieError }] = await Promise.all([
    supabaseAdmin
      .from("ops_intakes")
      .select("id, created_at, company_name, contact_name, email, phone, industry, team_size, job_volume, monthly_revenue, budget_range, urgency, readiness, current_tools, pain_points, workflows_needed, notes, tried_before, status, recommendation_tier, recommendation_price_range, recommendation_score")
      .eq("id", opsIntakeId)
      .maybeSingle(),
    supabaseAdmin
      .from("ops_call_requests")
      .select("id, ops_intake_id, created_at, status, best_time_to_call, preferred_times, timezone, notes")
      .eq("ops_intake_id", opsIntakeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ops_pie_reports")
      .select("id, ops_intake_id, created_at, status, summary, report_json")
      .eq("ops_intake_id", opsIntakeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (intakeError) throw new Error(intakeError.message);
  if (callError) throw new Error(callError.message);
  if (pieError) throw new Error(pieError.message);
  if (!intake) return null;

  const intakeRow = intake as OpsIntakeRow;
  const call = (calls as OpsCallRow | null) ?? null;
  const pie = (pies as OpsPieRow | null) ?? null;
  const pieReportRaw = asObj(pie?.report_json);
  const pieReport = normalizePie(pieReportRaw, intakeRow);
  const bestTool = bestToolFromSignals({ tools: intakeRow.current_tools ?? [], workflows: intakeRow.workflows_needed ?? [], diagnosisCount: pieReport.diagnosis.length, riskCount: pieReport.risks.length });
  const sharedPricing = getSharedOpsRecommendation(intakeRow);

  return {
    intake: {
      id: intakeRow.id,
      createdAt: intakeRow.created_at,
      companyName: str(intakeRow.company_name, "Ops Request"),
      contactName: str(intakeRow.contact_name, "Unknown contact"),
      email: str(intakeRow.email, "No email"),
      phone: str(intakeRow.phone, "Not provided"),
      industry: str(intakeRow.industry, "Workflow Systems"),
      teamSize: str(intakeRow.team_size, "Not specified"),
      jobVolume: str(intakeRow.job_volume, "Not specified"),
      urgency: str(intakeRow.urgency, "Not specified"),
      readiness: str(intakeRow.readiness, "Not specified"),
      status: str(intakeRow.status, "new"),
      recommendationTier: str(intakeRow.recommendation_tier, sharedPricing.tierLabel),
      recommendationPriceRange: str(intakeRow.recommendation_price_range, sharedPricing.displayRange),
      recommendationScore: intakeRow.recommendation_score ?? null,
      currentTools: intakeRow.current_tools ?? [],
      painPoints: intakeRow.pain_points ?? [],
      workflowsNeeded: intakeRow.workflows_needed ?? [],
      notes: str(intakeRow.notes),
    },
    callRequest: {
      exists: !!call,
      status: str(call?.status, call ? "requested" : "Not requested"),
      bestTime: str(call?.best_time_to_call, "Not provided"),
      preferredTimes: str(call?.preferred_times),
      timezone: str(call?.timezone, "Not provided"),
      notes: str(call?.notes),
    },
    pie: pieReport,
    ghostAdmin: buildGhostAdmin(intakeRow, pieReportRaw, bestTool),
    workflowMap: {
      currentState: buildCurrentState(intakeRow, call),
      futureState: buildFutureState(intakeRow, pieReportRaw),
    },
    systems: buildSystems(intakeRow),
    backlog: buildBacklog(intakeRow, pieReportRaw, bestTool),
  };
}
