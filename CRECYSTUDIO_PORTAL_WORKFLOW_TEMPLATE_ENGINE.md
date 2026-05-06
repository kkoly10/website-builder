# CrecyStudio Portal Workflow Template Engine

**Document type:** Engineering implementation brief  
**Scope:** Client portal + admin dashboard flow by project type  
**Primary lanes:** Website, Custom Web App, Automation, E-commerce, Rescue  
**Recommended repo path:** `docs/portal-workflow-template-engine.md`  
**Audience:** Codex / Claude Code / future implementation work

---

## 1. Goal

CrecyStudio should not use one generic project workspace for every service. The system should detect the project lane from the original quote/intake and render the correct portal workflow automatically.

```txt
Lead path / intake source
        ↓
quotes.project_type
        ↓
customer_portal_projects.project_type
        ↓
workflow template
        ↓
lane-specific client flow
        ↓
lane-specific admin flow
```

Examples:

```txt
Website quote
→ Website portal
→ Design Direction
→ Assets
→ Preview
→ Feedback
→ Launch

Custom app quote
→ Custom app portal
→ Product Direction
→ MVP scope lock
→ Architecture
→ Wireframes / UX flow
→ Development sprints
→ UAT
→ Launch

Automation quote
→ Automation portal
→ Workflow Direction
→ Access checklist
→ Build
→ Test run
→ Go-live

E-commerce quote
→ Store portal
→ Store Direction
→ Catalog/assets
→ Checkout configuration
→ Test order
→ Launch

Rescue quote
→ Rescue portal
→ Diagnosis
→ Fix plan
→ Access
→ Critical fixes
→ QA
→ Handoff
```

The client-facing experience should stay simple. The backend/admin experience should become structured.

---

## 2. Why this design

This is basically a lightweight **service blueprint**. The client sees clear frontstage steps. CrecyStudio uses the admin dashboard for backstage tasks, required actions, internal notes, launch checks, and operational tracking.

Reference concepts:
- Digital.gov describes service blueprints as connecting user steps, frontstage actions, backstage actions, and support processes: https://digital.gov/guides/research-collaboration/user-needs/journeys
- Atlassian describes SDLC as a structured software process for planning, design, implementation, testing, deployment, and maintenance: https://www.atlassian.com/agile/software-development/sdlc
- OWASP SAMM organizes secure software delivery around governance, design, implementation, verification, and operations: https://owaspsamm.org/model/

---

## 3. Current repo alignment

The repo already has the right direction because `project_type` exists on `quotes` and `customer_portal_projects`.

Expected enum:

```ts
type ProjectType =
  | "website"
  | "web_app"
  | "automation"
  | "ecommerce"
  | "rescue";
```

Recommended source-of-truth order:

```ts
export function resolveProjectType({
  portal,
  quote,
  intake,
}: {
  portal?: any;
  quote?: any;
  intake?: any;
}): ProjectType {
  return (
    portal?.project_type ||
    quote?.project_type ||
    quote?.quote_json?.projectType ||
    intake?.projectType ||
    "website"
  );
}
```

Rule:

> The lead path sets `project_type`. The quote stores it. The portal inherits it. The workspace renders the matching workflow.

---

## 4. One portal engine, five workflow templates

Do **not** build five unrelated portals.

Use:

```txt
/portal
  → logged-in client project hub

/portal/[token]
  → universal workspace shell
  → resolves project_type
  → loads workflow template
  → renders lane-specific direction module
```

Shared workspace shell:

- Current phase
- Current owner
- Action needed
- Timeline / milestones
- Direction module
- Assets / files
- Messages
- Invoices / payments
- Agreement
- Activity feed
- Preview / live links
- Feedback / revisions
- Launch checklist
- Handoff / support

Lane-specific modules:

