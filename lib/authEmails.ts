import { emailWrap, ctaButton, sig, escHtml, FROM_EMAIL } from "@/lib/emailHelpers";
import { type EmailLocale, t } from "@/lib/i18n/emailStrings";
import { sendResendEmail } from "@/lib/resend";

// Mirrors Supabase's auth `email_action_type` values. Each one maps to
// a different template + verify-URL type. `email_change` and
// `email_change_new` use the same verify type ("email_change") but
// different copy — the "current" variant notifies the old address that
// a change was requested, the "new" variant asks the new address to
// confirm ownership.
export type AuthEmailActionType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change"
  | "email_change_current"
  | "email_change_new";

// Standard Supabase verify URL. Tokens are verified on the Supabase
// project side, which then redirects to `redirect_to`. Mirrors the
// default-template URL shape so existing /auth/callback handling keeps
// working unchanged.
function buildVerifyUrl(args: {
  supabaseUrl: string;
  tokenHash: string;
  verifyType: string;
  redirectTo: string;
}): string {
  const base = args.supabaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    token: args.tokenHash,
    type: args.verifyType,
    redirect_to: args.redirectTo,
  });
  return `${base}/auth/v1/verify?${params.toString()}`;
}

type RenderInput = {
  actionType: AuthEmailActionType;
  email: string;
  tokenHash: string;
  tokenHashNew?: string;     // populated for email_change_new
  newEmail?: string;         // populated for email_change_current
  redirectTo: string;
  supabaseUrl: string;
  lang: EmailLocale;
};

type RenderedAuthEmail = {
  subject: string;
  html: string;
};

export function renderAuthEmail(input: RenderInput): RenderedAuthEmail | null {
  const { actionType, lang } = input;

  // Map action type → translation key prefix + verify type. Supabase
  // uses different `type` values on the verify URL than on the hook
  // payload (e.g. payload says "email_change_current" but verify type
  // is just "email_change").
  switch (actionType) {
    case "signup": {
      const url = buildVerifyUrl({
        supabaseUrl: input.supabaseUrl,
        tokenHash: input.tokenHash,
        verifyType: "signup",
        redirectTo: input.redirectTo,
      });
      return {
        subject: t("auth.signup_confirm.subject", lang),
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("auth.signup_confirm.headline", lang))}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("auth.signup_confirm.eyebrow", lang))}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("auth.signup_confirm.body", lang))}</p>
          ${ctaButton(url, t("auth.signup_confirm.cta", lang))}
          <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("auth.signup_confirm.expires", lang))}</p>
          ${sig(lang)}
        `, {
          preheader: t("auth.signup_confirm.preheader", lang),
          lang,
        }),
      };
    }

    case "magiclink": {
      const url = buildVerifyUrl({
        supabaseUrl: input.supabaseUrl,
        tokenHash: input.tokenHash,
        verifyType: "magiclink",
        redirectTo: input.redirectTo,
      });
      return {
        subject: t("auth.magic_link.subject", lang),
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("auth.magic_link.headline", lang))}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("auth.magic_link.eyebrow", lang))}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("auth.magic_link.body", lang))}</p>
          ${ctaButton(url, t("auth.magic_link.cta", lang))}
          <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("auth.magic_link.expires", lang))}</p>
          ${sig(lang)}
        `, {
          preheader: t("auth.magic_link.preheader", lang),
          lang,
        }),
      };
    }

    case "recovery": {
      const url = buildVerifyUrl({
        supabaseUrl: input.supabaseUrl,
        tokenHash: input.tokenHash,
        verifyType: "recovery",
        redirectTo: input.redirectTo,
      });
      return {
        subject: t("auth.recovery.subject", lang),
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("auth.recovery.headline", lang))}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("auth.recovery.eyebrow", lang))}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("auth.recovery.body", lang))}</p>
          ${ctaButton(url, t("auth.recovery.cta", lang))}
          <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("auth.recovery.expires", lang))}</p>
          ${sig(lang)}
        `, {
          preheader: t("auth.recovery.preheader", lang),
          lang,
        }),
      };
    }

    case "invite": {
      const url = buildVerifyUrl({
        supabaseUrl: input.supabaseUrl,
        tokenHash: input.tokenHash,
        verifyType: "invite",
        redirectTo: input.redirectTo,
      });
      return {
        subject: t("auth.invite.subject", lang),
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("auth.invite.headline", lang))}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("auth.invite.eyebrow", lang))}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("auth.invite.body", lang))}</p>
          ${ctaButton(url, t("auth.invite.cta", lang))}
          <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("auth.invite.expires", lang))}</p>
          ${sig(lang)}
        `, {
          preheader: t("auth.invite.preheader", lang),
          lang,
        }),
      };
    }

    case "email_change":
    case "email_change_new": {
      // Sent to the NEW email asking it to confirm ownership. The hook
      // payload exposes `token_hash_new` for this address; some flows
      // (older Supabase versions) emit a single "email_change" event
      // with token_hash, so accept both as the new-side confirmation.
      const tokenHash = input.tokenHashNew || input.tokenHash;
      const url = buildVerifyUrl({
        supabaseUrl: input.supabaseUrl,
        tokenHash,
        verifyType: "email_change",
        redirectTo: input.redirectTo,
      });
      return {
        subject: t("auth.email_change.subject", lang),
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("auth.email_change.headline", lang))}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("auth.email_change.eyebrow", lang))}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${escHtml(t("auth.email_change.body", lang))}</p>
          ${ctaButton(url, t("auth.email_change.cta", lang))}
          <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("auth.email_change.expires", lang))}</p>
          ${sig(lang)}
        `, {
          preheader: t("auth.email_change.preheader", lang),
          lang,
        }),
      };
    }

    case "email_change_current": {
      // Sent to the OLD email as a security-notification only — no
      // action is required from this address. Includes the new address
      // so the user can spot impersonation attempts. No CTA / no link
      // because clicking on the current-email side does nothing.
      const newEmail = input.newEmail || "(new address)";
      return {
        subject: t("auth.email_change.subject", lang),
        html: emailWrap(`
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">${escHtml(t("auth.email_change.headline", lang))}</h1>
          <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">${escHtml(t("auth.email_change.eyebrow", lang))}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444444;line-height:1.7">${t("auth.email_change.body_old", lang, { newEmail: escHtml(newEmail) })}</p>
          <p style="margin:8px 0 28px;font-size:13px;color:#999999;line-height:1.6">${escHtml(t("auth.email_change.expires", lang))}</p>
          ${sig(lang)}
        `, {
          preheader: t("auth.email_change.preheader", lang),
          lang,
        }),
      };
    }

    default:
      return null;
  }
}

export async function sendAuthEmail(args: RenderInput): Promise<void> {
  const rendered = renderAuthEmail(args);
  if (!rendered) {
    console.warn(`[authEmails] unsupported action type: ${args.actionType}`);
    return;
  }
  await sendResendEmail({
    to: args.email,
    from: FROM_EMAIL,
    subject: rendered.subject,
    html: rendered.html,
  });
}
