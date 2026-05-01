# Opportunities to Build on Current Repo to Better Expose CrecyStudio's Potential

## Purpose

This is the strategy document for using the current `website-builder` repo as CrecyStudio's internal service-delivery engine. The mission is specific: serve both small tickets ($1.8K websites) and big tickets ($50K custom web apps) inside one premium, professional experience — same workspace, same process quality, same proof.

This document replaces the earlier draft that proposed eight overlapping project types and a HubSpot-shaped backend. The earlier framing was right about the *direction* (CrecyStudio is more than a website builder) and wrong about the *shape* (one operator does not need a CRM-style schema or eight separate marketing surfaces). This rewrite aligns the strategy to one operator running a premium boutique that takes clients from a $2K starter site to a custom-app build without changing studios.

---

## Executive Summary

CrecyStudio's strongest opportunity is to be the premium boutique that handles both ends of the small-business digital ladder. A client may enter at a Starter website and stay through a custom dashboard build two years later, all in the same workspace with the same operator. Most freelancers can't deliver the big-ticket end. Most agencies don't take the small-ticket end seriously. CrecyStudio can credibly do both because the engine already exists.

The framing evolves from:

> "I build websites."

To:

> "Premium websites and custom web systems for businesses that need to look bigger than they are — same workspace from the first page to the full app."

The work to expose this is mostly *positioning and routing*, not new capability. The portal exists. The admin pipeline exists. The PIE engine exists. The deposit flow exists. What's missing is a homepage that names systems out loud, three new service surfaces, one demo, a care-plan page, and a v1.5 backend cleanup that moves proposals and agreements out of debug JSON. About 6–8 weeks of focused work for a solo operator.

---

## What's Already Shipped (Reconciliation With Prior Roadmap)

The earlier `crecystudio-roadmap.md` was written when the strategy was still "10/10 boutique website lane." Several items from that roadmap are already in production. This rewrite does not propose redoing them.

| Prior roadmap item | Status | Repo evidence |
|---|---|---|
| Portal data-layer migration to `customer_portal_*` tables | Shipped | `supabase/migrations/20260420_create_customer_portal_tables.sql` |
| Two-way messaging in the portal | Shipped | `supabase/migrations/20260421_add_customer_portal_messages.sql` |
| Final / milestone / retainer invoicing | Shipped (one-off invoices) | `supabase/migrations/20260422_create_project_invoices.sql` supports `deposit` / `milestone` / `final` / `retainer` invoice types. Recurring-subscription lifecycle (auto-renew, dunning) is not yet wired — `support_subscriptions` is in scope for the v1.5 backend rewrite |
| Unified activity feed | Shipped | `supabase/migrations/20260422_add_project_activity_and_nudges.sql` |
| Stripe processed-session idempotency | Shipped | `supabase/migrations/20260428_create_stripe_processed_sessions.sql` |
| Tier-based pricing config | Shipped | `lib/pricing/tiers.ts` (Starter/Growth/Premium bands live) |
| Paper/ink marketing reskin | In progress | Live homepage uses paper/ink language |

The PIE refactor spec (`crecystudio-pie-refactor-spec.md`) defines a fast/warm/deep routing model that already covers the "complex builds need a strategy call" requirement. This rewrite reuses PIE's deep path for big-ticket routing instead of inventing a parallel system.

The launch-readiness audit (`docs/launch-readiness-business-analysis-2026-03-30.md`) flagged "no case studies / no social proof" as the P0 risk for paid traffic. This rewrite addresses that with the Proof of Capability section below.

---

## Voice and Positioning

CrecyStudio's voice should stay warm and benefit-driven on first contact, then escalate to systems-fluent for buyers who scroll or click through. The hero is the small-ticket buyer's entry. The lane pages are where big-ticket buyers self-identify.

### Audience

Primary audience: small service businesses in Northern Virginia and the broader DMV (the live site already names this geography), expanding to remote service-business buyers as case studies and SEO surface accumulate. Buyer types are described by ticket size and lane mapping:

