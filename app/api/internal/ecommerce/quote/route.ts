import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recordServerEvent } from "@/lib/analytics/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import { isEcommerceQuoteStatus, normalizeStatus } from "@/lib/ecommerce/status";

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  ecom_intake_id: string;
  quote_json: Record<string, unknown> | null;
};

function withSendAuditLog({
  currentQuoteJson,
  nextQuoteJson,
  includeLog,
  status,
  sendNote,
}: {
  currentQuoteJson: Record<string, unknown> | null;
  nextQuoteJson: Record<string, unknown>;
  includeLog: boolean;
  status: string;
  sendNote: string;
}) {
  if (!includeLog || status !== "sent") return nextQuoteJson;

  const currentLog = Array.isArray(currentQuoteJson?.delivery_log)
    ? (currentQuoteJson?.delivery_log as unknown[])
    : [];

  return {
    ...nextQuoteJson,
    delivery_log: [
      ...currentLog,
      {
        sent_at: new Date().toISOString(),
        channel: "admin_manual",
        note: sendNote || "Sent from admin quote editor",
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const ip = getIpFromHeaders(req.headers);
    const quoteId = String(body.quoteId || "").trim();
    const ecomIntakeId = String(body.ecomIntakeId || "").trim();

    if (!quoteId && !ecomIntakeId) {
      return NextResponse.json({ ok: false, error: "quoteId or ecomIntakeId is required" }, { status: 400 });
    }

    const nextStatus = normalizeStatus(body.status, "draft");
    if (!isEcommerceQuoteStatus(nextStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid quote status" }, { status: 400 });
    }

    const includeSendLog = !!body.logSendEvent;
    const sendNote = String(body.sendNote || "").trim();
    const inputQuoteJson = typeof body.quoteJson === "object" && body.quoteJson ? body.quoteJson : {};

    if (quoteId) {
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from("ecom_quotes")
        .select("id, ecom_intake_id, quote_json")
        .eq("id", quoteId)
        .maybeSingle<QuoteRow>();

      if (existingErr) return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
      if (!existing) return NextResponse.json({ ok: false, error: "Quote not found" }, { status: 404 });

      const payload = {
        estimate_setup_fee: Number.isFinite(Number(body.estimateSetupFee)) ? Number(body.estimateSetupFee) : null,
        estimate_monthly_fee: Number.isFinite(Number(body.estimateMonthlyFee)) ? Number(body.estimateMonthlyFee) : null,
        estimate_fulfillment_model: String(body.estimateFulfillmentModel || "").trim() || null,
        quote_json: withSendAuditLog({
          currentQuoteJson: existing.quote_json,
          nextQuoteJson: inputQuoteJson,
          includeLog: includeSendLog,
          status: nextStatus,
          sendNote,
        }),
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin.from("ecom_quotes").update(payload).eq("id", quoteId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

      if (includeSendLog && nextStatus === "sent") {
        await recordServerEvent({
          event: "ecom_quote_sent",
          page: "/internal/admin/ecommerce/[id]",
          ip,
          metadata: { quoteId, ecomIntakeId: existing.ecom_intake_id },
        });
      }

      return NextResponse.json({ ok: true, quoteId });
    }

    const payload = {
      estimate_setup_fee: Number.isFinite(Number(body.estimateSetupFee)) ? Number(body.estimateSetupFee) : null,
      estimate_monthly_fee: Number.isFinite(Number(body.estimateMonthlyFee)) ? Number(body.estimateMonthlyFee) : null,
      estimate_fulfillment_model: String(body.estimateFulfillmentModel || "").trim() || null,
      quote_json: withSendAuditLog({
        currentQuoteJson: null,
        nextQuoteJson: inputQuoteJson,
        includeLog: includeSendLog,
        status: nextStatus,
        sendNote,
      }),
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("ecom_quotes")
      .insert({ ...payload, ecom_intake_id: ecomIntakeId })
      .select("id")
      .single<{ id: string }>();

    if (error || !data?.id) {
      return NextResponse.json({ ok: false, error: error?.message || "Failed to create quote" }, { status: 500 });
    }

    if (includeSendLog && nextStatus === "sent") {
      await recordServerEvent({
        event: "ecom_quote_sent",
        page: "/internal/admin/ecommerce/[id]",
        ip,
        metadata: { quoteId: data.id, ecomIntakeId },
      });
    }

    return NextResponse.json({ ok: true, quoteId: data.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
