# Backend Schema for CrecyStudio Project Engine

## Purpose

This is the data-layer companion to `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md` and `frontend_schema_and_connection_to_current_systems.md`. The strategy doc says *what to sell*; the frontend doc says *what users see*; this doc says *what the database holds and how the API serves it*.

This rewrite replaces the earlier draft. The earlier draft proposed a HubSpot/Jira-shape schema across 8 layers and 30+ tables — the right shape for a multi-operator agency with separate sales and delivery teams. The current direction — set by the strategy doc — is a v1.5 minimal target appropriate for a solo operator: 4 new tables plus 1 column, designed to close the highest-value gaps (proposal versioning, agreement audit trail, recurring revenue, lane-queryability) without overbuilding for scale that doesn't exist yet.

The v3 HubSpot shape is named here as a "later" reference, not a v1 target. Specific triggers that would warrant promoting to v3 are listed below.

---

## Executive Summary

The backend already supports the full lifecycle that matters today: lead capture, intake, pricing, deposit, portal, milestones, assets, revisions, messages, invoices, activity feed, scope snapshots, change orders, Stripe idempotency, and an internal admin pipeline. The PIE engine is shipped at v3 with fast/warm/deep routing.

The v1.5 backend rewrite addresses four real gaps the existing schema doesn't:

1. **Proposals live in `quotes.debug` JSON**, not a real table. No version history, no sent/viewed/accepted lifecycle, no proposal-level analytics.
2. **Agreements live in `customer_portal_projects.agreement_*` columns**, not a separate audit-trail table. No body hash, no accepted-IP capture, no version-binding.
3. **Recurring revenue has no engine.** Retainers are invoiceable as one-off entries on `project_invoices` but `support_subscriptions` doesn't exist.
4. **`project_type` column doesn't exist on `quotes` or `customer_portal_projects`**, so admin can't filter by lane and the new positioning has no queryable spine.

The v1.5 target is 1 column + 4 tables. Everything else stays. Migration is non-breaking; existing reads and writes continue working through fallbacks during the transition.

---

## What's Already Shipped (Backend Layer)

Per the opportunity doc reconciliation:

| Backend area | Status | Migration / file |
|---|---|---|
| `customer_portal_projects` + milestones + assets + revisions | Shipped | `supabase/migrations/20260420_create_customer_portal_tables.sql` |
| `customer_portal_messages` (two-way messaging with attachments) | Shipped | `supabase/migrations/20260421_add_customer_portal_messages.sql` |
| `project_activity` (unified activity feed) | Shipped | `supabase/migrations/20260422_add_project_activity_and_nudges.sql` |
| `nudge_log` (idempotent automated reminders) | Shipped | same migration |
| `project_invoices` (deposit / milestone / final / retainer one-off invoices) | Shipped | `supabase/migrations/20260422_create_project_invoices.sql` |
| `stripe_processed_sessions` (Stripe Checkout idempotency, two-state claimed/completed) | Shipped | `supabase/migrations/20260428_create_stripe_processed_sessions.sql` |
| `quote_portal_state` + early `portal_assets` (legacy schema, superseded by `customer_portal_*`) | Shipped | `supabase/migrations/20260328_create_quote_portal_state_and_portal_assets.sql` |
| `ops_intakes` workspace state | Shipped | `supabase/migrations/20260326_add_workspace_state_to_ops_intakes.sql` |
| Tier-based pricing config | Shipped | `lib/pricing/tiers.ts` |
| PIE v3 engine (fast/warm/deep routing, deep/warm trigger evaluation, capacity breakdown, profit signal) | Shipped | `lib/pie/ensurePie.ts` |

Total: 7 SQL migrations, full pricing module set, and the PIE engine — all in production.

---

## v1.5 Minimal Target

The four tables and one column to add. Designed to fit on one afternoon's worth of migration work for a solo operator and to close the proposal/agreement/recurring-revenue/lane-queryability gaps without inviting CRM-style sprawl.

### 1. `project_type` column on `quotes` and `customer_portal_projects`

