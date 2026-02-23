// app/internal/admin/page.tsx
import AdminPipelineClient from "./AdminPipelineClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function parseJsonMaybe(v: any): any {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return null;
}

function fmtCurrency(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getNested(obj: any, path: string[]): any {
  let cur = obj;
  for (const p of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = cur[p];
  }
  return cur ?? null;
}

function firstNonNull(...vals: any[]) {
  for (const v of vals) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function extractEstimate(quote: AnyRow | null) {
  if (!quote) {
    return { target: 0, min: 0, max: 0 };
  }

  // 1) direct column guesses
  const directTarget =
    toNum(
      firstNonNull(
        quote.estimate_target,
        quote.target,
        quote.target_price,
        quote.estimated_price,
        quote.quote_total,
        quote.price
      )
    ) ?? null;

  const directMin =
    toNum(
      firstNonNull(
        quote.estimate_min,
        quote.min,
        quote.min_price,
        quote.low,
        quote.range_min
      )
    ) ?? null;

  const directMax =
    toNum(
      firstNonNull(
        quote.estimate_max,
        quote.max,
        quote.max_price,
        quote.high,
        quote.range_max
      )
    ) ?? null;

  if (directTarget !== null || directMin !== null || directMax !== null) {
    const t = directTarget ?? directMin ?? directMax ?? 0;
    return {
      target: Math.round(t),
      min: Math.round(directMin ?? t),
      max: Math.round(directMax ?? t),
    };
  }

  // 2) nested JSON guesses
  const jsonCandidates = [
    quote.estimate,
    quote.pricing,
    quote.summary,
    quote.quote_json,
    quote.quote_data,
    quote.payload,
    quote.result,
    quote.data,
    quote.answers,
  ]
    .map(parseJsonMaybe)
    .filter(Boolean);

  for (const j of jsonCandidates) {
    const target =
      toNum(
        firstNonNull(
          getNested(j, ["pricing", "target"]),
          getNested(j, ["estimate", "target"]),
          getNested(j, ["target"]),
          getNested(j, ["quote", "target"])
        )
      ) ?? null;

    const min =
      toNum(
        firstNonNull(
          getNested(j, ["pricing", "minimum"]),
          getNested(j, ["pricing", "min"]),
          getNested(j, ["estimate", "min"]),
          getNested(j, ["min"])
        )
      ) ?? null;

    const max =
      toNum(
        firstNonNull(
          getNested(j, ["pricing", "maximum"]),
          getNested(j, ["pricing", "max"]),
          getNested(j, ["pricing", "upper"]),
          getNested(j, ["estimate", "max"]),
          getNested(j, ["max"])
        )
      ) ?? null;

    if (target !== null || min !== null || max !== null) {
      const t = target ?? min ?? max ?? 0;
      return {
        target: Math.round(t),
        min: Math.round(min ?? t),
        max: Math.round(max ?? t),
      };
    }
  }

  return { target: 0, min: 0, max: 0 };
}

function extractTier(quote: AnyRow | null, pieRow: AnyRow | null) {
  const pieJson = pieRow ? parseJsonMaybe(pieRow.report_json ?? pieRow.report ?? pieRow.payload ?? pieRow.data) : null;

  return (
    toStr(pieRow?.tier) ||
    toStr(getNested(pieJson, ["tier"])) ||
    toStr(quote?.tier) ||
    toStr(quote?.recommended_tier) ||
    toStr(quote?.package_tier) ||
    "—"
  );
}

function extractPieView(pieRow: AnyRow | null) {
  if (!pieRow) {
    return {
      exists: false,
      id: null,
      score: null,
      tier: null,
      confidence: null,
      summary: "No PIE report yet.",
      pricingTarget: null,
      pricingMin: null,
      pricingMax: null,
      risks: [],
      pitch: null,
      hoursMin: null,
      hoursMax: null,
      timelineText: null,
    };
  }

  const j = parseJsonMaybe(pieRow.report_json ?? pieRow.report ?? pieRow.payload ?? pieRow.data) ?? {};

  const score =
    toNum(firstNonNull(pieRow.score, j.score, getNested(j, ["complexity", "score"]))) ?? null;

  const tier = toStr(firstNonNull(pieRow.tier, j.tier, getNested(j, ["recommendation", "tier"])));
  const confidence = toStr(firstNonNull(pieRow.confidence, j.confidence));

  const summary =
    toStr(firstNonNull(pieRow.summary, j.summary, getNested(j, ["executiveSummary"]))) ||
    "PIE report available.";

  const pricingTarget =
    toNum(
      firstNonNull(
        pieRow.pricing_target,
        getNested(j, ["pricing", "target"]),
        getNested(j, ["pricing", "recommended"]),
        getNested(j, ["pricingTarget"])
      )
    ) ?? null;

  const pricingMin =
    toNum(
      firstNonNull(
        pieRow.pricing_min,
        getNested(j, ["pricing", "minimum"]),
        getNested(j, ["pricing", "min"])
      )
    ) ?? null;

  let pricingMax =
    toNum(
      firstNonNull(
        pieRow.pricing_max,
        getNested(j, ["pricing", "maximum"]),
        getNested(j, ["pricing", "max"]),
        getNested(j, ["pricing", "upper"])
      )
    ) ?? null;

  // some PIEs store upper estimate in a buffers array
  if (pricingMax === null && Array.isArray(getNested(j, ["pricing", "buffers"]))) {
    const upper = (getNested(j, ["pricing", "buffers"]) as any[]).find((b) =>
      String(b?.label || "").toLowerCase().includes("upper")
    );
    pricingMax = toNum(upper?.amount);
  }

  const risks = Array.isArray(j.risks) ? j.risks.map((r: any) => String(r)) : [];

  const pitch = j.pitch ?? null;

  const hoursMin =
    toNum(
      firstNonNull(
        pieRow.hours_min,
        getNested(j, ["effort", "hoursMin"]),
        getNested(j, ["hours", "min"]),
        getNested(j, ["hoursMin"])
      )
    ) ?? null;

  const hoursMax =
    toNum(
      firstNonNull(
        pieRow.hours_max,
        getNested(j, ["effort", "hoursMax"]),
        getNested(j, ["hours", "max"]),
        getNested(j, ["hoursMax"])
      )
    ) ?? null;

  const timelineText =
    toStr(
      firstNonNull(
        pieRow.timeline_text,
        getNested(j, ["effort", "timelineText"]),
        getNested(j, ["timeline", "text"]),
        getNested(j, ["timelineText"])
      )
    ) ?? null;

  return {
    exists: true,
    id: toStr(pieRow.id),
    score,
    tier,
    confidence,
    summary,
    pricingTarget,
    pricingMin,
    pricingMax,
    risks,
    pitch,
    hoursMin,
    hoursMax,
    timelineText,
  };
}

async function safeSelectAll(
  table: string,
  ids?: { column: string; values: string[] }
): Promise<AnyRow[]> {
  try {
    const sb: any = supabaseAdmin;
    let q = sb.from(table).select("*");

    if (ids && ids.values.length) {
      q = q.in(ids.column, ids.values);
    }

    const { data, error } = await q;
    if (error) return [];
    return Array.isArray(data) ? (data as AnyRow[]) : [];
  } catch {
    return [];
  }
}

function buildLatestByKey<T extends AnyRow>(
  rows: T[],
  keyField: string,
  dateField = "created_at"
) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = toStr(row[keyField]);
    if (!key) continue;

    const prev = map.get(key);
    if (!prev) {
      map.set(key, row);
      continue;
    }

    const curDate = new Date(row[dateField] ?? 0).getTime();
    const prevDate = new Date(prev[dateField] ?? 0).getTime();
    if (curDate >= prevDate) map.set(key, row);
  }
  return map;
}

