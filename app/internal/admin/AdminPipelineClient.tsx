// app/internal/admin/page.tsx
import { createClient } from "@supabase/supabase-js";
import AdminPipelineClient from "./AdminPipelineClient";

type AnyRow = Record<string, any>;

function asObj(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  return [];
}

function str(v: any, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function num(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function maybeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function lower(v: any): string {
  return String(v ?? "").toLowerCase();
}

function ts(v: any): number {
  const d = new Date(v ?? 0).getTime();
  return Number.isFinite(d) ? d : 0;
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

function pickFirst(row: AnyRow | null | undefined, keys: string[]): any {
  if (!row) return undefined;
  for (const key of keys) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let cur: any = row;
      let ok = true;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) {
          cur = cur[p];
        } else {
          ok = false;
          break;
        }
      }
      if (ok && cur != null) return cur;
    } else if (row[key] != null) {
      return row[key];
    }
  }
  return undefined;
}

async function safeTableSelect(
  supabase: any,
  tableNames: string[],
  opts?: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  }
): Promise<{ table: string | null; rows: AnyRow[] }> {
  for (const table of tableNames) {
    try {
      let q = supabase.from(table).select("*");
      if (opts?.orderBy) q = q.order(opts.orderBy, { ascending: !!opts.ascending });
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (!error) {
        return { table, rows: (data || []) as AnyRow[] };
      }
    } catch {
      // try next table
    }
  }
  return { table: null, rows: [] };
}

function latestBy<T extends AnyRow>(rows: T[], dateKeys = ["created_at", "updated_at"]): T | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const aTs = ts(pickFirst(a, dateKeys));
    const bTs = ts(pickFirst(b, dateKeys));
    return bTs - aTs;
  })[0];
}

function groupBy<T extends AnyRow>(rows: T[], key: string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const r of rows) {
    const k = r?.[key];
    if (!k) continue;
    const id = String(k);
    if (!map[id]) map[id] = [];
    map[id].push(r);
  }
  return map;
}

function parsePieFromRow(pieRow: AnyRow | null) {
  if (!pieRow) {
    return {
      exists: false,
      id: null,
      score: null,
      tier: null,
      confidence: null,
      summary: "",
      pricingTarget: null,
      pricingMin: null,
      pricingMax: null,
      risks: [] as string[],
      pitch: null,
      hoursMin: null,
      hoursMax: null,
      timelineText: null,
    };
  }

  const rawReport =
    pickFirst(pieRow, ["report_json", "report", "pie_json", "pie_report", "payload", "data"]) ?? {};
  const report = asObj(rawReport);

  const pricing = asObj(
    pickFirst(report, ["pricing"]) ??
      pickFirst(pieRow, ["pricing", "pricing_json", "pricing_data"]) ??
      {}
  );

  const hoursObj = asObj(
    pickFirst(report, ["hours", "effort", "timeline.hours"]) ??
      pickFirst(pieRow, ["hours", "effort_json"]) ??
      {}
  );

  const timelineObj = asObj(
    pickFirst(report, ["timeline", "delivery"]) ??
      pickFirst(pieRow, ["timeline", "timeline_json"]) ??
      {}
  );

  const pitchObj = asObj(
    pickFirst(report, ["pitch", "sales_pitch"]) ??
      pickFirst(pieRow, ["pitch", "pitch_json"]) ??
      {}
  );

  const risksRaw =
    pickFirst(report, ["risks", "risk_flags", "blockers"]) ??
    pickFirst(pieRow, ["risks", "risk_flags"]) ??
    [];
  const risks = asArray(risksRaw).map((x) => String(x)).filter(Boolean);

  const hoursMin =
    maybeNum(pickFirst(hoursObj, ["min", "hours_min"])) ??
    maybeNum(pickFirst(report, ["hoursMin", "hours_min"])) ??
    maybeNum(pickFirst(pieRow, ["hours_min"]));

  const hoursMax =
    maybeNum(pickFirst(hoursObj, ["max", "hours_max"])) ??
    maybeNum(pickFirst(report, ["hoursMax", "hours_max"])) ??
    maybeNum(pickFirst(pieRow, ["hours_max"]));

  const timelineText =
    pickFirst(timelineObj, ["text", "label", "summary"]) ??
    pickFirst(report, ["timelineText", "timeline_text"]) ??
    pickFirst(pieRow, ["timeline_text"]);

  return {
    exists: true,
    id: str(pieRow.id, null as any),
    score:
      maybeNum(pickFirst(report, ["score"])) ??
      maybeNum(pickFirst(pieRow, ["score", "complexity_score"])),
    tier:
      pickFirst(report, ["tier"]) ??
      pickFirst(pieRow, ["tier", "recommended_tier"]) ??
      null,
    confidence:
      pickFirst(report, ["confidence"]) ??
      pickFirst(pieRow, ["confidence"]) ??
      null,
    summary:
      pickFirst(report, ["summary"]) ??
      pickFirst(pieRow, ["summary"]) ??
      "PIE report available.",
    pricingTarget:
      maybeNum(pickFirst(pricing, ["target", "recommended"])) ??
      maybeNum(pickFirst(report, ["pricingTarget", "pricing_target"])) ??
      maybeNum(pickFirst(pieRow, ["pricing_target", "target_price"])),
    pricingMin:
      maybeNum(pickFirst(pricing, ["minimum", "min"])) ??
      maybeNum(pickFirst(report, ["pricingMin", "pricing_min"])) ??
      maybeNum(pickFirst(pieRow, ["pricing_min"])),
    pricingMax:
      maybeNum(pickFirst(pricing, ["maximum", "max"])) ??
      // fallback to upper buffer in report.pricing.buffers
      (() => {
        const buffers = asArray(pricing.buffers);
        const upper =
          buffers.find((b) => lower(b?.label).includes("upper")) ||
          buffers.find((b) => b?.amount != null);
        return maybeNum(upper?.amount);
      })() ??
      maybeNum(pickFirst(report, ["pricingMax", "pricing_max"])) ??
      maybeNum(pickFirst(pieRow, ["pricing_max"])),
    risks,
    pitch: pitchObj,
    hoursMin,
    hoursMax,
    timelineText: timelineText ? String(timelineText) : null,
  };
}

