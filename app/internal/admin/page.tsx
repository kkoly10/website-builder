// app/internal/admin/page.tsx
import AdminPipelineClient from "./AdminPipelineClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function safeText(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function parsePieReport(reportRow: AnyRow | null | undefined) {
  const fallback = {
    exists: false,
    id: null as string | null,
    score: null as number | null,
    tier: null as string | null,
    confidence: null as string | null,
    summary: "No PIE report yet.",
    pricingTarget: null as number | null,
    pricingMin: null as number | null,
    pricingMax: null as number | null,
    risks: [] as string[],
    pitch: null as any,
    hoursMin: null as number | null,
    hoursMax: null as number | null,
    timelineText: null as string | null,
  };

  if (!reportRow) return fallback;

  let obj: any = null;

  // Newer rows store report JSON in `report`
  if (reportRow.report && typeof reportRow.report === "object") {
    obj = reportRow.report;
  }

  // Older rows may have string payload
  if (!obj && typeof reportRow.payload === "string") {
    try {
      obj = JSON.parse(reportRow.payload);
    } catch {
      obj = null;
    }
  }

  if (!obj || typeof obj !== "object") {
    return {
      ...fallback,
      exists: true,
      id: reportRow.id ?? null,
      summary: "PIE row exists, but report JSON is empty.",
    };
  }

  const pricing = obj.pricing || {};
  const hours = obj.hours || {};
  const timeline = obj.timeline || {};

  const target =
    typeof pricing.target === "number"
      ? pricing.target
      : typeof obj.priceTarget === "number"
      ? obj.priceTarget
      : null;

  const min =
    typeof pricing.minimum === "number"
      ? pricing.minimum
      : typeof pricing.min === "number"
      ? pricing.min
      : null;

  let max: number | null = null;
  if (typeof pricing.maximum === "number") {
    max = pricing.maximum;
  } else if (Array.isArray(pricing.buffers)) {
    const upper = pricing.buffers.find(
      (b: any) =>
        String(b?.label || "").toLowerCase().includes("upper") &&
        typeof b?.amount === "number"
    );
    if (upper) max = upper.amount;
  }

  const hoursMin =
    typeof hours.min === "number"
      ? hours.min
      : typeof obj.hoursMin === "number"
      ? obj.hoursMin
      : null;

  const hoursMax =
    typeof hours.max === "number"
      ? hours.max
      : typeof obj.hoursMax === "number"
      ? obj.hoursMax
      : null;

  const timelineText =
    safeText(timeline.text) ??
    safeText(obj.timelineText) ??
    (hoursMin != null && hoursMax != null ? `${hoursMin}-${hoursMax} hrs` : null);

  return {
    exists: true,
    id: reportRow.id ?? null,
    score:
      typeof obj.score === "number"
        ? obj.score
        : typeof reportRow.score === "number"
        ? reportRow.score
        : null,
    tier: safeText(obj.tier) ?? safeText(reportRow.tier) ?? null,
    confidence:
      safeText(obj.confidence) ?? safeText(reportRow.confidence) ?? null,
    summary:
      safeText(obj.summary) ??
      "PIE generated, but no summary text was provided.",
    pricingTarget: target,
    pricingMin: min,
    pricingMax: max,
    risks: Array.isArray(obj.risks) ? obj.risks.filter(Boolean) : [],
    pitch: obj.pitch ?? null,
    hoursMin,
    hoursMax,
    timelineText,
  };
}

function latestByKey(rows: AnyRow[], key: string) {
  const map = new Map<string, AnyRow>();
  for (const r of rows) {
    const k = r?.[key];
    if (!k) continue;
    if (!map.has(k)) map.set(k, r);
  }
  return map;
}

