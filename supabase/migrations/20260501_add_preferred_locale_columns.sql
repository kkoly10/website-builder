-- Add preferred_locale columns to all customer-facing intake/call tables so we
-- can render /portal pages and outbound (Resend) emails in the locale the user
-- chose at intake. Default 'en' keeps every existing row valid; the CHECK
-- constraint matches the locales enabled in i18n/routing.ts (en, fr, es).
--
-- Idempotent: each statement uses IF [NOT] EXISTS / DROP + ADD so re-running
-- the migration in dev or against a partially-applied environment is safe.

-- ── quotes (website lane) ────────────────────────────────────────────
alter table if exists public.quotes
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.quotes
  drop constraint if exists quotes_preferred_locale_chk;
alter table if exists public.quotes
  add constraint quotes_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));

-- ── leads (shared across lanes — lead might submit before any quote) ─
alter table if exists public.leads
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.leads
  drop constraint if exists leads_preferred_locale_chk;
alter table if exists public.leads
  add constraint leads_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));

-- ── ops_intakes (workflow automation lane) ───────────────────────────
alter table if exists public.ops_intakes
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.ops_intakes
  drop constraint if exists ops_intakes_preferred_locale_chk;
alter table if exists public.ops_intakes
  add constraint ops_intakes_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));

-- ── ecom_intakes (e-commerce lane) ───────────────────────────────────
alter table if exists public.ecom_intakes
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.ecom_intakes
  drop constraint if exists ecom_intakes_preferred_locale_chk;
alter table if exists public.ecom_intakes
  add constraint ecom_intakes_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));

-- ── call_requests (website scope-call requests) ──────────────────────
alter table if exists public.call_requests
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.call_requests
  drop constraint if exists call_requests_preferred_locale_chk;
alter table if exists public.call_requests
  add constraint call_requests_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));

-- ── ops_call_requests ────────────────────────────────────────────────
alter table if exists public.ops_call_requests
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.ops_call_requests
  drop constraint if exists ops_call_requests_preferred_locale_chk;
alter table if exists public.ops_call_requests
  add constraint ops_call_requests_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));

-- ── ecom_call_requests ───────────────────────────────────────────────
alter table if exists public.ecom_call_requests
  add column if not exists preferred_locale text not null default 'en';

alter table if exists public.ecom_call_requests
  drop constraint if exists ecom_call_requests_preferred_locale_chk;
alter table if exists public.ecom_call_requests
  add constraint ecom_call_requests_preferred_locale_chk
  check (preferred_locale in ('en', 'fr', 'es'));