Phase 1 of the opportunity doc roadmap. Adds the queryable spine for the new positioning.

```sql
-- Migration: <date>_add_project_type.sql

create type project_type_enum as enum (
  'website',
  'web_app',
  'automation',
  'ecommerce',
  'rescue'
);

alter table quotes
  add column if not exists project_type project_type_enum;

alter table customer_portal_projects
  add column if not exists project_type project_type_enum;

-- Backfill: every existing row is a website until we know otherwise
update quotes
  set project_type = 'website'
  where project_type is null;

update customer_portal_projects
  set project_type = 'website'
  where project_type is null;

-- After backfill, enforce NOT NULL on new rows
alter table quotes
  alter column project_type set not null;

alter table customer_portal_projects
  alter column project_type set not null;

-- Indexes for admin pipeline filtering
create index if not exists idx_quotes_project_type
  on quotes(project_type, created_at desc);

create index if not exists idx_customer_portal_projects_project_type
  on customer_portal_projects(project_type, created_at desc);
```

Once shipped, `app/api/submit-estimate/route.ts` writes the value from `IntakeSubmission.projectType`. Admin pipeline (`lib/adminProjectData.ts` + `app/internal/admin/AdminPipelineClient.tsx`) filters by lane.

### 2. `proposals`

The container for proposal lifecycle.

```sql
create table proposals (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  current_version_id uuid,  -- FK added after proposal_versions exists
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quote_id)  -- one proposal record per quote; versioning via proposal_versions
);

create index if not exists idx_proposals_quote on proposals(quote_id);
create index if not exists idx_proposals_status on proposals(status, sent_at desc);
```

### 3. `proposal_versions`

Versioned proposal content. Every meaningful edit creates a new version; `proposals.current_version_id` points at the active one.

```sql
create table proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  version_no int not null,
  scope_summary text,
  price_target numeric,
  deposit_amount numeric,
  timeline_text text,
  terms_text text,
  body_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (proposal_id, version_no)
);

create index if not exists idx_proposal_versions_proposal
  on proposal_versions(proposal_id, version_no desc);

-- Add the FK that proposals.current_version_id couldn't have at table-creation time
alter table proposals
  add constraint proposals_current_version_fk
  foreign key (current_version_id) references proposal_versions(id);
```

Read pattern: admin reads `proposals` joined to its `current_version_id` to render the active proposal. History reads `proposal_versions` ordered by `version_no desc`. Existing `quotes.debug.generatedProposal` becomes a fallback — admin code reads "from `proposals` if present, else from `debug`." Old quotes work without backfill.

### 4. `agreements`

Audit-trail table for agreement publication and acceptance.

```sql
create table agreements (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  proposal_version_id uuid references proposal_versions(id),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'accepted', 'voided')),
  body_text text not null,
  body_hash text not null,  -- sha256 hex of body_text computed at publication
  published_at timestamptz,
  accepted_at timestamptz,
  accepted_by_email text,
  accepted_ip text,
  accepted_user_agent text,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agreements_portal_project
  on agreements(portal_project_id, created_at desc);
```

When a portal client accepts an agreement, the API handler writes a row with `status='accepted'`, `accepted_at=now()`, `accepted_by_email` from the portal session context, `accepted_ip` from request headers, and `accepted_user_agent` from the `User-Agent` header. The body hash is computed at publication and not recomputed at acceptance — if it differs at audit, the agreement was tampered with after publication. Existing `customer_portal_projects.agreement_*` columns become legacy fallback reads during transition.

### 5. `support_subscriptions`

Recurring-revenue engine. Created when the first Care plan is sold — not before.

```sql
create table support_subscriptions (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  plan text not null
    check (plan in ('care', 'care_plus', 'care_pro', 'systems_partner')),
  monthly_price_cents integer not null,
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'past_due')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_subscriptions_portal_project
  on support_subscriptions(portal_project_id);

create index if not exists idx_support_subscriptions_status
  on support_subscriptions(status);

create index if not exists idx_support_subscriptions_stripe
  on support_subscriptions(stripe_subscription_id);
```

