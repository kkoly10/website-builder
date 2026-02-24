// app/api/ops/request-call/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOpsPieForIntake } from "@/lib/opsPie";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const opsIntakeId = String(body?.opsIntakeId ?? "").trim();
    const bestTimeToCall = String(body?.bestTimeToCall ?? "").trim();
    const preferredTimes = String(body?.preferredTimes ?? "").trim();
    const timezone = String(body?.timezone ?? "").trim();
    const notes = String(body?.notes ?? "").trim();

    if (!opsIntakeId) {
      return NextResponse.json({ ok: false, error: "Missing ops intake" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Optional auth (customer may be logged out)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify intake exists (and optionally claim ownership later)
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("ops_intakes")
      .select("id, email, owner_email_norm, auth_user_id")
      .eq("id", opsIntakeId)
      .single();

    if (intakeError || !intake) {
      return NextResponse.json({ ok: false, error: "Ops intake not found" }, { status: 404 });
    }

    // If user is logged in and intake is unclaimed, attach it
    if (user?.id && !intake.auth_user_id) {
      await supabaseAdmin
        .from("ops_intakes")
        .update({ auth_user_id: user.id })
        .eq("id", opsIntakeId);
    }

    const { data: callRow, error: callError } = await supabaseAdmin
      .from("ops_call_requests")
      .insert({
        ops_intake_id: opsIntakeId,
        best_time_to_call: bestTimeToCall || null,
        preferred_times: preferredTimes || null,
        timezone: timezone || null,
        notes: notes || null,
        status: "requested",
      })
      .select("id")
      .single();

    if (callError) {
      return NextResponse.json(
        { ok: false, error: callError.message || "Failed to save call request" },
        { status: 500 }
      );
    }

    // Auto-generate PIE report (non-blocking if it fails)
    let pieGenerated = false;
    let pieError: string | null = null;

    try {
      const pie = await generateOpsPieForIntake(opsIntakeId, { force: false });
      pieGenerated = !!pie.generated;
    } catch (e) {
      pieError = e instanceof Error ? e.message : "PIE generation failed";
      // Intentionally do not fail booking
    }

    return NextResponse.json({
      ok: true,
      callRequestId: callRow?.id ?? null,
      opsIntakeId,
      pieGenerated,
      pieError,
      nextUrl: `/ops-book?opsIntakeId=${encodeURIComponent(opsIntakeId)}&booked=1`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}
