import { type EmailLocale, t } from "@/lib/i18n/emailStrings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";
const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");
const LINKEDIN_URL = "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407";

// Single source of truth for outbound email sender + admin recipient.
// All callers should import these instead of reading env vars directly —
// previously two files fell back to "studio@10xwebsites.com" (an old
// brand), which would have failed SPF/DMARC and landed in spam if the
// env var was ever unset.
export const FROM_EMAIL =
  (process.env.NOTIFICATION_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "studio@crecystudio.com").trim();

// Boot-time visibility for misconfigured prod deploys. The FROM_EMAIL
// fallback to "studio@crecystudio.com" works *if* crecystudio.com is
// verified in Resend, but new deploys often miss the env var entirely
// and silently rely on the fallback. Warning loudly in prod logs makes
// the drift obvious during the first uptime check rather than after
// the first email lands in spam.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NOTIFICATION_FROM_EMAIL &&
  !process.env.RESEND_FROM_EMAIL
) {
  console.warn(
    "[emailHelpers] Neither NOTIFICATION_FROM_EMAIL nor RESEND_FROM_EMAIL is set. " +
      `Falling back to ${FROM_EMAIL}. Verify the sender domain in Resend before launch.`
  );
}

export const ADMIN_EMAIL =
  (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ALERT_TO_EMAIL || "").trim();

// Mailto target for the List-Unsubscribe header on marketing-adjacent
// emails (nudges, post-launch check-ins). Defaults to the studio inbox
// so manual opt-outs land somewhere a human reads. Set
// UNSUBSCRIBE_EMAIL to a dedicated address once a real auto-unsubscribe
// route exists.
export const UNSUBSCRIBE_EMAIL =
  (process.env.UNSUBSCRIBE_EMAIL || FROM_EMAIL).trim();

// TODO(crecystudio-ops): Replace with the registered business mailing
// address before sending any marketing-adjacent email. Required by
// CAN-SPAM (US) and CASL (CA) for any commercial email. Transactional
// emails are technically exempt but inclusion is best-practice and
// improves inbox placement (Gmail/Outlook reward consistent footers).
const MAILING_ADDRESS = process.env.MAILING_ADDRESS_LINE || "[CrecyStudio mailing address — set MAILING_ADDRESS_LINE]";

// Boot-time visibility: same rationale as the FROM_EMAIL warning above.
// CAN-SPAM enforcement only triggers on marketing-adjacent sends (the
// nudges engine and post_launch_30d), but a placeholder address in
// even one outbound email is a credibility problem we want to surface
// the moment the deploy boots, not after a real customer notices.
if (process.env.NODE_ENV === "production" && !process.env.MAILING_ADDRESS_LINE) {
  console.warn(
    "[emailHelpers] MAILING_ADDRESS_LINE is not set. Emails will render a placeholder " +
      "in the CAN-SPAM footer line. Set this before the next marketing-adjacent send.",
  );
}

// Single source of truth for "what is the absolute origin to use when
// building portal / workspace links inside transactional emails?".
// Prefers APP_BASE_URL (server-only override for staging/preview) and
// falls back to NEXT_PUBLIC_SITE_URL, then to the production hostname.
// Always returns an absolute https URL with no trailing slash so callers
// can safely concatenate `${base}${path}`.
export function appBaseUrl(): string {
  const raw = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com").trim();
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProto.replace(/\/$/, "");
}

// Accepted BCP-47 locale codes → HTML lang values
const LOCALE_TO_LANG: Record<string, string> = { en: "en", fr: "fr", es: "es" };

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "";
  const first = local.split(/[._+\-]/)[0];
  const cleaned = first.replace(/\d+/g, "");
  if (cleaned.length < 2) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

export function escHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type WrapOptions = {
  preheader?: string;
  lang?: EmailLocale;
  footerNote?: string;
  // When set, footer shows an unsubscribe-style link to this URL. Pass
  // for marketing-adjacent emails (nudges, post-launch check-in); omit
  // for pure transactional (invoices, receipts, agreements).
  unsubscribeUrl?: string;
};

