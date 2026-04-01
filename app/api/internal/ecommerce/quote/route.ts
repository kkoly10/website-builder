import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEcommerceWorkspaceBundle, saveEcommerceWorkspaceState } from "@/lib/ecommerce/workspace";

export const dynamic = "force-dynamic";

function mergeQuoteJson(existing: unknown, incoming: unknown) {
  const current = existing && typeof existing === "object" && !Array.isArray(existing) ? existing as Record<string, unknown> : {};
  const patch = incoming && typeof incoming === "object" && !Array.isArray(incoming) ? incoming as Record<string, unknown> : {};
  return {
    ...current,
    ...patch,
    workspace:
      patch.workspace && typeof patch.workspace === "object" && !Array.isArray(patch.workspace)
        ? patch.workspace
        : current.workspace,
  };
}

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

    const estimateSetupFee = Number.isFinite(Number(body.estimateSetupFee)) ? Number(body.estimateSetupFee) : null;
    const estimateMonthlyFee = Number.isFinite(Number(body.estimateMonthlyFee)) ? Number(body.estimateMonthlyFee) : null;
    const estimateFulfillmentModel = String(body.estimateFulfillmentModel || "").trim() || null;
    const nextStatus = String(body.status || "draft").trim() || "draft";

    if (quoteId) {
      const { data: existing, error: lookupError } = await supabaseAdmin
        .from("ecom_quotes")
        .select("id, ecom_intake_id, quote_json")
        .eq("id", quoteId)
        .maybeSingle();

      if (lookupError) return NextResponse.json({ ok: false, error: lookupError.message }, { status: 500 });
      if (!existing) return NextResponse.json({ ok: false, error: "Quote not found" }, { status: 404 });

      const payload = {
        estimate_setup_fee: estimateSetupFee,
        estimate_monthly_fee: estimateMonthlyFee,
        estimate_fulfillment_model: estimateFulfillmentModel,
        quote_json: mergeQuoteJson(existing.quote_json, body.quoteJson),
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin.from("ecom_quotes").update(payload).eq("id", quoteId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

      await saveEcommerceWorkspaceState({
        ecomIntakeId: existing.ecom_intake_id,
        savedBy: "admin",
        patch: {
          serviceSummary: estimateFulfillmentModel || undefined,
        },
      });

      return NextResponse.json({ ok: true, quote: { id: quoteId } });
    }

    const payload = {
      ecom_intake_id: ecomIntakeId,
      estimate_setup_fee: estimateSetupFee,
      estimate_monthly_fee: estimateMonthlyFee,
      estimate_fulfillment_model: estimateFulfillmentModel,
      quote_json: mergeQuoteJson({}, body.quoteJson),
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("ecom_quotes")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();

    if (error || !data?.id) {
      return NextResponse.json({ ok: false, error: error?.message || "Failed to create quote" }, { status: 500 });
    }

    await saveEcommerceWorkspaceState({
      ecomIntakeId,
      savedBy: "admin",
      patch: {
        serviceSummary: estimateFulfillmentModel || undefined,
      },
    });

    return NextResponse.json({ ok: true, quote: { id: data.id } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
