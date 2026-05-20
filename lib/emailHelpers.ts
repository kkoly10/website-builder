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

  // Dark-mode media queries: Apple Mail (macOS/iOS), Outlook 2019+ for
  // Mac, and Thunderbird honor prefers-color-scheme. Gmail strips media
  // queries on most clients but at least respects the meta hints below.
  // We invert the wrapper greys, keep the brand black header readable,
  // and force CTA text to stay white on the black button.
  const darkModeCss = `
    @media (prefers-color-scheme: dark) {
      body, .body-bg { background:#0f0f0f !important; }
      .card { background:#1a1a1a !important; border-color:#2a2a2a !important; }
      .card-body { color:#e8e8e8 !important; }
      .card-body p, .card-body td { color:#cccccc !important; }
      .card-body h1, .card-body h2 { color:#ffffff !important; }
      .card-body strong { color:#ffffff !important; }
      .card-footer { background:#141414 !important; border-color:#2a2a2a !important; }
      .footer-text, .footer-text a { color:#888888 !important; }
      .callout { background:#141414 !important; border-color:#ffffff !important; }
      .callout p { color:#cccccc !important; }
      .row-label { color:#888888 !important; }
      .row-value { color:#e8e8e8 !important; }
      .sig-name { color:#ffffff !important; }
      .sig-role { color:#999999 !important; }
      /* CTA: brand black-on-white in light mode would disappear into
         the dark card body, so invert to white-on-black. Targets both
         the wrapping td (Outlook reads background here) and the inner
         <a> (everywhere else). */
      .cta-button { background:#ffffff !important; }
      .cta-button a { background:#ffffff !important; color:#111111 !important; }
    }
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
        <tr>
          <td style="background:#111111;padding:22px 32px">
            <a href="${SITE_URL}" style="text-decoration:none;display:inline-block">
              <img src="${SITE_URL}/brand/crecy-email-logo.png" alt="crecystudio" width="168" height="30" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:168px;color:#f8f1e8;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;line-height:30px;letter-spacing:-0.01em">
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
  // Double background (td + a) is required for Outlook: Outlook ignores background on <a>.
  // .cta-button class lets the dark-mode media query invert this to
  // white-on-black so the button doesn't disappear into a #1a1a1a card.
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:4px 0 28px">
    <tr>
      <td class="cta-button" style="background:#111111">
        <a href="${escHtml(href)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif">${escHtml(label)} &#x2192;</a>
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
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 20px">
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
        <img src="${photoUrl}" alt="KK" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;border-radius:50%;background:#222222;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-align:center;line-height:48px">
      </td>
      <td style="vertical-align:top">
        <p class="sig-name" style="margin:0 0 2px;font-size:14px;font-weight:bold;color:#111111;font-family:Arial,Helvetica,sans-serif">Komlan Kouhiko</p>
        <p class="sig-role" style="margin:0 0 6px;font-size:13px;color:#888888;font-family:Arial,Helvetica,sans-serif">${escHtml(t("common.signature.role", lang))}</p>
        <a href="${LINKEDIN_URL}" style="font-size:12px;color:#0077b5;text-decoration:none;font-family:Arial,Helvetica,sans-serif">LinkedIn &#x2192;</a>
      </td>
    </tr>
  </table>`;
}

export { SITE_URL, SITE_DOMAIN };
