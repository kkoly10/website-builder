-- Bundle 6: defense-in-depth RLS + ghost-table cleanup
--
-- Two scoped changes:
--
-- 1. ENABLE RLS on the customer_portal_* tables that were created without
--    it. Every other portal table (proposals, agreements,
--    customer_portal_required_actions, etc.) has RLS turned on; these
--    five missed the convention. All app code accesses them via the
--    service role, which bypasses RLS, so there is no behavioral change
--    today — this just locks the back door if any future code path
--    switches off the service role.
--
-- 2. Create the user_roles table that lib/supabase/server.ts:88-108
--    reads in isAdminUser(). The lookup is already wrapped in
--    try/catch with an ADMIN_EMAILS env fallback, so production has
--    been quietly running on the env fallback if this table never
--    actually existed. Adding it (a) makes the source-of-truth visible
--    in migrations, (b) enables DB-backed admin management.
--
-- NOT in this migration: the claim_customer_records RPC referenced in
-- lib/supabase/server.ts:123. The RPC's intended semantics (which
-- tables to claim, what counts as a match) are too consequential to
-- reverse-engineer from one call site; tracked as a follow-up.

-- ------------------------------------------------------------------
-- 1. ENABLE RLS on the five customer_portal_* tables
-- ------------------------------------------------------------------

alter table if exists customer_portal_projects   enable row level security;
alter table if exists customer_portal_milestones enable row level security;
alter table if exists customer_portal_assets     enable row level security;
alter table if exists customer_portal_revisions  enable row level security;
alter table if exists customer_portal_messages   enable row level security;

-- ------------------------------------------------------------------
-- 2. user_roles table — DB-backed admin role store
-- ------------------------------------------------------------------

create table if not exists user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_roles_user_id on user_roles(user_id);
create index if not exists idx_user_roles_role    on user_roles(role);

-- Lock the table down. Only the service role should read/write
-- user_roles; admins are not allowed to grant themselves admin from
-- the client. (Service role bypasses RLS, so the explicit lock here
-- is just to make intent unambiguous.)
alter table user_roles enable row level security;
