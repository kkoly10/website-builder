import {
  emailWrap,
  ctaButton,
  adminTable,
  callout,
  sig,
  escHtml,
} from "@/lib/emailHelpers";
import { normalizeEmailLocale, t, invoiceTypeLabel } from "@/lib/i18n/emailStrings";

// Pure render for the client-facing invoice email. Kept in its own
// module (separate from lib/projectInvoices.ts) so the preview script
// and Playwright tests can import it without dragging in
// supabaseAdmin's module-load env-var check.

export type InvoiceEmailArgs = {
  amount: number;
  dueDate?: string | null;
  invoiceType: string;
  leadName?: string | null;
  payUrl: string;
  portalUrl: string;
  quoteId: string;
  recipientEmail: string;
  notes?: string | null;
  lang?: string | null;
};

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function intlLocale(lang: "en" | "fr" | "es"): string {
  if (lang === "fr") return "fr-FR";
  if (lang === "es") return "es-ES";
  return "en-US";
}

export function renderInvoiceEmail(args: InvoiceEmailArgs): { subject: string; html: string } {
  const lang = normalizeEmailLocale(args.lang);
  const typeLabel = invoiceTypeLabel(args.invoiceType, lang);
  const formattedAmount = new Intl.NumberFormat(intlLocale(lang), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(args.amount);
  const formattedDueDate = args.dueDate
    ? new Date(args.dueDate).toLocaleDateString(intlLocale(lang), {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const trimmedName = str(args.leadName);
  const headline = trimmedName
    ? t("invoice.headline_named", lang, { name: escHtml(trimmedName) })
    : t("invoice.headline_unnamed", lang);
  const safeNotes = str(args.notes) ? escHtml(str(args.notes)).replace(/\n/g, "<br/>") : null;

  const tableRows: [string, string][] = [
    [t("invoice.row_amount", lang), `<strong style="font-size:15px;color:#111111">${escHtml(formattedAmount)}</strong>`],
    [t("invoice.row_type", lang), escHtml(typeLabel)],
    [t("invoice.row_project", lang), `<span style="font-family:monospace;font-size:12px;color:#888888">${escHtml(args.quoteId.slice(0, 8))}</span>`],
  ];
  if (formattedDueDate) tableRows.push([t("invoice.row_due", lang), escHtml(formattedDueDate)]);

  return {
    subject: t("invoice.subject", lang, { amount: formattedAmount }),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${headline}</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("invoice.eyebrow", lang, { type: typeLabel }))}</p>
      ${adminTable(tableRows)}
      ${ctaButton(args.payUrl, t("invoice.cta", lang))}
      ${safeNotes ? callout(t("invoice.notes_label", lang), [safeNotes]) : ""}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${t("invoice.portal_link", lang, { url: escHtml(args.portalUrl) })}</p>
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      preheader: t("invoice.preheader", lang, { amount: formattedAmount }),
      lang,
    }),
  };
}