function countByKey(rows: AnyRow[], key: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = r?.[key];
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

function latestMessageByProject(rows: AnyRow[]) {
  const map = new Map<string, string>();
  for (const r of rows) {
    const projectId = r?.project_id;
    if (!projectId) continue;

    // Try common message/content fields
    const messageText =
      safeText(r.message) ??
      safeText(r.body) ??
      safeText(r.note) ??
      safeText(r.content) ??
      safeText(r.text);

    if (!messageText) continue;

    // Prefer client-origin messages if field exists, otherwise keep latest row order
    const senderRole = String(
      r.sender_role || r.author_role || r.role || r.source || ""
    ).toLowerCase();

    const looksClient =
      senderRole.includes("client") ||
      senderRole.includes("customer") ||
      senderRole.includes("lead");

    if (!map.has(projectId)) {
      map.set(projectId, messageText);
      continue;
    }

    // If current row is clearly client and existing wasn't tagged, replace
    if (looksClient) {
      map.set(projectId, messageText);
    }
  }
  return map;
}

async function safeSelectTable(
  table: string,
  filters?: (q: any) => any
): Promise<AnyRow[]> {
  try {
    let q = (supabaseAdmin as any).from(table).select("*");
    if (filters) q = filters(q);
    const { data, error } = await q;
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function InternalAdminPage() {
  const db = supabaseAdmin as any;

  const { data: quotesData, error: quotesError } = await db
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (quotesError) {
    return (
      <main className="container section">
        <div className="panel">
          <div className="panelHeader">
            <div className="h2">Internal Admin</div>
          </div>
          <div className="panelBody">
            <div>Could not load quotes: {quotesError.message}</div>
          </div>
        </div>
      </main>
    );
  }

  const quotes: AnyRow[] = Array.isArray(quotesData) ? quotesData : [];

  const quoteIds = quotes.map((q) => q.id).filter(Boolean);
  const leadIds = Array.from(new Set(quotes.map((q) => q.lead_id).filter(Boolean)));
  const projectIds = Array.from(
    new Set(quotes.map((q) => q.project_id).filter(Boolean))
  );

  const [leads, callRequests, pieReports, projects, projectAssets, projectRevisions, projectMessages] =
    await Promise.all([
      leadIds.length
        ? safeSelectTable("leads", (q) => q.in("id", leadIds))
        : Promise.resolve([]),
      quoteIds.length
        ? safeSelectTable("call_requests", (q) =>
            q.in("quote_id", quoteIds).order("created_at", { ascending: false })
          )
        : Promise.resolve([]),
      quoteIds.length
        ? safeSelectTable("pie_reports", (q) =>
            q.in("quote_id", quoteIds).order("created_at", { ascending: false })
          )
        : Promise.resolve([]),
      projectIds.length
        ? safeSelectTable("projects", (q) => q.in("id", projectIds))
        : Promise.resolve([]),
      projectIds.length
        ? safeSelectTable("project_assets", (q) =>
            q.in("project_id", projectIds).order("created_at", { ascending: false })
          )
        : Promise.resolve([]),
      projectIds.length
        ? safeSelectTable("project_revisions", (q) =>
            q.in("project_id", projectIds).order("created_at", { ascending: false })
          )
        : Promise.resolve([]),
      // Try project_messages first, then fallback to project_notes if messages table doesn't exist
      projectIds.length
        ? (async () => {
            const messages = await safeSelectTable("project_messages", (q) =>
              q.in("project_id", projectIds).order("created_at", { ascending: false })
            );
            if (messages.length) return messages;
            return await safeSelectTable("project_notes", (q) =>
              q.in("project_id", projectIds).order("created_at", { ascending: false })
            );
          })()
        : Promise.resolve([]),
    ]);

  const leadMap = new Map<string, AnyRow>(leads.map((l) => [l.id, l]));
  const callMap = latestByKey(callRequests, "quote_id");
  const pieMap = latestByKey(pieReports, "quote_id");
  const projectMap = new Map<string, AnyRow>(projects.map((p) => [p.id, p]));

  const assetCounts = countByKey(projectAssets, "project_id");
  const revisionCounts = countByKey(projectRevisions, "project_id");
  const latestClientMessage = latestMessageByProject(projectMessages);

  const rows = quotes.map((q) => {
    const lead = q.lead_id ? leadMap.get(q.lead_id) : null;
    const callReq = callMap.get(q.id) || null;
    const pieRow = pieMap.get(q.id) || null;
    const project = q.project_id ? projectMap.get(q.project_id) : null;

    const estimateTarget =
      toNumber(
        q.estimate_total ?? q.estimate_amount ?? q.estimate_target ?? q.estimate,
        0
      ) || 0;

    const estimateMin =
      toNumber(q.estimate_low ?? q.estimate_min, Math.round(estimateTarget * 0.9)) ||
      0;

    const estimateMax =
      toNumber(q.estimate_high ?? q.estimate_max, Math.round(estimateTarget * 1.15)) ||
      0;

    const pie = parsePieReport(pieRow);

    const tier =
      safeText(q.tier_recommended) ??
      safeText(q.recommended_tier) ??
      safeText(q.tier) ??
      safeText(pie.tier) ??
      "essential";

    const clientStatus =
      safeText(q.client_status) ??
      safeText(project?.client_status) ??
      safeText(project?.status) ??
      "not_started";

    const latestNote =
      safeText(q.client_last_note) ??
      (q.project_id ? latestClientMessage.get(q.project_id) ?? null : null);

    const assetCount = q.project_id ? assetCounts.get(q.project_id) || 0 : 0;
    const revisionCount = q.project_id ? revisionCounts.get(q.project_id) || 0 : 0;

    return {
      quoteId: q.id,
      createdAt: q.created_at || new Date().toISOString(),
      status: safeText(q.status) || "new",
      tier,
      leadEmail:
        safeText(lead?.email) ??
        safeText(q.email) ??
        "unknown@lead.local",
      leadName: safeText(lead?.name) ?? null,
      estimate: {
        target: estimateTarget,
        min: estimateMin,
        max: estimateMax,
      },
      estimateFormatted: {
        target: fmtMoney(estimateTarget),
        min: fmtMoney(estimateMin),
        max: fmtMoney(estimateMax),
      },
      callRequest: callReq
        ? {
            status: safeText(callReq.status) || "new",
            bestTime: safeText(callReq.best_time),
            preferredTimes: safeText(callReq.preferred_times),
            timezone: safeText(callReq.timezone),
            notes: safeText(callReq.notes),
          }
        : null,
      pie,
      adminPricing: {
        discountPercent: toNumber(q.admin_discount_percent, 0),
        flatAdjustment: toNumber(q.admin_flat_adjustment, 0),
        hourlyRate: toNumber(q.admin_hourly_rate, 40),
        notes: safeText(q.admin_notes) || "",
      },
      proposalText: safeText(q.admin_proposal_text) ?? safeText(q.proposal_text) ?? "",
      clientPortal: {
        status: clientStatus,
        latestClientNote: latestNote,
        assetCount,
        revisionCount,
        depositStatus:
          safeText(q.deposit_status) ??
          safeText(project?.deposit_status) ??
          "unpaid",
        portalToken: safeText(project?.portal_token) ?? null,
      },
      links: {
        detail: `/internal/preview?quoteId=${q.id}`,
        portal:
          project?.portal_token ? `/portal/${project.portal_token}` : null,
      },
    };
  });

  return (
    <main className="container section">
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panelHeader">
          <div className="h2">Internal Admin</div>
        </div>
        <div className="panelBody">
          <div className="pDark" style={{ margin: 0 }}>
            PIE-powered pipeline with pricing controls, proposal generation, and client portal sync signals.
          </div>
        </div>
      </div>

      <AdminPipelineClient initialRows={rows} />
    </main>
  );
}