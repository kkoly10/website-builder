# CrecyStudio Launch & Portal Plan

**Document type:** Single source of truth — replaces:
- `CRECYSTUDIO_LAUNCH_READINESS_AND_PRICING_AUDIT.md`
- `CRECYSTUDIO_PORTAL_WORKFLOW_TEMPLATE_ENGINE.md`
- `CRECYSTUDIO_WEBSITE_DESIGN_DIRECTION_IMPLEMENTATION_PLAN.md`

**Date:** May 7, 2026
**Repo:** `kkoly10/website-builder`
**Live site:** `crecystudio.com`
**Audience:** Founder + future implementation work (Codex / Claude Code)

---

## 0. How to use this doc

This plan is execution-ordered. Work top-to-bottom. Each phase has:

- A goal
- Current-state snapshot (what's actually in the repo today)
- Concrete file changes
- Acceptance criteria

Phases are sized to ship in ~1 week each. Don't start a phase before the previous one's acceptance criteria pass.

---

## 1. Current state snapshot (verified May 2026)

This grounds the plan in what's actually there, not what we wish were there.

### What exists and works

- Multi-lane intake routing (`/build/intro` → website / ops / ecommerce / rescue / etc.)
- Quote backend with Supabase, quote tokens, rate limiting, locale handling, analytics events
- Customer portal auto-creation via `ensureCustomerPortalForQuoteId()` in `lib/customerPortal.ts`
- Three-lane pricing config in `lib/pricing/config.ts` (website / ops / ecommerce)
- I18n routing for English / French / Spanish
- Playwright config (`playwright.config.ts`) and one e2e test (`e2e/intake-forms.spec.ts`)
- Two security headers in `proxy.ts`: `X-Content-Type-Options`, `X-Frame-Options`
- `safeNextPath()` helper in `lib/supabase/server.ts` (only checks `startsWith("/")`)

### What is missing or under-built

- **Portal is single-lane.** `app/portal/[token]/PortalClient.tsx` renders a website-only workspace. Ops and ecommerce live in separate silo portals (`app/portal/ops/[opsIntakeId]`, `app/portal/ecommerce/[id]`) with their own schemas.
- **No `project_type` plumbing.** `customer_portal_projects` has no `project_type` column being populated; `scope_snapshot` does not store direction, required actions, or launch checks.
- **No Design Direction feature.** No `components/portal/directions/` folder, no Design Direction card.
- **Limited portal API actions.** `app/api/portal/[token]/route.ts` only handles: `revision_add`, `asset_add`, `deposit_notice_sent`, `agreement_accept`, `client_status`, `milestone_toggle`.
- **No unified auth/conversion shell.** Login / signup / forgot / reset / estimate are each bespoke pages.
- **Missing security headers.** No CSP, HSTS, Referrer-Policy, Permissions-Policy.
- **Tests are written but unrunnable via npm.** `package.json` only has `dev / build / start / lint`.
- **Pricing config covers 3 lanes, not 5.** No `web_app` or `rescue` tiers.

### Validated against 2026 industry data

- Pricing for **custom web apps and client portals is ~30–50% under market median**. Care plan floor at $150/mo is slightly low. Other pricing is on-market.
- Service-blueprint and Style Tiles methodology used in the original docs is industry-standard (NN/G, Style Tiles, Forge & Smith).
- OWASP confirms unvalidated redirects are A01:2025 Broken Access Control. Current `safeNextPath` is insufficient.

---

## 2. Operating rules

These should be enforced everywhere downstream.

1. **Lead path sets `project_type`. The quote stores it. The portal inherits it. The workspace renders the matching workflow.**
2. **Five canonical lanes:** `website | web_app | automation | ecommerce | rescue`. The pricing config must match this enum. (Existing `ops` lane is renamed `automation`; `web_app` and `rescue` are new.)
3. **Direction is a decision checkpoint, not a design menu.** Client chooses the lane; CrecyStudio drives the work; client approves the result.
4. **Phase-gates lock scope.** Once a direction is approved and locked, major changes require a change order.
5. **Feedback consolidates per round.** Required, not advisory.
6. **Public pricing only advertises lanes the portal can service.** Don't publish `web_app` / `rescue` prices on the marketing site until the unified engine ships.

---

## 3. Canonical types

Ship these in `lib/workflows/types.ts` (new file). Everything downstream imports from here.

```ts
export type ProjectType =
  | "website"
  | "web_app"
  | "automation"
  | "ecommerce"
  | "rescue";

export type DirectionType =
  | "design_direction"
  | "product_direction"
  | "workflow_direction"
  | "store_direction"
  | "rescue_diagnosis";

export type ActionOwner = "client" | "studio" | "system";

export type ActionStatus =
  | "not_started"
  | "waiting_on_client"
  | "waiting_on_studio"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "locked"
  | "complete"
  | "blocked";

export type WorkflowTemplate = {
  projectType: ProjectType;
  label: string;
  directionType: DirectionType;
  milestones: { key: string; title: string; owner: ActionOwner; sortOrder: number }[];
  requiredActions: {
    key: string;
    title: string;
    description: string;
    owner: ActionOwner;
    status: ActionStatus;
    unlocksMilestone?: string;
  }[];
  launchChecks: { key: string; title: string; owner: ActionOwner }[];
  direction: { type: DirectionType; status: ActionStatus; payload: Record<string, unknown> };
};

export const ALLOWED_DIRECTION_BY_PROJECT_TYPE: Record<ProjectType, DirectionType> = {
  website: "design_direction",
  web_app: "product_direction",
  automation: "workflow_direction",
  ecommerce: "store_direction",
  rescue: "rescue_diagnosis",
};
```

---

# Phase 1 — Security, redirect hardening, QA wiring

**Goal:** Close the audit's hard blockers so the site is safe to send paid traffic to.
**Effort:** 3–5 days.

## 1.1 `safeNextPath` hardening

**Current state:** `lib/supabase/server.ts` only checks `next.startsWith("/")`. Does not block protocol-relative `//evil.com` or backslash variants.

**Change:**

```ts
// lib/supabase/server.ts
export function safeNextPath(next?: string | null): string | null {
  if (!next) return null;
  if (typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.includes("\\")) return null;
  try {
    const decoded = decodeURIComponent(next);
    if (decoded.startsWith("//") || decoded.includes("\\")) return null;
  } catch {
    return null;
  }
  return next;
}
```

**Audit other read-points:** every place `next`, `return_to`, `redirect`, or `redirect_to` is read from query strings (auth callback at `app/auth/`, login client, post-checkout flows). Apply the same helper.

## 1.2 Global security headers

Add to `next.config.js`:

```js
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=(self)" },
  // Ship CSP report-only first (see 1.3)
];

module.exports = {
  // ...existing config
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
```

## 1.3 CSP in report-only mode

Do **not** ship enforcing CSP at first — Stripe Checkout, Google Fonts, analytics, and Supabase will break.

Step 1: ship `Content-Security-Policy-Report-Only` for two weeks with a report endpoint at `app/api/csp-report/route.ts`.
Step 2: review violations, build the strict policy.
Step 3: promote to enforcing `Content-Security-Policy`.

Report-only starter:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.googletagmanager.com;
connect-src 'self' https://*.supabase.co https://api.stripe.com;
img-src 'self' data: https:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
report-uri /api/csp-report;
```

## 1.4 Wire test scripts in `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "tsc --noEmit",
  "test:e2e": "playwright test",
  "test:smoke": "playwright test e2e/smoke.spec.ts",
  "test:routes": "playwright test e2e/routes.spec.ts"
}
```

Add `e2e/smoke.spec.ts` covering:

```
/, /websites, /ecommerce, /systems, /custom-web-apps, /client-portals,
/website-rescue, /care-plans, /build/intro, /build, /estimate,
/login, /signup, /portal, /internal/admin
```

Each page loads (200), no console errors, h1 renders.

## 1.5 Live money-path QA

Before paid traffic, run one clean real-world pass through each lane:

1. Website intake → quote created → estimate page renders.
2. Custom-app intake → quote created → `project_type = web_app` preserved.
3. E-commerce intake → `project_type = ecommerce` preserved.
4. Rescue intake → `project_type = rescue` preserved.
5. Estimate "Accept" → Stripe checkout opens.
6. Stripe test payment → webhook updates `quotes.deposit_status` and `customer_portal_projects.deposit_status`.
7. Portal/workspace appears after deposit.
8. Login claims existing quotes by email.
9. Admin dashboard sees quote, client status, messages, workspace.

> Note: tests 2–4 will fully pass only after Phase 3 lands. Phase 1 just verifies the website lane end-to-end and confirms the other lanes survive intake.

## 1.6 ConversionShell wrapper

Don't redesign every auth page. Extract one shared shell:

```
components/site/ConversionShell.tsx
```

Apply to: `app/[locale]/login/LoginClient.tsx`, `app/[locale]/signup/SignupClient.tsx`, `app/[locale]/forgot-password/ForgotPasswordClient.tsx`, `app/[locale]/reset-password/ResetPasswordClient.tsx`, `app/[locale]/estimate/EstimateClient.tsx`.

Shell provides: brand header, gradient background, card frame, footer. Page content is unchanged.

## Phase 1 acceptance criteria

- [x] `safeNextPath` rejects `//`, `\`, encoded variants. (Shipped — see `lib/redirects.ts`. Unit tests TBD.)
- [x] Security headers visible on every public route via `curl -I`. (Shipped — `next.config.js`.)
- [x] CSP report-only deployed; report endpoint receives violations. (Shipped — `app/api/csp-report/route.ts` + `csp_violations` table.)
- [x] `npm run test:smoke` passes against local dev. (Shipped — `e2e/smoke.spec.ts`.)
- [x] All five conversion pages share `ConversionShell` and visually match the homepage. (Shipped — login / signup / forgot / reset / estimate empty state.)
- [ ] Live Stripe test payment updates portal `deposit_status` end-to-end. **(Manual QA — see `docs/phase-1-launch-qa-runbook.md` § 5; not yet executed.)**

