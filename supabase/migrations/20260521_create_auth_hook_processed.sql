-- Idempotency guard for Supabase Auth Send Email Hook deliveries.
-- The hook follows the Standard Webhooks spec, which guarantees an
-- at-least-once delivery with a unique `webhook-id` header per
-- delivery. Without a dedupe table, a Supabase retry (caused by
-- network failure, a 5xx response that didn't reach Supabase, etc)
-- can result in the same auth email being sent twice — duplicate
-- magic links, duplicate signup confirmations, etc.
--
-- A unique-constraint collision on insert means we've already handled
-- this exact delivery. The caller short-circuits and returns 200 so
-- Supabase considers the delivery acknowledged.

create table if not exists auth_email_hook_processed (
  webhook_id text primary key,
  action_type text,
  processed_at timestamptz not null default now()
);

create index if not exists idx_auth_email_hook_processed_processed_at
  on auth_email_hook_processed(processed_at desc);
