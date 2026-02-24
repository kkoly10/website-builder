// lib/opsPie.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeEmail } from "@/lib/supabase/server";

type OpsIntakeRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  team_size: string | null;
  job_volume: string | null;
  urgency: string | null;
  readiness: string | null;
  current_tools: unknown;
  pain_points: unknown;
  workflows_needed: unknown;
  notes: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
  status: string | null;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  return [];
}

function lower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function hasAny(list: string[], terms: string[]) {
  const joined = list.map((x) => x.toLowerCase());
  return terms.some((t) => joined.some((v) => v.includes(t)));
}

function dedupe(items: string[]) {
  return [...new Set(items.map((x) => x.trim()).filter(Boolean))];
}

function buildOpsPieReport(intake: OpsIntakeRow) {
  const tools = asStringArray(intake.current_tools);
  const pains = asStringArray(intake.pain_points);
  const workflows = asStringArray(intake.workflows_needed);

  const urgency = lower(intake.urgency);
  const readiness = lower(intake.readiness);
  const teamSize = lower(intake.team_size);
  const volume = lower(intake.job_volume);
  const industry = String(intake.industry ?? "Business");

  let complexity = 25;

  if (urgency.includes("immediately")) complexity += 15;
  else if (urgency.includes("2")) complexity += 10;
  else if (urgency.includes("month")) complexity += 5;

  if (readiness.includes("messy") || readiness.includes("manual")) complexity += 15;
  else if (readiness.includes("some")) complexity += 8;
  else complexity += 4;

  if (teamSize.includes("6-10") || teamSize.includes("11-20") || teamSize.includes("20")) complexity += 10;
  if (volume.includes("50+") || volume.includes("100+")) complexity += 15;
  else if (volume.includes("20")) complexity += 8;

  complexity += Math.min(20, workflows.length * 4);
  complexity += Math.min(12, pains.length * 2);

  const score = Math.max(35, Math.min(98, complexity));

  let tier = "Starter Workflow Fix";
  let projectMin = 700;
  let projectTarget = 1200;
  let projectMax = 1800;
  let retainerRange = "$250–$450/mo";
  let timeline = "5–10 business days";

  if (score >= 75) {
    tier = "Growth Systems Build";
    projectMin = 1800;
    projectTarget = 3200;
    projectMax = 5200;
    retainerRange = "$450–$900/mo";
    timeline = "2–4 weeks";
  } else if (score >= 55) {
    tier = "Core Ops Setup";
    projectMin = 1100;
    projectTarget = 2200;
    projectMax = 3500;
    retainerRange = "$350–$650/mo";
    timeline = "1–3 weeks";
  }

  const rootCauses: string[] = [];
  const quickWins: string[] = [];
  const recommendations: string[] = [];
  const stack: string[] = [];
  const kpis: string[] = [];
  const risks: string[] = [];

  if (hasAny(pains, ["follow", "lead", "slow"])) {
    rootCauses.push("Lead follow-up is inconsistent, which causes delayed response times and lost jobs.");
    quickWins.push("Set up instant lead capture + auto acknowledgement (email/SMS) within 1 minute.");
    recommendations.push("Build a lead intake pipeline with status stages (new → contacted → quoted → won/lost).");
    kpis.push("Lead response time", "Lead-to-call conversion rate");
  }

  if (hasAny(pains, ["invoice", "billing", "late pay", "payment"])) {
    rootCauses.push("Billing and payment collection is too manual, increasing delays and missed revenue.");
    quickWins.push("Create automated invoice reminders and overdue follow-up sequence.");
    recommendations.push("Connect quote → invoice workflow with due dates and status tracking.");
    kpis.push("Average days to payment", "Overdue invoice count");
  }

  if (hasAny(pains, ["no-show", "schedule", "booking"])) {
    rootCauses.push("Scheduling and appointment reminders are not automated enough.");
    quickWins.push("Add appointment confirmations and reminder messages (24h / 2h).");
    recommendations.push("Implement a booking workflow with confirmations, rescheduling links, and no-show tracking.");
    kpis.push("No-show rate", "Booked jobs per week");
  }

  if (hasAny(pains, ["duplicate", "double", "data", "spreadsheet"])) {
    rootCauses.push("Data is duplicated across tools, causing mistakes and rework.");
    quickWins.push("Define one source-of-truth record for customer + job + invoice.");
    recommendations.push("Sync forms/CRM/spreadsheets so customer records are not re-entered manually.");
    kpis.push("Duplicate record rate", "Admin time per job");
  }

  if (workflows.length === 0) {
    recommendations.push("Start with a workflow audit and implement one high-impact workflow first.");
    quickWins.push("Map current process in 5 stages and identify the biggest delay point.");
  }

  if (hasAny(workflows, ["billing", "invoice", "payment"])) {
    recommendations.push("Build billing automation: quote approval → invoice issue → reminder cadence → paid status.");
  }
  if (hasAny(workflows, ["crm", "lead", "follow"])) {
    recommendations.push("Build CRM pipeline automation with lead routing, reminders, and next-action tasks.");
  }
  if (hasAny(workflows, ["booking", "calendar", "appointment"])) {
    recommendations.push("Build booking operations flow with confirmation, reminders, and team assignment.");
  }
  if (hasAny(workflows, ["report", "dashboard", "kpi"])) {
    recommendations.push("Create an owner dashboard showing leads, jobs, invoices, and conversion KPIs.");
  }

  // Suggested stack (simple and practical)
  if (hasAny(tools, ["quickbooks"])) stack.push("QuickBooks (keep existing)");
  if (hasAny(tools, ["google"])) stack.push("Google Workspace");
  if (hasAny(tools, ["excel", "sheet"])) stack.push("Spreadsheet bridge (cleanup + sync)");
  if (hasAny(tools, ["hubspot", "crm"])) stack.push("Existing CRM (keep and connect)");

  stack.push("Custom workflow portal (Next.js)");
  stack.push("Supabase (auth + database)");
  stack.push("Automations (email/SMS/status-based triggers)");

  if (readiness.includes("messy") || readiness.includes("manual")) {
    risks.push("Current process is not standardized yet; automation can fail if the process is not defined first.");
  }
  if (workflows.length >= 4) {
    risks.push("Too many workflows requested at once; scope should be split into phases.");
  }
  if (urgency.includes("immediately")) {
    risks.push("High urgency may push rushed decisions; prioritize one workflow in phase 1.");
  }

  if (!rootCauses.length) {
    rootCauses.push("Manual admin work is taking time away from delivery and sales.");
  }
  if (!kpis.length) {
    kpis.push("Admin time saved per week", "Revenue cycle speed", "Job completion throughput");
  }

  const quickWinPlan = dedupe(quickWins).slice(0, 4);
  const recs = dedupe(recommendations).slice(0, 6);
  const stackFinal = dedupe(stack).slice(0, 6);
  const kpisFinal = dedupe(kpis).slice(0, 6);
  const risksFinal = dedupe(risks).slice(0, 4);

  const summary = `${intake.company_name || "This business"} is a strong fit for an ops automation project. Priority should be ${
    recs[0] ? recs[0].toLowerCase() : "lead + billing workflow cleanup"
  } first, then phase in the rest. Recommended tier: ${tier} (${timeline}).`;

  const reportJson = {
    meta: {
      engine: "ops_rules_v2",
      generated_at: new Date().toISOString(),
      company: intake.company_name,
      industry,
    },
    score,
    tier,
    confidence: score >= 75 ? "high" : score >= 55 ? "medium" : "good",
    summary,
    diagnosis: {
      root_causes: dedupe(rootCauses),
      pain_points: pains,
      requested_workflows: workflows,
      current_tools: tools,
    },
    quick_wins: quickWinPlan,
    implementation_plan: [
      {
        phase: 1,
        title: "Stabilize intake + handoff",
        focus: "Stop lead leakage and make every new request trackable.",
        actions: [
          "Create one intake source of truth",
          "Capture owner + customer contact fields consistently",
          "Auto-acknowledge incoming requests",
          "Assign status and next action",
        ],
        timeline: "2–5 days",
      },
      {
        phase: 2,
        title: "Automate core workflow",
        focus: "Build the highest-impact workflow requested by the client.",
        actions: recs.slice(0, 3),
        timeline: score >= 75 ? "1–2 weeks" : "4–7 days",
      },
      {
        phase: 3,
        title: "Reporting + optimization",
        focus: "Make owner dashboard and KPI review process.",
        actions: [
          "Build KPI dashboard",
          "Add failure alerts and retry handling",
          "Define monthly optimization cadence",
        ],
        timeline: "3–7 days",
      },
    ],
    recommended_stack: stackFinal,
    pricing_guidance: {
      project: {
        min: projectMin,
        target: projectTarget,
        max: projectMax,
        range_label: `$${projectMin.toLocaleString()}–$${projectMax.toLocaleString()}`,
      },
      monthly_retainer: retainerRange,
      timeline,
      rationale:
        "Pricing is based on workflow count, process readiness, urgency, and data/tool complexity.",
    },
    kpis: kpisFinal,
    risks: risksFinal,
    pitch: {
      opener:
        "You do not need a giant software rebuild first. We can fix the workflow that is costing you the most time and money, then layer in the rest.",
      value_case:
        "This project is designed to reduce admin work, speed up follow-up, and create a repeatable process your team can actually use.",
      next_step:
        "Approve phase 1 scope and start with one workflow automation + dashboard tracking.",
    },
  };

  return {
    summary,
    reportJson,
  };
}

