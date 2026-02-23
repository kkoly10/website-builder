import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const opsIntakeId = String(body.opsIntakeId ?? "").trim();
    if (!opsIntakeId) {
      return NextResponse.json(
        { ok: false, error: "opsIntakeId is required." },
        { status: 400 }
      );
    }

    // make sure intake exists
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from("ops_intakes")
      .select("id")
      .eq("id", opsIntakeId)
      .maybeSingle<{ id: string }>();

    if (intakeError || !intake) {
      return NextResponse.json(
        { ok: false, error: intakeError?.message || "Ops intake not found." },
        { status: 404 }
      );
    }

    const payload = {
      ops_intake_id: opsIntakeId,
      best_time_to_call: String(body.bestTimeToCall ?? "").trim() || null,
      preferred_times: String(body.preferredTimes ?? "").trim() || null,
      timezone: String(body.timezone ?? "").trim() || "America/New_York",
      notes: String(body.notes ?? "").trim() || null,
      status: "new",
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("ops_call_requests")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();

    if (insertError || !inserted) {
      return NextResponse.json(
        { ok: false, error: insertError?.message || "Failed to save call request." },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("ops_intakes")
      .update({ status: "call_requested" })
      .eq("id", opsIntakeId);

    return NextResponse.json({
      ok: true,
      callRequestId: inserted.id,
      nextUrl: `/ops-thank-you?opsIntakeId=${encodeURIComponent(
        opsIntakeId
      )}&callRequestId=${encodeURIComponent(inserted.id)}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}