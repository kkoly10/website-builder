-- Migration: Create quote_portal_state and portal_assets tables
-- These tables power the customer Project Studio (/portal/[token])

-- =============================================================
-- 1. quote_portal_state
--    Stores per-quote portal workspace state: milestones, assets,
--    revision requests, preview/launch/agreement status, etc.
-- =============================================================

create table if not exists quote_portal_state (
  quote_id       uuid primary key references quotes(id) on delete cascade,

  -- Client-facing status
  client_status      text default 'new',
  client_updated_at  timestamptz,
  client_notes       text default '',

  -- Structured JSON arrays
  milestones         jsonb default '[]'::jsonb,
  assets             jsonb default '[]'::jsonb,
  revision_requests  jsonb default '[]'::jsonb,

  -- Deposit
  deposit_amount     numeric,
  deposit_notes      text,

  -- Admin note visible to client
  admin_public_note  text,

  -- Preview / review
  preview_url            text,
  production_url         text,
  preview_status         text default 'Awaiting published preview',
  preview_updated_at     timestamptz,
  preview_notes          text,
  client_review_status   text default 'Preview pending',

  -- Agreement
  agreement_status        text default 'Not published yet',
  agreement_model         text,
  agreement_published_at  timestamptz,
  ownership_model         text,

  -- Launch readiness
  launch_status      text default 'Not ready',
  domain_status      text default 'Pending',
  analytics_status   text default 'Pending',
  forms_status       text default 'Pending',
  seo_status         text default 'Pending',
  handoff_status     text default 'Pending',
  launch_notes       text,

  -- Timestamps
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast lookup by quote
create index if not exists idx_quote_portal_state_quote_id
  on quote_portal_state(quote_id);

-- =============================================================
-- 2. portal_assets
--    Stores individual uploaded/linked assets per quote.
-- =============================================================

create table if not exists portal_assets (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references quotes(id) on delete cascade,

  -- How the asset was submitted
  source          text default 'portal_link',   -- 'portal_link' | 'portal_file'
  asset_type      text default 'link',          -- 'link' | 'file' | 'Brand' | etc.
  label           text not null default 'Client file',
  url             text,                         -- direct URL (for link-based assets)
  notes           text default '',
  status          text default 'submitted',     -- 'submitted' | 'received' | 'approved'

  -- Storage fields (for file uploads)
  storage_bucket  text,
  storage_path    text,
  file_name       text,
  mime_type       text,
  file_size       bigint,

  created_at      timestamptz default now()
);

-- Index for listing assets by quote
create index if not exists idx_portal_assets_quote_id
  on portal_assets(quote_id);

-- Index for ordering by created_at
create index if not exists idx_portal_assets_created_at
  on portal_assets(quote_id, created_at desc);
