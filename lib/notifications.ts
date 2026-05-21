import { sendResendEmail } from "@/lib/resend";
import { emailWrap, ctaButton, adminTable, callout, sig, escHtml, adminBadge, FROM_EMAIL, ADMIN_EMAIL, UNSUBSCRIBE_EMAIL } from "@/lib/emailHelpers";
import { type EmailLocale, normalizeEmailLocale, t, greeting, laneLabel, invoiceTypeLabel } from "@/lib/i18n/emailStrings";
import { renderPostLaunch30dNudge } from "@/lib/nudges/templates";
import { captureBackgroundError } from "@/lib/sentry";

export type EventContext = {
  event: string;
  quoteId: string;
  leadName: string;
  leadEmail: string;
  workspaceUrl?: string;
  // Optional context for personalized templates. Fields are filled in
  // by callers that have access to the data; templates fall back to
  // generic copy when missing so older callers keep working.
  projectType?: string;       // "website" | "web_app" | "automation" | "ecommerce" | "rescue"
  productionUrl?: string;     // for site_live — the live URL to surface
  estimateAmount?: number;    // dollars (not cents) — for agreement_published
  depositAmount?: number;     // dollars (not cents) — for agreement_published
  // Lead's preferred locale. Client emails are translated; admin
  // emails stay English regardless (admin is internal).
  lang?: EmailLocale | string;
  // For invoice_paid_receipt event:
  paidAmount?: number;        // dollars
  invoiceType?: string;       // deposit | milestone | final | retainer
  paidAt?: string;            // ISO string
  paymentReference?: string;
};

function formatMoney(amount?: number | null, locale = "en-US"): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function intlLocale(lang: EmailLocale): string {
  if (lang === "fr") return "fr-FR";
  if (lang === "es") return "es-ES";
  return "en-US";
}

// Only render external URLs that are absolute http(s). Defense against a
// malformed or hostile production_url ever landing in an email href —
// the field is admin-set, but emails go to clients, so we don't trust it.
function safeHttpUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

// adminSubject/adminHtml override the client copy when the admin needs
// a differently-formatted version (e.g. "Hi {leadName}" makes no sense
// in the studio inbox). Falls back to client subject/html when omitted.
export type TemplateResult = {
  subject: string;
  html: string;
  toClient: boolean;
  toAdmin: boolean;
  adminSubject?: string;
  adminHtml?: string;
  // Marketing-adjacent (not strictly transactional) — add the
  // List-Unsubscribe header so Gmail/Outlook show a one-click
  // unsubscribe button. Pure transactional events (invoices, receipts,
  // agreements) leave this unset.
  marketing?: boolean;
};

