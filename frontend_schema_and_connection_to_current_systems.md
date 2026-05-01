# Front End Schema and Connection to Current Systems

## Purpose

This is the page-level, route-level, and component-level companion to `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md`. The strategy doc says *what* and *why*; this doc says *how*: which routes to add, which to edit, what data each surface sends, how it connects to the existing backend without breaking working flows, and what the new pages should actually contain.

This rewrite replaces the earlier draft. The earlier draft proposed eight project types, eight service pages, four demo routes, and a HubSpot-style data contract. The current direction — set by the strategy doc — is five sales lanes, three new service pages, one demo, and a v1.5 backend cleanup. The earlier draft also missed that the PIE engine's fast/warm/deep routing already exists and reinvented routing logic on top of it.

---

## Executive Summary

The repo already has a strong frontend foundation: homepage, three service pages (`/websites`, `/systems`, `/ecommerce`), build-intro quiz, full build intake, estimate page, booking page, deposit pages, client portal, internal admin pipeline, ops admin, e-commerce admin, internal dashboard. The repositioning needs:

- **3 new service pages** — `/custom-web-apps`, `/client-portals`, `/website-rescue`
- **3 new utility pages** — `/work` (case studies), `/care-plans` (recurring revenue), `/demos/portal` (seeded demo)
- **1 new intake** — `/custom-app-intake` (8–10 questions for big-ticket scoping)
- **1 promoted page** — `/build/intro` from website-goal quiz to project-type router
- **1 rebuilt page** — `/pricing` from website-tier-only to anchor-navigated all-lane page

No new components needed for the service pages — the existing `components/service-page/ServicePage.tsx` template covers them with a small extension. No new portal experience — the demo reuses the existing `app/portal/[token]` codepath with seeded data and read-only enforcement on write APIs.

The total surface change is additive. No existing route is removed.

---

## What's Already Shipped (Frontend Layer)

Per the opportunity doc reconciliation, the following frontend pieces are live and don't need rebuilding:

| Frontend area | Status | Path |
|---|---|---|
| Paper/ink design system | Shipped | `app/globals.css` (paper/ink tokens + Inter Tight + JetBrains Mono) |
| Service-page template | Shipped | `components/service-page/ServicePage.tsx` |
| Build-intro quiz (website-only) | Shipped | `app/[locale]/build/intro/BuildIntroClient.tsx` |
| Full build intake | Shipped | `app/[locale]/build/BuildClient.tsx` |
| Estimate / book / deposit flow | Shipped | `app/[locale]/{estimate,book,deposit}/` |
| Client portal | Shipped | `app/portal/[token]/` |
| Internal admin pipeline | Shipped | `app/internal/admin/` |
| Internal dashboard with KPIs and capacity meter | Shipped | `app/internal/dashboard/page.tsx` |
| Analytics events client + server | Shipped | `lib/analytics/{client,server}.ts`, `app/api/analytics/event/` |

PIE engine v3 with fast/warm/deep routing logic is shipped (verified per `crecystudio-pie-refactor-spec.md` status header). The remaining PIE work is client-facing surface: tier-band visualization in admin and post-quote variants on `/estimate`. Both are sized in the opportunity doc 90-day roadmap as Phase 3 tasks — not a frontend rebuild, just two pages that read existing payload fields.

---

## Frontend Layer Model

Five layers, each with a specific responsibility. The layer model maps directly to the route architecture below.

| Layer | Purpose | Primary routes |
|---|---|---|
| Public marketing | Explain what CrecyStudio builds and route by lane | `/`, `/work`, `/process`, `/faq`, `/contact` |
| Service lane | Deep page per sales lane | `/websites`, `/custom-web-apps`, `/client-portals`, `/systems`, `/ecommerce`, `/website-rescue`, `/care-plans` |
| Pricing | All lanes' pricing in one anchor-navigated surface | `/pricing` |
| Intake (router and forms) | Project-type router, then lane-specific intake | `/build/intro`, `/build`, `/custom-app-intake`, `/ops-intake`, `/ecommerce/intake` |
| Sales / Delivery / Internal | Estimate, booking, deposit, portal, admin (mostly unchanged) | `/estimate`, `/book`, `/deposit/*`, `/portal/*`, `/internal/*` |

The `app/portal/*` and `app/internal/*` surfaces are unchanged for the repositioning. They work; the repositioning happens upstream of them.

---

## Target Route Architecture

