// app/internal/admin/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminPipelineClient from "./AdminPipelineClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function currency(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

function estimateHoursFromPie(score: number, tier: string) {
  // Fallback estimation if PIE JSON doesn't yet include hours
  const t = (tier || "").toLowerCase();
  let min = 8;
  let max = 14;

  if (t === "growth") {
    min = 16;
    max = 30;
  } else if (t === "premium") {
    min = 30;
    max = 60;
  }

  if (score > 0) {
    min = Math.max(min, Math.round(score * 0.25));
    max = Math.max(max, Math.round(score * 0.5));
    if (max <= min) max = min + 4;
  }

  return { min, max };
}

function extractPieView(pieRow: any, quoteRow: any) {
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
      risks: [] as string[],
      pitch: null as any,
      hoursMin: null as number | null,
      hoursMax: null as number | null,
      timelineText: null as string | null,
    };
  }

  const report = safeObj(pieRow.report);
  const payload = safeObj(pieRow.payload);
  const root = Object.keys(report).length ? report : payload;

  const pricing = safeObj(root.pricing);
  const score = Number(pieRow.score ?? root.score ?? 0) || 0;
  const tier = pieRow.tier ?? root.tier ?? quoteRow?.tier ?? null;
  const confidence = pieRow.confidence ?? root.confidence ?? null;

  const hours =
    safeObj(root.timeline)?.hours ??
    safeObj(root.hours) ??
    safeObj(root.estimateHours);

  let hoursMin: number | null = null;
  let hoursMax: number | null = null;
  let timelineText: string | null = null;

  if (hours && typeof hours === "object") {
    if (typeof hours.min === "number") hoursMin = hours.min;
    if (typeof hours.max === "number") hoursMax = hours.max;
    if (typeof hours.label === "string") timelineText = hours.label;
  }

  if (hoursMin == null || hoursMax == null) {
    const fb = estimateHoursFromPie(score, tier || "");
    hoursMin = fb.min;
    hoursMax = fb.max;
  }

  if (!timelineText) {
    const weeksMin = Math.max(1, Math.round((hoursMin || 0) / 15));
    const weeksMax = Math.max(1, Math.round((hoursMax || 0) / 15));
    timelineText =
      weeksMin === weeksMax
        ? `${weeksMin} week${weeksMin > 1 ? "s" : ""}`
        : `${weeksMin}–${weeksMax} weeks`;
  }

  const buffers = Array.isArray(pricing.buffers) ? pricing.buffers : [];
  const upperBuffer = buffers.find((b: any) =>
    String(b?.label || "").toLowerCase().includes("upper")
  );

  return {
    exists: true,
    id: pieRow.id,
    score,
    tier,
    confidence,
    summary: root.summary || "PIE summary available.",
    pricingTarget:
      typeof pricing.target === "number"
        ? pricing.target
        : Math.round((quoteRow?.total_cents || 0) / 100),
    pricingMin:
      typeof pricing.minimum === "number"
        ? pricing.minimum
        : Math.round((quoteRow?.min_total_cents || 0) / 100),
    pricingMax:
      typeof upperBuffer?.amount === "number"
        ? upperBuffer.amount
        : Math.round((quoteRow?.max_total_cents || 0) / 100),
    risks: Array.isArray(root.risks) ? root.risks : [],
    pitch: safeObj(root.pitch),
    hoursMin,
    hoursMax,
    timelineText,
  };
}

