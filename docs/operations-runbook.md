# Operations Runbook (Launch + Daily Use)

## 1) Pre-launch checklist

- Configure all required environment variables from `.env.example`.
- Confirm Supabase auth callbacks use production URL.
- Confirm Stripe secret key and webhook/payment flows in production.
- Confirm Resend sender domain is verified and outbound alerts are routed.
- Apply all SQL files in `supabase/migrations/` to the production database
  in filename order. New migrations land here regularly; if an unfamiliar
  file is present, run it before deploying the matching code or webhooks
  will throw on missing tables.
- Run a production build before every release:

```bash
npm run build
```

## 2) Security and abuse controls

- Keep all internal tokens long and rotate quarterly.
- Restrict admin access via `ADMIN_EMAILS` and require authenticated sign-in.
- Monitor payment disputes and suspend portal access for suspicious activity.
- Keep legal pages (`/privacy`, `/terms`) published and linked in footer.

## 3) Client intake quality control

- Review new quote submissions daily.
- Mark status updates consistently in admin so portal users see clear progress.
- Ensure each approved quote gets a project token/workspace before kickoff.

## 4) Incident response (basic)

- If auth is failing: validate Supabase keys + callback URLs.
- If booking fails: validate quote IDs and API route health.
- If emails fail: validate `RESEND_API_KEY`, sender, and recipient env vars.
- If payment links fail: validate `STRIPE_SECRET_KEY` and public app URL settings.

## 5) Weekly operations cadence

- Export and review leads, conversion rates, and no-show call requests.
- Audit portal statuses for stale items older than 7 days.
- Review any abuse/chargeback events and document outcomes.
- Run dependency and build health checks before updates.

## 6) Recommended next hardening items

- Add route-level rate limiting for public form endpoints.
- Add centralized request logging + alerting for internal/admin routes.
- Add automated backup snapshots and restore test schedule.


## 7) Backup + restore drill

- Take a scheduled database snapshot at least daily (or use managed PITR if enabled).
- Keep encrypted backup exports in a separate storage location.
- Run a monthly restore drill into a staging environment and validate:
  - auth flows
  - lead/quote records
  - portal rendering
- Log the drill date, owner, and time-to-recover in an ops journal.

## 8) Internal route observability

- Use `INTERNAL_ALERT_WEBHOOK` to receive alerts when non-GET internal routes are called.
- Monitor logs for `[internal-access]` and `[internal-mutation]` events.
- Escalate repeated unknown IP activity immediately (rotate internal tokens + review auth logs).

## 9) Stripe webhook + deposit confirmation

- Stripe webhook lives at `/api/webhooks/stripe`. Signature verification
  is HMAC-SHA256 with a 5-minute replay window.
- Idempotency is enforced via the `stripe_processed_sessions` table
  (migration `20260428_create_stripe_processed_sessions.sql`). The
  webhook and `/deposit/success` both insert the Stripe session_id
  before running side-effects and roll the row back on failure so a
  retry can reprocess.
- If a deposit is stuck "pending" after Stripe shows "paid":
  1. Check `stripe_processed_sessions` for the session_id. If present
     but the underlying quote/portal is still pending, processing
     failed mid-flight. Delete the row to release the claim.
  2. Replay the webhook from the Stripe dashboard, or have the customer
     refresh `/deposit/success?session_id=cs_...`.
- The `CRON_SECRET` env var is required. The nudges cron at
  `/api/internal/nudges/run` fails closed (returns 401) if it is unset.
