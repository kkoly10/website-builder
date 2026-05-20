import * as Sentry from "@sentry/nextjs";

// Re-exports + small wrapper for the spots where we catch an error and
// can't let it bubble (background tasks, optional side effects). Most
// API errors are captured automatically by Sentry's Next.js integration
// via instrumentation.ts onRequestError — manual capture is only needed
// when the catch swallows the error.

export { Sentry };

// Convenience wrapper that also writes to stderr so the error stays
// visible in Vercel logs even when Sentry transmission is disabled
// (no DSN configured). `tags` and `extra` map straight to Sentry's
// scope so dashboard filters work.
export function captureBackgroundError(
  err: unknown,
  context: {
    where: string;
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, unknown>;
  }
): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${context.where}]`, message, context.extra ?? "");

  Sentry.captureException(err, {
    tags: { where: context.where, ...(context.tags ?? {}) },
    extra: context.extra,
  });
}
