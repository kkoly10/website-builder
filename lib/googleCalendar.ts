import { captureBackgroundError } from "@/lib/sentry";
import type { calendar_v3 } from "googleapis";

// Centralizes Google service-account credential parsing + Calendar
// client construction. Both /api/book-discovery-call routes (slots +
// booking insert) previously inlined the same env-var read + JWT auth,
// and both lost their slot picker / silently failed to insert events
// when the operator pasted the PEM key in a slightly wrong format.
//
// Symptoms we want to keep out of production going forward:
//   - OpenSSL "DECODER routines::unsupported" thrown deep inside the
//     googleapis JWT signer when the PEM has wrong/missing newlines
//   - errors swallowed to console with no actionable diagnostic
//
// Fix shape:
//   - Accept the credentials in any of the formats operators actually
//     paste (literal \n vs real newlines vs surrounding quotes vs full
//     JSON in one env var).
//   - On any failure, log a non-sensitive diagnostic to Sentry so the
//     paste mistake is debuggable without re-exporting the key.

type ServiceAccountCreds = {
  email: string;
  key: string;
};

/**
 * Parse Google service-account credentials from env. Two paste paths:
 *
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON — paste the entire service-account
 *      JSON file content. Foolproof — no formatting traps.
 *   2. GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY — paste
 *      client_email and private_key separately.
 *
 * Path 1 wins if both are set. Returns null if neither is configured.
 * Exported for the test suite.
 */
export function parseServiceAccountCreds(
  env: NodeJS.ProcessEnv = process.env,
): ServiceAccountCreds | null {
  const jsonStr = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      if (typeof parsed.client_email === "string" && typeof parsed.private_key === "string") {
        return {
          email: parsed.client_email,
          key: normalizePemKey(parsed.private_key),
        };
      }
    } catch {
      // Malformed JSON — fall through to the EMAIL+KEY path rather than
      // failing entirely. An operator who set both vars probably wants
      // the working one to win.
    }
  }

  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !rawKey) return null;

  return { email, key: normalizePemKey(rawKey) };
}

/**
 * Normalize a PEM private key string. Tolerates the three common paste
 * artifacts that have broken this integration in the past:
 *   - Wrapping double quotes (operator copied the JSON quotes too)
 *   - Literal "\n" escape sequences (paste of the raw JSON value)
 *   - Real newlines (paste from an editor that rendered the escapes)
 */
function normalizePemKey(raw: string): string {
  return raw
    .replace(/^\s*"+|"+\s*$/g, "")
    .replace(/\\n/g, "\n")
    .trim();
}

/**
 * Non-sensitive diagnostic about the configured key. Used on auth
 * failures to make paste mistakes debuggable without exposing the
 * secret itself. Logs first/last 30 chars (these are PEM headers, not
 * secret), length, and whether the BEGIN/END markers and newlines are
 * present in the right shape.
 */
export function describeServiceAccountKey(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, unknown> | null {
  const creds = parseServiceAccountCreds(env);
  if (!creds) return null;
  const { key } = creds;
  return {
    keyLength: key.length,
    hasBeginMarker: key.includes("-----BEGIN PRIVATE KEY-----"),
    hasEndMarker: key.includes("-----END PRIVATE KEY-----"),
    realNewlineCount: (key.match(/\n/g) || []).length,
    literalEscapeCount: (key.match(/\\n/g) || []).length,
    head: key.slice(0, 30),
    tail: key.slice(-30),
    source: env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ? "json" : "email+key",
  };
}

/**
 * Return an authenticated Google Calendar v3 client + the configured
 * calendar id, or null if credentials aren't configured (booking flow
 * silently degrades to DB-only). Throws on auth-construction failure
 * — callers wrap the API call in try/catch and report keyDiagnostic.
 */
export async function getCalendarClient(opts: { readonly?: boolean } = {}): Promise<{
  calendar: calendar_v3.Calendar;
  calendarId: string;
} | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  const creds = parseServiceAccountCreds();
  if (!calendarId || !creds) return null;

  const { google } = await import("googleapis");
  const auth = new google.auth.JWT({
    email: creds.email,
    key: creds.key,
    scopes: opts.readonly
      ? ["https://www.googleapis.com/auth/calendar.readonly"]
      : ["https://www.googleapis.com/auth/calendar"],
  });
  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

/**
 * Run a Google Calendar operation with consistent error capture. On
 * failure, the diagnostic about the configured key is attached to the
 * Sentry event so PEM paste mistakes show up clearly in the dashboard
 * (was: opaque "DECODER routines::unsupported" with no context).
 *
 * Returns the operation result on success, or null on any failure.
 */
export async function runCalendarOp<T>(
  where: string,
  op: () => Promise<T>,
): Promise<T | null> {
  try {
    return await op();
  } catch (err) {
    captureBackgroundError(err, {
      where,
      extra: {
        code: (err as { code?: string })?.code,
        status: (err as { status?: number })?.status,
        keyDiagnostic: describeServiceAccountKey(),
      },
    });
    return null;
  }
}
