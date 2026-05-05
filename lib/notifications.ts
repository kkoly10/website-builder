import { sendResendEmail } from "@/lib/resend";
import { emailWrap, ctaButton, adminTable, callout, sig, escHtml, adminBadge } from "@/lib/emailHelpers";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "studio@10xwebsites.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "";

type EventContext = {
  event: string;
  quoteId: string;
  leadName: string;
  leadEmail: string;
  workspaceUrl?: string;
};

const templates: Record<
  string,
  (ctx: EventContext) => { subject: string; html: string; toClient: boolean; toAdmin: boolean }
> = {
  agreement_published: (ctx) => ({
    subject: `Your project agreement is ready — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Your agreement is ready to sign.</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Project agreement</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">Your project agreement has been published and is waiting for your review and signature in your workspace.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Review agreement") : ""}
      <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">Questions before signing? Just reply to this email.</p>
    `, "Reply to this email to reach Komlan directly."),
    toClient: true,
    toAdmin: true,
  }),

  preview_ready: (ctx) => ({
    subject: `Your website preview is ready — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Your preview is live.</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Preview ready for review</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">A new preview of your website is ready. Open your workspace to review it and leave any feedback or revision requests.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open preview") : ""}
      ${callout("How to review", [
        "→&ensp;Open the preview link in your workspace",
        "→&ensp;Leave notes on anything you'd like changed",
        "→&ensp;Submit your revision request — Komlan will respond within 24 hours",
      ])}
      ${sig()}
    `, "Reply to this email to reach Komlan directly."),
    toClient: true,
    toAdmin: false,
  }),

  launch_ready: (ctx) => ({
    subject: `Your website is ready to launch — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Ready to go live.</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Launch checklist complete</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">All launch checklist items are complete. Your website is ready to go live whenever you say the word.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Approve launch") : ""}
      <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">Just reply to this email or click the button above to confirm you're ready to launch.</p>
      ${sig()}
    `, "Reply to this email to reach Komlan directly."),
    toClient: true,
    toAdmin: true,
  }),

  site_live: (ctx) => ({
    subject: `Your website is live — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Your site is live.</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Project launched</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">Your website is now live and published. You can find all handoff files and documentation in your workspace.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "View handoff") : ""}
      <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">It was a pleasure working on this project. If you ever need updates or support, just reach out.</p>
      ${sig()}
    `),
    toClient: true,
    toAdmin: true,
  }),

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
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">&#x2705; Agreement signed</h1>
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

export async function sendEventNotification(ctx: EventContext) {
  const builder = templates[ctx.event];
  if (!builder) return;

  const tmpl = builder(ctx);
  const sends: Promise<any>[] = [];

  if (tmpl.toClient && ctx.leadEmail) {
    sends.push(
      sendResendEmail({
        to: ctx.leadEmail,
        from: FROM_EMAIL,
        subject: tmpl.subject,
        html: tmpl.html,
      }).catch((err) => {
        console.error(`[notifications] client email failed for ${ctx.event}:`, err);
      })
    );
  }

  if (tmpl.toAdmin && ADMIN_EMAIL) {
    sends.push(
      sendResendEmail({
        to: ADMIN_EMAIL,
        from: FROM_EMAIL,
        subject: tmpl.subject,
        html: tmpl.html,
      }).catch((err) => {
        console.error(`[notifications] admin email failed for ${ctx.event}:`, err);
      })
    );
  }

  await Promise.allSettled(sends);
}