```txt
/                                public marketing entry
/work                            studio ventures (Korent, Proveo) + client cases (NEW)
/care-plans                      recurring-revenue offer page (NEW)
/process
/faq
/contact

/websites                        Websites lane
/custom-web-apps                 Web Apps lane (NEW)
/client-portals                  Web Apps differentiator surface (NEW)
/systems                         Automation lane
/ecommerce                       E-commerce lane
/website-rescue                  Rescue lane (NEW)

/pricing                         all-lane anchor-navigated page (REBUILT)

/demos/portal                    seeded read-only portal demo (NEW)

/build/intro                     project-type router (UPGRADED from website-goal quiz)
/build                           website intake (rescue is handled inline in /build/intro)
/custom-app-intake               web-app intake (NEW)
/ops-intake                      automation intake
/ecommerce/intake                e-commerce intake

/estimate, /book, /deposit/*     sales conversion (unchanged for v1; Phase 3 adds PIE post-quote variants)
/portal, /portal/[token]         client workspace (unchanged)
/internal/admin                  admin pipeline (unchanged for v1; Phase 1 adds project_type filter)
/internal/admin/[id]             project control (Phase 3 adds tier-band viz + override controls)
/internal/admin/ops              ops admin
/internal/admin/ecommerce        ecommerce admin
/internal/dashboard              internal KPIs and capacity meter
/internal/project/[quoteId]      scope/change-order workspace
```

Seven new pages total. Three explicit deferrals from the earlier draft, each documented as v2 nice-to-haves:

- `/dashboards` — folded into `/custom-web-apps` ("Dashboards, portals, internal tools, MVPs"). Split out only if dashboard buyers become a meaningful share of inquiries.
- `/booking-payment-systems` — booking buyers route directly into `/build/intro?intent=booking` via the homepage card; the existing build intake already handles booking-mode websites.
- `/demos/{quote-system,booking-payment-system,admin-dashboard}` — track `/demos/portal` performance first; build the second demo only if portal-demo conversion justifies the investment.

---

## Project-Type Taxonomy and Frontend Data Contract

### `ProjectType` and `DeliveryArchetype`

Two axes, mirrored from the opportunity doc and lived as TypeScript types in `lib/projectTypes.ts`:

```ts
// What the buyer is shopping for. Drives marketing pages, intake routing, pricing display.
export type ProjectType =
  | 'website'
  | 'web_app'
  | 'automation'
  | 'ecommerce'
  | 'rescue';

// What the project actually is under the hood. Drives portal templates,
// milestone defaults, admin workflow. Internal-only — never appears on
// marketing surfaces or in client-facing copy.
export type DeliveryArchetype =
  | 'marketing_site'
  | 'booking_site'
  | 'portal'
  | 'dashboard'
  | 'saas_mvp'
  | 'automation'
  | 'storefront'
  | 'rescue_sprint';
```

The buyer picks `ProjectType` via the homepage cards or the `/build/intro` router. The operator (or PIE) picks `DeliveryArchetype` during scoping. Marketing surfaces never see the archetype.

### `IntakeSubmission` shape

Every intake — `/build`, `/custom-app-intake`, `/ops-intake`, `/ecommerce/intake` — POSTs to `/api/submit-estimate` with this envelope:

```ts
type IntakeSubmission = {
  source: 'build' | 'custom_app' | 'ops' | 'ecommerce';
  projectType: ProjectType;
  lead: {
    email: string;
    name?: string;
    phone?: string;
  };
  intakeRaw: Record<string, unknown>;        // exact form values
  intakeNormalized: Record<string, unknown>; // canonicalized for pricing engine
  pricing?: {
    lane: 'website' | 'ops' | 'ecommerce' | 'web_app' | 'rescue';
    tierRecommended?: string;
    estimateLow?: number;
    estimateHigh?: number;
    estimateTotal?: number;
    isCustomScope?: boolean;
  };
};
```

`projectType` is new for v1.5. The `submit-estimate` route already accepts and ignores extra fields, so adding `projectType` is a non-breaking write. The Phase 1 backend migration adds the `project_type` column on `quotes` and `customer_portal_projects` so the value is queryable in admin.

Pricing-shape conventions per project type:

- **`website`, `automation`, `ecommerce`** — existing behavior. Pricing engine computes `tierRecommended`, `estimateLow`, `estimateHigh`, `estimateTotal`. `isCustomScope: false`.
- **`rescue`** — fixed sprint band. `lane: 'rescue'`, `estimateLow: 1200`, `estimateHigh: 2800` set client-side from a constant. `isCustomScope: false`. Routes to `/estimate` (or `/book` if PIE flags warm/deep).
- **`web_app`** — custom scope. `lane: 'web_app'`, `isCustomScope: true`, `estimate*` fields omitted. Routes to `/book?quoteId=...` for a 30-min strategy call. PIE deep-path triggers fire on multi-role / multi-tenant / auth signals from the intake.