---

# Phase 2 — Website Design Direction MVP

**Goal:** Ship the highest-leverage client-portal feature. Builds the reference implementation that Phase 3 generalizes.
**Effort:** ~5 days.

## 2.1 Why this exists

Style Tiles — fonts, colors, interface elements — communicate the essence of a visual brand and create a shared visual language between designer and client. Industry data: agencies enforcing phase sign-offs see ~60% reduction in late-stage revisions.

**Operating rule:** *Client chooses the lane. CrecyStudio drives the design. Client approves the result.*

## 2.2 What it is NOT

Clients do **not** choose: exact font families, type scale, button radius, shadows, padding, spacing systems, animations, component-level layout, unlimited inspiration links, "mix three concepts together" requests, or new direction after build starts.

## 2.3 Where it sits in the website timeline

Replace the current default milestone list with:

```ts
// lib/customerPortal.ts
const WEBSITE_DEFAULT_MILESTONES = [
  { title: "Scope confirmed",            status: "todo", sort_order: 10 },
  { title: "Design direction approved",  status: "todo", sort_order: 20 },
  { title: "Content/assets received",    status: "todo", sort_order: 30 },
  { title: "First preview ready",        status: "todo", sort_order: 40 },
  { title: "Client feedback submitted",  status: "todo", sort_order: 50 },
  { title: "Revisions complete",         status: "todo", sort_order: 60 },
  { title: "Launch approved",            status: "todo", sort_order: 70 },
  { title: "Launch & handoff",           status: "todo", sort_order: 80 },
];
```

