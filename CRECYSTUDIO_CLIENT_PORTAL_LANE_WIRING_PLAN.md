# CrecyStudio — Client Portal Lane Wiring Plan (Week 1)

Status: planning · not yet implemented
Owner: Komlan
Scope: wire the Client Portal lane end-to-end so portal-lane intakes stop
dead-ending into the generic estimate flow

## Goal

Make Client Portal a coherent service lane like Custom Web App, Automation,
E-commerce, and Rescue: intake → pricing → workflow template → portal
direction → admin pipeline.

Right now the lane is **half-built** and **structurally broken**:

- ✅ Marketing landing page at `/client-portals` (4 pricing tiers, 8 FAQs)
- ✅ Intake form at `/portal-intake` (22 questions, depth on par with other
  lanes)
- ❌ **No `client_portal` in the `ProjectType` union** —
  `lib/workflows/types.ts:10-15` has only website, web_app, automation,
  ecommerce, rescue
- ❌ **No `portal_direction` in the `DirectionType` union** — same file
  lines 17-23
- ❌ **No workflow template** in `lib/workflows/templates.ts` — every other
  lane has one with milestones, required actions, launch checks
- ❌ **No pricing engine** at `lib/pricing/portal.ts` — landing page
  advertises 4 tiers but intake produces no recommendation
- ❌ **Intake POSTs to `/api/submit-estimate`** (the *website* intake
  endpoint at `PortalIntakeClient.tsx:186`) — so leads get misclassified
  as website projects

Net effect: a customer fills out 22 portal-intake questions, the lead
becomes either a website lead or a generic estimate, and they never get
the structured portal experience the landing page promised.

## What this plan does NOT do (deliberately scoped out)

- **Decision log** — separate plan (Week 2). It's lane-agnostic and will
  benefit every lane including Client Portal.
- **Weekly Friday digest** — separate plan (Week 3).
- **Mobile-friendly approval surface** for the generic `DirectionForm` —
  separate plan; reuses the patterns from
  `CRECYSTUDIO_DESIGN_DIRECTION_UPGRADE_PLAN.md` Task 5.
- **Expanding the other generic-direction schemas (store_direction,
  product_direction, workflow_direction, rescue_diagnosis) past their
  current 5-6 field state** — those lanes work today, just thin. Even-
  coverage strategy that the studio deferred in favor of reliability.
- **Building lane-specific admin panels** beyond what the Client Portal
  lane needs — admin pipelines for Custom Web App and Rescue can wait.

## File map

Lane wiring touches both sides + i18n:

**Type definitions (the foundation):**
- `lib/workflows/types.ts` — extend `ProjectType` + `DirectionType` unions

**Direction module:**
- `lib/directions/schemas.ts` — add `PORTAL_DIRECTION_SCHEMA`
- `lib/directions/validate.ts` — add a case for `portal_direction` (likely
  a switch on direction.type — confirm and extend)
- `lib/directions/state.ts` — confirm no per-type branching is needed

**Workflow + pricing:**
- `lib/workflows/templates.ts` — add `CLIENT_PORTAL_WORKFLOW_TEMPLATE` and
  register it in the `WORKFLOW_TEMPLATES` map (line 398)
- `lib/pricing/portal.ts` — **new file**, mirrors `lib/pricing/web_app.ts`

**Intake routing:**
- `app/[locale]/portal-intake/PortalIntakeClient.tsx` line 186 — point to
  the right submit endpoint and pass `projectType: "client_portal"`
- `app/api/submit-estimate/route.ts` (or whatever the portal endpoint
  becomes) — branch on `projectType` to call `getPortalPricing()` and tag
  the lead correctly. Locate during implementation.