// emailWrap accepts either the legacy positional signature (body,
// footerNote, preheader, lang) or a single options object. New callers
// should prefer the options object.
export function emailWrap(body: string, opts?: WrapOptions): string;
export function emailWrap(body: string, footerNote?: string, preheader?: string, lang?: string): string;
export function emailWrap(
  body: string,
  optsOrFooter?: WrapOptions | string,
  preheaderArg?: string,
  langArg?: string,
): string {
  const opts: WrapOptions = typeof optsOrFooter === "string" || optsOrFooter === undefined
    ? {
        footerNote: typeof optsOrFooter === "string" ? optsOrFooter : "",
        preheader: preheaderArg ?? "",
        lang: (langArg as EmailLocale) ?? "en",
      }
    : optsOrFooter;

  const lang: EmailLocale = opts.lang ?? "en";
  const htmlLang = LOCALE_TO_LANG[lang] ?? "en";
  const preheader = opts.preheader ?? "";
  const footerNote = opts.footerNote ?? "";

  // 50 zero-width non-joiner pairs prevent inbox preview from pulling body text
  const zwnj = "&nbsp;&zwnj;".repeat(50);
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4f4f4;line-height:1px">${escHtml(preheader)}${zwnj}</div>`
    : "";

  const unsubscribeHtml = opts.unsubscribeUrl
    ? ` &middot; <a href="${escHtml(opts.unsubscribeUrl)}" style="color:#aaaaaa;text-decoration:underline">${escHtml(t("common.footer.unsubscribe", lang))}</a>`
    : "";

  // Dark-mode coverage by client:
  //
  //   - @media (prefers-color-scheme: dark)   → Apple Mail (macOS/iOS),
  //     Outlook 2019+ for Mac, Thunderbird, Outlook iOS/Android, new
  //     Outlook web. Gmail strips media queries on most renderers.
  //
  //   - [data-ogsc] / [data-ogsb]             → Outlook 365 on Windows
  //     and Outlook web when the user has "force dark" enabled. Outlook
  //     adds these attributes to elements during its color-inversion
  //     pass, which means we can target them to pin colors back to the
  //     palette we want instead of accepting Outlook's auto-inversion
  //     (which leaves the CTA washed out and the card oddly tinted).
  //
  // Both rule sets share the same target palette so the email reads
  // identically whichever path the client takes.
  const darkModeBlock = `
    body, .body-bg { background:#0f0f0f !important; }
    .card { background:#1a1a1a !important; border-color:#2a2a2a !important; }
    /* Keep header banner white in dark mode. The brand wordmark is
       black-on-transparent — flipping the header to dark would make
       the logo invisible. White banner against the inverted card is
       intentional (matches the "letterhead" pattern Stripe/Linear use). */
    .card-header { background:#ffffff !important; border-bottom-color:#ececec !important; }
    .card-body { color:#e8e8e8 !important; }
    .card-body p, .card-body td { color:#cccccc !important; }
    .card-body h1, .card-body h2 { color:#ffffff !important; }
    .card-body strong { color:#ffffff !important; }
    .card-footer { background:#141414 !important; border-color:#2a2a2a !important; }
    .footer-text, .footer-text a { color:#888888 !important; }
    /* Callout: class is on the outer <table>, but the styled cell is
       the inner <td> with inline background:#f7f7f7. Inline styles beat
       unrelated class selectors, so the rule must target the inner td
       directly — otherwise dark mode leaves a cream stripe across an
       otherwise-dark card. Same pattern for admin-badge below. */
    .callout td { background:#141414 !important; border-left-color:#ffffff !important; }
    .callout td p { color:#cccccc !important; }
    .callout td p:first-child { color:#888888 !important; }
    .admin-badge td { background:#2a2a2a !important; }
    .admin-badge td p { color:#aaaaaa !important; }
    /* Discovery "your call is booked for" panel — same outer-class /
       inner-styled-td shape as callout. The light cream highlight
       reads as a white blob against the dark card without this. */
    .booked-box td { background:#222222 !important; }
    .booked-box td p { color:#e8e8e8 !important; }
    .booked-box td p:first-child { color:#888888 !important; }
    /* Add-to-calendar buttons live next to the dark card, not on it.
       Without inversion they render as bright white pills that fight
       the inverted CTA above them. Match the muted-secondary palette. */
    .cal-btn { background:#2a2a2a !important; border-color:#444444 !important; color:#e8e8e8 !important; }
    .row-label { color:#888888 !important; }
    .row-value { color:#e8e8e8 !important; }
    .row-value a { color:#7eb7ff !important; }
    .sig-name { color:#ffffff !important; }
    .sig-role { color:#999999 !important; }
    /* Plain <a> tags inside body copy (signature LinkedIn, certificate
       verification URL, etc). The class lives directly on each <a>
       because iOS Mail drops descendant selectors inside @media. */
    .body-link { color:#7eb7ff !important; }
    /* CTA: brand black-on-white in light mode would disappear into
       the dark card body, so invert to white-on-black. The class is
       on BOTH the td and the <a> (not a descendant selector) because
       iOS Mail drops descendant selectors inside @media queries — in
       that mode only the td flipped, leaving the inner <a> dark and
       the white text invisible against the inverted card. */
    .cta-link { background:#ffffff !important; color:#111111 !important; }
  `;
  const darkModeCss = `
    @media (prefers-color-scheme: dark) {
      ${darkModeBlock}
    }
    [data-ogsc] .body-bg { background:#0f0f0f !important; }
    [data-ogsc] .card { background:#1a1a1a !important; border-color:#2a2a2a !important; }
    [data-ogsc] .card-header { background:#ffffff !important; border-bottom-color:#ececec !important; }
    [data-ogsc] .card-body { color:#e8e8e8 !important; }
    [data-ogsc] .card-body p, [data-ogsc] .card-body td { color:#cccccc !important; }
    [data-ogsc] .card-body h1, [data-ogsc] .card-body h2 { color:#ffffff !important; }
    [data-ogsc] .card-body strong { color:#ffffff !important; }
    [data-ogsc] .card-footer { background:#141414 !important; border-color:#2a2a2a !important; }
    [data-ogsc] .footer-text, [data-ogsc] .footer-text a { color:#888888 !important; }
    [data-ogsc] .callout td { background:#141414 !important; border-left-color:#ffffff !important; }
    [data-ogsc] .callout td p { color:#cccccc !important; }
    [data-ogsc] .callout td p:first-child { color:#888888 !important; }
    [data-ogsc] .admin-badge td { background:#2a2a2a !important; }
    [data-ogsc] .admin-badge td p { color:#aaaaaa !important; }
    [data-ogsc] .booked-box td { background:#222222 !important; }
    [data-ogsc] .booked-box td p { color:#e8e8e8 !important; }
    [data-ogsc] .booked-box td p:first-child { color:#888888 !important; }
    [data-ogsc] .cal-btn { background:#2a2a2a !important; border-color:#444444 !important; color:#e8e8e8 !important; }
    [data-ogsc] .row-label { color:#888888 !important; }
    [data-ogsc] .row-value { color:#e8e8e8 !important; }
    [data-ogsc] .row-value a { color:#7eb7ff !important; }
    [data-ogsc] .sig-name { color:#ffffff !important; }
    [data-ogsc] .sig-role { color:#999999 !important; }
    [data-ogsc] .body-link { color:#7eb7ff !important; }
    [data-ogsc] .cta-link { background:#ffffff !important; color:#111111 !important; }
    [data-ogsb] .body-bg { background:#0f0f0f !important; }
    [data-ogsb] .card { background:#1a1a1a !important; }
    [data-ogsb] .card-header { background:#ffffff !important; }
    [data-ogsb] .card-footer { background:#141414 !important; }
    [data-ogsb] .callout td { background:#141414 !important; }
    [data-ogsb] .admin-badge td { background:#2a2a2a !important; }
    [data-ogsb] .booked-box td { background:#222222 !important; }
    [data-ogsb] .cal-btn { background:#2a2a2a !important; }
    [data-ogsb] .cta-link { background:#ffffff !important; }
  `;

  return `<!DOCTYPE html>
<html lang="${htmlLang}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${darkModeCss}</style>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body class="body-bg" style="margin:0;padding:0;background:#f4f4f4;word-spacing:normal">
${preheaderHtml}
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="body-bg" style="background:#f4f4f4;padding:32px 16px">
  <tr>
    <td align="center">
      <!--[if mso]>
      <table cellpadding="0" cellspacing="0" border="0" width="600"><tr><td>
      <![endif]-->
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" class="card" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e2e2">

        <!-- Header: bitmap logo (PNG rendered at 2x for retina) with
             text-based fallback for clients that block remote images.
             SVG isn't reliable for email (Gmail/Outlook strip it). -->
        <!-- Header banner: white background so the brand mark (black
             "crecy" + grey "studio" wordmark on transparent PNG) reads
             at full contrast. Native PNG is 560×100; we render at 280×50
             so the source is a 2× retina asset. Centered alignment +
             generous padding gives the email a clean "letterhead" feel.
             A class is on the td so dark-mode rules can keep the header
             light even when the card body inverts — the alternative
             (flipping the header to dark) would lose the brand colors
             entirely since the wordmark is dark-on-transparent. -->
        <tr>
          <td class="card-header" align="center" style="background:#ffffff;padding:28px 32px;border-bottom:1px solid #ececec">
            <a href="${SITE_URL}" style="text-decoration:none;display:inline-block">
              <img src="${SITE_URL}/brand/crecy-email-logo.png" alt="CrecyStudio" width="280" height="50" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:280px;width:100%;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;line-height:50px;letter-spacing:-0.01em">
            </a>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="card-body" style="padding:40px 40px 36px;font-family:Arial,Helvetica,sans-serif;color:#111111;line-height:1.6">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="card-footer" style="background:#f9f9f9;border-top:1px solid #e2e2e2;padding:20px 40px">
            <p class="footer-text" style="margin:0 0 6px;font-size:12px;color:#aaaaaa;font-family:Arial,Helvetica,sans-serif;line-height:1.5">
              CrecyStudio &middot; <a href="${SITE_URL}" style="color:#aaaaaa;text-decoration:none">${SITE_DOMAIN}</a>${unsubscribeHtml}${footerNote ? ` &middot; ${escHtml(footerNote)}` : ""}
            </p>
            <p class="footer-text" style="margin:0;font-size:11px;color:#bbbbbb;font-family:Arial,Helvetica,sans-serif;line-height:1.5">
              ${escHtml(MAILING_ADDRESS)}
            </p>
          </td>
        </tr>

      </table>
      <!--[if mso]>
      </td></tr></table>
      <![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  // Double background (td + a) is required for Outlook: Outlook ignores
  // background on <a>. Both elements carry the cta-link class so iOS
  // Mail (which drops descendant selectors inside @media queries) gets
  // a simple class hit on each one — without that, the inner <a> keeps
  // its inline `background:#111111; color:#ffffff` and reads as dark
  // text on a dark card in dark mode.
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:4px 0 28px">
    <tr>
      <td class="cta-link" style="background:#111111">
        <a href="${escHtml(href)}" class="cta-link" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif">${escHtml(label)} &#x2192;</a>
      </td>
    </tr>
  </table>`;
}

export function adminTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 24px;border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><td class="row-label" style="padding:7px 14px 7px 0;font-size:13px;color:#888888;white-space:nowrap;vertical-align:top;font-family:Arial,Helvetica,sans-serif">${escHtml(label)}</td><td class="row-value" style="padding:7px 0;font-size:13px;color:#111111;line-height:1.55;font-family:Arial,Helvetica,sans-serif">${value}</td></tr>`
    )
    .join("")}</table>`;
}

export function callout(label: string, lines: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="callout" style="margin:0 0 28px">
    <tr>
      <td style="border-left:3px solid #111111;background:#f7f7f7;padding:16px 20px">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888888;font-weight:bold;font-family:Arial,Helvetica,sans-serif">${escHtml(label)}</p>
        ${lines.map((l) => `<p style="margin:0 0 6px;font-size:14px;color:#444444;line-height:1.65;font-family:Arial,Helvetica,sans-serif">${l}</p>`).join("")}
      </td>
    </tr>
  </table>`;
}

