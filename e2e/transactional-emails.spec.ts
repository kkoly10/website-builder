import { test, expect } from "@playwright/test";
import { renderEventNotification, type EventContext } from "../lib/notifications";
import { renderInvoiceEmail } from "../lib/invoiceEmail";
import { buildCertificateEmailHtml } from "../lib/certificates/email";
import { renderPortalMessageNotification } from "../lib/messaging/notify";
import {
  buildDiscoveryClientEmail,
  buildDiscoveryClientEmailScheduled,
  buildDiscoveryAdminEmail,
} from "../lib/discoveryCallEmails";
import {
  renderAssetMissingNudge,
  renderPreviewUnreviewedNudge,
  renderRevisionWaitingOnStudioAdminNudge,
  renderDepositInvoiceUnpaidNudge,
  renderClientInactiveNudge,
  renderPostLaunch30dNudge,
} from "../lib/nudges/templates";
import { renderScopeCallAdminEmail } from "../lib/scopeCallEmails";
import { type EmailLocale, t } from "../lib/i18n/emailStrings";

// Structural regression tests for the non-auth customer email
// templates. Mirrors e2e/auth-emails.spec.ts — every template ×
// locale combination is rendered in-memory and loaded via
// page.setContent (no dev server, see playwright.emails.config.ts).
//
// What the assertions catch that static review misses:
//   - missed {{interpolation}} from a translation-key typo
//   - <html lang> not matching the requested locale
//   - FR/ES subject silently falling back to English when a key is
//     missing
//   - dark-mode CSS or Outlook [data-ogsc] hooks accidentally removed
//   - CAN-SPAM footer line dropped
//   - client templates losing the CTA (unless they're admin-only or
//     a pure security-notification variant)
//
// Run with: npm run test:emails
// Inspect visuals with: npm run preview:emails (open
//   scripts/email-previews/index.html)

const LOCALES: EmailLocale[] = ["en", "fr", "es"];

type RenderedEmail = { subject: string; html: string };

type Scenario = {
  id: string;
  // English-only? True for admin-only templates and the client→admin
  // alert in messaging.
  englishOnly?: boolean;
  // Some templates render without a CTA (admin alerts that simply
  // link "Open workspace" still count as having a CTA — the bar here
  // is "does the email funnel the recipient to a primary action").
  // Set this when the template intentionally has no clickable CTA.
  noCta?: boolean;
  // Skip the assertion entirely if the renderer returns null. Use
  // this when the render depends on optional env (e.g.
  // ADMIN_NOTIFICATION_EMAIL) that may not be set in a clean test env.
  skipIfNull?: boolean;
  render: (lang: EmailLocale) => RenderedEmail | null;
};

const baseCtx: Omit<EventContext, "event" | "lang"> = {
  quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
  leadName: "Alice Martin",
  leadEmail: "alice@example.com",
  workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
};

function eventScenario(
  event: string,
  extra: Partial<EventContext> = {},
  englishOnly = false,
): Scenario {
  return {
    id: `event:${event}`,
    englishOnly,
    render: (lang) => {
      const r = renderEventNotification({ ...baseCtx, event, lang, ...extra });
      if (!r) return null;
      return { subject: r.subject, html: r.html };
    },
  };
}