| `project_type` | Direction module | Workflow template |
|---|---|---|
| `website` | Design Direction | Website Build |
| `web_app` | Product Direction | Custom App MVP |
| `automation` | Workflow Direction | Automation System |
| `ecommerce` | Store Direction | E-commerce Store |
| `rescue` | Rescue Diagnosis | Rescue Sprint |

---

## 5. Create workflow template config

Recommended file:

```txt
lib/workflows/templates.ts
```

Suggested base types:

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
  milestones: {
    key: string;
    title: string;
    owner: ActionOwner;
    sortOrder: number;
  }[];
  requiredActions: {
    key: string;
    title: string;
    description: string;
    owner: ActionOwner;
    status: ActionStatus;
    unlocksMilestone?: string;
  }[];
  launchChecks: {
    key: string;
    title: string;
    owner: ActionOwner;
  }[];
  direction: {
    type: DirectionType;
    status: ActionStatus;
    payload: Record<string, any>;
  };
};
```

---

## 6. Website workflow template

```ts
export const WEBSITE_WORKFLOW_TEMPLATE: WorkflowTemplate = {
  projectType: "website",
  label: "Website Build",
  directionType: "design_direction",
  milestones: [
    { key: "scope_confirmed", title: "Scope confirmed", owner: "studio", sortOrder: 10 },
    { key: "design_direction_approved", title: "Design direction approved", owner: "client", sortOrder: 20 },
    { key: "assets_received", title: "Content/assets received", owner: "client", sortOrder: 30 },
    { key: "first_preview_ready", title: "First preview ready", owner: "studio", sortOrder: 40 },
    { key: "feedback_submitted", title: "Client feedback submitted", owner: "client", sortOrder: 50 },
    { key: "revisions_complete", title: "Revisions complete", owner: "studio", sortOrder: 60 },
    { key: "launch_approved", title: "Launch approved", owner: "client", sortOrder: 70 },
    { key: "launch_handoff", title: "Launch & handoff", owner: "studio", sortOrder: 80 },
  ],
  requiredActions: [
    {
      key: "complete_design_direction",
      title: "Complete Design Direction",
      description: "Choose the brand mood, visual style, color guidance, typography feel, imagery direction, and reference websites.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "design_direction_approved",
    },
    {
      key: "upload_website_assets",
      title: "Upload logo, photos, copy, and content",
      description: "Provide the materials needed to build the website.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "assets_received",
    },
    {
      key: "review_first_preview",
      title: "Review the first preview",
      description: "Review the live preview and submit feedback in one complete batch.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "feedback_submitted",
    },
    {
      key: "approve_launch",
      title: "Approve launch",
      description: "Confirm the final version is ready to go live.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "launch_approved",
    },
  ],
  launchChecks: [
    { key: "domain", title: "Domain connected", owner: "studio" },
    { key: "forms", title: "Forms tested", owner: "studio" },
    { key: "seo", title: "SEO metadata set", owner: "studio" },
    { key: "analytics", title: "Analytics connected", owner: "studio" },
    { key: "handoff", title: "Handoff notes provided", owner: "studio" },
  ],
  direction: {
    type: "design_direction",
    status: "waiting_on_client",
    payload: {
      controlLevel: "crecystudio_led",
      brandMood: [],
      visualStyle: "",
      colorPreferences: "",
      colorsToAvoid: "",
      typographyFeel: "",
      imageryDirection: [],
      likedWebsites: [],
      dislikedWebsites: [],
      contentTone: "",
      brandAssetsNotes: "",
    },
  },
};
```

---

## 7. Custom web app workflow template

```ts
export const CUSTOM_WEB_APP_WORKFLOW_TEMPLATE: WorkflowTemplate = {
  projectType: "web_app",
  label: "Custom Web App",
  directionType: "product_direction",
  milestones: [
    { key: "discovery_complete", title: "Discovery complete", owner: "studio", sortOrder: 10 },
    { key: "product_direction_approved", title: "Product direction approved", owner: "client", sortOrder: 20 },
    { key: "mvp_scope_locked", title: "MVP scope locked", owner: "client", sortOrder: 30 },
    { key: "architecture_mapped", title: "System architecture mapped", owner: "studio", sortOrder: 40 },
    { key: "ux_flow_approved", title: "Wireframes / UX flow approved", owner: "client", sortOrder: 50 },
    { key: "foundation_built", title: "Core app foundation built", owner: "studio", sortOrder: 60 },
    { key: "dashboards_workflows_built", title: "Dashboards and workflows built", owner: "studio", sortOrder: 70 },
    { key: "integrations_connected", title: "Integrations connected", owner: "studio", sortOrder: 80 },
    { key: "qa_complete", title: "QA testing complete", owner: "studio", sortOrder: 90 },
    { key: "uat_complete", title: "Client UAT complete", owner: "client", sortOrder: 100 },
    { key: "production_launch", title: "Production launch", owner: "studio", sortOrder: 110 },
    { key: "handoff_support", title: "Handoff & support", owner: "studio", sortOrder: 120 },
  ],
  requiredActions: [
    {
      key: "complete_product_direction",
      title: "Complete Product Direction",
      description: "Confirm app purpose, users, roles, workflows, MVP priorities, data records, integrations, and acceptance criteria.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "product_direction_approved",
    },
    {
      key: "approve_mvp_scope",
      title: "Approve MVP Scope",
      description: "Approve must-have features, phase-two items, exclusions, and launch criteria.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "mvp_scope_locked",
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
      description: "Test the app using real scenarios and submit issues in one complete batch.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "uat_complete",
    },
    {
      key: "approve_production_launch",
      title: "Approve production launch",
      description: "Confirm the app is ready for production use.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "production_launch",
    },
  ],
  launchChecks: [
    { key: "production_env", title: "Production environment configured", owner: "studio" },
    { key: "auth_permissions", title: "Authentication and permissions tested", owner: "studio" },
    { key: "database_writes", title: "Database writes tested", owner: "studio" },
    { key: "integrations", title: "Integrations tested", owner: "studio" },
    { key: "payments", title: "Payments tested if applicable", owner: "studio" },
    { key: "email_notifications", title: "Email/notifications tested", owner: "studio" },
    { key: "admin_access", title: "Admin access confirmed", owner: "studio" },
    { key: "handoff_docs", title: "Handoff documentation provided", owner: "studio" },
  ],
  direction: {
    type: "product_direction",
    status: "waiting_on_client",
    payload: {
      appPurpose: "",
      targetUsers: [],
      userRoles: [],
      workflows: [],
      mvpPriorities: {
        mustHave: [],
        phaseTwo: [],
        futureIdeas: [],
      },
      screenMap: [],
      dataRecords: [],
      permissions: [],
      integrations: [],
      notifications: [],
      productFeel: "",
      devicePriority: "",
      accessibilityNotes: "",
      acceptanceCriteria: [],
    },
  },
};
```

---

## 8. Automation workflow template

```ts
export const AUTOMATION_WORKFLOW_TEMPLATE: WorkflowTemplate = {
  projectType: "automation",
  label: "Workflow Automation",
  directionType: "workflow_direction",
  milestones: [
    { key: "diagnosis_complete", title: "Workflow diagnosis complete", owner: "studio", sortOrder: 10 },
    { key: "automation_scope_approved", title: "Automation scope approved", owner: "client", sortOrder: 20 },
    { key: "tool_access_confirmed", title: "Tool access confirmed", owner: "client", sortOrder: 30 },
    { key: "workflow_built", title: "Workflow built", owner: "studio", sortOrder: 40 },
    { key: "test_run_complete", title: "Test run complete", owner: "studio", sortOrder: 50 },
    { key: "client_approval", title: "Client approval", owner: "client", sortOrder: 60 },
    { key: "automation_live", title: "Automation live", owner: "studio", sortOrder: 70 },
    { key: "documentation_handoff", title: "Handoff & documentation", owner: "studio", sortOrder: 80 },
  ],
  requiredActions: [
    {
      key: "complete_workflow_direction",
      title: "Complete Workflow Direction",
      description: "Describe the current manual process, tools, triggers, outputs, approvals, and success metric.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "automation_scope_approved",
    },
    {
      key: "provide_tool_access",
      title: "Provide tool access",
      description: "Provide required logins, API access, Zapier/Make access, or test credentials.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "tool_access_confirmed",
    },
    {
      key: "review_test_run",
      title: "Review test run",
      description: "Confirm the automation performs correctly using real or realistic test data.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "client_approval",
    },
  ],
  launchChecks: [
    { key: "test_data", title: "Test data verified", owner: "studio" },
    { key: "tool_connections", title: "Tool connections active", owner: "studio" },
    { key: "error_handling", title: "Error handling confirmed", owner: "studio" },
    { key: "rollback_plan", title: "Rollback/manual fallback documented", owner: "studio" },
    { key: "handoff_docs", title: "Automation documentation provided", owner: "studio" },
  ],
  direction: {
    type: "workflow_direction",
    status: "waiting_on_client",
    payload: {
      currentProcess: "",
      painPoints: [],
      trigger: "",
      toolsInvolved: [],
      workflowSteps: [],
      inputs: [],
      outputs: [],
      approvals: [],
      notifications: [],
      errorCases: [],
      successMetric: "",
      accessNeeded: [],
    },
  },
};
```

---

## 9. E-commerce workflow template

```ts
export const ECOMMERCE_WORKFLOW_TEMPLATE: WorkflowTemplate = {
  projectType: "ecommerce",
  label: "E-commerce Store",
  directionType: "store_direction",
  milestones: [
    { key: "store_scope_confirmed", title: "Store scope confirmed", owner: "studio", sortOrder: 10 },
    { key: "store_direction_approved", title: "Store direction approved", owner: "client", sortOrder: 20 },
    { key: "products_assets_received", title: "Products/assets received", owner: "client", sortOrder: 30 },
    { key: "storefront_build_started", title: "Storefront build started", owner: "studio", sortOrder: 40 },
    { key: "checkout_configured", title: "Checkout configured", owner: "studio", sortOrder: 50 },
    { key: "shipping_tax_configured", title: "Shipping/tax configured", owner: "studio", sortOrder: 60 },
    { key: "test_order_complete", title: "Test order complete", owner: "studio", sortOrder: 70 },
    { key: "launch_approved", title: "Launch approved", owner: "client", sortOrder: 80 },
    { key: "store_live", title: "Store live", owner: "studio", sortOrder: 90 },
  ],
  requiredActions: [
    {
      key: "complete_store_direction",
      title: "Complete Store Direction",
      description: "Confirm platform, products, checkout, shipping, tax, policies, and store goals.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "store_direction_approved",
    },
    {
      key: "upload_product_catalog",
      title: "Upload product catalog",
      description: "Provide product names, prices, descriptions, images, categories, variants, and inventory notes.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "products_assets_received",
    },
    {
      key: "review_test_order",
      title: "Review test order",
      description: "Confirm checkout, order email, shipping, and payment flow are correct.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "launch_approved",
    },
  ],
  launchChecks: [
    { key: "payment_gateway", title: "Payment gateway configured", owner: "studio" },
    { key: "shipping_rules", title: "Shipping rules configured", owner: "studio" },
    { key: "tax_rules", title: "Tax rules configured", owner: "studio" },
    { key: "policies", title: "Store policies added", owner: "studio" },
    { key: "test_order", title: "Test order completed", owner: "studio" },
    { key: "analytics", title: "Analytics connected", owner: "studio" },
  ],
  direction: {
    type: "store_direction",
    status: "waiting_on_client",
    payload: {
      platform: "",
      productCatalogSize: "",
      productCategories: [],
      paymentNeeds: [],
      shippingRules: "",
      taxRules: "",
      inventoryWorkflow: "",
      fulfillmentWorkflow: "",
      policyNeeds: [],
      conversionPriorities: [],
      storeExamples: [],
    },
  },
};
```

---

## 10. Rescue workflow template

```ts
export const RESCUE_WORKFLOW_TEMPLATE: WorkflowTemplate = {
  projectType: "rescue",
  label: "Website Rescue",
  directionType: "rescue_diagnosis",
  milestones: [
    { key: "rescue_intake_reviewed", title: "Rescue intake reviewed", owner: "studio", sortOrder: 10 },
    { key: "diagnosis_complete", title: "Diagnosis complete", owner: "studio", sortOrder: 20 },
    { key: "fix_plan_approved", title: "Fix plan approved", owner: "client", sortOrder: 30 },
    { key: "access_confirmed", title: "Access confirmed", owner: "client", sortOrder: 40 },
    { key: "critical_fixes_applied", title: "Critical fixes applied", owner: "studio", sortOrder: 50 },
    { key: "qa_complete", title: "QA complete", owner: "studio", sortOrder: 60 },
    { key: "client_review", title: "Client review", owner: "client", sortOrder: 70 },
    { key: "rescue_handoff", title: "Rescue handoff", owner: "studio", sortOrder: 80 },
  ],
  requiredActions: [
    {
      key: "complete_rescue_diagnosis",
      title: "Confirm rescue details",
      description: "Confirm current URL, reported issues, urgency, business impact, and priority fixes.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "diagnosis_complete",
    },
    {
      key: "approve_fix_plan",
      title: "Approve fix plan",
      description: "Approve must-fix items and optional recommendations before the rescue sprint begins.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "fix_plan_approved",
    },
    {
      key: "provide_access",
      title: "Provide website/hosting access",
      description: "Provide required access to website, CMS, hosting, DNS, or repository.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "access_confirmed",
    },
    {
      key: "review_rescue_fixes",
      title: "Review rescue fixes",
      description: "Confirm critical fixes are working and approve handoff.",
      owner: "client",
      status: "not_started",
      unlocksMilestone: "client_review",
    },
  ],
  launchChecks: [
    { key: "critical_issues_fixed", title: "Critical issues fixed", owner: "studio" },
    { key: "forms_tested", title: "Forms tested", owner: "studio" },
    { key: "mobile_checked", title: "Mobile checked", owner: "studio" },
    { key: "speed_baseline", title: "Speed baseline reviewed", owner: "studio" },
    { key: "final_report", title: "Final report provided", owner: "studio" },
  ],
  direction: {
    type: "rescue_diagnosis",
    status: "waiting_on_client",
    payload: {
      currentUrl: "",
      reportedIssues: [],
      businessImpact: "",
      urgency: "",
      accessNeeded: [],
      priorityFixes: [],
      niceToFix: [],
      risks: [],
      clientNotes: "",
    },
  },
};
```

---

## 11. Unified export

```ts
export const WORKFLOW_TEMPLATES: Record<ProjectType, WorkflowTemplate> = {
  website: WEBSITE_WORKFLOW_TEMPLATE,
  web_app: CUSTOM_WEB_APP_WORKFLOW_TEMPLATE,
  automation: AUTOMATION_WORKFLOW_TEMPLATE,
  ecommerce: ECOMMERCE_WORKFLOW_TEMPLATE,
  rescue: RESCUE_WORKFLOW_TEMPLATE,
};