- **Small ticket ($1.8K–$10K):** Buyer is shopping for a website. Maps to the Websites lane (Starter through Premium tiers). Typical buyers: contractors, trainers, consultants, repair shops, event vendors, wedding vendors. This is the bread-and-butter today.
- **Mid ticket ($10K–$25K):** Buyer wants a website plus a meaningful add-on — a portal, a booking/payment flow, a customer-account area, or an intake/quote system — or a small custom build. Spans the top of the Websites lane (Premium) and the Discovery+MVP tier of the Web Apps lane. Often the same Small-ticket buyer two engagements later.
- **Big ticket ($25K+):** Buyer wants a custom web app — multi-role, integrations, custom data models, sometimes multi-tenant. Maps to the Standard or Custom tiers of the Web Apps lane. Often introduced by referral or arrives after entering through a smaller engagement first.

Korent and Proveo are the studio's *own ventures* at Big-ticket scope and serve as capability proof in the Proof of Capability section — not as buyer testimonials.

This doc explicitly does not target enterprise buyers or VC-backed startups. Pricing, voice, and process are tuned for owner-operators who write the check themselves.

### The hero (homepage)

Replace the current line — *"Websites that make your phone ring."* — with a line that opens up the lid without losing warmth:

> **Websites and custom web systems for businesses that need to look bigger than they are.**

Sub: *"From a polished marketing site to a full client portal, booking flow, or custom dashboard — built in one workspace, owned by you."*

Primary CTA: **Start a project →** (links to `/build/intro`)
Secondary CTA: **See what we build →** (links to a "What We Build" cards section below the fold)

### The "What We Build" cards (homepage, below the proof strip)

Six cards, each with a one-line benefit, deep-linking to the right service page or intake. This is where big-ticket buyers self-identify without scaring small-ticket buyers off.

1. **Websites** — *Get found, get trusted, get the call.* → `/websites`
2. **Custom web apps** — *Dashboards, portals, internal tools, MVPs.* → `/custom-web-apps`
3. **Client portals** — *A private workspace your customers actually use.* → `/client-portals`
4. **Booking & payments** — *Take deposits and bookings without duct tape.* → `/websites#booking-mode`
5. **Workflow automation** — *Stop doing the same task twice.* → `/systems`
6. **Website rescue** — *Fix what you have without a full rebuild.* → `/website-rescue`

E-commerce stays in the footer cross-link section — it's a real lane but not a primary self-identification path for the buyers we're after.

### Voice rules

- Never make custom apps look like a fixed-price commodity.
- Never apologize for premium pricing in admin or client-facing copy.
- Use "can include" rather than "includes only" for big-ticket lanes.
- Keep the small-ticket starter price visible somewhere on the homepage so price-sensitive buyers don't bounce assuming they can't afford anything.
- Use "Start your project" as the universal CTA. Reserve "Plan a custom app" for the `/custom-web-apps` page.

---

## The Five Sales Lanes

Five lanes is the smallest set that captures the actual buyer mindset distinctions. The earlier draft's eight project types had structural overlap (a `dashboard_internal_tool` is a `custom_web_app`; a `client_portal` is a feature of a `custom_web_app`). The cleaner model separates two axes:

- **Sales lane** — what the buyer is shopping for. Drives marketing pages, intake routing, and pricing display.
- **Delivery archetype** — what the project actually is under the hood. Drives portal templates, milestone defaults, and admin workflow. Internal-only.

### Sales lanes (public)

| Lane | Buyer says | Typical ticket | Entry route | Delivery archetype |
|---|---|---|---|---|
| **Websites** | "I need a website that converts" | $1.8K – $10K | `/websites` → `/build/intro` | `marketing_site`, `booking_site` |
| **Web Apps** | "I need a custom app or dashboard" | $8K – $50K+ | `/custom-web-apps` → `/custom-app-intake` | `portal`, `dashboard`, `saas_mvp` |
| **Automation** | "I'm drowning in repetitive admin work" | $1K – $4K + retainer | `/systems` → `/ops-intake` | `automation` |
| **E-commerce** | "I need to sell things online" | $1.8K – $4K + retainer | `/ecommerce` → `/ecommerce/intake` | `storefront` |
| **Rescue** | "My current site isn't working" | $1.2K – $3K | `/website-rescue` → `/build?projectType=rescue` | `rescue_sprint` |

