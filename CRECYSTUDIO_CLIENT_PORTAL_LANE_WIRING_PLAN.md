# CrecyStudio — Client Portal Lane Wiring Plan (Week 1) — v2

Status: planning · not yet implemented · revised after verification reads
Owner: Komlan
Scope: wire the Client Portal lane end-to-end so portal-lane intakes get
the right project type, the right direction schema (matching intake
depth), and the right pricing engine

## Why v2

V1 of this plan had real flaws I caught on self-review and verified
against the code. Material corrections:

- **Portal intake is mistagged, not dead-ending.** `PortalIntakeClient.tsx:186`
  posts `projectType: "web_app"` with `intakeRaw.projectSubType: "portal"`.
  Existing portal clients run through the **Custom Web App** workflow + a
  generic `product_direction` form — not "estimate limbo" as v1 claimed.
  Defect: real but less acute. Mistagging means portal-specific intake
  data (access type, multi-tenancy, compliance) is captured then ignored
  because the direction form doesn't ask for it.
- **Validator is lane-agnostic.** `lib/directions/validate.ts:81` reads
  the schema via `getDirectionSchema(directionType)` and validates
  field-by-type. Adding `portal_direction` is just registering the
  schema — no validator case to add. Saves ~1 hr.
- **Three pricing tiers, not four.** Verified at
  `lib/service-pages.ts:1232-1255`: Portal add-on ($5k–$10k), Standalone
  ($22k–$45k), Enterprise (From $75k).
- **TS sweep is wider than 30 min.** Five concrete callsites identified
  (listed below). Closer to ~1.5 hr realistically.
- **Schema must be richer than v1's 7 fields.** V1 reproduced the very
  depth-then-collapse defect this plan exists to fix. Now 12 fields
  matching intake depth + boutique research (permissions matrix, audit
  trail, data-isolation, integration flows).
- **Existing mistagged leads** need an operational decision: migrate
  to `client_portal` or leave as `web_app`. Plan addresses it.
- **Schema duplication-vs-extension** trade-off flagged for your call.
- **Sequencing reconsidered** — now that we know Portal isn't dead-ending,
  the case for "fix Portal first" vs "ship Decision Log first" weakens.
  Discussion below.

## Goal

Make Client Portal a coherent first-class lane: intake correctly tagged
→ portal-specific pricing → portal-specific workflow template → portal-
specific direction schema → admin pipeline that treats it as its own
lane.

## What this plan does NOT do (deliberately scoped out)

- Decision log, weekly digest, mobile-friendly approvals on the generic
  `DirectionForm` — Week 2/3 plans
- Expanding other generic schemas past their current 5-6 fields
- Dedicated `app/internal/admin/portals/` pipeline (defer until volume
  justifies; lane works with shared pipeline)
- i18n of direction form labels — same gap exists on every other lane;
  it's a separate i18n track

## Verified file map

**Type definitions (foundation):**
- `lib/workflows/types.ts:10-15` — `ProjectType` union (add `client_portal`)
- `lib/workflows/types.ts:17-23` — `DirectionType` union (add `portal_direction`)
- `lib/workflows/types.ts:82-89` — `ALLOWED_DIRECTION_BY_PROJECT_TYPE`
  strict map (**critical — v1 missed this**)
- `lib/workflows/types.ts:91+` — `PROJECT_TYPES` readonly array

**TS exhaustive callsites that will flag** (verified via grep):
- `lib/customerPortal.ts:628-643` — `directionLabelForProjectType` switch
- `lib/customerPortal.ts:645-660` — admin equivalent switch
- `app/api/internal/admin/pre-contract/route.ts:54, 69, 112` — three switches
  for pre-contract draft titles/bodies/templates

**Direction module:**
- `lib/directions/schemas.ts` — add `PORTAL_DIRECTION_SCHEMA` and register
  it in `getDirectionSchema()`. No new validator case needed.
- `lib/directions/state.ts` — confirm no per-type branching; spot-check.

**Workflow + pricing:**
- `lib/workflows/templates.ts:398-405` — register `CLIENT_PORTAL_WORKFLOW_TEMPLATE`
- `lib/pricing/portal.ts` — **new file**, mirrors `lib/pricing/web_app.ts`

