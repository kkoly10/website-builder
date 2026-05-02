# Phase 1 Execution Status

## Purpose

Working document for tracking the multi-lane positioning rollout across working sessions. Captures:

- What's been shipped (PRs, commits, what each one did)
- What's left
- Locked decisions made through Q&A
- Standing rules and process commitments learned in working sessions
- A "resume in a new session" guide

The strategy and design live in three docs at repo root. Read those for the *plan*. Read this for the *execution state*.

- `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md` — what to sell, why, 90-day roadmap with sized tasks
- `frontend_schema_and_connection_to_current_systems.md` — page-level / route-level companion
- `backend_schema_for_crecystudio_project_engine.md` — v1.5 minimal target schema

Plus operating-rules docs:

- `docs/care-plans-operating.md` — Care plans scope, SLAs, time-bank, cancellation, etc.
- `crecystudio-pie-refactor-spec.md` — PIE engine v3 source of truth (engine itself is largely shipped; phases 6–7 are public-surface work)
- `crecystudio-roadmap.md` — older website-lane roadmap (P0–P2 items shipped; P3 backlog still valid)

This doc should be updated at the end of each working session.

---

## Phase 1 progress

Six tasks per the opportunity doc roadmap, plus one merged follow-up.

| Task | PR | Status | Summary |
|---|---|---|---|
| 1 — Hero copy | [#82](https://github.com/kkoly10/website-builder/pull/82) | ✅ Merged | Homepage hero rewritten in en/fr/es to *"Websites and custom web systems for businesses that need to look bigger than they are."* Geographic claim removed (audience is now international per locked decision). Footer blurb aligned. |
| 2 — "What We Build" cards | [#83](https://github.com/kkoly10/website-builder/pull/83) | ✅ Merged | New 6-card section between proof strip and workspace preview. Cards: Websites / Custom web apps / Client portals / Booking & payments / Workflow automation / Website rescue. Three cards link to existing pages; three fall back to `/contact?type=...` for Phase 1 (Phase 2 service pages will replace those). Hero secondary CTA repointed to `#what-we-build`. Old "Also" section removed. |
| 3 — Project-type router | [#84](https://github.com/kkoly10/website-builder/pull/84) | ✅ Merged | `/build/intro` promoted from website-only quiz to 5-option project-type picker. `website` continues to existing 5-step quiz; other lanes navigate to lane intakes (`/contact?type=X` for Phase-1-fallback lanes, `/ops-intake` for automation, `/ecommerce/intake` for ecommerce). URL params `?projectType=X` and `?intent=X` honored for deeplinks (non-website deeplinks use `router.replace` so back-button skips the intermediate page). Analytics event `intake_router_selected` fires on every selection. |
| 4 — `project_type` column | [#85](https://github.com/kkoly10/website-builder/pull/85) | ✅ Merged | New `project_type_enum` (website / web_app / automation / ecommerce / rescue) on `quotes` and `customer_portal_projects` with `'website'` default + backfill. `/api/submit-estimate` writes the value with safe-update semantics — only sets on UPDATE if explicitly provided, to avoid overwriting a non-website classification. Admin pipeline gets a lane filter. **Codex P1 caught the UPDATE-overwrite bug mid-review; fix shipped before merge.** |
| Booking-card one-click | [#86](https://github.com/kkoly10/website-builder/pull/86) | ✅ Merged | Follow-up to #83 + #84. Booking card href changed from `/build/intro?intent=booking` to `/build/intro?projectType=website&intent=booking` so it skips the picker and lands directly on the website quiz with bookings preselected. |
| 5 — `/work` page | [#87](https://github.com/kkoly10/website-builder/pull/87) | ✅ Merged | New `/work` route showing Korent + Proveo as honestly-framed studio ventures (capability proof, not client testimonials). Trust cleanup applied: each claim verified against actual repo READMEs / live sites; removed unverifiable "19-table" specific number; replaced "Stripe payments" with "Crew mobile" (Korent README explicitly says automated Stripe is deferred); removed fictional "3× inbound leads" client case in favor of an honest empty-state placeholder. Added `/work` to top nav and footer. Made `/contact?type=X` context-aware (web_app, portal, rescue) with mailto subject pre-fill. **Codex P0 + Vercel CI caught a build break (next-intl's typed `t()` rejected dead `clients.*` references); fix shipped before merge.** |
| **6 — `/pricing` rebuild** | [#89](https://github.com/kkoly10/website-builder/pull/89) | ✅ Merged | Rebuilt `/pricing` as a single anchor-navigated scrollable page with six sections: Websites / Web Apps / Automation / E-commerce / Rescue / Care. Sticky anchor nav at top. Each section uses locked pricing from the opportunity doc with tier cards (label / value / detail / meta). Web Apps and Care sections include a context note above the cards. CTAs per lane: website → `/build/intro?projectType=website`; web apps → `/contact?type=web_app`; automation → `/ops-intake`; ecommerce → `/ecommerce/intake`; rescue → `/build/intro?projectType=rescue`; care → `/contact`. All prices USD, displayed explicitly. Messages restructured into named section namespaces (`websitesSection`, `webAppsSection`, `automationSection`, `ecommerceSection`, `rescueSection`, `careSection`); fr/es updated with English overrides per i18n strategy. New CSS classes `pricingNav`, `pricingNavInner`, `pricingNavLink`, `sectionNote` added to `marketing.module.css`. Round 2 `next build` clean. Round 3 `next dev` curl: 38/38 content and anchor checks passed. |
| **Homepage quality pass** | [#90](https://github.com/kkoly10/website-builder/pull/90) | ✅ Merged | Hybrid premium positioning: hero font reduced (clamp 2.4–4.8rem / 18ch max-width), new headline "Built for where you're going, not where you are." + scarcity signal. Proof strip replaced with capability proof (2 SaaS platforms, full-stack, senior/no juniors). New ventures dark-band section (Korent + Proveo cards) between What We Build and portal preview — engineering proof for big-ticket buyers. Homepage pricing section removed; self-serve path preserved via `/build/intro`. Closing CTA updated: primary → `/contact`, secondary → `/build/intro`, tertiary → `/pricing`. Pricing removed from top nav (footer link unchanged). 15/15 content checks passed. Self-review caught mobile hero padding inversion (4.2rem > 4rem desktop) and over-tight line-height (0.92 → 0.97); both fixed before merge. |
| **Phase 2 — service pages** | [#91](https://github.com/kkoly10/website-builder/pull/91) | ✅ Merged | Four new service pages using shared `ServicePage` template: `/custom-web-apps`, `/client-portals`, `/website-rescue`, `/care-plans`. Each page has hero, feature bullets, pricing cards (locked tiers), cross-links, and dual CTA (primary intake + secondary). `lib/service-pages.ts` expanded from 3 to 7 service IDs. Homepage What We Build cards updated to link to real pages instead of `/contact?type=...` fallbacks. Pricing card `meta` labels added for semantic correctness across all lanes. |
| **Phase 2 — `/custom-app-intake`** | [#92](https://github.com/kkoly10/website-builder/pull/92) | ✅ Merged | 4-step custom web app intake form: project description + company/contact → target users + current solution + scale → stage + scope preference (locked pricing bands) + timeline → review + submit. POSTs to `/api/submit-estimate` with `projectType: "web_app"`, redirects to `/book?quoteId=...&token=...` on success. `BuildIntroClient` web_app route updated from `/contact?type=web_app` to `/custom-app-intake`. Codex P1 catch: missing `quoteToken` in `/book` redirect (anonymous users couldn't auth); fixed before merge. Three self-review issues caught and fixed (stale portal copy, trackEvent firing before API success, step title t() pattern). |
| **Phase 2 — `/demos/portal`** | [#93](https://github.com/kkoly10/website-builder/pull/93) | ✅ Merged | Demo workspace experience: `scripts/seed-demo-portal.ts` (idempotent, fixed UUIDs, schema-corrected against live DB) seeds Sarah Chen's Growth-tier website project with 5 milestones and 2 assets. `/demos/portal` page redirects to `/portal/demo` (noindex). Sticky demo banner injected into `PortalClient.tsx` — "read-only" label + "Start a real project →" CTA to `/build/intro`. Read-only guards (token === "demo" → 403) on all 5 portal write endpoints. `robots.ts` disallows `/demos/`. `loadPortalBundle` made resilient to PGRST205 on `customer_portal_messages` (migration-pending table treated as empty array). Self-review caught demo banner CTA pointing to `/custom-app-intake` instead of `/build/intro`; fixed before merge. |

---

## Locked decisions

These were made through Q&A in working sessions and now live in the strategy docs. Listed here for fast reference.

### Pricing (USD, validated against 2026 boutique-market data)

| Lane | Tier | Price |
|---|---|---|
| **Websites** | Starter / Growth / Premium | $1,800 / $3,500 / $6,500+ |
| **Web Apps** | Discovery sprint | $2,500 – $5,000 |
| **Web Apps** | MVP | $18,000 – $35,000 |
| **Web Apps** | Standard build | $35,000 – $75,000 |
| **Web Apps** | Custom scope | $75,000+ |
| **Automation** | Quick fix / Ops system / Systems Partner | $1K–$1.8K / $2K–$3.8K / $500–$1,250/mo |
| **E-commerce** | Build / Run / Fix | $1.8K–$4K+ / $500–$1.8K/mo / $1,200 |
| **Rescue** | Audit / Sprint | $1,000–$1,500 / $3,500–$6,500 |
| **Care** | Care / Care+ / Care Pro | $400/mo / $850/mo / $2,250/mo |

Canonical source: `opportunities_to_build_on_current_repo_to_better_expose_crecys_potential.md` § Service Package Architecture. Care plans operating rules: `docs/care-plans-operating.md`.

### Audience

International, English-speaking small service businesses. NoVa/DMV is home market and referral base, but public copy stays geographically neutral. Pricing displayed in USD on every surface.

### Voice / hero positioning

> "Websites and custom web systems for businesses that need to look bigger than they are."

Sub: *"From a polished marketing site to a full client portal, booking flow, or custom dashboard — built in one workspace, owned by you."*

Warm voice on first contact; systems-fluent voice on lane pages. Never apologize for premium pricing. Never make custom apps look like a fixed-price commodity. Always end service-lane pages in an intake route, not a generic contact form.

### i18n strategy

`en` first. fr/es get English overrides for newly authored copy until traffic justifies real translation. Existing fr/es content for unchanged sections is preserved. The `lib/service-pages.ts` fallback already handles missing-locale graceful degradation.

### Five sales lanes (taxonomy)

`website / web_app / automation / ecommerce / rescue`. Plus an internal `DeliveryArchetype` axis (`marketing_site / booking_site / portal / dashboard / saas_mvp / automation / storefront / rescue_sprint`) that's not exposed on marketing surfaces.

### `/contact` is now context-aware

Routes from cards / CTAs that pass `?type=web_app | portal | rescue` get a context-specific kicker, title, description, and pre-filled mailto subject. Default `/contact` (no type) behaves as before. Contact-side namespace: `contact.byType.{webApp, portal, rescue}.{kicker, title, description}`.

---

## Standing rules

### Three-round review on every deliverable

Before declaring any change "done":

1. **Round 1 — self-consistency.** Fresh-eyes read of what was just written. Internal contradictions, mis-sized work, stale references, broken links between sections.
2. **Round 2 — repo verification.** Every file path, every "shipped" claim, every code reference checked against the actual repo. **Run `next build` locally** for any change touching `t()` calls, server/client component boundaries, dynamic routes, or API route handlers. `npm run lint` (= `tsc --noEmit`) does NOT catch all `next-intl` typed errors that `next build` catches. Use `tsc --noEmit` only for pure TypeScript-domain changes.
3. **Round 3 — audience read.** Load the actual feature in a browser via `next dev` and curl/click through. Don't validate visual changes by reading code alone.

This rule was learned the hard way: Codex caught a P1 (#85) and a P0 (#87) that Round 2/3 had missed because they were performed theoretically rather than by running the code.

### Trust / honesty / integrity / clean code

- **No fake metrics.** Don't manufacture client outcomes. If there's no real case yet, the section gets an honest empty-state placeholder, not a fabricated case.
- **No dead links.** Every page must be reachable from somewhere. Adding a route without linking it from nav / footer / pages defeats the purpose.
- **No misleading code.** If `?type=X` is in a link, the destination must actually use it. Otherwise remove the param.
- **Verified claims only.** Anything written about a product, feature, or capability must be checked against the source (README, live site, actual code) before shipping. Re-verify each working session — README content drifts.
- **Plain anchors for external links.** `TrackLink` uses `next-intl`'s locale-aware `Link` and is internal-only. External URLs get `<a target="_blank" rel="noopener noreferrer">`.

### Branch + PR workflow

- One feature per branch off `main`.
- Branch name: `claude/<descriptive-slug>` (e.g., `claude/phase-1-task-6-pricing-rebuild`).
- Open as draft PR immediately after first push.
- Each PR scoped to one logical change.
- Subscribe to PR activity to catch CI failures + Codex/human review comments.
- For PR review-comment fixes, push more commits to the same branch (don't merge a separate PR for the fix).

### Local environment notes

`next dev` and `next build` both require Supabase env vars to start (the `lib/supabaseAdmin.ts` module throws on missing env at import time). For pages that don't query Supabase but inherit the layout, use placeholder env vars to bypass:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=fake \
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake \
NEXT_PUBLIC_APP_URL=http://localhost:3000 \
NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
npm run build
```

Same env prefix for `npm run dev`. Pages that actually query Supabase will fail, but pure-content pages render fine — sufficient for round-3 verification of UI changes.

`node_modules` may not be present on a fresh clone; run `npm ci --no-audit --no-fund` to install (~20 s with `package-lock.json`).

---

## Resume in a new session

If you're picking this up in a new Claude Code session, in order:

1. **Read this file first** to know what's done and what's next.
2. **Read the three strategy docs at repo root** (`opportunities...`, `frontend_schema...`, `backend_schema...`) to refresh the *plan*. They contain sized tasks, copy direction sketches, route architecture, schema, and the 90-day roadmap.
3. **Read `docs/care-plans-operating.md`** if working on Care plans surface.
4. **Look at recent merges on `main`**:
   ```bash
   git log --oneline -20 main
   ```
   to see what other work has landed since this doc was last updated.
5. **Pick up where this doc says "Not started"** — that's the next task.
6. **Update this doc** at the end of the session with whatever shipped.

**Phase 1 and Phase 2 are complete as of this doc's last update.** Phase 3 is next.

---

## What's beyond Phase 1 (preview)

Per the opportunity doc § 90-Day Roadmap:

- **Phase 2 (Days 31–60)** — Three new service pages (`/custom-web-apps`, `/client-portals`, `/website-rescue`), `/custom-app-intake` form, `/demos/portal` seeded experience, `/care-plans` page. Roughly 35 hours total.
- **Phase 3 (Days 61–90)** — Backend cleanup (`proposals` + `proposal_versions`, `agreements`, `support_subscriptions`), PIE Phases 6–7 (admin tier-band UI, fast/warm/deep estimate variants), public launch outreach. Roughly 40 hours total.

Phase 2 hard prerequisites:

- `docs/care-plans-operating.md` must exist before `/care-plans` ships → **already exists** (written during the strategy doc rewrite).
- The `/contact?type=X` context-awareness landed in #87, so the homepage cards and `/work` CTA remain honest until Phase 2 service pages replace them.

---

## Update protocol

When working on Phase 1+ tasks, update this doc when:

- A task PR merges → update the progress table with PR number and brief summary.
- A new standing rule is established → add to "Standing rules".
- A locked decision changes → update "Locked decisions" and reference the doc / PR with the canonical version.
- A learning emerges from a CI catch or review → add to "Standing rules" so it doesn't repeat.

Keep this file in `docs/` (with the operations and runbook material). The strategy docs at repo root remain the *plan*; this is the *execution state*.
