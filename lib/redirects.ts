// Shared redirect-validation helpers. This module has no server-only or
// client-only imports so it can be used in both contexts. Server code
// (auth callback) and client components (login, signup, forgot, reset)
// should always go through these helpers — never re-implement inline.

// OWASP-aligned: returns the path if it is a safe same-origin path,
// otherwise null. Rejects:
//   - non-string / empty values
//   - paths that don't start with "/"
//   - protocol-relative "//evil.com"
//   - backslash-escape variants like "/\evil.com"
//   - URL-encoded variants of any of the above
//   - control characters
export function safeNextPath(next?: string | null): string | null {
  if (!next || typeof next !== "string") return null;

  let candidate: string;
  try {
    candidate = decodeURIComponent(next);
  } catch {
    return null;
  }

  if (!candidate.startsWith("/")) return null;
  if (candidate.startsWith("//")) return null;
  if (candidate.includes("\\")) return null;
  if (/[\x00-\x1f\x7f]/.test(candidate)) return null;

  return next;
}

// Same as safeNextPath but returns a fallback when the input is missing
// or unsafe. Used by client redirect flows (login, signup, etc.) that
// need a destination even when no `next` was provided.
export function safeNextPathOr(
  next: string | null | undefined,
  fallback: string,
): string {
  const safe = safeNextPath(next);
  return safe ?? fallback;
}
