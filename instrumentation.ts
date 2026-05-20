// Next.js 15+ instrumentation entry point. Called once per process boot
// for the matching runtime; dynamic import lets us keep client + edge
// bundles small (the server SDK ships a lot of Node-only code).
//
// SENTRY_DSN must be set for Sentry to actually transmit anything; the
// config files no-op when it's missing (good for local dev where you
// don't want events flooding the team's Sentry project).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Sentry's recommended hook for capturing nested errors in App Router
// (server components, server actions, route handlers). Without this,
// React's automatic error boundaries swallow the exception before
// Sentry's auto-instrumentation can see it.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