Existing portals keep their old milestones unless regenerated.

## 2.4 Form fields

Single source for all option arrays:

```
lib/designDirection.ts
```

| Field | Type | Notes |
|---|---|---|
| `controlLevel` | `crecystudio_led \| guided_direction \| brand_guided \| premium_concept_review` | Default `crecystudio_led`. No "I want to control all design details" option. |
| `brandMood` | `string[]` (1–3) | Options: Clean, Premium, Friendly, Bold, Minimal, Modern, Luxury, Warm, Technical, Trustworthy, Energetic, Creative |
| `visualStyle` | one of | Clean & Professional / Bold & Premium / Warm & Friendly / Modern & Tech / Luxury / Local Business / Creative-Portfolio |
| `brandColorsKnown` | `yes \| no \| not_sure` | |
| `preferredColors` | `string` | Free text, no palette builder |
| `colorsToAvoid` | `string` | |
| `letCrecyChoosePalette` | `boolean` | |
| `typographyFeel` | one of | Modern and clean / Elegant and premium / Bold and strong / Friendly and approachable / Technical and minimal / Follow existing brand fonts / Let CrecyStudio choose. **No font picker.** |
| `imageryDirection` | `string[]` | Real photography, Stock, Founder/team, Product, Before/after, Icons, Illustrations, App screenshots, Minimal |
| `likedWebsites` | `{url, reason}[]` (max 3) | URL must validate as `http(s)://` |
| `dislikedWebsites` | `{url, reason}[]` (max 2) | |
| `contentTone` | `string[]` (1–2) | Professional, Friendly, Direct, Luxury, Technical, Calm, Inspirational, Playful |
| `hasLogo` | `yes \| no \| in_progress` | |
| `hasBrandGuide` | `yes \| no` | |
| `brandAssetsNotes` | `string` | |
| `clientNotes` | `string` | |
| `approvedDirectionTerms` | `boolean` | Required true to submit |

Approval copy required next to checkbox:

> I approve this design direction. CrecyStudio will make professional decisions around layout, spacing, typography, responsive behavior, and visual hierarchy based on this direction. Major style changes after approval may affect the timeline or require a change order.