export function getWorkflowTemplate(projectType: ProjectType): WorkflowTemplate {
  return WORKFLOW_TEMPLATES[projectType] ?? WORKFLOW_TEMPLATES.website;
}
```

---

## 12. Portal project creation logic

Update `ensureCustomerPortalForQuoteId()` so it:

1. Resolves `project_type`.
2. Loads the matching workflow template.
3. Inserts `customer_portal_projects.project_type`.
4. Stores `scope_snapshot.direction`.
5. Stores `scope_snapshot.requiredActions`.
6. Stores `scope_snapshot.launchChecks`.
7. Inserts lane-specific milestones.

Conceptual implementation:

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

const { data: created, error: createErr } = await supabaseAdmin
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

---

## 13. Required Actions

The most important UX upgrade is a clear **Action Needed From You** section.

MVP storage option:

```ts
scope_snapshot: {
  requiredActions: [
    {
      key: "complete_product_direction",
      owner: "client",
      title: "Complete Product Direction",
      status: "waiting_on_client",
      description: "Confirm users, roles, workflows, MVP priorities, and launch criteria."
    }
  ]
}
```

Better long-term table:

```sql
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

create index if not exists idx_customer_portal_required_actions_project
  on customer_portal_required_actions(portal_project_id, status, created_at);
