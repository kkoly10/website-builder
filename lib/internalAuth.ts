// lib/internalAuth.ts
export function checkInternalAccess(token: string | null) {
  const expected = process.env.INTERNAL_DASHBOARD_TOKEN;

  // SECURITY: Deny access if the token env var is not configured.
  // Never allow open access in any environment.
  if (!expected) {
    console.error(
      "[SECURITY] INTERNAL_DASHBOARD_TOKEN is not set. Blocking access. Set it in environment variables."
    );
    return { ok: false, warning: "" };
  }

  if (!token) return { ok: false, warning: "" };
  if (token !== expected) return { ok: false, warning: "" };

  return { ok: true, warning: "" };
}