const templates: Record<string, (ctx: EventContext, lang: EmailLocale) => TemplateResult> = {
  agreement_published: (ctx, lang) => {
    const lane = laneLabel(ctx.projectType, lang);
    const laneEn = laneLabel(ctx.projectType, "en");
    const shortId = ctx.quoteId.slice(0, 8);
    const hasEstimate = Number.isFinite(ctx.estimateAmount) && (ctx.estimateAmount as number) > 0;
    const hasDeposit = Number.isFinite(ctx.depositAmount) && (ctx.depositAmount as number) > 0;
    const terms = hasEstimate
      ? `${formatMoney(ctx.estimateAmount, intlLocale(lang))}${hasDeposit ? ` · ${formatMoney(ctx.depositAmount, intlLocale(lang))} ${lang === "fr" ? "à la signature" : lang === "es" ? "a la firma" : "deposit on signature"}` : ""}`
      : "";

    return {
      subject: t("agreement_published.subject", lang, { lane }),
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("agreement_published.headline", lang))}</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("agreement_published.eyebrow", lang, { lane: lane.charAt(0).toUpperCase() + lane.slice(1), shortId }))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${terms ? t("agreement_published.body_with_terms", lang, { terms: escHtml(terms) }) : t("agreement_published.body_no_terms", lang)}</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("agreement_published.body_review", lang))}</p>
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("agreement_published.cta", lang)) : ""}
        <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("agreement_published.fineprint", lang))}</p>
        ${sig(lang)}
      `, {
        footerNote: t("common.footer.reply_note", lang),
        preheader: t("agreement_published.preheader", lang, { lane }),
        lang,
      }),
      toClient: true,
      toAdmin: true,
      adminSubject: `Agreement published — ${escHtml(ctx.leadName || "client")} — ${shortId}`,
      adminHtml: emailWrap(`
        ${adminBadge("Admin alert")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Agreement sent for signature</h1>
        ${adminTable([
          ["Client", escHtml(ctx.leadName || "—")],
          ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
          ["Lane", escHtml(laneEn)],
          ...(terms ? [["Terms", escHtml(terms)] as [string, string]] : []),
          ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
        ])}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
      `),
    };
  },

  preview_ready: (ctx, lang) => {
    const lane = laneLabel(ctx.projectType, lang);
    return {
      subject: t("preview_ready.subject", lang, { lane }),
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("preview_ready.headline", lang))}</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("preview_ready.eyebrow", lang))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("preview_ready.body", lang, { lane }))}</p>
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("preview_ready.cta", lang)) : ""}
        ${callout(t("preview_ready.howto_label", lang), [
          escHtml(t("preview_ready.howto_1", lang)),
          escHtml(t("preview_ready.howto_2", lang)),
          escHtml(t("preview_ready.howto_3", lang)),
        ])}
        ${sig(lang)}
      `, {
        footerNote: t("common.footer.reply_note", lang),
        preheader: t("preview_ready.preheader", lang, { lane }),
        lang,
      }),
      toClient: true,
      toAdmin: false,
    };
  },

  launch_ready: (ctx, lang) => {
    const lane = laneLabel(ctx.projectType, lang);
    return {
      subject: t("launch_ready.subject", lang, { lane }),
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("launch_ready.headline", lang))}</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("launch_ready.eyebrow", lang))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("launch_ready.body", lang, { lane }))}</p>
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("launch_ready.cta", lang)) : ""}
        <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("launch_ready.fineprint", lang))}</p>
        ${sig(lang)}
      `, {
        footerNote: t("common.footer.reply_note", lang),
        preheader: t("launch_ready.preheader", lang, { lane }),
        lang,
      }),
      toClient: true,
      toAdmin: true,
      adminSubject: `Launch ready — ${escHtml(ctx.leadName || "client")} — ${ctx.quoteId.slice(0, 8)}`,
      adminHtml: emailWrap(`
        ${adminBadge("Admin alert")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Launch checklist signed off</h1>
        ${adminTable([
          ["Client", escHtml(ctx.leadName || "—")],
          ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
          ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
        ])}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
      `),
    };
  },

  site_live: (ctx, lang) => {
    const lane = laneLabel(ctx.projectType, lang);
    const laneEn = laneLabel(ctx.projectType, "en");
    const isWebsite = !ctx.projectType || ctx.projectType === "website";
    const productionUrl = safeHttpUrl(ctx.productionUrl);
    const liveLine = productionUrl
      ? t("site_live.body_live_at", lang, { lane, url: escHtml(productionUrl) })
      : t("site_live.body_live_generic", lang, { lane });
    const careLine = isWebsite
      ? t("site_live.body_website_care", lang)
      : t("site_live.body_app_care", lang);

    return {
      subject: t("site_live.subject", lang, { lane }),
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("site_live.headline", lang, { lane }))}</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("site_live.eyebrow", lang))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${liveLine}</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${careLine}</p>
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("site_live.cta", lang)) : ""}
        <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("site_live.fineprint", lang))}</p>
        ${sig(lang)}
      `, {
        preheader: t("site_live.preheader", lang, { lane }),
        lang,
      }),
      toClient: true,
      toAdmin: true,
      adminSubject: `Site live — ${escHtml(ctx.leadName || "client")} — ${ctx.quoteId.slice(0, 8)}`,
      adminHtml: emailWrap(`
        ${adminBadge("Admin alert")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Project marked live</h1>
        ${adminTable([
          ["Client", escHtml(ctx.leadName || "—")],
          ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
          ["Lane", escHtml(laneEn)],
          ...(productionUrl ? [["Live URL", `<a href="${escHtml(productionUrl)}" style="color:#111">${escHtml(productionUrl)}</a>`] as [string, string]] : []),
          ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
        ])}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
      `),
    };
  },

  // ─── Client-facing: deposit received / kickoff ────────────────
  deposit_received: (ctx, lang) => {
    const hasAmount = Number.isFinite(ctx.depositAmount) && (ctx.depositAmount as number) > 0;
    const intro = hasAmount
      ? t("deposit_received.body_intro", lang, { amount: formatMoney(ctx.depositAmount, intlLocale(lang)) })
      : t("deposit_received.body_intro_no_amount", lang);

    return {
      subject: t("deposit_received.subject", lang),
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("deposit_received.headline", lang))}</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("deposit_received.eyebrow", lang))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
        <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${intro}</p>
        ${callout(t("deposit_received.next_label", lang), [
          escHtml(t("deposit_received.next_1", lang)),
          escHtml(t("deposit_received.next_2", lang)),
          escHtml(t("deposit_received.next_3", lang)),
        ])}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("deposit_received.cta", lang)) : ""}
        ${sig(lang)}
      `, {
        footerNote: t("common.footer.reply_note", lang),
        preheader: t("deposit_received.preheader", lang),
        lang,
      }),
      toClient: true,
      toAdmin: false,
    };
  },

  // ─── Client-facing: branded payment receipt ───────────────────
  invoice_paid_receipt: (ctx, lang) => {
    const amount = formatMoney(ctx.paidAmount, intlLocale(lang));
    const typeLabel = invoiceTypeLabel(ctx.invoiceType, lang);
    const paidAtDate = ctx.paidAt
      ? new Date(ctx.paidAt).toLocaleDateString(intlLocale(lang), {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

    const rows: [string, string][] = [
      [t("invoice_paid_receipt.row_amount", lang), `<strong style="font-size:15px;color:#111111">${escHtml(amount)}</strong>`],
      [t("invoice_paid_receipt.row_type", lang), escHtml(typeLabel)],
      [t("invoice_paid_receipt.row_date", lang), escHtml(paidAtDate)],
      [t("invoice_paid_receipt.row_project", lang), `<span style="font-family:monospace;font-size:12px;color:#888888">${escHtml(ctx.quoteId.slice(0, 8))}</span>`],
    ];
    if (ctx.paymentReference) {
      rows.push([t("invoice_paid_receipt.row_reference", lang), `<span style="font-family:monospace;font-size:12px;color:#888888">${escHtml(ctx.paymentReference)}</span>`]);
    }

    return {
      subject: t("invoice_paid_receipt.subject", lang, { amount }),
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("invoice_paid_receipt.headline", lang))}</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("invoice_paid_receipt.eyebrow", lang, { type: typeLabel }))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
        <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${t("invoice_paid_receipt.body", lang, { amount: escHtml(amount), date: escHtml(paidAtDate) })}</p>
        ${adminTable(rows)}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("invoice_paid_receipt.cta", lang)) : ""}
        ${sig(lang)}
      `, {
        footerNote: t("common.footer.reply_note", lang),
        preheader: t("invoice_paid_receipt.preheader", lang, { amount }),
        lang,
      }),
      toClient: true,
      toAdmin: false,
    };
  },

  // ─── Client-facing: revision acknowledgment ───────────────────
  revision_received: (ctx, lang) => ({
    subject: t("revision_received.subject", lang),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("revision_received.headline", lang))}</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("revision_received.eyebrow", lang))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(greeting(ctx.leadName, lang))}</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("revision_received.body", lang))}</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, t("revision_received.cta", lang)) : ""}
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      preheader: t("revision_received.preheader", lang),
      lang,
    }),
    toClient: true,
    toAdmin: false,
  }),

  // ─── Client-facing: 30-day post-launch check-in ───────────────
  // Both the nudge engine (on a 30-day timer) and ad-hoc event
  // triggers fire the same email — delegate to the shared renderer
  // in lib/nudges/templates.ts so the two paths can't drift.
  post_launch_30d: (ctx, lang) => {
    const rendered = renderPostLaunch30dNudge({
      recipientName: ctx.leadName,
      workspaceUrl: ctx.workspaceUrl || "",
      lang,
    });
    return {
      subject: rendered.subject,
      html: rendered.html,
      toClient: true,
      toAdmin: false,
      marketing: true,
    };
  },

  // ─── Admin-only events (English) ──────────────────────────────
  revision_submitted: (ctx) => ({
    subject: `Revision request from ${escHtml(ctx.leadName)}`,
    html: emailWrap(`
      ${adminBadge("Admin alert")}
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">New revision request</h1>
      ${adminTable([
        ["Client", escHtml(ctx.leadName)],
        ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
        ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
      ])}
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
    `),
    toClient: false,
    toAdmin: true,
  }),

  asset_submitted: (ctx) => ({
    subject: `New asset from ${escHtml(ctx.leadName)}`,
    html: emailWrap(`
      ${adminBadge("Admin alert")}
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">New asset submitted</h1>
      ${adminTable([
        ["Client", escHtml(ctx.leadName)],
        ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
        ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
      ])}
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
    `),
    toClient: false,
    toAdmin: true,
  }),

  deposit_notice_sent: (ctx) => ({
    subject: `Deposit notice — ${escHtml(ctx.leadName)}`,
    html: emailWrap(`
      ${adminBadge("Admin alert")}
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Client reported deposit sent</h1>
      ${adminTable([
        ["Client", escHtml(ctx.leadName)],
        ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
        ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
      ])}
      <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6">Verify the deposit in your bank or Stripe before marking it as paid in the admin panel.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
    `),
    toClient: false,
    toAdmin: true,
  }),

  agreement_accepted: (ctx) => ({
    subject: `Agreement accepted — ${escHtml(ctx.leadName)}`,
    html: emailWrap(`
      ${adminBadge("Admin alert")}
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Agreement signed</h1>
      ${adminTable([
        ["Client", escHtml(ctx.leadName)],
        ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
        ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
      ])}
      <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">A Certificate of Completion has been generated and emailed to the client.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
    `),
    toClient: false,
    toAdmin: true,
  }),
};

