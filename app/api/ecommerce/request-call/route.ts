import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { enforceRateLimit, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";

export const dynamic = "force-dynamic";

type Payload = {
  ecomIntakeId?: string;
  bestTime?: string;
  preferredTimes?: string;
  timezone?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = enforceRateLimit({ key: `ecom-request-call:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = (await req.json()) as Payload;
    const ecomIntakeId = String(body.ecomIntakeId || "").trim();
    const bestTime = String(body.bestTime || "").trim();
    const preferredTimes = String(body.preferredTimes || "").trim();
    const timezone = String(body.timezone || "").trim();
    const notes = String(body.notes || "").trim();

    if (!ecomIntakeId) {
      return NextResponse.json({ ok: false, error: "ecomIntakeId is required" }, { status: 400 });
    }

    if (!bestTime) {
      return NextResponse.json({ ok: false, error: "bestTime is required" }, { status: 400 });
    }

    const { data: intake, error: intakeErr } = await supabaseAdmin
      .from("ecom_intakes")
      .select("id, auth_user_id, email")
      .eq("id", ecomIntakeId)
      .maybeSingle();

    if (intakeErr) {
      return NextResponse.json({ ok: false, error: intakeErr.message }, { status: 500 });
    }

    if (!intake) {
      return NextResponse.json({ ok: false, error: "E-commerce intake not found" }, { status: 404 });
    }

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id && !intake.auth_user_id) {
        await supabaseAdmin.from("ecom_intakes").update({ auth_user_id: user.id }).eq("id", ecomIntakeId);
      }
    } catch {
      // anonymous request is allowed
    }

    const { data: call, error: callErr } = await supabaseAdmin
      .from("ecom_call_requests")
      .insert({
        ecom_intake_id: ecomIntakeId,
        best_time: bestTime,
        preferred_times: preferredTimes || null,
        timezone: timezone || null,
        notes: notes || null,
        status: "requested",
      })
      .select("id")
      .single<{ id: string }>();

    if (callErr || !call?.id) {
      return NextResponse.json({ ok: false, error: callErr?.message || "Failed to save call request" }, { status: 500 });
    }

    await recordServerEvent({
      event: "ecom_call_requested",
      page: "/ecommerce/book",
      ip,
      metadata: { ecomIntakeId, callRequestId: call.id },
    });

    return NextResponse.json({
      ok: true,
      callRequestId: call.id,
      nextUrl: `/ecommerce/success?ecomIntakeId=${encodeURIComponent(ecomIntakeId)}&callRequestId=${encodeURIComponent(call.id)}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
