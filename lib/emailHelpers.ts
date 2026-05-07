const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";
const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");
const LINKEDIN_URL = "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407";

export function escHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// preheader: hidden inbox-preview text (appears after subject line in Gmail/Apple Mail)
export function emailWrap(body: string, footerNote = "", preheader = ""): string {
  const iconUrl = `${SITE_URL}/brand/crecy-email-icon.png`;
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;opacity:0">${escHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;-webkit-font-smoothing:antialiased">
${preheaderHtml}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 16px">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e2e2;box-shadow:0 1px 3px rgba(0,0,0,0.06)">

        <!-- Header -->
        <tr>
          <td style="background:#111111;padding:22px 32px">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:10px;vertical-align:middle">
                  <img src="${iconUrl}" width="28" height="28" alt="" style="display:block">
                </td>
                <td style="vertical-align:middle;line-height:1">
                  <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:-0.4px;color:#f8f1e8">crecy</span><span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:17px;font-weight:300;letter-spacing:-0.4px;color:#8a7d74">studio</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111111;line-height:1.6">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #e2e2e2;padding:18px 40px">
            <p style="margin:0;font-size:12px;color:#aaaaaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.5">
              CrecyStudio &middot; <a href="${SITE_URL}" style="color:#aaaaaa;text-decoration:none">${SITE_DOMAIN}</a>${footerNote ? ` &middot; ${footerNote}` : ""}
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 28px">
    <tr>
      <td style="background:#111111;border-radius:5px">
        <a href="${escHtml(href)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:5px;font-size:14px;font-weight:600;letter-spacing:0.01em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${escHtml(label)} →</a>
      </td>
    </tr>
  </table>`;
}

export function adminTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 14px 7px 0;font-size:13px;color:#888888;white-space:nowrap;vertical-align:top;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${escHtml(label)}</td><td style="padding:7px 0;font-size:13px;color:#111111;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${value}</td></tr>`
    )
    .join("")}</table>`;
}

export function callout(label: string, lines: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px">
    <tr>
      <td style="border-left:3px solid #111111;background:#f7f7f7;padding:16px 20px;border-radius:0 5px 5px 0">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888888;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${escHtml(label)}</p>
        ${lines.map((l) => `<p style="margin:0 0 6px;font-size:14px;color:#444444;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${l}</p>`).join("")}
      </td>
    </tr>
  </table>`;
}

export function adminBadge(label: string): string {
  return `<p style="margin:0 0 20px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888888;font-weight:600;background:#f5f5f5;display:inline-block;padding:4px 10px;border-radius:3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${escHtml(label)}</p>`;
}

export function sig(): string {
  const photoUrl = `${SITE_URL}/about/komlan.jpg`;
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0">
    <tr>
      <td style="padding-right:14px;vertical-align:top">
        <img src="${photoUrl}" alt="Komlan Kouhiko" width="48" height="48" style="display:block;border-radius:50%;object-fit:cover">
      </td>
      <td style="vertical-align:top">
        <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">Komlan Kouhiko</p>
        <p style="margin:0 0 6px;font-size:13px;color:#888888;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">Founder, CrecyStudio</p>
        <a href="${LINKEDIN_URL}" style="font-size:12px;color:#0077b5;text-decoration:none;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">LinkedIn →</a>
      </td>
    </tr>
  </table>`;
}

export { SITE_URL, SITE_DOMAIN };
