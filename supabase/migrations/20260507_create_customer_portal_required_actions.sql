-- Migration: 20260507_create_customer_portal_required_actions.sql
--
-- Phase 3.10: dedicated table for client-facing "required actions" per
-- portal project. Replaces the MVP scope_snapshot.requiredActions array
-- pattern from the workflow templates so admins can edit individual
-- actions, track completion timestamps, and query across portals.
--
-- One row per (portal_project_id, action_key). Seeded from the workflow
-- template when a portal is created; admin can add ad-hoc actions later.

create table if not exists customer_portal_required_actions (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,

  -- Stable identifier per action. Sourced from the workflow template's
  -- requiredActions[].key (e.g. "complete_design_direction"). Unique per
  -- portal so the same template-keyed action only seeds once.
  action_key text not null,

  -- Owner — "client" or "studio" or "system" (mirrors WorkflowTemplate's
  -- ActionOwner enum). Drives the "action needed from you" filtering on
  -- the client side.
  owner text not null default 'client',

  title text not null,
  description text,

  -- Status mirrors ActionStatus from lib/workflows/types.ts. Most actions
  -- start as "waiting_on_client" or "not_started" and progress to
  -- "complete" or "blocked".
  status text not null default 'not_started',

  -- Optional: due date for this action (admin can set per-portal).
  due_date timestamptz,
  completed_at timestamptz,

  -- The milestone (by key) that gets marked done when this action
  -- completes. Sourced from the template's unlocksMilestone field.
  unlocks_milestone_key text,

  -- Free-form payload for action-specific data (e.g. uploaded files
  -- inventory, links provided by the client, etc.). Most actions don't
  -- need this but the field is available for future expansion.
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One action_key per portal. Prevents duplicate seeding when
  -- ensureCustomerPortalForQuoteId runs idempotently.
  unique (portal_project_id, action_key)
);

create index if not exists idx_customer_portal_required_actions_portal_status
  on customer_portal_required_actions (portal_project_id, status, created_at);

create index if not exists idx_customer_portal_required_actions_portal_owner
  on customer_portal_required_actions (portal_project_id, owner);

-- RLS: server-only. Writes go through helpers in lib/customerPortal.ts
-- using the service role (which bypasses RLS). No anon/authenticated
-- client should read or write directly; the portal API surfaces
-- filtered views via /api/portal/[token].
alter table customer_portal_required_actions enable row level security;