function parseEstimateFromQuote(quote: AnyRow | null, pie: ReturnType<typeof parsePieFromRow>) {
  const q = quote || {};
  const quoteJson = asObj(
    pickFirst(q, ["quote_json", "quote", "summary_json", "estimate_json", "payload", "data"])
  );
  const estimateObj = asObj(
    pickFirst(quoteJson, ["estimate", "pricing"]) ??
      pickFirst(q, ["estimate", "pricing"]) ??
      {}
  );

  const target =
    maybeNum(
      pickFirst(q, [
        "estimate_target",
        "target",
        "price_target",
        "recommended_price",
        "quoted_price",
      ])
    ) ??
    maybeNum(pickFirst(estimateObj, ["target", "recommended", "price"])) ??
    pie.pricingTarget ??
    0;

  const min =
    maybeNum(pickFirst(q, ["estimate_min", "min_price", "price_min"])) ??
    maybeNum(pickFirst(estimateObj, ["min", "minimum"])) ??
    pie.pricingMin ??
    Math.round(target * 0.9);

  const max =
    maybeNum(pickFirst(q, ["estimate_max", "max_price", "price_max"])) ??
    maybeNum(pickFirst(estimateObj, ["max", "maximum"])) ??
    pie.pricingMax ??
    Math.round(target * 1.15);

  return {
    target: Math.round(target || 0),
    min: Math.round(min || 0),
    max: Math.round(max || 0),
  };
}

function parseTierFromQuote(quote: AnyRow | null, pie: ReturnType<typeof parsePieFromRow>) {
  const q = quote || {};
  const quoteJson = asObj(
    pickFirst(q, ["quote_json", "quote", "summary_json", "payload", "data"])
  );
  return (
    pickFirst(q, ["tier", "selected_tier", "recommended_tier"]) ??
    pickFirst(quoteJson, ["tier", "selectedTier", "recommendedTier"]) ??
    pie.tier ??
    "Essential"
  );
}

function parseLeadEmail(quote: AnyRow | null, project: AnyRow | null) {
  const q = quote || {};
  const p = project || {};
  const quoteJson = asObj(
    pickFirst(q, ["quote_json", "quote", "summary_json", "payload", "data"])
  );

  return (
    pickFirst(p, ["lead_email", "email"]) ??
    pickFirst(q, ["lead_email", "email", "contact_email"]) ??
    pickFirst(quoteJson, ["lead.email", "leadEmail", "email"]) ??
    "unknown@email.com"
  );
}

function parseLeadName(quote: AnyRow | null, project: AnyRow | null) {
  const q = quote || {};
  const p = project || {};
  const quoteJson = asObj(
    pickFirst(q, ["quote_json", "quote", "summary_json", "payload", "data"])
  );

  return (
    pickFirst(p, ["lead_name", "name"]) ??
    pickFirst(q, ["lead_name", "name", "contact_name"]) ??
    pickFirst(quoteJson, ["lead.name", "leadName", "name"]) ??
    null
  );
}

