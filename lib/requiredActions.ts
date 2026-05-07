// Required-actions persistence helpers (Phase 3.10).
//
// One row per (portal_project_id, action_key). Seeded from the workflow
// template when a portal is created; admin can add ad-hoc actions later
// through a future admin UI (Phase 3.9 admin side, not in scope yet).

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProjectType } from "@/lib/workflows/types";
import { getWorkflowTemplate } from "@/lib/workflows/templates";
import { logProjectActivityByPortalId } from "@/lib/projectActivity";

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

  const action = rowToAction(data);

  // Match the activity-log pattern of every other portal helper
  // (submitAsset, submitDirection, toggleMilestone, ...). Without this
  // entry the chronological feed had a gap whenever a client completed
  // a "simple" required action that didn't route through a dedicated
  // form.
  await logProjectActivityByPortalId({
    portalProjectId: portal.id,
    actorRole: "client",
    eventType: "required_action_completed",
    summary: `Client completed required action: ${action.title || action.actionKey}.`,
    payload: { actionKey: action.actionKey },
    clientVisible: true,
  });

  return action;
}

// ─────────────────────────────────────────────────────────────────
// Admin-side CRUD. Phase 3.10's MVP shipped without these — the only
// path to required actions was the client portal's "Mark complete"
// button on its own owned actions. Below is the full admin surface so
// a stuck project can be unstuck without DB intervention: list any
// portal's actions (incl. studio-owned), add ad-hoc actions, edit
// title / description / due / owner / status, force-complete or
// reopen on the client's behalf, and delete bad seeds.
// ─────────────────────────────────────────────────────────────────

async function getPortalIdByQuoteId(quoteId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("Portal not found for quote");
  return data.id;
}

export async function listAllRequiredActionsForQuoteId(
  quoteId: string,
): Promise<RequiredAction[]> {
  const portalId = await getPortalIdByQuoteId(quoteId);
  return listRequiredActionsForPortal(portalId);
}

export async function createRequiredActionForQuoteId(input: {
  quoteId: string;
  actionKey: string;
  title: string;
  owner?: RequiredActionOwner;
  description?: string | null;
  status?: RequiredActionStatus;
  dueDate?: string | null;
  unlocksMilestoneKey?: string | null;
  payload?: Record<string, unknown>;
}): Promise<RequiredAction> {
  const portalId = await getPortalIdByQuoteId(input.quoteId);
  const actionKey = input.actionKey.trim();
  const title = input.title.trim();
  if (!actionKey) throw new Error("actionKey is required");
  if (!title) throw new Error("title is required");

  const { data, error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .insert({
      portal_project_id: portalId,
      action_key: actionKey,
      owner: input.owner ?? "client",
      title,
      description: input.description ?? null,
      status: input.status ?? "waiting_on_client",
      due_date: input.dueDate ?? null,
      unlocks_milestone_key: input.unlocksMilestoneKey ?? null,
      payload: input.payload ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: portalId,
    actorRole: "studio",
    eventType: "required_action_created",
    summary: `Studio added required action: ${title}.`,
    payload: { actionKey, owner: input.owner ?? "client" },
    clientVisible: input.owner === "client" || input.owner === undefined,
  });

  return rowToAction(data);
}

// Patch fields on an existing action by id. Pass only the fields you
// want to change. Status flips automatically maintain completed_at:
// going to "complete" stamps it; going back from complete clears it.
export async function updateRequiredActionForQuoteId(input: {
  quoteId: string;
  actionId: string;
  patch: {
    title?: string;
    description?: string | null;
    owner?: RequiredActionOwner;
    status?: RequiredActionStatus;
    dueDate?: string | null;
    unlocksMilestoneKey?: string | null;
    payload?: Record<string, unknown>;
  };
}): Promise<RequiredAction | null> {
  const portalId = await getPortalIdByQuoteId(input.quoteId);
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  const p = input.patch;
  if (p.title !== undefined) updates.title = p.title.trim();
  if (p.description !== undefined) updates.description = p.description;
  if (p.owner !== undefined) updates.owner = p.owner;
  if (p.dueDate !== undefined) updates.due_date = p.dueDate;
  if (p.unlocksMilestoneKey !== undefined) updates.unlocks_milestone_key = p.unlocksMilestoneKey;
  if (p.payload !== undefined) updates.payload = p.payload;
  if (p.status !== undefined) {
    updates.status = p.status;
    if (p.status === "complete") {
      updates.completed_at = now;
    } else {
      updates.completed_at = null;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .update(updates)
    .eq("id", input.actionId)
    .eq("portal_project_id", portalId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  await logProjectActivityByPortalId({
    portalProjectId: portalId,
    actorRole: "studio",
    eventType: "required_action_updated",
    summary: `Studio updated required action: ${data.title}.`,
    payload: { actionId: input.actionId, fields: Object.keys(p) },
    clientVisible: false,
  });

  return rowToAction(data);
}

// Force-complete on the client's behalf. Bypasses the owner === client
// gate that completeRequiredActionByPortalToken enforces; admin can
// complete studio-owned actions too.
export async function forceCompleteRequiredActionForQuoteId(input: {
  quoteId: string;
  actionId: string;
}): Promise<RequiredAction | null> {
  const result = await updateRequiredActionForQuoteId({
    quoteId: input.quoteId,
    actionId: input.actionId,
    patch: { status: "complete" },
  });
  if (!result) return null;

  // Re-log with a clearer event type for the activity feed.
  const portalId = await getPortalIdByQuoteId(input.quoteId);
  await logProjectActivityByPortalId({
    portalProjectId: portalId,
    actorRole: "studio",
    eventType: "required_action_force_completed",
    summary: `Studio marked complete on client's behalf: ${result.title}.`,
    payload: { actionId: input.actionId, actionKey: result.actionKey },
    clientVisible: true,
  });
  return result;
}

export async function reopenRequiredActionForQuoteId(input: {
  quoteId: string;
  actionId: string;
  status?: RequiredActionStatus; // defaults to waiting_on_client
}): Promise<RequiredAction | null> {
  return updateRequiredActionForQuoteId({
    quoteId: input.quoteId,
    actionId: input.actionId,
    patch: { status: input.status ?? "waiting_on_client" },
  });
}

export async function deleteRequiredActionForQuoteId(input: {
  quoteId: string;
  actionId: string;
}): Promise<void> {
  const portalId = await getPortalIdByQuoteId(input.quoteId);

  const { data: existing } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .select("title, action_key")
    .eq("id", input.actionId)
    .eq("portal_project_id", portalId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("customer_portal_required_actions")
    .delete()
    .eq("id", input.actionId)
    .eq("portal_project_id", portalId);

  if (error) throw error;

  if (existing?.title) {
    await logProjectActivityByPortalId({
      portalProjectId: portalId,
      actorRole: "studio",
      eventType: "required_action_deleted",
      summary: `Studio removed required action: ${existing.title}.`,
      payload: { actionKey: existing.action_key },
      clientVisible: false,
    });
  }
}
