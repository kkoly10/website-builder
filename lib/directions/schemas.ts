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

// ─── Resolver ────────────────────────────────────────────────────────────

export const DIRECTION_SCHEMA_BY_TYPE: Partial<Record<DirectionType, DirectionSchema>> = {
  product_direction: PRODUCT_DIRECTION_SCHEMA,
  workflow_direction: WORKFLOW_DIRECTION_SCHEMA,
  store_direction: STORE_DIRECTION_SCHEMA,
  rescue_diagnosis: RESCUE_DIAGNOSIS_SCHEMA,
  // design_direction intentionally absent — handled by Phase 2A's
  // WebsiteDesignDirection components, not the generic flow.
};

export function getDirectionSchema(directionType: DirectionType): DirectionSchema | null {
  return DIRECTION_SCHEMA_BY_TYPE[directionType] ?? null;
}
