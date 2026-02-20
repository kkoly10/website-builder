// lib/pie/ensurePie.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const pieDb = supabaseAdmin;

type AnyObj = Record<string, any>;

type PieNormalizedInput = {
  quoteId: string;
  projectId: string | null;
  createdAt: string | null;
  tier: string | null;
  quoteStatus: string | null;
  totalPrice: number | null;
  lead: {
    email: string | null;
    name: string | null;
    phone: string | null;
    source: string | null;
  };
  callRequest: {
    status: string | null;
    bestTimeToCall: string | null;
    notes: string | null;
  } | null;
  answers: AnyObj;
  pricing: AnyObj;
  freeText: string;
};

type PieAdminReportV2 = {
  version: "pie_v2";
  generated_at: string;
  overview: {
    headline: string;
    tier: string | null;
    quoted_price: number | null;
    fit: "good" | "ok" | "risky";
    summary: string;
  };
  complexity: {
    score_100: number;
    level: "low" | "medium" | "high";
    drivers: string[];
  };
  hours: {
    total_hours: number;
    by_phase: Record<string, number>;
    assumptions: string[];
  };
  timeline: {
    part_time_weeks: string;
    full_time_weeks: string;
    notes: string[];
  };
  pricing_guardrail: {
    hourly_rate_used: number;
    cost_at_hourly: number;
    quoted_price: number | null;
    delta: number | null;
    pricing_position: "under" | "aligned" | "over" | "unknown";
    recommended_range: { min: number; max: number };
    tier_range_check: {
      tier: string | null;
      public_min: number | null;
      public_max: number | null;
      within_public_range: boolean | null;
    };
  };
  platform_recommendation: {
    recommended: "wix" | "squarespace" | "custom";
    why: string[];
    caution: string[];
  };
  questions_to_ask: string[];
  risks: string[];
  build_plan: Array<{ phase: string; goal: string; output: string }>;
  scope_tradeoffs: string[];
  ai_insights?: {
    executive_summary?: string;
    client_psychology?: string;
    hidden_risks?: string[];
    upsell_opportunities?: string[];
    call_strategy?: string[];
  } | null;
  raw_snapshot: {
    feature_flags: Record<string, boolean>;
    page_guess: number;
    content_readiness: "ready" | "partial" | "unknown";
    timeline_signal: string | null;
  };
};

const PUBLIC_TIER_RANGES: Record<string, { min: number; max: number }> = {
  essential: { min: 550, max: 850 },
  growth: { min: 900, max: 1500 },
  premium: { min: 1700, max: 3500 },
};

