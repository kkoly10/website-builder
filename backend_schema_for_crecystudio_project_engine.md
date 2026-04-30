# Backend Schema for CrecyStudio Project Engine

## Purpose

This document defines the recommended backend schema for turning the current `website-builder` repo into a stronger CrecyStudio project engine. The backend should support not only websites, but also custom web apps, client portals, dashboards, booking/payment systems, automations, e-commerce systems, support plans, and retainers.

The backend should support this full lifecycle:

```txt
contact/company
-> lead
-> intake
-> estimate
-> opportunity
-> proposal
-> agreement
-> invoice/deposit
-> project
-> portal
-> milestones/tasks/revisions/messages
-> launch
-> support/retainer
```

---

## Executive Summary

The current backend direction is already strong. It includes quote submission, leads, pricing truth, deposit links, Stripe webhooks, portal projects, messages, revisions, files/assets, invoices, activity tracking, admin project views, scope snapshots, and change orders.

However, the current schema appears to rely on `quotes`, portal project tables, and some `debug` JSON for data that should eventually become first-class records. A 10/10 backend should separate the system into clear layers:

- CRM layer
- Sales layer
- Delivery layer
- Billing layer
- Portal layer
- File/asset layer
- Support/retainer layer
- Analytics/activity layer

This does not mean rebuilding everything immediately. The best path is gradual migration: preserve the current working quoteId/token/deposit/portal flow while adding cleaner tables around it.

---

## Recommended Backend Layers

| Layer | Main Tables | Purpose |
|---|---|---|
| CRM | `contacts`, `companies`, `leads`, `lead_sources`, `activities` | Who the person/business is and how they entered the pipeline |
| Sales | `intakes`, `estimates`, `opportunities`, `quotes`, `proposals`, `proposal_versions`, `agreements`, `call_requests` | Turn a lead into an approved project |
| Delivery | `projects`, `project_members`, `tasks`, `milestones`, `scope_snapshots`, `change_orders`, `project_activity` | Manage work after the sale |
| Billing | `invoices`, `invoice_line_items`, `payments`, `stripe_checkout_sessions`, `stripe_webhook_events`, `subscriptions`, `retainers` | Track deposits, final payments, retainers, invoices, and webhook reconciliation |
| Portal | `portal_projects`, `portal_access_tokens`, `portal_assets`, `portal_messages`, `portal_revisions`, `portal_activity_feed` | Client-facing project workspace |
| Files | `files`, `file_versions`, `file_links`, `storage_objects` | Private assets, uploads, attachments, agreements, screenshots, brand files |
| Support | `support_plans`, `support_subscriptions`, `support_tickets`, `maintenance_requests`, `monthly_reports` | Recurring revenue after launch |
| Analytics | `analytics_events`, `funnel_events`, `project_metrics` | Conversion, revenue, delivery, and retention reporting |

---

## Core Entity Flow

### CRM Objects

These should represent people and businesses.

```txt
contacts
companies
company_contacts
leads
lead_sources
activities
```

Why this matters: HubSpot-style CRM systems separate contacts, companies, deals/leads/quotes, tickets, activities, and custom objects. That separation makes reporting, automation, and scaling cleaner than stuffing everything into a single quote/project table.

### Sales Objects

These should represent the process of turning a lead into a paid project.

```txt
intakes
estimates
opportunities
quotes
proposals
proposal_versions
agreements
call_requests
```

### Delivery Objects

These should represent the actual work.

```txt
projects
project_members
tasks
milestones
scope_snapshots
change_orders
project_status_events
project_activity
```

### Billing Objects

These should represent payments, invoices, and financial reconciliation.

```txt
invoices
invoice_line_items
payments
stripe_checkout_sessions
stripe_webhook_events
support_subscriptions
```

### Portal Objects

These should represent what the client can see and interact with.

```txt
portal_projects
portal_access_tokens
portal_messages
portal_assets
portal_revisions
portal_activity_feed
```

---

## Project Types

Every project should have a `project_type` so the backend can route different project categories through different workflows.

Recommended project types:

```txt
website
custom_web_app
client_portal
booking_payment_system
business_automation
ecommerce
website_rescue
dashboard_internal_tool
```

