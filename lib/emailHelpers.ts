const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";
const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

export function escHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function emailWrap(body: string, footerNote = ""): string {
  return `<div style="font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
  <div style="background:#111111;padding:20px 32px">
    <p style="margin:0;color:#ffffff;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600">CrecyStudio</p>
  </div>
  <div style="padding:36px 32px">
    ${body}
  </div>
  <div style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:16px 32px">
    <p style="margin:0;font-size:12px;color:#999">CrecyStudio &middot; <a href="${SITE_URL}" style="color:#999;text-decoration:none">${SITE_DOMAIN}</a>${footerNote ? ` &middot; ${footerNote}` : ""}</p>
  </div>
</div>`;
}

export function ctaButton(href: string, label: string): string {
  return `<a href="${escHtml(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:0.01em">${escHtml(label)} →</a>`;
}

export function adminTable(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#888;white-space:nowrap;vertical-align:top">${escHtml(label)}</td><td style="padding:6px 0;font-size:13px;color:#111;line-height:1.5">${value}</td></tr>`
    )
    .join("")}</table>`;
}

export function callout(label: string, lines: string[]): string {
  return `<div style="background:#f5f5f5;border-left:3px solid #111;padding:16px 20px;margin:0 0 28px;border-radius:0 4px 4px 0">
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;font-weight:600">${escHtml(label)}</p>
    ${lines.map((l) => `<p style="margin:0 0 6px;font-size:14px;color:#444;line-height:1.6">${l}</p>`).join("")}
  </div>`;
}

export function adminBadge(label: string): string {
  return `<p style="margin:0 0 20px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;font-weight:600;background:#f5f5f5;display:inline-block;padding:4px 10px;border-radius:3px">${escHtml(label)}</p>`;
}

const LINKEDIN_URL = "https://www.linkedin.com/in/komlan-crecy-olympe-kouhiko-60aa85407";

export function sig(): string {
  const photoUrl = `${SITE_URL}/about/komlan.jpg`;
  return `<div style="display:flex;align-items:center;gap:14px;margin:0">
    <img src="${photoUrl}" alt="Komlan Kouhiko" width="48" height="48" style="border-radius:50%;object-fit:cover;flex-shrink:0;display:block" />
    <div>
      <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111">Komlan Kouhiko</p>
      <p style="margin:0 0 4px;font-size:13px;color:#888">Founder, CrecyStudio</p>
      <a href="${LINKEDIN_URL}" style="font-size:12px;color:#0077b5;text-decoration:none;font-weight:500">LinkedIn →</a>
    </div>
  </div>`;
}

export { SITE_URL, SITE_DOMAIN };
