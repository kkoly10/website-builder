import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOpsPieForIntake } from "@/lib/opsPie";

export const dynamic = "force-dynamic";

type Payload = {
  opsIntakeId?: string;
  bestTimeToCall?: string;
  preferredTimes?: string;
  timezone?: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const opsIntakeId = String(body.opsIntakeId || "").trim();
    const bestTimeToCall = String(body.bestTimeToCall || "").trim();
    const preferredTimes = String(body.preferredTimes || "").trim();
    const timezone = String(body.timezone || "").trim();
    const notes = String(body.notes || "").trim();

    if (!opsIntakeId) {
      return NextResponse.json({ error: "Missing ops intake id" }, { status: 400 });
    }

    if (!bestTimeToCall) {
      return NextResponse.json({ error: "Select a best time to call" }, { status: 400 });
    }

    // Validate intake exists
    const { data: intake, error: intakeErr } = await supabaseAdmin
      .from("ops_intakes")
      .select("id, email, owner_email_norm, auth_user_id")
      .eq("id", opsIntakeId)
      .maybeSingle();

    if (intakeErr) {
      return NextResponse.json({ error: intakeErr.message }, { status: 500 });
    }
    if (!intake) {
      return NextResponse.json({ error: "Ops intake not found" }, { status: 404 });
    }

    // If signed in, attach this intake to the auth user (safety net)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email ? user.email.trim().toLowerCase() : null;
    if (user?.id) {
      const updatePatch: Record<string, unknown> = { auth_user_id: user.id };
      if (userEmail) updatePatch.owner_email_norm = userEmail;

      await supabaseAdmin.from("ops_intakes").update(updatePatch).eq("id", opsIntakeId);
    }

    // Create booking request
    const { data: callRow, error: callErr } = await supabaseAdmin
      .from("ops_call_requests")
      .insert({
        ops_intake_id: opsIntakeId,
        best_time_to_call: bestTimeToCall,
        preferred_times: preferredTimes || null,
        timezone: timezone || null,
        notes: notes || null,
        status: "requested",
      })
      .select("id")
      .single();

    if (callErr) {
      return NextResponse.json({ error: callErr.message }, { status: 500 });
    }

    // Kick PIE generation (do NOT block booking success if PIE fails)
    let pieGenerated = false;
    let pieError: string | null = null;

    try {
      await generateOpsPieForIntake(opsIntakeId, { force: false });
      pieGenerated = true;
    } catch (e) {
      pieGenerated = false;
      pieError = e instanceof Error ? e.message : "PIE generation failed";
    }

    const nextUrl = `/portal?opsIntakeId=${encodeURIComponent(opsIntakeId)}`;

    return NextResponse.json({
      ok: true,
      callRequestId: callRow.id,
      nextUrl,
      pieGenerated,
      pieError,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
