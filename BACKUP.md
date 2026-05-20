# Backup, restore, and operational runbook

Operational reference for running CrecyStudio in production. Covers
backups, GDPR self-service endpoints, and the one-time setup steps that
the auditor previously flagged as easy-to-forget.

## Backups

### What Supabase backs up automatically

| Plan | Frequency | Retention |
|---|---|---|
| Free | Daily | 7 days |
| Pro | Daily + Point-in-Time Recovery | 7 days base, PITR up to 30 days |
| Team / Enterprise | Daily + PITR | 28 days base, PITR up to 30 days |

No code change is needed to enable these — they run automatically against
the production project.

### How to restore from a backup

Restores are done through the Supabase dashboard, not through `psql` or
our codebase. The process:

1. Go to Supabase dashboard → **Project Settings** → **Database** → **Backups**
2. Pick the snapshot you want to restore (named by date)
3. Click **Restore** — Supabase creates a **new project** with the data
   from that snapshot. The original project is never overwritten.
4. After verifying the restored project has the expected data, swap the
   `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars in
   Vercel to point at the new project, redeploy.

A full restore-to-new-project takes ~5–10 minutes depending on data
volume. The cut-over (env var swap + Vercel redeploy) is another ~2 min.

### What to back up outside Supabase

- **Stripe** — payments live in Stripe; restore happens through their
  dashboard. We just track session IDs in `stripe_processed_sessions`.
- **Resend** — email send history is in Resend's dashboard (30 days
  retention by default). We don't replicate it locally.
- **Certificates bucket** — Supabase Storage is covered by the same
  backup schedule as the database.

## GDPR self-service endpoints

Two unauthenticated-by-design API endpoints (auth header required, no
admin token) let logged-in clients exercise their Article 17 + 20
rights without contacting support.

### `GET /api/auth/export-data`

Returns a JSON file containing everything we have on the requesting
user (auth profile + leads + quotes + portal projects). Browser-
friendly: `Content-Disposition: attachment` so it downloads as
`crecystudio-data-export-<userId>.json`.

Manual test (after a successful login):

```bash
curl -sb cookies.txt https://crecystudio.com/api/auth/export-data \
  -o my-data.json
```

### `POST /api/auth/delete-account`

Permanently deletes the auth user and anonymizes any
business-retention records (quotes, invoices) keyed on the user's
email. Requires explicit `{"confirm": "DELETE"}` in the body to defend
against CSRF.

```bash
curl -X POST https://crecystudio.com/api/auth/delete-account \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"confirm":"DELETE"}'
```

Anonymized rows: `email` becomes `deleted+<userId>@crecystudio.invalid`,
`name` becomes `"Deleted user"`, `phone` and `notes` blanked. Audit
history (activity log, agreement signatures) is preserved per legal
retention requirements.

## Other auth endpoints

### `POST /api/auth/resend-confirmation`

Sends a fresh signup confirmation email. Rate-limited 3/min per IP.
Returns a generic ack regardless of whether the email exists in the
auth table — prevents enumeration.

```bash
curl -X POST https://crecystudio.com/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email":"someone@example.com"}'
```

## Healthcheck

`GET /api/health` returns `{ok:true, latencyMs, timestamp}` when Supabase
is reachable, `503` otherwise. Suitable for UptimeRobot / Better Uptime
/ cron-job.org. Hit it every minute; the probe is sub-millisecond.

## Pre-launch one-time setup

These steps are not code changes — they happen in third-party dashboards
before the public launch.

### Resend

1. Verify the sending domain (`crecystudio.com`) — add SPF, DKIM, DMARC
   records as instructed by Resend's UI.
2. Create a webhook endpoint pointing at `/api/webhooks/resend`
   subscribed to `email.bounced` and `email.complained`. Copy the
   signing secret into Vercel as `RESEND_WEBHOOK_SECRET`.
3. Set `RESEND_FROM_EMAIL` in Vercel to a verified address on that
   domain (e.g. `studio@crecystudio.com`).

### Stripe

1. Add the production webhook endpoint pointing at
   `/api/webhooks/stripe`. Subscribe to:
   - `checkout.session.completed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
2. Copy the signing secret to Vercel as `STRIPE_WEBHOOK_SECRET`.
3. Confirm `STRIPE_SECRET_KEY` in Vercel is a **live** key (starts with
   `sk_live_...`), not a test key (`sk_test_...`).

### Sentry

1. Create a Sentry project for `crecystudio.com`.
2. Copy the DSN into Vercel as both `SENTRY_DSN` (server) and
   `NEXT_PUBLIC_SENTRY_DSN` (browser).
3. Optional — create an auth token in Sentry → User Settings →
   Auth Tokens with `project:releases` scope. Set in Vercel as
   `SENTRY_AUTH_TOKEN` plus `SENTRY_ORG` and `SENTRY_PROJECT` to
   unlock source-map upload (so dashboard stack traces are readable
   instead of minified).

### Google Search Console

1. Add `crecystudio.com` as a property.
2. Copy the verification token into Vercel as
   `GOOGLE_SITE_VERIFICATION`. The meta tag renders site-wide.

### Vercel environment variables

Required for a working production deploy:

- `NEXT_PUBLIC_SITE_URL=https://crecystudio.com`
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` +
  `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `RESEND_WEBHOOK_SECRET`
- `ADMIN_EMAILS` (comma-separated list of admin Supabase user emails)
- `INTERNAL_DASHBOARD_TOKEN` + `CRON_SECRET` (strong random values)

Optional but recommended:

- `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`
- `GOOGLE_SITE_VERIFICATION`
- `INTERNAL_ALERT_WEBHOOK` (Slack/Discord webhook for ops alerts)
- `ADMIN_NOTIFICATION_EMAIL`

See `.env.example` for the full list with inline notes.
