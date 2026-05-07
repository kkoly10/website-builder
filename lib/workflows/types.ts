// Canonical workflow types. The source of truth for project-type-aware
// routing across the portal engine. See CRECYSTUDIO_LAUNCH_AND_PORTAL_PLAN.md
// § Phase 3 for the full rationale.
//
// Other modules currently define overlapping ProjectType enums
// (lib/adminProjectData.ts, lib/pricing/types.ts). Migration to this
// canonical module happens incrementally — Phase 3.1 just establishes
// the source of truth without breaking existing callers.

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
};

export const PROJECT_TYPES: readonly ProjectType[] = [
  "website",
  "web_app",
  "automation",
  "ecommerce",
  "rescue",
] as const;

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && (PROJECT_TYPES as readonly string[]).includes(value);
}
