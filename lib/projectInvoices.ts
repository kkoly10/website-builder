import { ensureCustomerPortalForQuoteId, markDepositPaidForQuoteId } from "@/lib/customerPortal";
import { logProjectActivityByPortalId } from "@/lib/projectActivity";
import { sendResendEmail } from "@/lib/resend";
import { stripeCreateCheckoutSession } from "@/lib/stripeServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  emailWrap,
  ctaButton,
  adminTable,
  callout,
  sig,
  escHtml,
} from "@/lib/emailHelpers";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "studio@10xwebsites.com";

export type ProjectInvoiceView = {
  id: string;
  quoteId: string;
  invoiceType: "deposit" | "milestone" | "final" | "retainer";
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string | null;
  paidAt: string | null;
  notes: string;
  paymentUrl: string | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  isPayable: boolean;
};

type InvoiceRow = Record<string, any>;

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDate(value: unknown) {
  const raw = str(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function dollarsToCents(value: unknown) {
  const amount = num(value);
  return Math.round(amount * 100);
}

function ensureBaseUrl(value: string) {
  return str(value).replace(/\/$/, "") || "https://crecystudio.com";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function deriveInvoiceStatus(row: InvoiceRow): ProjectInvoiceView["status"] {
  const baseStatus = str(row.status, "draft").toLowerCase();
  if (baseStatus === "paid" || baseStatus === "cancelled" || baseStatus === "draft") {
    return baseStatus as ProjectInvoiceView["status"];
  }

  const dueDate = safeDate(row.due_date);
  if (dueDate && new Date(dueDate).getTime() < Date.now()) {
    return "overdue";
  }

  return "sent";
}

function serializeInvoice(row: InvoiceRow, quoteId: string): ProjectInvoiceView {
  const status = deriveInvoiceStatus(row);
  return {
    id: str(row.id),
    quoteId,
    invoiceType: (str(row.invoice_type, "milestone").toLowerCase() ||
      "milestone") as ProjectInvoiceView["invoiceType"],
    amount: num(row.amount),
    currency: str(row.currency, "usd").toLowerCase(),
    status,
    dueDate: safeDate(row.due_date),
    paidAt: safeDate(row.paid_at),
    notes: str(row.notes),
    paymentUrl: str(row.stripe_payment_url) || null,
    sessionId: str(row.stripe_session_id) || null,
    createdAt: safeDate(row.created_at) || new Date().toISOString(),
    updatedAt: safeDate(row.updated_at) || safeDate(row.created_at) || new Date().toISOString(),
    isPayable: !!str(row.stripe_payment_url) && !["paid", "cancelled", "draft"].includes(status),
  };
}

async function getPortalProjectByToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function getInvoiceContextById(invoiceId: string) {
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("project_invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) throw new Error(invoiceError.message);
  if (!invoice) throw new Error("Invoice not found.");

  const { data: portal, error: portalError } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("id", invoice.portal_project_id)
    .maybeSingle();

  if (portalError) throw new Error(portalError.message);
  if (!portal) throw new Error("Portal project not found.");

  const { data: quote, error: quoteError } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", portal.quote_id)
    .maybeSingle();

  if (quoteError) throw new Error(quoteError.message);
  if (!quote) throw new Error("Quote not found.");

  let lead: Record<string, any> | null = null;
  if (quote.lead_id) {
    const leadRes = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", quote.lead_id)
      .maybeSingle();

    if (leadRes.error) throw new Error(leadRes.error.message);
    lead = leadRes.data ?? null;
  }

  return { invoice, portal, quote, lead };
}

async function getCustomerEmail(quote: Record<string, any>, lead: Record<string, any> | null) {
  const email = str(quote.lead_email) || str(lead?.email);
  if (!email || !email.includes("@")) {
    throw new Error("Lead email missing; cannot send invoice.");
  }
  return email;
}

async function sendInvoiceEmail(args: {
  amount: number;
  dueDate?: string | null;
  invoiceType: string;
  leadName?: string | null;
  payUrl: string;
  portalUrl: string;
  quoteId: string;
  recipientEmail: string;
  notes?: string | null;
}) {
  const typeLabel = (str(args.invoiceType).replace(/_/g, " ") || "project").trim();
  const typeLabelTitle = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(args.amount);
  const formattedDueDate = args.dueDate
    ? new Date(args.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const safeName = escHtml(str(args.leadName) || "there");
  const safeNotes = str(args.notes) ? escHtml(str(args.notes)).replace(/\n/g, "<br/>") : null;

  const tableRows: [string, string][] = [
    ["Amount", `<strong style="font-size:15px;color:#111111">${escHtml(formattedAmount)}</strong>`],
    ["Type", escHtml(typeLabelTitle)],
    ["Project", `<span style="font-family:monospace;font-size:12px;color:#888888">${escHtml(args.quoteId.slice(0, 8))}</span>`],
  ];
  if (formattedDueDate) tableRows.push(["Due", escHtml(formattedDueDate)]);

  await sendResendEmail({
    to: args.recipientEmail,
    from: FROM_EMAIL,
    subject: `Invoice ready: ${formattedAmount} — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your invoice is ready, ${safeName}.</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(typeLabelTitle)} invoice</p>
      ${adminTable(tableRows)}
      ${ctaButton(args.payUrl, "Pay this invoice")}
      ${safeNotes ? callout("Notes", [safeNotes]) : ""}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">You can also access this invoice and the project workspace anytime from <a href="${escHtml(args.portalUrl)}" style="color:#111111;text-decoration:underline">your portal</a>.</p>
      ${sig()}
    `, "Reply to this email to reach Komlan directly.", `Invoice for ${formattedAmount} is ready to pay.`),
  });
}

async function syncDepositInvoiceLink(args: {
  amount: number;
  paymentUrl: string;
  portalProjectId: string;
  quoteId: string;
}) {
  const now = new Date().toISOString();
  const depositAmountCents = dollarsToCents(args.amount);

  const { error: portalError } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      deposit_status: "pending",
      deposit_amount_cents: depositAmountCents,
      deposit_checkout_url: args.paymentUrl,
      updated_at: now,
    })
    .eq("id", args.portalProjectId);

  if (portalError) throw new Error(portalError.message);

  const { error: quoteError } = await supabaseAdmin
    .from("quotes")
    .update({
      deposit_status: "pending",
      deposit_link: args.paymentUrl,
    })
    .eq("id", args.quoteId);

  if (quoteError) throw new Error(quoteError.message);
}

export async function listProjectInvoicesByQuoteId(quoteId: string) {
  const portal = await ensureCustomerPortalForQuoteId(quoteId);
  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .select("*")
    .eq("portal_project_id", portal.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((invoice) => serializeInvoice(invoice, str(portal.quote_id)));
}

export async function listProjectInvoicesByToken(token: string) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) return [];

  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .select("*")
    .eq("portal_project_id", portal.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((invoice) => serializeInvoice(invoice, str(portal.quote_id)));
}

export async function createProjectInvoiceByQuoteId(args: {
  quoteId: string;
  invoiceType: ProjectInvoiceView["invoiceType"];
  amount: number;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const portal = await ensureCustomerPortalForQuoteId(args.quoteId);
  const amount = Math.max(0, Math.round(num(args.amount) * 100) / 100);
  if (!amount) throw new Error("Invoice amount must be greater than zero.");

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .insert({
      portal_project_id: portal.id,
      invoice_type: str(args.invoiceType, "milestone").toLowerCase(),
      amount,
      currency: "usd",
      status: "draft",
      due_date: safeDate(args.dueDate),
      notes: str(args.notes),
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logProjectActivityByPortalId({
    portalProjectId: str(portal.id),
    actorRole: "studio",
    eventType: "invoice_created",
    summary: `Studio created a ${str(args.invoiceType)} invoice for ${amount.toFixed(2)} USD.`,
    payload: {
      invoiceId: str(data.id),
      invoiceType: str(args.invoiceType),
      amount,
    },
    clientVisible: true,
  });

  return serializeInvoice(data, args.quoteId);
}

export async function sendProjectInvoice(args: {
  invoiceId: string;
  baseUrl: string;
}) {
  const context = await getInvoiceContextById(args.invoiceId);
  const customerEmail = await getCustomerEmail(context.quote, context.lead);
  const portalUrl = `${ensureBaseUrl(args.baseUrl)}/portal/${encodeURIComponent(
    str(context.portal.access_token)
  )}`;
  const dueDate = safeDate(context.invoice.due_date);
  const invoiceType = str(context.invoice.invoice_type, "milestone").toLowerCase();
  const amount = Math.max(0, Math.round(num(context.invoice.amount) * 100) / 100);

  let paymentUrl = str(context.invoice.stripe_payment_url);
  let sessionId = str(context.invoice.stripe_session_id);

  if (!paymentUrl) {
    const session = await stripeCreateCheckoutSession({
      amountUsdCents: dollarsToCents(amount),
      customerEmail,
      quoteId: str(context.quote.id),
      successUrl: `${portalUrl}?invoice=${encodeURIComponent(args.invoiceId)}&paid=1`,
      cancelUrl: `${portalUrl}?invoice=${encodeURIComponent(args.invoiceId)}`,
      productName: "CrecyStudio Project Invoice",
      productDescription: `${invoiceType} invoice for website project ${str(context.quote.id)}`,
      metadata: {
        lane: "website",
        invoiceId: args.invoiceId,
        invoiceType,
        portalProjectId: str(context.portal.id),
        quoteId: str(context.quote.id),
      },
    });

    paymentUrl = str(session.url);
    sessionId = str(session.id);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .update({
      status: "sent",
      stripe_session_id: sessionId || null,
      stripe_payment_url: paymentUrl || null,
      updated_at: now,
    })
    .eq("id", args.invoiceId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (invoiceType === "deposit" && paymentUrl) {
    await syncDepositInvoiceLink({
      amount,
      paymentUrl,
      portalProjectId: str(context.portal.id),
      quoteId: str(context.quote.id),
    });
  }

  await sendInvoiceEmail({
    amount,
    dueDate,
    invoiceType,
    leadName: str(context.lead?.name),
    payUrl: paymentUrl,
    portalUrl,
    quoteId: str(context.quote.id),
    recipientEmail: customerEmail,
    notes: str(context.invoice.notes),
  });

  await logProjectActivityByPortalId({
    portalProjectId: str(context.portal.id),
    actorRole: "studio",
    eventType: "invoice_sent",
    summary: `Studio sent a ${invoiceType} invoice to the client.`,
    payload: {
      invoiceId: args.invoiceId,
      invoiceType,
      amount,
    },
    clientVisible: true,
  });

  return serializeInvoice(data, str(context.quote.id));
}

export async function markProjectInvoicePaid(args: {
  invoiceId: string;
  session: {
    id?: string | null;
    amount_total?: number | null;
    currency?: string | null;
    customer_email?: string | null;
  };
  paidAt?: string | null;
}) {
  const context = await getInvoiceContextById(args.invoiceId);
  const paidAt = safeDate(args.paidAt) || new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .update({
      status: "paid",
      paid_at: paidAt,
      stripe_session_id: str(args.session.id) || str(context.invoice.stripe_session_id) || null,
      updated_at: paidAt,
    })
    .eq("id", args.invoiceId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (str(context.invoice.invoice_type).toLowerCase() === "deposit") {
    await markDepositPaidForQuoteId(str(context.quote.id), {
      amountCents:
        Number(args.session.amount_total ?? 0) ||
        dollarsToCents(context.invoice.amount),
      checkoutUrl: str(context.invoice.stripe_payment_url) || null,
      paidAt,
      reference: str(args.session.id) || null,
    });
  }

  await logProjectActivityByPortalId({
    portalProjectId: str(context.portal.id),
    actorRole: "system",
    eventType: "invoice_paid",
    summary: `A ${str(context.invoice.invoice_type)} invoice was paid.`,
    payload: {
      invoiceId: args.invoiceId,
      invoiceType: str(context.invoice.invoice_type),
    },
    clientVisible: true,
  });

  return serializeInvoice(data, str(context.quote.id));
}

// ─────────────────────────────────────────────────────────────────
// Admin-side invoice management. The Stripe webhook covers online
// payments via markProjectInvoicePaid; below are the offline-payment,
// edit, and cancel paths that admin needs when a client wires money,
// drops a check, or asks for a correction before sending.
// ─────────────────────────────────────────────────────────────────

// Mark an invoice paid offline (wire, check, ACH, etc.). Wraps the
// existing markProjectInvoicePaid by passing an admin-recorded session
// so the deposit-side-effects (markDepositPaidForQuoteId) still fire.
export async function markProjectInvoicePaidByAdmin(args: {
  invoiceId: string;
  paidAt?: string | null;
  reference?: string | null;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const context = await getInvoiceContextById(args.invoiceId);
  const paidAt = safeDate(args.paidAt) || new Date().toISOString();
  const reference = str(args.reference);

  // Reuse markProjectInvoicePaid for the actual update + deposit
  // side-effects. The session shape lets us pass a stable reference
  // (e.g. "wire #12345") into stripe_session_id, which makes the
  // payment traceable in the invoice list even though Stripe wasn't
  // involved.
  const result = await markProjectInvoicePaid({
    invoiceId: args.invoiceId,
    session: {
      id: reference ? `admin-${reference}` : `admin-${Date.now()}`,
      amount_total: dollarsToCents(context.invoice.amount),
      currency: str(context.invoice.currency) || "usd",
      customer_email: null,
    },
    paidAt,
  });

  // Layer an admin-attribution event on top of the system-level
  // invoice_paid so the activity feed shows it was a manual record.
  await logProjectActivityByPortalId({
    portalProjectId: str(context.portal.id),
    actorRole: "studio",
    eventType: "invoice_marked_paid_offline",
    summary: `CrecyStudio marked the ${str(context.invoice.invoice_type)} invoice paid offline${reference ? ` (ref: ${reference})` : ""}.`,
    payload: {
      invoiceId: args.invoiceId,
      reference: reference || null,
      actorUserId: args.actor.userId ?? null,
      actorEmail: args.actor.email ?? null,
      actorIp: args.actor.ip ?? null,
    },
    clientVisible: true,
  });

  return result;
}

// Edit an unsent or unpaid invoice. Once paid, mutations are blocked —
// changing the amount on a paid invoice would corrupt the audit
// trail. Admin should refund/cancel and create a new one instead.
export async function editProjectInvoice(args: {
  invoiceId: string;
  patch: {
    amount?: number;
    currency?: string;
    invoiceType?: string;
    notes?: string | null;
    dueDate?: string | null;
  };
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const context = await getInvoiceContextById(args.invoiceId);
  const status = str(context.invoice.status).toLowerCase();
  if (status === "paid") {
    throw new Error("Paid invoices cannot be edited. Cancel and create a new one instead.");
  }
  if (status === "cancelled") {
    throw new Error("Cancelled invoices cannot be edited.");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.patch.amount !== undefined && Number.isFinite(args.patch.amount)) {
    updates.amount = args.patch.amount;
  }
  if (args.patch.currency !== undefined && args.patch.currency.trim()) {
    updates.currency = args.patch.currency.trim().toLowerCase();
  }
  if (args.patch.invoiceType !== undefined && args.patch.invoiceType.trim()) {
    updates.invoice_type = args.patch.invoiceType.trim();
  }
  if (args.patch.notes !== undefined) {
    updates.notes = args.patch.notes ?? null;
  }
  if (args.patch.dueDate !== undefined) {
    updates.due_date = args.patch.dueDate ?? null;
  }

  if (Object.keys(updates).length <= 1) {
    return serializeInvoice(context.invoice as InvoiceRow, str(context.quote.id));
  }

  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .update(updates)
    .eq("id", args.invoiceId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logProjectActivityByPortalId({
    portalProjectId: str(context.portal.id),
    actorRole: "studio",
    eventType: "invoice_edited",
    summary: `CrecyStudio edited a ${str(context.invoice.invoice_type)} invoice.`,
    payload: {
      invoiceId: args.invoiceId,
      changedKeys: Object.keys(args.patch),
      actorUserId: args.actor.userId ?? null,
      actorEmail: args.actor.email ?? null,
      actorIp: args.actor.ip ?? null,
    },
    // Internal-only — invoice fields are admin housekeeping. The
    // client doesn't need a "studio updated invoice" feed entry.
    clientVisible: false,
  });

  return serializeInvoice(data, str(context.quote.id));
}

// Cancel an invoice. Sets status=cancelled. Doesn't delete the row —
// the audit trail of "we sent this, then voided it" is the point.
export async function cancelProjectInvoice(args: {
  invoiceId: string;
  reason: string;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const context = await getInvoiceContextById(args.invoiceId);
  const status = str(context.invoice.status).toLowerCase();
  if (status === "paid") {
    throw new Error(
      "Paid invoices cannot be cancelled. If a refund is needed, process it through Stripe.",
    );
  }
  const reason = args.reason.trim();
  if (!reason) {
    throw new Error("A reason is required to cancel an invoice.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("project_invoices")
    .update({ status: "cancelled", updated_at: now })
    .eq("id", args.invoiceId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logProjectActivityByPortalId({
    portalProjectId: str(context.portal.id),
    actorRole: "studio",
    eventType: "invoice_cancelled",
    summary: `CrecyStudio cancelled a ${str(context.invoice.invoice_type)} invoice: ${reason}`,
    payload: {
      invoiceId: args.invoiceId,
      reason,
      actorUserId: args.actor.userId ?? null,
      actorEmail: args.actor.email ?? null,
      actorIp: args.actor.ip ?? null,
    },
    clientVisible: true,
  });

  return serializeInvoice(data, str(context.quote.id));
}
