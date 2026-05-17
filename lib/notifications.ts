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
  // Optional context for personalized templates. Fields are filled in
  // by callers that have access to the data; templates fall back to
  // generic copy when missing so older callers keep working.
  projectType?: string;       // "website" | "web_app" | "automation" | "ecommerce" | "rescue"
  productionUrl?: string;     // for site_live — the live URL to surface
  estimateAmount?: number;    // dollars (not cents) — for agreement_published
  depositAmount?: number;     // dollars (not cents) — for agreement_published
};

// Friendly label per ProjectType. Used in subject lines and headlines
// so a custom-app client sees "your custom app" instead of generic
// "your project".
function projectTypeLabel(projectType?: string | null): string {
  switch (projectType) {
    case "website": return "website";
    case "web_app": return "custom app";
    case "automation": return "automation";
    case "ecommerce": return "store";
    case "rescue": return "site rescue";
    case "ai_integration": return "AI integration";
    default: return "project";
  }
}

function formatMoney(amount?: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
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
type TemplateResult = {
  subject: string;
  html: string;
  toClient: boolean;
  toAdmin: boolean;
  adminSubject?: string;
  adminHtml?: string;
};

const templates: Record<string, (ctx: EventContext) => TemplateResult> = {
  agreement_published: (ctx) => {
    const laneLabel = projectTypeLabel(ctx.projectType);
    const hasEstimate = Number.isFinite(ctx.estimateAmount) && (ctx.estimateAmount as number) > 0;
    const hasDeposit = Number.isFinite(ctx.depositAmount) && (ctx.depositAmount as number) > 0;
    const totalLine = hasEstimate
      ? `${formatMoney(ctx.estimateAmount)} total${hasDeposit ? `, ${formatMoney(ctx.depositAmount)} deposit on signature` : ""}`
      : "";
    return {
      subject: `Your ${laneLabel} agreement is ready to sign — CrecyStudio`,
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your agreement is ready to sign.</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${laneLabel.charAt(0).toUpperCase() + laneLabel.slice(1)} agreement &middot; ${escHtml(ctx.quoteId.slice(0, 8))}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">The agreement covering scope, timeline, deliverables${totalLine ? `, and payment terms (<strong>${escHtml(totalLine)}</strong>)` : ", and payment terms"} is ready in your workspace. Once signed, the project kicks off — no further back and forth.</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">It's worth a careful read. If anything in it doesn't match the conversations we've had, flag it before signing.</p>
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Review agreement") : ""}
        <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">Reply with questions before you sign.</p>
        ${sig()}
      `, "Reply to this email to reach Komlan directly.", `Your ${laneLabel} agreement is ready — review and sign in your workspace.`),
      toClient: true,
      toAdmin: true,
      adminSubject: `Agreement published — ${escHtml(ctx.leadName || ctx.leadEmail)} — ${ctx.quoteId.slice(0, 8)}`,
      adminHtml: emailWrap(`
        ${adminBadge("Admin alert")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Agreement sent for signature</h1>
        ${adminTable([
          ["Client", escHtml(ctx.leadName || "—")],
          ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
          ["Lane", escHtml(laneLabel)],
          ...(totalLine ? [["Terms", escHtml(totalLine)] as [string, string]] : []),
          ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
        ])}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
      `),
    };
  },

  preview_ready: (ctx) => {
    const laneLabel = projectTypeLabel(ctx.projectType);
    return {
      subject: `Your ${laneLabel} preview is ready — CrecyStudio`,
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your preview is live.</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Preview ready for review</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
        <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">A new preview of your ${laneLabel} is ready. Open your workspace to review it and leave feedback in one batch — that keeps revisions clean and the project moving.</p>
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open preview") : ""}
        ${callout("How to review", [
          "→&ensp;Open the preview link in your workspace",
          "→&ensp;Leave notes on anything you'd like changed",
          "→&ensp;Submit feedback as one batch — Komlan responds within 24 hours",
        ])}
        ${sig()}
      `, "Reply to this email to reach Komlan directly.", `Your ${laneLabel} preview is ready — open your workspace to review it.`),
      toClient: true,
      toAdmin: false,
    };
  },

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
    adminSubject: `Launch ready — ${escHtml(ctx.leadName || ctx.leadEmail)} — ${ctx.quoteId.slice(0, 8)}`,
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
  }),

  site_live: (ctx) => {
    const laneLabel = projectTypeLabel(ctx.projectType);
    const isWebsite = !ctx.projectType || ctx.projectType === "website";
    const productionUrl = safeHttpUrl(ctx.productionUrl);
    const liveLine = productionUrl
      ? `Your ${laneLabel} is live at <a href="${escHtml(productionUrl)}" style="color:#111111;font-weight:600;text-decoration:underline">${escHtml(productionUrl)}</a>.`
      : `Your ${laneLabel} is shipped and indexed.`;
    return {
      subject: `Your ${laneLabel} is live — CrecyStudio`,
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your ${laneLabel} is live.</h1>
        <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Project launched</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Hi ${escHtml(ctx.leadName)},</p>
        <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${liveLine} The full handoff — admin credentials, analytics access, and post-launch documentation — is waiting in your workspace.</p>
        ${isWebsite
          ? `<p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">A live website is a starting line, not a finish line. The next 90 days are where real conversions happen — small copy and design tweaks, content updates, performance tuning. If you'd rather not handle that yourself, our Care Plans start at $199/mo and keep the site evolving instead of decaying.</p>`
          : `<p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">Launching is the easy part — the next 90 days are where real usage shapes the product. If you want ongoing engineering and tuning rather than every change becoming a new project, ask about our retainer arrangements.</p>`
        }
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open handoff") : ""}
        <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">It was a real pleasure building this with you. Reply anytime — for support, updates, or just to share how the launch goes.</p>
        ${sig()}
      `, "", `Your ${laneLabel} is now live. Handoff and ongoing-support options are in your workspace.`),
      toClient: true,
      toAdmin: true,
      adminSubject: `Site live — ${escHtml(ctx.leadName || ctx.leadEmail)} — ${ctx.quoteId.slice(0, 8)}`,
      adminHtml: emailWrap(`
        ${adminBadge("Admin alert")}
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Project marked live</h1>
        ${adminTable([
          ["Client", escHtml(ctx.leadName || "—")],
          ["Email", `<a href="mailto:${escHtml(ctx.leadEmail)}" style="color:#111">${escHtml(ctx.leadEmail)}</a>`],
          ["Lane", escHtml(laneLabel)],
          ...(productionUrl ? [["Live URL", `<a href="${escHtml(productionUrl)}" style="color:#111">${escHtml(productionUrl)}</a>`] as [string, string]] : []),
          ["Quote ID", `<span style="font-family:monospace;font-size:12px;color:#888">${escHtml(ctx.quoteId)}</span>`],
        ])}
        ${ctx.workspaceUrl ? ctaButton(ctx.workspaceUrl, "Open workspace") : ""}
      `),
    };
  },

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
      }).catch((err) => {
        console.error(`[notifications] client email failed for ${ctx.event}:`, err);
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
        console.error(`[notifications] admin email failed for ${ctx.event}:`, err);
      })
    );
  }

  await Promise.allSettled(sends);
}
