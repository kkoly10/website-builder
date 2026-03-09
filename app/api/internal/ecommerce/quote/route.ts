import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const quoteId = String(body.quoteId || "").trim();
    const ecomIntakeId = String(body.ecomIntakeId || "").trim();

    if (!quoteId && !ecomIntakeId) {
      return NextResponse.json({ ok: false, error: "quoteId or ecomIntakeId is required" }, { status: 400 });
    }

    const payload = {
      estimate_setup_fee: Number.isFinite(Number(body.estimateSetupFee)) ? Number(body.estimateSetupFee) : null,
      estimate_monthly_fee: Number.isFinite(Number(body.estimateMonthlyFee)) ? Number(body.estimateMonthlyFee) : null,
      estimate_fulfillment_model: String(body.estimateFulfillmentModel || "").trim() || null,
      quote_json: typeof body.quoteJson === "object" && body.quoteJson ? body.quoteJson : {},
      status: String(body.status || "draft").trim() || "draft",
      updated_at: new Date().toISOString(),
    };

    if (quoteId) {
      const { error } = await supabaseAdmin.from("ecom_quotes").update(payload).eq("id", quoteId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, quoteId });
    }

    const { data, error } = await supabaseAdmin
      .from("ecom_quotes")
      .insert({ ...payload, ecom_intake_id: ecomIntakeId })
      .select("id")
      .single<{ id: string }>();

    if (error || !data?.id) {
      return NextResponse.json({ ok: false, error: error?.message || "Failed to create quote" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, quoteId: data.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
