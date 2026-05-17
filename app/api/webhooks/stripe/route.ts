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

// Handle charge.refunded and charge.dispute.created.
// Flips deposit_status to 'refunded' / 'disputed' on the matching
// quote (matched via the original payment intent's session metadata)
// and writes an audit row in quotes.debug.internal.history. Doesn't
// touch invoices / ops / ecom payments yet — those have their own
// state machines and we don't want to silently mutate them without
// a per-lane spec. Logs loudly so admin can manually intervene for
// non-website lanes.
async function handleRefundOrDispute(event: any, eventType: string) {
  const charge = event?.data?.object;
  if (!charge) return;

  // The session that originally collected the payment links back via
  // payment_intent. We have to look up the session from our own
  // stripe_processed_sessions table (we don't persist payment_intent
  // mappings separately) — best-effort search by metadata.
  const paymentIntentId = String(charge.payment_intent || "").trim();
  if (!paymentIntentId) {
    console.warn(`[stripe-webhook] ${eventType} with no payment_intent`, charge.id);
    return;
  }

  // We persisted the session.id (not the payment_intent) in stripe_processed_sessions.
  // Quotes store the session.id in quote.debug.internal.payment.session_id, so we
  // can match there. Search quotes with this session_id.
  const { data: matchingQuotes } = await supabaseAdmin
    .from("quotes")
    .select("id, debug, status, deposit_status")
    .filter("debug->internal->payment->>session_id", "not.is", null);

  if (!matchingQuotes?.length) {
    console.warn(`[stripe-webhook] ${eventType}: no quotes with payment metadata to scan`);
    return;
  }

  for (const q of matchingQuotes) {
    const debug = safeObj(q.debug);
    const internal = safeObj(debug.internal);
    const payment = safeObj(internal.payment);
    // Match by payment_intent — populated in confirmWebsiteQuotePayment
    // when the original session settled. A previous version of this
    // also tried `payment.session_id === charge.payment_intent`, but
    // those are different ID namespaces (cs_... vs pi_...) and will
    // never match — that branch was dropped.
    const sessionMatches = String(payment.payment_intent || "") === paymentIntentId;
    if (!sessionMatches) continue;

    const now = new Date().toISOString();
    const history = Array.isArray((internal as any).history) ? ((internal as any).history as any[]) : [];
    const action = eventType === "charge.refunded" ? "refunded" : "disputed";
    history.push({ at: now, action, eventType, eventId: event.id, chargeId: charge.id });

    const nextInternal = {
      ...internal,
      payment: {
        ...payment,
        [action === "refunded" ? "refunded_at" : "disputed_at"]: now,
        refund_amount:
          eventType === "charge.refunded" ? Number(charge.amount_refunded ?? 0) : (payment as any).refund_amount,
      },
      history,
    };

    await supabaseAdmin
      .from("quotes")
      .update({
        debug: { ...debug, internal: nextInternal },
        // deposit_status reflects the new state so /portal/[token] shows
        // it accurately instead of stale "paid".
        deposit_status: action === "refunded" ? "refunded" : "disputed",
      })
      .eq("id", q.id);

    console.warn(`[stripe-webhook] ${eventType} applied to quote ${q.id}`);
    return;
  }

  console.warn(`[stripe-webhook] ${eventType}: no matching quote for payment_intent ${paymentIntentId}`);
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
      // Persist payment_intent alongside session_id so the
      // handleRefundOrDispute matcher above can find this row when
      // Stripe later sends a charge.refunded or charge.dispute event
      // (those events carry payment_intent, not session.id).
      payment_intent: session.payment_intent ?? null,
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
    const eventId = String(event?.id || "").trim();
    const eventType = String(event?.type || "");

    // Refund / dispute events: flag the affected quote so the portal
    // doesn't keep showing "paid" indefinitely after a refund or
    // chargeback. We use the existing debug blob on quotes for the
    // audit trail since it's already shaped for payment metadata.
    if (eventType === "charge.refunded" || eventType === "charge.dispute.created") {
      await handleRefundOrDispute(event, eventType);
      return NextResponse.json({ received: true });
    }

    if (eventType !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event?.data?.object;
    if (!session || String(session?.payment_status || "") !== "paid") {
      return NextResponse.json({ received: true });
    }

    // Single-confirmation guard shared with /deposit/success. The row has
    // two states: claimed (processed_at set, completed_at null) and
    // completed (completed_at set). On a unique-constraint collision we
    // look at completed_at to distinguish "already done — safe to ack" from
    // "another worker is in flight — ask Stripe to retry."
    const sessionId = String(session?.id || "").trim();
    let claimedHere = false;
    if (sessionId) {
      const { error: claimError } = await supabaseAdmin
        .from("stripe_processed_sessions")
        .insert({ session_id: sessionId, event_id: eventId || null, source: "webhook" });

      if (!claimError) {
        claimedHere = true;
      } else {
        const code = String((claimError as any)?.code || "");
        if (code === "23505") {
          const { data: existing } = await supabaseAdmin
            .from("stripe_processed_sessions")
            .select("completed_at")
            .eq("session_id", sessionId)
            .maybeSingle();

          if (existing?.completed_at) {
            return NextResponse.json({ received: true, duplicate: true });
          }
          // Row exists but processing isn't complete — another worker is
          // either still running or has crashed mid-flight. Bounce so Stripe
          // retries; by then the other path has either committed or rolled
          // back, and we'll see a definitive completed_at on the next try.
          return NextResponse.json(
            { error: "Concurrent confirmation in flight; will retry." },
            { status: 503 }
          );
        }
        console.error("[stripe-webhook] claim insert error:", claimError);
      }
    }

    const metadata = safeObj(session?.metadata);
    // Normalize legacy "ops" metadata to "automation" so older Stripe
    // sessions continue to route to the right downstream handler.
    const rawLane = String(metadata.lane || "").trim().toLowerCase();
    const lane = rawLane === "ops" ? "automation" : rawLane;
    const invoiceId = String(metadata.invoiceId || "").trim();
    const quoteId = String(metadata.quoteId || "").trim();
    const opsIntakeId = String(metadata.opsIntakeId || "").trim();
    const ecomIntakeId = String(metadata.ecomIntakeId || "").trim();
    const ecomQuoteId = String(metadata.ecomQuoteId || "").trim();

    try {
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
      } else if (lane === "automation" && opsIntakeId) {
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
    } catch (sideEffectError) {
      // Roll back the claim so the next retry can reprocess.
      if (sessionId && claimedHere) {
        await supabaseAdmin
          .from("stripe_processed_sessions")
          .delete()
          .eq("session_id", sessionId);
      }
      throw sideEffectError;
    }

    if (sessionId && claimedHere) {
      await supabaseAdmin
        .from("stripe_processed_sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("session_id", sessionId);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    console.error("[stripe-webhook] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
