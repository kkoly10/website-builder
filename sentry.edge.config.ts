import * as Sentry from "@sentry/nextjs";

// Edge runtime init (used by proxy.ts middleware). Same shape as the
// server config but no profiling / Node-only integrations.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
  sendDefaultPii: false,
});