This matters because a simple website should not have the same workflow assumptions as a custom app, and an automation project should not use the same portal content as an e-commerce project.

---

## Recommended Base Lifecycle

Use a shared lifecycle, but allow project-type-specific portal sections and workflow details.

```txt
new
qualified
estimate_generated
call_requested
proposal_drafted
proposal_sent
accepted
deposit_sent
deposit_paid
active
preview_ready
revision_requested
launch_ready
live
closed_won
closed_lost
support_active
```

Jira's workflow model is useful here: work moves through statuses and transitions. The key is to keep the workflow simple enough that you actually use it. Too many statuses create confusion.

---

## Core Schema Proposal

### CRM Tables

| Table | Important Columns | Purpose |
|---|---|---|
| `contacts` | `id`, `email`, `phone`, `first_name`, `last_name`, `auth_user_id`, `created_at` | Individual people, including leads and client users |
| `companies` | `id`, `name`, `website`, `industry`, `size`, `created_at` | Business accounts |
| `company_contacts` | `company_id`, `contact_id`, `role`, `is_primary` | Many-to-many link between people and companies |
| `leads` | `id`, `contact_id`, `company_id`, `source`, `status`, `created_at` | Top-of-funnel record |
| `lead_sources` | `id`, `source_name`, `campaign`, `utm_json` | Marketing attribution |
| `activities` | `id`, `contact_id`, `company_id`, `event_type`, `summary`, `created_at` | CRM-level touch history |

### Sales Tables

| Table | Important Columns | Purpose |
|---|---|---|
| `intakes` | `id`, `lead_id`, `project_type`, `status`, `raw_answers`, `normalized_answers`, `created_at` | Universal intake table |
| `estimates` | `id`, `intake_id`, `lane`, `tier`, `low`, `high`, `target`, `complexity_score`, `flags`, `custom_scope_required` | Pricing/scoping output |
| `opportunities` | `id`, `lead_id`, `company_id`, `project_type`, `stage`, `estimated_value`, `probability`, `owner_id` | Sales pipeline object similar to a deal |
| `quotes` | `id`, `opportunity_id`, `estimate_id`, `status`, `public_token`, `expires_at` | Client-visible quote/estimate reference |
| `call_requests` | `id`, `quote_id`, `opportunity_id`, `best_time`, `timezone`, `notes`, `status` | Discovery-call workflow |
| `proposals` | `id`, `opportunity_id`, `project_id`, `current_version_id`, `status`, `sent_at`, `accepted_at` | Proposal container |
| `proposal_versions` | `id`, `proposal_id`, `version_no`, `scope_summary`, `price`, `deposit_amount`, `timeline`, `terms`, `body_json` | Versioned proposal content |
| `agreements` | `id`, `project_id`, `proposal_id`, `version_no`, `status`, `body_text`, `body_hash`, `published_at`, `accepted_at`, `accepted_by_contact_id`, `accepted_ip` | Legal/contract acceptance and audit trail |

### Delivery Tables

| Table | Important Columns | Purpose |
|---|---|---|
| `projects` | `id`, `opportunity_id`, `quote_id`, `company_id`, `project_type`, `status`, `title`, `start_date`, `target_launch_date` | Main delivery object |
| `project_members` | `project_id`, `contact_id`, `role`, `permissions` | Who can access the project/portal |
| `project_status_events` | `id`, `project_id`, `from_status`, `to_status`, `actor_id`, `reason`, `created_at` | Audit trail for status transitions |
| `scope_snapshots` | `id`, `project_id`, `quote_id`, `version_no`, `status`, `snapshot_json`, `price_target`, `timeline_text` | Versioned scope governance |
| `change_orders` | `id`, `project_id`, `base_snapshot_id`, `status`, `title`, `delta_price`, `delta_hours`, `client_message`, `admin_notes` | Formal scope change tracking |
| `tasks` | `id`, `project_id`, `title`, `status`, `assignee_id`, `due_date`, `client_visible` | Internal delivery tasks |
| `milestones` | `id`, `project_id`, `title`, `status`, `due_date`, `client_visible`, `sort_order` | Project journey steps |
| `project_activity` | `id`, `project_id`, `actor_role`, `actor_id`, `event_type`, `summary`, `payload_json`, `client_visible`, `created_at` | Unified timeline for admin and portal |