Stripe `customer.subscription.created` / `updated` / `deleted` webhook events update this table. The existing `stripe_processed_sessions` table extends naturally to handle subscription event idempotency — same claimed/completed dedupe pattern, same `event_id` column.

### Migration order

1. **Add `project_type` column** + backfill — Phase 1 of the opportunity doc roadmap.
2. **Add `proposals` + `proposal_versions`** — Phase 3.
3. **Add `agreements`** — Phase 3.
4. **Add `support_subscriptions`** — Phase 3, only when the first Care plan is actually sold. Don't migrate ahead of demand.

Each migration is independent. Order matters only for fallback behavior: until `proposals` exists, admin reads `quotes.debug.generatedProposal`; until `agreements` exists, admin reads `customer_portal_projects.agreement_*` columns. Both fallback patterns are intentionally non-removing — old data stays readable forever.

---

## What's Deferred to v3 (and what would trigger it)

The earlier draft proposed an enterprise schema with `contacts`, `companies`, `company_contacts`, `lead_sources`, `opportunities`, `tasks`, `project_members`, `support_plans`, `support_tickets`, `analytics_events`, `funnel_events`, `project_metrics`, and a separation between `intakes` / `estimates` / `opportunities` / `quotes` / `proposals`. None of that is in v1.5.

Concrete triggers that would warrant promoting to v3:

- **A second operator joins.** Solo doesn't need `project_members`. Two operators do.
- **Multi-stakeholder companies become more than ~25% of the pipeline.** Solo-prop buyers don't need `companies` + `company_contacts`. B2B mid-market does.
- **Closed-deal volume exceeds ~30 per quarter** with retention-cohort analysis as a real need. Below that, manual queries on existing tables are fine.
- **A real CRM integration is required** (HubSpot, Salesforce, Pipedrive sync). At that point a `contacts`/`companies` shape mirrors the destination CRM and saves transformation work.
- **Support tickets become a queue-managed product** rather than ad-hoc Care+ work. Below that, treating tickets as tagged messages in the existing `customer_portal_messages` + `project_activity` tables is sufficient.

Until at least one trigger fires, v3 is overhead. The schema would either bit-rot from disuse or accumulate joins that hurt admin query speed without delivering proportionate value.

---

## Project-Type Backend Contract

Five `ProjectType` values mirror the frontend taxonomy:

```sql
create type project_type_enum as enum (
  'website',
  'web_app',
  'automation',
  'ecommerce',
  'rescue'
);
```

Stored on `quotes` and `customer_portal_projects` (Phase 1 migration above). Read by:

- **`lib/adminProjectData.ts`** — admin pipeline filters by lane via `project_type` column instead of inferring from intake fields.
- **`app/internal/dashboard/page.tsx`** — KPIs split by `project_type` in `getDashboardSnapshot()`.
- **`lib/pie/ensurePie.ts`** — already lane-aware via `pricing.lane` from intake; the column makes the value persistently queryable post-submission.
- **Future portal templates** — different project types eventually render different milestone defaults (see "Project-Type-Specific Portal Behavior" below).

`DeliveryArchetype` (the internal-only second axis from the frontend doc) is *not* added as a column in v1.5. Operator-set archetype lives inside `customer_portal_projects.scope_snapshot.archetype` JSON for now. Promote to a column when more than ~3 archetype-specific code branches exist in admin — until then, JSON is fine and easier to evolve.

---

## Lifecycle Statuses

The existing `customer_portal_projects` table tracks `project_status` and `client_status` with default `'new'`. v1.5 doesn't replace those; it adds proposal, agreement, and subscription lifecycle on top.

### Proposal lifecycle

```
draft → sent → viewed → (accepted | declined | expired)
```

