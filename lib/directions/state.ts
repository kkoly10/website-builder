// State helpers for the generic direction record. Mirrors the shape of
// Phase 2A's lib/designDirection.ts so callers in lib/customerPortal.ts
// can swap in either depending on the lane.

import type { DirectionType, ProjectType } from "@/lib/workflows/types";
import { ALLOWED_DIRECTION_BY_PROJECT_TYPE } from "@/lib/workflows/types";
import { getWorkflowTemplate } from "@/lib/workflows/templates";
import type {
  DirectionStatus,
  GenericDirection,
  GenericDirectionInput,
} from "./types";

// Build a fresh default direction record for a given project type. Used
// to seed scope_snapshot.direction when a new non-website portal is
// created. Pulls the default payload from the lane's workflow template.
export function buildDefaultDirection(projectType: ProjectType): GenericDirection {
  const template = getWorkflowTemplate(projectType);
  return {
    type: template.directionType,
    status: "waiting_on_client",
    payload: { ...template.direction.payload },
    submittedAt: null,
    reviewedAt: null,
    approvedAt: null,
    lockedAt: null,
    changesRequestedAt: null,
    adminPublicNote: null,
    adminInternalNote: null,
  };
}

// True iff the portal's scope_snapshot has an explicit direction record.
// Same pattern as hasDesignDirection — legacy portals have no record and
// shouldn't get the feature applied retroactively.
export function hasDirection(scopeSnapshot: unknown): boolean {
  if (!scopeSnapshot || typeof scopeSnapshot !== "object") return false;
  const raw = (scopeSnapshot as Record<string, unknown>).direction;
  return Boolean(raw && typeof raw === "object");
}

// Read scope_snapshot.direction. Returns null when no record exists so
// the caller can distinguish legacy from active.
export function readDirection(scopeSnapshot: unknown): GenericDirection | null {
  if (!hasDirection(scopeSnapshot)) return null;
  const raw = (scopeSnapshot as Record<string, unknown>).direction;
  return raw as GenericDirection;
}

// Merge a validated input into an existing direction record. The
// directionType must match what the project type allows. Status and
// timestamps are left for the caller to update.
export function mergeDirection(
  existing: GenericDirection,
  input: GenericDirectionInput,
): GenericDirection {
  return {
    ...existing,
    payload: { ...existing.payload, ...input.payload },
  };
}

// Verify the directionType matches what's allowed for the project type.
export function isAllowedDirectionForProjectType(
  projectType: ProjectType,
  directionType: DirectionType,
): boolean {
  return ALLOWED_DIRECTION_BY_PROJECT_TYPE[projectType] === directionType;
}

export type { DirectionStatus };
