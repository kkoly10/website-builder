// lib/pie/ensurePie.ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type QuoteRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  tier_recommended?: string | null;
  estimate_total?: number | string | null;
  estimate_low?: number | string | null;
  estimate_high?: number | string | null;
  intake_raw?: any;
  intake_normalized?: any;
  latest_pie_report_id?: string | null;
};

type PieGenerateResult = {
  created: boolean;
  pie: any;
};

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function boolish(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  return false;
}

function capitalize(s?: string | null) {
  if (!s) return "Standard";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function safeObj(v: any): Record<string, any> {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
}

function buildReportFromQuote(quote: QuoteRow) {
  const normalized = safeObj(quote.intake_normalized);
  const raw = safeObj(quote.intake_raw);
  const intake = Object.keys(normalized).length ? normalized : raw;

  const pages = String(intake.pages ?? "").toLowerCase();
  const websiteType = String(intake.websiteType ?? "").toLowerCase();
  const contentReady = String(intake.contentReady ?? "").toLowerCase();
  const timeline = String(intake.timeline ?? "").toLowerCase();
  const integrations = Array.isArray(intake.integrations)
    ? intake.integrations
    : typeof intake.integrations === "string" && intake.integrations
    ? [intake.integrations]
    : [];

  let score = 10;

  // Page complexity
  if (pages.includes("1-3")) score += 6;
  else if (pages.includes("4-6")) score += 14;
  else if (pages.includes("7-10")) score += 22;
  else if (pages.includes("10+")) score += 30;
  else score += 10;

  // Feature complexity
  if (boolish(intake.booking)) score += 10;
  if (boolish(intake.payments)) score += 15;
  if (boolish(intake.membership)) score += 18;
  if (boolish(intake.blog)) score += 6;

  // Integrations
  score += Math.min(integrations.length * 5, 15);

  // Content readiness affects risk/effort
  if (contentReady.includes("none")) score += 10;
  else if (contentReady.includes("some")) score += 5;
  else if (contentReady.includes("ready")) score += 1;

  // Timeline urgency
  if (timeline.includes("1 week")) score += 10;
  else if (timeline.includes("2-3")) score += 4;
  else if (timeline.includes("month")) score += 2;

  // Website type
  if (websiteType.includes("ecommerce")) score += 18;
  else if (websiteType.includes("business")) score += 5;
  else if (websiteType.includes("portfolio")) score += 3;

  score = Math.max(1, Math.min(100, score));

  const estimateLow = toNum(quote.estimate_low);
  const estimateHigh = toNum(quote.estimate_high);
  const estimateTotal = toNum(quote.estimate_total);

  const target = estimateTotal ?? Math.round((estimateLow ?? 450 + (estimateHigh ?? 650)) / 2);
  const minimum = estimateLow ?? Math.round(target * 0.9);

  const tier = capitalize(quote.tier_recommended) || (score >= 70 ? "Premium" : score >= 40 ? "Growth" : "Essential");

  const risks: string[] = [];
  if (!contentReady || contentReady.includes("none") || contentReady.includes("some")) {
    risks.push("Content readiness may affect timeline.");
  }
  if (integrations.length > 0) {
    risks.push("3rd-party integration setup/testing may add revisions.");
  }
  if (boolish(intake.membership) || boolish(intake.payments)) {
    risks.push("Auth/payments introduce extra QA scope.");
  }

  const emphasize = ["Clear scope", "Fast launch path", "Upgrade flexibility"];
  if (boolish(intake.payments)) emphasize.push("Payments-ready build");
  if (integrations.length) emphasize.push("Integration support");

  const report = {
    tier,
    score,
    confidence: "High",
    summary: `Estimated complexity ${score}/100 with ${tier} scope.`,
    pricing: {
      target,
      minimum,
      buffers: estimateHigh && target < estimateHigh ? [{ label: "Upper estimate", amount: estimateHigh }] : [],
    },
    risks,
    pitch: {
      recommend: `Recommend ${tier} based on complexity, timeline, and requested features.`,
      emphasize,
      objections: [
        "Can we start smaller and phase features?",
        "Can we reduce price by simplifying scope?",
        "What’s included vs excluded?",
      ],
    },
  };

  return { report, intake };
}

async function getQuoteById(quoteId: string): Promise<QuoteRow> {
  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select(
      "id, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, intake_raw, intake_normalized, latest_pie_report_id"
    )
    .eq("id", quoteId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || `Quote not found: ${quoteId}`);
  }
  return data as QuoteRow;
}

async function getLatestPieByQuoteId(quoteId: string) {
  const { data, error } = await supabaseAdmin
    .from("pie_reports")
    .select("id, quote_id, created_at, report, score, tier, confidence")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function generatePieForQuoteId(
  quoteId: string,
  opts?: { force?: boolean }
): Promise<PieGenerateResult> {
  const force = !!opts?.force;

  if (!force) {
    const existing = await getLatestPieByQuoteId(quoteId);
    if (existing) {
      return { created: false, pie: existing };
    }
  }

  const quote = await getQuoteById(quoteId);
  const { report, intake } = buildReportFromQuote(quote);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // IMPORTANT:
  // quote-based PIE does NOT have a project row; project_id is intentionally null.
  const insertRow = {
    token: crypto.randomUUID(),
    project_id: null,
    quote_id: quote.id,
    report,
    payload: { source: "quote", quoteId: quote.id },
    input: intake,
    score: report.score,
    tier: report.tier,
    confidence: report.confidence,
    expires_at: expiresAt,
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("pie_reports")
    .insert(insertRow)
    .select("id, quote_id, created_at, report, score, tier, confidence")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Failed to insert PIE report");
  }

  const { error: quoteUpdateError } = await supabaseAdmin
    .from("quotes")
    .update({ latest_pie_report_id: inserted.id })
    .eq("id", quote.id);

  if (quoteUpdateError) {
    throw new Error(quoteUpdateError.message);
  }

  return { created: true, pie: inserted };
}

/**
 * Backward-compatible alias for older imports
 */
export const ensurePieForQuoteId = generatePieForQuoteId;

/**
 * Small helper API used by some older backfill routes/pages.
 * This keeps old imports from breaking while the codebase is in transition.
 */
export const pieDb = {
  async listQuotesMissingPie(limit = 200) {
    const { data, error } = await supabaseAdmin
      .from("quotes")
      .select("id, latest_pie_report_id")
      .is("latest_pie_report_id", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async latestPieByQuoteId(quoteId: string) {
    return getLatestPieByQuoteId(quoteId);
  },
};