- **draft** — created; not yet visible to client.
- **sent** — admin published; client URL active. `sent_at` set.
- **viewed** — client opened the proposal at least once. `viewed_at` set.
- **accepted** — client clicked accept. `accepted_at` set; quote moves to `accepted` status; deposit link generated.
- **declined** — client clicked decline. `declined_at` set; quote stays open for revision.
- **expired** — `expires_at` reached without action. Cron-or-on-read computed.

State transitions are write-only and audit-logged via `project_activity` rows (event types: `proposal_sent`, `proposal_viewed`, `proposal_accepted`, `proposal_declined`).

### Agreement lifecycle

```
draft → published → (accepted | voided)
```

- **draft** — admin authoring; no body hash yet.
- **published** — body hash computed and frozen. `published_at` set. Client can view and accept.
- **accepted** — client signed. `accepted_at`, `accepted_by_email`, `accepted_ip`, `accepted_user_agent` captured.
- **voided** — admin manually voided (e.g., scope renegotiated). `voided_at` and `void_reason` set. A new agreement row is created for the renegotiated scope; the voided one is immutable for audit.

Once `published_at` is set, `body_text` and `body_hash` are immutable. Any subsequent edit requires voiding and re-publishing.

### Support subscription lifecycle

```
active → past_due → (active | cancelled)
       ↘ cancelled
```

Driven by Stripe webhook events. `past_due` enters when an invoice fails; `active` re-entered on success. `cancelled` is terminal. A "paused" state is intentionally absent in v1.5 — Stripe's `pause_collection` integration adds complexity (admin UI + webhook detection) without proven demand. Add when a client first asks to pause; the column type can extend non-disruptively via a CHECK constraint update.

---

## Stripe and Billing Model

Stripe Checkout remains the primary payment path because it minimizes custom checkout complexity and supports metadata for internal reconciliation. v1.5 extends the existing model to subscriptions without replacing one-off invoicing.

### Payment types and metadata

| Payment type | Stripe object | Required metadata | Effect |
|---|---|---|---|
| Deposit | Checkout Session (mode: `payment`) | `quote_id`, `portal_project_id`, `invoice_id`, `payment_type: 'deposit'` | Marks deposit paid, activates project, updates portal |
| Milestone invoice | Checkout Session (mode: `payment`) | `portal_project_id`, `invoice_id`, `payment_type: 'milestone'` | Marks specific `project_invoices` row paid |
| Final invoice | Checkout Session (mode: `payment`) | `portal_project_id`, `invoice_id`, `payment_type: 'final'` | Marks invoice paid; portal may flip to `closed_won` |
| Retainer (one-off) | Checkout Session (mode: `payment`) | `portal_project_id`, `invoice_id`, `payment_type: 'retainer'` | Marks invoice paid; doesn't create a subscription |
| Care subscription | Checkout Session (mode: `subscription`) — uses a per-plan Stripe `Price` ID configured in the Stripe dashboard | `subscription_data.metadata`: `portal_project_id`, `support_plan: 'care' \| 'care_plus' \| 'care_pro' \| 'systems_partner'`, `payment_type: 'subscription'` | Creates `support_subscriptions` row on `customer.subscription.created` |

### Webhook event handling

The existing `app/api/webhooks/stripe/route.ts` already verifies signatures and uses `stripe_processed_sessions` for idempotency on `checkout.session.completed` events. v1.5 extends that handler to additional event types:

| Event | New v1.5 handling |
|---|---|
| `checkout.session.completed` | Existing: marks deposit/invoice paid via `stripe_processed_sessions`. v1.5 adds: if `mode === 'subscription'`, create `support_subscriptions` row from session metadata. |
| `customer.subscription.created` | New: idempotent insert/upsert into `support_subscriptions`; status `'active'`. |
| `customer.subscription.updated` | New: update `current_period_start/end`, `status` (`'active'` / `'past_due'`). |
| `customer.subscription.deleted` | New: set `status='cancelled'`, `cancelled_at=now()`. |
| `invoice.payment_failed` (subscription) | New: set `support_subscriptions.status='past_due'`. |
| `invoice.payment_succeeded` (subscription) | New: re-set `status='active'` if previously `past_due`. |

