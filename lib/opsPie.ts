// lib/opsPie.ts
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type OpsIntakeRow = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  team_size?: string | null;
  job_volume?: string | null;
  urgency?: string | null;
  readiness?: string | null;
  current_tools?: string[] | null;
  pain_points?: string[] | null;
  workflows_needed?: string[] | null;
  notes?: string | null;
  recommendation_tier?: string | null;
  recommendation_price_range?: string | null;
  recommendation_score?: number | null;
  status?: string | null;

  // Optional columns if you added them later:
  lead_email?: string | null;
  user_id?: string | null;
};

type OpsCallRow = {
  id: string;
  best_time_to_call?: string | null;
  preferred_times?: string | null;
  timezone?: string | null;
  notes?: string | null;
  status?: string | null;
};

type OpsPieDbRow = {
  id: string;
  ops_intake_id: string;
  generator: string | null;
  report_version: string | null;
  status: string | null;
  model: string | null;
  openai_response_id: string | null;
  previous_response_id: string | null;
  summary: string | null;
  input_snapshot: Json;
  report_json: Json;
  created_at: string;
  updated_at: string;
};

type GenerateOptions = {
  force?: boolean;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPS_PIE_MODEL = process.env.OPS_PIE_MODEL || "gpt-4.1-mini"; // set to your preferred model in env
const OPS_PIE_USE_OPENAI = (process.env.OPS_PIE_USE_OPENAI ?? "true").toLowerCase() !== "false";

export const OPS_PIE_REPORT_VERSION = "ops-pie-v2-ai";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

function compact<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(compact).filter((v) => v !== undefined) as T;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined) continue;
      if (v === null) {
        out[k] = v;
        continue;
      }
      const next = compact(v);
      out[k] = next;
    }
    return out as T;
  }
  return obj;
}

