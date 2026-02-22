// app/internal/admin/page.tsx
import AdminPipelineClient from "./AdminPipelineClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyObj = Record<string, any>;

type PieView = {
  exists: boolean;
  id: string | null;
  score: number | null;
  tier: string | null;
  confidence: string | null;
  summary: string;
  pricingTarget: number | null;
  pricingMin: number | null;
  pricingMax: number | null;
  risks: string[];
  pitch: any;
  hoursMin: number | null;
  hoursMax: number | null;
  timelineText: string | null;
};

type PipelineRow = {
  quoteId: string;
  createdAt: string;
  status: string;
  tier: string;
  leadEmail: string;
  leadName: string | null;
  estimate: { target: number; min: number; max: number };
  estimateFormatted: { target: string; min: string; max: string };
  callRequest: null | {
    status: string;
    bestTime: string | null;
    preferredTimes: string | null;
    timezone: string | null;
    notes: string | null;
  };
  pie: PieView;
  portal: {
    clientStatus: string | null;
    clientUpdatedAt: string | null;
    latestClientNote: string | null;
    assetCount: number;
    revisionCount: number;
  };
  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };
  proposalText: string;
  links: { detail: string };
};

function asObj(v: unknown): AnyObj {
  if (!v) return {};
  if (typeof v === "object" && !Array.isArray(v)) return v as AnyObj;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as AnyObj;
      }
    } catch {}
  }
  return {};
}

function asArray<T = any>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {}
  }
  return [];
}

