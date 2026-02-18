// lib/internalToken.ts
export function requireInternalToken(token: string | null | undefined) {
  const expected = process.env.INTERNAL_DASH_TOKEN;
  if (!expected) {
    return { ok: false, error: "Missing INTERNAL_DASH_TOKEN env var." };
  }
  if (!token || token !== expected) {
    return { ok: false, error: "Unauthorized (invalid token)." };
  }
  return { ok: true as const };
}