function hashSafetyIdentifier(email?: string | null) {
  if (!email) return undefined;
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function priorityFromSignals(intake: OpsIntakeRow) {
  const urgency = (intake.urgency || "").toLowerCase();
  const readiness = (intake.readiness || "").toLowerCase();

  if (urgency.includes("urgent") || urgency.includes("asap")) return "high";
  if (readiness.includes("ready")) return "high";
  if (urgency.includes("this month")) return "medium";
  return "medium";
}

function estimateOffer(intake: OpsIntakeRow) {
  const workflows = asStringArray(intake.workflows_needed);
  const pains = asStringArray(intake.pain_points);
  const toolCount = asStringArray(intake.current_tools).length;

  const score =
    workflows.length * 15 +
    pains.length * 10 +
    toolCount * 5 +
    ((intake.urgency || "").toLowerCase().includes("asap") ? 15 : 0) +
    ((intake.readiness || "").toLowerCase().includes("ready") ? 10 : 0);

  if (score >= 60) {
    return {
      tier: "Systems Build + Optimization",
      priceRange: "$1,500-$3,500+",
      retainer: "$750-$2,000/mo",
    };
  }
  if (score >= 30) {
    return {
      tier: "Workflow Automation Sprint",
      priceRange: "$900-$1,800",
      retainer: "$500-$1,200/mo",
    };
  }
  return {
    tier: "Quick Fix / Starter Automation",
    priceRange: "$350-$900",
    retainer: "$250-$600/mo",
  };
}

function buildInputSnapshot(intake: OpsIntakeRow, callRequest?: OpsCallRow | null) {
  const email = intake.email || intake.lead_email || null;
  return compact({
    intake: {
      id: intake.id,
      company_name: intake.company_name || null,
      contact_name: intake.contact_name || null,
      email,
      phone: intake.phone || null,
      industry: intake.industry || null,
      team_size: intake.team_size || null,
      job_volume: intake.job_volume || null,
      urgency: intake.urgency || null,
      readiness: intake.readiness || null,
      current_tools: asStringArray(intake.current_tools),
      pain_points: asStringArray(intake.pain_points),
      workflows_needed: asStringArray(intake.workflows_needed),
      notes: intake.notes || null,
      recommendation_tier: intake.recommendation_tier || null,
      recommendation_price_range: intake.recommendation_price_range || null,
      recommendation_score: intake.recommendation_score ?? null,
      status: intake.status || null,
    },
    call_request: callRequest
      ? {
          id: callRequest.id,
          best_time_to_call: callRequest.best_time_to_call || null,
          preferred_times: callRequest.preferred_times || null,
          timezone: callRequest.timezone || null,
          notes: callRequest.notes || null,
          status: callRequest.status || null,
        }
      : null,
    generated_at_iso: new Date().toISOString(),
  });
}

const OPS_PIE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "confidence",
    "recommended_offer",
    "diagnosis",
    "quick_wins",
    "implementation_plan",
    "sops",
    "kpis",
    "client_questions",
    "sales_pitch",
    "risks",
    "next_actions",
  ],
  properties: {
    summary: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    recommended_offer: {
      type: "object",
      additionalProperties: false,
      required: ["primary_package", "project_range", "retainer_range", "why"],
      properties: {
        primary_package: { type: "string" },
        project_range: { type: "string" },
        retainer_range: { type: "string" },
        why: { type: "string" },
      },
    },
    diagnosis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["problem", "impact", "evidence", "priority"],
        properties: {
          problem: { type: "string" },
          impact: { type: "string" },
          evidence: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    quick_wins: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "why", "steps", "owner", "eta"],
        properties: {
          title: { type: "string" },
          why: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          owner: { type: "string" },
          eta: { type: "string" },
        },
      },
    },
    implementation_plan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "phase",
          "goal",
          "deliverables",
          "automations",
          "tech_stack",
          "data_fields",
          "acceptance_criteria",
          "estimate_days",
        ],
        properties: {
          phase: { type: "string" },
          goal: { type: "string" },
          deliverables: { type: "array", items: { type: "string" } },
          automations: { type: "array", items: { type: "string" } },
          tech_stack: { type: "array", items: { type: "string" } },
          data_fields: { type: "array", items: { type: "string" } },
          acceptance_criteria: { type: "array", items: { type: "string" } },
          estimate_days: { type: "string" },
        },
      },
    },
    sops: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["workflow", "trigger", "steps", "exceptions", "metrics"],
        properties: {
          workflow: { type: "string" },
          trigger: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          exceptions: { type: "array", items: { type: "string" } },
          metrics: { type: "array", items: { type: "string" } },
        },
      },
    },
    kpis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "target", "why"],
        properties: {
          name: { type: "string" },
          target: { type: "string" },
          why: { type: "string" },
        },
      },
    },
    client_questions: {
      type: "array",
      items: { type: "string" },
    },
    sales_pitch: {
      type: "object",
      additionalProperties: false,
      required: ["positioning", "proposal_outline", "retainer_options"],
      properties: {
        positioning: { type: "string" },
        proposal_outline: { type: "array", items: { type: "string" } },
        retainer_options: { type: "array", items: { type: "string" } },
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["risk", "mitigation"],
        properties: {
          risk: { type: "string" },
          mitigation: { type: "string" },
        },
      },
    },
    next_actions: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

function getTextFromResponsesApiPayload(payload: any): string | null {
  // Some SDKs expose output_text, raw HTTP often doesn't. Handle both.
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  if (!Array.isArray(payload?.output)) return null;

  const chunks: string[] = [];

  for (const item of payload.output) {
    if (!item) continue;

    // Typical message envelope
    if (Array.isArray(item.content)) {
      for (const c of item.content) {
        if (!c) continue;

        // Try direct parsed/text fields
        if (typeof c.text === "string" && c.text.trim()) chunks.push(c.text);
        if (typeof c.output_text === "string" && c.output_text.trim()) chunks.push(c.output_text);

        // Sometimes nested text object
        if (c.text && typeof c.text === "object" && typeof c.text.value === "string") {
          chunks.push(c.text.value);
        }
      }
    }

    // Rare direct text field
    if (typeof item.text === "string" && item.text.trim()) chunks.push(item.text);
  }

  const joined = chunks.join("\n").trim();
  return joined || null;
}

