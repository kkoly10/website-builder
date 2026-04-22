import { sendResendEmail } from "@/lib/resend";
import { logProjectActivityByPortalId } from "@/lib/projectActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "studio@10xwebsites.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "";

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

function ensureBaseUrl(value?: string | null) {
  const raw = str(value) || "https://crecystudio.com";
  return raw.replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

    const recipientName = str(lead?.name) || "there";
    const workspaceUrl = `${baseUrl}/portal/${encodeURIComponent(str(portal.access_token))}`;
    const assetCount = (assetsByPortal.get(portalId) ?? []).length;
    const revisions = (revisionsByPortal.get(portalId) ?? []).sort(
      (a, b) => new Date(str(b.created_at)).getTime() - new Date(str(a.created_at)).getTime()
    );
    const messages = (messagesByPortal.get(portalId) ?? []).sort(
      (a, b) => new Date(str(b.created_at)).getTime() - new Date(str(a.created_at)).getTime()
    );
    const invoices = invoicesByPortal.get(portalId) ?? [];

    const candidates = [
      {
        ruleId: "asset_missing_after_kickoff",
        contextKey: `kickoff:${str(portal.deposit_paid_at)}`,
        enabled: !!portal.deposit_paid_at && daysSince(portal.deposit_paid_at) >= 5 && assetCount === 0,
        subject: "A quick reminder to upload your project assets",
        summary: "System sent a reminder to upload project assets after kickoff.",
        html: `
          <h2>Your project is ready for assets</h2>
          <p>Hi ${escapeHtml(recipientName)},</p>
          <p>Your project kickoff is complete, but we still need your assets or content to keep momentum.</p>
          <p><a href="${workspaceUrl}">Open your project workspace</a> and upload anything you have ready.</p>
          <p>CrecyStudio</p>
        `,
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
        subject: "Your website preview is ready to review",
        summary: "System nudged the client to review a published preview.",
        html: `
          <h2>Your preview is waiting</h2>
          <p>Hi ${escapeHtml(recipientName)},</p>
          <p>Your website preview has been ready for review. When you have a moment, please open it and share any notes.</p>
          <p><a href="${workspaceUrl}">Open your project workspace</a></p>
          <p>CrecyStudio</p>
        `,
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
        subject: "Revision request still needs a studio response",
        summary: "System alerted the studio that a revision request has been waiting for a response.",
        html: `
          <h2>Revision response overdue</h2>
          <p>${escapeHtml(recipientName)} submitted revisions more than 24 hours ago and no studio reply has been logged yet.</p>
          <p><a href="${workspaceUrl}">Open your project workspace</a></p>
          <p>CrecyStudio</p>
        `,
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
        subject: "Your deposit invoice is still open",
        summary: "System reminded the client that the deposit invoice is still unpaid.",
        html: `
          <h2>Your deposit is still open</h2>
          <p>Hi ${escapeHtml(recipientName)},</p>
          <p>Your deposit invoice is still open. Once it is paid, we can keep the project moving without delays.</p>
          <p><a href="${workspaceUrl}">Open your project workspace</a></p>
          <p>CrecyStudio</p>
        `,
        clientVisible: true,
      },
      {
        ruleId: "client_inactive_active_phase",
        contextKey: `inactive:${str(portal.last_client_seen_at) || "never"}`,
        enabled:
          isActiveClientPhase(portal, quote) &&
          (!!portal.deposit_paid_at || str(quote?.status).toLowerCase() === "active") &&
          (!portal.last_client_seen_at || daysSince(portal.last_client_seen_at) >= 7),
        subject: "A quick check-in on your project",
        summary: "System checked in after the client had been inactive during an active project phase.",
        html: `
          <h2>Quick check-in</h2>
          <p>Hi ${escapeHtml(recipientName)},</p>
          <p>We have been moving your project forward and wanted to make sure you have seen the latest updates in your workspace.</p>
          <p><a href="${workspaceUrl}">Open your project workspace</a></p>
          <p>CrecyStudio</p>
        `,
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
