# Front End Schema and Connection to Current Systems

## Purpose

This document defines how the CrecyStudio frontend should flow now that the business is positioned as more than a website builder. The frontend should present CrecyStudio as a premium website and custom web systems studio, while connecting cleanly to the systems already built in the current repo: service pages, build intro, full intake, quote submission, estimate page, booking/call request, deposits, client portal, and internal admin pipeline.

---

## Executive Summary

The frontend does not need to be rebuilt from zero. The current repo already has a strong foundation:

- Homepage
- Website service page
- Systems/automation service page
- E-commerce service page
- Pricing page
- Process page
- FAQ page
- Contact page
- Build intro quiz
- Full build intake
- Estimate page
- Discovery call booking page
- Deposit success/cancel pages
- Client portal
- Internal admin pipeline
- Ops admin
- E-commerce admin

The main frontend work is a strategic reframing and routing upgrade. The site should not force every prospect into a website-only path. It should route people by what they need built:

- Website
- Website with booking/payments
- Client portal
- Dashboard/internal tool
- Custom web app
- Business automation
- E-commerce/service checkout
- Website rescue/redesign

---

## Frontend Layer Model

| Layer | Primary Routes | Purpose |
|---|---|---|
| Public marketing layer | `/` | Explain what CrecyStudio builds and route users by problem type |
| Service lane layer | `/websites`, `/systems`, `/ecommerce`, plus new lanes | Deep pages for each offer type using reusable service page data |
| Intake router layer | `/build/intro` | Ask what the user needs built, then route to the correct intake |
| Intake forms layer | `/build`, `/ops-intake`, `/ecommerce/intake`, `/custom-app-intake` | Collect project-specific structured data |
| Sales layer | `/estimate`, `/book`, `/deposit/success`, `/deposit/cancel` | Convert qualified interest into call request, proposal, deposit, and saved quote |
| Client layer | `/portal`, `/portal/[token]` | Client workspace after quote/deposit |
| Internal layer | `/internal/admin`, `/internal/admin/[id]`, `/internal/project/[quoteId]` | Admin pipeline and project control workbench |

---

## Target Route Architecture

```txt
/
/websites
/custom-web-apps
/client-portals
/booking-payment-systems
/dashboards
/systems
/ecommerce
/website-rescue
/pricing
/process
/faq
/contact
/work
/demos
/demos/client-portal
/demos/quote-system
/demos/booking-payment-system
/demos/admin-dashboard
/build/intro
/build
/custom-app-intake
/ops-intake
/ecommerce/intake
/estimate?quoteId=...
/book?quoteId=...
/deposit/success
/deposit/cancel
/portal
/portal/[token]
/internal/admin
/internal/admin/[id]
/internal/project/[quoteId]
/internal/admin/ops
/internal/admin/ecommerce
```

---

## Homepage Schema

The homepage should be the main router into CrecyStudio's capabilities.

| Section | Content Purpose | Connection |
|---|---|---|
| Hero | Position CrecyStudio as premium websites and custom web systems | CTA to Start Project and secondary CTA to See What We Build |
| What We Build | Cards for Websites, Web Apps, Client Portals, Booking/Payments, Dashboards, Automation, E-commerce, Rescue | Each card links to a service page or prefilled intake route |
| Not Just a Website | Explain that a site can capture leads, qualify customers, collect payments, track projects, and reduce manual work | Connect the public promise to existing portal/admin/estimate systems |
| Demo Systems | Show demos of portal, quote flow, booking system, dashboard | Links to demo pages with safe mock data |
| Process | Intake -> Estimate -> Call -> Proposal -> Deposit -> Portal -> Build -> Launch | Maps directly to current routes and backend flow |
| Pricing Direction | Show starting ranges and custom-scope messaging | Avoid implying every custom app has instant fixed pricing |
| Closing CTA | Start your project / plan a custom app | Routes to build intro or custom app intake |

---

## Service Page Schema

The current ServicePage model is a good pattern and should remain. The existing pages for websites, systems, and e-commerce already follow this direction.

Recommended expanded TypeScript shape:

```ts
type ServiceLane = {
  id:
    | 'websites'
    | 'custom_web_apps'
    | 'client_portals'
    | 'booking_payments'
    | 'dashboards'
    | 'systems'
    | 'ecommerce'
    | 'website_rescue';
  title: string;
  intro: string;
  whoItsFor: string[];
  problems: string[];
  includes: { title: string; items: string[] }[];
  pricingCards: { label: string; value: string; detail: string }[];
  process: { step: string; title: string; detail: string }[];
  bestFit: string[];
  notFit: string[];
  faqs: { question: string; answer: string }[];
  primaryCta: { label: string; href: string; projectType: ProjectType };
  secondaryCta?: { label: string; href: string };
  demoLinks?: { label: string; href: string }[];
};
```