function parseAdminPricing(project: AnyRow | null, quote: AnyRow | null) {
  const p = project || {};
  const q = quote || {};
  const pricingObj = asObj(
    pickFirst(p, ["admin_pricing", "admin_pricing_json"]) ??
      pickFirst(q, ["admin_pricing", "admin_pricing_json"])
  );

  return {
    discountPercent: num(
      pickFirst(p, ["discount_percent"]) ??
        pickFirst(pricingObj, ["discountPercent", "discount_percent"]),
      0
    ),
    flatAdjustment: num(
      pickFirst(p, ["flat_adjustment"]) ??
        pickFirst(pricingObj, ["flatAdjustment", "flat_adjustment"]),
      0
    ),
    hourlyRate: num(
      pickFirst(p, ["hourly_rate"]) ??
        pickFirst(pricingObj, ["hourlyRate", "hourly_rate"]),
      40
    ),
    notes: str(
      pickFirst(p, ["admin_notes"]) ?? pickFirst(pricingObj, ["notes"]) ?? "",
      ""
    ),
  };
}

function parseProposalText(project: AnyRow | null, quote: AnyRow | null) {
  return str(
    pickFirst(project || {}, ["proposal_text"]) ??
      pickFirst(quote || {}, ["proposal_text", "proposal"]) ??
      "",
    ""
  );
}

function parseCallRequest(call: AnyRow | null) {
  if (!call) return null;
  return {
    status: str(pickFirst(call, ["status"]), "new"),
    bestTime:
      pickFirst(call, ["best_time", "bestTime"]) ??
      pickFirst(call, ["preferred_times", "preferredTimes"]) ??
      null,
    preferredTimes: pickFirst(call, ["preferred_times", "preferredTimes"]) ?? null,
    timezone: pickFirst(call, ["timezone", "time_zone"]) ?? null,
    notes: pickFirst(call, ["notes", "note"]) ?? null,
  };
}

function buildDetailLink(quoteId: string) {
  // If your detail route is different, this is the only line to adjust.
  return `/internal/preview/${quoteId}`;
}

