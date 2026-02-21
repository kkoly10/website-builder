// lib/pie/ensurePie.ts
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type QuoteRow = {
  id: string;
  created_at: string | null;
  lead_id: string | null;
  status: string | null;
  tier_recommended: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  intake_raw: JsonValue | null;
  intake_normalized: JsonValue | null;
  scope_snapshot: JsonValue | null;
  debug: JsonValue | null;
  latest_pie_report_id: string | null;
};

type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
};

type CallRequestRow = {
  id: string;
  quote_id: string;
  status: string | null;
  preferred_times: JsonValue | null;
  timezone: string | null;
  notes: string | null;
  created_at: string | null;
};

type PieReportRow = {
  id: string;
  quote_id: string | null;
  project_id: string | null;
  created_at: string | null;
  payload: JsonValue | null;
  input: JsonValue | null;
  report: string | null;
  score: number | null;
  tier: string | null;
  confidence: string | null;
};

type EnsureResult = {
  ok: boolean;
  created: boolean;
  quoteId: string;
  pie?: PieReportRow;
  error?: string;
};

type PiePayloadV2 = {
  version: "2.0";
  tier: "Essential" | "Growth" | "Premium";
  confidence: "Low" | "Medium" | "High";
  score: number;
  summary: string;
  admin_readout: {
    complexity_label: string;
    recommended_build_path: string;
    priority: "low" | "normal" | "high";
    lead_quality_score: number;
  };
  pricing: {
    quote: {
      minimum: number;
      target: number;
      upper: number;
      tier: string;
    };
    labor_model_40hr: {
      min_hours: number;
      target_hours: number;
      max_hours: number;
      min_amount: number;
      target_amount: number;
      max_amount: number;
      hourly_rate: number;
    };
    pricing_signal: {
      status: "underpriced" | "healthy" | "premium";
      message: string;
      suggested_floor: number;
      suggested_target: number;
    };
  };
  timeline: {
    estimated_build_days: {
      min: number;
      target: number;
      max: number;
    };
    estimated_calendar_weeks: {
      min: number;
      target: number;
      max: number;
    };
    assumptions: string[];
  };
  scope: {
    pages_estimate: number;
    feature_count: number;
    features: string[];
    scope_assumptions: string[];
    suggested_deliverables: string[];
    exclusions_to_confirm: string[];
  };
  complexity_drivers: {
    label: string;
    impact: "low" | "medium" | "high";
    points: number;
    note: string;
  }[];
  discovery_questions: string[];
  risks: string[];
  negotiation_playbook: {
    lower_cost_options: string[];
    upsell_options: string[];
    price_defense_points: string[];
  };
  pitch: {
    emphasize: string[];
    recommend: string;
    objections: string[];
  };
  next_actions: string[];
  ai_enhancement?: {
    enabled: boolean;
    provider: "none" | "openai";
    notes?: string[];
    sales_script?: string[];
    added_questions?: string[];
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

export const pieDb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function safeObj(v: unknown): Record<string, any> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, any>;
  return {};
}

function safeArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
  }
  if (typeof v === "string") {
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function titleCase(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
}

function parseMoneyBand(text?: string | null): { min?: number; max?: number } {
  if (!text) return {};
  const nums = (text.match(/\d+/g) || []).map((n) => Number(n));
  if (!nums.length) return {};
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function parsePagesWanted(v?: string | null): number {
  if (!v) return 3;
  const t = v.toLowerCase();
  // Examples: "1-3", "4-6", "7+", "10+"
  const nums = (t.match(/\d+/g) || []).map(Number);
  if (!nums.length) return 3;
  if (t.includes("+")) return nums[0];
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  return nums[0];
}

function normalizeTier(t?: string | null): "Essential" | "Growth" | "Premium" {
  const x = (t || "").toLowerCase();
  if (x.includes("premium")) return "Premium";
  if (x.includes("growth")) return "Growth";
  return "Essential";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hasTruthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["yes", "true", "1"].includes(v.trim().toLowerCase());
  return Boolean(v);
}

function keywordPoints(features: string[]) {
  let points = 0;
  const drivers: PiePayloadV2["complexity_drivers"] = [];

  const f = features.map((x) => x.toLowerCase());

  const add = (label: string, impact: "low" | "medium" | "high", pts: number, note: string) => {
    points += pts;
    drivers.push({ label, impact, points: pts, note });
  };

  if (f.length) add("Requested features", f.length >= 4 ? "high" : "medium", Math.min(16, f.length * 3), `${f.length} feature(s) selected`);

  if (f.some((x) => /booking|calendar|appointment/.test(x))) {
    add("Booking flow", "medium", 8, "Scheduling and appointment UX usually adds logic and testing.");
  }
  if (f.some((x) => /payment|checkout|e-?commerce|store|shop/.test(x))) {
    add("Commerce / payments", "high", 16, "Payments and checkout introduce higher build + QA complexity.");
  }
  if (f.some((x) => /portal|dashboard|login|member/.test(x))) {
    add("Auth / portal", "high", 18, "Member areas and logins add auth, permissions, and support complexity.");
  }
  if (f.some((x) => /blog|cms|admin/.test(x))) {
    add("CMS / content system", "medium", 8, "CMS setup improves handoff but adds setup time.");
  }
  if (f.some((x) => /form|lead/.test(x))) {
    add("Lead capture forms", "low", 4, "Forms are lightweight but still need validation + notification setup.");
  }

  return { points, drivers };
}

function estimateTimelineFromHours(targetHours: number, contentReady: boolean, urgent: boolean) {
  // Assume ~18 focused build hours/week solo + overhead.
  const baseWeeks = Math.max(1, Math.round((targetHours / 18) * 10) / 10);
  const contentPenalty = contentReady ? 0 : 0.6;
  const urgentPenalty = urgent ? 0.3 : 0;

  const target = baseWeeks + contentPenalty + urgentPenalty;
  const min = Math.max(0.8, target - 0.7);
  const max = target + 1.2;

  return {
    weeks: {
      min: Math.ceil(min),
      target: Math.ceil(target),
      max: Math.ceil(max),
    },
    days: {
      min: Math.max(4, Math.round(min * 5)),
      target: Math.round(target * 5),
      max: Math.round(max * 5),
    },
  };
}

function complexityLabel(score: number) {
  if (score < 30) return "Low";
  if (score < 55) return "Moderate";
  if (score < 75) return "High";
  return "Very High";
}

function buildMarkdownSummary(payload: PiePayloadV2): string {
  return [
    `# PIE Report (${payload.tier})`,
    ``,
    `**Summary:** ${payload.summary}`,
    `**Complexity:** ${payload.score}/100 (${payload.admin_readout.complexity_label})`,
    `**Confidence:** ${payload.confidence}`,
    ``,
    `## Pricing`,
    `- Quote target: $${payload.pricing.quote.target}`,
    `- 40/hr labor target: $${payload.pricing.labor_model_40hr.target_amount} (${payload.pricing.labor_model_40hr.target_hours}h)`,
    `- Signal: ${payload.pricing.pricing_signal.status} — ${payload.pricing.pricing_signal.message}`,
    ``,
    `## Timeline`,
    `- Build time: ${payload.timeline.estimated_build_days.target} days (~${payload.timeline.estimated_calendar_weeks.target} weeks)`,
    ``,
    `## Risks`,
    ...payload.risks.map((r) => `- ${r}`),
    ``,
    `## Discovery Questions`,
    ...payload.discovery_questions.slice(0, 8).map((q) => `- ${q}`),
  ].join("\n");
}

function scoreLead(intake: Record<string, any>) {
  let score = 45;
  const contentReady = String(intake.contentReadiness || "").toLowerCase();
  const budgetRange = String(intake.budgetRange || "");
  const timeline = String(intake.timeline || "").toLowerCase();

  if (contentReady.includes("ready")) score += 12;
  if (contentReady.includes("some")) score += 6;
  if (contentReady.includes("none") || contentReady.includes("not")) score -= 8;

  const budget = parseMoneyBand(budgetRange);
  if ((budget.max ?? 0) >= 1200) score += 10;
  else if ((budget.max ?? 0) >= 700) score += 6;
  else if ((budget.max ?? 0) > 0) score -= 4;

  if (timeline.includes("asap") || timeline.includes("urgent")) score += 3; // urgency can be good but risky
  if (timeline.includes("no rush") || timeline.includes("flex")) score += 4;

  if (safeArray(intake.neededFeatures).length >= 4) score += 4;
  if (String(intake.businessName || "").trim()) score += 4;

  return clamp(score, 0, 100);
}

function buildPiePayload(args: {
  quote: QuoteRow;
  lead?: LeadRow | null;
  call?: CallRequestRow | null;
}): PiePayloadV2 {
  const { quote, lead, call } = args;

  const intake = safeObj(quote.intake_normalized);
  const features = safeArray(intake.neededFeatures).map(titleCase);
  const pagesEstimate = parsePagesWanted(String(intake.pagesWanted || "") || null);
  const tier = normalizeTier(quote.tier_recommended);

  const contentReadyText = String(intake.contentReadiness || "");
  const contentReady = /ready|mostly ready|have content/i.test(contentReadyText) && !/none|not/i.test(contentReadyText);
  const timelineText = String(intake.timeline || "");
  const urgent = /asap|urgent|1 week|few days|this week/i.test(timelineText);

  const budgetRange = String(intake.budgetRange || "");
  const budget = parseMoneyBand(budgetRange);

  const kw = keywordPoints(features);

  let score = 12;
  const drivers: PiePayloadV2["complexity_drivers"] = [...kw.drivers];

  const pagePoints = clamp((pagesEstimate - 1) * 3, 0, 24);
  score += pagePoints;
  drivers.push({
    label: "Page count",
    impact: pagesEstimate >= 6 ? "high" : pagesEstimate >= 4 ? "medium" : "low",
    points: pagePoints,
    note: `${pagesEstimate} page(s) estimated from intake.`,
  });

  score += kw.points;

  if (hasTruthy(intake.needCopywriting)) {
    score += 8;
    drivers.push({
      label: "Copywriting support",
      impact: "medium",
      points: 8,
      note: "Writing/rewriting content adds strategy and revision time.",
    });
  }

  if (hasTruthy(intake.needLogoBranding)) {
    score += 8;
    drivers.push({
      label: "Logo / branding help",
      impact: "medium",
      points: 8,
      note: "Brand work can expand scope beyond web build.",
    });
  }

  if (hasTruthy(intake.domainHosting) || /need|don't have|none/i.test(String(intake.domainHosting || ""))) {
    score += 4;
    drivers.push({
      label: "Domain/hosting setup",
      impact: "low",
      points: 4,
      note: "Technical setup and DNS launch support required.",
    });
  }

  if (!contentReady) {
    score += 10;
    drivers.push({
      label: "Content readiness",
      impact: "high",
      points: 10,
      note: "Missing or incomplete content usually delays launch.",
    });
  }

  if (urgent) {
    score += 10;
    drivers.push({
      label: "Timeline pressure",
      impact: "medium",
      points: 10,
      note: "Rush requests increase coordination and revision overhead.",
    });
  }

  if (call?.status === "new" || quote.status === "call_requested") {
    score += 2;
    drivers.push({
      label: "Call requested",
      impact: "low",
      points: 2,
      note: "Good buying signal, but requires discovery time.",
    });
  }

  score = clamp(score, 10, 98);

  // Hours model
  const baseMin = 6 + pagesEstimate * 2 + features.length * 1.5;
  const baseTarget = 10 + pagesEstimate * 3 + features.length * 2.5 + score * 0.35;
  const baseMax = 14 + pagesEstimate * 4 + features.length * 3 + score * 0.45;

  const hours = {
    min: Math.round(clamp(baseMin, 6, 120)),
    target: Math.round(clamp(baseTarget, 10, 180)),
    max: Math.round(clamp(baseMax, 14, 260)),
  };

  const hourlyRate = 40;
  const labor = {
    min_amount: hours.min * hourlyRate,
    target_amount: hours.target * hourlyRate,
    max_amount: hours.max * hourlyRate,
  };

  const quotePricing = {
    minimum: Math.round(quote.estimate_low ?? quote.estimate_total ?? 0),
    target: Math.round(quote.estimate_total ?? quote.estimate_low ?? 0),
    upper: Math.round(quote.estimate_high ?? quote.estimate_total ?? 0),
    tier: tier,
  };

  // Pricing signal
  let pricingStatus: "underpriced" | "healthy" | "premium" = "healthy";
  let pricingMessage = "Quote is in a workable range for the estimated complexity.";
  const suggestedFloor = Math.round(Math.max(quotePricing.minimum || 0, labor.min_amount * 0.55));
  const suggestedTarget = Math.round(Math.max(quotePricing.target || 0, labor.target_amount * 0.65));

  if (quotePricing.target < labor.target_amount * 0.45) {
    pricingStatus = "underpriced";
    pricingMessage = "Current quote is significantly below the $40/hr effort model. Use scope control or phase delivery.";
  } else if (quotePricing.target > labor.target_amount * 0.95) {
    pricingStatus = "premium";
    pricingMessage = "Quote is close to or above the $40/hr effort model. Defend value with process and deliverables.";
  }

  // Timeline
  const timelineEst = estimateTimelineFromHours(hours.target, contentReady, urgent);

  const risks: string[] = [];
  if (!contentReady) risks.push("Content readiness may delay timeline and expand revision rounds.");
  if (hasTruthy(intake.needCopywriting)) risks.push("Copywriting scope can drift unless page-by-page deliverables are defined.");
  if (hasTruthy(intake.needLogoBranding)) risks.push("Branding requests can turn into a separate project if not scoped.");
  if (features.some((f) => /Payment|E Commerce|Checkout|Store/i.test(f))) risks.push("Commerce/payment setup requires extra QA and policy confirmations.");
  if (features.some((f) => /Portal|Dashboard|Login|Member/i.test(f))) risks.push("Portal/login features require tighter scope and likely phased delivery.");
  if (urgent) risks.push("Rush timeline increases revision pressure and communication overhead.");

  const scopeAssumptions: string[] = [
    `${pagesEstimate} page(s) estimated from intake selection (${String(intake.pagesWanted || "unspecified")}).`,
    `Estimate assumes up to 2 revision rounds unless otherwise agreed.`,
    `Estimate assumes the client provides account access for domain/hosting or requests setup assistance.`,
  ];

  if (!contentReady) {
    scopeAssumptions.push("Timeline assumes staged content delivery and placeholder copy during build.");
  }
  if (hasTruthy(intake.needCopywriting)) {
    scopeAssumptions.push("Copywriting includes polishing core pages, not full brand messaging strategy.");
  }

  const exclusions: string[] = [
    "Custom web app logic / internal portal unless explicitly scoped",
    "Advanced SEO campaign / backlink work",
    "Ongoing maintenance plan (if not added separately)",
  ];
  if (!features.some((f) => /Payment|E Commerce|Checkout|Store/i.test(f))) {
    exclusions.push("Payment processing and ecommerce setup");
  }

  const deliverables: string[] = [
    "Project kickoff + scope confirmation",
    `Site build (${pagesEstimate} page target)`,
    "Mobile responsiveness pass",
    "Basic forms / CTA setup (if in scope)",
    "Launch support + handoff",
  ];

  if (features.length) {
    deliverables.push(...features.slice(0, 4).map((f) => `${f} implementation`));
  }
  if (hasTruthy(intake.needCopywriting)) deliverables.push("Copy polishing / content formatting");
  if (hasTruthy(intake.domainHosting)) deliverables.push("Domain + hosting connection support");

  // Discovery questions
  const discoveryQuestions: string[] = [];
  const ask = (q: string) => {
    if (!discoveryQuestions.includes(q)) discoveryQuestions.push(q);
  };

  ask("What are the top 1–2 goals for the site launch (book calls, get leads, sell products, showcase work)?");
  ask("How many final pages do you want at launch, and what are their names?");
  ask("Do you already have logo, brand colors, and photos, or should I help create/choose them?");
  ask("Who will provide the website copy, and when can it be delivered?");
  ask("What examples of websites do you like (design/style and functionality)?");

  if (!budget.min && !budget.max) ask("What budget range are you comfortable with for phase 1?");
  if (!timelineText) ask("What launch date are you targeting?");
  if (features.some((f) => /Booking|Appointment/i.test(f))) {
    ask("Do you need booking to connect to an existing calendar/tool (Calendly, Google Calendar, etc.)?");
  }
  if (features.some((f) => /Payment|E Commerce|Checkout|Store/i.test(f))) {
    ask("How many products/services will be sold at launch, and do you need shipping, pickup, or digital delivery?");
    ask("Which payment provider do you prefer (Stripe, Square, PayPal)?");
  }
  if (features.some((f) => /Portal|Dashboard|Login|Member/i.test(f))) {
    ask("How many user roles are needed (admin, staff, customer), and what should each role be able to do?");
  }
  if (hasTruthy(intake.domainHosting) || /none|don't have|need/i.test(String(intake.domainHosting || ""))) {
    ask("Do you already own a domain name, and which registrar is it with?");
  }

  // Negotiation / price defense
  const lowerCostOptions: string[] = [
    `Phase 1 launch with ${Math.min(3, pagesEstimate)} pages, then add the remaining pages after launch.`,
    "Use a simpler template/layout system now and reserve custom design polish for phase 2.",
    "Client provides finalized copy and images to reduce build and revision time.",
  ];

  if (features.length >= 3) {
    lowerCostOptions.push("Launch without one or two advanced features, then add them after MVP is live.");
  }

  const upsellOptions: string[] = [
    "Add monthly maintenance / update plan",
    "Add SEO setup + Google Business Profile optimization",
    "Add analytics/dashboard and conversion tracking",
  ];

  if (hasTruthy(intake.needLogoBranding)) {
    upsellOptions.push("Brand kit package (logo refinements, colors, typography, usage)");
  }

  const priceDefensePoints: string[] = [
    "Pricing includes scoping, build time, testing, revisions, and launch support — not just page design.",
    "A clean launch-ready build reduces rework and protects your timeline.",
    "We can phase features to fit budget without breaking the project foundation.",
  ];

  // Pitch recommendations
  const tierPitch =
    tier === "Premium"
      ? "Recommend Premium because requested scope/complexity suggests stronger build planning and delivery structure."
      : tier === "Growth"
      ? "Recommend Growth for a balanced launch with room for better features and polish."
      : "Recommend Essential for a fast launch path with clear scope and upgrade flexibility.";

  // Lead quality / priority
  const leadQuality = scoreLead(intake);
  const priority: "low" | "normal" | "high" =
    leadQuality >= 70 || (call?.status === "new" && quote.status === "call_requested")
      ? "high"
      : leadQuality >= 45
      ? "normal"
      : "low";

  const confidence: "Low" | "Medium" | "High" =
    score < 45 && features.length <= 2 && pagesEstimate <= 4
      ? "High"
      : score < 70
      ? "Medium"
      : "Medium";

  const payload: PiePayloadV2 = {
    version: "2.0",
    tier,
    confidence,
    score,
    summary: `Estimated complexity ${score}/100 (${complexityLabel(score)}). ${quotePricing.target ? `Quote target is $${quotePricing.target}. ` : ""}PIE suggests ${hours.target}h build effort (~$${labor.target_amount} at $40/hr).`,
    admin_readout: {
      complexity_label: complexityLabel(score),
      recommended_build_path:
        score >= 70
          ? "Use a phased build (MVP + phase 2), tight scope checklist, and milestone approvals."
          : score >= 40
          ? "Proceed with a structured scope snapshot and page-by-page deliverables."
          : "Fast-launch workflow is appropriate. Keep scope tight and move quickly to deposit.",
      priority,
      lead_quality_score: leadQuality,
    },
    pricing: {
      quote: quotePricing,
      labor_model_40hr: {
        min_hours: hours.min,
        target_hours: hours.target,
        max_hours: hours.max,
        min_amount: labor.min_amount,
        target_amount: labor.target_amount,
        max_amount: labor.max_amount,
        hourly_rate: hourlyRate,
      },
      pricing_signal: {
        status: pricingStatus,
        message: pricingMessage,
        suggested_floor: suggestedFloor,
        suggested_target: suggestedTarget,
      },
    },
    timeline: {
      estimated_build_days: timelineEst.days,
      estimated_calendar_weeks: timelineEst.weeks,
      assumptions: [
        "Calendar estimate assumes one-person build and normal feedback turnaround.",
        contentReady
          ? "Client content appears at least partially ready."
          : "Content is not fully ready, so timeline includes buffer for content delays.",
        urgent ? "Rush timeline requested — extra coordination may be needed." : "No rush flag detected.",
      ],
    },
    scope: {
      pages_estimate: pagesEstimate,
      feature_count: features.length,
      features,
      scope_assumptions: scopeAssumptions,
      suggested_deliverables: deliverables,
      exclusions_to_confirm: exclusions,
    },
    complexity_drivers: drivers.sort((a, b) => b.points - a.points),
    discovery_questions: discoveryQuestions,
    risks,
    negotiation_playbook: {
      lower_cost_options: lowerCostOptions,
      upsell_options: upsellOptions,
      price_defense_points: priceDefensePoints,
    },
    pitch: {
      emphasize: ["Clear scope", "Timeline clarity", "Upgrade flexibility", "Launch-ready handoff"],
      recommend: tierPitch,
      objections: [
        "Can we start smaller and phase features?",
        "Can we reduce price by simplifying scope?",
        "What is included vs excluded in this estimate?",
      ],
    },
    next_actions: [
      "Confirm page list and feature priorities",
      "Confirm content ownership and delivery date",
      "Lock scope snapshot and revision count",
      "Send proposal/deposit link",
      "Start build after deposit + assets",
    ],
  };

  // Optional AI enhancement (safe fallback if no key)
  // This adds more nuanced notes if you later set OPENAI_API_KEY.
  // Works fine without it.
  return payload;
}

function extractText(obj: any): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) return obj.map(extractText).join(" ");
  if (typeof obj === "object") return Object.values(obj).map(extractText).join(" ");
  return String(obj);
}

