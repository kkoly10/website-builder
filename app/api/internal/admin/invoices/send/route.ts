import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/stripeServer";
import {
  listProjectInvoicesByQuoteId,
  sendProjectInvoice,
} from "@/lib/projectInvoices";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// How long after a successful send do we refuse a no-force resend.
// Catches accidental admin double-click; 5 min is generous (the
// originating fetch usually returns within a second) but small enough
// that a legitimate "the email bounced, retry" stays unblocked.
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-invoices-send", limit: 30 });
  if (rlErr) return rlErr;

  try {
    const body = await req.json();
    const invoiceId = String(body?.invoiceId || "").trim();
    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: "invoiceId is required." }, { status: 400 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    // Idempotency: if the invoice was already sent recently and the
    // payment URL is non-null, refuse the resend unless ?force=true.
    // Previously sendProjectInvoice() always emailed the client even
    // when paymentUrl already existed — admin double-click sent two
    // identical emails to the client.
    if (!force) {
      const { data: existing } = await supabaseAdmin
        .from("project_invoices")
        .select("status, stripe_payment_url, updated_at")
        .eq("id", invoiceId)
        .maybeSingle();
      if (existing?.status === "sent" && existing?.stripe_payment_url) {
        const lastSent = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
        if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Invoice already sent within the last 5 minutes. Pass ?force=true to re-email the client.",
              existing: {
                status: existing.status,
                paymentUrl: existing.stripe_payment_url,
                lastSentAt: existing.updated_at,
              },
            },
            { status: 409 }
          );
        }
      }
    }

    const invoice = await sendProjectInvoice({
      invoiceId,
      baseUrl: getBaseUrl(req),
    });

    const invoices = await listProjectInvoicesByQuoteId(invoice.quoteId);
    return NextResponse.json({ ok: true, invoice, invoices });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to send invoice." },
      { status: 500 }
    );
  }
}