const SCENARIOS: Scenario[] = [
  // ─── Transactional events (client-facing) ────────────────────
  eventScenario("agreement_published", { projectType: "website", estimateAmount: 8000, depositAmount: 2000 }),
  eventScenario("preview_ready", { projectType: "website" }),
  eventScenario("launch_ready", { projectType: "website" }),
  eventScenario("site_live", { projectType: "website", productionUrl: "https://example.com" }),
  eventScenario("deposit_received", { projectType: "website", depositAmount: 2000 }),
  eventScenario("invoice_paid_receipt", {
    paidAmount: 1500,
    invoiceType: "milestone",
    paidAt: "2026-05-15T14:30:00Z",
    paymentReference: "ch_test_1A2B3C",
  }),
  eventScenario("revision_received", { projectType: "website" }),
  eventScenario("post_launch_30d", { projectType: "website" }),

  // ─── Pure-admin events (English only) ────────────────────────
  eventScenario("revision_submitted", {}, true),
  eventScenario("asset_submitted", {}, true),
  eventScenario("deposit_notice_sent", {}, true),
  eventScenario("agreement_accepted", {}, true),

  // ─── Invoice ─────────────────────────────────────────────────
  {
    id: "invoice:milestone",
    render: (lang) =>
      renderInvoiceEmail({
        amount: 1500,
        dueDate: "2026-06-15",
        invoiceType: "milestone",
        leadName: "Alice Martin",
        payUrl: "https://checkout.stripe.com/c/pay/cs_test_example",
        portalUrl: "https://crecystudio.com/portal/test-portal-token",
        quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
        recipientEmail: "alice@example.com",
        notes: "Milestone notes",
        lang,
      }),
  },

  // ─── Certificate delivery ────────────────────────────────────
  {
    id: "certificate:delivery",
    render: (lang) => ({
      subject: t("certificate.subject", lang),
      html: buildCertificateEmailHtml(
        "Alice Martin",
        "https://example.com/signed.pdf",
        "https://crecystudio.com/verify/agreement-id-1234",
        lang,
      ),
    }),
  },

  // ─── Messaging ───────────────────────────────────────────────
  {
    id: "messaging:studio-to-client",
    render: (lang) => {
      const r = renderPortalMessageNotification({
        senderRole: "studio",
        senderName: "Komlan",
        body: "Just pushed the latest design direction. Let me know what you think.",
        quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
        portalToken: "test-portal-token",
        leadName: "Alice Martin",
        leadEmail: "alice@example.com",
        leadLocale: lang,
        attachmentName: "design-v2.pdf",
      });
      if (r.skipReason) return null;
      return { subject: r.subject, html: r.html };
    },
  },
  {
    // The client→admin renderer needs ADMIN_NOTIFICATION_EMAIL set
    // (otherwise it skips with skipReason=no_recipient). In a clean
    // test env that var isn't set, so the scenario itself is skipped.
    // When the var IS set, all invariants still apply.
    id: "messaging:client-to-admin",
    englishOnly: true,
    skipIfNull: true,
    render: (lang) => {
      const r = renderPortalMessageNotification({
        senderRole: "client",
        senderName: "Alice Martin",
        body: "Quick question about the form.",
        quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
        portalToken: "test-portal-token",
        leadName: "Alice Martin",
        leadEmail: "alice@example.com",
        leadLocale: lang,
      });
      if (r.skipReason) return null;
      return { subject: r.subject, html: r.html };
    },
  },

  // ─── Discovery call ──────────────────────────────────────────
  // Pending + scheduled variants are informational confirmations —
  // they signal "we got your request" and "you're on the calendar",
  // not "do this next". Calendar-add buttons are present in the
  // scheduled version but use a different visual treatment than the
  // brand-black ctaButton. Mark them noCta accordingly.
  {
    id: "discovery:client-pending",
    noCta: true,
    render: (lang) => ({
      subject: t("discovery.subject_pending", lang),
      html: buildDiscoveryClientEmail("Alice Martin", lang),
    }),
  },
  {
    id: "discovery:client-scheduled",
    noCta: true,
    render: (lang) => ({
      subject: t("discovery.subject_scheduled", lang),
      html: buildDiscoveryClientEmailScheduled(
        "Alice Martin",
        "Wed May 27 · 2:00 PM ET",
        new Date("2026-05-27T18:00:00Z"),
        lang,
      ),
    }),
  },
  {
    id: "discovery:admin-alert",
    englishOnly: true,
    render: (_lang) => ({
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
    }),
  },

  // ─── Nudges ──────────────────────────────────────────────────
  {
    id: "nudge:asset-missing",
    render: (lang) => renderAssetMissingNudge({
      recipientName: "Alice Martin",
      workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
      lang,
    }),
  },
  {
    id: "nudge:preview-unreviewed",
    render: (lang) => renderPreviewUnreviewedNudge({
      recipientName: "Alice Martin",
      workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
      lang,
    }),
  },
  {
    id: "nudge:deposit-unpaid",
    render: (lang) => renderDepositInvoiceUnpaidNudge({
      recipientName: "Alice Martin",
      workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
      lang,
    }),
  },
  {
    id: "nudge:client-inactive",
    render: (lang) => renderClientInactiveNudge({
      recipientName: "Alice Martin",
      workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
      lang,
      pendingItems: ["a preview ready for your feedback"],
    }),
  },
  {
    id: "nudge:post-launch-30d",
    render: (lang) => renderPostLaunch30dNudge({
      recipientName: "Alice Martin",
      workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
      lang,
    }),
  },
  {
    id: "nudge:revision-overdue-admin",
    englishOnly: true,
    render: (_lang) => renderRevisionWaitingOnStudioAdminNudge({
      recipientName: "Alice Martin",
      recipientEmail: "alice@example.com",
      workspaceUrl: "https://crecystudio.com/portal/test-portal-token",
    }),
  },

  // ─── Scope-call admin alert ──────────────────────────────────
  {
    id: "scope-call:admin-alert",
    englishOnly: true,
    render: (_lang) => renderScopeCallAdminEmail({
      leadName: "Alice Martin",
      leadEmail: "alice@example.com",
      leadPhone: "+1 555 0100",
      quoteId: "11111111-aaaa-bbbb-cccc-222222222222",
      estimateTotal: 12000,
      tierRecommended: "Premium",
      bestTimeToCall: "Weekdays after 2pm ET",
      preferredTimes: "Tue, Wed",
      timezone: "America/New_York",
      notes: "We're targeting a Q3 launch. Need clarity on integrations.",
      internalLink: "https://crecystudio.com/internal/preview?quoteId=11111111",
    }),
  },
];

