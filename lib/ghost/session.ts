import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { GhostLane } from "@/lib/ghost/types";

export type GhostSessionLane = GhostLane | "global";

export type GhostSessionRecord = {
  id: string;
  lane: GhostSessionLane;
  project_id: string | null;
  session_label: string | null;
  admin_user_id: string | null;
};

function normalizeProjectId(value?: string | null) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function isGhostSessionLane(value: string): value is GhostSessionLane {
  return value === "website" || value === "ops" || value === "ecommerce" || value === "global";
}

export async function ensureGhostSession(params: {
  lane: GhostSessionLane;
  projectId?: string | null;
  sessionId?: string | null;
  adminUserId?: string | null;
  sessionLabel?: string | null;
}) {
  const lane = isGhostSessionLane(params.lane) ? params.lane : "global";
  const projectId = normalizeProjectId(params.projectId);
  const sessionId = String(params.sessionId || "").trim() || null;
  const adminUserId = String(params.adminUserId || "").trim() || null;
  const sessionLabel = String(params.sessionLabel || "").trim() || null;
  const now = new Date().toISOString();

  if (sessionId) {
    const { data: existingById } = await supabaseAdmin
      .from("ghost_sessions")
      .select("id, lane, project_id, session_label, admin_user_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (existingById) {
      await supabaseAdmin
        .from("ghost_sessions")
        .update({
          updated_at: now,
          session_label: sessionLabel || existingById.session_label,
        })
        .eq("id", existingById.id);

      return {
        ...existingById,
        session_label: sessionLabel || existingById.session_label,
      } as GhostSessionRecord;
    }
  }

  let lookup = supabaseAdmin
    .from("ghost_sessions")
    .select("id, lane, project_id, session_label, admin_user_id")
    .eq("lane", lane);

  lookup = projectId ? lookup.eq("project_id", projectId) : lookup.is("project_id", null);

  if (adminUserId) {
    lookup = lookup.eq("admin_user_id", adminUserId);
  }

  const { data: existing } = await lookup
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("ghost_sessions")
      .update({
        updated_at: now,
        session_label: sessionLabel || existing.session_label,
      })
      .eq("id", existing.id);

    return {
      ...existing,
      session_label: sessionLabel || existing.session_label,
    } as GhostSessionRecord;
  }

  const { data: created } = await supabaseAdmin
    .from("ghost_sessions")
    .insert({
      admin_user_id: adminUserId,
      lane,
      project_id: projectId,
      session_label: sessionLabel,
      updated_at: now,
    })
    .select("id, lane, project_id, session_label, admin_user_id")
    .single();

  return (created || null) as GhostSessionRecord | null;
}