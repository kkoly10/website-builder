-- Single-confirmation guard for Stripe checkout sessions.
-- Both the webhook (POST /api/webhooks/stripe) and the success page
-- (/deposit/success) can trigger payment confirmation. Without a shared
-- guard, Stripe retries or a user refresh can double-log activity and
-- re-run side-effects. This table is the dedupe key for both paths.
--
-- The row is split into two states:
--   * claimed:   processed_at set, completed_at null. A worker is in flight.
--   * completed: completed_at set. Side-effects have actually finished.
--
-- A unique-constraint collision on insert means another path already
-- claimed the session. The colliding caller looks at completed_at to
-- decide: if completed_at is set, the work is truly done and the duplicate
-- can be acknowledged; if completed_at is null, another worker is still
-- in flight (or has rolled back). The webhook responds with a 5xx in that
-- case so Stripe will retry; the success page just shows pending state.

create table if not exists stripe_processed_sessions (
  session_id text primary key,
  event_id text,
  source text not null,
  processed_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_stripe_processed_sessions_processed_at
  on stripe_processed_sessions(processed_at desc);
