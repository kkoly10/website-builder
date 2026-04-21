import { sendResendEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/supabase/server";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "studio@10xwebsites.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function excerpt(value: string, max = 220) {
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
      ? "CrecyStudio team"
      : String(params.leadName || "").trim() || "there";

  const senderLabel =
    params.senderRole === "client"
      ? `${params.senderName} (client)`
      : `${params.senderName} from CrecyStudio`;

  const subject =
    params.senderRole === "client"
      ? `New portal message from ${params.senderName}`
      : `New message from CrecyStudio for your website project`;

  const safeBody = escapeHtml(excerpt(params.body || "Attachment included."));
  const attachmentLine = params.attachmentName
    ? `<p><strong>Attachment:</strong> ${escapeHtml(params.attachmentName)}</p>`
    : "";

  await sendResendEmail({
    to: recipientEmail,
    from: FROM_EMAIL,
    subject,
    html: `
      <h2>${escapeHtml(subject)}</h2>
      <p>Hi ${escapeHtml(recipientName)},</p>
      <p><strong>From:</strong> ${escapeHtml(senderLabel)}</p>
      <p><strong>Project:</strong> ${escapeHtml(params.quoteId.slice(0, 8))}</p>
      <p style="white-space:pre-wrap">${safeBody}</p>
      ${attachmentLine}
      <p><a href="${workspaceUrl}">Open the project workspace</a></p>
      <p>— CrecyStudio</p>
    `,
  });
}