### `ProjectType` taxonomy (frontend + backend contract)

```ts
type ProjectType =
  | 'website'              // sales lane: Websites
  | 'web_app'              // sales lane: Web Apps
  | 'automation'           // sales lane: Automation
  | 'ecommerce'            // sales lane: E-commerce
  | 'rescue';              // sales lane: Rescue

type DeliveryArchetype =
  | 'marketing_site'
  | 'booking_site'
  | 'portal'
  | 'dashboard'
  | 'saas_mvp'
  | 'automation'
  | 'storefront'
  | 'rescue_sprint';
```

The buyer chooses a `ProjectType`. The operator (or PIE) picks the `DeliveryArchetype` during scoping. This keeps marketing simple and delivery flexible.

---

## Service Package Architecture

One scrollable `/pricing` page, anchor-navigated by lane. Each lane shows its tiers with the same visual treatment. Small-ticket buyers see Starter prices; big-ticket buyers see Premium and discovery paths in the same place.

### Pricing notes (operator to confirm before any of this surfaces publicly)

The numbers below are a mix of existing operator pricing and proposals from this rewrite. Confirm or override each one before publishing.

- **Websites tiers** — $1,800 / $3,500 / $6,500+. Already live on `/pricing` and `/websites`. Carry as-is unless the operator wants to revise.
- **Automation tiers** — $1,000–$1,800 / $2,000–$3,800 / $500–$1,250/mo. Already live on `/systems`. Carry as-is.
- **E-commerce tiers** — $1,800–$4,000+ / $500–$1,800/mo / $1,200. Already live on `/ecommerce`. Carry as-is.
- **Web Apps ranges** — $8K–$18K / $18K–$35K / $35K+. *Proposed by this rewrite, not derived from operator history.* Anchored to the scope of Korent and Proveo as NoVa boutique-tier estimates. Confirm with operator before publishing.
- **Rescue sprint** — $1,200–$2,800. *Proposed by this rewrite.* Anchored to a 1–2 week sprint scope. Confirm.
- **Care plans** — $250 / $650 / $1,250 per month. *Proposed by this rewrite.* No public-facing care pricing exists today. Confirm before `/care-plans` is built.

### Websites lane

| Tier | Range | Best for | Includes |
|---|---:|---|---|
| Starter | $1,800 – $2,400 | Single-page or 1–3 page professional site | Mobile-first design, contact form, SEO basics, launch support, portal-backed delivery |
| Growth | $3,500 – $4,500 | Multi-page service business site | All of Starter + booking links, payment integrations, stronger conversion flow, content help |
| Premium | $6,500 – $10,000+ | 7+ pages with integrations or accounts | All of Growth + advanced integrations, custom flows, structured scope governance |

### Web Apps lane

| Tier | Range | Best for |
|---|---:|---|
| Discovery + MVP | $8,000 – $18,000 | Validated idea, single-user-role app, 2–3 core features |
| Standard build | $18,000 – $35,000 | Multi-role app, integrations, dashboard + customer-facing surface |
| Custom scope | $35,000+ | Multi-tenant SaaS, custom data models, advanced integrations |

Web Apps does not show fixed prices on cards — only ranges. Every Web Apps lead routes through `/custom-app-intake` to a free strategy call. PIE's deep-path routing handles the "this needs a real conversation" gate.

### Automation lane

| Tier | Range | Best for |
|---|---:|---|
| Quick fix | $1,000 – $1,800 | Single workflow automation |
| Ops system | $2,000 – $3,800 | 2–4 connected workflows + documentation |
| Systems partner | $500 – $1,250/mo | Ongoing automation maintenance and improvements |

### E-commerce lane

| Tier | Range | Best for |
|---|---:|---|
| Build | $1,800 – $4,000+ | New store setup |
| Run | $500 – $1,800/mo | Ongoing operations support |
| Fix | $1,200 | Audit + optimization sprint |

### Rescue lane

| Offer | Range | Best for |
|---|---:|---|
| Rescue sprint | $1,200 – $2,800 | Mobile cleanup, conversion fixes, form/CTA repair, speed/trust improvements |

