import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/stripeServer";
import {
  listProjectInvoicesByQuoteId,
  sendProjectInvoice,
} from "@/lib/projectInvoices";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
