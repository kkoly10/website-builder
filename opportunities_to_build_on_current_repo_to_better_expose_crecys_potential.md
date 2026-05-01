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

<!-- CONTINUED IN PART 2: Proof of Capability, Public Surface Plan, Demo Strategy, 90-Day Roadmap, Risks, Metrics, Repo Evidence, External References -->