```

---

## 14. Direction module resolver

Recommended files:

```txt
components/portal/directions/WebsiteDesignDirectionModule.tsx
components/portal/directions/ProductDirectionModule.tsx
components/portal/directions/WorkflowDirectionModule.tsx
components/portal/directions/StoreDirectionModule.tsx
components/portal/directions/RescueDiagnosisModule.tsx
components/portal/directions/DirectionModuleResolver.tsx
```

Resolver:

```tsx
export function DirectionModuleResolver({ bundle }: { bundle: PortalBundle }) {
  const directionType = bundle.scopeSnapshot?.direction?.type;

  switch (directionType) {
    case "product_direction":
      return <ProductDirectionModule bundle={bundle} />;

    case "workflow_direction":
      return <WorkflowDirectionModule bundle={bundle} />;

    case "store_direction":
      return <StoreDirectionModule bundle={bundle} />;

    case "rescue_diagnosis":
      return <RescueDiagnosisModule bundle={bundle} />;

    case "design_direction":
    default:
      return <WebsiteDesignDirectionModule bundle={bundle} />;
  }
}
```

---

## 15. Admin dashboard behavior

For every client action, there should be a matching admin control.

| Client sees | Admin can do |
|---|---|
| Complete Design Direction | Request / review / approve / lock |
| Complete Product Direction | Request / review / approve / lock |
| Upload assets | Mark received / request missing assets |
| Review preview | Mark preview ready / classify feedback |
| Approve launch | Mark launch approved / deploy |
| Complete UAT | Mark bug / new feature / accepted |

Admin project page should show:

- Project type
- Workflow template
- Direction type
- Direction status
- Current blocker
- Active client actions
- Active studio actions
- Milestone manager
- Direction review panel
- Public note
- Internal note
- Preview/live URL
- Agreement controls
- Launch checklist
- Handoff controls

---

## 16. API actions

Client-facing route:

```txt
POST /api/portal/[token]
```

Add actions:

```ts
direction_submit
required_action_submit
client_action_complete
```

Admin route:

```txt
POST /api/internal/portal/admin-update
```

Add admin actions:

```ts
direction_changes_requested
direction_approve
direction_lock
required_action_update
milestone_update
public_note_update
internal_note_update
launch_check_update
```

Direction submit payload:

```json
{
  "type": "direction_submit",
  "direction": {
    "type": "product_direction",
    "payload": {
      "appPurpose": "Client portal for a service business",
      "userRoles": [],
      "workflows": [],
      "mvpPriorities": {},
      "acceptanceCriteria": []
    }
  }
}
```

Validation:

```ts
const allowedDirectionByProjectType = {
  website: "design_direction",
  web_app: "product_direction",
  automation: "workflow_direction",
  ecommerce: "store_direction",
  rescue: "rescue_diagnosis",
};