// Render-only entry point: returns the resolved template for tests +
// preview tooling without sending anything. `null` when the event is
// unknown so callers can distinguish "skip" from "broken template".
export function renderEventNotification(ctx: EventContext): TemplateResult | null {
  const builder = templates[ctx.event];
  if (!builder) return null;
  const lang = normalizeEmailLocale(ctx.lang);
  return builder(ctx, lang);
}

// All event types backed by a template — handy for test enumeration.
export function listEventTypes(): string[] {
  return Object.keys(templates);
}

export async function sendEventNotification(ctx: EventContext) {
  const builder = templates[ctx.event];
  if (!builder) return;

  const lang = normalizeEmailLocale(ctx.lang);
  const tmpl = builder(ctx, lang);
  const sends: Promise<any>[] = [];

  // Trim + validate before dispatch. A whitespace-only or malformed
  // email previously passed the truthy check but failed silently at
  // the Resend API, leaving the caller unaware that no notification
  // reached the client.
  const clientTo = (ctx.leadEmail || "").trim();
  if (tmpl.toClient && clientTo && clientTo.includes("@")) {
    sends.push(
      sendResendEmail({
        to: clientTo,
        from: FROM_EMAIL,
        subject: tmpl.subject,
        html: tmpl.html,
        ...(tmpl.marketing ? { listUnsubscribeEmail: UNSUBSCRIBE_EMAIL } : {}),
      }).catch((err) => {
        captureBackgroundError(err, {
          where: "notifications.clientEmail",
          tags: { event: ctx.event },
          extra: { leadEmail: clientTo },
        });
      })
    );
  } else if (tmpl.toClient && (ctx.leadEmail || "").trim()) {
    // Truthy but not a valid email (e.g. "n/a"). Log so admin can fix
    // the lead record instead of silently never receiving updates.
    console.warn(`[notifications] skipped client email for ${ctx.event}: invalid leadEmail "${ctx.leadEmail}"`);
  }

  if (tmpl.toAdmin && ADMIN_EMAIL) {
    sends.push(
      sendResendEmail({
        to: ADMIN_EMAIL,
        from: FROM_EMAIL,
        subject: tmpl.adminSubject ?? tmpl.subject,
        html: tmpl.adminHtml ?? tmpl.html,
      }).catch((err) => {
        captureBackgroundError(err, {
          where: "notifications.adminEmail",
          tags: { event: ctx.event },
        });
      })
    );
  }

  await Promise.allSettled(sends);
}
