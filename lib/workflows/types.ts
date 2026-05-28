// Canonical workflow types. The source of truth for project-type-aware
// routing across the portal engine. See CRECYSTUDIO_LAUNCH_AND_PORTAL_PLAN.md
// § Phase 3 for the full rationale.
//
// Two related-but-distinct concepts:
//   - ProjectType: workflow lanes with a WORKFLOW_TEMPLATE, portal,
//     direction record, and admin pipeline. The exhaustive set the
//     portal engine knows how to drive end-to-end.
//   - LeadProjectType: everything that can be submitted as a lead at
//     intake time, INCLUDING categories that don't (yet) have a workflow
//     template — most notably "ai_integration", which routes through a
//     manual sales path given the price point ($10k-$120k). Distinguishing
//     these two prevents WORKFLOW_TEMPLATES / ALLOWED_DIRECTION_BY_PROJECT_TYPE
//     from being forced into Partial maps just because lead categories
//     exist without templates.
//
// Single source of truth for both: import from this module. Local copies
// in adminProjectData.ts, submit-estimate, BuildIntroClient, etc. were
// removed because each drifted independently and silently downgraded
// unknown values to "website".

export type ProjectType =
  | "website"
  | "web_app"
  | "automation"
  | "ecommerce"
  | "rescue"
  | "client_portal";

// All categories accepted at intake / submit-estimate. Superset of
// ProjectType because some leads (currently: ai_integration) don't have
// a workflow template but DO have valid quotes in the DB.
export type LeadProjectType = ProjectType | "ai_integration";

export type DirectionType =
  | "design_direction"
  | "product_direction"
  | "workflow_direction"
  | "store_direction"
  | "rescue_diagnosis"
  | "portal_direction";

export type ActionOwner = "client" | "studio" | "system";

// Action lifecycle. Used by both required-action records and direction
// records. Some states only apply to certain action types (e.g. "locked"
// for direction; "complete" for required actions).
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

export type WorkflowMilestone = {
  key: string;
  title: string;
  owner: ActionOwner;
  sortOrder: number;
};

export type WorkflowRequiredAction = {
  key: string;
  title: string;
  description: string;
  owner: ActionOwner;
  status: ActionStatus;
  unlocksMilestone?: string;
};

export type WorkflowLaunchCheck = {
  key: string;
  title: string;
  owner: ActionOwner;
};

export type WorkflowDirection<P extends Record<string, unknown> = Record<string, unknown>> = {
  type: DirectionType;
  status: ActionStatus;
  payload: P;
};

export type WorkflowTemplate = {
  projectType: ProjectType;
  label: string;
  directionType: DirectionType;
  milestones: WorkflowMilestone[];
  requiredActions: WorkflowRequiredAction[];
  launchChecks: WorkflowLaunchCheck[];
  direction: WorkflowDirection;
};

// Strict map: each project type has exactly one allowed direction type.
// Used by API validation to refuse direction submissions that don't
// match the project's lane.
export const ALLOWED_DIRECTION_BY_PROJECT_TYPE: Record<ProjectType, DirectionType> = {
  website: "design_direction",
  web_app: "product_direction",
  automation: "workflow_direction",
  ecommerce: "store_direction",
  rescue: "rescue_diagnosis",
  client_portal: "portal_direction",
};

export const PROJECT_TYPES: readonly ProjectType[] = [
  "website",
  "web_app",
  "automation",
  "ecommerce",
  "rescue",
  "client_portal",
] as const;

// Superset including lead-only categories. Used by intake / submit-estimate
// and any admin surface that needs to recognize ai_integration leads
// without trying to look up a workflow template for them.
export const LEAD_PROJECT_TYPES: readonly LeadProjectType[] = [
  ...PROJECT_TYPES,
  "ai_integration",
] as const;

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && (PROJECT_TYPES as readonly string[]).includes(value);
}

export function isLeadProjectType(value: unknown): value is LeadProjectType {
  return typeof value === "string" && (LEAD_PROJECT_TYPES as readonly string[]).includes(value);
}
