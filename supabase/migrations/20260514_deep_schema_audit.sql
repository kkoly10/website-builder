-- Deep schema audit: adds columns that may be missing on tables that predated
-- their own CREATE TABLE IF NOT EXISTS migration, and creates ghost tables
-- that have no migration history at all (they were created manually).
-- Every statement uses ADD COLUMN IF NOT EXISTS or CREATE TABLE IF NOT EXISTS
-- so this is fully idempotent and safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- customer_portal_assets
-- Migration 20260420 defined file_name/mime_type/file_size/updated_at but if
-- the table already existed those columns were never added.
-- ─────────────────────────────────────────────────────────────────────────────
alter table customer_portal_assets
  add column if not exists file_name   text,
  add column if not exists mime_type   text,
  add column if not exists file_size   bigint,
  add column if not exists updated_at  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- customer_portal_revisions
-- Migration 20260420 defined priority/updated_at but table may have predated it.
-- ─────────────────────────────────────────────────────────────────────────────
alter table customer_portal_revisions
  add column if not exists priority    text not null default 'normal',
  add column if not exists updated_at  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- customer_portal_messages
-- Migration 20260421 defined read_at and all attachment_* columns. If the table
-- predated the migration none of these were applied.
-- ─────────────────────────────────────────────────────────────────────────────
alter table customer_portal_messages
  add column if not exists read_at                    timestamptz,
  add column if not exists attachment_url             text,
  add column if not exists attachment_name            text,
  add column if not exists attachment_type            text,
  add column if not exists attachment_size            bigint,
  add column if not exists attachment_storage_bucket  text,
  add column if not exists attachment_storage_path    text;

-- ─────────────────────────────────────────────────────────────────────────────
-- project_invoices
-- Migration 20260422 defined updated_at. Guard in case table predated it.
-- ─────────────────────────────────────────────────────────────────────────────
alter table project_invoices
  add column if not exists updated_at  timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- Ghost Admin tables — no migration files exist; tables were created manually.
-- CREATE TABLE IF NOT EXISTS is a no-op when they already exist; the ALTER
-- TABLE statements then patch any missing columns either way.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ghost_sessions (
  id             uuid primary key default gen_random_uuid(),
  lane           text not null,
  project_id     text,
  session_label  text,
  admin_user_id  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table ghost_sessions
  add column if not exists lane           text not null default 'global',
  add column if not exists project_id     text,
  add column if not exists session_label  text,
  add column if not exists admin_user_id  text,
  add column if not exists created_at     timestamptz default now(),
  add column if not exists updated_at     timestamptz default now();

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ghost_project_snapshots (
  id                       uuid primary key default gen_random_uuid(),
  session_id               uuid,
  lane                     text not null,
  project_id               text,
  phase                    text,
  status                   text,
  health_state             text,
  waiting_on               text,
  next_action_title        text,
  risk_flags               jsonb,
  latest_activity_summary  text,
  source_facts             jsonb,
  created_at               timestamptz not null default now()
);

alter table ghost_project_snapshots
  add column if not exists session_id               uuid,
  add column if not exists lane                     text,
  add column if not exists project_id               text,
  add column if not exists phase                    text,
  add column if not exists status                   text,
  add column if not exists health_state             text,
  add column if not exists waiting_on               text,
  add column if not exists next_action_title        text,
  add column if not exists risk_flags               jsonb,
  add column if not exists latest_activity_summary  text,
  add column if not exists source_facts             jsonb,
  add column if not exists created_at               timestamptz default now();

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ghost_guardrail_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid,
  lane        text,
  project_id  text,
  event_type  text not null,
  severity    text not null default 'medium',
  event_text  text,
  event_json  jsonb,
  created_at  timestamptz not null default now()
);

alter table ghost_guardrail_events
  add column if not exists session_id  uuid,
  add column if not exists lane        text,
  add column if not exists project_id  text,
  add column if not exists event_type  text,
  add column if not exists severity    text,
  add column if not exists event_text  text,
  add column if not exists event_json  jsonb,
  add column if not exists created_at  timestamptz default now();

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ghost_message_analysis (
  id                            uuid primary key default gen_random_uuid(),
  session_id                    uuid,
  lane                          text,
  project_id                    text,
  source_message_text           text,
  category_label                text,
  sentiment_label               text,
  urgency_label                 text,
  risk_label                    text,
  what_client_is_really_asking  text,
  coaching_json                 jsonb,
  created_at                    timestamptz not null default now()
);

alter table ghost_message_analysis
  add column if not exists session_id                    uuid,
  add column if not exists lane                          text,
  add column if not exists project_id                    text,
  add column if not exists source_message_text           text,
  add column if not exists category_label                text,
  add column if not exists sentiment_label               text,
  add column if not exists urgency_label                 text,
  add column if not exists risk_label                    text,
  add column if not exists what_client_is_really_asking  text,
  add column if not exists coaching_json                 jsonb,
  add column if not exists created_at                    timestamptz default now();

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ghost_reply_suggestions (
  id                    uuid primary key default gen_random_uuid(),
  message_analysis_id   uuid,
  default_reply         text,
  variants_json         jsonb,
  why_this_works        text,
  caution_text          text,
  next_action_text      text,
  created_at            timestamptz not null default now()
);

alter table ghost_reply_suggestions
  add column if not exists message_analysis_id  uuid,
  add column if not exists default_reply        text,
  add column if not exists variants_json        jsonb,
  add column if not exists why_this_works       text,
  add column if not exists caution_text         text,
  add column if not exists next_action_text     text,
  add column if not exists created_at           timestamptz default now();