export async function generateOpsPieForIntake(
  opsIntakeId: string,
  opts?: { force?: boolean }
) {
  const force = !!opts?.force;

  const { data: intake, error: intakeError } = await supabaseAdmin
    .from("ops_intakes")
    .select("*")
    .eq("id", opsIntakeId)
    .single<OpsIntakeRow>();

  if (intakeError || !intake) {
    throw new Error("Ops intake not found.");
  }

  if (!force) {
    const { data: existing } = await supabaseAdmin
      .from("ops_pie_reports")
      .select("*")
      .eq("ops_intake_id", opsIntakeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { generated: false, report: existing };
    }
  }

  const { summary, reportJson } = buildOpsPieReport(intake);

  const inputSnapshot = {
    company_name: intake.company_name,
    contact_name: intake.contact_name,
    email: intake.email,
    owner_email_norm: normalizeEmail(intake.email),
    industry: intake.industry,
    team_size: intake.team_size,
    job_volume: intake.job_volume,
    urgency: intake.urgency,
    readiness: intake.readiness,
    current_tools: intake.current_tools,
    pain_points: intake.pain_points,
    workflows_needed: intake.workflows_needed,
    notes: intake.notes,
    recommendation_tier: intake.recommendation_tier,
    recommendation_price_range: intake.recommendation_price_range,
    recommendation_score: intake.recommendation_score,
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("ops_pie_reports")
    .insert({
      ops_intake_id: opsIntakeId,
      generator: "ops_rules_v2",
      report_version: "1.0",
      status: "generated",
      model: null,
      summary,
      input_snapshot: inputSnapshot,
      report_json: reportJson,
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message || "Failed to save OPS PIE report.");
  }

  return { generated: true, report: inserted };
}