export default async function InternalAdminPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Internal Admin</h1>
        <p>Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).</p>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Pull everything safely (tries common table names)
  const [quotesRes, projectsRes, piesRes, callsRes, assetsRes, revisionsRes, notesRes] =
    await Promise.all([
      safeTableSelect(supabase, ["quotes"], { orderBy: "created_at", ascending: false, limit: 300 }),
      safeTableSelect(supabase, ["projects"], { orderBy: "created_at", ascending: false, limit: 300 }),
      safeTableSelect(supabase, ["pie_reports"], { orderBy: "created_at", ascending: false, limit: 1000 }),
      safeTableSelect(supabase, ["call_requests", "quote_call_requests"], {
        orderBy: "created_at",
        ascending: false,
        limit: 1000,
      }),
      safeTableSelect(supabase, ["project_assets", "portal_assets"], {
        orderBy: "created_at",
        ascending: false,
        limit: 2000,
      }),
      safeTableSelect(supabase, ["project_revisions", "revisions"], {
        orderBy: "created_at",
        ascending: false,
        limit: 2000,
      }),
      safeTableSelect(supabase, ["project_notes", "portal_notes", "client_notes"], {
        orderBy: "created_at",
        ascending: false,
        limit: 2000,
      }),
    ]);

  const quotes = quotesRes.rows || [];
  const projects = projectsRes.rows || [];
  const pieReports = piesRes.rows || [];
  const callRequests = callsRes.rows || [];
  const assets = assetsRes.rows || [];
  const revisions = revisionsRes.rows || [];
  const notes = notesRes.rows || [];

  const quoteById: Record<string, AnyRow> = {};
  for (const q of quotes) {
    if (!q?.id) continue;
    quoteById[String(q.id)] = q;
  }

  // Use latest project per quote_id (if duplicates exist)
  const projectsByQuoteIdGrouped = groupBy(
    projects.filter((p) => p?.quote_id),
    "quote_id"
  );
  const projectByQuoteId: Record<string, AnyRow> = {};
  for (const [qid, rows] of Object.entries(projectsByQuoteIdGrouped)) {
    const latest = latestBy(rows);
    if (latest) projectByQuoteId[qid] = latest;
  }

  const projectById: Record<string, AnyRow> = {};
  for (const p of projects) {
    if (!p?.id) continue;
    projectById[String(p.id)] = p;
  }

  // Calls can attach by quote_id
  const callsByQuoteIdGrouped = groupBy(
    callRequests.filter((c) => c?.quote_id),
    "quote_id"
  );
  const callByQuoteId: Record<string, AnyRow> = {};
  for (const [qid, rows] of Object.entries(callsByQuoteIdGrouped)) {
    const latest = latestBy(rows);
    if (latest) callByQuoteId[qid] = latest;
  }

  // PIE can attach by quote_id or project_id
  const piesByQuoteId = groupBy(
    pieReports.filter((r) => r?.quote_id),
    "quote_id"
  );
  const piesByProjectId = groupBy(
    pieReports.filter((r) => r?.project_id),
    "project_id"
  );

  // Counts/maps for portal sync
  const assetCountByProjectId: Record<string, number> = {};
  for (const a of assets) {
    const pid = a?.project_id ? String(a.project_id) : null;
    if (!pid) continue;
    assetCountByProjectId[pid] = (assetCountByProjectId[pid] || 0) + 1;
  }

  const revisionCountByProjectId: Record<string, number> = {};
  for (const r of revisions) {
    const pid = r?.project_id ? String(r.project_id) : null;
    if (!pid) continue;
    revisionCountByProjectId[pid] = (revisionCountByProjectId[pid] || 0) + 1;
  }

  const notesByProjectIdGrouped = groupBy(
    notes.filter((n) => n?.project_id),
    "project_id"
  );
  const latestNoteByProjectId: Record<string, { body: string; createdAt: string | null }> = {};
  for (const [pid, rows] of Object.entries(notesByProjectIdGrouped)) {
    const latest = latestBy(rows);
    if (!latest) continue;
    const body =
      pickFirst(latest, ["body", "message", "note", "content", "text"]) ?? "";
    const createdAt = pickFirst(latest, ["created_at", "updated_at"]) ?? null;
    latestNoteByProjectId[pid] = {
      body: String(body || ""),
      createdAt: createdAt ? String(createdAt) : null,
    };
  }

  // Union quote IDs from quotes + projects
  const quoteIds = new Set<string>();
  for (const q of quotes) if (q?.id) quoteIds.add(String(q.id));
  for (const p of projects) if (p?.quote_id) quoteIds.add(String(p.quote_id));

  const rows = [...quoteIds].map((quoteId) => {
    const quote = quoteById[quoteId] || null;
    const project = projectByQuoteId[quoteId] || null;

    const projectId = project?.id ? String(project.id) : null;

    // pick latest PIE (prefer project.latest_pie_report_id if present)
    let pieRow: AnyRow | null = null;
    const latestPieId =
      pickFirst(project, ["latest_pie_report_id"]) ??
      pickFirst(quote, ["latest_pie_report_id"]);

    if (latestPieId) {
      pieRow =
        pieReports.find((r) => String(r.id) === String(latestPieId)) || null;
    }

    if (!pieRow && projectId && piesByProjectId[projectId]?.length) {
      pieRow = latestBy(piesByProjectId[projectId]);
    }

    if (!pieRow && piesByQuoteId[quoteId]?.length) {
      pieRow = latestBy(piesByQuoteId[quoteId]);
    }

    const pie = parsePieFromRow(pieRow);
    const estimate = parseEstimateFromQuote(quote, pie);

    // Keep project status in sync with visible quote status if available
    const quoteStatus = pickFirst(quote, ["status"]);
    const projectStatus = pickFirst(project, ["project_status", "status"]);
    const finalStatus =
      (quoteStatus ? String(quoteStatus) : null) ||
      (projectStatus ? String(projectStatus) : null) ||
      "new";

    const clientStatus = pickFirst(project, ["client_status"]) ?? "new";
    const call = parseCallRequest(callByQuoteId[quoteId] || null);

    const latestClientNote =
      projectId && latestNoteByProjectId[projectId]
        ? latestNoteByProjectId[projectId]
        : null;

    return {
      quoteId,
      createdAt:
        String(pickFirst(quote, ["created_at"])) ||
        String(pickFirst(project, ["created_at"])) ||
        new Date(0).toISOString(),

      status: finalStatus,
      tier: String(parseTierFromQuote(quote, pie)),

      leadEmail: String(parseLeadEmail(quote, project)),
      leadName: parseLeadName(quote, project),

      clientStatus: String(clientStatus),
      assetCount: projectId ? assetCountByProjectId[projectId] || 0 : 0,
      revisionCount: projectId ? revisionCountByProjectId[projectId] || 0 : 0,
      latestClientNote,

      estimate,
      estimateFormatted: {
        target: money(estimate.target),
        min: money(estimate.min),
        max: money(estimate.max),
      },

      callRequest: call,
      pie,

      adminPricing: parseAdminPricing(project, quote),
      proposalText: parseProposalText(project, quote),

      links: {
        detail: buildDetailLink(quoteId),
      },
    };
  });

  // Newest first
  rows.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));

  return (
    <main style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Internal Admin</h1>
        <div style={{ opacity: 0.75, marginTop: 4, fontSize: 13 }}>
          Leads, PIE, pricing controls, and client portal sync
        </div>
      </div>

      <AdminPipelineClient initialRows={rows as any} />
    </main>
  );
}