## 2.5 Status model

Same enum as `ActionStatus` from §3, scoped to direction:

```
not_started → waiting_on_client → submitted → under_review →
  (changes_requested → waiting_on_client) → approved → locked
```

## 2.6 Storage (MVP)

Store in `customer_portal_projects.scope_snapshot.designDirection`. Defer dedicated table until reporting/querying becomes important.

Default value, status, and timestamps as in original Doc 3 §7. Persist `submittedAt`, `reviewedAt`, `approvedAt`, `lockedAt`, `changesRequestedAt`, `adminPublicNote`, `adminInternalNote`.

## 2.7 API actions

In `app/api/portal/[token]/route.ts`, add:

```
type: "design_direction_submit"
```

Server steps: validate token → reject demo workspace → validate required fields → enforce brandMood max 3 → validate URLs → merge into `scope_snapshot.designDirection` → set status `submitted` → set `submittedAt` → emit `design_direction_submitted` activity event → return updated bundle.

In `app/api/internal/portal/admin-update/route.ts`, add admin actions:

```
design_direction_mark_under_review
design_direction_request_changes
design_direction_approve
design_direction_lock
```

`design_direction_lock` also marks the "Design direction approved" milestone done and updates `waitingOn` to studio build step.

## 2.8 Components

```
components/portal/DesignDirectionCard.tsx
components/portal/DesignDirectionForm.tsx
components/portal/DesignDirectionSummary.tsx
components/portal/DesignDirectionStatusPill.tsx
```

Plug `DesignDirectionCard` into `app/portal/[token]/PortalClient.tsx` above the journey map.

## 2.9 Activity feed events

```
design_direction_requested
design_direction_submitted
design_direction_under_review
design_direction_changes_requested
design_direction_approved
design_direction_locked
```

## 2.10 Waiting-on logic

Update `deriveWaitingOn` in `lib/customerPortal.ts`:

```ts
if (depositStatus !== "paid") return "Client deposit step";
if (designDirection.status === "waiting_on_client") return "Client design direction";
if (designDirection.status === "submitted")        return "CrecyStudio design direction review";
if (designDirection.status === "changes_requested")return "Client design clarification";
if (assetsCount === 0)                             return "Client assets / content";
if (previewUrl && clientReviewStatus === "Pending review") return "Client preview review";
if (clientReviewStatus === "Changes requested")    return "CrecyStudio revisions";
return "CrecyStudio next build step";
```

## 2.11 Locked-state copy

Show in workspace once direction is locked:

> Design direction is locked. Feedback should focus on content accuracy, clarity, missing information, bugs, and reasonable polish. Major visual changes may affect the timeline or require a change order.

## Phase 2 acceptance criteria

- [x] Website-lane portals render the Design Direction card. (Phase 2A.)
- [x] Form submits successfully and saves to `scope_snapshot.designDirection`. (Phase 2A.)
- [x] Admin can review, approve, lock, and request changes. (Phase 2B.)
- [x] Locking marks "Design direction approved" milestone complete. (Phase 2B; uses template lookup in Phase 3.5.)
- [x] Activity feed records all six event types. (Phase 2B.)
- [x] Waiting-on text reflects the direction state correctly. (Phase 2A.)
- [x] URL validation rejects malformed reference websites. (Phase 2A.)
- [x] `brandMood` enforces max 3 server-side, not just UI. (Phase 2A.)

---

# Phase 3 — Unified workflow template engine

**Goal:** Generalize Phase 2's pattern across all five lanes. Migrate the silo `ops` and `ecommerce` portals into one engine.
**Effort:** 2–3 weeks.

> This is the largest phase. It's not a config drop — three sibling portals consolidate into one engine. Plan accordingly.

## 3.1 Architecture

```
/portal
  → logged-in client project hub

/portal/[token]
  → universal workspace shell
  → resolves project_type
  → loads workflow template
  → renders lane-specific direction module
```

Shared workspace shell modules (mostly already in `PortalClient.tsx`):

- Current phase / current owner / action needed
- Timeline / milestones
- Direction module (lane-specific)
- Required Actions card
- Assets, Messages, Invoices, Agreement, Activity feed, Preview, Feedback, Launch checklist, Handoff

## 3.2 Phase 0 — schema migration

```sql
alter table customer_portal_projects
  add column if not exists project_type text;

create index if not exists idx_customer_portal_projects_project_type
  on customer_portal_projects(project_type);

-- backfill existing rows
update customer_portal_projects
  set project_type = 'website'
  where project_type is null;

-- optional dedicated required-actions table
create table if not exists customer_portal_required_actions (
  id uuid primary key default gen_random_uuid(),
  portal_project_id uuid not null references customer_portal_projects(id) on delete cascade,
  action_key text not null,
  owner text not null default 'client',
  title text not null,
  description text,
  status text not null default 'not_started',
  due_date timestamptz,
  completed_at timestamptz,
  unlocks_milestone_key text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cprr_project
  on customer_portal_required_actions(portal_project_id, status, created_at);
```

