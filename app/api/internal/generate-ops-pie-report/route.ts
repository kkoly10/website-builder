import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generatePieOpsReport } from "@/lib/pie/ops-agent";

export const dynamic = "force-dynamic";

type Body = {
  opsIntakeId?: string;
  previousResponseId?: string;
  followUpNote?: string;
  regenerate?: boolean;
};

function getExecutiveSummary(report: unknown): string | null {
  if (!report || typeof report !== "object") return null;
  const v = (report as Record<string, unknown>).executiveSummary;
  return typeof v === "string" ? v : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const opsIntakeId = String(body.opsIntakeId ?? "").trim();
    if (!opsIntakeId) {
      return NextResponse.json(
        { ok: false, error: "Missing opsIntakeId" },
        { status: 400 }
      );
    }

    // 1) load intake
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("ops_intakes")
      .select("*")
      .eq("id", opsIntakeId)
      .maybeSingle();

    if (intakeError || !intake) {
      return NextResponse.json(
        { ok: false, error: intakeError?.message || "Ops intake not found" },
        { status: 404 }
      );
    }

    // 2) return latest existing if not regenerating and no follow-up note
    if (!body.regenerate && !body.followUpNote) {
      const { data: latestExisting } = await supabaseAdmin
        .from("ops_pie_reports")
        .select("*")
        .eq("ops_intake_id", opsIntakeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestExisting?.report_json) {
        return NextResponse.json({
          ok: true,
          reused: true,
          reportId: latestExisting.id,
          responseId: latestExisting.openai_response_id,
          previousResponseId: latestExisting.previous_response_id,
          report: latestExisting.report_json,
        });
      }
    }

    // 3) resolve previous_response_id
    let previousResponseId =
      typeof body.previousResponseId === "string" && body.previousResponseId.trim()
        ? body.previousResponseId.trim()
        : undefined;

    if (!previousResponseId) {
      const { data: latest } = await supabaseAdmin
        .from("ops_pie_reports")
        .select("openai_response_id")
        .eq("ops_intake_id", opsIntakeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.openai_response_id) {
        previousResponseId = latest.openai_response_id;
      }
    }

    const followUpNote = String(body.followUpNote ?? "").trim() || null;

    const combinedNotes = [intake.notes, followUpNote ? `FOLLOW-UP NOTE:\n${followUpNote}` : null]
      .filter(Boolean)
      .join("\n\n");

    // 4) build PIE input
    const pieIntake = {
      submissionId: intake.id,
      businessName: intake.company_name,
      contactName: intake.contact_name,
      industry: intake.industry ?? undefined,
      location: undefined,
      teamSize: intake.team_size ?? undefined,
      currentTools: Array.isArray(intake.current_tools) ? intake.current_tools : [],
      problems: Array.isArray(intake.pain_points) ? intake.pain_points : [],
      goals: Array.isArray(intake.workflows_needed) ? intake.workflows_needed : [],
      budgetRange: intake.recommendation_price_range ?? undefined,
      urgency: intake.urgency ?? undefined,
      notes: combinedNotes || undefined,
      raw: {
        intake,
        recommendation: {
          tier: intake.recommendation_tier,
          priceRange: intake.recommendation_price_range,
          score: intake.recommendation_score,
        },
      },
    };

    // 5) generate via OpenAI
    const pie = await generatePieOpsReport({
      intake: pieIntake,
      previousResponseId,
    });

    const summary = getExecutiveSummary(pie.report);

    // 6) persist
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("ops_pie_reports")
      .insert({
        ops_intake_id: opsIntakeId,
        generator: "pie-ai",
        report_version: "v1",
        status: "generated",
        model: pie.model,
        openai_response_id: pie.responseId,
        previous_response_id: previousResponseId ?? null,
        summary: summary,
        input_snapshot: pieIntake,
        report_json: pie.report,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        {
          ok: false,
          error: `PIE generated but failed to save: ${
            insertError?.message || "unknown insert error"
          }`,
        },
        { status: 500 }
      );
    }

    // optional status update
    await supabaseAdmin
      .from("ops_intakes")
      .update({ status: "analyzed" })
      .eq("id", opsIntakeId);

    return NextResponse.json({
      ok: true,
      reportId: inserted.id,
      responseId: pie.responseId,
      previousResponseId: previousResponseId ?? null,
      report: pie.report,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected PIE generation error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}