function asObj(v: any): AnyObj {
  if (!v) return {};
  if (typeof v === "object") return v as AnyObj;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function hasKeyword(text: string, words: string[]) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

function money(n: number | null) {
  if (n === null || Number.isNaN(n)) return null;
  return Math.round(n);
}

async function resolveValidProjectId(projectId: string | null | undefined): Promise<string | null> {
  if (!projectId) return null;
  const { data } = await pieDb.from("projects").select("id").eq("id", projectId).maybeSingle();
  return data?.id ?? null;
}

function normalizeQuotePayload(quote: AnyObj, lead: AnyObj | null, callReq: AnyObj | null): PieNormalizedInput {
  const payload = asObj(quote?.payload);
  const answers =
    asObj(payload.answers) ||
    asObj(payload.form) ||
    asObj(payload.intake) ||
    payload;

  const pricing = asObj(payload.pricing);

  const totalPrice =
    toNum(quote?.total_price) ??
    toNum(quote?.recommended_price) ??
    toNum(pricing.recommended) ??
    toNum(pricing.total) ??
    toNum(pricing.price) ??
    null;

  const tier =
    (quote?.tier as string | null) ??
    (pricing.tier as string | null) ??
    (answers.tier as string | null) ??
    null;

  const freeText = [
    JSON.stringify(answers || {}),
    JSON.stringify(pricing || {}),
    callReq?.notes || "",
    quote?.notes || "",
  ]
    .join(" ")
    .toLowerCase();

  return {
    quoteId: quote.id,
    projectId: quote.project_id ?? null,
    createdAt: quote.created_at ?? null,
    tier,
    quoteStatus: quote.status ?? null,
    totalPrice,
    lead: {
      email: lead?.email ?? null,
      name: lead?.name ?? null,
      phone: lead?.phone ?? null,
      source: lead?.source ?? null,
    },
    callRequest: callReq
      ? {
          status: callReq.status ?? null,
          bestTimeToCall: callReq.best_time_to_call ?? null,
          notes: callReq.notes ?? null,
        }
      : null,
    answers,
    pricing,
    freeText,
  };
}

function deriveFeatureFlags(input: PieNormalizedInput) {
  const txt = input.freeText;
  const answers = input.answers;

  const pagesExplicit =
    toNum(answers.pageCount) ??
    toNum(answers.pages) ??
    toNum(answers.numberOfPages) ??
    null;

  const pageGuess =
    pagesExplicit ??
    (hasKeyword(txt, ["landing page", "one page", "single page"]) ? 1 : 5);

  const flags = {
    ecommerce: hasKeyword(txt, ["ecommerce", "e-commerce", "shop", "cart", "checkout", "product", "store"]),
    booking: hasKeyword(txt, ["booking", "appointment", "calendar", "schedule"]),
    blog: hasKeyword(txt, ["blog", "articles", "posts", "cms"]),
    customForms: hasKeyword(txt, ["form", "lead form", "intake", "multi-step"]),
    payments: hasKeyword(txt, ["payment", "deposit", "stripe", "checkout"]),
    auth: hasKeyword(txt, ["login", "account", "portal", "dashboard", "member"]),
    automations: hasKeyword(txt, ["automation", "email", "crm", "zapier", "n8n"]),
    integrations: hasKeyword(txt, ["integration", "api", "webhook", "calendar", "maps"]),
    seoHeavy: hasKeyword(txt, ["seo", "search ranking", "metadata"]),
    multilingual: hasKeyword(txt, ["multilingual", "translation", "french", "spanish"]),
    copyNeeded: hasKeyword(txt, ["need copy", "help writing", "content help", "content needed"]),
    brandingNeeded: hasKeyword(txt, ["logo", "branding", "brand guide"]),
    urgent: hasKeyword(txt, ["urgent", "asap", "rush", "this week"]),
    customCodeLikely: hasKeyword(txt, ["custom", "next.js", "react", "web app", "portal"]),
  };

  let contentReadiness: "ready" | "partial" | "unknown" = "unknown";
  if (hasKeyword(txt, ["content ready", "have content", "all content ready"])) contentReadiness = "ready";
  else if (hasKeyword(txt, ["some content", "partial content", "need content"])) contentReadiness = "partial";

  let platformPref: "wix" | "squarespace" | "custom" | null = null;
  if (hasKeyword(txt, ["wix"])) platformPref = "wix";
  else if (hasKeyword(txt, ["squarespace"])) platformPref = "squarespace";
  else if (hasKeyword(txt, ["next.js", "custom", "react", "code"])) platformPref = "custom";

  const timelineSignal =
    (input.answers?.timeline as string) ||
    (input.answers?.deadline as string) ||
    (input.answers?.urgency as string) ||
    null;

  return { flags, pageGuess, contentReadiness, platformPref, timelineSignal };
}

function buildDeterministicPie(input: PieNormalizedInput): PieAdminReportV2 {
  const { flags, pageGuess, contentReadiness, platformPref, timelineSignal } = deriveFeatureFlags(input);
  const tier = (input.tier || "").toLowerCase() || null;
  const quotedPrice = input.totalPrice;
  const hourlyRate = 40;

  // Base hours
  let hrsDiscovery = 2.5;
  let hrsPlanning = 2;
  let hrsDesign = 5;
  let hrsBuild = 8;
  let hrsContent = 3;
  let hrsQA = 2;
  let hrsLaunch = 1.5;
  let hrsPM = 2;

  // Pages
  if (pageGuess <= 1) {
    hrsDesign += 1;
    hrsBuild += 2;
  } else {
    hrsDesign += Math.max(0, pageGuess - 1) * 1.2;
    hrsBuild += Math.max(0, pageGuess - 1) * 1.6;
    hrsQA += Math.max(0, pageGuess - 1) * 0.35;
  }

  // Features
  if (flags.blog) { hrsBuild += 3; hrsQA += 1; }
  if (flags.booking) { hrsBuild += 4; hrsQA += 1.5; }
  if (flags.customForms) { hrsBuild += 3; hrsQA += 1; }
  if (flags.payments) { hrsBuild += 4; hrsQA += 1.5; }
  if (flags.integrations) { hrsBuild += 4; hrsQA += 1.5; }
  if (flags.automations) { hrsBuild += 3; hrsQA += 1; }
  if (flags.auth) { hrsBuild += 6; hrsQA += 2; }
  if (flags.ecommerce) { hrsBuild += 10; hrsDesign += 2; hrsQA += 3; }
  if (flags.multilingual) { hrsBuild += 4; hrsQA += 1.5; }
  if (flags.seoHeavy) { hrsPlanning += 1; hrsBuild += 2; }
  if (flags.brandingNeeded) { hrsDesign += 3; }
  if (flags.copyNeeded || contentReadiness !== "ready") { hrsContent += 4; }
  if (flags.urgent) { hrsPM += 1; hrsQA += 0.5; }

  // Tier nudges
  if (tier === "essential") {
    hrsDesign *= 0.9;
    hrsPM *= 0.9;
  } else if (tier === "premium") {
    hrsDesign *= 1.2;
    hrsPM *= 1.2;
    hrsQA *= 1.15;
  }

  // Complexity score
  let complexityScore = 18;
  complexityScore += clamp((pageGuess - 1) * 4, 0, 28);
  complexityScore += flags.ecommerce ? 22 : 0;
  complexityScore += flags.auth ? 12 : 0;
  complexityScore += flags.integrations ? 10 : 0;
  complexityScore += flags.booking ? 8 : 0;
  complexityScore += flags.customForms ? 6 : 0;
  complexityScore += flags.payments ? 8 : 0;
  complexityScore += flags.multilingual ? 8 : 0;
  complexityScore += flags.urgent ? 5 : 0;
  complexityScore += contentReadiness !== "ready" ? 6 : 0;
  complexityScore = clamp(complexityScore, 0, 100);

  const complexityLevel =
    complexityScore < 35 ? "low" :
    complexityScore < 70 ? "medium" : "high";

  const byPhase = {
    discovery: round1(hrsDiscovery),
    planning: round1(hrsPlanning),
    design: round1(hrsDesign),
    build: round1(hrsBuild),
    content: round1(hrsContent),
    qa: round1(hrsQA),
    launch: round1(hrsLaunch),
    project_management: round1(hrsPM),
  };

  const totalHours = round1(Object.values(byPhase).reduce((a, b) => a + b, 0));
  const hourlyCost = money(totalHours * hourlyRate) ?? 0;

  // Your real-world mode: part-time solo (because you work a full-time job) vs focused build mode
  const partTimeWeeksMin = Math.max(1, Math.ceil(totalHours / 20));
  const partTimeWeeksMax = Math.max(partTimeWeeksMin, Math.ceil(totalHours / 12));
  const fullTimeWeeksMin = Math.max(1, Math.ceil(totalHours / 35));
  const fullTimeWeeksMax = Math.max(fullTimeWeeksMin, Math.ceil(totalHours / 25));

  // Public tier check (CrecyStudio pricing system)
  const tierRange = tier ? PUBLIC_TIER_RANGES[tier] : undefined;
  const publicMin = tierRange?.min ?? null;
  const publicMax = tierRange?.max ?? null;
  const withinPublicRange =
    tierRange && quotedPrice !== null ? (quotedPrice >= tierRange.min && quotedPrice <= tierRange.max) : null;

  // Guardrail pricing range
  const recommendedMin = money(hourlyCost * 0.9) ?? 0;
  const recommendedMax = money(hourlyCost * 1.2) ?? 0;

  let pricingPosition: "under" | "aligned" | "over" | "unknown" = "unknown";
  let delta: number | null = null;
  if (quotedPrice !== null) {
    delta = quotedPrice - hourlyCost;
    if (quotedPrice < recommendedMin) pricingPosition = "under";
    else if (quotedPrice > recommendedMax) pricingPosition = "over";
    else pricingPosition = "aligned";
  }

  // Platform recommendation
  let platform: "wix" | "squarespace" | "custom" = "wix";
  const platformWhy: string[] = [];
  const platformCaution: string[] = [];

  if (flags.auth || flags.ecommerce || flags.integrations || flags.customCodeLikely || complexityScore >= 70) {
    platform = "custom";
    platformWhy.push("Custom features / integrations suggest a coded build will be more reliable.");
    platformWhy.push("Higher complexity scope benefits from flexible architecture and cleaner scaling.");
    platformCaution.push("Custom builds need tighter scope control and stronger content readiness.");
  } else if (flags.booking || flags.blog || pageGuess >= 5 || tier === "growth") {
    platform = "squarespace";
    platformWhy.push("Good balance of speed + polish for service-business websites.");
    platformWhy.push("CMS and content updates are manageable for clients.");
    platformCaution.push("Watch feature creep if the client asks for portal/dashboard behavior.");
  } else {
    platform = "wix";
    platformWhy.push("Fast to launch for simple service sites and starter budgets.");
    platformWhy.push("Best fit when scope is mostly pages + forms + basic contact flow.");
    platformCaution.push("Can feel limiting if the scope grows into custom workflows.");
  }

  if (platformPref && platformPref !== platform) {
    platformCaution.push(`Client appears to prefer ${platformPref.toUpperCase()} — align on tradeoffs before scoping.`);
  }

  const drivers = [
    pageGuess > 4 ? `${pageGuess} page scope` : null,
    flags.ecommerce ? "e-commerce / cart flow" : null,
    flags.booking ? "booking / scheduling workflow" : null,
    flags.customForms ? "custom forms / intake logic" : null,
    flags.integrations ? "third-party integrations" : null,
    flags.auth ? "accounts / portal features" : null,
    contentReadiness !== "ready" ? "content not fully ready" : null,
    flags.urgent ? "rush timeline pressure" : null,
  ].filter(Boolean) as string[];

  const questions = buildQuestions(input, { flags, pageGuess, contentReadiness, platform, complexityScore });
  const risks = buildRisks({ flags, pageGuess, contentReadiness, quotedPrice, hourlyCost, pricingPosition });
  const tradeoffs = buildTradeoffs({ flags, pageGuess, platform, pricingPosition });

  const fit: "good" | "ok" | "risky" =
    pricingPosition === "under" && complexityScore >= 60 ? "risky" :
    complexityScore >= 75 ? "ok" :
    "good";

  const summary = [
    `Estimated ${totalHours} hours total (${complexityLevel} complexity).`,
    quotedPrice !== null ? `Quote is ${pricingPosition === "aligned" ? "within" : pricingPosition === "under" ? "below" : "above"} the $40/hr guardrail.` : "No quoted price found.",
    `Best platform fit: ${platform.toUpperCase()}.`,
  ].join(" ");

  return {
    version: "pie_v2",
    generated_at: new Date().toISOString(),
    overview: {
      headline: `PIE v2 • ${complexityLevel.toUpperCase()} complexity • ${totalHours}h estimate`,
      tier: input.tier,
      quoted_price: quotedPrice,
      fit,
      summary,
    },
    complexity: {
      score_100: complexityScore,
      level: complexityLevel,
      drivers: drivers.length ? drivers : ["No major complexity signals detected from intake"],
    },
    hours: {
      total_hours: totalHours,
      by_phase: byPhase,
      assumptions: [
        "Solo builder workflow",
        "Normal revision cycle (not unlimited)",
        contentReadiness === "ready" ? "Content appears mostly ready" : "Some content/copy support likely needed",
        "Includes basic QA + launch handoff",
      ],
    },
    timeline: {
      part_time_weeks: `${partTimeWeeksMin}-${partTimeWeeksMax} weeks`,
      full_time_weeks: `${fullTimeWeeksMin}-${fullTimeWeeksMax} weeks`,
      notes: [
        "Part-time range assumes ~12–20 build hours/week",
        "Full-time range assumes ~25–35 build hours/week",
        timelineSignal ? `Client timeline signal: ${timelineSignal}` : "No clear client deadline found",
      ],
    },
    pricing_guardrail: {
      hourly_rate_used: hourlyRate,
      cost_at_hourly: hourlyCost,
      quoted_price: quotedPrice,
      delta,
      pricing_position: pricingPosition,
      recommended_range: { min: recommendedMin, max: recommendedMax },
      tier_range_check: {
        tier: input.tier,
        public_min: publicMin,
        public_max: publicMax,
        within_public_range: withinPublicRange,
      },
    },
    platform_recommendation: {
      recommended: platform,
      why: platformWhy,
      caution: platformCaution,
    },
    questions_to_ask: questions,
    risks,
    build_plan: [
      { phase: "Discovery", goal: "Lock scope and constraints", output: "Scope snapshot + feature checklist" },
      { phase: "Structure", goal: "Map pages and content", output: "Sitemap + page-by-page content list" },
      { phase: "Build", goal: "Implement design and features", output: "Functional site draft" },
      { phase: "QA & Revisions", goal: "Test and polish", output: "Approved launch candidate" },
      { phase: "Launch", goal: "Go live + handoff", output: "Published site + admin notes" },
    ],
    scope_tradeoffs: tradeoffs,
    ai_insights: null,
    raw_snapshot: {
      feature_flags: flags,
      page_guess: pageGuess,
      content_readiness: contentReadiness,
      timeline_signal: timelineSignal,
    },
  };
}

function buildQuestions(
  input: PieNormalizedInput,
  ctx: {
    flags: Record<string, boolean>;
    pageGuess: number;
    contentReadiness: "ready" | "partial" | "unknown";
    platform: "wix" | "squarespace" | "custom";
    complexityScore: number;
  }
): string[] {
  const q: string[] = [];

  q.push("What is the exact goal of the website (book calls, collect leads, sell products, portfolio, etc.)?");
  q.push(`How many pages do you actually need at launch (PIE guessed ~${ctx.pageGuess})?`);
  q.push("Do you already have final text, images, and logo, or do you need help creating them?");
  q.push("What is your ideal launch date, and is it flexible?");
  q.push("Who will approve revisions and how many revision rounds do you expect?");

  if (ctx.flags.booking) q.push("What booking/calendar system do you want to use, and do you need reminders or deposits?");
  if (ctx.flags.ecommerce) q.push("How many products at launch, and do you need shipping/tax setup?");
  if (ctx.flags.integrations || ctx.flags.automations) q.push("Which tools must connect (CRM, email, calendar, payments, forms, automation)?");
  if (ctx.flags.auth) q.push("What should users be able to do after login (dashboard, uploads, progress tracking, invoices)?");
  if (ctx.complexityScore >= 60) q.push("What features are 'must-have now' vs 'phase 2 later'?");
  if (ctx.contentReadiness !== "ready") q.push("Can we launch with placeholder content for some pages to reduce timeline and cost?");

  q.push(`Are you open to ${ctx.platform.toUpperCase()} if it helps us launch faster within budget?`);

  return Array.from(new Set(q));
}

function buildRisks(ctx: {
  flags: Record<string, boolean>;
  pageGuess: number;
  contentReadiness: "ready" | "partial" | "unknown";
  quotedPrice: number | null;
  hourlyCost: number;
  pricingPosition: "under" | "aligned" | "over" | "unknown";
}) {
  const risks: string[] = [];

  if (ctx.contentReadiness !== "ready") risks.push("Content delays can push timeline and add revision hours.");
  if (ctx.flags.integrations) risks.push("Third-party integrations often create hidden testing/debugging time.");
  if (ctx.flags.ecommerce) risks.push("E-commerce scope can expand fast (products, shipping, tax, policies, QA).");
  if (ctx.flags.auth) risks.push("Portal/account features add complexity beyond a standard marketing website.");
  if (ctx.pageGuess >= 8) risks.push("Large page counts increase QA and content formatting workload.");
  if (ctx.pricingPosition === "under") risks.push("Quote appears under the $40/hr guardrail; margin risk is high unless scope is tightened.");

  if (risks.length === 0) risks.push("No major risks detected from intake, but confirm scope boundaries on the call.");
  return risks;
}

function buildTradeoffs(ctx: {
  flags: Record<string, boolean>;
  pageGuess: number;
  platform: "wix" | "squarespace" | "custom";
  pricingPosition: "under" | "aligned" | "over" | "unknown";
}) {
  const items: string[] = [];

  if (ctx.pricingPosition === "under") {
    items.push("Reduce launch scope to core pages only (phase 2 for secondary pages).");
    items.push("Client provides final copy/images to cut content-prep hours.");
    items.push("Limit revisions to 1–2 rounds with clearly defined scope.");
  }

  if (ctx.flags.integrations) items.push("Defer non-essential integrations to phase 2.");
  if (ctx.flags.ecommerce) items.push("Launch with a smaller product catalog first.");
  if (ctx.flags.auth) items.push("Replace portal features with simpler forms/email workflow for v1.");
  if (ctx.platform === "custom") items.push("Use a template-based front-end and custom features only where needed.");

  if (items.length === 0) items.push("No tradeoffs needed right now; scope appears manageable.");
  return Array.from(new Set(items));
}

async function maybeEnhanceWithAI(input: PieNormalizedInput, deterministic: PieAdminReportV2) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.PIE_AI_MODEL || "gpt-4o-mini";
  const enabled = process.env.PIE_AI_ENABLED === "true";

  if (!enabled || !apiKey) return null;

  const prompt = {
    quote: {
      id: input.quoteId,
      tier: input.tier,
      totalPrice: input.totalPrice,
      status: input.quoteStatus,
      lead: input.lead,
      callRequest: input.callRequest,
      answers: input.answers,
      pricing: input.pricing,
    },
    deterministic_summary: {
      complexity: deterministic.complexity,
      hours: deterministic.hours,
      timeline: deterministic.timeline,
      pricing_guardrail: deterministic.pricing_guardrail,
      platform_recommendation: deterministic.platform_recommendation,
      current_questions: deterministic.questions_to_ask,
      current_risks: deterministic.risks,
    },
    task: "Return JSON only. Improve this internal project estimate report for a solo web builder. Focus on executive summary, hidden risks, client psychology, upsell opportunities, and call strategy. Do NOT change numeric hours or pricing numbers; only add insight.",
    required_json_shape: {
      executive_summary: "string",
      client_psychology: "string",
      hidden_risks: ["string"],
      upsell_opportunities: ["string"],
      call_strategy: ["string"],
    },
  };

  try {
    // Simple JSON-mode call via REST (no SDK dependency)
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are PIE, an internal project estimator assistant for a web agency owner. Be concise, practical, and risk-aware. Return strict JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify(prompt),
          },
        ],
      }),
    });

    if (!res.ok) {
      return { _error: `AI HTTP ${res.status}` };
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") return { _error: "No AI content" };

    const parsed = JSON.parse(content);
    return parsed;
  } catch (e: any) {
    return { _error: e?.message || "AI error" };
  }
}

