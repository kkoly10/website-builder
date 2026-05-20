import crypto from "node:crypto";

// Standard Webhooks signature verification.
// https://www.standardwebhooks.com/
//
// Used by Supabase auth hooks (Send Email, Send SMS) and any other
// provider that follows the spec. Keep this file dependency-free so
// the verification logic stays straightforward to audit.

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

export type VerifyArgs = {
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
  // The secret as displayed by the provider. Supabase shows it as
  // either "v1,whsec_<base64>" or just "whsec_<base64>" depending on
  // dashboard version. Both shapes are accepted; any leading
  // "v1," and/or "whsec_" prefix is stripped before base64-decoding.
  secret: string;
  // Override "now" in tests. Defaults to Date.now().
  nowMs?: number;
};

export function verifyStandardWebhook(args: VerifyArgs): boolean {
  // Strip any provider-specific prefixes before base64-decoding.
  const cleanedSecret = args.secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  if (!cleanedSecret) return false;

  const secretBytes = Buffer.from(cleanedSecret, "base64");
  // Buffer.from with "base64" silently strips invalid characters. A
  // truly malformed secret will produce a wrong HMAC and fail the
  // timing-safe compare below, so this is fine.

  // Timestamp tolerance prevents replay of captured webhook payloads.
  const timestampSeconds = Number(args.webhookTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const nowSeconds = (args.nowMs ?? Date.now()) / 1000;
  const ageSeconds = Math.abs(nowSeconds - timestampSeconds);
  if (ageSeconds > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const signedPayload = `${args.webhookId}.${args.webhookTimestamp}.${args.rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedPayload, "utf8")
    .digest("base64");

  // The header may contain multiple space-separated signatures for
  // key rotation. Accept the request if any signature matches.
  const candidates = args.webhookSignature
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);

  return candidates.some((candidate) => {
    // Each candidate is "v1,<base64-signature>" — strip the version
    // prefix before comparing.
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

// Helper for tests + dev fixtures — generates a valid signature for
// a given payload. NOT used by production code paths.
export function signStandardWebhook(args: {
  rawBody: string;
  webhookId: string;
  webhookTimestamp: string;
  secret: string;
}): string {
  const cleanedSecret = args.secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  const secretBytes = Buffer.from(cleanedSecret, "base64");
  const signedPayload = `${args.webhookId}.${args.webhookTimestamp}.${args.rawBody}`;
  const sig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedPayload, "utf8")
    .digest("base64");
  return `v1,${sig}`;
}