**Intake routing:**
- `app/[locale]/portal-intake/PortalIntakeClient.tsx:186` — change
  `projectType: "web_app"` to `projectType: "client_portal"`; drop the
  `intakeRaw.projectSubType: "portal"` workaround
- `app/api/submit-estimate/route.ts` — branch on `projectType` to call
  `getPortalPricing()` and tag the lead correctly. Confirm path during
  implementation.

**Existing overlapping ProjectType enums** (the `lib/workflows/types.ts:9`
comment names them):
- `lib/adminProjectData.ts` — has its own ProjectType
- `lib/pricing/types.ts` — has its own ProjectType
Both must grow `client_portal`.

**Component layer (verified no changes needed):**
- `components/portal/directions/DirectionModuleResolver.tsx` — already
  generic, routes by `direction` vs `designDirection` field presence
- `components/internal/DirectionAdminPanel` (generic) — handles
  `portal_direction` without modification

**Admin pipeline (deferred):**
- Dedicated `app/internal/admin/portals/` like `ecommerce/`/`ops/` —
  nice-to-have but not needed for the lane to function. Track separately.

---

## Task 1 — Extend the type unions + maps (verified scope) ✅ DONE

**Status:** ✅ shipped (bundled with Tasks 2 + 3 — TS-coupled)
**Effort:** **1–1.5 hours** (v1's 30 min was optimistic)
**Why:** every downstream piece (workflow template, pricing, intake
routing) gates on these unions. The map at `types.ts:82` is the
foundation for "which direction type is allowed for which project type"
— without it, the lane is unreachable from admin checks.

### Changes

**`lib/workflows/types.ts`:**

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

export const ALLOWED_DIRECTION_BY_PROJECT_TYPE: Record<ProjectType, DirectionType> = {
  website: "design_direction",
  web_app: "product_direction",
  automation: "workflow_direction",
  ecommerce: "store_direction",
  rescue: "rescue_diagnosis",
  client_portal: "portal_direction",  // ← new
};

export const PROJECT_TYPES: readonly ProjectType[] = [
  "website",
  "web_app",
  "automation",
  "ecommerce",
  "rescue",
  "client_portal",  // ← new
];
```

**TS sweep — 5 callsites to fix:**

1. `lib/customerPortal.ts:628-643` — add `case "client_portal": return "Client portal direction";`
2. `lib/customerPortal.ts:645-660` — add `case "client_portal": return "CrecyStudio portal direction review";`
3. `app/api/internal/admin/pre-contract/route.ts:54` — add `case "client_portal": return "CLIENT PORTAL PRE-CONTRACT DRAFT";`
4. `app/api/internal/admin/pre-contract/route.ts:69` — add the body template case
5. `app/api/internal/admin/pre-contract/route.ts:112` — add the third switch case

**Overlapping ProjectType in:**
- `lib/adminProjectData.ts` — extend
- `lib/pricing/types.ts` — extend

### Acceptance criteria

- `npm run lint` passes
- No regression on other lanes (each existing lane still routes correctly)

---

## Task 2 — `PORTAL_DIRECTION_SCHEMA` (15 fields, boutique max) ✅ DONE

**Status:** ✅ shipped (bundled with Tasks 1 + 3)
**Effort:** 2.5 hours (3 more fields than v2's 12; the design work
is meaningfully harder for screenInventory/branding/auth fields)
**Why:** boutique-max version matches what top studios deliver. Closes
the depth-then-collapse defect comprehensively and gives admin the data
to deliver a real permissions matrix + IA before build.

### Schema design

```ts
// In lib/directions/schemas.ts
export const PORTAL_DIRECTION_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "portalPurpose",
      label: "What does this portal do?",
      type: "textarea",
      required: true,
      helpText: "One paragraph: the portal's core job and the problem it solves.",
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
        "Distinct roles (e.g. Admin, Reviewer, Billing-only, External Partner). Separate from raw permissions — combine when a user has multiple roles.",
      maxItems: 8,
    },
    {
      key: "rolePermissions",
      label: "What can each role do?",
      type: "textarea",
      required: true,
      helpText:
        "High-level permissions per role. Example: 'Admin: full access. Reviewer: read + comment on milestones. Billing-only: invoices + payment only.' The detailed matrix gets locked during build.",
      maxLength: 4000,
    },
    {
      key: "keyFeatures",
      label: "Must-have features",
      type: "pills-multi",
      required: true,
      options: [
        "Payments / Stripe",
        "File uploads + storage",
        "Milestones + timeline",
        "Messaging",
        "Scheduling / booking",
        "Custom forms",
        "Multi-tenant data isolation",
        "White-label branding",
      ],
      helpText: "Pick the features the portal can't ship without.",
      maxItems: 8,
    },
    {
      key: "integrations",
      label: "External systems to connect",
      type: "string-list",
      helpText:
        "CRM, accounting, file storage, Airtable/Sheets/Postgres. What the portal needs to read or write to.",
      maxItems: 12,
    },
    {
      key: "integrationFlows",
      label: "For each integration: read, write, or sync?",
      type: "textarea",
      helpText:
        "For each integration above, note direction (portal → external, external → portal, or two-way sync) and frequency (real-time, hourly, daily).",
      maxLength: 3000,
    },
    {
      key: "multiTenancyModel",
      label: "Data isolation model",
      type: "select",
      required: true,
      options: [
        "Single tenant (one organization)",
        "Shared data across all users",
        "Multi-tenant with strict per-org data isolation",
      ],
      helpText:
        "For B2B portals serving multiple client organizations, strict per-org isolation is the boutique-tier default and what compliance frameworks require.",
    },
    {
      key: "complianceRequirements",
      label: "Compliance / regulatory needs",
      type: "pills-multi",
      options: ["GDPR", "HIPAA", "SOC 2", "Accessibility (WCAG 2.1 AA)", "PCI DSS", "Other"],
      helpText: "Pick all that apply. Each adds specific build requirements.",
      maxItems: 6,
    },
    {
      key: "auditTrailEvents",
      label: "What actions need an audit trail?",
      type: "textarea",
      helpText:
        "What user/admin actions should be logged for compliance, troubleshooting, or accountability. Example: 'all payments, role changes, file deletions, login from new IP.'",
      maxLength: 2000,
    },
    {
      key: "notificationsEvents",
      label: "What triggers notifications?",
      type: "textarea",
      helpText:
        "What events generate email or in-app alerts. Example: 'milestone completed, file uploaded, message received, payment failed.'",
      maxLength: 2000,
    },
    {
      key: "screenInventory",
      label: "Main screens / pages",
      type: "string-list",
      required: true,
      helpText:
        "List the main screens users will see (e.g. Dashboard, Projects, Files, Messages, Billing, Settings). The IA gets refined during wireframes; this is the starting set.",
      maxItems: 15,
    },
    {
      key: "authMethod",
      label: "How do users sign in?",
      type: "select",
      required: true,
      options: [
        "Email + password",
        "Magic link (passwordless email)",
        "Single sign-on (SSO / Google Workspace / Microsoft 365)",
        "Social login (Google / Apple)",
        "Invite-only (admin creates accounts)",
        "Not sure — recommend the right one",
      ],
      helpText:
        "Drives the auth provider build + how onboarding flows work for new users.",
    },
    {
      key: "brandingRequirements",
      label: "Branding scope",
      type: "pills-multi",
      options: [
        "Custom logo",
        "Custom colors",
        "Custom domain (e.g. portal.yourdomain.com)",
        "Custom email-from address",
        "Full white-label (no CrecyStudio attribution)",
        "Match existing brand guidelines",
      ],
      helpText:
        "Pick what applies. Full white-label and custom domain typically lift the project into the Standalone or Enterprise tier.",
      maxItems: 6,
    },
    {
      key: "successMetric",
      label: "How will you know it's working?",
      type: "textarea",
      required: true,
      helpText:
        "What changes about your operation when this portal is live? Concrete is better than vague.",
      maxLength: 2000,
    },
  ],
};
```

### Register the schema

`lib/directions/schemas.ts` `getDirectionSchema()` — add the case
returning `PORTAL_DIRECTION_SCHEMA` for `"portal_direction"`.
**No validator changes needed** — `validateDirectionPayload` reads the
schema via `getDirectionSchema()` and validates field-by-type
(`validate.ts:81-110`).

### Acceptance criteria

- All 12 fields render in `DirectionForm` for portal clients
- Validator rejects payloads missing required fields
- Validator accepts well-formed payloads
- Admin reviewer's `DirectionSummary` shows all 12 field values

---

## Task 3 — `CLIENT_PORTAL_WORKFLOW_TEMPLATE` ✅ DONE

**Status:** ✅ shipped (bundled with Tasks 1 + 2)
**Effort:** 2 hours
**Why:** without a template, `ensureCustomerPortalForQuoteId` won't seed
the right milestones / required actions / launch checks for a portal
project. Template structure already validated against
`CUSTOM_WEB_APP_WORKFLOW_TEMPLATE` (lines 86-180).

### Schema design

12 milestones tailored to portal builds (vs Custom Web App):

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
    { key: "qa_complete", title: "QA + audit trail testing complete", owner: "studio", sortOrder: 90 },
    { key: "uat_complete", title: "Client UAT complete", owner: "client", sortOrder: 100 },
    { key: "production_launch", title: "Production launch", owner: "studio", sortOrder: 110 },
    { key: "handoff_support", title: "Handoff & support", owner: "studio", sortOrder: 120 },
  ],
  requiredActions: [
    {
      key: "complete_portal_direction",
      title: "Complete Portal Direction",
      description: "Confirm portal purpose, access type, roles, permissions, features, integrations, multi-tenancy model, compliance, audit trail, notifications, and success metric.",
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
      description: "Sign off on the list of external systems and the read/write/sync direction for each.",
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
    { key: "data_isolation", title: "Multi-tenant data isolation tested (if applicable)", owner: "studio" },
    { key: "audit_trail", title: "Audit trail logged for sensitive actions", owner: "studio" },
    { key: "integrations", title: "All integrations tested in production", owner: "studio" },
    { key: "compliance_review", title: "Compliance requirements verified", owner: "studio" },
    { key: "email_notifications", title: "Email/in-app notifications tested", owner: "studio" },
    { key: "admin_access", title: "Admin access + role escalation tested", owner: "studio" },
    { key: "handoff_docs", title: "Handoff documentation provided", owner: "studio" },
  ],
  direction: {
    type: "portal_direction",
    status: "waiting_on_client",
    payload: {
      portalPurpose: "",
      accessType: "",
      userRoles: [],
      rolePermissions: "",
      keyFeatures: [],
      integrations: [],
      integrationFlows: "",
      multiTenancyModel: "",
      complianceRequirements: [],
      auditTrailEvents: "",
      notificationsEvents: "",
      screenInventory: [],
      authMethod: "",
      brandingRequirements: [],
      successMetric: "",
    },
  },
};
```