export default async function InternalAdminPage() {
  const sb: any = supabaseAdmin;

  const { data: projectsRaw, error: projectsError } = await sb
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (projectsError) {
    return (
      <div className="container">
        <h1>Internal Admin</h1>
        <div className="card">
          <div className="cardInner">
            Could not load quotes: {projectsError.message}
          </div>
        </div>
      </div>
    );
  }

  const projects = (projectsRaw || []) as AnyRow[];

  const quoteIds = Array.from(
    new Set(
      projects
        .map((p) => toStr(p.quote_id))
        .filter(Boolean) as string[]
    )
  );

  const projectIds = Array.from(
    new Set(
      projects
        .map((p) => toStr(p.id))
        .filter(Boolean) as string[]
    )
  );

  // Pull related tables (all are soft-fail so the page still loads)
  const [quotes, pieReports, assets, revisions, notesA, notesB, callReqA, callReqB] =
    await Promise.all([
      safeSelectAll("quotes", { column: "id", values: quoteIds }),
      // Your SQL output confirms pie_reports has quote_id
      safeSelectAll("pie_reports", { column: "quote_id", values: quoteIds }),
      safeSelectAll("project_assets", { column: "project_id", values: projectIds }),
      safeSelectAll("project_revisions", { column: "project_id", values: projectIds }),
      safeSelectAll("project_messages", { column: "project_id", values: projectIds }),
      safeSelectAll("project_notes", { column: "project_id", values: projectIds }),
      safeSelectAll("call_requests", { column: "quote_id", values: quoteIds }),
      safeSelectAll("quote_call_requests", { column: "quote_id", values: quoteIds }),
    ]);

  const quoteById = new Map<string, AnyRow>();
  for (const q of quotes) {
    const id = toStr(q.id);
    if (id) quoteById.set(id, q);
  }

  // PIE by quote (latest)
  const pieRowsByQuote = new Map<string, AnyRow[]>();
  for (const pr of pieReports) {
    const qid = toStr(pr.quote_id);
    if (!qid) continue;
    const list = pieRowsByQuote.get(qid) || [];
    list.push(pr);
    pieRowsByQuote.set(qid, list);
  }

  function pickLatestPieForQuote(quoteId: string, latestPieId?: string | null) {
    const list = pieRowsByQuote.get(quoteId) || [];
    if (!list.length) return null;

    if (latestPieId) {
      const exact = list.find((r) => String(r.id) === latestPieId);
      if (exact) return exact;
    }

    list.sort((a, b) => {
      const at = new Date(a.created_at ?? 0).getTime();
      const bt = new Date(b.created_at ?? 0).getTime();
      return bt - at;
    });
    return list[0] ?? null;
  }

  // Counts
  const assetCountByProject: Record<string, number> = {};
  for (const a of assets) {
    const pid = toStr(a.project_id);
    if (!pid) continue;
    assetCountByProject[pid] = (assetCountByProject[pid] || 0) + 1;
  }

  const revisionCountByProject: Record<string, number> = {};
  for (const r of revisions) {
    const pid = toStr(r.project_id);
    if (!pid) continue;
    revisionCountByProject[pid] = (revisionCountByProject[pid] || 0) + 1;
  }

  // Latest client note/message (supports either table shape)
  const allNoteLikeRows = [...notesA, ...notesB];

  const clientNoteCandidates = allNoteLikeRows.filter((row) => {
    const role = String(
      firstNonNull(
        row.author_type,
        row.author_role,
        row.sender_type,
        row.source,
        row.role
      ) ?? ""
    ).toLowerCase();

    const isInternal = row.is_internal;
    if (role.includes("client")) return true;
    if (typeof isInternal === "boolean") return isInternal === false;

    // fallback: include all and let latest show if schema is simple notes table
    return true;
  });

  const latestClientNoteByProject = buildLatestByKey(clientNoteCandidates, "project_id");

  // Latest call request by quote
  const allCallRows = [...callReqA, ...callReqB];
  const latestCallByQuote = new Map<string, AnyRow>();

  for (const row of allCallRows) {
    const qid = toStr(row.quote_id);
    if (!qid) continue;

    const prev = latestCallByQuote.get(qid);
    if (!prev) {
      latestCallByQuote.set(qid, row);
      continue;
    }

    const curDate = new Date(row.created_at ?? 0).getTime();
    const prevDate = new Date(prev.created_at ?? 0).getTime();
    if (curDate >= prevDate) latestCallByQuote.set(qid, row);
  }

  const rows = projects
    .map((project) => {
      const projectId = toStr(project.id)!;
      const quoteId = toStr(project.quote_id);
      const quote = quoteId ? quoteById.get(quoteId) || null : null;

      const latestPieId = toStr(project.latest_pie_report_id);
      const pieRow = quoteId ? pickLatestPieForQuote(quoteId, latestPieId) : null;
      const pie = extractPieView(pieRow);

      const estimate = extractEstimate(quote);

      const adminPricingRaw = parseJsonMaybe(project.admin_pricing) || {};
      const adminPricing = {
        discountPercent: toNum(adminPricingRaw.discountPercent) ?? 0,
        flatAdjustment: toNum(adminPricingRaw.flatAdjustment) ?? 0,
        hourlyRate: toNum(adminPricingRaw.hourlyRate) ?? 40,
        notes: toStr(adminPricingRaw.notes) ?? "",
      };

      const callRow = quoteId ? latestCallByQuote.get(quoteId) : null;

      const latestNoteRow = latestClientNoteByProject.get(projectId);
      const latestClientNote =
        toStr(
          firstNonNull(
            latestNoteRow?.body,
            latestNoteRow?.message,
            latestNoteRow?.note,
            latestNoteRow?.content,
            latestNoteRow?.text
          )
        ) ?? "";

      const latestClientNoteAt =
        toStr(firstNonNull(latestNoteRow?.created_at, latestNoteRow?.updated_at)) ?? null;

      const leadEmail =
        toStr(firstNonNull(project.lead_email, quote?.lead_email, quote?.email)) ?? "—";

      const leadName =
        toStr(firstNonNull(project.lead_name, quote?.lead_name, quote?.name)) ?? null;

      const projectStatus =
        toStr(firstNonNull(project.status, quote?.status)) ?? "new";

      const clientStatus =
        toStr(project.client_status) ?? "new";

      const tier = extractTier(quote, pieRow);

      const createdAt =
        toStr(firstNonNull(quote?.created_at, project.created_at)) ?? new Date().toISOString();

      return {
        quoteId: quoteId || `project:${projectId}`,
        projectId,
        createdAt,
        status: projectStatus,
        clientStatus,
        tier,
        leadEmail,
        leadName,

        estimate,
        estimateFormatted: {
          target: fmtCurrency(estimate.target),
          min: fmtCurrency(estimate.min),
          max: fmtCurrency(estimate.max),
        },

        callRequest: callRow
          ? {
              status: toStr(callRow.status) ?? "new",
              bestTime:
                toStr(
                  firstNonNull(
                    callRow.best_time,
                    callRow.bestTime,
                    callRow.preferred_time
                  )
                ) ?? null,
              preferredTimes:
                toStr(firstNonNull(callRow.preferred_times, callRow.preferredTimes)) ?? null,
              timezone: toStr(callRow.timezone) ?? null,
              notes: toStr(callRow.notes) ?? null,
            }
          : null,

        pie,

        adminPricing,
        proposalText: toStr(project.proposal_text) ?? "",

        // NEW sync-visible fields
        sync: {
          assetCount: assetCountByProject[projectId] || 0,
          revisionCount: revisionCountByProject[projectId] || 0,
          latestClientNote,
          latestClientNoteAt,
        },

        links: {
          detail: quoteId ? `/internal/preview/${quoteId}` : `/internal/preview`,
        },
      };
    })
    .sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return bt - at;
    });

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Internal Admin</h1>
        <div className="smallNote" style={{ marginTop: 6 }}>
          Pipeline + PIE + client sync visibility
        </div>
      </div>

      <AdminPipelineClient initialRows={rows as any} />
    </div>
  );
}