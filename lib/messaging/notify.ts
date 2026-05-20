import { sendResendEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/supabase/server";
import {
  emailWrap,
  ctaButton,
  adminTable,
  adminBadge,
  callout,
  sig,
  escHtml,
  nameFromEmail,
  FROM_EMAIL,
  ADMIN_EMAIL,
} from "@/lib/emailHelpers";
import { normalizeEmailLocale, t } from "@/lib/i18n/emailStrings";

function excerpt(value: string, max = 280) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export async function sendPortalMessageNotification(params: {
  senderRole: "client" | "studio" | "internal";
  senderName: string;
  body: string;
  quoteId: string;
  portalToken?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadLocale?: string | null;
  attachmentName?: string | null;
}) {
  if (params.senderRole === "internal") return;

  const lang = normalizeEmailLocale(params.leadLocale);
  const siteUrl = getSiteUrl();
  const workspaceUrl = params.portalToken
    ? new URL(`portal/${params.portalToken}`, siteUrl).toString()
    : siteUrl;

  const recipientEmail =
    params.senderRole === "client" ? ADMIN_EMAIL : String(params.leadEmail || "").trim();
  if (!recipientEmail) return;

  const leadEmailTrimmed = String(params.leadEmail || "").trim();
  const recipientName =
    params.senderRole === "client"
      ? null // admin recipient — no greeting
      : String(params.leadName || "").trim() || nameFromEmail(leadEmailTrimmed) || "";

  const safeBody = escHtml(excerpt(params.body || "Attachment included."));
  const previewHtml = safeBody;

  if (params.senderRole === "client") {
    // Client → admin notification. Branded admin alert. Always English.
    const subject = `New portal message from ${params.senderName}`;
    const rows: [string, string][] = [
      ["From", `${escHtml(params.senderName)} (client)`],
      ["Project", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(params.quoteId.slice(0, 8))}</span>`],
    ];
    if (params.attachmentName) {
      rows.push(["Attachment", escHtml(params.attachmentName)]);
    }

    await sendResendEmail({
      to: recipientEmail,
      from: FROM_EMAIL,
      subject,
      html: emailWrap(`
        ${adminBadge("Portal message")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.02em">New message from ${escHtml(params.senderName)}</h1>
        ${adminTable(rows)}
        ${callout("Message", [previewHtml])}
        ${ctaButton(workspaceUrl, "Open workspace")}
      `, {
        preheader: subject,
      }),
    });
    return;
  }

  // Studio → client notification. Branded, translated. Workspace-first:
  // the body steers clients into the workspace for replies (where
  // threading + attachments live) instead of fragmenting the thread
  // across email.
  const subject = t("messaging.subject", lang);
  const headlineName = recipientName || (lang === "fr" ? "vous" : lang === "es" ? "usted" : "you");
  const attachmentNote = params.attachmentName
    ? `<p style="margin:0 0 16px;font-size:13px;color:#888888;line-height:1.6">${escHtml(t("messaging.attachment_label", lang, { name: params.attachmentName }))}</p>`
    : "";

  await sendResendEmail({
    to: recipientEmail,
    from: FROM_EMAIL,
    subject,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("messaging.headline", lang, { name: headlineName }))}</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("messaging.eyebrow", lang, { sender: params.senderName }))}</p>
      ${callout(t("messaging.preview_label", lang), [previewHtml])}
      ${attachmentNote}
      ${ctaButton(workspaceUrl, t("messaging.cta", lang))}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("messaging.reply_note", lang))}</p>
      ${sig(lang)}
    `, {
      // Intentionally NO footerNote pointing at email-reply — the body
      // copy already says "reply in your workspace." Conflicting CTAs
      // (reply here / reply there) split the thread.
      preheader: t("messaging.preheader", lang, { sender: params.senderName }),
      lang,
    }),
  });
}