---

## Project-Type Router Schema

The first intake screen should not ask only website questions. It should ask what the user needs built.

| Project Type | User-Language Description | Route Target |
|---|---|---|
| `professional_website` | A public website or redesign | `/build?projectType=website` |
| `booking_payment_system` | A site with booking, deposits, invoices, or checkout | `/build?projectType=booking_payment_system` |
| `client_portal` | A customer/client workspace | `/build?projectType=client_portal` or `/custom-app-intake?type=portal` |
| `custom_web_app` | A dashboard, account system, internal tool, or app | `/custom-app-intake` |
| `business_automation` | Workflow automation, dashboards, CRM handoff | `/ops-intake` |
| `ecommerce` | Storefront or service checkout | `/ecommerce/intake` |
| `website_rescue` | Fix or redesign an existing site | `/build?projectType=website_rescue` |

---

## Frontend Data Contract

The current system already sends raw intake and normalized intake. The improvement is adding `projectType` and `source` consistently.

```ts
type ProjectType =
  | 'website'
  | 'custom_web_app'
  | 'client_portal'
  | 'booking_payment_system'
  | 'business_automation'
  | 'ecommerce'
  | 'website_rescue'
  | 'dashboard_internal_tool';

type IntakeSubmission = {
  source: 'build' | 'ops' | 'ecommerce' | 'custom_app' | 'rescue';
  projectType: ProjectType;
  lead: {
    email: string;
    phone?: string;
    name?: string;
  };
  intakeRaw: Record<string, unknown>;
  intakeNormalized: Record<string, unknown>;
  pricing?: PricingResult;
  estimate?: {
    total?: number;
    low?: number;
    high?: number;
    tierRecommended?: string;
    isCustomScope?: boolean;
  };
};
```

---

## How Frontend Connects to Current Backend Systems

| Frontend Route | User Purpose | Current / Backend Connection |
|---|---|---|
| `/build/intro` | Project type / quick qualification | Prefill and route to `/build`, `/ops-intake`, `/ecommerce/intake`, or new `/custom-app-intake` |
| `/build` | Full website/system intake | POST `/api/submit-estimate` with source, lead, raw intake, normalized intake, pricing, estimate |
| `/estimate` | Client quote/estimate view | Uses quoteId/token; can call `/api/estimate/accept` to create deposit link |
| `/book` | Discovery call request | POST `/api/request-call` with quoteId/token and preferred call details |
| `/portal/[token]` | Client workspace | GET/POST `/api/portal/[token]`, plus asset/message/revision endpoints |
| `/internal/admin` | Admin pipeline | Loads `listAdminProjectData` and embeds `ProjectControlClient` |
| `/internal/admin/[id]` | Standalone project control | Uses admin project data and internal admin APIs |
| `/internal/project/[quoteId]` | Scope/change-order workspace | Uses scope and change-order APIs |

---

## New Frontend Pages to Add

| Route | Purpose |
|---|---|
| `/custom-web-apps` | Explain dashboards, customer accounts, admin systems, MVPs, and internal apps. CTA to `/custom-app-intake` |
| `/client-portals` | Sell the portal as a standalone add-on and as a premium package feature. CTA to portal demo and intake |
| `/booking-payment-systems` | Sell appointment/deposit/payment/invoice systems. CTA to prefilled build intake |
| `/dashboards` | Sell admin dashboards and internal tools. CTA to custom app intake |
| `/website-rescue` | Sell redesign, mobile cleanup, conversion fixes, form/CTA improvements. CTA to current-website intake |
| `/demos` | Index of demo experiences |
| `/demos/client-portal` | Static or seeded demo portal experience |
| `/demos/quote-system` | Demo of intake -> estimate -> deposit journey |
| `/demos/admin-dashboard` | Safe mock of internal dashboard capability |
| `/custom-app-intake` | New intake for complex app builds and paid discovery |

---

## Recommended User Flows

### Simple Website Client

```txt
Homepage
-> Websites
-> Start Project
-> Build Intro
-> Full Build Intake
-> Estimate
-> Book Call or Accept
-> Deposit
-> Client Portal
-> Build / Review / Launch
```

### Custom Web App Client

```txt
Homepage
-> Custom Web Apps
-> Plan a Custom App
-> Custom App Intake
-> Custom Scope Required
-> Strategy Call
-> Proposal
-> Deposit
-> Project Workspace
```

