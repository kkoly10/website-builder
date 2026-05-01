-- Migration: 20260501_add_project_type_columns.sql
--
-- Phase 1 Task 4 / v1.5 backend minimal target. Adds the queryable spine
-- for the multi-lane positioning (five sales lanes mirroring the frontend
-- ProjectType taxonomy). See backend_schema_for_crecystudio_project_engine.md
-- § "v1.5 Minimal Target" for the full spec.

create type project_type_enum as enum (
  'website',
  'web_app',
  'automation',
  'ecommerce',
  'rescue'
);

-- Default 'website' on the column so inserts that don't explicitly set
-- project_type still succeed (admin actions creating portal projects, legacy
-- code paths, etc.). New intake/admin code sets the value explicitly.
alter table quotes
  add column if not exists project_type project_type_enum default 'website';

alter table customer_portal_projects
  add column if not exists project_type project_type_enum default 'website';

-- Backfill: every existing row is a website until we know otherwise.
-- Historical traffic was overwhelmingly website projects.
update quotes
  set project_type = 'website'
  where project_type is null;

update customer_portal_projects
  set project_type = 'website'
  where project_type is null;

-- After backfill, enforce NOT NULL on new rows.
alter table quotes
  alter column project_type set not null;

alter table customer_portal_projects
  alter column project_type set not null;

-- Indexes for admin pipeline lane filtering.
create index if not exists idx_quotes_project_type
  on quotes(project_type, created_at desc);

create index if not exists idx_customer_portal_projects_project_type
  on customer_portal_projects(project_type, created_at desc);