Idempotency for subscription events reuses the existing `stripe_processed_sessions` table. Subscription events do not have a Checkout Session ID, so the handler stores `session_id = event.id` (Stripe's event ID) for those rows — the column name is slightly inaccurate but the dedupe semantics are preserved without a schema change. Optionally rename the column to `dedupe_key` in a later cleanup migration if the inaccuracy bothers; not required for v1.5.

---

## RLS and Security Model

Supabase Row-Level Security is enabled on every table that's reachable from the public schema via the anon or authenticated key. Service-role access stays server-only. The new v1.5 tables follow the same pattern as the existing portal tables.

| Table | Read policy | Write policy |
|---|---|---|
| `proposals` | Service-role only (admin reads via server route) | Service-role only |
| `proposal_versions` | Service-role only | Service-role only |
| `agreements` | Token-bound: client can read agreements for their `portal_project_id` via a portal session helper. Service-role for admin. | Service-role only (publication and acceptance write paths run on the server) |
| `support_subscriptions` | Token-bound: client can read their own subscription row. Service-role for admin. | Service-role only (Stripe webhook handler is server-side) |

Token binding for portal-scoped reads uses the existing pattern: the API route resolves `access_token` to `portal_project_id` server-side, then queries with the service role and returns the result. The anon key never touches these tables directly.

Acceptance writes (agreement accept, proposal accept) capture client IP via `request.headers.get('x-forwarded-for')` and `User-Agent` server-side. The portal client sends nothing; everything observable is captured by the server.

Existing security guarantees that stay unchanged:

- Stripe webhook signature verification (`STRIPE_WEBHOOK_SECRET`).
- Admin route gating via `requireAdminRoute()` and `isAdminUser()`.
- Rate limiting on public endpoints via `lib/rateLimit.ts`.
- CORS / CSRF middleware in `proxy.ts`.
- Idempotent webhook processing via `stripe_processed_sessions`.

---

## Project-Type-Specific Portal Behavior

The portal is one codepath; project-type-specific behavior is data-driven, not code-branched. Each project type points to a default set of milestones and the portal's section emphasis.

| Project type | Portal section emphasis | Default milestones |
|---|---|---|
| `website` | Pages, content/assets, preview URL, revisions, launch checklist | Deposit · Content · Build · Review · Launch |
| `web_app` | Features, sprints, environments, QA, deployments, roles | Discovery · MVP · QA · Beta · Launch |
| `automation` | Workflows, triggers, tools, tests, SOPs, handoff notes | Audit · Build · Test · Document · Handoff |
| `ecommerce` | Products, checkout, payment setup, fulfillment, launch readiness | Setup · Catalog · Checkout · Test · Launch |
| `rescue` | Audit findings, fixes, before/after notes, relaunch checklist | Audit · Plan · Sprint · Relaunch |

Implementation: `customer_portal_milestones` rows are seeded from a `project_type → milestone[]` map in `lib/customerPortal.ts` when the portal project is created. The `project_status` field already exists; `project_type` (Phase 1 migration) feeds the seeding logic. No new milestone-template table needed for v1.5.

---

## API Route Model

v1.5 prefers extending existing routes over creating parallel new paths. The repo already has admin proposal, pre-contract (agreement), and invoice surfaces; the portal already dispatches client actions through `app/api/portal/[token]/route.ts` via an `actionType` discriminator. v1.5 extends those, only adding net-new routes where no existing surface fits.

| Area | Route | v1.5 effect |
|---|---|---|
| Public intake | `POST /api/submit-estimate` (existing) | Reads `projectType` from body; writes `quotes.project_type` and `customer_portal_projects.project_type` |
| Call request | `POST /api/request-call` (existing) | Unchanged for v1.5 |
| Proposal create / update / send | `POST /api/internal/admin/proposal/route.ts` (existing — EXTEND) | Currently writes proposal data to `quotes.debug.generatedProposal`. v1.5 extends to also insert/upsert a `proposals` row plus a new `proposal_versions` row on each save; transitions `proposals.status` ('draft' → 'sent') on publish |
| Proposal accept | `POST /api/portal/[token]/route.ts` with `actionType: 'proposal_accept'` (existing dispatcher — EXTEND) | New action; sets `proposals.status='accepted'`, triggers existing deposit-link creation |
| Agreement publish | `POST /api/internal/admin/pre-contract/route.ts` (existing — EXTEND) | Currently writes `customer_portal_projects.agreement_*` fields. v1.5 extends to also insert an `agreements` row with `status='published'` and computed body_hash |
| Agreement accept | `POST /api/portal/[token]/route.ts` with `actionType: 'agreement_accept_v2'` (existing dispatcher — EXTEND) | New action; inserts `accepted_*` fields including IP and User-Agent into the active `agreements` row |
| Subscription start | `POST /api/internal/start-subscription/route.ts` (NEW) | Creates Stripe subscription Checkout Session via a per-plan `Price` ID (Care / Care+ / Care Pro / Systems Partner); attaches `portal_project_id` and `support_plan` to `subscription_data.metadata` |
| Webhook | `POST /api/webhooks/stripe/route.ts` (existing — EXTEND) | Adds `customer.subscription.*` and `invoice.payment_*` handlers; existing deposit handler unchanged |
| Portal | `GET/POST /api/portal/[token]` and children (existing) | Reads `agreements` for the project; existing message/asset/revision/invoice routes unchanged |
| Admin | `GET /api/internal/admin/projects` and children (existing) | Joins `project_type` for lane filter; reads `proposals` for proposal status |
| Invoices admin | `app/api/internal/admin/invoices/route.ts` and `.../invoices/send/` (existing) | Unchanged for v1.5 |

Existing API routes that don't change for v1.5: deposit creation, deposit success/cancel, portal messages/assets/revisions/invoices/preview, ops admin, ecommerce admin, internal dashboard.

---

## v1.5 Migration Plan

Numbered steps, each independent and reversible. Roughly maps to the opportunity doc 90-day roadmap.

| # | Step | Phase | Effort |
|---|---|---|---|
| 1 | Migration: add `project_type` enum + columns + backfill + indexes | 1 | S (1–2h) |
| 2 | Update `app/api/submit-estimate/route.ts` to write `project_type` from `IntakeSubmission.projectType` | 1 | S (1h) |
| 3 | Update `lib/adminProjectData.ts` and `AdminPipelineClient.tsx` to surface `project_type` filter | 1 | S (2h) |
| 4 | Migration: create `proposals` + `proposal_versions` (with deferred FK) | 3 | M (4h) |
| 5 | Extend existing `app/api/internal/admin/proposal/route.ts` to also write `proposals` + `proposal_versions` rows on each save (current debug-JSON write stays for backward compatibility) | 3 | M (4h) |
| 6 | Extend portal `app/api/portal/[token]/route.ts` actionType dispatcher with `proposal_accept` action; on accept, set `proposals.status='accepted'` and trigger the existing deposit-link flow | 3 | M (3h) |
| 7 | Update admin proposal rendering (`lib/customerPortal.ts`, `app/internal/admin/[id]/ProjectControlClient.tsx`) to read from `proposals` / `proposal_versions` with fallback to `quotes.debug.generatedProposal` | 3 | S (3h) |
| 8 | Migration: create `agreements` | 3 | S (2h) |
| 9 | Extend existing `app/api/internal/admin/pre-contract/route.ts` to also insert an `agreements` row at publish; extend portal `[token]/route.ts` with `agreement_accept_v2` actionType writing `accepted_*` fields | 3 | M (5h) |
| 10 | Update portal and admin agreement rendering to read from `agreements` with fallback to `customer_portal_projects.agreement_*` | 3 | S (3h) |
| 11 | Migration: create `support_subscriptions` | 3 | S (1h) |
| 12 | Extend `app/api/webhooks/stripe/route.ts` to handle `customer.subscription.*` and `invoice.payment_*` events | 3 | M (4h) |
| 13 | Build `app/api/internal/start-subscription/route.ts` (creates Stripe subscription Checkout Session; resolves a per-plan `Price` ID configured in Stripe dashboard) | 3 | S (3h) |
| 14 | Update admin to surface support-subscription state alongside one-off invoices | 3 | S (2h) |

**Steps 11–14 ordering.** These four are gated on the first Care plan actually being sold. When that happens, run all four in one sitting — the migration is useless without the webhook handler, the webhook handler is useless without the start-subscription endpoint, and admin can't surface what isn't there. Don't ship step 11 alone weeks ahead and let it sit.

Total: ~40 hours backend work across 90 days, all fitting under Phase 1 + Phase 3 of the opportunity doc roadmap. Reversible because each migration can be rolled back independently and old data paths stay readable through fallbacks.

### Transition strategy for old quotes

Old quotes (created before Phase 3 ships) keep their proposals in `quotes.debug.generatedProposal` and their agreements in `customer_portal_projects.agreement_*` columns. They are not backfilled into the new tables. New code reads from the new tables first and falls back to the legacy fields when no row exists. This way:

- No data loss for old quotes.
- No bulk-migration risk — every existing client engagement stays readable forever.
- Read code is dual-source; write code is single-source (new tables only after Phase 3).
- After ~6 months of no new old-quote reads (track via admin opens), the fallback path can be removed in a small cleanup PR.

---

## Repo Evidence Reviewed

| Area | Repo path(s) | Why it matters for v1.5 |
|---|---|---|
| Existing migrations | `supabase/migrations/` | 7 migrations confirm portal, messaging, activity, nudges, invoices, Stripe idempotency, ops state shipped |
| Quote table | `quotes` (referenced throughout `app/api/submit-estimate/route.ts`, `lib/adminProjectData.ts`) | Phase 1 adds `project_type` column |
| Customer portal tables | `customer_portal_projects`, `customer_portal_milestones`, `customer_portal_assets`, `customer_portal_revisions`, `customer_portal_messages` | Phase 1 adds `project_type` column on `customer_portal_projects`; agreement migration replaces in-table `agreement_*` fields |
| Project invoices | `project_invoices` table; `lib/projectInvoices.ts`; `app/api/internal/admin/invoices/route.ts` (with `send/` subdirectory) | Existing one-off invoice paths stay; `support_subscriptions` is the new recurring path |
| Stripe idempotency | `stripe_processed_sessions` table; `app/api/webhooks/stripe/route.ts`; `lib/depositPayments.ts` | Subscription event handling extends the existing dedupe pattern via `event_id` |
| Activity feed | `project_activity` table; portal client and admin renderers | New event types for proposal/agreement/subscription state transitions |
| PIE engine | `lib/pie/ensurePie.ts` | Reads `pricing.lane`; persistence via `project_type` column closes the queryable spine |
| Admin project data | `lib/adminProjectData.ts` | Composes the unified admin view; v1.5 adds proposal/agreement/subscription joins |
| Pricing config | `lib/pricing/{tiers,config,website,ops,ecommerce}.ts` | Tier bands inform `proposal_versions.price_target` defaults |
| Auth & route protection | `lib/internalAuth.ts`, `lib/routeAuth.ts`, `lib/accessControl.ts`, `proxy.ts` | New admin routes use `requireAdminRoute()`; new public token routes use existing token-binding helpers |

---

## External References Used

- HubSpot CRM data model overview: https://knowledge.hubspot.com/object-settings/use-the-object-library
- Atlassian Jira workflow overview: https://www.atlassian.com/software/jira/guides/workflows/overview
- Stripe Checkout Sessions API: https://docs.stripe.com/payments/checkout-sessions
- Stripe Subscriptions API: https://docs.stripe.com/billing/subscriptions/overview
- Stripe webhook best practices: https://docs.stripe.com/webhooks?locale=en-GB
- Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- PostgreSQL enum types: https://www.postgresql.org/docs/current/datatype-enum.html