export default async function InternalAdminPage() {
  const { data: quotes, error: quotesError } = await supabaseAdmin
    .from("quotes")
    .select(
      "id, created_at, status, tier, total_cents, min_total_cents, max_total_cents, breakdown, debug, lead_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (quotesError) {
    return (
      <main className="section">
        <div className="container">
          <div className="card">
            <div className="cardInner">
              <h1 className="h2">Internal Admin</h1>
              <p className="p">
                Could not load quotes: {quotesError.message}
              </p>
              <div className="row" style={{ marginTop: 12 }}>
                <Link className="btn btnGhost" href="/internal/preview">
                  Back to Preview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const quoteRows = quotes || [];
  const quoteIds = quoteRows.map((q: any) => q.id).filter(Boolean);
  const leadIds = quoteRows.map((q: any) => q.lead_id).filter(Boolean);

  const [leadsRes, callsRes, piesRes] = await Promise.all([
    leadIds.length
      ? supabaseAdmin.from("leads").select("id, email, name").in("id", leadIds)
      : Promise.resolve({ data: [], error: null } as any),
    quoteIds.length
      ? supabaseAdmin
          .from("call_requests")
          .select(
            "id, quote_id, status, best_time_to_call, preferred_times, timezone, notes, created_at"
          )
          .in("quote_id", quoteIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null } as any),
    quoteIds.length
      ? supabaseAdmin
          .from("pie_reports")
          .select(
            "id, quote_id, created_at, score, tier, confidence, report, payload"
          )
          .in("quote_id", quoteIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  const leads = leadsRes.data || [];
  const calls = callsRes.data || [];
  const pies = piesRes.data || [];

  const leadById = new Map<string, any>();
  for (const l of leads) leadById.set(l.id, l);

  const callByQuoteId = new Map<string, any>();
  for (const c of calls) {
    if (!callByQuoteId.has(c.quote_id)) callByQuoteId.set(c.quote_id, c);
  }

  const pieByQuoteId = new Map<string, any>();
  for (const p of pies) {
    if (!pieByQuoteId.has(p.quote_id)) pieByQuoteId.set(p.quote_id, p);
  }

  const rows = quoteRows.map((q: any) => {
    const lead = leadById.get(q.lead_id) || null;
    const call = callByQuoteId.get(q.id) || null;
    const pieRow = pieByQuoteId.get(q.id) || null;
    const pie = extractPieView(pieRow, q);
    const debug = safeObj(q.debug);
    const adminPricing = safeObj(debug.adminPricing);

    return {
      quoteId: q.id,
      createdAt: q.created_at,
      status: q.status || "new",
      tier: q.tier || "essential",
      leadEmail: lead?.email || "—",
      leadName: lead?.name || null,
      estimate: {
        target: Math.round((q.total_cents || 0) / 100),
        min: Math.round((q.min_total_cents || 0) / 100),
        max: Math.round((q.max_total_cents || 0) / 100),
      },
      estimateFormatted: {
        target: currency(Math.round((q.total_cents || 0) / 100)),
        min: currency(Math.round((q.min_total_cents || 0) / 100)),
        max: currency(Math.round((q.max_total_cents || 0) / 100)),
      },
      callRequest: call
        ? {
            status: call.status || "new",
            bestTime: call.best_time_to_call || null,
            preferredTimes: call.preferred_times || null,
            timezone: call.timezone || null,
            notes: call.notes || null,
          }
        : null,
      pie,
      adminPricing: {
        discountPercent:
          typeof adminPricing.discountPercent === "number"
            ? adminPricing.discountPercent
            : 0,
        flatAdjustment:
          typeof adminPricing.flatAdjustment === "number"
            ? adminPricing.flatAdjustment
            : 0,
        hourlyRate:
          typeof adminPricing.hourlyRate === "number" ? adminPricing.hourlyRate : 40,
        notes: typeof adminPricing.notes === "string" ? adminPricing.notes : "",
      },
      proposalText:
        typeof debug.generatedProposal === "string" ? debug.generatedProposal : "",
      links: {
        detail: `/internal/preview?quoteId=${q.id}`,
      },
    };
  });

  return (
    <main className="section">
      <div className="container">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="cardInner">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="kicker">
                  <span className="kickerDot" />
                  Admin Dashboard v1
                </div>
                <h1 className="h2" style={{ marginTop: 10 }}>
                  PIE-powered lead pipeline
                </h1>
                <p className="p" style={{ marginTop: 8 }}>
                  Review quotes, read PIE summaries quickly, update status, apply
                  admin pricing adjustments, and generate proposal text.
                </p>
              </div>
              <div className="row" style={{ alignItems: "center" }}>
                <Link className="btn btnGhost" href="/internal/preview">
                  Internal Preview
                </Link>
              </div>
            </div>
          </div>
        </div>

        <AdminPipelineClient initialRows={rows} />
      </div>
    </main>
  );
}