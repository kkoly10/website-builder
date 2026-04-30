# Opportunities to Build on Current Repo to Better Expose Crecy's Potential

## Purpose

This document explains the vision, goal, and opportunity map for using the current `website-builder` repo as CrecyStudio's internal service-delivery engine. The key idea is simple: CrecyStudio should not be presented as only a website builder. The current repo already supports a much bigger promise: premium websites, custom web systems, client portals, booking/payment flows, dashboards, automation, e-commerce workflows, and structured project delivery.

The goal is to expose that potential without confusing customers. The public-facing message should feel simple and benefit-driven, while the backend and admin tools quietly power a much more sophisticated operation.

---

## Executive Summary

CrecyStudio's strongest opportunity is to position itself as a premium digital systems studio for service businesses. A website can still be the entry point, but the offer should not stop at pages. The repo already shows that CrecyStudio can manage a complete digital project lifecycle: intake, pricing, estimate, call request, deposit, portal, messages, assets, revisions, invoices, launch readiness, admin pipeline, and scope/change-order governance.

That means the offer should evolve from:

> "I build websites."

To:

> "I build premium websites and custom web systems for service businesses - from polished marketing sites to booking flows, client portals, dashboards, payment systems, automations, and full web apps."

This framing lets CrecyStudio sell small projects without sounding limited, and sell larger projects without seeming like it is trying to force every client into a basic website package.

---

## Correct Vision

CrecyStudio should become a studio that helps service businesses move from a weak online presence to a working digital operating layer.

A client may initially think they need a website, but after discovery they may actually need one or more of the following:

- A professional marketing site
- A booking flow
- A payment/deposit system
- A client portal
- A dashboard
- A customer account system
- A quote engine
- A workflow automation system
- A service checkout flow
- A custom internal tool
- A full custom web app

The current repo should be treated as the internal engine that helps sell and deliver these systems consistently.

---

## Strategic Goal

The goal is not to turn CrecyStudio into a public SaaS immediately. The smarter path is:

1. Use the current repo internally to sell and deliver services.
2. Standardize the repeated workflows.
3. Build demos that prove the capability.
4. Sell higher-value done-for-you systems.
5. Later, if repeated demand appears, turn some of those workflows into SaaS or productized tools.

The repo should help CrecyStudio become more professional, not more complicated.

---

## Current Repo Strengths

| Strength | Current Repo Evidence | Opportunity |
|---|---|---|
| Public marketing surface | Homepage, websites, systems, e-commerce, pricing, process, FAQ, contact | CrecyStudio already has the foundation for a multi-lane service website. |
| Guided qualification | `app/[locale]/build/intro/BuildIntroClient.tsx` and `app/[locale]/build/BuildClient.tsx` | Prospects can be qualified before calls. |
| Pricing intelligence | `lib/pricing/config.ts`, `lib/pricing/website.ts`, ops and e-commerce pricing structures | CrecyStudio can avoid random quoting and maintain stronger margins. |
| Sales pipeline | Estimate page, call request, Stripe deposit link, deposit success/cancel | There is already a commercial path from lead to paid project. |
| Client portal | `app/portal/[token]/PortalClient.tsx`, `app/api/portal/[token]/route.ts` | This is a major differentiator against normal freelancers. |
| Admin pipeline | `app/internal/admin/page.tsx`, `AdminPipelineClient.tsx`, `ProjectControlClient.tsx` | CrecyStudio already has an internal command center. |
| Scope governance | Scope snapshots and change orders | This protects against scope creep and supports higher-ticket projects. |

---

## Main Opportunity Lanes

### 1. Premium Websites and Custom Web Systems

This should be the core public offer. The phrase "custom web systems" prevents prospects from thinking CrecyStudio only builds brochure websites.

This lane includes:

- Marketing websites
- Service business websites
- Booking/payment websites
- Client portals
- Dashboards
- Quote systems
- Admin tools
- Customer account areas
- Custom web apps

