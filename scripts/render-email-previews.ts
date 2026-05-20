import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderAuthEmail, type AuthEmailActionType } from "../lib/authEmails";
import { renderEventNotification, type EventContext } from "../lib/notifications";
import { renderInvoiceEmail } from "../lib/invoiceEmail";
import { buildCertificateEmailHtml } from "../lib/certificates/email";
import { renderPortalMessageNotification } from "../lib/messaging/notify";
import {
  buildDiscoveryClientEmail,
  buildDiscoveryClientEmailScheduled,
  buildDiscoveryAdminEmail,
} from "../lib/discoveryCallEmails";
import { type EmailLocale, t } from "../lib/i18n/emailStrings";

// Renders every customer-facing email × locale combination to disk for
// visual review. Open scripts/email-previews/index.html in a browser
// to see all of them side-by-side. Catches layout drift after
// emailHelpers / template edits without needing to trigger real
// business flows.
//
// Usage:  npm run preview:emails
// Output: scripts/email-previews/<category>/<name>-<locale>.html
//         scripts/email-previews/index.html

const ROOT = resolve(process.cwd(), "scripts/email-previews");
const LOCALES: EmailLocale[] = ["en", "fr", "es"];

type Preview = {
  category: string;
  name: string;
  locale: EmailLocale;
  label: string;
  subject: string;
  html: string;
};

const previews: Preview[] = [];

function addPreview(p: Preview) {
  previews.push(p);
}

// ─── Auth ─────────────────────────────────────────────────────────
const AUTH_SCENARIOS: Array<{ actionType: AuthEmailActionType; label: string }> = [
  { actionType: "signup", label: "Signup confirmation" },
  { actionType: "magiclink", label: "Magic-link sign in" },
  { actionType: "recovery", label: "Password recovery" },
  { actionType: "invite", label: "Invitation" },
  { actionType: "email_change_new", label: "Email change — new address" },
  { actionType: "email_change_current", label: "Email change — current address (security notice)" },
];

for (const s of AUTH_SCENARIOS) {
  for (const lang of LOCALES) {
    const rendered = renderAuthEmail({
      actionType: s.actionType,
      email: "test@example.com",
      tokenHash: "fake-token-hash-for-preview-only",
      tokenHashNew: "fake-token-hash-new-for-preview-only",
      newEmail: "new-address@example.com",
      redirectTo: "https://crecystudio.com/auth/callback?next=%2Fportal",
      supabaseUrl: "https://your-project.supabase.co",
      lang,
    });
    if (!rendered) continue;
    addPreview({
      category: "auth",
      name: s.actionType,
      locale: lang,
      label: s.label,
      subject: rendered.subject,
      html: rendered.html,
    });
  }
}

// ─── Transactional event notifications (client-facing variants) ───
const EVENT_FIXTURES: Array<{ event: string; label: string; ctx: Partial<EventContext> }> = [
  {
    event: "agreement_published",
    label: "Agreement published",
    ctx: { projectType: "website", estimateAmount: 8000, depositAmount: 2000 },
  },
  {
    event: "preview_ready",
    label: "Preview ready",
    ctx: { projectType: "website" },
  },
  {
    event: "launch_ready",
    label: "Launch ready",
    ctx: { projectType: "website" },
  },
  {
    event: "site_live",
    label: "Site live",
    ctx: { projectType: "website", productionUrl: "https://example.com" },
  },
  {
    event: "deposit_received",
    label: "Deposit received (kickoff)",
    ctx: { projectType: "website", depositAmount: 2000 },
  },
  {
    event: "invoice_paid_receipt",
    label: "Payment receipt",
    ctx: {
      paidAmount: 1500,
      invoiceType: "milestone",
      paidAt: "2026-05-15T14:30:00Z",
      paymentReference: "ch_test_1A2B3C",
    },
  },
  {
    event: "revision_received",
    label: "Revision acknowledgment",
    ctx: { projectType: "website" },
  },
  {
    event: "post_launch_30d",
    label: "30-day post-launch check-in",
    ctx: { projectType: "website" },
  },
];