### Register

`lib/workflows/templates.ts:398-405`:

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

---

## Task 4 — `lib/pricing/portal.ts` (3 tiers, real $ ranges) ✅ DONE

**Status:** ✅ shipped with 13-test unit suite (all green)
**Effort:** half day including a unit test
**Why:** intake produces no recommendation today. Sales conversation
breaks on "what will this cost?"

### Approach

Three tiers matching `lib/service-pages.ts:1232-1255`:

```ts
// lib/pricing/portal.ts
export type PortalPricingInput = {
  accessType: "clients" | "team" | "both" | "partners";
  userCount: "1-10" | "11-50" | "51-200" | "200+" | "unknown";
  featureCount: number;
  integrationCount: number;
  isMultiTenant: boolean;
  hasCompliance: boolean;
  budget: "under_5k" | "5k-10k" | "10k-25k" | "25k-50k" | "50k-100k" | "100k+" | "unknown";
  techTeam: "none" | "some" | "yes";
  isAddOn: boolean;  // true if customer's existing website-build is in flight
};

export type PortalPricingTier = "add_on" | "standalone" | "enterprise";

export type PortalPricingResult = {
  tier: PortalPricingTier;
  label: string;        // "Portal add-on" / "Standalone portal" / "Enterprise build"
  estimateLow: number;  // dollars
  estimateHigh: number; // dollars
  rationale: string;
  flags: string[];      // e.g. "discovery sprint required", "compliance scope adds 20%"
};

export function getPortalPricing(input: PortalPricingInput): PortalPricingResult {
  // Add-on: small feature set, < 50 users, 0-2 integrations, single-tenant, no compliance, isAddOn=true
  // Enterprise: multi-tenant + compliance + 100+ users OR budget 50k+
  // Standalone: everything else
  // … scoring logic
}
```

