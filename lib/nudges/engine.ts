import { sendResendEmail } from "@/lib/resend";
import { logProjectActivityByPortalId } from "@/lib/projectActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { emailWrap, ctaButton, callout, sig, adminBadge, adminTable, escHtml, nameFromEmail } from "@/lib/emailHelpers";

const FROM_EMAIL =
  process.env.NOTIFICATION_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "studio@10xwebsites.com";
const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ALERT_TO_EMAIL || "";

type PortalRow = Record<string, any>;
type QuoteRow = Record<string, any>;
type LeadRow = Record<string, any>;

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeDate(value: unknown) {
  const raw = str(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(value: unknown) {
  const date = safeDate(value);
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function hoursSince(value: unknown) {
  const date = safeDate(value);
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
}


function getPendingItems(portal: PortalRow, messages: any[]): string[] {
  const items: string[] = [];
  const lastSeenMs = portal.last_client_seen_at
    ? new Date(str(portal.last_client_seen_at)).getTime()
    : 0;

  const unreadFromStudio = messages.filter(
    (m) =>
      ["studio", "internal"].includes(str(m.sender_role).toLowerCase()) &&
      new Date(str(m.created_at)).getTime() > lastSeenMs
  );
  if (unreadFromStudio.length === 1) {
    items.push("1 message from the studio waiting on you");
  } else if (unreadFromStudio.length > 1) {
    items.push(`${unreadFromStudio.length} messages from the studio waiting on you`);
  }

  if (
    portal.preview_url &&
    portal.preview_updated_at &&
    (!portal.preview_viewed_at ||
      new Date(str(portal.preview_viewed_at)).getTime() <
        new Date(str(portal.preview_updated_at)).getTime())
  ) {
    items.push("a preview ready for your feedback");
  }

  return items;
}

function ensureBaseUrl(value?: string | null) {
  const raw = str(value) || "https://crecystudio.com";
  return raw.replace(/\/$/, "");
}


function isActiveClientPhase(portal: PortalRow, quote: QuoteRow | null) {
  const launchStatus = str(portal.launch_status).toLowerCase();
  const clientStatus = str(portal.client_status).toLowerCase();
  const quoteStatus = str(quote?.status).toLowerCase();

  if (launchStatus === "live" || clientStatus === "live") return false;
  if (["content_submitted", "preview_ready", "revision_requested", "launch_ready"].includes(clientStatus)) {
    return true;
  }
  return ["paid", "active", "deposit", "proposal", "closed_won"].includes(quoteStatus);
}

async function createNudgeLog(args: {
  portalProjectId: string;
  ruleId: string;
  contextKey: string;
  payload?: Record<string, any>;
}) {
  const { error } = await supabaseAdmin.from("nudge_log").insert({
    portal_project_id: args.portalProjectId,
    rule_id: args.ruleId,
    context_key: args.contextKey,
    payload: args.payload || {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function sendNudgeEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  await sendResendEmail({
    to: args.to,
    from: FROM_EMAIL,
    subject: args.subject,
    html: args.html,
  });
}

export async function runNudgeEngine(args?: { baseUrl?: string | null }) {
  const baseUrl = ensureBaseUrl(args?.baseUrl);
  const [portalsRes, quotesRes, assetsRes, revisionsRes, messagesRes, invoicesRes, logsRes] =
    await Promise.all([
      supabaseAdmin
        .from("customer_portal_projects")
        .select(
          "id, quote_id, access_token, client_status, launch_status, deposit_paid_at, preview_url, preview_updated_at, preview_viewed_at, last_client_seen_at"
        ),
      supabaseAdmin.from("quotes").select("id, status, lead_id, lead_email"),
      supabaseAdmin.from("customer_portal_assets").select("portal_project_id, created_at"),
      supabaseAdmin.from("customer_portal_revisions").select("id, portal_project_id, created_at"),
      supabaseAdmin
        .from("customer_portal_messages")
        .select("portal_project_id, sender_role, created_at"),
      supabaseAdmin
        .from("project_invoices")
        .select("id, portal_project_id, invoice_type, status, created_at, updated_at"),
      supabaseAdmin.from("nudge_log").select("portal_project_id, rule_id, context_key"),
    ]);

  if (portalsRes.error) throw new Error(portalsRes.error.message);
  if (quotesRes.error) throw new Error(quotesRes.error.message);
  if (assetsRes.error) throw new Error(assetsRes.error.message);
  if (revisionsRes.error) throw new Error(revisionsRes.error.message);
  if (messagesRes.error) throw new Error(messagesRes.error.message);
  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (logsRes.error) throw new Error(logsRes.error.message);

  const portals = portalsRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const quoteMap = new Map(quotes.map((quote) => [str(quote.id), quote] as const));
  const leadIds = quotes.map((quote) => str(quote.lead_id)).filter(Boolean);

  const leadsRes = leadIds.length
    ? await supabaseAdmin.from("leads").select("id, name, email").in("id", leadIds)
    : ({ data: [], error: null } as const);

  if (leadsRes.error) throw new Error(leadsRes.error.message);
  const leadMap = new Map(
    (leadsRes.data ?? []).map((lead) => [str(lead.id), lead] as const)
  );

  const assetsByPortal = new Map<string, any[]>();
  for (const asset of assetsRes.data ?? []) {
    const key = str(asset.portal_project_id);
    const group = assetsByPortal.get(key) ?? [];
    group.push(asset);
    assetsByPortal.set(key, group);
  }

  const revisionsByPortal = new Map<string, any[]>();
  for (const revision of revisionsRes.data ?? []) {
    const key = str(revision.portal_project_id);
    const group = revisionsByPortal.get(key) ?? [];
    group.push(revision);
    revisionsByPortal.set(key, group);
  }

  const messagesByPortal = new Map<string, any[]>();
  for (const message of messagesRes.data ?? []) {
    const key = str(message.portal_project_id);
    const group = messagesByPortal.get(key) ?? [];
    group.push(message);
    messagesByPortal.set(key, group);
  }

  const invoicesByPortal = new Map<string, any[]>();
  for (const invoice of invoicesRes.data ?? []) {
    const key = str(invoice.portal_project_id);
    const group = invoicesByPortal.get(key) ?? [];
    group.push(invoice);
    invoicesByPortal.set(key, group);
  }

  const sentSet = new Set(
    (logsRes.data ?? []).map(
      (item) => `${str(item.portal_project_id)}:${str(item.rule_id)}:${str(item.context_key)}`
    )
  );

  let sentCount = 0;
  const results: Array<{ quoteId: string; ruleId: string; summary: string }> = [];

  for (const portal of portals) {
    const portalId = str(portal.id);
    const quote = quoteMap.get(str(portal.quote_id)) ?? null;
    const lead = quote ? leadMap.get(str(quote.lead_id)) ?? null : null;
    const recipientEmail = str(quote?.lead_email) || str(lead?.email);
    if (!recipientEmail || !recipientEmail.includes("@")) continue;

    const recipientName = str(lead?.name) || nameFromEmail(recipientEmail) || "there";
    const workspaceUrl = `${baseUrl}/portal/${encodeURIComponent(str(portal.access_token))}`;
    const assetCount = (assetsByPortal.get(portalId) ?? []).length;
    const revisions = (revisionsByPortal.get(portalId) ?? []).sort(
      (a, b) => new Date(str(b.created_at)).getTime() - new Date(str(a.created_at)).getTime()
    );
    const messages = (messagesByPortal.get(portalId) ?? []).sort(
      (a, b) => new Date(str(b.created_at)).getTime() - new Date(str(a.created_at)).getTime()
    );
    const invoices = invoicesByPortal.get(portalId) ?? [];

    const inactivePending = getPendingItems(portal, messages);
    const inactivePendingBlock = inactivePending.length > 0
      ? callout("What's waiting", inactivePending.map((item) => `→&ensp;${item}`))
      : "";
    const inactiveIntroCopy = inactivePending.length > 0
      ? `Work has been moving on your project. Here's what's come up since you were last in:`
      : `Work has continued on your project — a quick check-in keeps momentum going.`;

    const candidates = [
      {
        ruleId: "asset_missing_after_kickoff",
        contextKey: `kickoff:${str(portal.deposit_paid_at)}`,
        enabled: !!portal.deposit_paid_at && daysSince(portal.deposit_paid_at) >= 5 && assetCount === 0,
        subject: "Your project is ready for content — CrecyStudio",
        summary: "System sent a reminder to upload project assets after kickoff.",
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Time to upload your assets.</h1>
          <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Action needed</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(recipientName)},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">The project kicked off five days ago — the next step is your content and assets. Once those land, the first preview is usually ready inside a week.</p>
          ${ctaButton(workspaceUrl, "Upload assets")}
          ${callout("What to upload", [
            "→&ensp;Logo files (SVG or high-res PNG)",
            "→&ensp;Brand colors and fonts if you have them",
            "→&ensp;Copy or text you want on the site",
            "→&ensp;Photos or images — or reply if you'd like help sourcing them",
          ])}
          ${sig()}
        `, "Reply to this email to reach Komlan directly."),
      },
      {
        ruleId: "preview_unreviewed_48h",
        contextKey: `preview:${str(portal.preview_updated_at)}`,
        enabled:
          !!portal.preview_url &&
          !!portal.preview_updated_at &&
          hoursSince(portal.preview_updated_at) >= 48 &&
          (!portal.preview_viewed_at ||
            new Date(str(portal.preview_viewed_at)).getTime() <
              new Date(str(portal.preview_updated_at)).getTime()),
        subject: "Your preview has been waiting — CrecyStudio",
        summary: "System nudged the client to review a published preview.",
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Your preview is still waiting.</h1>
          <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Review needed</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(recipientName)},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">Your website preview has been ready for 48 hours. When you have a moment, take a look and send feedback — even a quick "looks good" keeps the build moving.</p>
          ${ctaButton(workspaceUrl, "Open preview")}
          <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">If you're happy with it as-is, reply with "ship it" and I'll move to the next phase.</p>
          ${sig()}
        `, "Reply to this email to reach Komlan directly."),
      },
      {
        ruleId: "revision_waiting_on_studio",
        contextKey: revisions[0] ? `revision:${str(revisions[0].id)}` : "",
        enabled: (() => {
          const latestRevision = revisions[0];
          if (!latestRevision) return false;
          if (hoursSince(latestRevision.created_at) < 24) return false;
          const latestStudioMessage = messages.find((message) =>
            ["studio", "internal"].includes(str(message.sender_role).toLowerCase())
          );
          if (!latestStudioMessage) return true;
          return (
            new Date(str(latestStudioMessage.created_at)).getTime() <
            new Date(str(latestRevision.created_at)).getTime()
          );
        })(),
        recipientEmail: ADMIN_EMAIL,
        subject: `Revision overdue — ${escHtml(recipientName)}`,
        summary: "System alerted the studio that a revision request has been waiting for a response.",
        html: emailWrap(`
          ${adminBadge("Studio alert")}
          <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;letter-spacing:-0.02em">Revision response overdue</h1>
          ${adminTable([
            ["Client", escHtml(recipientName)],
            ["Waiting", "More than 24 hours"],
          ])}
          <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6">${escHtml(recipientName)} submitted a revision request more than 24 hours ago with no studio reply logged yet.</p>
          ${ctaButton(workspaceUrl, "Open workspace")}
        `),
        clientVisible: false,
      },
      {
        ruleId: "deposit_invoice_unpaid",
        contextKey: (() => {
          const invoice = invoices.find(
            (item) =>
              str(item.invoice_type).toLowerCase() === "deposit" &&
              ["sent", "overdue"].includes(str(item.status).toLowerCase())
          );
          return invoice ? `invoice:${str(invoice.id)}` : "";
        })(),
        enabled: invoices.some(
          (item) =>
            str(item.invoice_type).toLowerCase() === "deposit" &&
            ["sent", "overdue"].includes(str(item.status).toLowerCase()) &&
            daysSince(item.updated_at || item.created_at) >= 5
        ),
        subject: "Your deposit invoice is still open — CrecyStudio",
        summary: "System reminded the client that the deposit invoice is still unpaid.",
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">Your deposit is still open.</h1>
          <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Payment reminder</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(recipientName)},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7">Your deposit invoice is still open. The project kicks off the day it's settled — once the deposit clears, scope confirmation and design direction begin within 24 hours.</p>
          ${ctaButton(workspaceUrl, "Pay deposit")}
          <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">If anything's blocking the payment, reply and we'll work it out together.</p>
          ${sig()}
        `, "Reply to this email to reach Komlan directly."),
        clientVisible: true,
      },
      {
        ruleId: "client_inactive_active_phase",
        contextKey: `inactive:${str(portal.last_client_seen_at) || "never"}`,
        enabled:
          isActiveClientPhase(portal, quote) &&
          (!!portal.deposit_paid_at || str(quote?.status).toLowerCase() === "active") &&
          (!portal.last_client_seen_at || daysSince(portal.last_client_seen_at) >= 7),
        subject: "A quick check-in on your project — CrecyStudio",
        summary: "System checked in after the client had been inactive during an active project phase.",
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.02em">There's an update waiting for you.</h1>
          <p style="margin:0 0 24px;font-size:13px;color:#888;letter-spacing:0.06em;text-transform:uppercase">Project update</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Hi ${escHtml(recipientName)},</p>
          <p style="margin:0 0 ${inactivePending.length > 0 ? "20" : "28"}px;font-size:15px;color:#444;line-height:1.7">${inactiveIntroCopy}</p>
          ${inactivePendingBlock}
          ${ctaButton(workspaceUrl, "Open workspace")}
          <p style="margin:28px 0 0;font-size:13px;color:#999;line-height:1.6">Usually 5 minutes is enough. Reply if you'd rather hop on a quick call instead.</p>
          ${sig()}
        `, "Reply to reach Komlan directly."),
        clientVisible: true,
      },
    ];

    for (const candidate of candidates) {
      if (!candidate.enabled || !candidate.contextKey) continue;
      const dedupeKey = `${portalId}:${candidate.ruleId}:${candidate.contextKey}`;
      if (sentSet.has(dedupeKey)) continue;

      const targetEmail = candidate.recipientEmail || recipientEmail;
      if (!targetEmail || !targetEmail.includes("@")) continue;

      await sendNudgeEmail({
        to: targetEmail,
        subject: candidate.subject,
        html: candidate.html,
      });

      await createNudgeLog({
        portalProjectId: portalId,
        ruleId: candidate.ruleId,
        contextKey: candidate.contextKey,
        payload: {
          quoteId: str(portal.quote_id),
        },
      });

      await logProjectActivityByPortalId({
        portalProjectId: portalId,
        actorRole: "system",
        eventType: "nudge_sent",
        summary: candidate.summary,
        payload: {
          ruleId: candidate.ruleId,
        },
        clientVisible: candidate.clientVisible !== false,
      });

      sentSet.add(dedupeKey);
      sentCount += 1;
      results.push({
        quoteId: str(portal.quote_id),
        ruleId: candidate.ruleId,
        summary: candidate.summary,
      });
    }
  }

  return {
    ok: true as const,
    sentCount,
    nudges: results,
  };
}