if (direction.type !== allowedDirectionByProjectType[projectType]) {
  return NextResponse.json(
    { ok: false, error: "Invalid direction type for this project." },
    { status: 400 }
  );
}
```

---

## 17. Activity feed events

Add:

```ts
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

Display text should adapt by direction type:

| Direction type | Event text |
|---|---|
| `design_direction` | Design direction submitted |
| `product_direction` | Product direction submitted |
| `workflow_direction` | Workflow direction submitted |
| `store_direction` | Store direction submitted |
| `rescue_diagnosis` | Rescue diagnosis submitted |

---

## 18. Client flow by lane

### Website

Client provides:

| Stage | Client provides |
|---|---|
| Scope confirmation | Confirms pages, services, goals, CTA, timeline |
| Design Direction | Brand mood, style, colors, examples, tone |
| Content & Assets | Logo, photos, copy, services, testimonials, contact info |
| Preview Review | One complete batch of feedback |
| Launch Approval | Final approval, domain access, form email |
| Handoff | Confirms access and support preference |

Admin does:

| Stage | Admin action |
|---|---|
| Scope confirmation | Edit scope snapshot, lock package, set revision policy |
| Design Direction | Review/approve/lock design direction |
| Content & Assets | Mark assets received, request missing files |
| Build | Add preview URL, update public notes |
| Review | Mark feedback received, assign revision status |
| Launch | Mark domain/forms/SEO/analytics/handoff ready |
| Handoff | Add live URL, handoff notes, care plan offer |