### Care plans (recurring)

| Plan | Monthly | Best for |
|---|---:|---|
| Care | $250/mo | Content updates, monitoring, monthly health check |
| Care+ | $650/mo | Care + small features, analytics review |
| Care Pro | $1,250/mo | Care+ + monthly improvement sprint, priority response |

Care plans get a dedicated `/care-plans` page and a section anchor on `/pricing`. Recurring revenue is the single biggest stabilizer for a solo operator's income; without a public surface it gets sold only as a post-launch upsell, which leaves money on the table.

**Care vs. Automation Systems Partner — relationship note.** The Automation lane's Systems Partner retainer ($500–$1,250/mo) covers ongoing maintenance for clients whose primary engagement was an Automation build. Care plans cover post-launch site/system care for any project type. Pricing overlaps at the top of both ranges; a Care Pro client and a Systems Partner client may pay similarly but receive different scope (site-care monthly tasks vs. automation-monitoring + tweaks). These two products may merge into a single "Care" line in v2 once buyer volume reveals which framing converts better. For v1, keep them separate but cross-link from each lane's page.

---

## Proof of Capability

Big-ticket buyers will not commit five figures without proof. The studio has two real ventures that prove Web-Apps-lane capability. They are *not* client testimonials — they are the operator's own products — and the `/work` page must say so explicitly. Mixing them with anonymized client cases without the framing would mislead.

### Korent — `korent.app` (`github.com/kkoly10/rental-software`)

A web-first operating system for inflatable rental businesses, expanding into broader party-rental workflows.

What it proves about studio capability:

- **Multi-tenant SaaS architecture** — 19 PostgreSQL tables with Row-Level Security enforcing tenant isolation
- **Three-surface UX** — public storefront, operator dashboard (13+ management sections), crew mobile workspace
- **Production payments** — Stripe Checkout integration with deposit/balance tracking and auto-confirmation
- **Document generation** — rental agreements and waivers
- **Logistics** — delivery route planning kanban with mobile crew access
- **Service area + scheduling** — ZIP-based service area config; conflict detection prevents double-booking
- **Onboarding** — guided setup checklist
- **AI feature** — operator copilot (OpenAI/Anthropic) shipped as a real product feature, not a demo
- **Help Center** — 18 searchable articles
- **Tech stack** — Next.js (App Router, Server Components, Server Actions), TypeScript strict, Supabase, Vercel

Maps to: Web Apps lane Standard and Custom tiers. A buyer asking "have you actually built a multi-tenant SaaS with payments and routing?" gets a yes pointing here.

### Proveo — `proveohq.com` (`github.com/kkoly10/proveo`)

A SaaS for service contractors (auto detailers, painters, cleaners) that combines visual proof with business operations.

What it proves about studio capability:

- **AI as a product feature** — photo detection identifying before/after pairs, with 12 branded templates
- **Freemium SaaS billing** — four tiers (Free / $12 / $25 / $79) with paywalled features
- **CRM pipeline** — client management with stage tracking
- **Scheduling + automation** — appointment booking, automated lifecycle and review-request emails
- **Public + private split** — marketing site, web app, and public-facing portfolio pages all in one codebase
- **Sustained product development** — 1,000+ commits, design system documented, settings/auth surfaces live
- **Tech stack** — Next.js, TypeScript, Tailwind, PostgreSQL

Maps to: Web Apps lane Discovery+MVP and Standard tiers. A buyer asking "can you ship an AI-augmented SaaS with billing tiers?" gets a yes pointing here.

### `/work` page structure

```
/work
├── Studio ventures (capability proof — operator's own products)
│   ├── Korent — multi-tenant rental SaaS
│   └── Proveo — AI-augmented service contractor SaaS
└── Client work (named or anonymized client cases — fills in over time)
    ├── [Case 1: anonymized regional service business — 3× inbound leads in 60 days]
    ├── [Case 2: empty until first willing client]
    └── [Case 3: empty until first willing client]
```

Day-one minimum: two studio ventures + at least one anonymized client case. Replace anonymized cases with named versions as clients agree.

---

## Public Surface Plan