### Billing Tables

| Table | Important Columns | Purpose |
|---|---|---|
| `invoices` | `id`, `project_id`, `quote_id`, `invoice_type`, `amount`, `status`, `due_date`, `paid_at`, `stripe_session_id` | Invoice lifecycle |
| `invoice_line_items` | `id`, `invoice_id`, `description`, `quantity`, `unit_amount`, `total_amount` | Detailed invoice items |
| `payments` | `id`, `invoice_id`, `project_id`, `provider`, `provider_payment_id`, `amount`, `status`, `paid_at` | Payment records independent of quote debug data |
| `stripe_checkout_sessions` | `id`, `project_id`, `quote_id`, `invoice_id`, `session_id`, `url`, `amount`, `status`, `metadata_json` | Stripe session reconciliation |
| `stripe_webhook_events` | `id`, `event_id`, `event_type`, `processed_at`, `status`, `payload_json` | Webhook idempotency and audit log |
| `support_subscriptions` | `id`, `company_id`, `project_id`, `support_plan_id`, `status`, `stripe_subscription_id` | Ongoing support revenue |

### Portal Tables

| Table | Important Columns | Purpose |
|---|---|---|
| `portal_projects` | `id`, `project_id`, `quote_id`, `access_token`, `status`, `client_status`, `scope_snapshot` | Client workspace root |
| `portal_messages` | `id`, `project_id`, `sender_contact_id`, `sender_role`, `body`, `attachment_file_id`, `read_at`, `created_at` | Portal communications |
| `portal_assets` | `id`, `project_id`, `uploaded_by_contact_id`, `file_id`, `asset_type`, `label`, `status`, `notes` | Client uploads and asset tracking |
| `portal_revisions` | `id`, `project_id`, `request_text`, `priority`, `status`, `created_by_contact_id`, `created_at` | Revision requests |
| `portal_activity_feed` | `id`, `project_id`, `event_type`, `summary`, `client_visible`, `created_at` | Client-visible activity timeline |

### File and Support Tables

| Table | Important Columns | Purpose |
|---|---|---|
| `files` | `id`, `project_id`, `bucket`, `storage_path`, `original_name`, `mime_type`, `size_bytes`, `visibility`, `uploaded_by` | Metadata around Supabase Storage files |
| `file_versions` | `id`, `file_id`, `version_no`, `storage_path`, `uploaded_by`, `created_at` | Versioning for files if needed |
| `support_plans` | `id`, `name`, `monthly_price`, `included_hours`, `features_json` | Available care plans |
| `support_tickets` | `id`, `project_id`, `subscription_id`, `status`, `priority`, `subject`, `description` | Post-launch support |
| `monthly_reports` | `id`, `project_id`, `subscription_id`, `period_start`, `period_end`, `summary_json` | Retainer reporting |

---

## Why Proposals and Agreements Need Real Tables

The current system can store generated proposal and pre-contract/agreement data inside quote debug JSON. That is acceptable for an internal v1, but a stronger backend should move this into real tables.

Reasons:

- Every proposal change can create a version.
- You can track sent, viewed, accepted, declined, and expired states.
- You can audit who accepted an agreement, when, from what IP, and against which version hash.
- Payment links can connect to proposal versions instead of loose debug data.
- Client portal can display the approved scope and agreement cleanly.
- Reporting becomes easier: proposal acceptance rate, average value, time-to-accept, close rate.

---

## Stripe and Billing Model

Stripe Checkout should remain the primary payment path because it reduces custom checkout complexity and supports metadata for internal reconciliation.

Recommended payment types:

