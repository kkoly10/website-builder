// Generic direction record for non-website lanes (web_app, automation,
// ecommerce, rescue). The website lane keeps its richer Phase 2A
// WebsiteDesignDirection shape — they coexist behind DirectionModuleResolver
// to avoid rewriting working code while extending coverage to other lanes.
//
// Storage: customer_portal_projects.scope_snapshot.direction
// (vs Phase 2A's customer_portal_projects.scope_snapshot.designDirection)

import type { DirectionType } from "@/lib/workflows/types";

// Narrower than ActionStatus from lib/workflows/types — directions don't
// use "complete" or "blocked" (those apply to required-actions). And no
// "waiting_on_studio" — that's implicit when status is submitted /
// under_review. Same enum as WebsiteDesignDirectionStatus by design.
export type DirectionStatus =
  | "not_started"
  | "waiting_on_client"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "locked";

export type GenericDirection = {
  type: DirectionType;
  status: DirectionStatus;
  // Lane-specific shape. Validated against the lane's schema by
  // validateDirectionPayload. Stored as-is in JSON.
  payload: Record<string, unknown>;

  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  changesRequestedAt: string | null;

  adminPublicNote: string | null;
  adminInternalNote: string | null;
};

// Subset the client sends on submit. Status, timestamps, and admin notes
// are server-managed.
export type GenericDirectionInput = {
  payload: Record<string, unknown>;
  approvedDirectionTerms: boolean;
};

// Validation result. Use the shared Result<T> shape so callers don't
// have to worry about Next.js / Turbopack narrowing — see lib/result.ts.
import type { Result } from "@/lib/result";
export type GenericDirectionValidationResult = Result<GenericDirectionInput>;
