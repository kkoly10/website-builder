import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ProjectActivityItem = {
  id: string;
  quoteId: string;
  actorRole: "client" | "studio" | "system";
  eventType: string;
  summary: string;
  payload: Record<string, any>;
  createdAt: string;
  clientVisible: boolean;
};

type PortalRow = Record<string, any>;
type ActivityRow = Record<string, any>;

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeObj(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function safeDate(value: unknown) {
  const raw = str(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function getPortalProjectByQuoteId(quoteId: string) {
  const { data, error } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function getPortalProjectByToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

function serializeActivity(row: ActivityRow, portal: PortalRow | null): ProjectActivityItem {
  const payload = safeObj(row.payload);
  return {
    id: str(row.id),
    quoteId: str(portal?.quote_id),
    actorRole: (str(row.actor_role, "system").toLowerCase() || "system") as ProjectActivityItem["actorRole"],
    eventType: str(row.event_type),
    summary: str(row.summary),
    payload,
    createdAt: safeDate(row.created_at) || new Date().toISOString(),
    clientVisible: payload.clientVisible !== false,
  };
}

export async function logProjectActivityByPortalId(args: {
  portalProjectId: string;
  actorRole: "client" | "studio" | "system";
  eventType: string;
  summary: string;
  payload?: Record<string, any>;
  clientVisible?: boolean;
}) {
  const payload = {
    ...(args.payload || {}),
    clientVisible: args.clientVisible !== false,
  };

  const { data, error } = await supabaseAdmin
    .from("project_activity")
    .insert({
      portal_project_id: args.portalProjectId,
      actor_role: args.actorRole,
      event_type: str(args.eventType),
      summary: str(args.summary),
      payload,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function logProjectActivityByQuoteId(args: {
  quoteId: string;
  actorRole: "client" | "studio" | "system";
  eventType: string;
  summary: string;
  payload?: Record<string, any>;
  clientVisible?: boolean;
}) {
  const portal = await getPortalProjectByQuoteId(args.quoteId);
  if (!portal) return null;
  return logProjectActivityByPortalId({
    portalProjectId: str(portal.id),
    actorRole: args.actorRole,
    eventType: args.eventType,
    summary: args.summary,
    payload: args.payload,
    clientVisible: args.clientVisible,
  });
}

export async function listProjectActivityByQuoteId(
  quoteId: string,
  options?: { clientOnly?: boolean; limit?: number }
) {
  const portal = await getPortalProjectByQuoteId(quoteId);
  if (!portal) return [];

  let query = supabaseAdmin
    .from("project_activity")
    .select("*")
    .eq("portal_project_id", portal.id)
    .order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => serializeActivity(row, portal))
    .filter((row) => (options?.clientOnly ? row.clientVisible : true))
    .map((row) =>
      // Strip admin audit fields from client-visible payloads. Admin
      // transitions stamp actorEmail / actorIp / actorUserAgent / actorUserId
      // into the payload for studio-side audit trails. Without this filter
      // the activity feed exposed those values to anyone with the portal
      // token via the GET /api/portal/[token] response.
      options?.clientOnly ? { ...row, payload: redactClientFacingPayload(row.payload) } : row,
    );
}

// Removes admin-side audit fields from an activity payload before it's
// sent to a client. The DB still holds the full record for studio
// review; only the client-facing serialization is redacted.
function redactClientFacingPayload(payload: Record<string, any>): Record<string, any> {
  const REDACTED = new Set([
    "actorEmail",
    "actorIp",
    "actorIP",
    "actorUserId",
    "actorUserAgent",
    "actorUser",
  ]);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (!REDACTED.has(k)) out[k] = v;
  }
  return out;
}

export async function listProjectActivityByToken(
  token: string,
  options?: { clientOnly?: boolean; limit?: number }
) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) return [];
  return listProjectActivityByQuoteId(str(portal.quote_id), options);
}

export async function listRecentProjectActivity(limit = 12) {
  const { data, error } = await supabaseAdmin
    .from("project_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const portalIds = rows.map((row) => str(row.portal_project_id)).filter(Boolean);
  if (!portalIds.length) return [];

  const portalRes = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id, quote_id")
    .in("id", portalIds);

  if (portalRes.error) throw new Error(portalRes.error.message);

  const portalMap = new Map(
    (portalRes.data ?? []).map((portal) => [str(portal.id), portal] as const)
  );

  return rows.map((row) => serializeActivity(row, portalMap.get(str(row.portal_project_id)) ?? null));
}

export async function markClientPortalSeen(token: string) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) return;

  const now = new Date();
  const lastSeen = safeDate(portal.last_client_seen_at);
  const shouldWrite =
    !lastSeen || now.getTime() - new Date(lastSeen).getTime() >= 15 * 60 * 1000;

  if (!shouldWrite) return;

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      last_client_seen_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", portal.id);

  if (error) throw new Error(error.message);
}

export async function markPreviewViewedByToken(token: string) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) throw new Error("Portal not found.");

  const previewUrl = str(portal.preview_url);
  if (!previewUrl) throw new Error("Preview not found.");

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      last_client_seen_at: now,
      preview_viewed_at: now,
      updated_at: now,
    })
    .eq("id", portal.id);

  if (error) throw new Error(error.message);

  await logProjectActivityByPortalId({
    portalProjectId: str(portal.id),
    actorRole: "client",
    eventType: "preview_viewed",
    summary: "Client opened the website preview.",
    payload: {},
    clientVisible: true,
  });

  return previewUrl;
}
