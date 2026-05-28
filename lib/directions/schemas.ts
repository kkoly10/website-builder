// Form schemas for each non-website direction. The schema drives
// rendering in DirectionForm and validation in validateDirectionPayload.
//
// Kept intentionally lean for Phase 3.3 — only the most-essential fields
// per lane. Future PRs can add more without touching the resolver.

import type { DirectionType } from "@/lib/workflows/types";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "string-list"
  | "pills-multi";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  // For "select" / "pills-multi" types
  options?: readonly string[];
  // Per-field constraints
  maxItems?: number;
  maxLength?: number;
  // Optional section header. When a field's section differs from the
  // previous field's section, DirectionForm renders a visible heading
  // before the field. Lets long schemas (e.g. PORTAL_DIRECTION_SCHEMA
  // with 15 fields) group into logical clusters instead of feeling like
  // a wall of inputs. Backward-compatible — schemas without sections
  // render exactly as before.
  section?: string;
};

export type DirectionSchema = {
  fields: FieldDef[];
};

// ─── Product Direction (web_app) ─────────────────────────────────────────

export const PRODUCT_DIRECTION_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "appPurpose",
      label: "What does this app do?",
      type: "textarea",
      required: true,
      helpText:
        "One paragraph describing the app's core purpose and the problem it solves.",
      maxLength: 4000,
    },
    {
      key: "targetUsers",
      label: "Who uses it?",
      type: "string-list",
      required: true,
      helpText: "Add a tag for each distinct user or audience type.",
      maxItems: 10,
    },
    {
      key: "userRoles",
      label: "User roles / permissions",
      type: "string-list",
      helpText: "e.g. Admin, Manager, Staff, Customer. Leave blank if just one role.",
      maxItems: 8,
    },
    {
      key: "keyWorkflows",
      label: "Key workflows",
      type: "textarea",
      required: true,
      helpText: "List the 3–5 most important things users will do in the app.",
      maxLength: 4000,
    },
    {
      key: "integrations",
      label: "Integrations needed",
      type: "string-list",
      helpText: "External tools or APIs (e.g. Stripe, QuickBooks, Twilio).",
      maxItems: 12,
    },
    {
      key: "acceptanceCriteria",
      label: "How will you know the MVP is done?",
      type: "textarea",
      required: true,
      helpText: "What capabilities must work for you to call this MVP launched?",
      maxLength: 4000,
    },
  ],
};

// ─── Workflow Direction (automation) ─────────────────────────────────────

export const WORKFLOW_DIRECTION_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "currentProcess",
      label: "Current manual process",
      type: "textarea",
      required: true,
      helpText: "Walk us through how this gets done today, step by step.",
      maxLength: 4000,
    },
    {
      key: "trigger",
      label: "What kicks off the workflow?",
      type: "text",
      required: true,
      helpText: "e.g. 'New form submission', 'Daily at 9am', 'New row in spreadsheet'.",
      maxLength: 500,
    },
    {
      key: "toolsInvolved",
      label: "Tools involved",
      type: "string-list",
      required: true,
      helpText: "List every tool the automation needs to read or write to.",
      maxItems: 12,
    },
    {
      key: "outputs",
      label: "Outputs / desired result",
      type: "textarea",
      required: true,
      helpText: "What should happen at the end of the automation?",
      maxLength: 2000,
    },
    {
      key: "successMetric",
      label: "How do you measure success?",
      type: "text",
      helpText: "e.g. 'Save 5 hours/week', 'Zero missed leads'.",
      maxLength: 500,
    },
  ],
};

// ─── Store Direction (ecommerce) ─────────────────────────────────────────

const PLATFORM_OPTIONS = [
  "Shopify",
  "WooCommerce",
  "Squarespace",
  "BigCommerce",
  "Custom",
  "Not sure",
] as const;

const PAYMENT_OPTIONS = [
  "Stripe",
  "Shopify Payments",
  "PayPal",
  "Square",
  "Apple Pay / Google Pay",
  "Buy now, pay later",
  "Other",
] as const;

