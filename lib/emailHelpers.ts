const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";
const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");
const LINKEDIN_URL = "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407";

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

export function escHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// preheader: hidden inbox-preview text (appears after subject in Gmail/Apple Mail)
// lang: BCP-47 locale code passed through to <html lang>
export function emailWrap(body: string, footerNote = "", preheader = "", lang = "en"): string {
  const htmlLang = LOCALE_TO_LANG[lang] ?? "en";

  // 50 zero-width non-joiner pairs prevent inbox preview from pulling body text
  const zwnj = "&nbsp;&zwnj;".repeat(50);
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4f4f4;line-height:1px">${escHtml(preheader)}${zwnj}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${htmlLang}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f4;word-spacing:normal">
${preheaderHtml}
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#f4f4f4;padding:32px 16px">
  <tr>
    <td align="center">
      <!--[if mso]>
      <table cellpadding="0" cellspacing="0" border="0" width="600"><tr><td>
      <![endif]-->
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e2e2">

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
          <td style="padding:40px 40px 36px;font-family:Arial,Helvetica,sans-serif;color:#111111;line-height:1.6">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #e2e2e2;padding:18px 40px">
            <p style="margin:0;font-size:12px;color:#aaaaaa;font-family:Arial,Helvetica,sans-serif;line-height:1.5">
              CrecyStudio &middot; <a href="${SITE_URL}" style="color:#aaaaaa;text-decoration:none">${SITE_DOMAIN}</a>${footerNote ? ` &middot; ${footerNote}` : ""}
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
  // Double background (td + a) is required for Outlook: Outlook ignores background on <a>
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:4px 0 28px">
    <tr>
      <td style="background:#111111">
        <a href="${escHtml(href)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif">${escHtml(label)} &#x2192;</a>
      </td>
    </tr>
  </table>`;
}

export function adminTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 24px;border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 14px 7px 0;font-size:13px;color:#888888;white-space:nowrap;vertical-align:top;font-family:Arial,Helvetica,sans-serif">${escHtml(label)}</td><td style="padding:7px 0;font-size:13px;color:#111111;line-height:1.55;font-family:Arial,Helvetica,sans-serif">${value}</td></tr>`
    )
    .join("")}</table>`;
}

export function callout(label: string, lines: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 28px">
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

export function sig(): string {
  const photoUrl = `${SITE_URL}/about/komlan.jpg`;
  // object-fit not supported in Outlook/older clients; komlan.jpg is already square so no crop needed
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:28px 0 0">
    <tr>
      <td style="padding-right:14px;vertical-align:top">
        <img src="${photoUrl}" alt="Komlan Kouhiko" width="48" height="48" style="display:block;border-radius:50%">
      </td>
      <td style="vertical-align:top">
        <p style="margin:0 0 2px;font-size:14px;font-weight:bold;color:#111111;font-family:Arial,Helvetica,sans-serif">Komlan Kouhiko</p>
        <p style="margin:0 0 6px;font-size:13px;color:#888888;font-family:Arial,Helvetica,sans-serif">Founder, CrecyStudio</p>
        <a href="${LINKEDIN_URL}" style="font-size:12px;color:#0077b5;text-decoration:none;font-family:Arial,Helvetica,sans-serif">LinkedIn &#x2192;</a>
      </td>
    </tr>
  </table>`;
}

export { SITE_URL, SITE_DOMAIN };
