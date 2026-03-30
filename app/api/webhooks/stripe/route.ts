// app/api/webhooks/stripe/route.ts
//
// Stripe sends a POST here when a checkout session is completed.
//
// Setup in Stripe Dashboard → Developers → Webhooks:
//   URL:    https://crecystudio.com/api/webhooks/stripe
//   Events: checkout.session.completed
//
// Then add STRIPE_WEBHOOK_SECRET to your environment variables.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe uses this to sign webhook payloads so we can verify authenticity.
async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  // Stripe signature format: t=<timestamp>,v1=<signature>
  const parts = sigHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSig = sigPart.slice(3);

  // Stripe signs: "<timestamp>.<rawBody>"
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
  const computedSig = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison
  if (computedSig.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) {
    mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }

  if (mismatch !== 0) return false;

  // Reject if timestamp is older than 5 minutes (replay protection)
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (ageSeconds > 300) return false;

  return true;
}

function safeObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
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
    const eventType = String(event?.type || "");

    // We only care about completed checkout sessions
    if (eventType !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event?.data?.object;
    if (!session) {
      return NextResponse.json({ received: true });
    }

    const quoteId = String(session?.metadata?.quoteId || "").trim();
    const paymentStatus = String(session?.payment_status || "");

    if (!quoteId || paymentStatus !== "paid") {
      return NextResponse.json({ received: true });
    }

    // Fetch existing quote to merge debug data
    const { data: existing } = await supabaseAdmin
      .from("quotes")
      .select("id, debug, status")
      .eq("id", quoteId)
      .single();

    if (!existing) {
      console.error(`[stripe-webhook] Quote not found: ${quoteId}`);
      return NextResponse.json({ received: true });
    }

    const prevDebug = safeObj(existing.debug);
    const prevInternal = safeObj(prevDebug.internal);
    const now = new Date().toISOString();

    const history = Array.isArray(prevInternal.history) ? prevInternal.history : [];
    history.push({
      at: now,
      action: "deposit_paid_webhook",
      status: "paid",
      sessionId: session.id,
    });

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

    await supabaseAdmin
      .from("quotes")
      .update({ status: "paid", debug: nextDebug })
      .eq("id", quoteId);

    // Also update portal state if it exists
    const { data: portalState } = await supabaseAdmin
      .from("quote_portal_state")
      .select("quote_id")
      .eq("quote_id", quoteId)
      .maybeSingle();

    if (portalState) {
      await supabaseAdmin
        .from("quote_portal_state")
        .update({
          deposit_status: "paid",
          deposit_paid_at: now,
          updated_at: now,
        })
        .eq("quote_id", quoteId);
    }

    console.log(`[stripe-webhook] Deposit confirmed for quote ${quoteId}`);

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    console.error("[stripe-webhook] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
