import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOpsPieForIntake } from "@/lib/opsPie";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { maybeAttachOpsIntakeToUser } from "@/lib/accessControl";

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
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `ops-request-call:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

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

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id && user?.email) {
      await maybeAttachOpsIntakeToUser({
        opsIntakeId,
        userId: user.id,
        userEmail: user.email,
      });
    }

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

    let pieGenerated = false;
    let pieError: string | null = null;

    try {
      await generateOpsPieForIntake(opsIntakeId, { force: false });
      pieGenerated = true;
    } catch (e) {
      pieGenerated = false;
      pieError = e instanceof Error ? e.message : "PIE generation failed";
    }

    const nextUrl = `/portal/ops/${encodeURIComponent(opsIntakeId)}`;

    await recordServerEvent({
      event: "ops_call_requested",
      page: "/ops-book",
      ip,
      metadata: {
        opsIntakeId,
        callRequestId: callRow.id,
        pieGenerated,
      },
    });

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