| Payment Type | Required Metadata / Internal Link | Backend Effect |
|---|---|---|
| Deposit payment | `proposal_id`, `quote_id`, `project_id`, `invoice_id` | Marks deposit paid, activates project, updates portal |
| Milestone invoice | `project_id`, `invoice_id`, `milestone_id` | Used for mid-project payments |
| Final invoice | `project_id`, `invoice_id` | Used before launch/handoff or final delivery |
| Retainer/subscription | `support_subscription_id`, `company_id` | Used for ongoing care/support plans |
| Webhook event | `event_id`, `event_type`, `object_id` | Stored in `stripe_webhook_events` for idempotency and audit |

Stripe webhook rules:

- Verify signature.
- Only listen to required event types.
- Store processed event IDs.
- Do not process the same event twice.
- Update local payment, invoice, project, and portal records from the webhook.
- Keep Stripe metadata tied to internal IDs.

---

## RLS and Security Model

Supabase RLS should be enabled for any public-schema table that can be accessed through the client. Service-role access should stay server-only. Client portal access should be token-based plus optional authenticated owner access for sensitive actions such as agreement acceptance and deposit notices.

| Area | Policy Direction | Implementation Note |
|---|---|---|
| `contacts` / `profiles` | User can view/update own profile; admins can view all | RLS by `auth.uid()` and admin role helper |
| `projects` | Client can view projects where they are a project member; admins can view all | Use `project_members` bridge |
| `portal_messages` | Client can read/write messages for their project; internal notes are admin-only | Filter by `sender_role` and `client_visible` |
| Files / storage | Private buckets by default. Signed URLs for temporary access | Use storage metadata rows and RLS policies |
| `invoices` / `payments` | Client can view own invoices; only server/admin can create or mark paid | Payment confirmation from webhook/server only |
| Admin routes | Server-only admin check before service role use | Keep `requireAdminRoute` pattern |

---

## Project-Type-Specific Portal Behavior

The client portal should not look exactly the same for every project type.

| Project Type | Portal Should Emphasize |
|---|---|
| Website | Pages, content/assets, preview URL, revisions, launch checklist |
| Custom web app | Features, sprints, environments, QA, roles, deployments |
| Client portal | User roles, dashboard sections, portal features, access rules |
| Booking/payment system | Booking rules, payment links, confirmation flow, test transactions |
| Business automation | Workflows, triggers, tools, tests, SOPs, handoff notes |
| E-commerce | Products, checkout, payment setup, fulfillment, launch readiness |
| Website rescue | Audit findings, fixes, before/after notes, relaunch checklist |
| Dashboard/internal tool | Data sources, admin screens, permissions, reporting views |

---

## API Route Model

| Area | Route Pattern | Responsibility |
|---|---|---|
| Public intake | `POST /api/intakes` or current `POST /api/submit-estimate` | Create lead, intake, estimate, quote/opportunity |
| Call request | `POST /api/request-call` | Create call request and update stage |
| Proposal | `POST /api/internal/proposals`, `POST /api/proposals/[token]/accept` | Generate, send, accept, and version proposals |
| Deposit | `POST /api/internal/create-deposit-link`, `POST /api/estimate/accept` | Create Stripe Checkout Session and local session |
| Webhook | `POST /api/webhooks/stripe` | Verify signature, guard duplicates, update payment/invoice/project/portal |
| Portal | `GET/POST /api/portal/[token]` | Load and update client workspace |
| Admin | `GET /api/internal/admin/projects`, `POST /api/internal/admin/project-update` | Command center operations |
| Files | `POST /api/portal/assets`, `POST /api/portal/[token]/messages` | Upload files to private buckets and store metadata |

---

## Migration Plan From Current Backend

| Step | Migration Action |
|---|---|
| Step 1 | Add `project_type` to quotes, intakes, projects/portal projects where possible |
| Step 2 | Create `proposals` and `proposal_versions` while still reading existing `debug.generatedProposal` as fallback |
| Step 3 | Create `agreements` table and migrate `publishedAgreementText` / `agreementAcceptance` out of quote debug |
| Step 4 | Create `stripe_checkout_sessions` and `stripe_webhook_events` tables; keep current processed-session behavior until migrated |
| Step 5 | Create unified `project_activity` event writes for all key actions |
| Step 6 | Add `support_plans`, `support_subscriptions`, and `support_tickets` for post-launch revenue |
| Step 7 | Add custom app intake fields and estimator/scoping workflow |