## 3.3 Phase 0 — silo portal migration

Inventory existing intakes:

- `app/portal/ops/[opsIntakeId]/OpsPortalClient.tsx` (ops schema)
- `app/portal/ecommerce/[id]/EcomPortalClient.tsx` (ecommerce schema)

Migration plan:
1. Write a one-shot migration script that creates `customer_portal_projects` rows from each silo intake, mapping ops → `automation` and ecommerce → `ecommerce`.
2. Add a redirect from old URLs to new `/portal/[token]`.
3. Keep silo routes alive but read-only for one release cycle.
4. Remove silo routes after migration is verified.

## 3.4 Workflow templates

Ship in `lib/workflows/templates.ts`. One template per lane. Each contains: milestones, required actions, launch checks, default direction payload.

| `project_type` | Direction | Template label |
|---|---|---|
| `website` | Design Direction | Website Build |
| `web_app` | Product Direction | Custom Web App |
| `automation` | Workflow Direction | Workflow Automation |
| `ecommerce` | Store Direction | E-commerce Store |
| `rescue` | Rescue Diagnosis | Website Rescue |

The full template definitions are too long to inline here — carry them forward verbatim from the original `CRECYSTUDIO_PORTAL_WORKFLOW_TEMPLATE_ENGINE.md` §6–10. Apply these adjustments:

- The `web_app` template covers BOTH custom internal tools AND client portals. Don't create a separate `client_portal` lane. Tier signals which subtype (see Phase 4 pricing).
- Drop the example "Discovery → Architecture → Wireframes" granularity at MVP if it slows you down. The only milestones that *must* exist day 1: scope confirmed, direction approved, MVP scope locked, build in progress, UAT, launch. Add the rest when you actually need them in admin.

Helper:

```ts
// lib/workflows/templates.ts
export const WORKFLOW_TEMPLATES: Record<ProjectType, WorkflowTemplate> = {
  website:    WEBSITE_WORKFLOW_TEMPLATE,
  web_app:    CUSTOM_WEB_APP_WORKFLOW_TEMPLATE,
  automation: AUTOMATION_WORKFLOW_TEMPLATE,
  ecommerce:  ECOMMERCE_WORKFLOW_TEMPLATE,
  rescue:     RESCUE_WORKFLOW_TEMPLATE,
};

export function getWorkflowTemplate(projectType: ProjectType): WorkflowTemplate {
  return WORKFLOW_TEMPLATES[projectType] ?? WORKFLOW_TEMPLATES.website;
}
```

Resolver:

```ts
// lib/workflows/resolveProjectType.ts
export function resolveProjectType({
  portal,
  quote,
  intake,
}: {
  portal?: { project_type?: string | null };
  quote?: { project_type?: string | null; quote_json?: { projectType?: string } };
  intake?: { projectType?: string };
}): ProjectType {
  const candidate =
    portal?.project_type ||
    quote?.project_type ||
    quote?.quote_json?.projectType ||
    intake?.projectType ||
    "website";
  return (
    ["website", "web_app", "automation", "ecommerce", "rescue"].includes(candidate)
      ? candidate
      : "website"
  ) as ProjectType;
}
```

## 3.5 Update `ensureCustomerPortalForQuoteId()`

In `lib/customerPortal.ts`:

```ts
const projectType = resolveProjectType({ quote });
const workflowTemplate = getWorkflowTemplate(projectType);

const scopeSnapshot = {
  ...buildScopeSnapshotFromQuote(quote),
  projectType,
  workflowTemplate: workflowTemplate.label,
  direction: workflowTemplate.direction,
  requiredActions: workflowTemplate.requiredActions,
  launchChecks: workflowTemplate.launchChecks,
};

const { data: created } = await supabaseAdmin
  .from("customer_portal_projects")
  .insert({
    quote_id: quoteId,
    access_token: makeToken(),
    project_type: projectType,
    project_status: "new",
    client_status: "new",
    deposit_status: "pending",
    scope_snapshot: scopeSnapshot,
  })
  .select("*")
  .single();

await supabaseAdmin.from("customer_portal_milestones").insert(
  workflowTemplate.milestones.map((m) => ({
    portal_project_id: created.id,
    title: m.title,
    status: "todo",
    sort_order: m.sortOrder,
    notes: `Owner: ${m.owner}`,
  }))
);
```