### Client Portal Client

```txt
Homepage
-> Client Portals
-> View Portal Demo
-> Start Portal Project
-> Intake
-> Estimate or Strategy Call
-> Deposit
-> Portal Setup
```

### Automation Client

```txt
Homepage
-> Systems / Automation
-> Workflow Audit
-> Ops Intake
-> Recommended Engagement
-> Call
-> Deposit
-> Ops Workspace
```

### E-Commerce Client

```txt
Homepage
-> E-Commerce
-> E-Commerce Intake
-> Quote / Call
-> Deposit
-> E-Commerce Workspace
```

### Website Rescue Client

```txt
Homepage
-> Website Rescue
-> Submit Current Website
-> Rescue Intake
-> Audit / Improvement Plan
-> Estimate
-> Call
-> Deposit
-> Rescue Sprint
```

---

## UX Rules for the New Frontend

- Never make custom web apps look like a fixed-price commodity.
- Use examples, not limits. Say "can include" rather than "includes only."
- Keep the primary CTA consistent: "Start Your Project."
- Use "Plan a Custom App" for larger builds.
- Make every service lane end in a relevant intake path, not a generic contact form.
- Show the portal and admin workflow visually because those are major differentiators.
- Avoid overwhelming the homepage. Use cards and demos to make the breadth understandable.
- Mobile must be treated as a first-class conversion path.

---

## Frontend Implementation Phases

| Phase | Frontend Work |
|---|---|
| Phase 1 | Reposition homepage hero, add What We Build section, revise CTAs, and keep existing `/build/intro` flow intact |
| Phase 2 | Add missing service pages using ServicePage data: custom apps, client portals, booking/payments, dashboards, rescue |
| Phase 3 | Upgrade `/build/intro` into a project-type router. Add `projectType` to URL/query and local state |
| Phase 4 | Build `/custom-app-intake` and custom-app strategy-call result page |
| Phase 5 | Add demo routes and safe mock data for portal, quote flow, booking/payment flow, and admin dashboard |

---

## Repo Evidence Reviewed

| Area | Repo Path(s) | Why It Matters |
|---|---|---|
| Public homepage | `app/[locale]/page.tsx` | Existing homepage structure with hero, proof, portal preview/differentiator, process, pricing tiers, closing CTA, and secondary systems/e-commerce lanes |
| Reusable service pages | `app/[locale]/websites/page.tsx`, `app/[locale]/systems/page.tsx`, `app/[locale]/ecommerce/page.tsx` | Service pages already use a shared ServicePage component and getServicePageData content model |
| Service page data | `lib/service-pages.ts` | Detailed website, workflow automation, and e-commerce copy/data already exists |
| Project routing quiz | `app/[locale]/build/intro/BuildIntroClient.tsx` | Existing quick qualification quiz routes users to full build intake with URL params |
| Full build intake | `app/[locale]/build/BuildClient.tsx` | Multi-step intake collects website type, goals, pages, booking, payments, automations, integrations, content readiness, budget, timeline, email, and phone |
| Quote submit route | `app/api/submit-estimate/route.ts` | Creates/updates leads and quotes, stores raw/normalized intake, pricing truth, totals, quote token, and analytics event |
| Pricing engine | `lib/pricing/config.ts`, `lib/pricing/website.ts` | Existing tiers and complexity scoring for websites plus ops/e-commerce tier structures |
| Call request flow | `app/[locale]/book/BookClient.tsx`, `app/api/request-call/route.ts` | Quote-aware discovery call request flow updates status and can send alerts |
| Deposit/payment flow | `app/api/estimate/accept/route.ts`, `app/api/internal/create-deposit-link/route.ts`, `lib/depositPayments.ts`, `app/api/webhooks/stripe/route.ts` | Creates Stripe deposit links, stores deposit state, updates quote/portal status, and confirms payments |
| Client portal | `app/portal/[token]/PortalClient.tsx`, `app/api/portal/[token]/route.ts` | Client workspace with deposit banner, milestones, invoices, assets, revisions, messages, preview, launch readiness, and agreements |
| Internal admin pipeline | `app/internal/admin/page.tsx`, `AdminPipelineClient.tsx` | Master-detail admin pipeline with urgency queue, value, next-action logic, status/readiness badges, message polling, and embedded controls |
| Admin project model | `lib/adminProjectData.ts` | Combines quote, portal, lead, estimates, PIE, call requests, pricing, scope snapshot, deposit, assets, revisions, invoices, activity, messages, proposals, and agreements |

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