export function adminBadge(label: string): string {
  // Table wrapper required: display:inline-block on <p> is ignored by Outlook
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" class="admin-badge" style="margin:0 0 20px">
    <tr>
      <td style="background:#f5f5f5;padding:4px 10px">
        <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888888;font-weight:bold;font-family:Arial,Helvetica,sans-serif">${escHtml(label)}</p>
      </td>
    </tr>
  </table>`;
}

export function sig(lang: EmailLocale = "en"): string {
  const photoUrl = `${SITE_URL}/about/komlan.jpg`;
  // object-fit not supported in Outlook/older clients; komlan.jpg is
  // already square so no crop needed.
  // The img carries its own background + alt-text styling so when the
  // remote image is blocked (Gmail / iOS Mail default for unverified
  // senders) you see "KK" on a dark circle instead of a broken-icon
  // placeholder. When images load, the photo covers the background.
  // Class names on the name/role let the dark-mode media query bump
  // contrast on macOS/iOS Mail without affecting light-mode rendering.
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:28px 0 0">
    <tr>
      <td style="padding-right:14px;vertical-align:top">
        <img src="${photoUrl}" alt="KK" aria-hidden="true" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;border-radius:50%;background:#222222;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-align:center;line-height:48px">
      </td>
      <td style="vertical-align:top">
        <!-- The photo above is marked aria-hidden so screen readers
             skip "KK" (the image-blocked visual fallback) and
             announce just the name + role from this td. The visual
             experience is unchanged. -->
        <p class="sig-name" style="margin:0 0 2px;font-size:14px;font-weight:bold;color:#111111;font-family:Arial,Helvetica,sans-serif">Komlan Kouhiko</p>
        <p class="sig-role" style="margin:0 0 6px;font-size:13px;color:#888888;font-family:Arial,Helvetica,sans-serif">${escHtml(t("common.signature.role", lang))}</p>
        <a href="${LINKEDIN_URL}" class="body-link" style="font-size:12px;color:#0077b5;text-decoration:none;font-family:Arial,Helvetica,sans-serif">LinkedIn &#x2192;</a>
      </td>
    </tr>
  </table>`;
}

export { SITE_URL, SITE_DOMAIN };
