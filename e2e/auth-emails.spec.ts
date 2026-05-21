import { test, expect } from "@playwright/test";
import { renderAuthEmail, type AuthEmailActionType } from "../lib/authEmails";
import type { EmailLocale } from "../lib/i18n/emailStrings";

// Structural regression tests for the Supabase Send-Email-Hook
// templates. Each template × locale combination is rendered in-memory
// and loaded via page.setContent (no dev server needed — see
// playwright.emails.config.ts). The assertions catch the classes of
// bug a static review can miss:
//
//   - missed {{interpolation}} (key typo / dropped translation arg)
//   - wrong html lang attribute for the locale
//   - CTA pointing at the wrong Supabase verify endpoint
//   - email_change_current accidentally including a clickable link
//   - dark-mode CSS dropped from the wrapper
//   - mailing-address footer accidentally removed
//
// Run with: npm run test:emails
// Inspect visuals with: npm run preview:emails (then open
//   scripts/email-previews/auth/index.html)

type Scenario = {
  actionType: AuthEmailActionType;
  // false → security notification to the OLD email; no clickable verify link.
  hasCta: boolean;
};

const SCENARIOS: Scenario[] = [
  { actionType: "signup", hasCta: true },
  { actionType: "magiclink", hasCta: true },
  { actionType: "recovery", hasCta: true },
  { actionType: "invite", hasCta: true },
  { actionType: "email_change_new", hasCta: true },
  { actionType: "email_change_current", hasCta: false },
];

const LOCALES: EmailLocale[] = ["en", "fr", "es"];

const TEST_SUPABASE_URL = "https://test-project.supabase.co";
const TEST_TOKEN_HASH = "test-token-hash";

function fixture(actionType: AuthEmailActionType, lang: EmailLocale) {
  return {
    actionType,
    email: "test@example.com",
    tokenHash: TEST_TOKEN_HASH,
    tokenHashNew: "test-token-hash-new",
    newEmail: "new-address@example.com",
    redirectTo: "https://crecystudio.com/auth/callback?next=%2Fportal",
    supabaseUrl: TEST_SUPABASE_URL,
    lang,
  };
}

for (const scenario of SCENARIOS) {
  for (const lang of LOCALES) {
    test(`${scenario.actionType} × ${lang}`, async ({ page }) => {
      const rendered = renderAuthEmail(fixture(scenario.actionType, lang));
      expect(rendered, "renderer should return a result").not.toBeNull();
      const { subject, html } = rendered!;

      expect(subject, "subject is non-empty").toBeTruthy();

      // Subject in non-en locales should NOT equal the en subject —
      // catches the "forgot to add the FR/ES key" case where t()
      // silently falls back to en.
      if (lang !== "en") {
        const en = renderAuthEmail(fixture(scenario.actionType, "en"));
        expect(subject, `${lang} subject should differ from en`).not.toEqual(en!.subject);
      }

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      // No leftover {{placeholder}} interpolations anywhere in the doc.
      const fullHtml = await page.content();
      expect(
        fullHtml.match(/\{\{[^}]+\}\}/),
        "no unresolved {{placeholder}} should remain",
      ).toBeNull();

      // <html lang> matches the requested locale.
      const htmlLang = await page.locator("html").getAttribute("lang");
      expect(htmlLang, "html lang attribute matches locale").toBe(lang);

      // Dark mode hooks present.
      expect(fullHtml, "color-scheme meta present").toContain("color-scheme");
      expect(fullHtml, "dark-mode media query present").toContain("prefers-color-scheme: dark");

      // Mailing-address footer placeholder must appear (CAN-SPAM).
      // The default is "[CrecyStudio mailing address — set MAILING_ADDRESS_LINE]"
      // — checking for the env-var name catches both the unset default and
      // the case where someone removes the footer entirely.
      expect(
        fullHtml,
        "mailing-address footer line present (set MAILING_ADDRESS_LINE in prod)",
      ).toContain("MAILING_ADDRESS_LINE");

      // Outlook 365 dark-mode hooks ([data-ogsc] + [data-ogsb]) sit
      // alongside the prefers-color-scheme rules so Outlook's color
      // inversion still lands on the brand palette instead of its
      // own washed-out auto-darkening. Easy to drop accidentally
      // when editing the CSS block — assert both selectors stay.
      expect(fullHtml, "Outlook 365 [data-ogsc] dark-mode hook present").toContain("[data-ogsc]");
      expect(fullHtml, "Outlook 365 [data-ogsb] dark-mode hook present").toContain("[data-ogsb]");

      // Signature photo is decorative — the name + role appear in
      // adjacent text. aria-hidden="true" stops screen readers
      // announcing the "KK" image-blocked visual fallback.
      const sigImg = page.locator('img[alt="KK"]');
      const sigCount = await sigImg.count();
      if (sigCount > 0) {
        const ariaHidden = await sigImg.first().getAttribute("aria-hidden");
        expect(ariaHidden, "sig photo carries aria-hidden=true").toBe("true");
      }

      // CTA assertions
      if (scenario.hasCta) {
        // CTA buttons in our templates are rendered as <a> inside a <td>
        // with the brand background. They contain the verify URL.
        const verifyLinks = page.locator(`a[href*="${TEST_SUPABASE_URL}/auth/v1/verify"]`);
        const count = await verifyLinks.count();
        expect(count, "at least one verify-URL CTA present").toBeGreaterThan(0);

        const ctaHref = await verifyLinks.first().getAttribute("href");
        expect(ctaHref, "CTA carries the test token").toContain(`token=${TEST_TOKEN_HASH}`);

        // Verify URL type param maps action_type → verify type correctly
        const verifyType = scenario.actionType.startsWith("email_change")
          ? "email_change"
          : scenario.actionType;
        expect(ctaHref, `CTA type=${verifyType}`).toContain(`type=${verifyType}`);

        // Dark-mode CTA invert: without this the black button vanishes
        // into a #1a1a1a dark card. The class lives on BOTH the td and
        // the inner <a> (not a descendant selector) — iOS Mail drops
        // descendant selectors inside @media queries, so we need both
        // hits as plain class selectors.
        expect(fullHtml, "cta-link class hook on CTA td").toContain('class="cta-link"');
        expect(fullHtml, "dark-mode CTA invert rule present").toMatch(
          /\.cta-link[^{]*\{[^}]*background:\s*#ffffff/i,
        );
      } else {
        // email_change_current must NOT contain a Supabase verify link
        // — clicking from the old address shouldn't confirm anything.
        const verifyLinks = await page.locator(`a[href*="/auth/v1/verify"]`).count();
        expect(verifyLinks, "no verify-URL link on security notification").toBe(0);
      }
    });
  }
}