Tier mapping verified against the landing page:
- **Portal add-on**: $5,000–$10,000 ("Most common starting point")
- **Standalone portal**: $22,000–$45,000
- **Enterprise build**: From $75,000 ("Discovery sprint required")

### Unit test

`lib/__tests__/portal-pricing.test.ts` — verify:
- Lowest input → `add_on` tier
- Multi-tenant + compliance → `enterprise` tier
- Mid-tier input → `standalone`
- Boundary cases (5–10k budget, single-tenant, light compliance)

### Acceptance criteria

- All three tiers reachable via input combinations
- Unit test green
- Returned label matches landing page tier name exactly

---

## Task 5 — Wire the intake submit + routing ✅ DONE

**Status:** ✅ shipped
**Effort:** half day
**Why:** intake currently sends `projectType: "web_app"` with
`projectSubType: "portal"` workaround. Once `client_portal` exists as
a real type, the workaround can drop.

### Changes

**`app/[locale]/portal-intake/PortalIntakeClient.tsx:186`:**

```diff
- projectType: "web_app",
+ projectType: "client_portal",
  ...
  intakeRaw: {
-   projectSubType: "portal",
    ...
  }
```

**`app/api/submit-estimate/route.ts`** (confirm path during impl):

Branch on `projectType`. When `"client_portal"`:
- Call `getPortalPricing()` (not website or web_app pricing)
- Persist the lead with `projectType: "client_portal"` so admin master
  list shows the right lane label