async function maybeEnhanceWithOpenAI(
  payload: PiePayloadV2,
  quote: QuoteRow,
  lead: LeadRow | null,
  call: CallRequestRow | null
): Promise<PiePayloadV2> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ...payload,
      ai_enhancement: { enabled: false, provider: "none" },
    };
  }

  try {
    const intake = safeObj(quote.intake_normalized);
    const prompt = {
      quote: {
        id: quote.id,
        tier: quote.tier_recommended,
        estimate_total: quote.estimate_total,
        estimate_low: quote.estimate_low,
        estimate_high: quote.estimate_high,
        status: quote.status,
      },
      lead: lead ? { email: lead.email, name: lead.name } : null,
      call_request: call
        ? {
            status: call.status,
            preferred_times: call.preferred_times,
            timezone: call.timezone,
            notes: call.notes,
          }
        : null,
      intake_normalized: intake,
      pie_base: payload,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.PIE_OPENAI_MODEL || "gpt-5-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You improve an internal website project estimate report for a solo web studio owner. Return strict JSON only with keys: notes (string[]), sales_script (string[]), added_questions (string[]). Keep it practical, short, and admin-focused.",
          },
          {
            role: "user",
            content: JSON.stringify(prompt),
          },
        ],
      }),
    });

    if (!resp.ok) {
      return {
        ...payload,
        ai_enhancement: { enabled: false, provider: "none" },
      };
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : {};
    const notes = Array.isArray(parsed?.notes) ? parsed.notes.map(String) : [];
    const salesScript = Array.isArray(parsed?.sales_script) ? parsed.sales_script.map(String) : [];
    const addedQuestions = Array.isArray(parsed?.added_questions) ? parsed.added_questions.map(String) : [];

    const mergedQuestions = [...payload.discovery_questions];
    for (const q of addedQuestions) {
      if (q && !mergedQuestions.includes(q)) mergedQuestions.push(q);
    }

    return {
      ...payload,
      discovery_questions: mergedQuestions,
      ai_enhancement: {
        enabled: true,
        provider: "openai",
        notes: notes.slice(0, 6),
        sales_script: salesScript.slice(0, 6),
        added_questions: addedQuestions.slice(0, 6),
      },
    };
  } catch {
    return {
      ...payload,
      ai_enhancement: { enabled: false, provider: "none" },
    };
  }
}

