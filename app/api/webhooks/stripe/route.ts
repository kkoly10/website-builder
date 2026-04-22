// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { markDepositPaidForQuoteId } from "@/lib/customerPortal";
import { confirmEcommerceDepositPayment, confirmOpsDepositPayment } from "@/lib/depositPayments";
import { markProjectInvoicePaid } from "@/lib/projectInvoices";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));
  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSig = sigPart.slice(3);
  const signedPayload = `${timestamp}.${rawBody}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const computedSig = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (computedSig.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  if (mismatch !== 0) return false;

  const ageSeconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (ageSeconds > 300) return false;
  return true;
}

function safeObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

async function confirmWebsiteQuotePayment(session: any, quoteId: string) {
  const { data: existing } = await supabaseAdmin
    .from("quotes")
    .select("id, debug, status")
    .eq("id", quoteId)
    .single();

  if (!existing) return;

  const prevDebug = safeObj(existing.debug);
  const prevInternal = safeObj(prevDebug.internal);
  const now = new Date().toISOString();
  const history = Array.isArray((prevInternal as any).history) ? ((prevInternal as any).history as any[]) : [];
  history.push({ at: now, action: "deposit_paid_webhook", status: "paid", sessionId: session.id });

  const nextInternal = {
    ...prevInternal,
    payment: {
      session_id: session.id,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      customer_email: session.customer_email ?? null,
      paid_at: now,
      confirmed_via: "webhook",
    },
    history,
  };

  const nextDebug = { ...prevDebug, internal: nextInternal };

  await supabaseAdmin.from("quotes").update({ status: "paid", debug: nextDebug }).eq("id", quoteId);

  await markDepositPaidForQuoteId(quoteId, {
    amountCents: Number(session.amount_total ?? 0) || null,
    checkoutUrl: null,
    paidAt: now,
    reference: String(session.id || ""),
  });
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const sigHeader = req.headers.get("stripe-signature") || "";
    const valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
    if (!valid) {
      console.error("[stripe-webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (String(event?.type || "") !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event?.data?.object;
    if (!session || String(session?.payment_status || "") !== "paid") {
      return NextResponse.json({ received: true });
    }

    const metadata = safeObj(session?.metadata);
    const lane = String(metadata.lane || "").trim().toLowerCase();
    const invoiceId = String(metadata.invoiceId || "").trim();
    const quoteId = String(metadata.quoteId || "").trim();
    const opsIntakeId = String(metadata.opsIntakeId || "").trim();
    const ecomIntakeId = String(metadata.ecomIntakeId || "").trim();
    const ecomQuoteId = String(metadata.ecomQuoteId || "").trim();

    if (invoiceId) {
      await markProjectInvoicePaid({
        invoiceId,
        session: {
          id: session.id,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? null,
          customer_email: session.customer_email ?? null,
        },
      });
    } else if (lane === "ops" && opsIntakeId) {
      await confirmOpsDepositPayment({
        opsIntakeId,
        session: {
          id: session.id,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? null,
          customer_email: session.customer_email ?? null,
        },
      });
    } else if (lane === "ecommerce" && ecomIntakeId) {
      await confirmEcommerceDepositPayment({
        ecomIntakeId,
        ecomQuoteId: ecomQuoteId || null,
        session: {
          id: session.id,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? null,
          customer_email: session.customer_email ?? null,
        },
      });
    } else if (quoteId) {
      await confirmWebsiteQuotePayment(session, quoteId);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    console.error("[stripe-webhook] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