## 3.6 Direction module resolver

```
components/portal/directions/WebsiteDesignDirectionModule.tsx   ← reuse Phase 2 work
components/portal/directions/ProductDirectionModule.tsx
components/portal/directions/WorkflowDirectionModule.tsx
components/portal/directions/StoreDirectionModule.tsx
components/portal/directions/RescueDiagnosisModule.tsx
components/portal/directions/DirectionModuleResolver.tsx
components/portal/RequiredActionsCard.tsx
```

```tsx
export function DirectionModuleResolver({ bundle }: { bundle: PortalBundle }) {
  switch (bundle.scopeSnapshot?.direction?.type) {
    case "product_direction":  return <ProductDirectionModule bundle={bundle} />;
    case "workflow_direction": return <WorkflowDirectionModule bundle={bundle} />;
    case "store_direction":    return <StoreDirectionModule bundle={bundle} />;
    case "rescue_diagnosis":   return <RescueDiagnosisModule bundle={bundle} />;
    case "design_direction":
    default:                   return <WebsiteDesignDirectionModule bundle={bundle} />;
  }
}
```

**Sequencing:** ship `WorkflowDirectionModule` and `StoreDirectionModule` next (you already have ops + ecom data shapes from the silos). Defer `ProductDirectionModule` and `RescueDiagnosisModule` until you have a real client in those lanes — but their workflow templates and milestones must already exist so the portal renders.

## 3.7 Generic portal API actions

In `app/api/portal/[token]/route.ts`, add:

```
direction_submit
required_action_submit
client_action_complete
```

`direction_submit` validates `direction.type` against `ALLOWED_DIRECTION_BY_PROJECT_TYPE` for the resolved project type. Deprecate `design_direction_submit` from Phase 2 (alias it for one release cycle).

In `app/api/internal/portal/admin-update/route.ts`:

```
direction_changes_requested
direction_approve
direction_lock
required_action_update
milestone_update
public_note_update
internal_note_update
launch_check_update
```

## 3.8 Activity feed events (lane-aware)

```
direction_requested
direction_submitted
direction_changes_requested
direction_approved
direction_locked
required_action_completed
required_action_reopened
milestone_completed
launch_check_completed
uat_feedback_submitted
admin_public_note_updated
```

Display text adapts by `directionType`:

| Direction type | Event text |
|---|---|
| `design_direction` | Design direction submitted |
| `product_direction` | Product direction submitted |
| `workflow_direction` | Workflow direction submitted |
| `store_direction` | Store direction submitted |
| `rescue_diagnosis` | Rescue diagnosis submitted |

## 3.9 Phase-gate audit trail

When direction is approved or locked, capture:
- `actorUserId` (admin) or `clientToken` (client)
- `userAgent`
- `ip` (request header)
- `at` timestamp

Store on the activity event payload. This is the audit trail that backs change-order conversations later.

## 3.10 Admin dashboard (defer if needed)

Admin controls per lane are listed in original Doc 2 §15, §18. Build the *minimum* admin surface needed to run a project end-to-end:

- Approve / lock / request-changes buttons for direction
- Required-actions list with mark-complete
- Public note + internal note
- Milestone toggle
- Launch checklist toggle

Defer everything else (UAT classification, separate per-lane admin views) until you have repeat operational pain.

## Phase 3 acceptance criteria

- [x] `customer_portal_projects.project_type` is populated for every new portal. (Phase 3.2 — `ensureCustomerPortalForQuoteId` sets it explicitly.)
- [x] A website quote creates a website portal with Design Direction. (Regression-verified.)
- [x] A web_app quote creates a web_app portal with Product Direction. (Phase 3.3.)
- [x] An automation quote creates an automation portal with Workflow Direction. (Phase 3.3.)
- [x] An ecommerce quote creates an ecommerce portal with Store Direction. (Phase 3.3.)
- [x] A rescue quote creates a rescue portal with Rescue Diagnosis. (Phase 3.3.)
- [x] Each portal renders the correct milestones and required-actions card. (Phase 3.3 / 3.9 / 3.10.)
- [x] Admin can approve/lock/request-changes from the unified admin view. (Phase 3.5 — `DirectionAdminPanel`.)
- [x] Old `/portal/ops/*` and `/portal/ecommerce/*` URLs redirect to `/portal/[token]`. (Cleanup pass — silo redirects.)
- [x] Legacy quotes without `project_type` default to `website`. (Phase 3.2 — `isProjectType` fallback.)
- [x] Existing website portal behavior does not break. (Phase 2A code untouched.)
- [x] Phase 3.8 silo migration: 13 ops + 3 ecom intakes bridged to unified portals. Idempotent.