function getParsedJsonFromResponsesApiPayload(payload: any): unknown | null {
  if (!Array.isArray(payload?.output)) return null;

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;
    for (const c of item.content) {
      // Some formats may provide parsed JSON directly
      if (c?.parsed && typeof c.parsed === "object") return c.parsed;
      if (c?.json && typeof c.json === "object") return c.json;
    }
  }
  return null;
}

function normalizeAiReportShape(report: any, intake: OpsIntakeRow) {
  const offer = estimateOffer(intake);

  const normalized = {
    summary:
      typeof report?.summary === "string" && report.summary.trim()
        ? report.summary.trim()
        : `PIE generated an operations plan for ${intake.company_name || "this business"} with focus on workflow cleanup, automation, and reporting.`,
    confidence:
      report?.confidence === "low" || report?.confidence === "medium" || report?.confidence === "high"
        ? report.confidence
        : "medium",
    recommended_offer: {
      primary_package:
        report?.recommended_offer?.primary_package || offer.tier,
      project_range:
        report?.recommended_offer?.project_range || offer.priceRange,
      retainer_range:
        report?.recommended_offer?.retainer_range || offer.retainer,
      why:
        report?.recommended_offer?.why ||
        "Based on the intake signals (pain points, workflow requests, urgency, and readiness), this package balances quick implementation with measurable operational improvements.",
    },
    diagnosis: Array.isArray(report?.diagnosis) ? report.diagnosis : [],
    quick_wins: Array.isArray(report?.quick_wins) ? report.quick_wins : [],
    implementation_plan: Array.isArray(report?.implementation_plan) ? report.implementation_plan : [],
    sops: Array.isArray(report?.sops) ? report.sops : [],
    kpis: Array.isArray(report?.kpis) ? report.kpis : [],
    client_questions: Array.isArray(report?.client_questions) ? report.client_questions : [],
    sales_pitch: {
      positioning: report?.sales_pitch?.positioning || "We build practical business systems that reduce admin time and speed up billing, scheduling, and follow-up.",
      proposal_outline: Array.isArray(report?.sales_pitch?.proposal_outline) ? report.sales_pitch.proposal_outline : [],
      retainer_options: Array.isArray(report?.sales_pitch?.retainer_options) ? report.sales_pitch.retainer_options : [],
    },
    risks: Array.isArray(report?.risks) ? report.risks : [],
    next_actions: Array.isArray(report?.next_actions) ? report.next_actions : [],
    // Useful metadata for your UI/admin
    _meta: {
      generated_by: "openai",
      version: OPS_PIE_REPORT_VERSION,
      generated_at: new Date().toISOString(),
    },
  };

  return normalized;
}