### Acceptance criteria

- New portal-intake submission creates a lead with
  `projectType: "client_portal"`
- Pricing recommendation returned in the response matches one of the 3 tiers
- Admin master list shows "Client Portal" lane label
- The submission triggers `CLIENT_PORTAL_WORKFLOW_TEMPLATE` when
  `ensureCustomerPortalForQuoteId` runs

---

## Task 6 — Migration plan for existing mistagged leads ✅ DECIDED

**Status:** ✅ Decision locked — **Option A** (leave existing as web_app)
**Effort:** **1 hour** (decision; no SQL needed)
**Why:** **v1 missed this entirely.** Existing portal-intake submissions
are stored with `projectType: "web_app"` + `intakeRaw.projectSubType: "portal"`.
After Task 1 ships, these stay as `web_app` unless migrated.

### The decision

Two options:

**Option A — Leave existing leads as `web_app`** (recommended)
- *Why:* they're already running the Custom Web App workflow template;
  re-tagging them mid-flight would require re-seeding milestones, which
  could orphan progress they've already made. Their portals work; the
  experience is sub-optimal but coherent.
- *Cost:* admin master list shows them under "Custom Web App" lane, not
  "Client Portal." Minor admin confusion only.

**Option B — Migrate them with a one-time SQL**
- *What:* `UPDATE quotes SET project_type = 'client_portal' WHERE
  intake_raw->>'projectSubType' = 'portal'`; then re-seed portal-direction
  on their portals (only those still in pre-build stages)
- *Risk:* mid-flight projects lose their existing direction record (which
  was `product_direction`, not `portal_direction`). They'd need to
  re-fill the 12 new portal_direction fields.

### Recommendation

**Option A.** Tag new submissions correctly; let existing ones run out as
web_app. No SQL needed. If you want a clean cutover later, run the
migration once portal lane is battle-tested.

### Acceptance criteria

- Decision made and noted in commit message
- If Option A: a SQL queryable list of mistagged leads, for future
  reference

---

## Task 7 — Decide schema duplication vs. extension ✅ DECIDED

