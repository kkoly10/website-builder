import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderAuthEmail, type AuthEmailActionType } from "../lib/authEmails";
import type { EmailLocale } from "../lib/i18n/emailStrings";

// Renders every auth email × locale combination to disk for visual
// review. Open scripts/email-previews/auth/index.html in a browser to
// see all of them side-by-side. Useful for catching layout drift after
// emailHelpers / template edits without needing to trigger real
// Supabase flows.
//
// Usage:  npm run preview:emails
// Output: scripts/email-previews/auth/<action>-<locale>.html
//         scripts/email-previews/auth/index.html

const OUT_DIR = resolve(process.cwd(), "scripts/email-previews/auth");

const SCENARIOS: Array<{ actionType: AuthEmailActionType; label: string }> = [
  { actionType: "signup", label: "Signup confirmation" },
  { actionType: "magiclink", label: "Magic-link sign in" },
  { actionType: "recovery", label: "Password recovery" },
  { actionType: "invite", label: "Invitation" },
  { actionType: "email_change_new", label: "Email change — new address" },
  { actionType: "email_change_current", label: "Email change — current address (security notice)" },
];

const LOCALES: EmailLocale[] = ["en", "fr", "es"];

function fixture(actionType: AuthEmailActionType, locale: EmailLocale) {
  return {
    actionType,
    email: "test@example.com",
    tokenHash: "fake-token-hash-for-preview-only",
    tokenHashNew: "fake-token-hash-new-for-preview-only",
    newEmail: "new-address@example.com",
    redirectTo: "https://crecystudio.com/auth/callback?next=%2Fportal",
    supabaseUrl: "https://your-project.supabase.co",
    lang: locale,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const indexRows: string[] = [];

  for (const scenario of SCENARIOS) {
    for (const locale of LOCALES) {
      const rendered = renderAuthEmail(fixture(scenario.actionType, locale));
      if (!rendered) {
        console.warn(`[preview-emails] no renderer for ${scenario.actionType}`);
        continue;
      }
      const filename = `${scenario.actionType}-${locale}.html`;
      await writeFile(resolve(OUT_DIR, filename), rendered.html, "utf8");
      indexRows.push(
        `<tr><td>${escapeHtml(scenario.label)}</td><td>${locale.toUpperCase()}</td><td>${escapeHtml(rendered.subject)}</td><td><a href="${filename}" target="_blank">Open</a></td></tr>`,
      );
      console.log(`✓ ${filename}`);
    }
  }

  const indexHtml = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>CrecyStudio · Auth email previews</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 24px; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p.note { color: #888; font-size: 13px; margin: 0 0 24px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
  th { background: #fafafa; font-weight: 600; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head><body>
<h1>Auth email previews</h1>
<p class="note">Rendered with placeholder tokens. Toggle browser dark mode (Chrome devtools → Rendering → Emulate CSS media feature prefers-color-scheme) to verify dark-mode rendering.</p>
<table>
<thead><tr><th>Email</th><th>Locale</th><th>Subject</th><th></th></tr></thead>
<tbody>
${indexRows.join("\n")}
</tbody>
</table>
</body></html>`;

  await writeFile(resolve(OUT_DIR, "index.html"), indexHtml, "utf8");
  console.log(`\nWrote ${SCENARIOS.length * LOCALES.length} previews + index.html to ${OUT_DIR}`);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