---

# Phase 4 — Pricing reconciliation and publication

**Goal:** Bring pricing config in line with the 5-lane enum, raise under-market lanes, then publish.
**Effort:** 1–2 days config + content.

> Do not publish new lanes on the marketing site until Phase 3's acceptance criteria pass.

## 4.1 Reconciled pricing (validated against 2026 market data)

Update `lib/pricing/config.ts`. Rename `ops` → `automation`, add `web_app` and `rescue`.

### Website (unchanged from current — fair to slightly low)

| Tier | Range | Notes |
|---|---|---|
| Starter Site | $1,800–$2,400 | Single-page or very small. Keep tightly scoped. |
| Growth Site | $3,500–$4,500 | Main conversion package. Could push to $4k–$6k. |
| Premium Build | $6,500–$10,000+ | Needs explicit "what makes it premium" copy. |

### Web app — **NEW lane, raised vs original audit**

| Tier | Doc-1 said | Use this | Why |
|---|---|---|---|
| Small internal tool | $5k–$9k | **$8k–$15k** | Industry MVP floor is $8k. |
| Portal / dashboard MVP | $8k–$18k | **$15k–$30k** | Industry medium portal: $40k–$80k. Solo studio can be cheaper but $8k is unsustainable. |
| SaaS MVP / multi-tenant | $15k–$35k+ | **$25k–$50k+** | Industry subscription SaaS: $28k–$42k. |
| Full-feature client portal (payments + files + messaging + admin) | $12k–$25k+ | **$22k–$45k+** | This is your strongest differentiator — don't underprice. |

### Automation (formerly `ops` — unchanged)

| Tier | Range |
|---|---|
| Quick Workflow Fix | $1,000–$1,800 |
| Ops System Build | $2,000–$3,800 |
| Ongoing Systems Partner | $500–$1,250/mo |

### E-commerce (slight raise on Growth)

| Tier | Use this |
|---|---|
| Launch Store Build | $1,800–$3,200 |
| Growth Store Build | $3,500–$6,500 (raised from $3.2–5.2k) |
| Commerce Repair Sprint | $1,200–$2,200 |
| Commerce Growth Repair | $2,300–$4,200 |
| E-commerce Ops Support | Setup $500–$900 + $900–$1,800/mo |
| Managed Commerce Partner | Setup $1,200–$2,200 + $1,800–$3,200/mo |

### Rescue — **NEW lane**

| Tier | Range |
|---|---|
| Basic rescue | $800–$1,500 |
| Full rescue sprint | $1,500–$3,500 |
| Rescue + rebuild | Routes into Website Growth/Premium |

### Care plans (raise floor)

| Tier | Use this | Note |
|---|---|---|
| Essential Care | $199–$299/mo (raised from $150) | $199 is SMB realistic floor. |
| Growth Care | $350–$750/mo | |
| Studio Partner | $900–$1,500+/mo | |

## 4.2 Public price-positioning copy

Use this on the homepage / pricing page:

> Small websites start at $1,800. Most serious business websites land between $3,500 and $4,500. Custom systems, portals, and apps are scoped separately because they involve workflows, databases, permissions, and integrations.

## 4.3 Scope-creep protection (apply across every quote)

- 2–3 revision rounds per deliverable, hard-capped per tier.
- Consolidated written feedback per round (enforced in portal UI).
- Written change-order language: "Since this is outside our original scope, I'll put together a quick change order."
- Phase-gate sign-offs (Phase 3 audit trail backs this).
- Separate pricing for: copywriting, SEO content, integrations, product migration, custom dashboards, urgent timelines.

## Phase 4 acceptance criteria

- [x] `lib/pricing/config.ts` exports all 5 lanes with reconciled prices. (`WEB_APP_TIER_CONFIG`, `RESCUE_TIER_CONFIG`, `AUTOMATION_TIER_CONFIG`, `ECOMMERCE_TIER_CONFIG`, `WEBSITE_TIER_CONFIG`.)
- [x] `lib/pricing/types.ts` `PricingLane` matches `ProjectType` exactly. (Cleanup pass dropped `"ops"` from the union; `normalizePricingLane` accepts legacy data on read.)
- [x] Quote engine produces estimates for all 5 lanes. (`getWebsitePricing`, `getAutomationPricing`, `getEcommercePricing`, `getWebAppPricing`, `getRescuePricing`.)
- [x] Public marketing pages updated for `/custom-web-apps`, `/client-portals`, `/website-rescue`. (`/client-portals` raised to $22k–$45k per audit; `/custom-web-apps` and `/website-rescue` already showed audit-aligned ranges.)
- [ ] Sitemap includes all current service pages. **(Not verified — TBD.)**