### Custom Web App

Client provides:

| Stage | Client provides |
|---|---|
| Discovery | Business problem, users, current workflow, success goal |
| Product Direction | Roles, workflows, MVP features, screen needs |
| MVP Scope Lock | Must-have vs phase 2 vs future ideas |
| Architecture Review | Confirms integrations, accounts, data needs |
| UX/Wireframe Review | Reviews main screens and workflow sequence |
| UAT | Tests real scenarios and submits issues |
| Launch Approval | Confirms app is ready for production use |
| Handoff | Confirms admin access, support plan, training needs |

Admin does:

| Stage | Admin action |
|---|---|
| Discovery | Create requirements summary |
| Product Direction | Review/approve/lock product direction |
| MVP Scope | Lock must-have features and exclusions |
| Architecture | Add database/auth/payment/storage/integration notes |
| Wireframes | Add wireframe/preview links |
| Development | Update sprint status and internal notes |
| QA | Mark test checklist complete |
| UAT | Review client issues and classify bug vs new feature |
| Launch | Add production URL, admin credentials handoff notes |
| Support | Start warranty/support window |

### E-commerce

Client provides:

| Stage | Client provides |
|---|---|
| Store Direction | Platform, product types, store goals |
| Catalog | Product names, prices, descriptions, images |
| Operations | Shipping, tax, return policy, fulfillment process |
| Payments | Stripe/Shopify/Square/PayPal access |
| Store Review | Reviews storefront, product pages, checkout |
| Test Order | Approves checkout and order emails |
| Launch Approval | Domain, policies, final go-live approval |

