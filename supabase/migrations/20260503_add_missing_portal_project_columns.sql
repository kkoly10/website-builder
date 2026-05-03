-- Applied via Supabase MCP on 2026-05-03.
-- The customer_portal_projects table was originally created with only the base
-- columns (id, quote_id, access_token, project_status, deposit_*, scope_snapshot,
-- kickoff_notes, created_at, updated_at). This migration adds all portal-state
-- columns that the application code expects but were missing from the initial table.

ALTER TABLE customer_portal_projects
  ADD COLUMN IF NOT EXISTS client_status         text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS client_updated_at     timestamptz,
  ADD COLUMN IF NOT EXISTS client_notes          text DEFAULT '',
  ADD COLUMN IF NOT EXISTS deposit_paid_at       timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_notes         text,
  ADD COLUMN IF NOT EXISTS admin_public_note     text,
  ADD COLUMN IF NOT EXISTS preview_url           text,
  ADD COLUMN IF NOT EXISTS production_url        text,
  ADD COLUMN IF NOT EXISTS preview_status        text NOT NULL DEFAULT 'Awaiting published preview',
  ADD COLUMN IF NOT EXISTS preview_updated_at    timestamptz,
  ADD COLUMN IF NOT EXISTS preview_notes         text,
  ADD COLUMN IF NOT EXISTS client_review_status  text NOT NULL DEFAULT 'Preview pending',
  ADD COLUMN IF NOT EXISTS agreement_status      text NOT NULL DEFAULT 'Not published yet',
  ADD COLUMN IF NOT EXISTS agreement_model       text,
  ADD COLUMN IF NOT EXISTS agreement_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS agreement_accepted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS agreement_text        text,
  ADD COLUMN IF NOT EXISTS ownership_model       text,
  ADD COLUMN IF NOT EXISTS launch_status         text NOT NULL DEFAULT 'Not ready',
  ADD COLUMN IF NOT EXISTS domain_status         text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS analytics_status      text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS forms_status          text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS seo_status            text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS handoff_status        text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS launch_notes          text,
  ADD COLUMN IF NOT EXISTS payment_reference     text;
