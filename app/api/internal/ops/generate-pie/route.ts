import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OpsIntake = {
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
  current_tools: string[] | null;
  pain_points: string[] | null;
  workflows_needed: string[] | null;
  notes: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
  status: string | null;
};

type CallRequest = {
  id: string;
  best_time_to_call: string | null;
  preferred_times: string | null;
  timezone: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
};

function buildPieReport(intake: OpsIntake, call: CallRequest | null) {
  const tools = intake.current_tools ?? [];
  const pains = intake.pain_points ?? [];
  const workflows = intake.workflows_needed ?? [];
  const score = intake.recommendation_score ?? 0;

  const complexity =
    score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  const quickWins: string[] = [];
  const phase1: string[] = [];
  const phase2: string[] = [];
  const risks: string[] = [];
  const kpis: string[] = [];

  if (pains.includes("Missed leads / callbacks")) {
    quickWins.push("Set up a single lead intake form + auto-routing to owner/dispatcher.");
    phase1.push("Create lead pipeline stages: New → Contacted → Quoted → Won/Lost.");
    kpis.push("Lead response time (minutes), quote conversion rate (%).");
  }

  if (pains.includes("Delayed invoicing") || pains.includes("Unpaid invoices / reminders")) {
    quickWins.push("Implement invoice reminder workflow (Day 0, Day 3, Day 7 follow-ups).");
    phase1.push("Connect invoice events to reminder automation and payment status tracking.");
    kpis.push("Days Sales Outstanding (DSO), invoices sent within 24h (%).");
  }

  if (pains.includes("No clear job status tracking")) {
    quickWins.push("Create a job board with standard statuses and owner assignment.");
    phase1.push("Add dispatch/job completion workflow with handoff notes.");
    kpis.push("Jobs completed on time (%), stuck jobs >48h.");
  }

  if (pains.includes("Owner doing too much admin")) {
    quickWins.push("Automate intake acknowledgment and basic scheduling follow-up.");
    phase2.push("Delegate standard updates via templates and role-based process steps.");
  }

  if (tools.includes("No real system (manual)")) {
    risks.push("Manual process risk is high: data loss, missed follow-up, inconsistent billing.");
    phase1.push("Choose one source of truth (CRM or job board) before adding more tools.");
  }

  if (tools.includes("Google Sheets")) {
    risks.push("Spreadsheet-only workflows can break when volume grows or multiple people edit.");
    phase2.push("Move repeatable workflows from sheets into forms + automations + CRM.");
  }

  if (workflows.includes("CRM setup / pipeline")) {
    phase1.push("Deploy CRM pipeline with standard fields, tags, and next-step reminders.");
  }
  if (workflows.includes("Quote / estimate workflow")) {
    phase1.push("Create quote template workflow with approval and follow-up reminders.");
  }
  if (workflows.includes("Invoice reminders")) {
    phase1.push("Implement billing reminder cadence with stop-on-payment logic.");
  }
  if (workflows.includes("Dashboard reporting")) {
    phase2.push("Build weekly KPI dashboard for owner view (leads, quotes, jobs, collections).");
  }
  if (workflows.includes("Client portal / status page")) {
    phase2.push("Add client-facing status page or portal for active jobs/projects.");
  }

  if (!quickWins.length) {
    quickWins.push("Map current intake → quote → job → invoice flow and remove the main bottleneck first.");
  }
  if (!phase1.length) {
    phase1.push("Standardize intake, job status, and follow-up into one repeatable process.");
  }
  if (!phase2.length) {
    phase2.push("Add dashboard reporting and advanced automations after the core workflow is stable.");
  }
  if (!kpis.length) {
    kpis.push("Track response time, quote conversion, invoicing speed, and collection time.");
  }

  const timeline =
    complexity === "high"
      ? ["Week 1: process mapping + data model", "Week 2-3: core workflow build", "Week 4+: reporting + refinements"]
      : complexity === "medium"
      ? ["Week 1: workflow setup", "Week 2: automations + QA", "Week 3: reporting + tweaks"]
      : ["Week 1: quick workflow setup", "Week 2: reminder automation + handoff"];

  const summary = [
    `${intake.company_name || "This client"} is a ${intake.industry || "service"} business with ${intake.team_size || "unknown team size"} and ${intake.job_volume || "unknown monthly volume"}.`,
    `Priority is ${intake.urgency || "not specified"} with process readiness "${intake.readiness || "not specified"}".`,
    `Recommended tier: ${intake.recommendation_tier || "N/A"} (${intake.recommendation_price_range || "N/A"}), score ${score}/100.`,
    `Focus first on ${quickWins[0].replace(/\.$/, "")}.`,
  ].join(" ");

  return {
    summary,
    report: {
      meta: {
        intake_id: intake.id,
        generated_at: new Date().toISOString(),
        complexity,
        score,
      },
      client_profile: {
        company_name: intake.company_name,
        contact_name: intake.contact_name,
        email: intake.email,
        phone: intake.phone,
        industry: intake.industry,
        team_size: intake.team_size,
        job_volume: intake.job_volume,
        urgency: intake.urgency,
        readiness: intake.readiness,
      },
      current_state: {
        tools,
        pain_points: pains,
        workflows_requested: workflows,
        intake_notes: intake.notes,
        call_request: call
          ? {
              best_time_to_call: call.best_time_to_call,
              preferred_times: call.preferred_times,
              timezone: call.timezone,
              notes: call.notes,
              status: call.status,
            }
          : null,
      },
      recommendations: {
        quick_wins: quickWins,
        phase_1_core_build: phase1,
        phase_2_scale: phase2,
        risks,
        kpis,
        timeline,
      },
      delivery_plan: {
        recommended_tier: intake.recommendation_tier,
        suggested_price_range: intake.recommendation_price_range,
        next_step: "Book/complete workflow review call and confirm source-of-truth tools.",
      },
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const opsIntakeId = String(body?.opsIntakeId ?? "").trim();

    if (!opsIntakeId) {
      return NextResponse.json(
        { ok: false, error: "Missing opsIntakeId" },
        { status: 400 }
      );
    }

    const [{ data: intake, error: intakeError }, { data: callRows }] = await Promise.all([
      supabaseAdmin
        .from("ops_intakes")
        .select("*")
        .eq("id", opsIntakeId)
        .maybeSingle<OpsIntake>(),
      supabaseAdmin
        .from("ops_call_requests")
        .select("*")
        .eq("ops_intake_id", opsIntakeId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (intakeError || !intake) {
      return NextResponse.json(
        { ok: false, error: intakeError?.message || "Ops intake not found." },
        { status: 404 }
      );
    }

    const latestCall = ((callRows ?? [])[0] as CallRequest | undefined) ?? null;

    const pie = buildPieReport(intake, latestCall);

    const insertPayload = {
      ops_intake_id: intake.id,
      generator: "ops_rules_v1",
      report_version: "ops-pie-v1",
      status: "generated",
      model: null,
      openai_response_id: null,
      previous_response_id: null,
      summary: pie.summary,
      input_snapshot: {
        intake,
        latest_call: latestCall,
      },
      report_json: pie.report,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("ops_pie_reports")
      .insert(insertPayload)
      .select("id, created_at, status, summary, generator, model")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { ok: false, error: insertError?.message || "Failed to save PIE report." },
        { status: 500 }
      );
    }

    // Optional: update intake status if still "new"
    await supabaseAdmin
      .from("ops_intakes")
      .update({ status: intake.status === "new" ? "analyzed" : intake.status, updated_at: new Date().toISOString() })
      .eq("id", intake.id);

    return NextResponse.json({
      ok: true,
      report: inserted,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}