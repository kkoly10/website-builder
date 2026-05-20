import * as Sentry from "@sentry/nextjs";

// Browser-side init. Captures JS errors + a sampled subset of session
// replays so we can reproduce UI bugs without instrumenting every page.
// NEXT_PUBLIC_SENTRY_DSN is exposed to the client by Next.js — keep
// the server DSN separate (SENTRY_DSN) so we control which environments
// transmit from the browser.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",

  // Session Replay: 10% of normal sessions captured, 100% on sessions
  // where an error fired. The error-session rate is what makes replays
  // actually useful — you only need the recording if something went
  // wrong, but you can't predict which session will fail.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Privacy defaults: mask all text and block all media by default.
      // Stops customer data (form contents, project messages, attachment
      // thumbnails) from leaking into Sentry recordings. Overrideable
      // per-component with data-sentry-mask="false" if a specific
      // element is safe to see.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    // Browser extensions throw these noisily and we can't fix them.
    "Script error.",
    "Network request failed",
  ],

  sendDefaultPii: false,
});

// Sentry needs this hook to record route transitions from the App Router
// so Web Vitals and pageload spans are attributed to the right page.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
