import { NextRequest, NextResponse } from "next/server";
import {
  cancelProjectInvoice,
  createProjectInvoiceByQuoteId,
  editProjectInvoice,
  listProjectInvoicesByQuoteId,
  markProjectInvoicePaidByAdmin,
} from "@/lib/projectInvoices";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-invoices", limit: 60 });
  if (rlErr) return rlErr;

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
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-invoices", limit: 30 });
  if (rlErr) return rlErr;

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

// Action-discriminated PATCH for invoice mutations:
//   action="mark_paid_offline"  body: { invoiceId, reference?, paidAt? }
//   action="edit"               body: { invoiceId, patch: { amount?, ... } }
//   action="cancel"             body: { invoiceId, reason }
export async function PATCH(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-invoices", limit: 30 });
  if (rlErr) return rlErr;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const action = String(body?.action || "").trim();
  const invoiceId = String(body?.invoiceId || "").trim();
  const quoteId = String(body?.quoteId || "").trim();
  if (!action || !invoiceId) {
    return NextResponse.json(
      { ok: false, error: "action and invoiceId required" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actor = {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getIpFromHeaders(req.headers),
  };

  try {
    let invoice;
    if (action === "mark_paid_offline") {
      invoice = await markProjectInvoicePaidByAdmin({
        invoiceId,
        paidAt: typeof body?.paidAt === "string" ? body.paidAt : null,
        reference: typeof body?.reference === "string" ? body.reference : null,
        actor,
      });
    } else if (action === "edit") {
      const patch = body?.patch && typeof body.patch === "object" ? body.patch : null;
      if (!patch) {
        return NextResponse.json({ ok: false, error: "patch required" }, { status: 400 });
      }
      invoice = await editProjectInvoice({ invoiceId, patch, actor });
    } else if (action === "cancel") {
      const reason = String(body?.reason || "").trim();
      if (!reason) {
        return NextResponse.json({ ok: false, error: "reason required" }, { status: 400 });
      }
      invoice = await cancelProjectInvoice({ invoiceId, reason, actor });
    } else {
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }

    // Refresh the full list so the admin UI doesn't have to re-derive
    // sort order / dedupe.
    const invoices = quoteId ? await listProjectInvoicesByQuoteId(quoteId) : [];
    return NextResponse.json({ ok: true, invoice, invoices });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed" },
      { status: 500 },
    );
  }
}