const ADMIN_FIXTURE_EVENTS = [
  { event: "revision_submitted", label: "Admin: revision submitted" },
  { event: "asset_submitted", label: "Admin: asset submitted" },
  { event: "deposit_notice_sent", label: "Admin: deposit notice sent" },
  { event: "agreement_accepted", label: "Admin: agreement accepted" },
];

const baseCtx = {
  quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
  leadName: "Alice Martin",
  leadEmail: "alice@example.com",
  workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
};

for (const f of EVENT_FIXTURES) {
  for (const lang of LOCALES) {
    const tmpl = renderEventNotification({
      ...baseCtx,
      event: f.event,
      lang,
      ...f.ctx,
    });
    if (!tmpl) continue;
    addPreview({
      category: "transactional",
      name: f.event,
      locale: lang,
      label: f.label,
      subject: tmpl.subject,
      html: tmpl.html,
    });
    // Admin variant — English only.
    if (tmpl.toAdmin && tmpl.adminHtml && lang === "en") {
      addPreview({
        category: "transactional",
        name: `${f.event}-admin`,
        locale: "en",
        label: `${f.label} (admin)`,
        subject: tmpl.adminSubject ?? tmpl.subject,
        html: tmpl.adminHtml,
      });
    }
  }
}

// Pure-admin events: render in English only.
for (const f of ADMIN_FIXTURE_EVENTS) {
  const tmpl = renderEventNotification({
    ...baseCtx,
    event: f.event,
    lang: "en",
  });
  if (!tmpl) continue;
  addPreview({
    category: "transactional",
    name: f.event,
    locale: "en",
    label: f.label,
    subject: tmpl.subject,
    html: tmpl.html,
  });
}

// ─── Invoice email ────────────────────────────────────────────────
for (const lang of LOCALES) {
  const inv = renderInvoiceEmail({
    amount: 1500,
    dueDate: "2026-06-15",
    invoiceType: "milestone",
    leadName: "Alice Martin",
    payUrl: "https://checkout.stripe.com/c/pay/cs_test_example",
    portalUrl: "https://crecystudio.com/portal/test-portal-token",
    quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
    recipientEmail: "alice@example.com",
    notes: "Mid-project milestone — homepage + about + 3 sub-pages signed off.",
    lang,
  });
  addPreview({
    category: "invoice",
    name: "milestone",
    locale: lang,
    label: "Milestone invoice",
    subject: inv.subject,
    html: inv.html,
  });
}

// ─── Certificate email ────────────────────────────────────────────
for (const lang of LOCALES) {
  const html = buildCertificateEmailHtml(
    "Alice Martin",
    "https://example.com/signed-certificate.pdf",
    "https://crecystudio.com/verify/agreement-id-1234",
    lang,
  );
  addPreview({
    category: "certificate",
    name: "delivery",
    locale: lang,
    label: "Signed agreement + certificate",
    subject: t("certificate.subject", lang),
    html,
  });
}

// ─── Messaging notifications ──────────────────────────────────────
for (const lang of LOCALES) {
  const studioToClient = renderPortalMessageNotification({
    senderRole: "studio",
    senderName: "Komlan",
    body: "Just pushed the latest design direction to your workspace. The header treatment looks much sharper with the serif headline + tighter line-height. Let me know what you think when you get a chance.",
    quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
    portalToken: "test-portal-token",
    leadName: "Alice Martin",
    leadEmail: "alice@example.com",
    leadLocale: lang,
    attachmentName: "design-direction-v2.pdf",
  });
  if (!studioToClient.skipReason) {
    addPreview({
      category: "messaging",
      name: "studio-to-client",
      locale: lang,
      label: "Studio → client message",
      subject: studioToClient.subject,
      html: studioToClient.html,
    });
  }
}

