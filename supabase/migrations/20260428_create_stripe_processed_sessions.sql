-- Single-confirmation guard for Stripe checkout sessions.
-- Both the webhook (POST /api/webhooks/stripe) and the success page
-- (/deposit/success) can trigger payment confirmation. Without a shared
-- guard, Stripe retries or a user refresh can double-log activity and
-- re-run side-effects. This table is the dedupe key for both paths.

create table if not exists stripe_processed_sessions (
  session_id text primary key,
  event_id text,
  source text not null,
  processed_at timestamptz not null default now()
);

create index if not exists idx_stripe_processed_sessions_processed_at
  on stripe_processed_sessions(processed_at desc);