Concrete page-by-page changes mapped to the five lanes. Every change is sized in the 90-Day Roadmap.

### Pages to add

| Route | Purpose | Lane |
|---|---|---|
| `/custom-web-apps` | Sell the Web Apps lane: dashboards, portals, internal tools, MVPs. CTA routes to `/custom-app-intake`. | Web Apps |
| `/client-portals` | Sell the portal as a standalone add-on and as a premium-package feature. CTA routes to `/demos/portal` and intake. | Web Apps |
| `/website-rescue` | Sell rescue sprint: mobile cleanup, conversion fixes, form/CTA repair. CTA routes to `/build?projectType=rescue`. | Rescue |
| `/work` | Studio ventures + client cases. Trust artifact for paid traffic. | All |
| `/care-plans` | Three monthly tiers (Care / Care+ / Care Pro). | All (post-launch) |
| `/demos/portal` | One seeded demo of the client portal experience. | Web Apps + all (proof) |
| `/custom-app-intake` | Question set tuned for big-ticket scoping. Routes to free strategy call. | Web Apps |

### Pages to edit

| Route | Change |
|---|---|
| `/` (homepage) | Replace hero copy. Add "What We Build" cards section below proof strip. Keep portal preview. Keep process. Add `/work` cross-link. |
| `/build/intro` | Promote from website-goal quiz to project-type router. First step asks "what are you building?" then branches. |
| `/pricing` | Rebuild as one scrollable page with anchor nav (Websites / Web Apps / Automation / E-commerce / Rescue / Care). Each lane shows its tiers. |
| `/websites` | Add a "Modes" section showing how the same Websites lane handles a basic marketing site, a booking/payment site, or a content-heavy site. Cross-link `/care-plans` in footer. |
| `/systems` | Cross-link `/care-plans`. Note relationship between Systems Partner retainer and Care Pro. |
| `/ecommerce` | Cross-link `/care-plans`. Otherwise no change for v1. |

### Pages to leave alone

`/process`, `/faq`, `/contact`, `/privacy`, `/terms`, the entire `/portal/*` flow, the entire `/internal/*` admin, `/estimate`, `/book`, `/deposit/*`. None of those need changes for the repositioning.

---

## Demo Strategy

One demo for v1: **`/demos/portal`**. Adding more before the first one earns its keep is overbuilding for a solo operator.

### Implementation approach

- **Seeded read-only token.** Create a `customer_portal_projects` row with `access_token = "demo"` (or a fixed UUID) and seed it with realistic mock data: an "Acme Plumbing" Growth-tier website project, three milestones in progress, two assets uploaded, one revision request, two messages, an activity feed with the last 10 events, a deposit-paid banner. Reuse the existing `app/portal/[token]` codepath unchanged.
- **Watermark.** Render a persistent "Demo" badge near the project title and a banner across the top of the portal: *"This is a read-only demo. Your real project workspace will look like this with your own data."*
- **Read-only enforcement.** API routes for asset upload, message send, revision submission check for the demo token and return a friendly "this is a demo — start a project to use these features" response with a CTA link to `/build/intro`.
- **No demo session reset cron yet.** Seed once. If clients leave detritus by trying actions, the read-only enforcement should prevent it. Revisit if seed pollution becomes a problem.

### When to add more demos

Only after the first one earns its keep. Track `demo_portal_view` analytics events and the conversion rate from demo view → intake submit. If the rate is meaningful (>5%), build `/demos/quote-system` next. Otherwise the second demo is wasted effort.

---

## 90-Day Roadmap

Sized for a solo operator at ~15–25 hours/week on this work alongside client delivery. Three phases, each ~30 days. Effort is S (1–4h), M (4–10h), L (10h+).

### Phase 1 — Days 1–30: Reposition and structural

