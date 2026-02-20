// lib/pie/ensurePie.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

export const pieDb = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

function asObj(v: any): Record<string, any> {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildDeterministicPie(quote: any) {
  const intake = asObj(quote.intake_normalized);
  const raw = asObj(quote.intake_raw);

  const websiteType = String(intake.websiteType || "business");
  const pages = String(intake.pages || "1-3");
  const tier = String(quote.tier_recommended || "essential");
  const total = num(quote.estimate_total, 0);
  const low = num(quote.estimate_low, Math.round(total * 0.9));
  const high = num(quote.estimate_high, Math.round(total * 1.15));

  // Lead score (0-100) simple deterministic
  let score = 40;

  // Budget/complexity signal
  if (total >= 1700) score += 18;
  else if (total >= 900) score += 12;
  else if (total >= 550) score += 8;
  else score += 4;

  // Content readiness
  const contentReady = String(intake.contentReady || "").toLowerCase();
  if (contentReady === "ready") score += 14;
  else if (contentReady === "some") score += 6;
  else if (contentReady === "not_ready") score -= 8;

  // Decision maker
  const dm = String(raw.decisionMaker || "").toLowerCase();
  if (dm === "yes") score += 12;
  else if (dm === "no") score -= 8;

  // Timeline urgency
  const timeline = String(intake.timeline || "").toLowerCase();
  if (timeline.includes("1-2") || timeline.includes("urgent")) score += 8;
  if (timeline.includes("2-3")) score += 6;

  // Features
  if (intake.payments) score += 8;
  if (intake.membership) score += 10;
  if (intake.booking) score += 5;
  if (intake.wantsAutomation === "yes") score += 5;

  // Contact completeness
  if (String(intake.leadEmail || "").includes("@")) score += 6;
  if (String(intake.leadPhone || "").trim()) score += 4;

  score = Math.max(0, Math.min(100, score));

  const risks: string[] = [];
  const strengths: string[] = [];
  const nextSteps: string[] = [];

  if (contentReady === "not_ready") risks.push("Content is not ready yet (can slow delivery and increase revisions).");
  if (contentReady === "some") risks.push("Partial content readiness may require content cleanup/formatting.");
  if (String(intake.domainHosting || "").toLowerCase() !== "yes") risks.push("Domain/hosting setup still needs support or coordination.");
  if (!String(intake.leadPhone || "").trim()) risks.push("No phone number provided (slower scheduling unless email replies quickly).");

  strengths.push(`${tier} fit based on current scope and pricing.`);
  strengths.push(`Estimated project range is $${low}–$${high} (current estimate: $${total}).`);
  strengths.push(`Website type: ${websiteType}; page scope: ${pages}.`);

  if (String(raw.decisionMaker || "").toLowerCase() === "yes") {
    strengths.push("Decision-maker confirmed.");
  }

  if (intake.booking) strengths.push("Booking feature adds clear business utility.");
  if (intake.payments) strengths.push("Payments/checkout indicates higher commercial intent.");
  if (intake.wantsAutomation === "yes") strengths.push("Automation interest suggests good upsell potential.");

  nextSteps.push("Confirm pages/sections and exact deliverables on scope call.");
  nextSteps.push("Confirm content/assets readiness and identify missing items.");
  nextSteps.push("After scope confirmation, send deposit link and lock scope.");
  nextSteps.push("Move project to production queue after deposit is received.");

  const negotiation: string[] = [];
  if (total <= 550) {
    negotiation.push("If price pressure: reduce pages or defer add-ons while preserving launch quality.");
    negotiation.push("Use admin-only discount only if needed (10–25%) after scope is confirmed.");
  } else {
    negotiation.push("Keep public tier pricing; offer scope trade-offs before discount.");
    negotiation.push("Anchor on business outcome + clean build + post-launch clarity.");
  }

  const pitch = `This lead looks like a ${tier} opportunity with a current estimate of $${total}. Focus the call on confirming scope, content readiness, and timeline. If budget concerns come up, use scope trade-offs first, then admin-only discount if needed.`;

  const report = {
    version: "pie_v1_deterministic",
    generatedAt: new Date().toISOString(),
    summary: {
      score,
      tierRecommended: tier,
      confidence: score >= 75 ? "high" : score >= 55 ? "medium" : "low",
      quoteEstimate: { total, low, high },
      status: quote.status || "new",
    },
    lead: {
      email: quote.lead_email || intake.leadEmail || "",
      phone: intake.leadPhone || "",
      websiteType,
      pages,
      timeline: intake.timeline || "",
      intent: intake.intent || "",
    },
    strengths,
    risks,
    nextSteps,
    negotiation,
    pitch,
    rawSignals: {
      intakeNormalized: intake,
      intakeRaw: raw,
    },
  };

  return {
    score,
    tier,
    confidence: report.summary.confidence,
    report,
  };
}

export async function ensurePieForQuoteId(quoteId: string) {
  // Load quote
  const { data: quote, error: quoteErr } = await pieDb
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quote) {
    throw new Error(quoteErr?.message || "Quote not found.");
  }

  // If already linked, fetch and return it
  if (quote.latest_pie_report_id) {
    const { data: existing } = await pieDb
      .from("pie_reports")
      .select("*")
      .eq("id", quote.latest_pie_report_id)
      .single();

    if (existing) return { created: false, pie: existing };
  }

  // Build deterministic PIE
  const built = buildDeterministicPie(quote);

  const pieId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const projectId = crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const insertPayload = {
    id: pieId,
    quote_id: quote.id,                  // IMPORTANT: link back to quote
    token,                               // keeps compatibility with your existing table shape
    project_id: projectId,               // placeholder internal project id
    expires_at: expiresAt.toISOString(),
    score: built.score,
    tier: built.tier,
    confidence: built.confidence,
    report: built.report,                // main PIE JSON
    payload: { source: "deterministic_backfill_v1" }, // compatibility JSON
    input: {
      quote_id: quote.id,
      estimate_total: quote.estimate_total,
      estimate_low: quote.estimate_low,
      estimate_high: quote.estimate_high,
      tier_recommended: quote.tier_recommended,
    },
  };

  const { data: pie, error: pieErr } = await pieDb
    .from("pie_reports")
    .insert(insertPayload)
    .select("*")
    .single();

  if (pieErr) {
    throw new Error(pieErr.message || "Failed to insert PIE report.");
  }

  const { error: linkErr } = await pieDb
    .from("quotes")
    .update({ latest_pie_report_id: pie.id })
    .eq("id", quote.id);

  if (linkErr) {
    throw new Error(linkErr.message || "PIE inserted but failed to link to quote.");
  }

  return { created: true, pie };
}