export const STORE_DIRECTION_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "platform",
      label: "E-commerce platform",
      type: "select",
      required: true,
      options: PLATFORM_OPTIONS,
    },
    {
      key: "productCatalogSize",
      label: "Roughly how many products?",
      type: "text",
      required: true,
      helpText: "Just a ballpark number range.",
      maxLength: 200,
    },
    {
      key: "productCategories",
      label: "Product categories",
      type: "string-list",
      helpText: "Top-level categories you'd want shoppers to browse.",
      maxItems: 12,
    },
    {
      key: "paymentNeeds",
      label: "Payment methods",
      type: "pills-multi",
      options: PAYMENT_OPTIONS,
      required: true,
      helpText: "Pick everything you want to accept at checkout.",
    },
    {
      key: "shippingRules",
      label: "Shipping",
      type: "textarea",
      helpText: "Where do you ship to, and how is shipping calculated?",
      maxLength: 2000,
    },
    {
      key: "policyNeeds",
      label: "Returns / policies",
      type: "textarea",
      helpText:
        "Outline your return, refund, and shipping policies (or paste links).",
      maxLength: 4000,
    },
  ],
};

// ─── Rescue Diagnosis (rescue) ───────────────────────────────────────────

const URGENCY_OPTIONS = ["Low", "Medium", "High", "Critical"] as const;

export const RESCUE_DIAGNOSIS_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "currentUrl",
      label: "Live site URL",
      type: "text",
      required: true,
      helpText: "The site that needs fixing.",
      maxLength: 500,
    },
    {
      key: "reportedIssues",
      label: "What's broken?",
      type: "string-list",
      required: true,
      helpText: "Add a tag for each issue you've noticed.",
      maxItems: 20,
    },
    {
      key: "urgency",
      label: "Urgency",
      type: "select",
      required: true,
      options: URGENCY_OPTIONS,
    },
    {
      key: "businessImpact",
      label: "Business impact",
      type: "textarea",
      required: true,
      helpText: "How is this affecting your business? (lost revenue, missed leads, etc.)",
      maxLength: 4000,
    },
    {
      key: "priorityFixes",
      label: "Must-fix items",
      type: "textarea",
      helpText: "If we can only fix some, which ones matter most?",
      maxLength: 4000,
    },
    {
      key: "accessNeeded",
      label: "Access available",
      type: "string-list",
      helpText: "What credentials/access can you provide? (CMS login, hosting, repo, etc.)",
      maxItems: 10,
    },
  ],
};

// ─── Portal Direction (client_portal) ────────────────────────────────────

const PORTAL_ACCESS_TYPES = [
  "Clients only",
  "Team only",
  "Both clients and team",
  "External partners",
] as const;

const PORTAL_KEY_FEATURES = [
  "Payments / Stripe",
  "File uploads + storage",
  "Milestones + timeline",
  "Messaging",
  "Scheduling / booking",
  "Custom forms",
  "Multi-tenant data isolation",
  "White-label branding",
] as const;

const PORTAL_MULTI_TENANCY_OPTIONS = [
  "Single tenant (one organization)",
  "Shared data across all users",
  "Multi-tenant with strict per-org data isolation",
] as const;

const PORTAL_COMPLIANCE_OPTIONS = [
  "GDPR",
  "HIPAA",
  "SOC 2",
  "Accessibility (WCAG 2.1 AA)",
  "PCI DSS",
  "Other",
] as const;

const PORTAL_AUTH_METHOD_OPTIONS = [
  "Email + password",
  "Magic link (passwordless email)",
  "Single sign-on (SSO / Google Workspace / Microsoft 365)",
  "Social login (Google / Apple)",
  "Invite-only (admin creates accounts)",
  "Not sure — recommend the right one",
] as const;

const PORTAL_BRANDING_OPTIONS = [
  "Custom logo",
  "Custom colors",
  "Custom domain (e.g. portal.yourdomain.com)",
  "Custom email-from address",
  "Full white-label (no CrecyStudio attribution)",
  "Match existing brand guidelines",
] as const;

