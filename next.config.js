/** @type {import('next').NextConfig} */
const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Content-Security-Policy ships in report-only mode first so we can observe
// real-world violations (Stripe, Supabase, fonts, analytics) before promoting
// to enforcing. Reports POST to /api/csp-report and land in the
// csp_violations Supabase table.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.googletagmanager.com https://*.google-analytics.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.google-analytics.com https://*.googletagmanager.com https://va.vercel-scripts.com https://*.sentry.io https://*.ingest.sentry.io",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "object-src 'none'",
  // Sentry Session Replay spawns a worker from blob: URLs. Allow it
  // here so the replay integration keeps working once we promote CSP
  // from report-only to enforcing.
  "worker-src 'self' blob:",
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), payment=(self)",
  },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig = {
  reactStrictMode: true,

  // Next 16 enables Turbopack by default. Configure aliases here.
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname),
    },
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Sentry build-time wrapper. Uploads source maps to Sentry (so stack
// traces in the dashboard show our actual code, not minified output)
// and wires the SDK into the Next.js webpack/turbopack pipeline. The
// auth-token-driven steps (source map upload, release tracking) only
// run when SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are set —
// safe to ship without them, just means stack traces stay minified.
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Hide source maps from the public client bundle while still uploading
  // them to Sentry — keeps reverse-engineering harder without losing
  // readable stack traces in the dashboard.
  hideSourceMaps: true,
  // Tree-shake away Sentry SDK logger calls in production bundles.
  disableLogger: true,
};

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryWebpackPluginOptions);
