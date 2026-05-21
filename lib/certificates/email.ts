import { emailWrap, ctaButton, sig, escHtml } from "@/lib/emailHelpers";
import { type EmailLocale, t } from "@/lib/i18n/emailStrings";

// Pure HTML render for the signed-agreement / certificate delivery
// email. Lives in its own module (separate from lib/certificates/generate.ts)
// so the preview script + Playwright tests can import it without
// pulling in @react-pdf, qrcode, and supabaseAdmin — all of which
// have module-load side effects that fail outside a real Next runtime.

export function buildCertificateEmailHtml(
  leadName: string,
  signedUrl: string,
  verificationUrl: string,
  lang: EmailLocale,
): string {
  // Drop the "there" fallback by rendering an unnamed variant when we
  // don't have a real name. Premium emails should never address the
  // client as "there."
  const trimmed = leadName.trim();
  const headlineHtml = trimmed
    ? escHtml(t("certificate.headline", lang, { name: trimmed }))
    : escHtml(t("certificate.headline_anon", lang));
  const safeVerifyUrl = escHtml(verificationUrl);
  return emailWrap(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${headlineHtml}</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("certificate.eyebrow", lang))}</p>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("certificate.body_thanks", lang))}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("certificate.body_verify", lang))}</p>
    ${ctaButton(signedUrl, t("certificate.cta", lang))}
    <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.6;letter-spacing:0.04em;text-transform:uppercase;font-weight:600">${escHtml(t("certificate.verify_label", lang))}</p>
    <p style="margin:0 0 28px;font-size:13px;color:#444444;line-height:1.6;word-break:break-all"><a href="${safeVerifyUrl}" class="body-link" style="color:#111111;text-decoration:underline">${safeVerifyUrl}</a></p>
    ${sig(lang)}
  `, {
    footerNote: t("common.footer.reply_note", lang),
    preheader: t("certificate.preheader", lang),
    lang,
  });
}