### `ops → automation` rename (Phase 4 follow-up — shipped)

- [x] `PricingLane` no longer includes `"ops"`. `normalizePricingLane` maps stored `"ops"` to `"automation"` on read.
- [x] `lib/pricing/ops.ts` renamed to `lib/pricing/automation.ts`. Exports `getAutomationPricing` (canonical) and `getOpsPricing` (deprecated alias).
- [x] `OPS_TIER_CONFIG` is a deprecated alias of `AUTOMATION_TIER_CONFIG` (object identity — same labels).
- [x] Stripe metadata, deposit success page, webhook, and Ghost subsystem all write `"automation"` and accept `"ops"` on read.
- [ ] Caller-side migration of `getOpsPricing` imports → `getAutomationPricing`. **(Out of scope; aliases keep callers working.)**

---

# Phase 5 — SEO and polish (post-launch)

Not blockers. Tackle after Phase 4 ships.

- [ ] Page-specific Open Graph images
- [ ] Refresh old homepage metadata / search snippets
- [x] **Structured data: Organization, Service** (shipped — `app/layout.tsx` emits Organization JSON-LD on every page; `components/service-page/ServicePage.tsx` emits Service JSON-LD per service page). LocalBusiness still TBD.
- [ ] Internal links from blog/help pages once content exists
- [ ] "Recent work" section
- [ ] Founder-led case studies
- [ ] Pricing comparison page
- [ ] Public FAQ: deposits, ownership, revisions, timelines
- [ ] Downloadable proposal PDF after quote submission
- [ ] **Promote CSP report-only → enforcing.** Status: still report-only as of last check. The plan called for a 2-week observation window before promotion. To execute: query `select count(*), violated_directive from csp_violations where received_at > now() - interval '14 days' group by violated_directive`; once only known sources (Stripe, Supabase, Vercel Analytics, Google Fonts) appear, change `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `next.config.js`.

---

## Sequencing summary

| Week | Phase | Output |
|---|---|---|
| 1 | Phase 1 | Security, redirects, CSP report-only, npm test scripts, ConversionShell, live Stripe QA |
| 2 | Phase 2 | Design Direction MVP for website lane |
| 3–4 | Phase 3 | Unified workflow engine; migrate ops + ecommerce silos |
| 5 | Phase 4 | Pricing reconciled, new lanes published |
| 6+ | Phase 5 | SEO, structured data, polish |

---

## Cross-phase acceptance criteria (full launch readiness)

- [ ] All Phase 1 boxes checked.
- [ ] All Phase 2 boxes checked.
- [ ] All Phase 3 boxes checked.
- [ ] All Phase 4 boxes checked.
- [ ] `npm run lint && npm run build && npm run test:smoke` passes in CI.
- [ ] Live submission verified through every intake lane.
- [ ] Stripe checkout → webhook → portal verified end-to-end.
- [ ] Admin dashboard sees quote, status, messages, project workspace.
- [ ] CSP enforcing (post-report-only window).
- [ ] Public pricing matches `lib/pricing/config.ts`.

---

## Operating principle

The client portal answers:
> What do I need to do right now?

The admin dashboard answers:
> What am I waiting on, and what do I need to do next?

That's how CrecyStudio becomes a project operating system rather than a client dashboard.

---

## References (validated May 2026)

- [Style Tiles — Samantha Warren](https://styletil.es/)
- [What is a style tile? — Kanopi Studios](https://kanopi.com/blog/what-is-a-style-tile-or-mood-board-and-why-is-it-helpful/)
- [Style Tiles: A Design Teaser, Not the Homepage — Forge and Smith](https://forgeandsmith.com/blog/style-tiles-design-homepage/)
- [Service Blueprints: Definition — Nielsen Norman Group](https://www.nngroup.com/articles/service-blueprints-definition/)
- [Frontstage and Backstage — Interaction Design Foundation](https://ixdf.org/literature/topics/frontstage-and-backstage)
- [Open Redirect — OWASP Foundation](https://owasp.org/www-community/attacks/open_redirect)
- [Unvalidated Redirects and Forwards Cheat Sheet — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [Content Security Policy Guide — Next.js](https://nextjs.org/docs/app/guides/content-security-policy)
- [next.config.js headers reference — Next.js](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers)
- 2026 pricing benchmarks: GruffyGoat, Levitate, Elementor, UX Continuum, SpaceO, SPP, Agency Handy, Liquid Web Developers, Tuesday, Outerbox, Shopify
