-- Make the agreement-acceptance pipeline race-safe.
--
-- Before this migration the application code in lib/customerPortal.ts could
-- race two concurrent client clicks into two `status='accepted'` rows for the
-- same portal_project_id, with duplicate certificate emails and a corrupted
-- legal audit trail. There was no DB-level uniqueness anywhere, and the
-- "already accepted?" check inside acceptCustomerPortalAgreement() was a
-- read-then-write window that the race exploits.
--
-- Three changes, in order:
--   1. Clean up any existing duplicate accepted rows (keep the earliest one,
--      mark the rest as 'superseded' — already in the existing CHECK list).
--   2. Add a partial unique index that makes the duplicate impossible going
--      forward. The application code in PR 3 catches 23505 and returns the
--      existing winner.
--   3. Add certificate_version (so silent overwrite of signed PDFs becomes
--      versioned-immutable) and certificate_delivery_status (so a delivery
--      failure leaves an actionable flag instead of a silent half-completed
--      state).
--
-- Re-entrancy note: when an agreement is voided via the existing void path
-- (status='voided'), the partial unique index permits a fresh accept because
-- 'voided' isn't in the index's WHERE clause. If 'voided' is ever reversed
-- manually back to 'accepted' in SQL alongside an existing accepted row, the
-- constraint will fire — that's correct behavior; manual SQL surgery should
-- understand the invariant.

-- ── 1. Cleanup duplicates ────────────────────────────────────────────
-- Keep the earliest accepted row per portal (oldest accepted_at, falling back
-- to oldest created_at if accepted_at is null). Demote the rest to
-- 'superseded'. We avoid touching voided/published/declined rows.
with ranked as (
  select id,
    row_number() over (
      partition by portal_project_id
      order by accepted_at asc nulls last, created_at asc
    ) as rn
  from agreements
  where status = 'accepted'
)
update agreements
set status = 'superseded'
from ranked
where agreements.id = ranked.id
  and ranked.rn > 1;

-- ── 2. Partial unique index — the actual race-killer ─────────────────
create unique index if not exists agreements_accepted_unique
  on public.agreements (portal_project_id)
  where status = 'accepted';

-- ── 3. Certificate versioning + delivery tracking ────────────────────
alter table public.agreements
  add column if not exists certificate_version smallint not null default 1;

alter table public.agreements
  add column if not exists certificate_delivery_status text
  not null default 'pending'
  check (certificate_delivery_status in ('pending', 'sent', 'failed'));
