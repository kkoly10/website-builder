// Cookie consent helpers. We store a single "cc" cookie with values:
//   "accepted" — user opted into analytics + non-essential tracking
//   "declined" — user explicitly opted out
//   absent      — no choice yet; treat as declined and show the banner
//
// Why a cookie not localStorage: localStorage isn't sent to the server,
// and we want server-rendered pages to know consent state without
// shipping JS first. Also: cookie expires automatically, localStorage
// would live forever.

export const CONSENT_COOKIE_NAME = "cc";
export const CONSENT_MAX_AGE_DAYS = 365;

export type ConsentValue = "accepted" | "declined";

export function isAcceptedValue(raw: string | null | undefined): boolean {
  return raw === "accepted";
}

// Client-side: read the cookie. Returns null when no choice has been
// made (renders banner) or "accepted"/"declined" otherwise.
export function readConsentCookie(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1));
  if (value === "accepted" || value === "declined") return value;
  return null;
}

export function writeConsentCookie(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  // SameSite=Lax + Secure on https keeps the cookie out of cross-site
  // contexts; not HttpOnly because the banner is client-side and needs
  // to read its own state to render.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function hasAnalyticsConsent(): boolean {
  return isAcceptedValue(readConsentCookie());
}
