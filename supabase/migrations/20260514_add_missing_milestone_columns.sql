-- customer_portal_milestones was created before migration 20260420 in some
-- environments, so CREATE TABLE IF NOT EXISTS was a no-op and these columns
-- were never added. This migration adds them safely to any existing table.

alter table customer_portal_milestones
  add column if not exists completed_at timestamptz,
  add column if not exists due_date     timestamptz,
  add column if not exists updated_at   timestamptz not null default now();
