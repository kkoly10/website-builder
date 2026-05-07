-- Migration: 20260507_create_csp_violations.sql
--
-- Phase 1 launch hardening: capture Content-Security-Policy violation
-- reports while CSP rolls out in report-only mode. Once we have a clean
-- picture of legitimate sources, we promote CSP to enforcing and may
-- archive this table. See CRECYSTUDIO_LAUNCH_AND_PORTAL_PLAN.md § Phase 1.

create table if not exists csp_violations (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),

  -- Most useful fields lifted to columns for indexing.
  document_uri text,
  blocked_uri text,
  violated_directive text,
  effective_directive text,
  disposition text,
  status_code integer,

  -- Request metadata to help triage spurious reports.
  user_agent text,
  referer text,
  ip text,

  -- Full report payload as received, for fields we didn't lift.
  raw jsonb not null
);

create index if not exists idx_csp_violations_received_at
  on csp_violations(received_at desc);

create index if not exists idx_csp_violations_directive
  on csp_violations(violated_directive, received_at desc);

-- RLS: lock down by default. The table is server-only; the /api/csp-report
-- endpoint writes via the service role (bypasses RLS). No anon/authenticated
-- client should ever read or write this table directly. Without policies,
-- non-service-role access is denied.
alter table csp_violations enable row level security;
