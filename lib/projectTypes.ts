export type ProjectStatus = "in_progress" | "review_needed" | "ready_for_launch";

export type MilestoneKey =
  | "deposit_received"
  | "design_in_progress"
  | "design_review"
  | "final_build"
  | "launch";

export type Milestone = {
  key: MilestoneKey;
  title: string;
  description?: string;
};

export type PaymentPlan = {
  totalPrice: number;
  amountPaid: number;
  nextPaymentDueLabel: string; // e.g. "At design approval"
};

export type RevisionPolicy = {
  included: number;
  used: number;
};

export type ProjectReferences = {
  referenceUrl?: string;
  clientNotes?: string;
  internalNotes?: string;
};

export type Project = {
  id: string;
  clientName: string;
  projectName: string;
  websiteType: string; // "Business website", "Landing page", etc.
  platform: string; // "Wix", "Custom", etc.
  startDateLabel: string; // "Feb 2, 2026"
  estimatedLaunchLabel: string; // "1–2 weeks"
  status: ProjectStatus;

  // workflow
  milestones: Milestone[];
  activeMilestoneKey: MilestoneKey;

  // business
  payment: PaymentPlan;
  revisions: RevisionPolicy;
  references: ProjectReferences;
};