The key language should be: "A custom website or web app system that can include..." rather than "A website with only..."

### 2. Smart Quote Systems

This is a strong standalone offer for businesses that already have a website but need better lead capture.

Possible client types:

- Cleaners
- Contractors
- Auto detailers
- Trainers
- Consultants
- Repair businesses
- Event vendors
- Wedding vendors

What CrecyStudio can sell:

- Intake form
- Quote logic
- Estimate/quote page
- Admin review
- Call request
- Deposit link
- Status tracking

This uses systems already present in the repo: build intake, submit-estimate route, pricing engine, quote storage, estimate page, call request, and deposit flow.

### 3. Client Portal Websites

This may become the strongest differentiator. Most small business web designers do not give clients a real portal where the project can be tracked.

Potential use cases:

- Website project portals
- Contractor client portals
- Consultant client portals
- Repair-status portals
- Coaching/training portals
- Agency project portals
- Service delivery dashboards

The current repo already supports:

- Deposit state
- Project milestones
- Invoices
- Activity feed
- Asset uploads
- Revision requests
- Messages
- Preview links
- Launch readiness
- Agreement acceptance

### 4. Booking and Payment Systems

This lane should focus on businesses where the website must do more than display information.

Examples:

- Trainers who need parents or clients to book sessions
- Consultants who need paid discovery calls
- Local service businesses that need deposits
- Repair businesses that need pre-approval or quote deposits
- Event vendors that need package selection and payment

Offer examples:

- Booking system
- Deposit collection
- Paid consultation flow
- Service checkout
- Invoice/payment tracking
- Customer confirmation emails
- Admin dashboard

### 5. Custom Web App MVPs

This is where CrecyStudio's ceiling increases.

This lane should be used for:

- Admin dashboards
- Internal tools
- Inventory systems
- Rental platforms
- Customer account systems
- Multi-step workflow apps
- Quote/pricing engines
- File upload systems
- Membership or gated access apps

Important: these should not be instant-priced like small websites. They should route into a custom-app intake and strategy call.

### 6. Business Workflow Automation

The current repo already has a systems/ops lane. This should be positioned as a service for businesses that are drowning in repetitive admin work.

Examples:

- Lead routing
- Email follow-ups
- CRM handoffs
- Invoice reminders
- Status notifications
- Intake automation
- Internal dashboards
- SOP-supported workflows

This is an important upsell after a website build because many clients discover that their problem is not just a weak website; it is a weak operating process.

### 7. E-commerce and Service Checkout

The e-commerce lane should be kept, but it should not sound like generic Shopify setup. CrecyStudio should frame it as service commerce and business checkout systems.

Examples:

- Product/service checkout
- Deposits
- Service packages
- Repair sprint checkout
- Small e-commerce launch
- E-commerce operations support

### 8. Website Rescue and Redesign

This is an easy entry offer because the client already knows there is a problem.

Offer examples:

- Mobile cleanup
- Homepage restructuring
- Conversion improvements
- Form/CTA repair
- Speed and trust improvements
- Redesign from Wix/Squarespace into a more owned system

This can become a lower-friction offer that leads to bigger custom work.

### 9. Monthly Support and Systems Care

Every project should have a natural post-launch path.

Support plan examples:

- Content updates
- Landing page updates
- Form monitoring
- Analytics checks
- Automation maintenance
- Small feature requests
- Monthly improvement reports
- Technical support

This creates recurring revenue and stabilizes the business.

### 10. Demo Library

The current repo needs a public proof layer.

Recommended demos:

- Demo client portal
- Demo quote system
- Demo booking/payment flow
- Demo admin dashboard
- Demo website rescue before/after
- Demo custom app dashboard

Demos will make the offer easier to understand and easier to sell.

---

## Recommended Public Positioning

Use this as the main positioning:

