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
} from "@/lib/emailHelpers";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "studio@crecystudio.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "";

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
  attachmentName?: string | null;
}) {
  if (params.senderRole === "internal") return;

  const siteUrl = getSiteUrl();
  const workspaceUrl = params.portalToken
    ? new URL(`portal/${params.portalToken}`, siteUrl).toString()
    : siteUrl;

  const recipientEmail =
    params.senderRole === "client" ? ADMIN_EMAIL : String(params.leadEmail || "").trim();
  if (!recipientEmail) return;

  const recipientName =
    params.senderRole === "client"
      ? null // admin recipient — no greeting
      : String(params.leadName || "").trim() || "there";

  const safeBody = escHtml(excerpt(params.body || "Attachment included."));
  const safeBodyHtml = `<p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7;white-space:pre-wrap">${safeBody}</p>`;

  if (params.senderRole === "client") {
    // Client → admin notification. Branded admin alert.
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
        ${callout("Message", [safeBody])}
        ${ctaButton(workspaceUrl, "Open workspace")}
      `, "", subject),
    });
    return;
  }

  // Studio → client notification. Branded client email with sig.
  const subject = `New message from CrecyStudio about your project`;
  const attachmentNote = params.attachmentName
    ? `<p style="margin:0 0 16px;font-size:13px;color:#888888;line-height:1.6">📎 Attachment: ${escHtml(params.attachmentName)}</p>`
    : "";

  await sendResendEmail({
    to: recipientEmail,
    from: FROM_EMAIL,
    subject,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">A new message is waiting for you, ${escHtml(recipientName ?? "there")}.</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">From ${escHtml(params.senderName)} at CrecyStudio</p>
      ${callout("Preview", [safeBody])}
      ${attachmentNote}
      ${ctaButton(workspaceUrl, "Open workspace")}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">Reply directly in your workspace to keep the thread together — that way nothing gets lost in email.</p>
      ${sig()}
    `, "Reply to this email to reach Komlan directly.", `${params.senderName} sent you a new message in your project workspace.`),
  });
}
