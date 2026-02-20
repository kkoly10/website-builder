// lib/pieEngine.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Json = Record<string, any>;

function sb() {
  // Your supabaseAdmin supports both callable + direct; this keeps it safe.
  return typeof supabaseAdmin === "function" ? supabaseAdmin() : supabaseAdmin;
}

function asObj(v: any): Json {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapTier(tierRecommended: string | null | undefined, total: number): string {
  const t = String(tierRecommended || "").toLowerCase();
  if (t.includes("premium")) return "Premium";
  if (t.includes("growth")) return "Growth";
  if (t.includes("essential")) return "Essential";

  if (total >= 1700) return "Premium";
  if (total >= 900) return "Growth";
  return "Essential";
}

function scoreFromQuote(quote: any) {
  const intake = asObj(quote?.intake_normalized);
  const estimateTotal = Number(quote?.estimate_total || 0);

  const pagesRaw = String(intake?.pages || "1-3");
  let pagesMax = 3;
  if (pagesRaw.includes("+")) {
    pagesMax = parseInt(pagesRaw.replace("+", ""), 10) || 9;
  } else if (pagesRaw.includes("-")) {
    const parts = pagesRaw.split("-");
    pagesMax = parseInt(parts[1] || parts[0], 10) || 3;
  } else {
    pagesMax = parseInt(pagesRaw, 10) || 3;
  }

  const featureCount =
    (intake?.booking ? 1 : 0) +
    (intake?.payments ? 1 : 0) +
    (intake?.blog ? 1 : 0) +
    (intake?.membership ? 1 : 0) +
    (Array.isArray(intake?.automationTypes) ? intake.automationTypes.length : 0) +
    (Array.isArray(intake?.integrations) ? intake.integrations.length : 0);

  // Subscores (0-25 each)
  const scopeScore = clamp(Math.round(pagesMax * 2 + featureCount * 2), 4, 25);

  const budgetScore =
    estimateTotal >= 1700 ? 22 :
    estimateTotal >= 900 ? 18 :
    estimateTotal >= 550 ? 14 :
    estimateTotal >= 400 ? 10 : 8;

  const timelineRaw = String(intake?.timeline || "").toLowerCase();
  const timelineScore =
    timelineRaw.includes("rush") || timelineRaw.includes("1 week") ? 22 :
    timelineRaw.includes("1-2") ? 18 :
    timelineRaw.includes("2-3") ? 14 :
    timelineRaw.includes("month") ? 10 : 12;

  const contentReady = String(intake?.contentReady || "").toLowerCase();
  const readinessScore =
    contentReady.includes("not") ? 20 :
    contentReady.includes("some") ? 12 :
    contentReady.includes("ready") ? 8 : 12;

  const total = clamp(scopeScore + budgetScore + timelineScore + readinessScore, 0, 100);

  const risks: string[] = [];
  if (contentReady.includes("not")) risks.push("Content not ready");
  if (timelineRaw.includes("rush") || timelineRaw.includes("1 week")) risks.push("Tight timeline");
  if (intake?.membership) risks.push("Membership scope");
  if (intake?.payments) risks.push("Payments integration");
  if (Array.isArray(intake?.automationTypes) && intake.automationTypes.length >= 2) {
    risks.push("Multiple automations");
  }

  return {
    total,
    scopeScore,
    budgetScore,
    timelineScore,
    readinessScore,
    risks,
  };
}

function buildPieObjects(quote: any, lead: any) {
  const intake = asObj(quote?.intake_normalized);
  const estimateTotal = Number(quote?.estimate_total || 0);
  const estimateLow = Number(quote?.estimate_low || 0);
  const estimateHigh = Number(quote?.estimate_high || 0);
  const tier = mapTier(quote?.tier_recommended, estimateTotal);

  const scores = scoreFromQuote(quote);

  const confidence =
    lead?.email && Object.keys(intake).length > 0 ? "High" :
    Object.keys(intake).length > 0 ? "Medium" :
    "Low";

  const target = estimateTotal || 550;
  const minimum = estimateLow || Math.round(target * 0.9);

  const emphasize: string[] = ["Clear scope", "Fast handoff", "Upgrade flexibility"];
  if (intake?.payments) emphasize.push("Payments setup");
  if (intake?.booking) emphasize.push("Booking flow");
  if (String(intake?.contentReady || "").toLowerCase().includes("ready")) {
    emphasize.push("Faster launch path");
  }

  const objections: string[] = ["Can we start cheaper?", "Can we phase features later?"];
  if (target >= 900) objections.push("Can we split into phases?");
  if (intake?.payments) objections.push("Do we need payments at launch?");

  const summary = `Estimated complexity ${scores.total}/100 with ${tier} scope. ${
    lead?.email ? `Lead: ${lead.email}. ` : ""
  }Quote total ${target}.`;

  const report = {
    tier,
    pitch: {
      emphasize,
      recommend: `Recommend ${tier} scope based on complexity, timeline, and readiness.`,
      objections,
    },
    risks: scores.risks,
    score: scores.total,
    pricing: {
      target,
      minimum,
      buffers: [],
      rangeLow: estimateLow || null,
      rangeHigh: estimateHigh || null,
    },
    summary,
    confidence,
    // extra fields (safe to keep inside JSON)
    subscores: {
      scope: scores.scopeScore,
      budget: scores.budgetScore,
      timeline: scores.timelineScore,
      readiness: scores.readinessScore,
    },
  };

  const payload = {
    quoteId: quote.id,
    leadId: quote.lead_id || null,
    status: quote.status || null,
    tierRecommended: quote.tier_recommended || null,
    estimate: {
      total: estimateTotal,
      low: estimateLow || null,
      high: estimateHigh || null,
    },
    intakeNormalized: intake,
    scopeSnapshot: asObj(quote?.scope_snapshot),
    pricingSnapshot: asObj(quote?.pricing_snapshot),
  };

  const input = {
    quoteId: quote.id,
    lead: {
      id: lead?.id || quote?.lead_id || null,
      email: lead?.email || null,
      phone: lead?.phone || null,
    },
    intakeNormalized: intake,
  };

  return {
    tier,
    score: scores.total,
    confidence,
    report,
    payload,
    input,
  };
}

async function tryFindProjectIdForQuote(quote: any): Promise<string | null> {
  const client = sb();

  // Try common patterns safely (schema may vary)
  const lookupAttempts: Array<{ column: string; value: string | null }> = [
    { column: "quote_id", value: quote?.id || null },
    { column: "source_quote_id", value: quote?.id || null },
    { column: "latest_quote_id", value: quote?.id || null },
    { column: "lead_id", value: quote?.lead_id || null },
  ];

  for (const attempt of lookupAttempts) {
    if (!attempt.value) continue;

    const res = await client
      .from("projects")
      .select("id")
      .eq(attempt.column, attempt.value)
      .limit(1);

    if (!res.error && Array.isArray(res.data) && res.data[0]?.id) {
      return String(res.data[0].id);
    }
    // if column doesn't exist, just continue to next attempt
  }

  return null;
}

async function tryCreateProjectForQuote(quote: any, lead: any): Promise<string> {
  const client = sb();

  const projectName = `CrecyStudio Project ${String(quote?.id || "").slice(0, 8)}`;

  // Try several payload shapes because your projects schema may not match earlier assumptions.
  const payloads: Array<Record<string, any>> = [
    { quote_id: quote.id, lead_id: quote.lead_id || null, status: "new", name: projectName },
    { quote_id: quote.id, lead_id: quote.lead_id || null, status: "new" },
    { quote_id: quote.id, lead_id: quote.lead_id || null },
    { lead_id: quote.lead_id || null, status: "new", name: projectName },
    { lead_id: quote.lead_id || null, status: "new" },
    { lead_id: quote.lead_id || null },
    { name: projectName, status: "new" },
    { name: projectName },
    {},
  ];

  let lastError = "Unable to create project";
  for (const payload of payloads) {
    const res = await client.from("projects").insert(payload).select("id").limit(1);
    if (!res.error && Array.isArray(res.data) && res.data[0]?.id) {
      return String(res.data[0].id);
    }
    if (res.error?.message) lastError = res.error.message;
  }

  // Last attempt: if another process created it meanwhile, re-check lookups.
  const found = await tryFindProjectIdForQuote(quote);
  if (found) return found;

  throw new Error(lastError);
}

async function ensureProjectIdForQuote(quote: any, lead: any): Promise<string> {
  const existing = await tryFindProjectIdForQuote(quote);
  if (existing) return existing;
  return tryCreateProjectForQuote(quote, lead);
}

export async function generatePieForQuoteId(quoteId: string) {
  const client = sb();

  // Load quote
  const quoteRes = await client
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .limit(1);

  if (quoteRes.error) throw new Error(quoteRes.error.message);
  const quote = quoteRes.data?.[0];
  if (!quote) throw new Error("Quote not found.");

  // If quote already has latest PIE, return it (idempotent behavior)
  if (quote.latest_pie_report_id) {
    const existingPieRes = await client
      .from("pie_reports")
      .select("*")
      .eq("id", quote.latest_pie_report_id)
      .limit(1);

    if (!existingPieRes.error && existingPieRes.data?.[0]) {
      return {
        created: false,
        pie: existingPieRes.data[0],
        quote,
      };
    }
  }

  // Load lead (if available)
  let lead: any = null;
  if (quote.lead_id) {
    const leadRes = await client.from("leads").select("*").eq("id", quote.lead_id).limit(1);
    if (!leadRes.error) lead = leadRes.data?.[0] ?? null;
  }

  // Ensure project exists FIRST (fixes your foreign key error)
  const projectId = await ensureProjectIdForQuote(quote, lead);

  const pie = buildPieObjects(quote, lead);
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Insert using your ACTUAL pie_reports schema
  const insertRes = await client
    .from("pie_reports")
    .insert({
      token,
      project_id: projectId,
      quote_id: quote.id,
      expires_at: expiresAt,
      report: pie.report,
      payload: pie.payload,
      input: pie.input,
      score: pie.score,
      tier: pie.tier,
      confidence: pie.confidence,
    })
    .select("*")
    .limit(1);

  if (insertRes.error) throw new Error(insertRes.error.message);

  const pieRow = insertRes.data?.[0];
  if (!pieRow?.id) throw new Error("PIE insert succeeded but no row returned.");

  // Save latest PIE pointer on quote (ignore if column temporarily missing in another env)
  const quoteUpdate = await client
    .from("quotes")
    .update({ latest_pie_report_id: pieRow.id })
    .eq("id", quote.id);

  if (quoteUpdate.error) {
    // non-fatal: PIE is already created; surface warning only in API response via caller if needed
    console.warn("Could not update quotes.latest_pie_report_id:", quoteUpdate.error.message);
  }

  return {
    created: true,
    pie: pieRow,
    quote,
    projectId,
  };
}