Admin does:

| Stage | Admin action |
|---|---|
| Store Direction | Approve platform and store type |
| Catalog | Track missing product data |
| Store Build | Add preview/storefront URL |
| Checkout | Mark payment/shipping/tax configured |
| QA | Mark test order complete |
| Launch | Mark policies/domain/analytics ready |
| Handoff | Add store admin notes and support plan |

### Automation

Client provides:

| Stage | Client provides |
|---|---|
| Workflow Diagnosis | Current manual process, tools, pain points |
| Workflow Direction | Trigger, steps, approvals, outputs |
| Access | Tool logins/API keys/Zapier/Make access |
| Test Data | Real example records/files/forms |
| Test Run Review | Confirms automation works correctly |
| Go-Live Approval | Confirms when automation can run live |
| Handoff | Confirms documentation and owner |

Admin does:

| Stage | Admin action |
|---|---|
| Diagnosis | Create workflow map |
| Scope | Lock included automations |
| Access | Track credentials/access needed |
| Build | Add automation test links/screenshots |
| Test Run | Mark pass/fail |
| Go Live | Mark automation active |
| Handoff | Add documentation and rollback notes |

### Rescue

Client provides:

| Stage | Client provides |
|---|---|
| Rescue Intake | Current URL, what is broken, urgency |
| Access | Website/hosting/CMS access |
| Diagnosis Review | Confirms priority issues |
| Fix Plan Approval | Approves must-fix list |
| Review | Tests fixed pages/forms |
| Handoff | Confirms fixes and next-step recommendations |