// Client → admin variant is always English (admin is internal).
const clientToAdmin = renderPortalMessageNotification({
  senderRole: "client",
  senderName: "Alice Martin",
  body: "Hi — quick question on the contact form. Should the budget dropdown stay required, or should we make it optional to lower the friction? Happy either way.",
  quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
  portalToken: "test-portal-token",
  leadName: "Alice Martin",
  leadEmail: "alice@example.com",
  attachmentName: null,
});
if (!clientToAdmin.skipReason) {
  addPreview({
    category: "messaging",
    name: "client-to-admin",
    locale: "en",
    label: "Client → admin alert",
    subject: clientToAdmin.subject,
    html: clientToAdmin.html,
  });
}

// ─── Discovery call ───────────────────────────────────────────────
for (const lang of LOCALES) {
  addPreview({
    category: "discovery",
    name: "client-pending",
    locale: lang,
    label: "Discovery call — request received",
    subject: t("discovery.subject_pending", lang),
    html: buildDiscoveryClientEmail("Alice Martin", lang),
  });
  addPreview({
    category: "discovery",
    name: "client-scheduled",
    locale: lang,
    label: "Discovery call — booked",
    subject: t("discovery.subject_scheduled", lang),
    html: buildDiscoveryClientEmailScheduled(
      "Alice Martin",
      "Wed May 27 · 2:00 PM ET",
      new Date("2026-05-27T18:00:00Z"),
      lang,
    ),
  });
}

addPreview({
  category: "discovery",
  name: "admin-alert",
  locale: "en",
  label: "Discovery call — admin alert",
  subject: "Discovery call — Alice Martin · scheduled",
  html: buildDiscoveryAdminEmail(
    "call-id-1234",
    "Alice Martin",
    "alice@example.com",
    "Acme Studio",
    "website",
    "Tuesday or Wednesday afternoon ET",
    "Wed May 27 · 2:00 PM ET",
  ),
});

// ─── Write to disk + build index ──────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  const byCategory = new Map<string, Preview[]>();
  for (const p of previews) {
    const arr = byCategory.get(p.category) ?? [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }

  for (const [category, items] of byCategory) {
    const dir = resolve(ROOT, category);
    await mkdir(dir, { recursive: true });
    for (const p of items) {
      const filename = `${p.name}-${p.locale}.html`;
      await writeFile(resolve(dir, filename), p.html, "utf8");
    }
  }

  const sections: string[] = [];
  for (const [category, items] of byCategory) {
    const rows = items
      .map(
        (p) => `<tr>
        <td>${escapeHtml(p.label)}</td>
        <td>${p.locale.toUpperCase()}</td>
        <td>${escapeHtml(p.subject)}</td>
        <td><a href="${category}/${p.name}-${p.locale}.html" target="_blank">Open</a></td>
      </tr>`,
      )
      .join("\n");
    sections.push(`<section>
      <h2>${escapeHtml(category)} <span class="count">${items.length}</span></h2>
      <table>
        <thead><tr><th>Email</th><th>Locale</th><th>Subject</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`);
  }

  const total = previews.length;
  const indexHtml = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>CrecyStudio · Email previews</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 24px; max-width: 1100px; margin: 0 auto; color: #111; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p.note { color: #888; font-size: 13px; margin: 0 0 24px; }
  section { margin: 0 0 32px; }
  h2 { font-size: 16px; margin: 0 0 12px; text-transform: capitalize; }
  .count { display: inline-block; margin-left: 8px; font-size: 12px; color: #888; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
  th { background: #fafafa; font-weight: 600; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head><body>
<h1>Email previews · ${total} templates</h1>
<p class="note">Rendered with synthetic fixture data. Toggle browser dark mode (Chrome devtools → Rendering → Emulate CSS media feature prefers-color-scheme) to verify dark-mode rendering.</p>
${sections.join("\n")}
</body></html>`;

  await mkdir(ROOT, { recursive: true });
  await writeFile(resolve(ROOT, "index.html"), indexHtml, "utf8");
  console.log(`Wrote ${total} previews + index.html to ${ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
