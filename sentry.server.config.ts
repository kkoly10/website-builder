import * as Sentry from "@sentry/nextjs";

// Server-side init. Runs in the Node runtime on each cold start. No-ops
// when SENTRY_DSN is missing so local dev / preview deploys without a
// project configured stay quiet.
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // No init at all unless the DSN is configured — defends against
  // shipping noise from preview environments or local dev where the
  // SDK was inadvertently bundled but no project exists.
  enabled: !!process.env.SENTRY_DSN,

  // 10% performance trace sample in production to control quota; 100%
  // in dev so we can see every trace while building. Adjust upward if
  // we ever need denser sampling for a specific debug session.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Tag every event with environment so we can filter dashboards by
  // prod vs preview vs local.
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",

  // Skip events from common harmless errors that flood Sentry without
  // helping debugging. Extend this list if a noisy error shows up in
  // the inbox.
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "ECONNRESET",
    "EPIPE",
  ],

  // Stop sending PII unless we explicitly want it (cookies, headers,
  // user IPs). Defaults to false in Sentry SDK >=8 but we set it
  // explicitly for clarity.
  sendDefaultPii: false,
});