function mergeAI(report: PieAdminReportV2, ai: any): PieAdminReportV2 {
  if (!ai || ai._error) return report;

  return {
    ...report,
    ai_insights: {
      executive_summary: typeof ai.executive_summary === "string" ? ai.executive_summary : undefined,
      client_psychology: typeof ai.client_psychology === "string" ? ai.client_psychology : undefined,
      hidden_risks: Array.isArray(ai.hidden_risks) ? ai.hidden_risks : undefined,
      upsell_opportunities: Array.isArray(ai.upsell_opportunities) ? ai.upsell_opportunities : undefined,
      call_strategy: Array.isArray(ai.call_strategy) ? ai.call_strategy : undefined,
    },
  };
}

export async function generatePieForQuoteId(quoteId: string, opts?: { force?: boolean }) {
  const force = !!opts?.force;

  if (!force) {
    const { data: existing } = await pieDb
      .from("pie_reports")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing;
  }

  const { data: quote, error: quoteErr } = await pieDb
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quote) {
    throw new Error(`Quote not found: ${quoteErr?.message || quoteId}`);
  }

  const leadPromise = quote.lead_id
    ? pieDb.from("leads").select("*").eq("id", quote.lead_id).maybeSingle()
    : Promise.resolve({ data: null, error: null } as any);

  const callPromise = pieDb
    .from("call_requests")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: lead }, { data: callReq }] = await Promise.all([leadPromise, callPromise]);

  const normalized = normalizeQuotePayload(quote, lead, callReq);
  const deterministic = buildDeterministicPie(normalized);
  const ai = await maybeEnhanceWithAI(normalized, deterministic);
  const report = mergeAI(deterministic, ai);

  const validProjectId = await resolveValidProjectId(quote.project_id);

  const insertRow = {
    quote_id: quote.id,
    project_id: validProjectId, // prevents bad FK values
    summary: report.overview.headline,
    input: normalized,
    report,
    payload: {
      ai_enabled: process.env.PIE_AI_ENABLED === "true",
      ai_result: ai,
      generated_by: "pie_v2",
    },
  };

  const { data: inserted, error: insertErr } = await pieDb
    .from("pie_reports")
    .insert(insertRow)
    .select("*")
    .single();

  if (insertErr) throw new Error(insertErr.message);

  return inserted;
}

// Backward-compat exports so old imports don't break
export const ensurePieForQuoteId = generatePieForQuoteId;