| Task | Effort | Definition of done |
|---|---|---|
| Rewrite homepage hero copy in `messages/en.json` | S | New hero string live; CTAs unchanged; en/fr/es fall back to en for new copy |
| Add "What We Build" cards section to `app/[locale]/page.tsx` | S | Six cards rendering, each linking to correct service page or intake with `?projectType=...` |
| Promote `/build/intro` to project-type router | M | First step asks "what are you building?" with five options; routes branch to correct intake; `projectType` carried through URL |
| Add `project_type` column to `quotes` and `customer_portal_projects` | S | Migration shipped; `submit-estimate` writes value; existing rows backfill to `'website'` |
| Build `/work` page with Korent + Proveo + 1 anonymized case | M | Page renders three case cards with honest "studio venture" vs. "client work" sectioning |
| Rebuild `/pricing` as anchor-navigated single page | M | Six anchor sections (Websites / Web Apps / Automation / E-commerce / Rescue / Care); existing tier copy carries over |

Phase 1 outcome: homepage tells the new story, intake routing is project-type aware, pricing page exposes all lanes, `/work` exists.

### Phase 2 — Days 31–60: New service pages and demo

| Task | Effort | Definition of done |
|---|---|---|
| `/custom-web-apps` service page | M | Hero, problems, includes, pricing (range only), bestFit/notFit, FAQ; CTA routes to `/custom-app-intake`; cross-link to `/work` |
| `/client-portals` service page | M | Hero, problems, includes, pricing, FAQ; CTA routes to `/demos/portal` and `/build/intro` |
| `/website-rescue` service page | S | Hero, problems, sprint scope, fixed price, CTA routes to `/build?projectType=rescue` |
| `/custom-app-intake` page and API route | M | 8–10 question intake; `submit-estimate` accepts `projectType=web_app`; routes to free strategy call request |
| `/demos/portal` seeded experience | M | Seed migration; read-only enforcement on portal write APIs; "Demo" watermark + banner |
| `/care-plans` page | S | Three tier cards, cross-link from `/pricing#care`, footer link from every lane page |

Phase 2 outcome: every lane has a public surface, the portal demo is live, care plans are sellable.

### Phase 3 — Days 61–90: Backend cleanup, sales motion, PIE surface completion

| Task | Effort | Definition of done |
|---|---|---|
| `proposals` + `proposal_versions` tables | M | Migration; admin UI to create/version a proposal; existing `debug.generatedProposal` becomes a fallback read |
| `agreements` table with audit trail | S | Migration; portal agreement-accept route writes a row with hash + IP + accepted_at |
| `support_subscriptions` table (when first Care plan sold) | S | Migration; admin UI to start a subscription; Stripe subscription webhook handler |
| PIE Phase 6 — admin tier-band visualization + override controls | S | Admin shows recommended tier band visually; override buttons next to PIE recommendation |
| PIE Phase 7 — three client-facing post-quote variants on `/estimate` | M | Page reads `routing.finalPath`, renders fast (firm price + accept) / warm (firm price + recommended call) / deep (range + required call) |
| Outreach: launch announcement, post in 2–3 communities, optional paid traffic test | M | Public launch post drafted and shipped; first 10 visits to `/custom-web-apps` measured |

Phase 3 outcome: backend matches the new positioning, big-ticket sales motion is real, PIE surface is complete, public launch is live.

### Total estimated effort

~85–110 hours across 90 days. Comfortable for a solo operator at 12–18 hrs/week on this work. Scale up if client-delivery load is light, scale down if a real client lands. The order is what matters; each task is reorderable within its phase.

---

## Risks and Protections

| Risk | Protection |
|---|---|
| Big-ticket and small-ticket buyers see incompatible voice on the same homepage | Hero opens warm; "What We Build" cards expose breadth; Web Apps lane uses range-only pricing and routes to a strategy call rather than instant quote |
| Web Apps lane sells projects the operator can't actually deliver as a solo | Use Korent and Proveo as scope ceilings; route anything beyond their complexity into a paid discovery before commit; don't take >2 active Web-Apps engagements at once |
| Care plans without a written scope/SLA — first request becomes ambiguous | Before `/care-plans` ships, write a one-page operating doc covering: included scope, time-bank or task-count, response SLA, what triggers an upcharge. Live in `docs/care-plans-operating.md`, referenced from admin not from the public page |
| Underpriced Web Apps tiers because operator hasn't validated the bands | Phase 1 keeps `/pricing` Web Apps section as ranges only with "Discovery required" copy; first 3 Web-Apps engagements act as the validation; revise bands once data is real |
| Operational complexity of running 5 lanes without lane confusion in admin | Use `project_type` column to filter the admin pipeline by lane; keep one shared portal template family with archetype overrides; resist building lane-specific admin UIs until volume justifies |

