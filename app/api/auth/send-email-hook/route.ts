import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendAuthEmail, type AuthEmailActionType } from "@/lib/authEmails";
import { normalizeEmailLocale } from "@/lib/i18n/emailStrings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Standard Webhooks signature verification.
// https://www.standardwebhooks.com/
//
// The hook secret is provisioned in the Supabase dashboard
// (Authentication → Hooks → Send Email Hook) as a base64-encoded
// string with a "v1,whsec_" prefix. We strip the prefix and decode
// before computing the HMAC.
//
// The signature header may carry multiple comma-separated signatures
// for key rotation. We accept the request if ANY signature matches —
// matches the reference Standard Webhooks implementations (svix etc).
function verifyStandardWebhook(args: {
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
  secret: string;
}): boolean {
  // Supabase displays the hook secret in two slightly different
  // shapes depending on dashboard version: "v1,whsec_<b64>" or just
  // "whsec_<b64>". Strip whichever prefix(es) are present so either
  // copy-paste works.
  const cleanedSecret = args.secret.replace(/^v1,/, "").replace(/^whsec_/, "");

  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(cleanedSecret, "base64");
  } catch {
    return false;
  }

  // Timestamp tolerance: reject anything more than 5 minutes off to
  // prevent replay of captured webhook payloads.
  const timestampSeconds = Number(args.webhookTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > 5 * 60) return false;

  const signedPayload = `${args.webhookId}.${args.webhookTimestamp}.${args.rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedPayload, "utf8")
    .digest("base64");

  const candidates = args.webhookSignature.split(" ").map((s) => s.trim()).filter(Boolean);

  return candidates.some((candidate) => {
    // Each candidate is "v1,<base64-signature>" — strip the version
    // prefix before comparing. Use timing-safe equality.
    const match = candidate.match(/^v1,(.+)$/);
    if (!match) return false;
    const presentedSig = match[1];
    if (presentedSig.length !== expectedSignature.length) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(presentedSig),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  });
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
    console.error("[send-email-hook] lead locale lookup failed:", err);
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

  let payload: SendEmailHookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
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
    console.error(`[send-email-hook] resolved invalid recipient for ${actionType}`);
    // Return 200 so Supabase doesn't retry forever on a permanent
    // data issue. The error is logged for the operator to investigate.
    return NextResponse.json({ ok: false, error: "Invalid recipient" });
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
    console.error("[send-email-hook] send failed:", err?.message || err);
    // Returning 500 makes Supabase retry per its built-in retry policy.
    // For non-retryable issues (invalid recipient, etc.), the Resend
    // helper has already thrown a 4xx-style error which we want to
    // surface as 500 here so the operator notices, not as 200 silent.
    return NextResponse.json({ ok: false, error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