for (const scenario of SCENARIOS) {
  const locales = scenario.englishOnly ? (["en"] as EmailLocale[]) : LOCALES;
  for (const lang of locales) {
    test(`${scenario.id} × ${lang}`, async ({ page }) => {
      const rendered = scenario.render(lang);
      if (rendered === null && scenario.skipIfNull) {
        test.skip(true, "scenario depends on env not set in this test run");
        return;
      }
      expect(rendered, "renderer should return a result").not.toBeNull();
      const { subject, html } = rendered!;

      expect(subject, "subject is non-empty").toBeTruthy();

      // Subject in non-en locales should NOT equal the en subject.
      if (lang !== "en" && !scenario.englishOnly) {
        const en = scenario.render("en");
        if (en) {
          expect(subject, `${lang} subject should differ from en`).not.toEqual(en.subject);
        }
      }

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const fullHtml = await page.content();

      // No leftover {{placeholder}} interpolations anywhere in the doc.
      expect(
        fullHtml.match(/\{\{[^}]+\}\}/),
        "no unresolved {{placeholder}} should remain",
      ).toBeNull();

      // <html lang> matches what the renderer was asked to produce.
      // Admin/English-only templates always render <html lang="en">.
      const htmlLang = await page.locator("html").getAttribute("lang");
      const expectedLang = scenario.englishOnly ? "en" : lang;
      expect(htmlLang, "html lang attribute matches locale").toBe(expectedLang);

      // Dark mode hooks present.
      expect(fullHtml, "color-scheme meta present").toContain("color-scheme");
      expect(fullHtml, "dark-mode media query present").toContain("prefers-color-scheme: dark");

      // CAN-SPAM footer line present.
      expect(
        fullHtml,
        "mailing-address footer line present (set MAILING_ADDRESS_LINE in prod)",
      ).toContain("MAILING_ADDRESS_LINE");

      // CTA presence — same convention as auth-emails.spec.ts. Almost
      // every email funnels recipients to a workspace/admin action; an
      // accidental drop is a real bug.
      if (!scenario.noCta) {
        expect(fullHtml, "CTA button class hook present").toContain('class="cta-button"');
      }
    });
  }
}
