import { ensureCustomerPortalForQuoteId, markDepositPaidForQuoteId } from "@/lib/customerPortal";
import { sendResendEmail } from "@/lib/resend";
import { stripeCreateCheckoutSession } from "@/lib/stripeServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  const email = str(quote.lead_email) || str(lead?.email) || str(lead?.lead_email);
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
  const typeLabel = str(args.invoiceType).replace(/_/g, " ") || "project";
  const dueLine = args.dueDate
    ? `<p><strong>Due date:</strong> ${escapeHtml(
        new Date(args.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )}</p>`
    : "";
  const notesLine = str(args.notes)
    ? `<p><strong>Notes:</strong><br/>${escapeHtml(str(args.notes)).replace(/\n/g, "<br/>")}</p>`
    : "";

  await sendResendEmail({
    to: args.recipientEmail,
    from: FROM_EMAIL,
    subject: `Invoice ready for your CrecyStudio project`,
    html: `
      <h2>Invoice ready</h2>
      <p>Hi ${escapeHtml(str(args.leadName) || "there")},</p>
      <p>Your ${escapeHtml(typeLabel)} invoice for project ${escapeHtml(
        args.quoteId.slice(0, 8)
      )} is ready.</p>
      <p><strong>Amount:</strong> ${escapeHtml(
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(args.amount)
      )}</p>
      ${dueLine}
      ${notesLine}
      <p><a href="${args.payUrl}">Pay this invoice</a></p>
      <p><a href="${args.portalUrl}">Open your project portal</a></p>
      <p>CrecyStudio</p>
    `,
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

  return serializeInvoice(data, str(context.quote.id));
}