---

## Success Metrics

Tied to the existing `analytics_events` writes (`lib/analytics/server.ts` and `lib/analytics/client.ts`). Baseline these for 30 days before Phase 1 ships, then measure lift after each phase.

| Metric | Source | Target after Phase 2 |
|---|---|---|
| `cta_home_hero_quote` click-through rate | `analytics_events` | +25% over baseline |
| Project-type distribution at `/build/intro` | New event `intake_router_selected` (Phase 1 deliverable) | Web Apps + Rescue together >15% of intake starts |
| `/custom-web-apps` view → `/custom-app-intake` start rate | `analytics_events` page views and intake starts | Above 8% (cold-traffic floor) |
| `/demos/portal` view → `/build/intro` rate | New event `demo_portal_to_intake` | Above 5% |
| Average project value across closed deals | Admin pipeline | Mix shifts from website-only to include 1+ Web-Apps deal per quarter |
| Care plan attach rate at launch | `support_subscriptions` (when shipped) | Above 25% of new client launches in Phase 3 |
| `/work` view depth | `analytics_events` scroll/time-on-page | Median time >40s for traffic that lands on /work |

---

## Repo Evidence Reviewed

| Area | Repo Path(s) | Why It Matters |
|---|---|---|
| Public homepage | `app/[locale]/page.tsx` | Hero copy, proof strip, portal preview, process, tiers, closing CTA, secondary lanes — the entry surface for the repositioning |
| Service pages and data | `app/[locale]/{websites,systems,ecommerce}/page.tsx`, `lib/service-pages.ts`, `components/service-page/ServicePage.tsx` | Existing service-page pattern is the template for the three new lane pages |
| Project-routing quiz | `app/[locale]/build/intro/BuildIntroClient.tsx` | Currently a website-goal quiz; Phase 1 promotes to project-type router |
| Full build intake | `app/[locale]/build/BuildClient.tsx` | Multi-step intake; Phase 2 reuses it for `website` and `rescue` project types |
| Quote submit route | `app/api/submit-estimate/route.ts` | Phase 1 adds `projectType` field; existing leads/quotes flow preserved |
| Pricing engine | `lib/pricing/{config,tiers,website,ops,ecommerce}.ts`, `lib/pie/ensurePie.ts` | TIER_CONFIG bands live; PIE v3 with routing already shipped — Phase 3 adds the client-facing surface |
| Call request flow | `app/[locale]/book/BookClient.tsx`, `app/api/request-call/route.ts` | Reused as-is for Web Apps strategy call |
| Deposit / Stripe flow | `app/api/estimate/accept/route.ts`, `app/api/internal/create-deposit-link/route.ts`, `lib/depositPayments.ts`, `app/api/webhooks/stripe/route.ts` | Idempotency in place via `stripe_processed_sessions`; Phase 3 adds invoice/subscription paths on the same pattern |
| Client portal | `app/portal/[token]/{PortalClient.tsx,page.tsx,route.ts}` | Hosts the demo seed in Phase 2; messages/invoices/activity types already present |
| Internal admin pipeline | `app/internal/admin/{page.tsx,AdminPipelineClient.tsx,[id]/ProjectControlClient.tsx}` | Used to manage project_type filter (Phase 1) and tier-band override controls (Phase 3) |
| Internal dashboard | `app/internal/dashboard/page.tsx` | Already shipped per `crecystudio-roadmap.md` supersession header — KPIs and capacity meter live |
| Admin project model | `lib/adminProjectData.ts` | Composes quote + portal + lead + estimates + PIE + call requests + deposit + assets + revisions + invoices + activity + messages + proposals + agreements |
| Migrations | `supabase/migrations/` | Seven migrations cover portal, messaging, activity, nudges, invoices, Stripe idempotency. v1.5 backend doc adds proposals/agreements/support_subscriptions |

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