Admin does:

| Stage | Admin action |
|---|---|
| Diagnosis | Add issue list and severity |
| Fix Plan | Mark must-fix vs optional |
| Access | Track login/hosting access |
| Fix Sprint | Update progress by issue |
| QA | Mark fixes tested |
| Handoff | Add final report and recommendations |

---

## 19. Locked scope copy

### Website

> Design Direction is locked. Feedback should now focus on content accuracy, clarity, missing information, bugs, and reasonable polish. Major visual direction changes may affect the timeline or require a change order.

### Custom Web App

> Product Direction is locked. New roles, workflows, dashboards, integrations, or major data changes may require a change order or future phase.

### Automation

> Workflow Direction is locked. New triggers, tools, outputs, or approval paths may require a change order.

### E-commerce

> Store Direction is locked. New product structures, checkout rules, shipping logic, or platform changes may require a change order.

### Rescue

> Fix Plan is locked. New issues discovered outside the approved priority list may be documented as recommendations or scoped separately.

---

## 20. Build order

### Phase 1 — Workflow config

Create:

```txt
lib/workflows/templates.ts
lib/workflows/resolveProjectType.ts
```

### Phase 2 — Portal creation

Update `ensureCustomerPortalForQuoteId()` to:

- Copy `project_type`
- Load template
- Store direction
- Store required actions
- Store launch checks
- Create milestones

### Phase 3 — Portal bundle

Update `buildWorkspaceView()` to return:

```ts
projectType
workflowTemplate
direction
requiredActions
launchChecks
```

### Phase 4 — Client portal UI

Add:

```txt
components/portal/RequiredActionsCard.tsx
components/portal/directions/DirectionModuleResolver.tsx
```

Then add the lane-specific direction modules.

### Phase 5 — API actions

Add direction and required-action submit/complete actions.

### Phase 6 — Admin dashboard

Add admin controls for direction review, required actions, milestones, notes, launch checks, and UAT classification.

### Phase 7 — Activity feed

Log direction, required action, milestone, and launch events.

### Phase 8 — Polish

Add locked-state copy, change-order warnings, empty states, and client-facing explanations.

---

## 21. Acceptance criteria

The implementation is successful when:

- A website quote creates a website portal with Design Direction.
- A custom app quote creates a web app portal with Product Direction.
- An automation quote creates an automation portal with Workflow Direction.
- An e-commerce quote creates a store portal with Store Direction.
- A rescue quote creates a rescue portal with Rescue Diagnosis.
- Each portal uses the correct milestones.
- Each portal shows the correct active required action.
- Admin can review, approve, lock, and request changes for direction modules.
- Completing/locking a direction module marks the correct milestone complete.
- Activity feed logs direction submissions and approvals.
- Existing website portal behavior does not break.
- Legacy quotes without `project_type` default to `website`.

---

## 22. Final recommendation

Implement this as:

```txt
One portal engine
+ five workflow templates
+ lane-specific direction modules
+ shared required actions
+ shared admin controls
```

The client portal should answer:

> What do I need to do right now?

The admin dashboard should answer:

> What am I waiting on, and what do I need to do next?

That is how CrecyStudio becomes a professional project operating system, not just a client dashboard.
