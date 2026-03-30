// lib/internalToken.ts
// DEPRECATED: All internal routes now use requireAdminRoute() from lib/routeAuth.ts
// which uses Supabase session-based admin verification.
// This file is kept temporarily for backwards compatibility.
export function requireInternalToken(token: string | null | undefined) {
  const expected = process.env.INTERNAL_DASHBOARD_TOKEN;
  if (!expected) {
    return { ok: false, error: "Missing INTERNAL_DASHBOARD_TOKEN env var." };
  }
  if (!token || token !== expected) {
    return { ok: false, error: "Unauthorized (invalid token)." };
  }
  return { ok: true as const };
}