**Status:** ✅ Decision locked — **Duplicate** (own schema, consistent with pattern)
**Effort:** 30 min (decision)
**Why:** **v1 made this choice silently.** My `PORTAL_DIRECTION_SCHEMA`
duplicates much of `PRODUCT_DIRECTION_SCHEMA`'s structure. There's a
real argument that "client_portal = web_app + access-control extensions" —
extend the existing schema rather than duplicate.

### Trade-off

**Duplication (v1's choice):** each lane has its own schema. Pro: clean
separation, lanes evolve independently. Con: schema drift, ~60% overlap
with product_direction.

**Extension:** portal_direction inherits product_direction's base fields,
adds portal-specific ones (accessType, rolePermissions, multiTenancyModel,
auditTrail, etc.). Pro: less duplication, shared field improvements
benefit both. Con: changes to product_direction affect portals.

### Recommendation

**Duplicate.** Reasons:
1. Every other lane already does this (each direction type has its own
   schema in `lib/directions/schemas.ts`).
2. The schemas drift naturally — `permissions matrix` and `audit trail`
   are core to portals but not to general web apps. Shared schema would
   accumulate optional fields and become brittle.
3. The code pattern at `getDirectionSchema()` is already designed for
   one-schema-per-type.

But flag explicitly: this means if you ship a `permissions matrix UI`
later, you'd want it in both portals AND web apps. Plan accordingly.

### Acceptance criteria

- Decision noted in plan / commit
- If Extension: detailed merge plan for shared/portal-only fields

---

## Task 8 — End-to-end Playwright verification

**Effort:** 1 hour
**Why:** confirm the lane works end-to-end on production. Reuse the
admin + customer creds + harness pattern from the DD test.

### Test steps

1. Submit `/portal-intake` as the test customer with realistic fake data
2. Admin marks the new lead's deposit paid via the same admin API
3. Confirm the new portal is created with `portal_direction: waiting_on_client`
4. Customer visits the portal — sees the 12-field portal direction form
5. Fill, draft-save (if Decision Log not yet shipped, just save+submit),
   submit
6. Admin marks under review → request changes → customer resubmits → admin
   approves & locks
7. Customer sees the 12 portal milestones rendered

### Acceptance criteria

- End-to-end test runs green against production
- Both admin and customer experience the lane as portal-specific (not
  web_app-flavored)

---

## Build order

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 1 | Extend type unions + maps + TS sweep | 1–1.5 hr | 5 callsites verified |
| 2 | `PORTAL_DIRECTION_SCHEMA` (15 fields) + register | 2.5 hr | No validator changes needed |
| 3 | `CLIENT_PORTAL_WORKFLOW_TEMPLATE` + register | 2 hr | 12 milestones / 6 required actions / 9 launch checks |
| 4 | `lib/pricing/portal.ts` (3 tiers) + unit test | half day | $5–10k / $22–45k / $75k+ |
| 5 | Intake submit + API routing | half day | Drop `projectSubType` workaround |
| 6 | Existing-leads migration decision | 1 hr | Recommend Option A (leave) |
| 7 | Duplication-vs-extension decision | 30 min | Recommend duplication |
| 8 | E2E Playwright verification | 1 hr | Reuse DD test harness |

Total: **~3.5–4.5 focused days.** Slightly higher than v1's 3–4 because
TS sweep is wider than estimated and Task 6/7 are new.

---

## Cross-cutting admin-side checklist

For every task, before marking done:

- [ ] Admin master list shows portal projects with "Client Portal" lane label
- [ ] `app/internal/admin/[id]/ProjectControlClient.tsx` handles
      `client_portal` without errors (no exhaustive-switch crashes)
- [ ] Generic `DirectionAdminPanel` renders all 12 portal_direction fields
- [ ] `app/api/internal/portal/admin-update/route.ts` accepts portal
      direction transitions
- [ ] Existing `web_app` and other-lane projects render correctly (no
      regression from union expansion)
- [ ] Pre-contract draft generation works for the new lane

---

## Success metrics (30 days post-launch)

**v1 missed this.** Without metrics, we don't know if the lane is working.

Track:

1. **Direction form completion rate** — % of portal-intake leads that
   submit the portal_direction form. Target: ≥70% (matches other lanes'
   baseline once verified).
2. **Time from intake → direction-submitted** — median days. Target: ≤7
   days (boutique norm for direction discovery).
3. **Conversion rate intake → deposit-paid** — compared against the same
   metric on other lanes. Establish baseline.
4. **"What's the status?" support messages from portal clients** — these
   should drop once the structured experience exists. Target: ≤1 per
   project lifecycle (down from current N — measure first to know).
5. **Admin-side time-to-review-submission** — how long admin takes from
   "submitted" to "under_review" or "approved". Target: ≤2 business days.

Capture baseline numbers in the first 30 days; revisit at day 60.

---

## Decisions locked

1. ✅ **Migration: Option A** — leave existing portal-as-web_app leads
   in place; tag new submissions as `client_portal`.
2. ✅ **Schema: duplicate** (not extend) — consistent with existing
   pattern. If a permissions-matrix UI is built later, plan to share it
   between portal_direction and product_direction.
3. ✅ **Schema field count: 15 (boutique max)** — schema below expanded
   to include `screenInventory`, `brandingRequirements`, `authMethod`.
4. **Dedicated admin pipeline** at `app/internal/admin/portals/` —
   **defer** (lane works with shared `ProjectControlClient`).
5. **i18n** — hardcoded English for now, consistent with every other
   lane. Separate unified i18n track later.

## Sequencing — locked

✅ **Portal lane first**, then Decision Log (Week 2), then Weekly Digest
(Week 3). The 15-field schema and end-to-end lane wiring closes the
depth-then-collapse defect for portal clients.

## Note on the 15-field schema (boutique max trade-off)

The expanded 15-field schema matches what top-tier boutiques deliver,
but it's heavier than the 7–12 field typical. Two implications:

1. **Form UX matters more** — without grouping or progressive
   disclosure, the form will feel like a wall of inputs. The existing
   `DirectionForm` renders all fields sequentially. For v1, ship the
   full 15 with thoughtful `helpText` and clear visual section breaks
   between conceptual groups (Identity / Access / Features /
   Integrations / Compliance / Success).
2. **Success-metric target adjusts** — "70% direction-form completion
   rate" is aggressive at 15 fields. Plan to measure baseline at day
   30 and revise the target if it sits 50–60%. Either trim fields,
   add inline save (draft auto-save like Task 4 of the DD plan), or
   accept the floor.

---

## Sequencing — should Decision Log come first instead?

Now that we know portal-intake **doesn't dead-end** (it just mistags as
web_app), the case for "fix Portal first" weakens vs. "ship Decision
Log first."

