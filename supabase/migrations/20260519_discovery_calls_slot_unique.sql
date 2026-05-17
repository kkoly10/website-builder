-- Race-safe slot booking for discovery_calls.
--
-- Before this migration the insert at app/api/book-discovery-call/route.ts:305
-- ran without any locking or constraint check, so two concurrent POSTs to
-- the same scheduled_at could both succeed — overbooking the slot. The
-- handler had a 5/min rate limit but no application-level slot check.
--
-- This partial unique index makes the race impossible at the DB layer. The
-- application catches 23505 and returns a clean 409.
--
-- WHERE clause requirements:
--   * `scheduled_at IS NOT NULL` — the column is nullable (status='pending'
--     for "no slot picked yet" inserts), and we MUST exclude null rows or
--     they'd all collide with each other.
--   * `status IN ('pending', 'confirmed')` — cancelled and completed slots
--     should NOT block re-booking the same time, so they're excluded.
create unique index if not exists discovery_calls_slot_unique
  on public.discovery_calls (scheduled_at)
  where scheduled_at is not null
    and status in ('pending', 'confirmed');
