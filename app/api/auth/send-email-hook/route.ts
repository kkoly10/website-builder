import { NextResponse } from "next/server";
import { sendAuthEmail, type AuthEmailActionType } from "@/lib/authEmails";
import { normalizeEmailLocale } from "@/lib/i18n/emailStrings";
import { captureBackgroundError } from "@/lib/sentry";
import { verifyStandardWebhook } from "@/lib/standardWebhooks";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Boot-time visibility for misconfigured prod deploys. The per-request
// check below will fail closed (returns 500) if the secret is unset —
// but by then Supabase has already tried to send the auth email and the
// user is staring at a "couldn't sign up" screen. Logging at module load
// surfaces the misconfig the moment a cold start touches this route, so
// the operator sees it during the smoke test that follows a deploy
// rather than after the first real customer complaint.
if (process.env.NODE_ENV === "production" && !process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET) {
  console.warn(
    "[send-email-hook] SUPABASE_SEND_EMAIL_HOOK_SECRET is not set. " +
      "All branded auth emails (signup confirm, magic link, password reset, invite) will fail with 500 until this is configured."
  );
}

type SendEmailHookPayload = {
  user?: {
    email?: string;
    user_metadata?: Record<string, unknown>;
    new_email?: string;
  };
  email_data?: {
    token?: string;
    token_hash?: string;
    token_hash_new?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
    new_email?: string;
  };
};

// Best-effort locale lookup: check the lead row by email. New signups
// won't have a lead row yet; for those, optionally fall back to
// user_metadata.locale if the signup client recorded it. Defaults to
// English when nothing else is known.
async function resolveLocale(email: string, userMetadata: Record<string, unknown> | undefined) {
  const metaLocale = typeof userMetadata?.locale === "string" ? userMetadata.locale : null;
  if (metaLocale) return normalizeEmailLocale(metaLocale);

  try {
    const { data } = await supabaseAdmin
      .from("leads")
      .select("preferred_locale")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (data?.preferred_locale) return normalizeEmailLocale(data.preferred_locale);
  } catch (err) {
    captureBackgroundError(err, {
      where: "send-email-hook.locale_lookup",
      extra: { email },
    });
  }

  return normalizeEmailLocale(undefined);
}

export async function POST(req: Request) {
  const secret = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET || "";
  if (!secret) {
    // Refuse to process if the hook isn't configured — fail closed so
    // a misconfigured deployment doesn't silently bypass auth emails.
    console.error("[send-email-hook] SUPABASE_SEND_EMAIL_HOOK_SECRET not set");
    return NextResponse.json({ ok: false, error: "Hook not configured" }, { status: 500 });
  }

  const webhookId = req.headers.get("webhook-id") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ ok: false, error: "Missing signature headers" }, { status: 401 });
  }

  // Read body as raw text — HMAC is over the byte-exact JSON, not the
  // re-serialized version Express/JSON parsers would produce.
  const rawBody = await req.text();

  const verified = verifyStandardWebhook({
    rawBody,
    webhookId,
    webhookTimestamp,
    webhookSignature,
    secret,
  });
  if (!verified) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  // Idempotency claim. Standard Webhooks guarantees at-least-once
  // delivery — a Supabase retry of a previously-handled webhook would
  // otherwise re-send the auth email. Claim the webhook-id via a
  // unique-key insert; if it collides, another delivery has already
  // been processed and we ACK without sending.
  let payload: SendEmailHookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const claim = await supabaseAdmin
    .from("auth_email_hook_processed")
    .insert({
      webhook_id: webhookId,
      action_type: payload.email_data?.email_action_type || null,
    })
    .select("webhook_id")
    .maybeSingle();
  if (claim.error) {
    // Unique-constraint violation = already processed → ACK and exit
    // so Supabase doesn't keep retrying. Any other DB error is real
    // and should surface as a 5xx so the delivery is retried.
    const isDuplicate =
      claim.error.code === "23505" ||
      /duplicate key/i.test(claim.error.message || "");
    if (isDuplicate) {
      return NextResponse.json({ ok: true, skipped: "already_processed" });
    }
    captureBackgroundError(claim.error, {
      where: "send-email-hook.dedup_claim",
      extra: { webhookId },
    });
    return NextResponse.json(
      { ok: false, error: "Dedup claim failed" },
      { status: 500 }
    );
  }

  const userEmail = (payload.user?.email || "").trim().toLowerCase();
  const actionType = (payload.email_data?.email_action_type || "") as AuthEmailActionType;
  const tokenHash = payload.email_data?.token_hash || "";
  const tokenHashNew = payload.email_data?.token_hash_new || "";
  const redirectTo = payload.email_data?.redirect_to || payload.email_data?.site_url || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || payload.email_data?.site_url || "";
  const newEmail = payload.email_data?.new_email || payload.user?.new_email || "";

  if (!userEmail || !actionType || !tokenHash || !supabaseUrl) {
    return NextResponse.json(
      { ok: false, error: "Incomplete payload" },
      { status: 400 },
    );
  }

  const lang = await resolveLocale(userEmail, payload.user?.user_metadata);

  // For email_change_current, the email goes to the OLD address
  // (`payload.user.email`). For email_change_new and the legacy
  // single-event "email_change", the email goes to the NEW address
  // (`payload.email_data.new_email` or `payload.user.new_email`).
  // Everything else is sent to the user's primary email.
  const recipient = actionType === "email_change_current"
    ? userEmail
    : (actionType === "email_change_new" || actionType === "email_change")
      ? (newEmail || userEmail)
      : userEmail;
  if (!recipient || !recipient.includes("@")) {
    // Permanent data issue — retrying won't help. Capture to Sentry
    // so an operator sees this in the issue feed, then return 200
    // with ok:true so Supabase records the hook as handled and moves
    // on. Previously this returned ok:false with status 200, which is
    // ambiguous: Supabase treated the 200 as success while ok:false
    // suggested a recoverable error to anyone reading the body.
    captureBackgroundError(
      new Error(`send-email-hook: invalid recipient for ${actionType}`),
      { where: "send-email-hook.invalid_recipient", extra: { actionType } }
    );
    return NextResponse.json({ ok: true, skipped: "invalid_recipient" });
  }

  try {
    await sendAuthEmail({
      actionType,
      email: recipient,
      tokenHash,
      tokenHashNew,
      newEmail,
      redirectTo,
      supabaseUrl,
      lang,
    });
  } catch (err: any) {
    // Auth emails are high-stakes — a failed signup confirm or password
    // reset email blocks the user from getting into the app. Capture
    // every send failure so we hear about it instead of relying on
    // Vercel logs.
    captureBackgroundError(err, {
      where: "send-email-hook.send",
      tags: { actionType },
      extra: { recipient },
    });
    // Returning 500 makes Supabase retry per its built-in retry policy.
    // For non-retryable issues (invalid recipient, etc.), the Resend
    // helper has already thrown a 4xx-style error which we want to
    // surface as 500 here so the operator notices, not as 200 silent.
    return NextResponse.json({ ok: false, error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