**Existing types map fanout (TS will flag these via exhaustive switches):**
- `lib/adminProjectData.ts` — has an overlapping ProjectType per
  `types.ts:9` comment ("Other modules currently define overlapping
  ProjectType enums"). Extend.
- `lib/pricing/types.ts` — same.
- Any `switch (projectType)` or `Record<ProjectType, ...>` is a TS-flagged
  callsite once the union grows. Fix each.

**Component layer (likely needs no changes — confirm):**
- `components/portal/directions/DirectionModuleResolver.tsx` should work
  unchanged since portal_direction will flow through the generic
  `DirectionCard`. Verify.
- `components/internal/` — the generic `DirectionAdminPanel` handles
  portal_direction without modification.

**Admin (Client Portal pipeline — DEFERRED to a later track):**
- A dedicated `app/internal/admin/portals/` pipeline like
  `ecommerce/`/`ops/` is *nice-to-have* but not required for this lane to
  function. Lane works with the shared `ProjectControlClient`. Track
  separately if you want it.

**i18n (translations):**
- `messages/en.json`, `messages/fr.json`, `messages/es.json` — wherever
  direction/lane labels live. The DirectionForm already pulls field
  labels from the schema, so per-field i18n may not be needed; confirm.

---

## Task 1 — Extend `ProjectType` and `DirectionType` unions

**Effort:** 30 minutes (most of the time is fixing every TS error the
expansion triggers)
**Why:** every downstream piece (workflow template, pricing, intake
routing) gates on these unions. They're the foundation.

### Change

In `lib/workflows/types.ts`:

```ts
export type ProjectType =
  | "website"
  | "web_app"
  | "automation"
  | "ecommerce"
  | "rescue"
  | "client_portal";

export type DirectionType =
  | "design_direction"
  | "product_direction"
  | "workflow_direction"
  | "store_direction"
  | "rescue_diagnosis"
  | "portal_direction";
```

### Backward compat

The "overlapping ProjectType enums" comment at `types.ts:9` means
`lib/adminProjectData.ts` and `lib/pricing/types.ts` define their own
`ProjectType` unions. Extend them in parallel. Anywhere TypeScript flags
a missing case, add `client_portal` handling.

### Acceptance criteria

- `npm run lint` passes
- No runtime regressions on other lanes

---

## Task 2 — Add `PORTAL_DIRECTION_SCHEMA`

**Effort:** 1–2 hours (the design work is picking the right fields, not
the typing)
**Why:** the portal-direction module needs a schema to drive
`DirectionForm` rendering + `validateDirectionPayload` validation.

### Schema design

Based on what the portal-intake form already captures (22 questions) and
what the 2026 boutique research said portal projects need to discover
(user-role inventory + permissions matrix + integrations + audit-trail
spec), propose ~7 fields:

```ts
// In lib/directions/schemas.ts
export const PORTAL_DIRECTION_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "portalPurpose",
      label: "What does this portal do?",
      type: "textarea",
      required: true,
      helpText:
        "One paragraph describing the portal's core job and the problem it solves for your team or clients.",
      maxLength: 4000,
    },
    {
      key: "accessType",
      label: "Who has access?",
      type: "select",
      required: true,
      options: ["Clients only", "Team only", "Both clients and team", "External partners"],
    },
    {
      key: "userRoles",
      label: "User roles",
      type: "string-list",
      required: true,
      helpText:
        "e.g. Admin, Reviewer, Billing-only, External Partner. Separate from raw permissions — combine when a user has multiple roles.",
      maxItems: 8,
    },
    {
      key: "keyFeatures",
      label: "Must-have features",
      type: "string-list",
      required: true,
      helpText: "The 3–5 features the portal can't ship without.",
      maxItems: 10,
    },
    {
      key: "integrations",
      label: "Existing systems to connect",
      type: "string-list",
      helpText:
        "CRM, accounting, file storage, Airtable/Sheets/Postgres — what the portal needs to read/write.",
      maxItems: 12,
    },
    {
      key: "notificationsNeeded",
      label: "What should trigger notifications?",
      type: "textarea",
      helpText:
        "Which events should email or in-app notify? Helps us scope the audit-trail and notification system.",
      maxLength: 2000,
    },
    {
      key: "successMetric",
      label: "How will you know it's working?",
      type: "textarea",
      required: true,
      helpText: "What changes about your operation when this portal is live?",
      maxLength: 2000,
    },
  ],
};
```

### Validator

`lib/directions/validate.ts` — find the per-type validation logic (likely
a switch). Add the `portal_direction` case that maps over the schema's
fields. The existing pattern for other types should be reusable.

### Acceptance criteria

- Schema renders in the client-side form
- Validator rejects payloads with missing required fields
- Validator accepts well-formed payloads

---

## Task 3 — Add `CLIENT_PORTAL_WORKFLOW_TEMPLATE`

**Effort:** 1–2 hours (design the milestone arc; mostly mechanical typing)
**Why:** without a workflow template, `ensureCustomerPortalForQuoteId`
won't know what milestones / required actions / launch checks to seed.

### Template design

Modeled on `CUSTOM_WEB_APP_WORKFLOW_TEMPLATE` (`templates.ts:86-180`)
since a client portal IS a custom app from a build perspective, but with
portal-flavored milestones:

```ts
export const CLIENT_PORTAL_WORKFLOW_TEMPLATE: WorkflowTemplate = {
  projectType: "client_portal",
  label: "Client Portal",
  directionType: "portal_direction",
  milestones: [
    { key: "discovery_complete", title: "Discovery complete", owner: "studio", sortOrder: 10 },
    { key: "portal_direction_approved", title: "Portal direction approved", owner: "client", sortOrder: 20 },
    { key: "roles_permissions_locked", title: "Roles & permissions locked", owner: "client", sortOrder: 30 },
    { key: "integration_plan_confirmed", title: "Integration plan confirmed", owner: "client", sortOrder: 40 },
    { key: "ux_flow_approved", title: "Wireframes / UX flow approved", owner: "client", sortOrder: 50 },
    { key: "foundation_built", title: "Portal foundation built", owner: "studio", sortOrder: 60 },
    { key: "features_built", title: "Core features built", owner: "studio", sortOrder: 70 },
    { key: "integrations_connected", title: "Integrations connected", owner: "studio", sortOrder: 80 },
    { key: "qa_complete", title: "QA testing complete", owner: "studio", sortOrder: 90 },
    { key: "uat_complete", title: "Client UAT complete", owner: "client", sortOrder: 100 },
    { key: "production_launch", title: "Production launch", owner: "studio", sortOrder: 110 },
    { key: "handoff_support", title: "Handoff & support", owner: "studio", sortOrder: 120 },
  ],
  requiredActions: [
    {
      key: "complete_portal_direction",
      title: "Complete Portal Direction",
      description: "Confirm portal purpose, access type, user roles, features, integrations, notifications, and success metric.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "portal_direction_approved",
    },
    {
      key: "approve_roles_permissions",
      title: "Approve roles & permissions matrix",
      description: "Sign off on the role-by-permission grid we'll build against.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "roles_permissions_locked",
    },
    {
      key: "approve_integrations_plan",
      title: "Approve integrations plan",
      description: "Sign off on the list of external systems and how the portal reads/writes each.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "integration_plan_confirmed",
    },
    {
      key: "approve_wireframes",
      title: "Approve UX flow / wireframes",
      description: "Review the main screens and workflow sequence before full development.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "ux_flow_approved",
    },
    {
      key: "complete_uat",
      title: "Complete UAT testing",
      description: "Test the portal using real scenarios and submit issues in one complete batch.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "uat_complete",
    },
    {
      key: "approve_production_launch",
      title: "Approve production launch",
      description: "Confirm the portal is ready for production use.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "production_launch",
    },
  ],
  launchChecks: [
    { key: "production_env", title: "Production environment configured", owner: "studio" },
    { key: "auth_permissions", title: "Authentication & per-role permissions tested", owner: "studio" },
    { key: "database_writes", title: "Database writes tested", owner: "studio" },
    { key: "integrations", title: "All integrations tested", owner: "studio" },
    { key: "audit_trail", title: "Audit trail logged for sensitive actions", owner: "studio" },
    { key: "email_notifications", title: "Email/notifications tested", owner: "studio" },
    { key: "admin_access", title: "Admin access confirmed", owner: "studio" },
    { key: "handoff_docs", title: "Handoff documentation provided", owner: "studio" },
  ],
  direction: {
    type: "portal_direction",
    status: "waiting_on_client",
    payload: {
      portalPurpose: "",
      accessType: "",
      userRoles: [],
      keyFeatures: [],
      integrations: [],
      notificationsNeeded: "",
      successMetric: "",
    },
  },
};
```

### Register the template

`lib/workflows/templates.ts:398-405` — add the entry:

```ts
export const WORKFLOW_TEMPLATES: Record<ProjectType, WorkflowTemplate> = {
  website: WEBSITE_WORKFLOW_TEMPLATE,
  web_app: CUSTOM_WEB_APP_WORKFLOW_TEMPLATE,
  automation: AUTOMATION_WORKFLOW_TEMPLATE,
  ecommerce: ECOMMERCE_WORKFLOW_TEMPLATE,
  rescue: RESCUE_WORKFLOW_TEMPLATE,
  client_portal: CLIENT_PORTAL_WORKFLOW_TEMPLATE,
};
```

### Acceptance criteria

- Creating a `client_portal` project seeds the milestones, required
  actions, and launch checks
- The 12-milestone customer journey strip renders for portal clients
- `ensureCustomerPortalForQuoteId` doesn't throw for `projectType:
  "client_portal"`

---

## Task 4 — Add `lib/pricing/portal.ts`

**Effort:** half day (the design work is mapping intake questions to
tiers; the typing is short)
**Why:** the landing page advertises 4 pricing tiers; the intake produces
no recommendation today. Sales conversation breaks on "what will this
cost?"

### Approach

Mirror `lib/pricing/web_app.ts` structurally. Inputs are the intake
fields (access type, user count, feature set size, integration count,
budget, timeline). Output is a tier recommendation matching the 4 tiers
on `/client-portals` (add-on / standalone / advanced / enterprise — read
exact names from `lib/service-pages.ts:1166-1345`).

```ts
// lib/pricing/portal.ts
export type PortalPricingInput = {
  accessType: "clients" | "team" | "both" | "partners";
  userCount: "1-10" | "11-50" | "51-200" | "200+" | "unknown";
  featureCount: number;
  integrationCount: number;
  budget: "under_5k" | "5k-10k" | "10k-25k" | "25k-50k" | "50k+" | "unknown";
  hardDeadline: "yes" | "no" | "soft";
  techTeam: "none" | "some" | "yes";
};

export type PortalPricingResult = {
  tier: "add_on" | "standalone" | "advanced" | "enterprise";
  estimateLow: number;
  estimateHigh: number;
  rationale: string;
  flags: string[];
};

export function getPortalPricing(input: PortalPricingInput): PortalPricingResult {
  // … scoring + tier selection logic
}
```

### Acceptance criteria

- A buyer who picks "clients only / 1-10 users / 3 features / 1
  integration" gets the lowest tier
- Enterprise inputs route to the enterprise tier
- Returned tier matches what `/client-portals` lists
- Unit-testable (add test in `lib/__tests__/`)

---

## Task 5 — Wire the intake submit + routing

**Effort:** ~half day
**Why:** the intake form currently posts to the *website* estimate
endpoint (`PortalIntakeClient.tsx:186` → `/api/submit-estimate`). The
lead gets created without `projectType: "client_portal"`.

### Change

Two parts:

**Frontend (`PortalIntakeClient.tsx`):**

Either:
- (a) Keep submitting to `/api/submit-estimate` but pass an explicit
  `projectType: "client_portal"` in the body, OR
- (b) Submit to a new dedicated `/api/portal-intake/submit` endpoint that
  knows the lane.

Recommend (a) — less new surface area, follows the pattern Custom Web App
already uses (it shares the same endpoint per the codebase recon).

**Backend (`app/api/submit-estimate/route.ts` — locate during impl):**

Branch on `projectType`. When `"client_portal"`:
- Call `getPortalPricing()` instead of the website pricing engine
- Persist the lead with the right `projectType` so admin sees it as a
  portal lane

### Acceptance criteria

- A portal-intake submission creates a lead with
  `projectType: "client_portal"` in the quotes table
- Admin dashboard's master list shows the new lead's tier as "portal"-
  labeled (not "website" / "unspecified")
- The submission triggers the correct workflow template when
  `ensureCustomerPortalForQuoteId` runs (Task 3 makes this work)

---

## Task 6 — End-to-end verification on production

**Effort:** ~1 hour (Playwright test, mirroring the pattern used for DD)
**Why:** confirm the lane works end-to-end, the same way we just verified
the DD upgrade.

### Steps

1. As the test customer, submit the `/portal-intake` form
2. As admin, mark the resulting lead's deposit paid (via the same admin
   API used in DD testing)
3. Confirm the portal is created with `portal_direction` populated
4. Confirm the customer sees the 7-field direction form on their portal
5. Submit + admin approve + lock the direction
6. Customer journey shows the 12 portal milestones

Reuse the Playwright harness in `/tmp/dd-test/` from the DD test.

### Acceptance criteria

- Test runs green end-to-end
- Customer sees the new portal-direction form
- Admin sees the lane correctly in the master list

---

## Build order

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 1 | Extend `ProjectType` + `DirectionType` unions | 30 min | TS-error sweep included |
| 2 | Add `PORTAL_DIRECTION_SCHEMA` + validator case | 1–2 hr | |
| 3 | Add `CLIENT_PORTAL_WORKFLOW_TEMPLATE` + register | 1–2 hr | |
| 4 | Build `lib/pricing/portal.ts` | half day | Includes unit test |
| 5 | Wire intake submit + routing | half day | |
| 6 | End-to-end Playwright verification | 1 hr | |

Total: **~3–4 focused days**. Matches the original estimate.

---

## Cross-cutting admin-side checklist

Before marking each task done:

- [ ] `app/internal/admin/[id]/ProjectControlClient.tsx` doesn't reference a
      stale field name — handles the new project type
- [ ] The generic `DirectionAdminPanel` renders for `portal_direction`
      without throwing
- [ ] `app/api/internal/portal/admin-update/route.ts` accepts and persists
      portal direction transitions
- [ ] Admin master list shows portal projects with a "Client Portal" lane
      label (not "website" / "unspecified")
- [ ] Old website/web_app/etc. projects still render correctly — no
      regression from the union expansion

---

## Open questions / decisions still needed

1. **Should portal lane reuse the Custom Web App admin pipeline or get
   its own?** Recommend reuse for now; build a dedicated pipeline later
   if portal volume justifies it. Confirm.
2. **Schema field count.** Proposed 7 fields. Could go to 5 (lighter) or
   9 (more thorough). Komlan to confirm.
3. **i18n approach for the new field labels.** The existing
   product_direction labels are hardcoded English in the schema. Same
   pattern? Or i18n-key them from the start? Default: hardcoded English
   for consistency; revisit later.
4. **Dedicated admin pipeline** (`app/internal/admin/portals/`) — yes/no
   for this sprint? Default: defer.

---

## What this unblocks

Once the lane is wired:

- **Sales no longer dead-ends** on portal intakes
- **Decision log** (Week 2 plan) will write to the same shape across all
  lanes including portal
- **Weekly digest** (Week 3 plan) will use the same milestone state
- The studio can finally honor the `/client-portals` landing page
  promise: "fixed scope, known price" + structured workspace experience

## After this ships

The next-week tracks are independent of each other but follow naturally:

- **Week 2:** Decision log (`CRECYSTUDIO_DECISION_LOG_PLAN.md`) — write it
  before implementing; lane-agnostic so it benefits website + portal +
  ecommerce + web_app + automation + rescue at once.
- **Week 3:** Weekly Friday digest (`CRECYSTUDIO_WEEKLY_DIGEST_PLAN.md`)
  — same scope-once-benefit-everywhere pattern.

The Automation Roadmap productization (the margin play from the research)
is parked until after these three reliability tracks ship.
