// lib/internalAuth.ts
export function checkInternalAccess(token: string | null) {
  const expected = process.env.INTERNAL_DASHBOARD_TOKEN;

  // Dev-friendly: allow access if not configured, but warn.
  if (!expected) {
    return {
      ok: true,
      warning:
        "INTERNAL_DASHBOARD_TOKEN is not set. Dashboard is open (dev mode). Set it in Vercel env vars to secure this page.",
    };
  }

  if (!token) return { ok: false, warning: "" };
  if (token !== expected) return { ok: false, warning: "" };

  return { ok: true, warning: "" };
}