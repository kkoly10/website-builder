import { NextRequest, NextResponse } from "next/server";
import { sendInternalAlert } from "@/lib/internalAlert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resend signs webhooks via Svix. We verify the signature ourselves
// (rather than pulling in the svix npm package) because the protocol is
// short and adding a dep for a single endpoint isn't worth it. See
// https://www.svix.com/docs/receiving/verifying-payloads/how-manual/
//
// The webhook secret in Resend's dashboard has format `whsec_<base64>` —
// the base64 part is the actual HMAC key. Pull off the prefix, decode,
// then HMAC-SHA256 over `${svix_id}.${svix_timestamp}.${body}`.

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

async function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const svixId = headers.get("svix-id") || "";
  const svixTimestamp = headers.get("svix-timestamp") || "";
  const svixSignatureHeader = headers.get("svix-signature") || "";

  if (!svixId || !svixTimestamp || !svixSignatureHeader) return false;

  // Replay protection: reject events older than 5 min.
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (ageSeconds > MAX_TIMESTAMP_SKEW_SECONDS) return false;

  // Strip `whsec_` prefix and decode the base64-encoded secret.
  const secretPrefix = "whsec_";
  const secretBody = secret.startsWith(secretPrefix)
    ? secret.slice(secretPrefix.length)
    : secret;
  // Allocate a fresh Uint8Array backed by a non-shared ArrayBuffer.
  // Buffer.from(...).buffer can be a SharedArrayBuffer in some runtimes,
  // which crypto.subtle.importKey rejects under strict TS. Allocating
  // via `new ArrayBuffer` guarantees a non-shared buffer and gives us
  // a `Uint8Array<ArrayBuffer>` (not `<ArrayBufferLike>`) for the type.
  let secretBytes: Uint8Array<ArrayBuffer>;
  try {
    const decoded = Buffer.from(secretBody, "base64");
    const buf = new ArrayBuffer(decoded.length);
    secretBytes = new Uint8Array(buf);
    secretBytes.set(decoded);
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSig = Buffer.from(new Uint8Array(signature)).toString("base64");

  // Header format: `v1,<sig1> v1,<sig2>` — multiple sigs allowed for
  // key rotation. Match if any sig in the header equals our computed
  // signature. Constant-time compare per-sig to defend against timing.
  const presentedSigs = svixSignatureHeader
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("v1,"))
    .map((s) => s.slice(3));

  for (const sig of presentedSigs) {
    if (sig.length !== expectedSig.length) continue;
    let mismatch = 0;
    for (let i = 0; i < sig.length; i++) {
      mismatch |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (mismatch === 0) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const valid = await verifySvixSignature(rawBody, req.headers, secret);
    if (!valid) {
      console.error("[resend-webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        email_id?: string;
        to?: string[];
        from?: string;
        subject?: string;
        bounce?: { type?: string; reason?: string };
        complaint?: { type?: string; feedback?: string };
      };
    };
    const eventType = String(event?.type || "");
    const recipient = event?.data?.to?.[0] || "(unknown)";
    const subject = event?.data?.subject || "";

    // We only act on bounces and complaints. Delivered/opened/clicked
    // are noise for this endpoint — those flow through Resend's own
    // dashboard analytics. If we later add bounce-tracking columns to
    // leads/quotes, this is where the DB update goes.
    if (eventType === "email.bounced") {
      const bounceType = event?.data?.bounce?.type || "(unknown)";
      const reason = event?.data?.bounce?.reason || "";
      const summary = `[resend-webhook] bounce (${bounceType}) to=${recipient} subj="${subject}" reason="${reason}"`;
      console.warn(summary);
      await sendInternalAlert(summary);
    } else if (eventType === "email.complained") {
      const summary = `[resend-webhook] spam complaint to=${recipient} subj="${subject}"`;
      console.warn(summary);
      // Spam complaints are higher signal than bounces — alert for
      // every one. A complaint means the recipient clicked "this is
      // spam" in their inbox; ignoring those tanks sender reputation
      // (Gmail / Outlook will start filtering all our mail to spam).
      await sendInternalAlert(summary);
    } else {
      // Don't alert on delivered/opened/clicked etc; just acknowledge.
      console.log(`[resend-webhook] received: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Resend webhook error";
    console.error("[resend-webhook] error:", message);
    await sendInternalAlert(`[resend-webhook] 5xx: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