> CrecyStudio builds premium websites and custom web systems for service businesses - from polished marketing sites to booking flows, client portals, dashboards, payment systems, automations, and full web apps.

Supporting points:

- Start with a professional website when your business needs a better first impression.
- Add booking, payments, intake, client portals, dashboards, or automations when your business needs more than pages.
- Track your project in a private workspace from scope to launch.
- Keep ownership of your code, content, domain, and data.

---

## Service Package Architecture

| Offer | Suggested Range | What It Includes |
|---|---:|---|
| Starter Website | $1,800-$2,400 | 1-3 page professional website, mobile-first design, contact/lead form, SEO basics, launch support, portal-backed delivery |
| Growth Website System | $3,500-$4,500 | Multi-page site, booking/payment integrations, stronger conversion flow, client portal, milestones, deposit workflow |
| Premium Build | $6,500-$10,000+ | Larger website or web system with advanced integrations, accounts, dashboards, custom flows, and scope control |
| Smart Quote Add-On | $750-$2,500 | Intake, quote tracking, estimate view, call request, deposit link, and admin review for an existing site |
| Client Portal Add-On | $1,500-$4,500 | Private workspace for assets, revisions, messages, invoices, previews, milestones, and launch readiness |
| Workflow Automation | $1,000-$3,800+ | Audit and build follow-up automation, CRM handoff, lead routing, notifications, dashboards, or SOP-backed systems |
| Custom Web App Discovery | $500-$1,500 discovery, then scoped build | Paid discovery for complex apps with scope, architecture, milestones, price range, and MVP plan |
| Monthly Care / Systems Partner | $250-$1,250/mo | Updates, analytics checks, automation maintenance, small features, and ongoing improvements |

---

## How to Expose CrecyStudio's Potential on the Website

1. Change the homepage hero from website-only language to websites and custom web systems.
2. Add a "What We Build" section with cards for websites, booking/payment systems, client portals, custom web apps, dashboards, automation, e-commerce, and rescue/redesign.
3. Make the build-intro quiz ask project type first, not just website goal.
4. Add service pages for custom web apps, client portals, booking/payment systems, dashboards, and website rescue using the existing ServicePage system.
5. Create demo routes showing a client portal, quote flow, booking/payment flow, and admin dashboard.
6. Keep the CTA simple: "Start your project" for most users and "Plan a custom app" for larger builds.
7. Make the estimate flow route complex builds to strategy call instead of trying to show a fake instant price.

---

## 90-Day Roadmap

| Timeframe | Focus |
|---|---|
| First 30 days | Reposition homepage, add What We Build cards, rewrite service copy, add project-type router, create one demo portal |
| Days 31-60 | Add service pages for custom web apps, client portals, booking/payment systems, website rescue, dashboards. Create custom app intake and demo library |
| Days 61-90 | Clean proposal/deposit/agreement flow, add case studies, add support retainer path, tighten admin next actions, launch outreach campaigns |

---

## Key Risks and Protections

| Risk | Protection |
|---|---|
| Sounding like a basic web designer | Use custom web systems language and show examples beyond websites |
| Sounding like an unfocused SaaS product | Keep CrecyStudio positioned as done-for-you services powered by your internal platform |
| Overbuilding before selling | Use current repo capabilities and build demo/proof assets before expanding too much |
| Underpricing complex work | Route custom apps into discovery and use scope snapshots/change orders |
| Operational complexity | Use project type, lifecycle status, next action, and portal templates |

---

## Success Metrics

- Visitor to intake-start conversion rate
- Intake completion rate
- Estimate-to-call request rate
- Call-to-proposal rate
- Proposal acceptance rate
- Average project value by lane
- Deposit-paid conversion rate
- Project delivery cycle time
- Revision rounds per project
- Retainer attach rate

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
| Project control workbench | `app/internal/admin/[id]/ProjectControlClient.tsx` | Admin control surface for pricing, agreements, invoices, messages, launch readiness, client sync, and lifecycle actions |
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