function n(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function nOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function s(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function latestByQuote<T extends { quote_id?: string | null; created_at?: string | null }>(
  rows: T[] | null | undefined
) {
  const map = new Map<string, T>();
  for (const row of rows || []) {
    const qid = row?.quote_id ? String(row.quote_id) : "";
    if (!qid) continue;
    const prev = map.get(qid);
    if (!prev) {
      map.set(qid, row);
      continue;
    }
    const prevTime = new Date(prev.created_at || 0).getTime();
    const curTime = new Date(row.created_at || 0).getTime();
    if (curTime >= prevTime) map.set(qid, row);
  }
  return map;
}

function parsePie(latestPieRow: AnyObj | undefined): PieView {
  if (!latestPieRow) {
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
      pitch: {},
      hoursMin: null,
      hoursMax: null,
      timelineText: null,
    };
  }

  const report = asObj(latestPieRow.report);
  const pricing = asObj(report.pricing);
  const hours = asObj(report.hours);
  const timeline = asObj(report.timeline);
  const pitch = asObj(report.pitch);

  const buffers = asArray<any>(pricing.buffers);
  const upper = buffers.find((b) =>
    String(b?.label || "").toLowerCase().includes("upper")
  );

  return {
    exists: true,
    id: s(latestPieRow.id),
    score: nOrNull(latestPieRow.score) ?? nOrNull(report.score),
    tier: s(latestPieRow.tier) ?? s(report.tier),
    confidence: s(latestPieRow.confidence) ?? s(report.confidence),
    summary: s(report.summary) || "PIE report generated.",
    pricingTarget: nOrNull(pricing.target),
    pricingMin: nOrNull(pricing.minimum),
    pricingMax: nOrNull(upper?.amount) ?? nOrNull(pricing.maximum),
    risks: asArray<string>(report.risks).filter(Boolean),
    pitch,
    hoursMin: nOrNull(hours.min),
    hoursMax: nOrNull(hours.max),
    timelineText:
      s(report.timelineText) || s(timeline.text) || s(report.timeline_estimate),
  };
}

export default async function InternalAdminPage() {
  const { data: quotesRaw, error: quotesErr } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);

  if (quotesErr) {
    return (
      <main className="container section">
        <div className="card">
          <div className="cardInner">
            <h1 className="h2">Internal Admin</h1>
            <p className="p">Could not load quotes: {quotesErr.message}</p>
          </div>
        </div>
      </main>
    );
  }

  const quotes = (quotesRaw || []) as AnyObj[];
  const quoteIds = quotes.map((q) => String(q.id)).filter(Boolean);
  const leadIds = Array.from(
    new Set(quotes.map((q) => q.lead_id).filter(Boolean).map(String))
  );

  const [
    leadsRes,
    callsRes,
    piesRes,
    portalRes,
  ] = await Promise.all([
    leadIds.length
      ? supabaseAdmin.from("leads").select("*").in("id", leadIds)
      : Promise.resolve({ data: [], error: null } as any),

    quoteIds.length
      ? supabaseAdmin.from("call_requests").select("*").in("quote_id", quoteIds)
      : Promise.resolve({ data: [], error: null } as any),

    quoteIds.length
      ? supabaseAdmin.from("pie_reports").select("*").in("quote_id", quoteIds)
      : Promise.resolve({ data: [], error: null } as any),

    quoteIds.length
      ? supabaseAdmin.from("quote_portal_state").select("*").in("quote_id", quoteIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  const leadsById = new Map<string, AnyObj>();
  for (const lead of (leadsRes.data || []) as AnyObj[]) {
    if (lead?.id) leadsById.set(String(lead.id), lead);
  }

  const latestCallByQuote = latestByQuote((callsRes.data || []) as AnyObj[]);
  const latestPieByQuote = latestByQuote((piesRes.data || []) as AnyObj[]);

  const portalByQuote = new Map<string, AnyObj>();
  // If the portal table doesn't exist yet, don't break the admin page.
  if (!portalRes.error) {
    for (const row of (portalRes.data || []) as AnyObj[]) {
      if (row?.quote_id) portalByQuote.set(String(row.quote_id), row);
    }
  }

  const rows: PipelineRow[] = quotes.map((q) => {
    const quoteId = String(q.id);
    const intake = asObj(q.intake_normalized);
    const lead = q.lead_id ? leadsById.get(String(q.lead_id)) : undefined;
    const call = latestCallByQuote.get(quoteId);
    const pieRow = latestPieByQuote.get(quoteId);
    const pie = parsePie(pieRow);
    const portal = portalByQuote.get(quoteId);

    const estimateTarget =
      nOrNull(q.estimate_total) ??
      nOrNull(asObj(q.estimate).target) ??
      pie.pricingTarget ??
      0;
    const estimateMin =
      nOrNull(q.estimate_low) ??
      nOrNull(asObj(q.estimate).min) ??
      pie.pricingMin ??
      estimateTarget;
    const estimateMax =
      nOrNull(q.estimate_high) ??
      nOrNull(asObj(q.estimate).max) ??
      pie.pricingMax ??
      estimateTarget;

    const adminPricingRaw = asObj(q.admin_pricing);
    const assets = asArray<any>(portal?.assets);
    const revisions = asArray<any>(portal?.revision_requests);

    const leadEmail =
      s(lead?.email) ||
      s(q.lead_email) ||
      s(intake.email) ||
      s(intake.contactEmail) ||
      "Unknown lead";

    const leadName =
      s(lead?.name) ||
      s(q.lead_name) ||
      s(intake.name) ||
      s(intake.contactName) ||
      null;

    return {
      quoteId,
      createdAt: s(q.created_at) || "",
      status: s(q.status) || "new",
      tier:
        s(q.tier_recommended) ||
        s(q.tier) ||
        pie.tier ||
        "essential",
      leadEmail,
      leadName,
      estimate: {
        target: Math.round(estimateTarget),
        min: Math.round(estimateMin),
        max: Math.round(estimateMax),
      },
      estimateFormatted: {
        target: fmtCurrency(Math.round(estimateTarget)),
        min: fmtCurrency(Math.round(estimateMin)),
        max: fmtCurrency(Math.round(estimateMax)),
      },
      callRequest: call
        ? {
            status: s(call.status) || "new",
            bestTime: s(call.best_time_to_call),
            preferredTimes: s(call.preferred_times),
            timezone: s(call.timezone),
            notes: s(call.notes),
          }
        : null,
      pie,
      portal: {
        clientStatus: s(portal?.client_status),
        clientUpdatedAt: s(portal?.client_updated_at),
        latestClientNote: s(portal?.client_notes),
        assetCount: assets.length,
        revisionCount: revisions.length,
      },
      adminPricing: {
        discountPercent: n(adminPricingRaw.discountPercent, 0),
        flatAdjustment: n(adminPricingRaw.flatAdjustment, 0),
        hourlyRate: n(adminPricingRaw.hourlyRate, 40),
        notes: s(adminPricingRaw.notes) || "",
      },
      proposalText: s(q.proposal_text) || "",
      links: {
        detail: `/internal/preview/${quoteId}`,
      },
    };
  });

  return (
    <main className="container section">
      <div style={{ marginBottom: 14 }}>
        <div className="h2" style={{ marginBottom: 6 }}>
          Internal Admin
        </div>
        <div className="p" style={{ margin: 0 }}>
          Pipeline, PIE summaries, pricing controls, proposal drafts, and client portal activity.
        </div>
        {portalRes.error ? (
          <div className="hint" style={{ marginTop: 10 }}>
            Portal activity table not found yet. Run the portal SQL migration to enable client
            status/assets/revisions in admin.
          </div>
        ) : null}
      </div>

      <AdminPipelineClient initialRows={rows} />
    </main>
  );
}