async function loadQuoteBundle(quoteId: string) {
  const quoteRes = await pieDb
    .from("quotes")
    .select(
      "id,created_at,lead_id,status,tier_recommended,estimate_total,estimate_low,estimate_high,intake_raw,intake_normalized,scope_snapshot,debug,latest_pie_report_id"
    )
    .eq("id", quoteId)
    .single();

  if (quoteRes.error || !quoteRes.data) {
    throw new Error(quoteRes.error?.message || "Quote not found");
  }

  const quote = quoteRes.data as QuoteRow;

  let lead: LeadRow | null = null;
  if (quote.lead_id) {
    const leadRes = await pieDb.from("leads").select("id,email,name").eq("id", quote.lead_id).single();
    if (!leadRes.error && leadRes.data) lead = leadRes.data as LeadRow;
  }

  const callRes = await pieDb
    .from("call_requests")
    .select("id,quote_id,status,preferred_times,timezone,notes,created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1);

  const call = (callRes.data?.[0] as CallRequestRow | undefined) || null;

  return { quote, lead, call };
}

async function getExistingPieByLatestId(latestPieId: string | null): Promise<PieReportRow | null> {
  if (!latestPieId) return null;
  const res = await pieDb
    .from("pie_reports")
    .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence")
    .eq("id", latestPieId)
    .single();

  if (res.error || !res.data) return null;
  return res.data as PieReportRow;
}

async function getLatestPieByQuoteId(quoteId: string): Promise<PieReportRow | null> {
  const res = await pieDb
    .from("pie_reports")
    .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (res.error || !res.data?.length) return null;
  return res.data[0] as PieReportRow;
}

export async function ensurePieForQuoteId(
  quoteId: string,
  opts?: { force?: boolean }
): Promise<EnsureResult> {
  try {
    const { quote, lead, call } = await loadQuoteBundle(quoteId);

    if (!opts?.force) {
      const existing =
        (await getExistingPieByLatestId(quote.latest_pie_report_id)) || (await getLatestPieByQuoteId(quoteId));
      if (existing) {
        // ensure quotes.latest_pie_report_id is synced
        if (!quote.latest_pie_report_id || quote.latest_pie_report_id !== existing.id) {
          await pieDb.from("quotes").update({ latest_pie_report_id: existing.id }).eq("id", quoteId);
        }
        return { ok: true, created: false, quoteId, pie: existing };
      }
    }

    let payload = buildPiePayload({ quote, lead, call });
    payload = await maybeEnhanceWithOpenAI(payload, quote, lead, call);

    const inputSnapshot = {
      quote: {
        id: quote.id,
        created_at: quote.created_at,
        status: quote.status,
        tier_recommended: quote.tier_recommended,
        estimate_total: quote.estimate_total,
        estimate_low: quote.estimate_low,
        estimate_high: quote.estimate_high,
      },
      lead: lead ? { id: lead.id, email: lead.email, name: lead.name } : null,
      call_request: call
        ? {
            id: call.id,
            status: call.status,
            preferred_times: call.preferred_times,
            timezone: call.timezone,
            notes: call.notes,
            created_at: call.created_at,
          }
        : null,
      intake_normalized: quote.intake_normalized,
      intake_raw: quote.intake_raw,
      scope_snapshot: quote.scope_snapshot,
      debug: quote.debug,
      raw_text_for_ai: extractText(quote.intake_normalized),
    };

    const insertPayload: Record<string, any> = {
      token: randomUUID(),
      project_id: null, // Keep null-safe. If your schema later requires project_id, wire it to real projects.id only.
      created_at: new Date().toISOString(),
      report: buildMarkdownSummary(payload),
      expires_at: null,
      quote_id: quote.id,
      payload,
      score: payload.score,
      tier: payload.tier,
      confidence: payload.confidence,
      input: inputSnapshot,
    };

    let insertRes = await pieDb
      .from("pie_reports")
      .insert(insertPayload)
      .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence")
      .single();

    // Fallback if project_id null handling differs
    if (insertRes.error) {
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.project_id;

      insertRes = await pieDb
        .from("pie_reports")
        .insert(fallbackPayload)
        .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence")
        .single();
    }

    if (insertRes.error || !insertRes.data) {
      throw new Error(insertRes.error?.message || "Failed to insert PIE report");
    }

    const pie = insertRes.data as PieReportRow;

    await pieDb.from("quotes").update({ latest_pie_report_id: pie.id }).eq("id", quote.id);

    return { ok: true, created: true, quoteId, pie };
  } catch (err: any) {
    return {
      ok: false,
      created: false,
      quoteId,
      error: err?.message || "Unknown PIE generation error",
    };
  }
}

// Compatibility export used by older files/routes
export async function generatePieForQuoteId(
  quoteId: string,
  opts?: { force?: boolean }
): Promise<EnsureResult> {
  return ensurePieForQuoteId(quoteId, { force: opts?.force ?? true });
}
