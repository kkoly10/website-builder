# CrecyStudio — Website Lane Roadmap

> **Status: partially superseded.** Strategic positioning and the multi-lane studio direction now live in `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md`. This doc remains the historical record of the website-lane operating-system roadmap. Items P0–P2 (#1–#9 — portal data layer, portal reskin, two-way messaging, final invoicing, automated nudges, activity feed, etc.) have largely shipped per `supabase/migrations/`. Items P3 #10–#13 (e-signature, brand asset library, knowledge base, notification preferences) remain valid backlog and should be carried forward in the new strategy doc's 90-day roadmap.

A priority-ordered list of fixes, polish work, and missing features needed to take the website lane from a strong 7/10 to a true 10/10 boutique agency operating system. Based on a code-level audit of the current workspace.

---

## Current state, in one paragraph

The infrastructure is more sophisticated than what most boutique studios run on. Lead capture, AI-powered project intelligence (PIE), pricing controls, customer portal, Stripe deposits, launch readiness checks, and scope versioning are already built and working. The problems are not architectural — they are (1) an unfinished data-layer migration, (2) a visual layer that doesn't match the new direction yet, and (3) a few specific feature gaps that prevent the workspace from closing the loop on real client work. This is a finishing job, not a rebuild.

**Functional rating today: 7/10**
**Visual rating today: 5/10**
**Target after this roadmap: 9–10/10 on both axes**

---

## Priority tiers

- **P0 — Critical**, blocking other work or causing visible fragility. Do first.
- **P1 — High**, the moves that unlock the biggest jump in client perception or studio operating quality.
- **P2 — Medium**, the things that turn a working system into one that runs itself.
- **P3 — Polish**, the final 10% that separates a great boutique studio from every other agency.

---

## P0 — Critical (do first, in this exact order)

### 1. Finish the portal data-layer migration
**Why:** Two parallel systems exist right now. `lib/portal/server.ts` (OLD, references the deleted `quote_portal_state` table — broken) and `lib/customerPortal.ts` (NEW, uses `customer_portal_projects`, `customer_portal_assets`, `customer_portal_milestones`, `customer_portal_revisions` — working). Some routes use the old layer and will fail at runtime. No visual or feature work should land on top of broken plumbing.

**What to do:**
- Add write functions to `lib/customerPortal.ts`: milestone toggle, client status, deposit mark paid, admin note
- Update `lib/ghost/snapshot.ts` to read from the new layer
- Migrate `app/api/internal/admin/pre-contract/route.ts`
- Migrate `app/api/internal/admin/quote-admin/route.ts`
- Migrate the portal trio: `app/portal/[token]/page.tsx` + `route.ts` + `PortalClient.tsx`
- Delete `lib/portal/server.ts` once nothing imports it

**Effort:** medium (already in progress per existing roadmap)
**Risk if skipped:** any feature added on top of the old layer is wasted work.

---

## P1 — High leverage (the biggest jumps in quality)

### 2. Reskin the customer portal in paper/ink aesthetic
**Why:** This is the moment of truth for client perception. Every client who lands in the portal forms their impression of CrecyStudio in about five seconds. The current portal uses the midnight/gold/Playfair language that the marketing site is leaving behind. After the marketing reskin lands, a client will hit the portal and feel a brand whiplash. Reskinning it is also the highest-leverage single visual change in the entire system.

**What to do:**
- Translate the prototype's design tokens (paper background, brick red accent, Inter Tight, JetBrains Mono labels) into a portal-specific CSS module
- Restyle the story hero, journey map, milestone tracker, asset uploader, revision form, deposit banner, launch readiness panel
- Keep all data wiring intact — visual layer only

**Effort:** medium-high
**Payoff:** massive — turns the portal from a functional dashboard into a brand experience.

---

### 3. Reskin marketing interior pages
**Why:** The new homepage prototype is in a different visual universe than `/websites`, `/process`, `/pricing`, `/faq`, `/terms`. A visitor who clicks "See how it works" right now would land on a Playfair/midnight page and feel the studio is two different brands.

**What to do:**
- Apply paper/ink design system to: `/websites`, `/process`, `/pricing`, `/faq`, `/terms`, `/about` (if exists), `/contact`
- Replace `components/service-page/ServicePage.tsx` styling
- Build a shared `<EditorialPage>` layout component so future pages stay consistent

**Effort:** medium
**Payoff:** high — closes the brand consistency gap across the public site.

---

### 4. Add two-way messaging to the portal
**Why:** This is the single biggest UX gap in the current system. Right now clients can submit revision requests and upload assets, but there is no actual conversation. Asking "quick question about the about page" forces them out of the workspace and into email — which defeats the whole point of having a workspace. Every premium agency portal has a thread per project.

**What to do:**
- New table: `customer_portal_messages` (portal_project_id, sender_role, body, created_at, read_at)
- Thread UI in the portal — chronological, simple, no rich text needed at first
- Mirror in admin project control panel
- Email notification to the other party on new message
- Optional: `@mention` or message-pinned-to-section linking later

**Effort:** medium
**Payoff:** massive — closes the biggest gap between "portal" and "agency relationship."

---

## P2 — Medium (turn a working system into one that runs itself)

### 5. Reskin the admin pages
**Why:** You spend more hours of your life inside admin than any client ever will. Right now they are utilitarian dark panels with raw form fields — functional but joyless. A boutique studio operating system should make the operator feel like a craftsman in a workshop, not a data-entry clerk.

**What to do:**
- Apply paper/ink design system to: `app/internal/admin/page.tsx`, `app/internal/admin/[id]/ProjectControlClient.tsx`, the pipeline view, the project control tabs
- Better information density — group related fields, reduce form noise
- Inline editing instead of long form lists where possible
- Status badges, progress visualizations, real KPI cards instead of raw numbers

**Effort:** high (lots of pages, lots of fields)
**Payoff:** high for daily quality of life, lower for client perception (clients don't see this).

---

### 6. Add final invoicing flow (beyond deposit)
**Why:** The Stripe deposit flow is excellent. But there is no system for the *remaining balance at launch*, milestone payments, or maintenance retainers. Right now the money flow is "deposit collected via Stripe → trust system → manual final invoice via email." A boutique closes the loop on payment without leaving the workspace.

**What to do:**
- New table: `project_invoices` (project_id, type [deposit/milestone/final/retainer], amount, status, stripe_session_id, due_date, paid_at)
- Admin UI to issue invoices from the project control panel
- Client view in the portal showing all invoices, paid and pending
- Stripe checkout sessions for each invoice with metadata routing the same way deposits do
- Webhook handler updates invoice status on payment

**Effort:** medium
**Payoff:** high — completes the financial spine of the operating system.

---

### 7. Add automated client nudges and reminders
**Why:** Projects rot when communication stalls. "Client hasn't uploaded assets in 5 days." "Preview ready and not viewed in 48 hours." "Revision submitted with no admin response in 24 hours." A 10/10 system catches these automatically before they become problems.

**What to do:**
- Cron-like scheduled function (Vercel cron or Supabase scheduled function)
- Rules engine: each rule is a SQL query + an email template + a recipient
- Configurable per project (some clients want more nudging than others)
- Log every nudge sent so the same one doesn't fire twice

**Effort:** medium
**Payoff:** high — prevents the most common cause of projects going sideways.

---

### 8. Add unified activity feed
**Why:** History is currently stored as JSON inside `portalState` but never surfaced. Both client and admin should see a chronological "what happened" stream. This is the difference between "I have to ask where we are" and "I can see exactly where we are."

**What to do:**
- New table: `project_activity` (project_id, actor_role, event_type, payload, created_at)
- Write events on every meaningful action (asset uploaded, milestone toggled, revision submitted, preview published, deposit paid, message sent, etc.)
- Client-facing feed in the portal (filtered to client-relevant events)
- Admin-facing feed in the project control panel (full feed)

**Effort:** medium
**Payoff:** high — makes the entire workspace feel alive.

---

### 9. Add internal reporting dashboard
**Why:** You have all the data for revenue this month, projects in flight, average cycle time, intake-to-signed conversion rate, average project value, capacity utilization. None of it is surfaced. A boutique owner needs to see their business at a glance, not run SQL queries.

**What to do:**
- New page: `app/internal/dashboard/page.tsx`
- Metric cards for the key numbers
- Simple charts: revenue over time, projects by stage, conversion funnel
- Capacity view: how many active projects, how many hours estimated vs. capacity
- Export to CSV for monthly review

**Effort:** medium
**Payoff:** high for studio-running confidence, low for client perception.

---

## P3 — Polish (the final 10%)

### 10. Real e-signature on agreements
**Why:** You have agreement drafting and an `agreement_accept` portal action, but it's not legally a signature. For real client trust at the boutique tier, this should be at minimum: typed name + IP + timestamp + agreement hash, stored immutably. Or integrate DocuSign / HelloSign for the premium tier.

**Effort:** small (in-house) or medium (third-party)
**Payoff:** medium — protects you legally, signals professionalism.

---

### 11. Brand asset library per client
**Why:** Assets currently exist as a flat list with category tags. A 10/10 portal organizes them into a real library: brand colors, logo files, photo gallery, copy doc, credentials vault, legal documents — each with its own visual treatment.

**Effort:** medium
**Payoff:** medium — makes the portal feel like a real digital filing cabinet.

---

### 12. Knowledge base / FAQ inside the portal
**Why:** "How do I review a preview?" "What's a revision round?" "When does my deposit refund?" Self-serve answers reduce client anxiety and your inbox volume.

**Effort:** small
**Payoff:** medium-low — quality of life improvement.

---

### 13. Notification preferences
**Why:** Some clients want every email, some want a weekly digest. Right now everyone gets the same firehose.

**Effort:** small
**Payoff:** low.

---

## Order of attack (recommended sequence)

This is the order I'd actually do these in, accounting for dependencies and momentum.

1. **Finish data-layer migration** (P0) — unblocks everything else
2. **Reskin customer portal** (P1) — biggest visual leverage, builds momentum
3. **Reskin marketing interior pages** (P1) — closes brand consistency gap
4. **Add two-way messaging** (P1) — closes biggest UX gap
5. **Reskin admin pages** (P2) — quality of life, can be done in parallel with anything below
6. **Add final invoicing flow** (P2) — closes financial loop
7. **Add automated nudges** (P2) — prevents project rot
8. **Add activity feed** (P2) — makes workspace feel alive
9. **Add internal dashboard** (P2) — studio self-awareness
10. **E-signature** (P3)
11. **Brand asset library** (P3)
12. **Knowledge base** (P3)
13. **Notification preferences** (P3)

---

## What to prototype next

**Customer portal reskin** is the right next prototype. Reasons:

- It's the highest-leverage single visual change (every client sees it)
- It validates that the paper/ink language works for product UI, not just marketing
- It can be designed and reviewed in parallel with finishing the data-layer migration
- It surfaces design questions that will inform every other product page (admin, dashboard, messaging)

After that prototype lands and you react to it, the next candidates are: a marketing interior page (`/websites`), or the messaging thread UI inside the portal.
