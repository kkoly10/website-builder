-- Bundle 9: tighten two text columns that should be enums
--
-- The round-2 bug hunt flagged ~10 schema gaps. On recon most turned
-- out to be wrong or operationally risky:
--
--   - project_activity.event_type has 34+ distinct values across
--     lib/customerPortal.ts, lib/requiredActions.ts, lib/projectInvoices.ts
--     etc. — too brittle to enumerate in a CHECK that breaks every
--     time a new event is added.
--   - project_invoices.status code only writes the values the CHECK
--     already allows (verified in lib/projectInvoices.ts:21-623).
--   - customer_portal_milestones doesn't actually need a 'blocked'
--     value (normalizeMilestoneStatus only handles done/in_progress/todo).
--   - customer_portal_messages updated_at is never written — messages
--     are append-only.
--   - agreements.body_hash legitimately can be empty when bodyText is
--     empty (lib/customerPortal.ts:2748-2750).
--   - csp_violations.disposition would break old rows with unexpected
--     values from misconfigured browsers.
--   - ghost_* FKs to nullable session_id columns would fail if any
--     existing row has an orphan UUID — too risky without DB access.
--   - project_activity already has a leading-column index via
--     (portal_project_id, created_at) so a single-column index is
--     redundant for portal_project_id equality filters.
--
-- What's left and safe to apply:
--   1. discovery_calls.preferred_locale CHECK — every other locale
--      column in the schema (quotes, leads, ops_intakes, ecom_intakes,
--      call_requests, etc.) constrains to ('en','fr','es'); this one
--      drifted. Current data is just the 'en' default so the CHECK
--      will pass on existing rows.
--   2. proposal_versions.created_by CHECK — the column defaults to
--      'studio' and no code path writes other values. Locking it
--      down prevents audit-trail pollution if anyone ever passes
--      through a free-form input.

-- ------------------------------------------------------------------
-- 1. discovery_calls.preferred_locale
-- ------------------------------------------------------------------

alter table if exists discovery_calls
  drop constraint if exists discovery_calls_preferred_locale_check;

alter table if exists discovery_calls
  add constraint discovery_calls_preferred_locale_check
    check (preferred_locale in ('en', 'fr', 'es'));

-- ------------------------------------------------------------------
-- 2. proposal_versions.created_by
-- ------------------------------------------------------------------

alter table if exists proposal_versions
  drop constraint if exists proposal_versions_created_by_check;

alter table if exists proposal_versions
  add constraint proposal_versions_created_by_check
    check (created_by in ('studio', 'admin', 'client', 'system'));
