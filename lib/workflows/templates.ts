// Workflow templates for each project lane. Each template defines the
// milestones, required actions, launch checks, and default direction
// payload that a portal of that type should be seeded with.
//
// The website template intentionally mirrors the 8-step structure shipped
// in Phase 2A (lib/customerPortal.ts WEBSITE_DEFAULT_MILESTONES). When
// Phase 3.2 wires this into ensureCustomerPortalForQuoteId, that constant
// can be retired in favor of this template.

import type {
  ProjectType,
  WorkflowTemplate,
} from "./types";
import { DEFAULT_WEBSITE_DESIGN_DIRECTION } from "@/lib/designDirection";

// ─── Website ─────────────────────────────────────────────────────────────

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
      description:
        "Choose the brand mood, visual style, color guidance, typography feel, imagery direction, and reference websites.",
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
    // Reuse the Phase 2A default so existing Design Direction logic keeps
    // working when Phase 3 starts seeding portals via this template.
    payload: { ...DEFAULT_WEBSITE_DESIGN_DIRECTION } as unknown as Record<string, unknown>,
  },
};

// ─── Custom Web App ──────────────────────────────────────────────────────

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
      description:
        "Confirm app purpose, users, roles, workflows, MVP priorities, data records, integrations, and acceptance criteria.",
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
      mvpPriorities: { mustHave: [], phaseTwo: [], futureIdeas: [] },
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

// ─── Workflow Automation ─────────────────────────────────────────────────

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
      description:
        "Describe the current manual process, tools, triggers, outputs, approvals, and success metric.",
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

// ─── E-commerce Store ────────────────────────────────────────────────────

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
      description:
        "Confirm platform, products, checkout, shipping, tax, policies, and store goals.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "store_direction_approved",
    },
    {
      key: "upload_product_catalog",
      title: "Upload product catalog",
      description:
        "Provide product names, prices, descriptions, images, categories, variants, and inventory notes.",
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

// ─── Website Rescue ──────────────────────────────────────────────────────

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
      description:
        "Confirm current URL, reported issues, urgency, business impact, and priority fixes.",
      owner: "client",
      status: "waiting_on_client",
      unlocksMilestone: "diagnosis_complete",
    },
    {
      key: "approve_fix_plan",
      title: "Approve fix plan",
      description:
        "Approve must-fix items and optional recommendations before the rescue sprint begins.",
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

// ─── Unified export ──────────────────────────────────────────────────────

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