async function callOpenAIForOpsPie(inputSnapshot: ReturnType<typeof buildInputSnapshot>) {
  if (!OPENAI_API_KEY || !OPS_PIE_USE_OPENAI) {
    throw new Error("OpenAI disabled or OPENAI_API_KEY missing");
  }

  const intake = (inputSnapshot as any)?.intake ?? {};
  const company = intake.company_name || "the client";
  const contact = intake.contact_name || "the contact";
  const safetyId = hashSafetyIdentifier(intake.email);

  const systemPrompt = [
    "You are PIE, an elite business systems engineer for small and mid-sized businesses.",
    "Your job is to produce a highly practical operational diagnosis and implementation plan.",
    "Be specific, implementation-oriented, and avoid generic advice.",
    "Focus on billing, invoicing, CRM flow, intake, follow-up, scheduling, reporting, and handoff automation.",
    "Write for a solo software engineer who will deliver the work to the client.",
    "Return JSON only that matches the provided schema.",
  ].join(" ");

  const userPrompt = [
    `Create a detailed PIE report for ${company}.`,
    `Contact: ${contact}.`,
    "Use the intake and booking details below as the source of truth.",
    "Include fast wins, a phased implementation plan, SOPs, KPIs, risks, and a sales framing for the proposal.",
    "",
    JSON.stringify(inputSnapshot, null, 2),
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPS_PIE_MODEL,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        truncation: "auto",
        temperature: 0.2,
        ...(safetyId ? { safety_identifier: safetyId } : {}),
        text: {
          format: {
            type: "json_schema",
            name: "ops_pie_report",
            strict: true,
            schema: OPS_PIE_SCHEMA,
          },
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI Responses API error ${resp.status}: ${errText}`);
    }

    const payload = await resp.json();

    if (payload?.status && payload.status !== "completed") {
      throw new Error(`OpenAI response status was "${payload.status}"`);
    }

    const parsedDirect = getParsedJsonFromResponsesApiPayload(payload);
    let parsed = parsedDirect;

    if (!parsed) {
      const rawText = getTextFromResponsesApiPayload(payload);
      if (!rawText) {
        throw new Error("OpenAI response did not contain text output");
      }
      parsed = JSON.parse(rawText);
    }

    return {
      parsed,
      responseId: typeof payload?.id === "string" ? payload.id : null,
      model: typeof payload?.model === "string" ? payload.model : OPS_PIE_MODEL,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackOpsPie(inputSnapshot: ReturnType<typeof buildInputSnapshot>) {
  const intake = (inputSnapshot as any)?.intake as OpsIntakeRow;
  const call = (inputSnapshot as any)?.call_request as OpsCallRow | null;
  const tools = asStringArray(intake.current_tools);
  const pains = asStringArray(intake.pain_points);
  const workflows = asStringArray(intake.workflows_needed);
  const offer = estimateOffer(intake);
  const pri = priorityFromSignals(intake);

  const diagnosis = [
    {
      problem:
        pains[0] || "Manual admin workflow causing inconsistent follow-up and billing delays",
      impact:
        "Missed follow-ups, slower cash collection, and difficulty tracking client status",
      evidence: `Pain points: ${pains.join(", ") || "not fully specified"}`,
      priority: pri,
    },
    {
      problem:
        workflows[0] || "No standardized intake-to-delivery workflow",
      impact:
        "Projects start with missing information and require repeated back-and-forth",
      evidence: `Requested workflows: ${workflows.join(", ") || "not specified"}`,
      priority: "medium",
    },
  ];

  const quickWins = [
    {
      title: "Standardize intake and lead capture",
      why: "Prevents missing information and reduces manual follow-up",
      steps: [
        "Create one intake form with required fields (company, contact, service type, urgency)",
        "Write submissions to one database table",
        "Trigger a confirmation email and internal notification",
      ],
      owner: "CrecyStudio",
      eta: "1-2 days",
    },
    {
      title: "Automate invoice-ready handoff",
      why: "Shortens time from approved work to payment request",
      steps: [
        "Create status stages: new, scoped, approved, in progress, invoiced, paid",
        "Generate invoice payload from approved project records",
        "Store invoice link/reference back on the client record",
      ],
      owner: "CrecyStudio + Client",
      eta: "2-4 days",
    },
  ];

  const implementationPlan = [
    {
      phase: "Phase 1 - Discovery + workflow map",
      goal: "Document the current process and identify breakpoints",
      deliverables: [
        "Workflow map (intake to payment)",
        "Data field list",
        "Role map (who does what)",
      ],
      automations: ["None yet - mapping phase"],
      tech_stack: ["Supabase", "Next.js", "Email provider"],
      data_fields: [
        "lead_email",
        "client_name",
        "service_type",
        "status",
        "invoice_status",
        "next_action_due",
      ],
      acceptance_criteria: [
        "Current-state workflow approved",
        "Target-state workflow approved",
        "Required fields list finalized",
      ],
      estimate_days: "1-2",
    },
    {
      phase: "Phase 2 - Core automation build",
      goal: "Implement intake, status tracking, and billing handoff",
      deliverables: [
        "Ops intake form",
        "Admin dashboard queue",
        "Invoice handoff automation",
        "Basic KPI dashboard",
      ],
      automations: [
        "Intake -> DB",
        "Status change alerts",
        "Approved -> invoice prep",
        "Follow-up reminders",
      ],
      tech_stack: ["Next.js", "Supabase", "API routes", "OpenAI PIE reports"],
      data_fields: [
        "intake_id",
        "owner",
        "priority",
        "workflow_type",
        "invoice_amount",
        "payment_due_date",
      ],
      acceptance_criteria: [
        "New submission appears in admin dashboard",
        "Status updates persist correctly",
        "Invoice handoff can be triggered without manual re-entry",
      ],
      estimate_days: "4-7",
    },
    {
      phase: "Phase 3 - SOP + optimization",
      goal: "Document repeatable execution and tune performance",
      deliverables: [
        "SOPs for intake, billing, follow-up",
        "KPI review dashboard",
        "Optimization backlog",
      ],
      automations: [
        "Stale lead reminders",
        "Overdue invoice reminders",
        "Weekly KPI summary",
      ],
      tech_stack: ["Next.js", "Supabase", "Scheduler", "Email integrations"],
      data_fields: ["response_time_hours", "invoice_days_to_pay", "close_rate", "rework_count"],
      acceptance_criteria: [
        "SOPs are usable by non-technical staff",
        "KPIs show weekly trend",
        "Client can operate without engineering support daily",
      ],
      estimate_days: "3-5",
    },
  ];

  const sops = [
    {
      workflow: "New lead intake",
      trigger: "Client submits form",
      steps: [
        "System creates intake record",
        "Assign owner and priority",
        "Send client confirmation",
        "Schedule discovery call or send next-step link",
      ],
      exceptions: [
        "Missing email -> block submission",
        "Incomplete scope -> request clarification template",
      ],
      metrics: ["Lead response time", "Form completion rate"],
    },
    {
      workflow: "Billing handoff",
      trigger: "Project status changes to approved",
      steps: [
        "Collect approved scope and amount",
        "Generate invoice draft payload",
        "Send invoice",
        "Track invoice status",
      ],
      exceptions: [
        "No price approved -> hold and flag admin",
        "Client tax info missing -> request before sending",
      ],
      metrics: ["Time to invoice", "Invoice paid within 7 days"],
    },
  ];

  return {
    summary: `PIE fallback report: ${intake.company_name || "This client"} likely needs a standardized intake -> status -> billing workflow. The fastest win is to centralize submissions, add status tracking, and automate invoice handoff so admin work stops living in messages and memory.`,
    confidence: "medium",
    recommended_offer: {
      primary_package: offer.tier,
      project_range: offer.priceRange,
      retainer_range: offer.retainer,
      why: "Recommended from intake complexity, urgency, and number of requested workflows.",
    },
    diagnosis,
    quick_wins: quickWins,
    implementation_plan: implementationPlan,
    sops,
    kpis: [
      { name: "Lead response time", target: "< 2 hours", why: "Improves conversion and trust" },
      { name: "Time to invoice", target: "same day", why: "Faster cash collection" },
      { name: "Invoice collection time", target: "< 7 days", why: "Cash flow stability" },
      { name: "Admin hours saved", target: "4-10 hrs/week", why: "Clear ROI for the client" },
    ],
    client_questions: [
      "What system do you currently use for invoices (QuickBooks, Stripe, manual)?",
      "What causes the biggest delays today: intake, scheduling, billing, or follow-up?",
      "Who on your team should receive alerts and approvals?",
      "Do you need customer portal access or only internal admin workflows?",
      `Is this booking time (${call?.preferred_times || call?.best_time_to_call || "not provided"}) still correct for discovery?`,
    ],
    sales_pitch: {
      positioning:
        "I build practical business systems that reduce admin work, speed up billing, and make your process easier to run.",
      proposal_outline: [
        "Current process audit",
        "Workflow design + data model",
        "Automation build",
        "SOPs + KPI dashboard",
        "Optional monthly optimization retainer",
      ],
      retainer_options: [
        "Starter support: monthly fixes + small automations",
        "Growth ops: KPI reviews + ongoing optimization",
        "Priority ops: faster turnaround + weekly systems support",
      ],
    },
    risks: [
      { risk: "Scope creep from unclear process owners", mitigation: "Lock a workflow map and approval list before build" },
      { risk: "Dirty or inconsistent existing data", mitigation: "Add validation rules and a cleanup phase" },
      { risk: "Low team adoption", mitigation: "Keep UI simple and document SOPs with checklists" },
    ],
    next_actions: [
      "Confirm the top 1-2 workflows to solve first",
      "Approve the target workflow map",
      "Approve package and timeline",
      "Start build sprint and KPI baseline tracking",
    ],
    _meta: {
      generated_by: "fallback",
      version: OPS_PIE_REPORT_VERSION,
      generated_at: new Date().toISOString(),
    },
  };
}

async function insertOpsPieReport(params: {
  opsIntakeId: string;
  previousResponseId?: string | null;
  summary: string;
  inputSnapshot: Json;
  reportJson: Json;
  generator: string;
  model?: string | null;
  openaiResponseId?: string | null;
}) {
  const insertPayload = {
    ops_intake_id: params.opsIntakeId,
    generator: params.generator,
    report_version: OPS_PIE_REPORT_VERSION,
    status: "completed",
    model: params.model ?? null,
    openai_response_id: params.openaiResponseId ?? null,
    previous_response_id: params.previousResponseId ?? null,
    summary: params.summary,
    input_snapshot: params.inputSnapshot,
    report_json: params.reportJson,
  };

  const { data, error } = await supabaseAdmin
    .from("ops_pie_reports")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return data as OpsPieDbRow;
}

export async function generateOpsPieForIntake(
  opsIntakeId: string,
  opts: GenerateOptions = {}
): Promise<OpsPieDbRow> {
  if (!opsIntakeId) {
    throw new Error("Missing ops intake id");
  }

  // 1) Get intake
  const { data: intake, error: intakeError } = await supabaseAdmin
    .from("ops_intakes")
    .select("*")
    .eq("id", opsIntakeId)
    .single();

  if (intakeError || !intake) {
    throw new Error(`Ops intake not found for id ${opsIntakeId}`);
  }

  // 2) Reuse latest if not forcing
  if (!opts.force) {
    const { data: existing } = await supabaseAdmin
      .from("ops_pie_reports")
      .select("*")
      .eq("ops_intake_id", opsIntakeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing as OpsPieDbRow;
  }

  // 3) Pull latest call request (optional, used in prompt)
  const { data: latestCall } = await supabaseAdmin
    .from("ops_call_requests")
    .select("*")
    .eq("ops_intake_id", opsIntakeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 4) Pull previous PIE report for threading metadata
  const { data: previousPie } = await supabaseAdmin
    .from("ops_pie_reports")
    .select("openai_response_id")
    .eq("ops_intake_id", opsIntakeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const inputSnapshot = buildInputSnapshot(intake as OpsIntakeRow, (latestCall as OpsCallRow) || null);

  // 5) Try real OpenAI PIE
  try {
    const ai = await callOpenAIForOpsPie(inputSnapshot);
    const normalized = normalizeAiReportShape(ai.parsed, intake as OpsIntakeRow);

    return await insertOpsPieReport({
      opsIntakeId,
      previousResponseId: (previousPie as any)?.openai_response_id ?? null,
      summary: normalized.summary,
      inputSnapshot,
      reportJson: normalized,
      generator: "openai_responses_v1",
      model: ai.model,
      openaiResponseId: ai.responseId,
    });
  } catch (err) {
    console.error("[PIE] OpenAI generation failed, using fallback:", err);

    const fallback = buildFallbackOpsPie(inputSnapshot);

    return await insertOpsPieReport({
      opsIntakeId,
      previousResponseId: (previousPie as any)?.openai_response_id ?? null,
      summary: fallback.summary,
      inputSnapshot,
      reportJson: fallback,
      generator: "fallback_rules_v2",
      model: null,
      openaiResponseId: null,
    });
  }
}

// ---- Aliases so older imports don't break ----
export const generateOpsPieReportForIntake = generateOpsPieForIntake;
export const createOpsPieReportForIntake = generateOpsPieForIntake;
export const ensureOpsPieReportForIntake = generateOpsPieForIntake;
export const generateOpsPieReport = generateOpsPieForIntake;
export const createOpsPieReport = generateOpsPieForIntake;
export const ensureOpsPieReport = generateOpsPieForIntake;

// Optional helper for admin/detail pages
export async function getLatestOpsPieReport(opsIntakeId: string): Promise<OpsPieDbRow | null> {
  const { data, error } = await supabaseAdmin
    .from("ops_pie_reports")
    .select("*")
    .eq("ops_intake_id", opsIntakeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as OpsPieDbRow) ?? null;
}