---

## The `/build/intro` Project-Type Router

The current `BuildIntroClient.tsx` is a website-goal quiz with a four-option goal mapping (more leads / bookings / sell online / show work). The Phase 1 upgrade promotes it to a project-type router that asks "what are you building?" first and branches to the correct intake.

### Step 0 — Project type (new step, prepended to the existing quiz)

Five options, each with a label and a one-line description in plain language:

```
○ Website                  "I need a website that converts."
○ Custom web app           "Dashboard, portal, internal tool, MVP."
○ Workflow automation      "I'm drowning in repetitive admin work."
○ E-commerce               "I need to sell things online."
○ Website rescue           "My current site isn't working."
```

Selecting a project type:

- Sets the `projectType` URL param and local component state immediately
- Emits `intake_router_selected` analytics event with the chosen value
- Branches:
  - `website` → continues to the existing 5-step website quiz (current behavior preserved)
  - `rescue` → continues to a 3-step rescue mini-intake within `/build/intro` (URL of current site, what's broken, timeline). Submits directly from the intro page to `/api/submit-estimate` with `projectType: 'rescue'` and the fixed sprint band; redirects to `/estimate?quoteId=...` (or `/book` if PIE warms/deepens). `/build` is not used for rescue.
  - `web_app` (Phase 1) → routes to `/contact?type=web_app` as a temporary landing while `/custom-app-intake` is being built; (Phase 2) → routes to `/custom-app-intake`
  - `automation` → routes to `/ops-intake`
  - `ecommerce` → routes to `/ecommerce/intake`

### Existing 5-step website quiz

Unchanged for `projectType=website`. The current state machine (`goal`, `pages`, `timeline`, `contentReady`, `budget`) and recommendation routing (`RECOMMENDATION_FROM_GOAL`) all keep working as-is.

### Implementation note

`BuildIntroClient.tsx` currently uses local `useState` for the website quiz dimensions. Add a top-level `projectType` state that defaults to `null`. Conditionally render either the project-type-picker (if `projectType === null`) or the existing website quiz (if `projectType === 'website'`). For other project types the component navigates immediately on selection — no second step in the router itself.

URL state: write `projectType` to the query string on selection (`router.replace`) so back-button behavior preserves the buyer's progress.

---

## Custom-App Intake Spec (`/custom-app-intake`)

Phase 2 deliverable. The Web Apps lane needs an intake tuned for big-ticket scoping — not a fixed-price quote, but enough information for a productive 30-minute strategy call.

### Question set (8–10 questions)

```
1. What problem are you trying to solve?
   [textarea, required, 60–1000 chars]

2. Is this a new product or an internal tool?
   ○ New product (customers will use it)
   ○ Internal tool (my team will use it)
   ○ Both / hybrid
   ○ Not sure yet

3. Who are the users? Pick all that apply.
   ☐ Customers / end users
   ☐ My staff or contractors
   ☐ Admin / operations team
   ☐ Multiple business tenants (other companies use it too)

4. What's the closest thing that already exists?
   [text, optional, 0–200 chars — examples: "Calendly but for repair quotes",
    "a simple Trello for our delivery routes", "Stripe Billing but for service contracts"]

5. Which of these will it need? Pick all that apply.
   ☐ Login / accounts
   ☐ Multiple user roles
   ☐ Payments (one-time)
   ☐ Subscriptions / recurring billing
   ☐ File uploads
   ☐ Document generation (PDFs, contracts)
   ☐ Email / SMS notifications
   ☐ External API integrations
   ☐ AI / automation features
   ☐ Mobile-friendly (web, not native)
   ☐ Multi-tenant (separate customer organizations)

6. Any specific tools or services it needs to connect to?
   [text, optional, 0–300 chars — Stripe, QuickBooks, Twilio, HubSpot, etc.]

7. When do you want it live?
   ○ ASAP (under 6 weeks)
   ○ 2–3 months
   ○ 4–6 months
   ○ Flexible / not sure yet

8. Budget you have in mind?
   ○ Under $10K
   ○ $10K – $25K
   ○ $25K – $50K
   ○ $50K+
   ○ Need help figuring this out

9. Anything else we should know?
   [textarea, optional, 0–1000 chars]

10. Email + name + (optional) phone
   [contact fields, required]
```

### Submission behavior

POSTs to `/api/submit-estimate` with `projectType: 'web_app'`, `source: 'custom_app'`, `pricing.isCustomScope: true`, full answers in `intakeRaw`, normalized keys in `intakeNormalized`. The submit handler creates a `web_app`-typed quote with no estimate total. The buyer is redirected to `/book?quoteId=...` to schedule a 30-minute strategy call.

PIE's deep-path routing (already shipped in `lib/pie/ensurePie.ts`) will fire on the resulting quote — at least one of the deep-path triggers (auth/login, multi-role, custom integrations, multi-tenant, no budget + many features) will match the answers. The admin pipeline shows the quote with a "deep" routing badge and a 30-minute call recommendation.

### Why this question set

- **Q1** captures the actual problem in the buyer's words — the most useful single piece of context for a strategy call.
- **Q2 + Q3** disambiguate sales motion (B2C product vs. internal tool vs. multi-tenant SaaS).
- **Q4** is the most underrated question: buyers struggle to describe a custom app from scratch but easily describe what it's *like*. This question is what lets the operator recognize the project shape in 60 seconds during a call.
- **Q5 + Q6** capture scope-shape signals that drive PIE's deep-path triggers.
- **Q7 + Q8** give directional signals; Q8 is intentionally banded, not a free text field, so the buyer commits to a tier without negotiating before the call.
- **Q9** is the "anything else" safety valve.
- **Q10** at the end (not the start) — questions first, gate later, increases completion rate on long forms.

### Validation rules

- Q1 minimum 60 chars enforced client-side and server-side.
- Q5 must have at least one checkbox selected.
- Q10 email format validated; phone optional but if provided must match a permissive `/^[+\d][\d\s().\-]{6,}$/` pattern.
- Server-side rate limit: same email cannot submit more than 3 custom-app intakes per 24 hours (reuse `lib/rateLimit.ts`).

---

## Service Page Schema

The existing `components/service-page/ServicePage.tsx` template is good and stays. Two small extensions:

```ts
type ServicePageProps = {
  // existing fields preserved verbatim:
  eyebrow, title, intro, heroStats,
  primaryCta, secondaryCta,
  whoItsForTitle, whoItsFor,
  problemsTitle, problems,
  includesTitle, includes,
  pricingTitle, pricingIntro, pricingCards,
  processTitle, processIntro, process,
  faqTitle, faqs,
  bestFitTitle, bestFit, notFitTitle, notFit,
  crossLinks,
  finalTitle, finalText, finalPrimaryCta, finalSecondaryCta,

  // new for the multi-lane direction:
  projectType?: ProjectType;       // stamped into primary CTA href as ?projectType=...
};
```

`projectType` is appended to `primaryCta.href` automatically by the component so service pages don't have to construct query strings by hand. Demo cross-links are handled by primary or secondary CTAs directly (e.g., `/client-portals` secondary CTA points to `/demos/portal`); no separate `demoLinks` prop is needed for v1 with one demo. Add a `demoLinks` array if and when a second demo lands.

The `lib/service-pages.ts` `ServiceId` union expands from the current 3 values to 7:

```ts
type ServiceId =
  | 'websites'
  | 'custom_web_apps'
  | 'client_portals'
  | 'systems'
  | 'ecommerce'
  | 'website_rescue'
  | 'care_plans';
```

Each new ID gets `en` content authored. `fr` and `es` fall back to `en` per existing fallback (i18n note below).

---

## Copy Direction Sketches

These are direction, not finished copy. Each new service page gets enough to render without re-deciding the angle.

### `/custom-web-apps`

- **Eyebrow:** *Custom web apps*
- **Headline:** *When a website isn't enough, we build the system that runs the business.*
- **Sub:** *Dashboards, customer portals, internal tools, MVPs — built on the same foundation we use for clients, with one workspace from scope to launch.*
- **Who it's for:**
  - You have a process that lives across spreadsheets, Notion, and a dozen browser tabs.
  - You've validated a software idea and need someone to actually build it.
  - You need a tool your customers will log into, not just a marketing site.
- **Problems:**
  - You've outgrown off-the-shelf SaaS but every contractor quote starts at $80K.
  - You don't have a CTO, but you have real software needs.
  - You've been burned by a freelancer who shipped half a product and disappeared.
  - Your team is spending more time managing tools than serving customers.
- **Includes (three groups):**
  - *Architecture and scope* — paid discovery when needed, system design, scope lock, milestone plan, realistic budget bands.
  - *Build* — Next.js + Supabase by default; auth, role-based access, payments, integrations, AI features as needed.
  - *Launch and ownership* — your code, your accounts, your domain. Documented handoff. Optional Care Pro retainer.
- **Best for:** founders shipping their first software product, operators replacing manual processes, agencies needing white-label internal systems.
- **Not a fit:** anything off-the-shelf already solves. We don't rebuild what HubSpot, Stripe, or Linear already build.
- **Primary CTA:** *Plan a custom app* → `/custom-app-intake`
- **Secondary CTA:** *See the workspace* → `/demos/portal`
- **Cross-link:** `/work` (Korent + Proveo as proof of capability)

### `/client-portals`

- **Eyebrow:** *Client portals*
- **Headline:** *A private workspace your customers actually use.*
- **Sub:** *Track scope, share files, send messages, sign off on milestones, view invoices — all in one place that feels like your studio, not a shared Drive folder.*
- **Who it's for:**
  - You run a service business and your client communication lives in scattered email threads.
  - You've been embarrassed by a client asking for "the latest version" of something you've sent four times.
  - Your customers expect a real product experience, not a Google Drive folder.
- **Problems:**
  - Email threads lose attachments, history, and context.
  - "Where are we in the project?" should never need to be asked.
  - Your competitors' portals look like real software; yours looks like a shared folder.
  - Manual invoice and agreement tracking is its own part-time job.
- **Includes:**
  - *Branded workspace* — your logo, colors, domain or subdomain.
  - *Project lifecycle* — milestones, asset uploads, revision requests, two-way messaging, activity feed.
  - *Money built in* — agreements, deposits, milestone invoices, retainers — all with audit trails.
  - *Owned by you* — code, data, customers. No vendor lock-in.
- **Best for:** agencies, contractors, consultants, repair businesses, wedding/event vendors, coaches — anyone running multi-week engagements.
- **Not a fit:** one-off transactions where there's nothing to track between purchase and delivery.
- **Primary CTA:** *See the demo* → `/demos/portal`
- **Secondary CTA:** *Start a portal project* → `/build/intro?projectType=web_app`
- **Page-level note:** This page sells the portal both as a feature of premium website builds and as a standalone Web Apps engagement.

### `/website-rescue`

- **Eyebrow:** *Website rescue*
- **Headline:** *You don't need a rebuild. You need someone to fix what's actually broken.*
- **Sub:** *A 1–2 week sprint that audits, prioritizes, and ships the changes that move the needle — without throwing away the site you have.*
- **Who it's for:**
  - Your current site works but it's leaking — slow load, broken on phones, weak conversion, dated look.
  - You can't justify a full rebuild but you can't keep the site as-is.
  - You inherited the site from someone who's gone.
- **Problems:**
  - Your site is built on something brittle — old WordPress, a dead Squarespace template, a freelancer's hosting account.
  - You can list five things wrong with it but nobody's prioritizing them.
  - Mobile traffic bounces because the experience is broken.
  - You don't know what's working and what isn't.
- **Includes:**
  - *Audit* — speed, mobile, SEO, conversion, accessibility, content, trust signals. Written report.
  - *Prioritized fix list* — ranked by impact, sized by effort.
  - *Sprint* — 1–2 week implementation of the highest-impact changes.
  - *Optional next step* — full redesign quote if the audit reveals a real rebuild is warranted.
- **Best for:** small businesses with a site that's *fine but* — fine but slow, fine but ugly on phones, fine but not converting.
- **Not a fit:** brand-new businesses without a site yet; sites on enterprise CMSs we can't touch.
- **Primary CTA:** *Start a rescue* → `/build/intro?projectType=rescue` (deep-links into the rescue mini-intake, skipping the project-type picker)
- **Secondary CTA:** *See pricing* → `/pricing#rescue`

### `/work` (custom layout, not the service-page template)

`/work` is a case-study showcase, not a problems-and-pricing page, so it does not use `ServicePage.tsx`. Build a simple `app/[locale]/work/page.tsx` with two sections.

- **Eyebrow:** *Selected work*
- **Headline:** *Real systems we've shipped — including our own.*
- **Section 1 — Studio ventures (capability proof):**
  - **Korent (`korent.app`)** — multi-tenant rental SaaS. Card with screenshot, one-line summary, capability chips ("multi-tenant", "Stripe payments", "delivery routing", "AI copilot"), link to `korent.app`.
  - **Proveo (`proveohq.com`)** — AI-augmented service-contractor SaaS. Card with screenshot, one-line summary, capability chips ("AI photo detection", "freemium billing", "CRM pipeline", "automated follow-ups"), link to `proveohq.com`.
  - Honest framing label: *"These are our own products, built and operated by the studio. They prove the engineering capability for the Web Apps lane — they are not client testimonials."*
- **Section 2 — Client work:**
  - Day-one minimum: at least one anonymized case ("Regional service business — 3× inbound leads in 60 days"). Replace with named cases as clients agree.
  - Empty card placeholders allowed temporarily; mark "More case studies coming."
- **Primary CTA:** *Start a project* → `/build/intro`
- **Secondary CTA:** *Plan a custom app* → `/custom-app-intake`

### `/care-plans` (uses extended ServicePage template)

- **Eyebrow:** *Care plans*
- **Headline:** *Keep the system healthy after launch.*
- **Sub:** *Three monthly plans that cover updates, monitoring, small features, and improvement work — so your site keeps earning instead of slowly drifting.*
- **Who it's for:**
  - You launched a site or system with us and want it to keep getting better.
  - You don't have a developer in-house and don't want to.
  - You'd rather pay a predictable monthly than invoice for every small change.
- **Includes (per plan, escalating):**
  - *Care* — content updates, monthly health check, monitoring, basic support.
  - *Care+* — Care + small features, analytics review, light refinements.
  - *Care Pro* — Care+ + monthly improvement sprint, priority response.
- **Pricing:** $250 / $650 / $1,250 per month (operator to confirm before publishing).
- **Best for:** post-launch website clients, custom-app clients with ongoing iteration needs, automation clients who'd otherwise route to Systems Partner.
- **Not a fit:** clients who want unlimited dev hours; clients launching with no defined ongoing need.
- **Primary CTA:** *Start a care plan* → `/contact?type=care`
- **Secondary CTA:** *See the workspace* → `/demos/portal`
- **Page-level note:** Cross-link from `/systems` page noting the relationship to Systems Partner retainer (different scope, similar price).

---

## Demo Strategy — `/demos/portal`

One demo for v1, seeded with realistic mock data, reusing the existing `app/portal/[token]` codepath unchanged.

### Implementation

1. **Seed migration** (`supabase/migrations/<date>_seed_demo_portal.sql`):
   - Insert a `quotes` row with `id = '00000000-0000-0000-0000-000000000d40'` (any fixed UUID), `lead_email = 'demo@crecystudio.example'`, `tier_recommended = 'Growth'`, `project_type = 'website'`.
   - Insert a `customer_portal_projects` row with `quote_id` matching the above, `access_token = 'demo'`, `client_status = 'active'`, `deposit_status = 'paid'`, `agreement_status = 'Accepted'`, realistic dates and notes.
   - Seed 3 milestones (one done, one in-progress, one todo), 2 assets, 1 revision request, 2 messages (one from "Studio", one from "Acme Plumbing client"), an activity feed of 10 events, 1 invoice (paid).
   - All timestamps relative to `now()` so the demo always looks current.
2. **Read-only enforcement** at portal write paths. The current portal API surface dispatches actions through several entry points:
   - `app/api/portal/[token]/route.ts` POST — dispatches by `actionType` (`asset_add`, `revision_add`, etc.)
   - `app/api/portal/[token]/messages/route.ts` POST — message send
   - `app/api/portal/[token]/preview/route.ts` POST — preview actions
   - Top-level `app/api/portal/{assets,revisions,revision,milestones}/route.ts` — additional write paths

   Add an early `if (token === 'demo')` check at each write entry point that returns `{ ok: false, demoMode: true, message: "This is a demo. Start a project to use these features.", cta: '/build/intro' }` with HTTP 200 and skips the actual write. Read paths (GET on `[token]/route.ts` and component data fetchers) are unmodified.
3. **Demo banner** in `PortalClient.tsx`:
   - When the portal project's `access_token === 'demo'`, render a persistent banner across the top of the workspace: *"This is a read-only demo. Your real project workspace will look like this with your own data."* with a "Start a project" CTA.
   - Add a small "Demo" badge near the project title.
4. **Analytics events:**
   - Emit `demo_portal_view` on first render (server-side).
   - Emit `demo_portal_to_intake` on banner CTA click.
5. **Indexing:** Allow `/demos/portal` in `app/robots.ts`. The page is marketing, not user data.
6. **Public link from homepage:** the `/client-portals` page links here via the secondary CTA; the homepage portal-preview section keeps a link as well.

### Why no demo session reset

Seeded once. Read-only enforcement at the API layer prevents seed pollution from buyers who try to upload assets or send messages. If detritus accumulates anyway, add a `pg_cron` reset job later — but only when needed.

---

## Frontend Connection to Backend Systems

| Frontend route | User purpose | Backend touchpoints |
|---|---|---|
| `/build/intro` | Project-type qualification + lane routing; for `rescue`, also runs the 3-step mini-intake | Emits `intake_router_selected` analytics event via `lib/analytics/client.ts`. For `rescue`, POSTs to `/api/submit-estimate` with `projectType: 'rescue'`, fixed sprint band, no PIE deep-path expected. Other project types are pure routers. |
| `/build` | Website intake | POSTs to `/api/submit-estimate` with `projectType: 'website'`, raw + normalized intake, pricing |
| `/custom-app-intake` | Web Apps intake | POSTs to `/api/submit-estimate` with `projectType: 'web_app'`, `pricing.isCustomScope: true`, no estimate total |
| `/ops-intake` | Automation intake | POSTs to `/api/submit-estimate` with `projectType: 'automation'` (existing behavior + `projectType` added) |
| `/ecommerce/intake` | E-commerce intake | POSTs to `/api/submit-estimate` with `projectType: 'ecommerce'` (existing behavior + `projectType` added) |
| `/estimate?quoteId=...` | Client-facing quote view | GET `/api/internal/get-quote` (token-gated); Phase 3 reads `routing.finalPath` and renders fast/warm/deep variant |
| `/book?quoteId=...` | Discovery / strategy call request | POST `/api/request-call`; for `web_app` quotes, defaults to 30-min call length |
| `/deposit/success`, `/deposit/cancel` | Stripe redirect targets | `/api/webhooks/stripe` confirms via `stripe_processed_sessions` idempotency |
| `/portal/[token]` | Client workspace | GET/POST `/api/portal/[token]`, `.../messages`, `.../assets`, `.../revisions`, `.../invoices` |
| `/demos/portal` | Read-only seeded demo | Same routes as `/portal/[token]` with read-only enforcement |
| `/internal/admin` | Admin pipeline | Loads `listAdminProjectData()`; Phase 1 adds `project_type` filter chips |
| `/internal/admin/[id]` | Project control workbench | Loads admin project data; Phase 3 adds tier-band visualization and PIE override controls |
| `/internal/dashboard` | Studio KPIs | Loads `getDashboardSnapshot()`; range param drives the time window |
| `/internal/project/[quoteId]` | Scope / change-order workspace | Uses scope-snapshot and change-order endpoints |

---

## UX Rules for the New Frontend

- **Never** make custom apps look like a fixed-price commodity. Web Apps lane shows ranges and routes to a strategy call.
- **Never** apologize for premium pricing. PIE's pricing-signal language stays neutral; admin warnings use "tight margin" not "premium quote."
- Use *can include* rather than *includes only* on Web Apps and Care plans pages.
- Keep the small-ticket Starter price visible on the homepage so price-sensitive buyers don't bounce assuming nothing's affordable.
- The universal CTA is *Start a project*. Reserve *Plan a custom app* for `/custom-web-apps`.
- Every service lane page ends in an intake route, not a generic contact form.
- Mobile is a first-class conversion path. Test every lane page on a real phone before shipping.
- Demo content is marked "Demo" with a banner and an exit CTA. No demo content is allowed to be mistaken for a real client engagement.
- Service-page primary CTAs always pass `?projectType=...` so the destination intake knows which lane it's serving.

---

## i18n Strategy

The repo supports `en`, `fr`, `es` via `next-intl` with English as the default and existing per-page fallback to `en` when a locale's content isn't authored.

- **All new pages and copy ship in `en` first.** New service pages render their `en` content for `fr` and `es` visitors via the existing fallback.
- **Translate `fr` and `es` when traffic justifies it.** Specifically: when either locale crosses 5% of intake submissions or 10% of homepage views over a rolling 30-day window. Until then, translation is wasted maintenance.
- **No new i18n infrastructure needed.** `lib/service-pages.ts` already handles per-locale data shape; new IDs add to the existing map.

---

## Implementation Phases

Cross-reference: the 90-day roadmap with effort sizing and definitions of done lives in `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md` § *90-Day Roadmap*. This doc is the page-level companion to that schedule. Do not duplicate the roadmap here — it would drift.

Frontend-specific notes per phase:

- **Phase 1 (Days 1–30)** — Hero copy in `messages/en.json`; "What We Build" cards in `app/[locale]/page.tsx`; promote `BuildIntroClient.tsx` to project-type router; `/work` page as a custom layout (not the `ServicePage.tsx` template — case-study showcase has different structure); rebuild `/pricing` as anchor-navigated single page. No new components needed beyond a small `WorkPage` layout.
- **Phase 2 (Days 31–60)** — Three new service pages (`/custom-web-apps`, `/client-portals`, `/website-rescue`) using extended `ServicePageProps`; `/custom-app-intake` page + form; `/demos/portal` seed migration + read-only enforcement + banner; `/care-plans` page (after the operating doc exists).
- **Phase 3 (Days 61–90)** — PIE Phase 6 admin tier-band visualization in `app/internal/admin/[id]/ProjectControlClient.tsx`; PIE Phase 7 client-facing variants on `app/[locale]/estimate/page.tsx` reading `routing.finalPath`; nothing else frontend-side (the rest of Phase 3 is backend cleanup).

---

## Repo Evidence Reviewed

| Area | Repo Path(s) | Why It Matters |
|---|---|---|
| Public homepage | `app/[locale]/page.tsx`, `app/[locale]/home.module.css`, `messages/en.json` (`home` namespace) | Hero copy and "What We Build" cards land here in Phase 1 |
| Service-page template | `components/service-page/ServicePage.tsx`, `components/service-page/service-page.module.css` | Used as-is by all new lane pages with one new optional prop (`projectType`) |
| Service-page data | `lib/service-pages.ts` | `ServiceId` union expands; new `en` content added per ID |
| Build-intro quiz | `app/[locale]/build/intro/BuildIntroClient.tsx` | Promoted to project-type router; existing 5-step website quiz preserved verbatim for `projectType=website` |
| Full build intake | `app/[locale]/build/BuildClient.tsx` | Used for `website` project type. Rescue is handled inline in `BuildIntroClient.tsx` and does not pass through this component. |
| Quote submit API | `app/api/submit-estimate/route.ts` | Accepts new `projectType` field; existing leads/quotes flow preserved |
| Pricing engine | `lib/pricing/{config,tiers,website,ops,ecommerce}.ts`, `lib/pie/ensurePie.ts` | TIER_CONFIG bands live; PIE v3 fast/warm/deep routing live; Phase 7 reads `routing.finalPath` |
| Call request flow | `app/[locale]/book/BookClient.tsx`, `app/api/request-call/route.ts` | Reused for Web Apps strategy call (30-min default) |
| Deposit / Stripe | `app/api/estimate/accept/route.ts`, `app/api/internal/create-deposit-link/route.ts`, `app/api/webhooks/stripe/route.ts`, `lib/depositPayments.ts` | Idempotent via `stripe_processed_sessions` |
| Client portal | `app/portal/[token]/{page.tsx,PortalClient.tsx,route.ts}`, `app/api/portal/[token]/` | Demo reuses this codepath unchanged |
| Internal admin | `app/internal/admin/{page.tsx,AdminPipelineClient.tsx,[id]/ProjectControlClient.tsx}` | Phase 1 adds `project_type` filter; Phase 3 adds tier-band viz |
| Internal dashboard | `app/internal/dashboard/page.tsx` | Already shipped; no changes |
| Admin project model | `lib/adminProjectData.ts` | Reads `project_type` after Phase 1 migration |
| Analytics events | `lib/analytics/client.ts`, `lib/analytics/server.ts`, `app/api/analytics/event/` | New events: `intake_router_selected`, `demo_portal_view`, `demo_portal_to_intake` |
| i18n | `i18n/request.ts`, `messages/{en,fr,es}.json`, `next.config.js` | en-first; existing per-page fallback handles missing locales |
| Project types | `lib/projectTypes.ts` (extended) | New `ProjectType` and `DeliveryArchetype` unions |
| Mock data | `lib/mockProject.ts` | Already imports from `projectTypes.ts`; informs the demo-portal seed shape |

---

## External References Used

- HubSpot CRM data model overview: https://knowledge.hubspot.com/object-settings/use-the-object-library
- Atlassian Jira workflow overview: https://www.atlassian.com/software/jira/guides/workflows/overview
- Stripe Checkout Sessions API: https://docs.stripe.com/payments/checkout-sessions
- Stripe webhook best practices: https://docs.stripe.com/webhooks?locale=en-GB
- Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- next-intl documentation: https://next-intl.dev/docs/getting-started