**Argument for Decision Log first (~2–3 days):**
- Lane-agnostic; benefits all 6 lanes including portal-as-web_app *today*
- New portal lane (if shipped after) gets decision log from day one
- Higher leverage per day of work

**Argument for Portal lane first (~3.5–4.5 days):**
- Fixes the experience-mismatch defect that affects portal clients NOW
  (they see product_direction's 5 fields after answering 22 intake
  questions about portal-specific topics)
- More visible to portal customers in the short term
- The 12-field schema directly addresses the depth-then-collapse defect

**My honest recommendation:** Decision Log first, then Portal lane. Both
are wins; Decision Log compounds across more surface area per day spent.

**Your call** — happy to lock in either sequence.

---

## What this unblocks

Once the lane ships (regardless of order):

- Portal sales conversations get the right pricing tier
- Portal clients get a 12-field form matching what they were asked at
  intake (depth-then-collapse defect closed for this lane)
- Admin pipeline shows portal projects under their own lane label
- The studio can deliver against the `/client-portals` landing page
  promise

## After this ships

- **Week 2:** Decision log (if not done first) —
  `CRECYSTUDIO_DECISION_LOG_PLAN.md`
- **Week 3:** Weekly Friday digest —
  `CRECYSTUDIO_WEEKLY_DIGEST_PLAN.md`
- **Optional later:** Dedicated `app/internal/admin/portals/` pipeline;
  permissions-matrix UI artifact (shared with web_app lane); audit-trail
  configurator
- **Margin play parked:** 2-Week Automation Roadmap productization
