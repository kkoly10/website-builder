import { NextRequest, NextResponse } from "next/server";
import {
  createProjectInvoiceByQuoteId,
  listProjectInvoicesByQuoteId,
} from "@/lib/projectInvoices";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const quoteId = String(req.nextUrl.searchParams.get("quoteId") || "").trim();
    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "quoteId is required." }, { status: 400 });
    }

    const invoices = await listProjectInvoicesByQuoteId(quoteId);
    return NextResponse.json({ ok: true, invoices });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load invoices." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const quoteId = String(body?.quoteId || "").trim();
    const amount = Number(body?.amount);

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "quoteId is required." }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invoice amount must be greater than zero." },
        { status: 400 }
      );
    }

    const invoice = await createProjectInvoiceByQuoteId({
      quoteId,
      invoiceType: String(body?.invoiceType || "milestone").trim().toLowerCase() as any,
      amount,
      dueDate: typeof body?.dueDate === "string" ? body.dueDate : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
    });

    const invoices = await listProjectInvoicesByQuoteId(quoteId);
    return NextResponse.json({ ok: true, invoice, invoices });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create invoice." },
      { status: 500 }
    );
  }
}
