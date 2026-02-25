import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOpsPieForIntake } from "@/lib/opsPie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RequestBody = {
  opsIntakeId?: string;
  ops_intake_id?: string;
  bestTimeToCall?: string;
  best_time_to_call?: string;
  preferredTimes?: string;
  preferred_times?: string;
  timezone?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    let body: RequestBody = {};
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      body = {};
    }

    const opsIntakeId = String(body.opsIntakeId || body.ops_intake_id || "").trim();
    const bestTimeToCall = String(body.bestTimeToCall || body.best_time_to_call || "").trim();
    const preferredTimes = String(body.preferredTimes || body.preferred_times || "").trim();
    const timezone = String(body.timezone || "").trim();
    const notes = String(body.notes || "").trim();

    if (!opsIntakeId) {
      return NextResponse.json(
        {
          error: "Missing ops intake",
          detail: "Start from the workflow intake page so we can attach the booking to the right submission.",
        },
        { status: 400 }
      );
    }

    // Make sure intake exists
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("ops_intakes")
      .select("id,email,lead_email,company_name,contact_name,status")
      .eq("id", opsIntakeId)
      .maybeSingle();

    if (intakeError) {
      return NextResponse.json(
        { error: `Failed to verify ops intake: ${intakeError.message}` },
        { status: 500 }
      );
    }

    if (!intake) {
      return NextResponse.json(
        {
          error: "Missing ops intake",
          detail: "Start from the workflow intake page so we can attach the booking to the right submission.",
        },
        { status: 404 }
      );
    }

    // Create call request row
    const insertPayload = {
      ops_intake_id: opsIntakeId,
      best_time_to_call: bestTimeToCall || null,
      preferred_times: preferredTimes || null,
      timezone: timezone || null,
      notes: notes || null,
      status: "requested",
    };

    const { data: callRequest, error: callErr } = await supabaseAdmin
      .from("ops_call_requests")
      .insert(insertPayload)
      .select("*")
      .single();

    if (callErr) {
      return NextResponse.json(
        { error: `Failed to create call request: ${callErr.message}` },
        { status: 500 }
      );
    }

    // Optional: mark intake as booking requested (non-blocking if update fails)
    await supabaseAdmin
      .from("ops_intakes")
      .update({ status: "call_requested" })
      .eq("id", opsIntakeId);

    // Generate PIE report, but do not fail booking if PIE fails
    let pieGenerated = false;
    let pieError: string | null = null;
    let pieReportId: string | null = null;
    let pieSummary: string | null = null;
    let pieGenerator: string | null = null;

    try {
      const pie = await generateOpsPieForIntake(opsIntakeId, { force: false });

      // The function returns an ops_pie_reports row
      pieGenerated = !!pie?.id;
      pieReportId = pie?.id ?? null;
      pieSummary = pie?.summary ?? null;
      pieGenerator = pie?.generator ?? null;
    } catch (e) {
      pieError = e instanceof Error ? e.message : "PIE generation failed";
      // Intentionally do not fail booking
      console.error("[/api/ops/request-call] PIE generation failed:", e);
    }

    return NextResponse.json({
      ok: true,
      message: "Call request submitted successfully.",
      callRequest: {
        id: callRequest.id,
        ops_intake_id: callRequest.ops_intake_id,
        status: callRequest.status,
        preferred_times: callRequest.preferred_times,
        best_time_to_call: callRequest.best_time_to_call,
        timezone: callRequest.timezone,
        created_at: callRequest.created_at,
      },
      pie: {
        generated: pieGenerated,
        report_id: pieReportId,
        generator: pieGenerator,
        summary: pieSummary,
        error: pieError,
      },
    });
  } catch (error: any) {
    console.error("[/api/ops/request-call] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to submit call request",
      },
      { status: 500 }
    );
  }
}