// Required-actions persistence helpers (Phase 3.10).
//
// One row per (portal_project_id, action_key). Seeded from the workflow
// template when a portal is created; admin can add ad-hoc actions later
// through a future admin UI (Phase 3.9 admin side, not in scope yet).

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProjectType } from "@/lib/workflows/types";
import { getWorkflowTemplate } from "@/lib/workflows/templates";

export type RequiredActionStatus =
  | "not_started"
  | "waiting_on_client"
  | "submitted"
  | "complete"
  | "blocked";

export type RequiredActionOwner = "client" | "studio" | "system";

export type RequiredAction = {
  id: string;
  portalProjectId: string;
  actionKey: string;
  owner: RequiredActionOwner;
  title: string;
  description: string | null;
  status: RequiredActionStatus;
  dueDate: string | null;
  completedAt: string | null;
  unlocksMilestoneKey: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type RawRow = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function rowToAction(row: RawRow): RequiredAction {
  const owner = asString(row.owner);
  const status = asString(row.status);
  return {
    id: asString(row.id),
    portalProjectId: asString(row.portal_project_id),
    actionKey: asString(row.action_key),
    owner: (owner === "studio" || owner === "system" ? owner : "client") as RequiredActionOwner,
    title: asString(row.title),
    description: typeof row.description === "string" ? row.description : null,
    status: (
      [
        "not_started",
        "waiting_on_client",
        "submitted",
        "complete",
        "blocked",
      ] as const
    ).includes(status as RequiredActionStatus)
      ? (status as RequiredActionStatus)
      : "not_started",
    dueDate: typeof row.due_date === "string" ? row.due_date : null,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
    unlocksMilestoneKey:
      typeof row.unlocks_milestone_key === "string" && row.unlocks_milestone_key
        ? row.unlocks_milestone_key
        : null,
    payload: asObject(row.payload),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

// Seed required actions for a freshly-created portal from the workflow
// template. Idempotent — the unique (portal_project_id, action_key)
// constraint plus on-conflict-do-nothing means re-running won't dupe.
export async function seedRequiredActionsForPortal(input: {
  portalProjectId: string;
  projectType: ProjectType;
}) {
  const template = getWorkflowTemplate(input.projectType);
  const rows = template.requiredActions.map((a) => ({
    portal_project_id: input.portalProjectId,
    action_key: a.key,
    owner: a.owner,
    title: a.title,
    description: a.description,
    // The template's "status" field ("waiting_on_client", "not_started")
    // maps directly to our DB enum.
    status: a.status,
    unlocks_milestone_key: a.unlocksMilestone ?? null,
  }));

  if (rows.length === 0) return;

  // upsert with ignore so re-seeding is a no-op. Uses the unique
  // (portal_project_id, action_key) constraint defined in migration
  // 20260507_create_customer_portal_required_actions.
  const { error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .upsert(rows, {
      onConflict: "portal_project_id,action_key",
      ignoreDuplicates: true,
    });

  if (error) {
    // Don't break portal creation if the table doesn't exist yet
    // (migration not applied). Log and continue. Once the migration is
    // applied this branch becomes unreachable.
    console.error("[requiredActions] seed error:", error.message);
  }
}

// Fetch all required actions for a portal, ordered by created_at so the
// rendering matches the template's defined order.
export async function listRequiredActionsForPortal(
  portalProjectId: string,
): Promise<RequiredAction[]> {
  const { data, error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .select("*")
    .eq("portal_project_id", portalProjectId)
    .order("created_at", { ascending: true });

  if (error) {
    // Same fail-soft behavior. Return empty so the portal still loads.
    console.error("[requiredActions] list error:", error.message);
    return [];
  }
  return (data ?? []).map(rowToAction);
}

// Update a required action's status by (portal_project_id, action_key).
// Used by direction submit/transition flows to keep the
// required-actions card in sync with what the client has actually done
// — submitting a direction marks the corresponding action complete;
// admin requesting changes re-opens it.
export async function updateRequiredActionStatusByPortalId(input: {
  portalProjectId: string;
  actionKey: string;
  status: RequiredActionStatus;
  // Optional: clear completed_at when re-opening (status going back to
  // waiting_on_client/not_started). Set true when reverting.
  clearCompletedAt?: boolean;
}): Promise<void> {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: input.status,
    updated_at: now,
  };
  if (input.status === "complete") {
    updates.completed_at = now;
  } else if (input.clearCompletedAt) {
    updates.completed_at = null;
  }

  const { error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .update(updates)
    .eq("portal_project_id", input.portalProjectId)
    .eq("action_key", input.actionKey);

  if (error) {
    // Same fail-soft as elsewhere — log and continue. The direction
    // submit/transition flow shouldn't break just because the
    // required-actions sync failed.
    console.error("[requiredActions] status update error:", error.message);
  }
}

// Mark a required action complete from the client portal. Sets
// status="complete" and completed_at=now. Idempotent — already-complete
// actions return null.
//
// Restricted to client-owned actions: a portal token authenticates the
// client, but the action_key is whatever the client chooses to send.
// Without the owner gate, a client could complete studio-owned actions
// like "complete_uat" or "approve_production_launch" by guessing the key
// — those are admin-side state transitions and shouldn't be self-served.
// Studio actions move through admin-side helpers instead.
export async function completeRequiredActionByPortalToken(input: {
  token: string;
  actionKey: string;
  payload?: Record<string, unknown>;
}): Promise<RequiredAction | null> {
  const { data: portal } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id")
    .eq("access_token", input.token)
    .maybeSingle();
  if (!portal?.id) {
    throw new Error("Portal not found");
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: "complete",
    completed_at: now,
    updated_at: now,
  };
  if (input.payload) {
    updates.payload = input.payload;
  }

  const { data, error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .update(updates)
    .eq("portal_project_id", portal.id)
    .eq("action_key", input.actionKey)
    // Lock down to client-owned actions only.
    .eq("owner", "client")
    .neq("status", "complete")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null; // already complete, doesn't exist, or not client-owned
  return rowToAction(data);
}
