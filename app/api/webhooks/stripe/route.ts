// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { markDepositPaidForQuoteId } from "@/lib/customerPortal";
import { confirmEcommerceDepositPayment, confirmOpsDepositPayment } from "@/lib/depositPayments";
import { markProjectInvoicePaid } from "@/lib/projectInvoices";
import { captureBackgroundError } from "@/lib/sentry";
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

// UUID v4 (and adjacent variants) validation for metadata IDs that
// Stripe relays back from session creation. Test sessions or admin
// typos can put garbage in metadata.quoteId — without this gate the
// downstream `.eq("id", quoteId)` queries silently return 0 rows and
// the webhook acks 200 while doing nothing. Logging + skipping is
// strictly better than silent no-op.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
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

  const paymentIntentId = String(charge.payment_intent || "").trim();
  if (!paymentIntentId) {
    console.warn(`[stripe-webhook] ${eventType} with no payment_intent`, charge.id);
    return;
  }

  // Match on the exact payment_intent inside the debug JSONB at the DB
  // level instead of fetching every quote with any payment metadata
  // and filtering in memory. Postgres can evaluate the `->>` operator
  // against the JSONB column directly, and there's only ever 1 (or 0)
  // quotes for a given payment_intent.
  const { data: matchingQuotes } = await supabaseAdmin
    .from("quotes")
    .select("id, debug, status, deposit_status")
    .filter("debug->internal->payment->>payment_intent", "eq", paymentIntentId)
    .limit(1);

  if (!matchingQuotes?.length) {
    // Escalate to Sentry — Stripe has confirmed a refund/dispute on a
    // payment that we can't trace back to a quote. Possible causes:
    // (1) the original payment was for a non-website lane and we never
    // persisted the payment_intent on a quote row (ecom/ops have their
    // own state tables); (2) the quote was deleted; (3) data drift. In
    // every case a human needs to reconcile the customer's portal
    // status manually.
    captureBackgroundError(
      new Error(`stripe-webhook: ${eventType} with no matching quote`),
      {
        where: "stripe-webhook.refund_unmatched",
        extra: { eventType, paymentIntentId, chargeId: charge.id, eventId: event.id },
      }
    );
    return;
  }

  for (const q of matchingQuotes) {
    const debug = safeObj(q.debug);
    const internal = safeObj(debug.internal);
    const payment = safeObj(internal.payment);

    const now = new Date().toISOString();
    const history = Array.isArray((internal as any).history) ? ((internal as any).history as any[]) : [];
    const action = eventType === "charge.refunded" ? "refunded" : "disputed";

    // Idempotency check: if we've already processed this exact Stripe
    // event ID against this quote, do nothing. Stripe retries on any
    // non-2xx response (including the 503 we return for concurrent
    // checkout sessions) and will also retry on its own internal
    // network blips. NOTE: this handles retries of the same event, not
    // Stripe's legitimate multi-event refund lifecycle (where a single
    // refund can emit multiple charge.refunded events for incremental
    // reconciliation). Cumulative-amount tracking for partial refunds
    // is a follow-up.
    const alreadyProcessed = history.some(
      (h) => h && typeof h === "object" && h.eventId === event.id,
    );
    if (alreadyProcessed) {
      console.log(`[stripe-webhook] ${eventType} ${event.id} already applied to quote ${q.id} — skipping`);
      return;
    }

    // Only flip status if the quote was previously paid. A refund/
    // dispute event for a quote in `pending` / `cancelled` / `new`
    // means data drift, not a refund-of-paid — silently rewriting
    // those rows to "refunded" makes the audit trail lie. Log and
    // escalate so a human can reconcile.
    const prevDepositStatus = String(q.deposit_status || "").toLowerCase();
    if (prevDepositStatus !== "paid") {
      captureBackgroundError(
        new Error(
          `stripe-webhook: ${eventType} on quote ${q.id} with non-paid deposit_status=${prevDepositStatus}`
        ),
        {
          where: "stripe-webhook.refund_on_unpaid",
          extra: { eventType, quoteId: q.id, prevDepositStatus, paymentIntentId, eventId: event.id },
        }
      );
      return;
    }

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
        deposit_status: action === "refunded" ? "refunded" : "disputed",
      })
      .eq("id", q.id);

    console.warn(`[stripe-webhook] ${eventType} applied to quote ${q.id}`);
    return;
  }
}

async function confirmWebsiteQuotePayment(session: any, quoteId: string) {
  // .maybeSingle so a missing quote returns null rather than throwing
  // PGRST116 — the webhook continues with its other handlers instead
  // of failing the whole event.
  const { data: existing } = await supabaseAdmin
    .from("quotes")
    .select("id, debug, status")
    .eq("id", quoteId)
    .maybeSingle();

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

  // Use explicit isFinite check instead of `|| null`. The fallback
  // pattern swallows legitimate $0 amounts (rare but possible on
  // promo/test sessions) as "unknown" rather than recording the
  // actual zero.
  const rawAmount = Number(session.amount_total ?? NaN);
  await markDepositPaidForQuoteId(quoteId, {
    amountCents: Number.isFinite(rawAmount) ? rawAmount : null,
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
    const eventType = String(event?.type || "").trim();

    // Defensive: a signature-valid Stripe event always carries id + type.
    // Return 400 with a log breadcrumb if either is missing — that's a
    // clear contract violation we want visibility on (likely indicates
    // someone replaying a hand-crafted payload or a Stripe API change)
    // rather than a 200 no-op that hides the anomaly.
    if (!eventId || !eventType) {
      console.error(
        "[stripe-webhook] malformed event — missing id or type",
        { hasId: !!eventId, hasType: !!eventType },
      );
      return NextResponse.json(
        { error: "Malformed event: missing id or type" },
        { status: 400 },
      );
    }

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

    // Strict UUID validation on every ID we route on. If a test session
    // or admin typo puts garbage in metadata, we log and skip rather
    // than running a no-op .eq("id", "garbage") against the DB. Empty
    // string passes through (treated as "absent") so the existing
    // "if (invoiceId)" branch logic still works correctly.
    const validateId = (raw: unknown, field: string): string => {
      const v = String(raw || "").trim();
      if (!v) return "";
      if (!isUuid(v)) {
        console.warn(`[stripe-webhook] non-UUID ${field} in metadata: ${v}`);
        return "";
      }
      return v;
    };

    const invoiceId = validateId(metadata.invoiceId, "invoiceId");
    const quoteId = validateId(metadata.quoteId, "quoteId");
    const opsIntakeId = validateId(metadata.opsIntakeId, "opsIntakeId");
    const ecomIntakeId = validateId(metadata.ecomIntakeId, "ecomIntakeId");
    const ecomQuoteId = validateId(metadata.ecomQuoteId, "ecomQuoteId");

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
    // Capture to Sentry — Stripe webhook failures are billing-critical
    // (customer paid but the system didn't recognize it). Vercel logs
    // alone aren't enough. Returning 500 makes Stripe retry per its
    // built-in retry schedule, but a persistent failure still needs a
    // human to look at it.
    captureBackgroundError(err, {
      where: "stripe-webhook",
      extra: { message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