export const PORTAL_DIRECTION_SCHEMA: DirectionSchema = {
  fields: [
    {
      key: "portalPurpose",
      label: "What does this portal do?",
      type: "textarea",
      required: true,
      helpText: "One paragraph: the portal's core job and the problem it solves.",
      maxLength: 4000,
      section: "Identity",
    },
    {
      key: "accessType",
      label: "Who has access?",
      type: "select",
      required: true,
      options: PORTAL_ACCESS_TYPES,
      section: "Access & roles",
    },
    {
      key: "userRoles",
      label: "User roles",
      type: "string-list",
      required: true,
      helpText:
        "Distinct roles (e.g. Admin, Reviewer, Billing-only, External Partner). Separate from raw permissions — combine when a user has multiple roles.",
      maxItems: 8,
      section: "Access & roles",
    },
    {
      key: "rolePermissions",
      label: "What can each role do?",
      type: "textarea",
      required: true,
      helpText:
        "High-level permissions per role. Example: \"Admin: full access. Reviewer: read + comment on milestones. Billing-only: invoices + payment only.\" The detailed matrix gets locked during build.",
      maxLength: 4000,
      section: "Access & roles",
    },
    {
      key: "authMethod",
      label: "How do users sign in?",
      type: "select",
      required: true,
      options: PORTAL_AUTH_METHOD_OPTIONS,
      helpText:
        "Drives the auth provider build + how onboarding flows work for new users.",
      section: "Access & roles",
    },
    {
      key: "keyFeatures",
      label: "Must-have features",
      type: "pills-multi",
      required: true,
      options: PORTAL_KEY_FEATURES,
      helpText: "Pick the features the portal can't ship without.",
      maxItems: 8,
      section: "Features & screens",
    },
    {
      key: "screenInventory",
      label: "Main screens / pages",
      type: "string-list",
      required: true,
      helpText:
        "List the main screens users will see (e.g. Dashboard, Projects, Files, Messages, Billing, Settings). The IA gets refined during wireframes; this is the starting set.",
      maxItems: 15,
      section: "Features & screens",
    },
    {
      key: "integrations",
      label: "External systems to connect",
      type: "string-list",
      helpText:
        "CRM, accounting, file storage, Airtable/Sheets/Postgres — what the portal needs to read or write to.",
      maxItems: 12,
      section: "Integrations",
    },
    {
      key: "integrationFlows",
      label: "For each integration: read, write, or sync?",
      type: "textarea",
      helpText:
        "For each integration above, note direction (portal → external, external → portal, or two-way sync) and frequency (real-time, hourly, daily).",
      maxLength: 3000,
      section: "Integrations",
    },
    {
      key: "multiTenancyModel",
      label: "Data isolation model",
      type: "select",
      required: true,
      options: PORTAL_MULTI_TENANCY_OPTIONS,
      helpText:
        "For B2B portals serving multiple client organizations, strict per-org isolation is the boutique-tier default and what compliance frameworks require.",
      section: "Compliance & data",
    },
    {
      key: "complianceRequirements",
      label: "Compliance / regulatory needs",
      type: "pills-multi",
      options: PORTAL_COMPLIANCE_OPTIONS,
      helpText: "Pick all that apply. Each adds specific build requirements.",
      maxItems: 6,
      section: "Compliance & data",
    },
    {
      key: "auditTrailEvents",
      label: "What actions need an audit trail?",
      type: "textarea",
      helpText:
        "What user/admin actions should be logged for compliance, troubleshooting, or accountability. Example: \"all payments, role changes, file deletions, login from new IP.\"",
      maxLength: 2000,
      section: "Compliance & data",
    },
    {
      key: "notificationsEvents",
      label: "What triggers notifications?",
      type: "textarea",
      helpText:
        "What events generate email or in-app alerts. Example: \"milestone completed, file uploaded, message received, payment failed.\"",
      maxLength: 2000,
      section: "Compliance & data",
    },
    {
      key: "brandingRequirements",
      label: "Branding scope",
      type: "pills-multi",
      options: PORTAL_BRANDING_OPTIONS,
      helpText:
        "Pick what applies. Full white-label and custom domain typically lift the project into the Standalone or Enterprise tier.",
      maxItems: 6,
      section: "Branding",
    },
    {
      key: "successMetric",
      label: "How will you know it's working?",
      type: "textarea",
      required: true,
      helpText:
        "What changes about your operation when this portal is live? Concrete is better than vague.",
      maxLength: 2000,
      section: "Success",
    },
  ],
};

// ─── Resolver ────────────────────────────────────────────────────────────

export const DIRECTION_SCHEMA_BY_TYPE: Partial<Record<DirectionType, DirectionSchema>> = {
  product_direction: PRODUCT_DIRECTION_SCHEMA,
  workflow_direction: WORKFLOW_DIRECTION_SCHEMA,
  store_direction: STORE_DIRECTION_SCHEMA,
  rescue_diagnosis: RESCUE_DIAGNOSIS_SCHEMA,
  portal_direction: PORTAL_DIRECTION_SCHEMA,
  // design_direction intentionally absent — handled by Phase 2A's
  // WebsiteDesignDirection components, not the generic flow.
};

export function getDirectionSchema(directionType: DirectionType): DirectionSchema | null {
  return DIRECTION_SCHEMA_BY_TYPE[directionType] ?? null;
}
