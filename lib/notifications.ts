import { sendResendEmail } from "@/lib/resend";
import { emailWrap, ctaButton, adminTable, callout, sig, escHtml, adminBadge } from "@/lib/emailHelpers";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "studio@crecystudio.com";
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
    subject: `Your project agreement is ready to sign — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your agreement is ready to sign.</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Project agreement &middot; ${escHtml(ctx.quoteId.slice(0, 8))}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">The agreement covering scope, timeline, deliverables, and payment terms is ready in your workspace. Once signed, the project kicks off — no further back and forth.</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">It's worth a careful read. If anything in it doesn't match the conversations we've had, flag it before signing.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Review agreement") : ""}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">Reply with questions before you sign.</p>
      ${sig()}
    `, "Reply to this email to reach Komlan directly.", "Your project agreement is ready — review and sign in your workspace."),
    toClient: true,
    toAdmin: true,
  }),

  preview_ready: (ctx) => ({
    subject: `Your website preview is ready — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your preview is live.</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Preview ready for review</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">A new preview of your website is ready. Open your workspace to review it and leave feedback in one batch — that keeps revisions clean and the project moving.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open preview") : ""}
      ${callout("How to review", [
        "→&ensp;Open the preview link in your workspace",
        "→&ensp;Leave notes on anything you'd like changed",
        "→&ensp;Submit feedback as one batch — Komlan responds within 24 hours",
      ])}
      ${sig()}
    `, "Reply to this email to reach Komlan directly.", "Your website preview is ready — open your workspace to review it."),
    toClient: true,
    toAdmin: false,
  }),

  launch_ready: (ctx) => ({
    subject: `Your website is ready to launch — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Ready to go live.</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Launch checklist complete</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">Every item on the launch checklist is signed off — domain, forms, analytics, SEO, handoff. Your site goes live whenever you give the word.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Approve launch") : ""}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">Click the button to confirm, or reply if you want one more pass before going live.</p>
      ${sig()}
    `, "Reply to this email to reach Komlan directly.", "Everything is ready — give the word and your site goes live."),
    toClient: true,
    toAdmin: true,
  }),

  site_live: (ctx) => ({
    subject: `Your website is live — CrecyStudio`,
    html: emailWrap(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your site is live.</h1>
      <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Project launched</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Your site is shipped and indexed. The full handoff — production URL, admin credentials, analytics access, and post-launch documentation — is waiting in your workspace.</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">A live website is a starting line, not a finish line. The next 90 days are where real conversions happen — small copy and design tweaks, content updates, performance tuning. If you'd rather not handle that yourself, our Care Plans start at $199/mo and keep the site evolving instead of decaying.</p>
      ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open handoff") : ""}
      <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">It was a real pleasure building this with you. Reply anytime — for support, updates, or just to share how the launch goes.</p>
      ${sig()}
    `, "", "Your website is now live. Handoff and Care Plan options are in your workspace."),
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
