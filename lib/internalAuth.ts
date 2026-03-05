// lib/internalAuth.ts
export function checkInternalAccess(token: string | null) {
  const expected = process.env.INTERNAL_DASHBOARD_TOKEN;

  // Require token in production; allow open access only in local dev.
  if (!expected) {
    const isProduction =
      process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    if (isProduction) {
      console.error(
        "[internalAuth] INTERNAL_DASHBOARD_TOKEN is not set in production — blocking access.",
      );
      return { ok: false, warning: "" };
    }
    return {
      ok: true,
      warning:
        "INTERNAL_DASHBOARD_TOKEN is not set. Dashboard is open (dev mode). Set it in env vars to secure this page.",
    };
  }

  if (!token) return { ok: false, warning: "" };
  if (token !== expected) return { ok: false, warning: "" };

  return { ok: true, warning: "" };
}