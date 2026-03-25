import { sendResendEmail } from "@/lib/resend";

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
    subject: `Your project agreement is ready — ${ctx.leadName}`,
    html: `
      <h2>Your project agreement is ready</h2>
      <p>Hi ${ctx.leadName},</p>
      <p>Your website project agreement has been published and is now available in your workspace.</p>
      <p>Please review the full agreement at your earliest convenience.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Your Workspace</a></p>` : ""}
      <p>— 10x Websites Studio</p>
    `,
    toClient: true,
    toAdmin: true,
  }),

  preview_ready: (ctx) => ({
    subject: `Preview ready for review — ${ctx.leadName}`,
    html: `
      <h2>Your website preview is ready</h2>
      <p>Hi ${ctx.leadName},</p>
      <p>A preview of your website has been published and is ready for your review.</p>
      <p>Please take a look and let us know if you have any feedback or revision requests.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Your Workspace</a></p>` : ""}
      <p>— 10x Websites Studio</p>
    `,
    toClient: true,
    toAdmin: false,
  }),

  launch_ready: (ctx) => ({
    subject: `Your website is ready for launch — ${ctx.leadName}`,
    html: `
      <h2>Ready for launch</h2>
      <p>Hi ${ctx.leadName},</p>
      <p>All launch checklist items are complete. Your website is ready to go live.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Your Workspace</a></p>` : ""}
      <p>— 10x Websites Studio</p>
    `,
    toClient: true,
    toAdmin: true,
  }),

  site_live: (ctx) => ({
    subject: `Your website is live! — ${ctx.leadName}`,
    html: `
      <h2>Your website is live</h2>
      <p>Hi ${ctx.leadName},</p>
      <p>Your website has been launched and is now live. You can view it in your workspace.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Your Workspace</a></p>` : ""}
      <p>— 10x Websites Studio</p>
    `,
    toClient: true,
    toAdmin: true,
  }),

  revision_submitted: (ctx) => ({
    subject: `New revision request from ${ctx.leadName}`,
    html: `
      <h2>New revision request</h2>
      <p>${ctx.leadName} submitted a revision request for quote ${ctx.quoteId.slice(0, 8)}.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Workspace</a></p>` : ""}
    `,
    toClient: false,
    toAdmin: true,
  }),

  asset_submitted: (ctx) => ({
    subject: `New asset from ${ctx.leadName}`,
    html: `
      <h2>New asset submitted</h2>
      <p>${ctx.leadName} submitted a new asset for quote ${ctx.quoteId.slice(0, 8)}.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Workspace</a></p>` : ""}
    `,
    toClient: false,
    toAdmin: true,
  }),

  deposit_notice_sent: (ctx) => ({
    subject: `Deposit notice from ${ctx.leadName}`,
    html: `
      <h2>Client reported deposit sent</h2>
      <p>${ctx.leadName} reported that they sent the deposit for quote ${ctx.quoteId.slice(0, 8)}.</p>
      <p>This is a client notification only and should still be verified before marking the deposit as paid.</p>
      ${ctx.workspaceUrl ? `<p><a href="${ctx.workspaceUrl}">Open Workspace</a></p>` : ""}
    `,
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
        subject: `[Admin] ${tmpl.subject}`,
        html: tmpl.html,
      }).catch((err) => {
        console.error(`[notifications] admin email failed for ${ctx.event}:`, err);
      })
    );
  }

  await Promise.allSettled(sends);
}