---

## Example SQL Skeleton

```sql
create type project_type as enum (
  'website',
  'custom_web_app',
  'client_portal',
  'booking_payment_system',
  'business_automation',
  'ecommerce',
  'website_rescue',
  'dashboard_internal_tool'
);

create table public.intakes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  project_type project_type not null,
  status text not null default 'submitted',
  raw_answers jsonb not null default '{}'::jsonb,
  normalized_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
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
```

---

## Implementation Priority

| Priority | Backend Action |
|---|---|
| P0 | Do not break the current quoteId/token/deposit/portal flow. Preserve working behavior |
| P1 | Add `project_type` and better status lifecycle across new records |
| P2 | Add real proposal/agreement tables with fallback to current debug JSON |
| P3 | Add local Stripe session/event tables and standardize webhook reconciliation |
| P4 | Add custom web app intake/estimator and project-type portal templates |
| P5 | Add support/retainer backend for recurring revenue |

---

## Repo Evidence Reviewed

| Area | Repo Path(s) | Why It Matters |
|---|---|---|
| Public homepage | `app/[locale]/page.tsx` | Existing homepage structure with hero, proof, portal preview/differentiator, process, pricing tiers, closing CTA, and secondary systems/e-commerce lanes |
| Reusable service pages | `app/[locale]/websites/page.tsx`, `app/[locale]/systems/page.tsx`, `app/[locale]/ecommerce/page.tsx` | Service pages already use a shared ServicePage component and getServicePageData content model |
| Service page data | `lib/service-pages.ts` | Detailed website, workflow automation, and e-commerce copy/data already exists |
| Full build intake | `app/[locale]/build/BuildClient.tsx` | Multi-step intake collects website type, goals, pages, booking, payments, automations, integrations, content readiness, budget, timeline, email, and phone |
| Quote submit route | `app/api/submit-estimate/route.ts` | Creates/updates leads and quotes, stores raw/normalized intake, pricing truth, totals, quote token, and analytics event |
| Pricing engine | `lib/pricing/config.ts`, `lib/pricing/website.ts` | Existing tiers and complexity scoring for websites plus ops/e-commerce tier structures |
| Call request flow | `app/[locale]/book/BookClient.tsx`, `app/api/request-call/route.ts` | Quote-aware discovery call request flow updates status and can send alerts |
| Deposit/payment flow | `app/api/estimate/accept/route.ts`, `app/api/internal/create-deposit-link/route.ts`, `lib/depositPayments.ts`, `app/api/webhooks/stripe/route.ts` | Creates Stripe deposit links, stores deposit state, updates quote/portal status, and confirms payments |
| Client portal | `app/portal/[token]/PortalClient.tsx`, `app/api/portal/[token]/route.ts` | Client workspace with deposit banner, milestones, invoices, assets, revisions, messages, preview, launch readiness, and agreements |
| Internal admin pipeline | `app/internal/admin/page.tsx`, `AdminPipelineClient.tsx` | Master-detail admin pipeline with urgency queue, value, next-action logic, status/readiness badges, message polling, and embedded controls |
| Admin project model | `lib/adminProjectData.ts` | Combines quote, portal, lead, estimates, PIE, call requests, pricing, scope snapshot, deposit, assets, revisions, invoices, activity, messages, proposals, and agreements |
| Scope/change-order tools | `app/internal/project/[quoteId]/ProjectWorkspaceClient.tsx`, `app/api/internal/admin/change-order/route.ts` | Scope snapshots and change orders support scope governance |

---

## External References Used

- HubSpot CRM data model overview: https://knowledge.hubspot.com/object-settings/use-the-object-library
- Atlassian Jira workflow overview: https://www.atlassian.com/software/jira/guides/workflows/overview
- Atlassian Jira workflow best practices: https://support.atlassian.com/jira-software-cloud/docs/best-practices-for-workflows-in-jira/
- Stripe Checkout Sessions API: https://docs.stripe.com/payments/checkout-sessions
- Stripe webhook best practices: https://docs.stripe.com/webhooks?locale=en-GB
- Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
