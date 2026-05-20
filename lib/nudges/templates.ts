import { emailWrap, ctaButton, callout, sig, adminBadge, adminTable, escHtml } from "@/lib/emailHelpers";
import { type EmailLocale, t, greeting } from "@/lib/i18n/emailStrings";

// Pure render functions for each nudge rule. The engine
// (lib/nudges/engine.ts) loads DB state, decides which rules fire,
// dedupes via nudge_log, and sends — but the HTML/subject for each
// rule lives here so preview tooling + Playwright tests can exercise
// them without touching the database.

export type NudgeRenderContext = {
  recipientName: string;     // pre-resolved (lead.name || nameFromEmail || "")
  workspaceUrl: string;
  lang: EmailLocale;
};

export type RenderedNudge = {
  subject: string;
  html: string;
};

// Shared bits ─────────────────────────────────────────────────────
function greetingHtml(ctx: NudgeRenderContext): string {
  return escHtml(greeting(ctx.recipientName, ctx.lang));
}

// ─── asset_missing_after_kickoff ──────────────────────────────────
export function renderAssetMissingNudge(ctx: NudgeRenderContext): RenderedNudge {
  const { lang, workspaceUrl } = ctx;
  return {
    subject: t("nudge.asset_missing.subject", lang),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">${escHtml(t("nudge.asset_missing.headline", lang))}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("nudge.asset_missing.eyebrow", lang))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${greetingHtml(ctx)}</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">${escHtml(t("nudge.asset_missing.body", lang))}</p>
      ${ctaButton(workspaceUrl, t("nudge.asset_missing.cta", lang))}
      ${callout(t("nudge.asset_missing.what_label", lang), [
        escHtml(t("nudge.asset_missing.what_1", lang)),
        escHtml(t("nudge.asset_missing.what_2", lang)),
        escHtml(t("nudge.asset_missing.what_3", lang)),
        escHtml(t("nudge.asset_missing.what_4", lang)),
      ])}
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      lang,
      unsubscribeUrl: workspaceUrl,
    }),
  };
}

// ─── preview_unreviewed_48h ───────────────────────────────────────
export function renderPreviewUnreviewedNudge(ctx: NudgeRenderContext): RenderedNudge {
  const { lang, workspaceUrl } = ctx;
  return {
    subject: t("nudge.preview_unreviewed.subject", lang),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">${escHtml(t("nudge.preview_unreviewed.headline", lang))}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("nudge.preview_unreviewed.eyebrow", lang))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${greetingHtml(ctx)}</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">${escHtml(t("nudge.preview_unreviewed.body", lang))}</p>
      ${ctaButton(workspaceUrl, t("nudge.preview_unreviewed.cta", lang))}
      <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">${escHtml(t("nudge.preview_unreviewed.fineprint", lang))}</p>
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      lang,
      unsubscribeUrl: workspaceUrl,
    }),
  };
}

// ─── revision_waiting_on_studio (admin-only, English) ────────────
export function renderRevisionWaitingOnStudioAdminNudge(args: {
  recipientName: string;       // client name for the alert body
  recipientEmail: string;      // fallback when name is missing
  workspaceUrl: string;
}): RenderedNudge {
  const safeName = escHtml(args.recipientName || args.recipientEmail);
  return {
    subject: `Revision overdue — ${safeName}`,
    html: emailWrap(`
      ${adminBadge("Studio alert")}
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Revision response overdue</h1>
      ${adminTable([
        ["Client", safeName],
        ["Waiting", "More than 24 hours"],
      ])}
      <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6">${safeName} submitted a revision request more than 24 hours ago with no studio reply logged yet.</p>
      ${ctaButton(args.workspaceUrl, "Open workspace")}
    `),
  };
}

// ─── deposit_invoice_unpaid ───────────────────────────────────────
export function renderDepositInvoiceUnpaidNudge(ctx: NudgeRenderContext): RenderedNudge {
  const { lang, workspaceUrl } = ctx;
  return {
    subject: t("nudge.deposit_unpaid.subject", lang),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">${escHtml(t("nudge.deposit_unpaid.headline", lang))}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("nudge.deposit_unpaid.eyebrow", lang))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${greetingHtml(ctx)}</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">${escHtml(t("nudge.deposit_unpaid.body", lang))}</p>
      ${ctaButton(workspaceUrl, t("nudge.deposit_unpaid.cta", lang))}
      <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">${escHtml(t("nudge.deposit_unpaid.fineprint", lang))}</p>
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      lang,
    }),
  };
}

// ─── client_inactive_active_phase ─────────────────────────────────
export function renderClientInactiveNudge(args: NudgeRenderContext & {
  pendingItems: string[];
}): RenderedNudge {
  const { lang, workspaceUrl, pendingItems } = args;
  const pendingBlock = pendingItems.length > 0
    ? callout(t("nudge.inactive.whats_waiting", lang), pendingItems.map((item) => `→&ensp;${item}`))
    : "";
  const introCopy = pendingItems.length > 0
    ? t("nudge.inactive.body_with_pending", lang)
    : t("nudge.inactive.body_generic", lang);
  return {
    subject: t("nudge.inactive.subject", lang),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">${escHtml(t("nudge.inactive.headline", lang))}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("nudge.inactive.eyebrow", lang))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${greetingHtml(args)}</p>
      <p style="margin:0 0 ${pendingItems.length > 0 ? "20" : "28"}px;font-size:15px;color:#444;line-height:1.7">${escHtml(introCopy)}</p>
      ${pendingBlock}
      ${ctaButton(workspaceUrl, t("nudge.inactive.cta", lang))}
      <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">${escHtml(t("nudge.inactive.fineprint", lang))}</p>
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      lang,
      unsubscribeUrl: workspaceUrl,
    }),
  };
}

// ─── post_launch_30d ──────────────────────────────────────────────
export function renderPostLaunch30dNudge(ctx: NudgeRenderContext): RenderedNudge {
  const { lang, workspaceUrl } = ctx;
  return {
    subject: t("post_launch_30d.subject", lang),
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">${escHtml(t("post_launch_30d.headline", lang))}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("post_launch_30d.eyebrow", lang))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${greetingHtml(ctx)}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${escHtml(t("post_launch_30d.body_intro", lang))}</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">${escHtml(t("post_launch_30d.body_offer", lang))}</p>
      ${ctaButton(workspaceUrl, t("post_launch_30d.cta", lang))}
      ${sig(lang)}
    `, {
      footerNote: t("common.footer.reply_note", lang),
      lang,
      unsubscribeUrl: workspaceUrl,
    }),
  };
}
