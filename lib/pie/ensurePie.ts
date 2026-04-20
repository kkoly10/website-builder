import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { INTERNAL_HOURLY_RATE } from "@/lib/pricing/config";
import { TIER_CONFIG, type TierName } from "@/lib/pricing/tiers";

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
  summary?: string | null;
};

type EnsureResult = {
  ok: boolean;
  created: boolean;
  quoteId: string;
  pie?: PieReportRow;
  error?: string;
};

type PiePayloadV3 = {
  version: "3.0";
  complexity: {
    score: number;
    label: "Low" | "Moderate" | "High" | "Very High";
    drivers: Array<{
      label: string;
      impact: "low" | "medium" | "high";
      points: number;
      note: string;
    }>;
    confidence: "Low" | "Medium" | "High";
  };
  tier: {
    recommended: TierName;
    priceBand: { min: number; max: number };
    targetPrice: number;
    rationale: string;
    upsellNote?: string;
    downsellNote?: string;
  };
  capacity: {
    estimatedHours: { min: number; target: number; max: number };
    breakdown: {
      discovery: number;
      build: number;
      revisions: number;
      qa: number;
      launch: number;
    };
    estimatedWeeks: { min: number; target: number; max: number };
    effectiveHourlyRate: number;
    profitSignal: "healthy" | "tight" | "unprofitable";
    profitMessage: string;
  };
  lead: {
    score: number;
    priority: "high" | "normal" | "low";
    signals: Array<{ label: string; weight: number; note: string }>;
    notes: string;
  };
  risks: Array<{
    flag: string;
    impact: "low" | "medium" | "high";
    mitigation: string;
  }>;
  scope: {
    pagesIncluded: string[];
    featuresIncluded: string[];
    assumptions: string[];
    exclusions: string[];
    deliverables: string[];
    revisionRounds: number;
  };
  discoveryQuestions: string[];
  negotiation: {
    lowerCostOptions: string[];
    upsellOptions: string[];
    priceDefense: string[];
  };
  routing: {
    path: "fast" | "warm" | "deep";
    reason: string;
    triggers: string[];
    triggerDetails: Array<{
      rule: string;
      matched: string;
      note: string;
    }>;
    recommendedCallLength: null | 15 | 30;
    manualOverride: null;
    finalPath: "fast" | "warm" | "deep";
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const pieDb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function safeObj(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
}

function parsePagesWanted(value?: string | null) {
  const raw = cleanString(value);
  if (!raw) return 3;
  const lower = raw.toLowerCase();
  if (lower.includes("one pager")) return 1;
  const numbers = (lower.match(/\d+/g) || []).map(Number);
  if (!numbers.length) return 3;
  if (lower.includes("+")) return numbers[0];
  if (numbers.length >= 2) return Math.round((numbers[0] + numbers[1]) / 2);
  return numbers[0];
}

function normalizeTier(value?: string | null): TierName {
  const normalized = cleanString(value).toLowerCase();
  if (normalized.includes("premium")) return "Premium";
  if (normalized.includes("growth")) return "Growth";
  if (normalized.includes("starter")) return "Starter";
  return "Growth";
}

function parseMoneyBand(value?: string | null): { min?: number; max?: number } {
  if (!value) return {};
  const numbers = (value.match(/\d+/g) || []).map((part) => Number(part));
  if (!numbers.length) return {};
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function hasTruthy(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = cleanString(value).toLowerCase();
  return ["yes", "true", "1", "on"].includes(normalized);
}

function extractFeatures(intake: Record<string, any>) {
  const features = new Set<string>();

  for (const feature of safeArray(intake.neededFeatures)) {
    features.add(titleCase(feature));
  }

  for (const feature of safeArray(intake.integrations)) {
    features.add(titleCase(feature));
  }

  for (const feature of safeArray(intake.automationTypes)) {
    features.add(titleCase(feature));
  }

  if (cleanString(intake.integrationOther)) {
    features.add(titleCase(intake.integrationOther));
  }
  if (hasTruthy(intake.booking)) features.add("Booking");
  if (hasTruthy(intake.payments)) features.add("Payments");
  if (hasTruthy(intake.blog)) features.add("Blog / CMS");
  if (hasTruthy(intake.membership)) features.add("Member Area");
  if (hasTruthy(intake.needCopywriting)) features.add("Copywriting");
  if (hasTruthy(intake.needLogoBranding)) features.add("Branding");
  if (hasTruthy(intake.wantsAutomation)) features.add("Automation");

  return Array.from(features);
}

function analyzeFeatures(features: string[]) {
  let points = 0;
  const drivers: PiePayloadV3["complexity"]["drivers"] = [];

  const add = (
    label: string,
    impact: "low" | "medium" | "high",
    driverPoints: number,
    note: string
  ) => {
    points += driverPoints;
    drivers.push({ label, impact, points: driverPoints, note });
  };

  if (features.length) {
    add(
      "Requested features",
      features.length >= 5 ? "high" : "medium",
      Math.min(24, features.length * 4),
      `${features.length} feature(s) requested.`
    );
  }

  if (features.some((feature) => /booking|calendar|appointment/i.test(feature))) {
    add(
      "Booking flow",
      "medium",
      10,
      "Scheduling UX adds setup, testing, and integration work."
    );
  }

  if (features.some((feature) => /payment|checkout|ecommerce|commerce|store/i.test(feature))) {
    add(
      "Commerce / payments",
      "high",
      18,
      "Payments and checkout increase QA, policy, and implementation load."
    );
  }

  if (features.some((feature) => /portal|dashboard|login|member|auth/i.test(feature))) {
    add(
      "Auth / portal",
      "high",
      20,
      "Login-protected work introduces permissions and ongoing support complexity."
    );
  }

  if (features.some((feature) => /cms|blog|content/i.test(feature))) {
    add(
      "CMS / content system",
      "medium",
      8,
      "A content system improves handoff but adds setup time."
    );
  }

  if (features.some((feature) => /integration|crm|api|automation/i.test(feature))) {
    add(
      "Integrations",
      "high",
      12,
      "External systems expand testing and edge cases."
    );
  }

  return { points, drivers };
}

function buildComplexity(args: {
  intake: Record<string, any>;
  features: string[];
  pagesEstimate: number;
  call: CallRequestRow | null;
}) {
  const featureAnalysis = analyzeFeatures(args.features);
  const drivers = [...featureAnalysis.drivers];
  let score = 8;

  const pagePoints = clamp((args.pagesEstimate - 1) * 4, 0, 28);
  score += pagePoints;
  drivers.push({
    label: "Page count",
    impact: args.pagesEstimate >= 7 ? "high" : args.pagesEstimate >= 4 ? "medium" : "low",
    points: pagePoints,
    note: `${args.pagesEstimate} page(s) estimated from intake.`,
  });

  score += featureAnalysis.points;

  if (hasTruthy(args.intake.needCopywriting) || args.intake.contentReady === "not_ready") {
    score += 10;
    drivers.push({
      label: "Content support",
      impact: "high",
      points: 10,
      note: "Copy and content gaps add coordination and revision time.",
    });
  }

  if (hasTruthy(args.intake.needLogoBranding) || args.intake.hasBrandGuide === "no") {
    score += 8;
    drivers.push({
      label: "Brand direction",
      impact: "medium",
      points: 8,
      note: "Brand-definition work expands the design phase.",
    });
  }

  if (/asap|urgent|under 14|this week/i.test(cleanString(args.intake.timeline))) {
    score += 8;
    drivers.push({
      label: "Timeline pressure",
      impact: "medium",
      points: 8,
      note: "Rush requests increase coordination overhead.",
    });
  }

  if (hasTruthy(args.intake.domainHosting === "no") || /need|none|don't have/i.test(cleanString(args.intake.domainHosting))) {
    score += 4;
    drivers.push({
      label: "Domain / hosting setup",
      impact: "low",
      points: 4,
      note: "Launch coordination includes domain and hosting support.",
    });
  }

  if (args.call?.status === "new") {
    score += 2;
    drivers.push({
      label: "Call requested",
      impact: "low",
      points: 2,
      note: "Discovery is already part of this deal flow.",
    });
  }

  score = clamp(score, 10, 98);
  const unknownCount = countUnknownAnswers(args.intake);
  const confidence: "Low" | "Medium" | "High" =
    unknownCount >= 3 ? "Low" : unknownCount >= 1 || score >= 70 ? "Medium" : "High";
  const label: PiePayloadV3["complexity"]["label"] =
    score < 30 ? "Low" : score < 55 ? "Moderate" : score < 75 ? "High" : "Very High";

  return {
    score,
    label,
    confidence,
    drivers: drivers.sort((left, right) => right.points - left.points),
    featurePoints: featureAnalysis.points,
  };
}

function targetPriceWithinTier(tier: TierName, complexity: number) {
  const band = TIER_CONFIG[tier];
  const ranges: Record<TierName, [number, number]> = {
    Starter: [0, 30],
    Growth: [25, 70],
    Premium: [60, 100],
  };
  const [low, high] = ranges[tier];
  const normalized = clamp((complexity - low) / (high - low), 0, 1);
  return Math.round(band.min + (band.max - band.min) * normalized);
}

function recommendTier(args: {
  features: string[];
  pagesEstimate: number;
  complexityScore: number;
}): TierName {
  const hasEcomOrAuth = args.features.some((feature) =>
    /ecommerce|checkout|portal|member|auth|login/i.test(feature)
  );
  if (hasEcomOrAuth) return "Premium";
  if (args.pagesEstimate >= 7) return "Premium";
  if (args.complexityScore >= 75) return "Premium";
  if (args.features.length >= 6) return "Premium";
  if (
    args.pagesEstimate <= 2 &&
    args.features.length <= 2 &&
    args.complexityScore < 30
  ) {
    return "Starter";
  }
  return "Growth";
}

function buildTierRationale(args: {
  tier: TierName;
  pagesEstimate: number;
  features: string[];
  complexityScore: number;
}) {
  const featureCallout = args.features.slice(0, 3).join(", ").toLowerCase();
  const rationale = `${args.pagesEstimate} page(s)${
    featureCallout ? ` with ${featureCallout}` : ""
  } lands this solidly in ${args.tier} based on a complexity score of ${
    args.complexityScore
  }.`;

  const upsellNote =
    args.tier !== "Premium"
      ? "Add e-commerce, auth, or a larger page count and this becomes the next tier up."
      : "Premium already covers the deeper delivery path this project needs.";

  const downsellNote =
    args.tier !== "Starter"
      ? "Strip advanced features or reduce launch scope and this could move down a tier."
      : "This is already scoped at the lightest boutique tier.";

  return { rationale, upsellNote, downsellNote };
}

function buildCapacity(args: {
  featurePoints: number;
  pagesEstimate: number;
  complexityScore: number;
  targetPrice: number;
  contentReady: boolean;
}) {
  const baseBuildHours =
    args.pagesEstimate * 4 + args.featurePoints + args.complexityScore * 0.25;
  const discoveryHours = baseBuildHours * 0.18;
  const revisionHours = baseBuildHours * 0.25;
  const qaHours = baseBuildHours * 0.15;
  const commsHours = baseBuildHours * 0.12;
  const launchHours = baseBuildHours * 0.08;
  const targetHours =
    baseBuildHours +
    discoveryHours +
    revisionHours +
    qaHours +
    commsHours +
    launchHours;

  const minHours = Math.round(targetHours * 0.85);
  const maxHours = Math.round(targetHours * 1.35);
  const effectiveHourlyRate = Math.round(args.targetPrice / targetHours);
  const estimatedWeeks = {
    min: Math.max(1, Math.ceil(minHours / 20)),
    target: Math.max(1, Math.ceil(targetHours / 20 + (args.contentReady ? 0 : 1))),
    max: Math.max(1, Math.ceil(maxHours / 18)),
  };

  let profitSignal: "healthy" | "tight" | "unprofitable" = "healthy";
  let profitMessage = `Effective rate is about $${effectiveHourlyRate}/hr against an internal $${INTERNAL_HOURLY_RATE}/hr target. Healthy margin.`;

  if (effectiveHourlyRate < INTERNAL_HOURLY_RATE * 0.7) {
    profitSignal = "unprofitable";
    profitMessage = `Effective rate is about $${effectiveHourlyRate}/hr against the internal $${INTERNAL_HOURLY_RATE}/hr target. Raise price or phase scope.`;
  } else if (effectiveHourlyRate < INTERNAL_HOURLY_RATE * 0.9) {
    profitSignal = "tight";
    profitMessage = `Effective rate is about $${effectiveHourlyRate}/hr against the internal $${INTERNAL_HOURLY_RATE}/hr target. The project is workable but margin is tight.`;
  }

  return {
    estimatedHours: {
      min: Math.round(minHours),
      target: Math.round(targetHours),
      max: Math.round(maxHours),
    },
    breakdown: {
      discovery: Math.round(discoveryHours),
      build: Math.round(baseBuildHours + commsHours),
      revisions: Math.round(revisionHours),
      qa: Math.round(qaHours),
      launch: Math.round(launchHours),
    },
    estimatedWeeks,
    effectiveHourlyRate,
    profitSignal,
    profitMessage,
  };
}

function countUnknownAnswers(intake: Record<string, any>) {
  let count = 0;
  for (const value of Object.values(intake)) {
    const normalized = cleanString(value).toLowerCase();
    if (normalized === "unsure" || normalized === "i don't know" || normalized === "not sure") {
      count += 1;
    }
  }
  return count;
}

function evaluateRouting(args: {
  intake: Record<string, any>;
  features: string[];
  pagesEstimate: number;
  complexityScore: number;
  recommendedTier: TierName;
  call: CallRequestRow | null;
  targetPrice: number;
}) {
  const deepTriggerDetails: PiePayloadV3["routing"]["triggerDetails"] = [];
  const warmTriggerDetails: PiePayloadV3["routing"]["triggerDetails"] = [];
  const textBlob = JSON.stringify(args.intake).toLowerCase();
  const unknownCount = countUnknownAnswers(args.intake);
  const budget = parseMoneyBand(cleanString(args.intake.budgetRange || args.intake.budget));
  const ambiguousCopy = /not sure|depends|maybe|probably|we'?ll see/i.test(textBlob);

  if (args.features.some((feature) => /ecommerce|inventory|shipping/i.test(feature))) {
    deepTriggerDetails.push({
      rule: "commerce_scope",
      matched: "commerce feature set",
      note: "E-commerce and inventory work usually needs scoped discovery.",
    });
  }
  if (args.features.some((feature) => /auth|login|portal|member/i.test(feature))) {
    deepTriggerDetails.push({
      rule: "auth_scope",
      matched: "auth or portal feature",
      note: "Protected-user systems are deep-path work.",
    });
  }
  if (args.pagesEstimate >= 7) {
    deepTriggerDetails.push({
      rule: "large_page_count",
      matched: `${args.pagesEstimate} pages`,
      note: "Seven or more pages typically need live discovery before a fixed commitment.",
    });
  }
  if (unknownCount >= 3) {
    deepTriggerDetails.push({
      rule: "too_many_unknowns",
      matched: `${unknownCount} unknown answers`,
      note: "Too much intake ambiguity for a confident fixed quote.",
    });
  }
  if (!budget.min && !budget.max && args.features.length >= 6) {
    deepTriggerDetails.push({
      rule: "no_budget_high_scope",
      matched: "no budget with high feature count",
      note: "Large scope without budget context should move to a call.",
    });
  }
  if (/call|discovery/i.test(textBlob)) {
    deepTriggerDetails.push({
      rule: "explicit_call_request",
      matched: "free-text call request",
      note: "The client explicitly asked to talk before committing.",
    });
  }

  if (args.pagesEstimate >= 5 && args.pagesEstimate <= 6) {
    warmTriggerDetails.push({
      rule: "edge_of_growth",
      matched: `${args.pagesEstimate} pages`,
      note: "This is near the upper edge of the Growth tier.",
    });
  }
  if (args.features.length >= 4 && args.features.length <= 5) {
    warmTriggerDetails.push({
      rule: "dense_feature_set",
      matched: `${args.features.length} features`,
      note: "A dense feature list is workable, but a short alignment call helps.",
    });
  }
  if (/some|partial/i.test(cleanString(args.intake.contentReady || args.intake.contentReadiness))) {
    warmTriggerDetails.push({
      rule: "partial_content",
      matched: "partial content readiness",
      note: "Partial content often changes the scope conversation.",
    });
  }
  if (hasTruthy(args.intake.needCopywriting)) {
    warmTriggerDetails.push({
      rule: "copy_support",
      matched: "copywriting requested",
      note: "Copy support adds ambiguity unless confirmed live.",
    });
  }
  if (hasTruthy(args.intake.needLogoBranding) || args.intake.hasBrandGuide === "no") {
    warmTriggerDetails.push({
      rule: "branding_support",
      matched: "brand help requested",
      note: "Brand direction changes can expand the design phase.",
    });
  }
  if (ambiguousCopy || unknownCount >= 1) {
    warmTriggerDetails.push({
      rule: "uncertainty_language",
      matched: ambiguousCopy ? "uncertain free text" : `${unknownCount} unknown answer(s)`,
      note: "There is enough uncertainty here to justify a short alignment call.",
    });
  }

  const recommendedBand = TIER_CONFIG[args.recommendedTier];
  if (
    (budget.max && budget.max < recommendedBand.min * 0.75) ||
    (budget.min && budget.min > recommendedBand.max * 1.25)
  ) {
    warmTriggerDetails.push({
      rule: "budget_mismatch",
      matched: cleanString(args.intake.budgetRange || args.intake.budget),
      note: "Budget expectations do not match the recommended tier.",
    });
  }

  if (deepTriggerDetails.length > 0) {
    return {
      path: "deep" as const,
      reason: `${deepTriggerDetails.length} deep-path trigger(s) fired`,
      triggers: deepTriggerDetails.map((detail) => detail.rule),
      triggerDetails: deepTriggerDetails,
      recommendedCallLength: 30 as const,
      manualOverride: null,
      finalPath: "deep" as const,
    };
  }

  if (warmTriggerDetails.length >= 2) {
    return {
      path: "warm" as const,
      reason: `${warmTriggerDetails.length} warm-path triggers combined`,
      triggers: warmTriggerDetails.map((detail) => detail.rule),
      triggerDetails: warmTriggerDetails,
      recommendedCallLength: 15 as const,
      manualOverride: null,
      finalPath: "warm" as const,
    };
  }

  return {
    path: "fast" as const,
    reason: "Clean scope and confident recommendation",
    triggers: [],
    triggerDetails: [],
    recommendedCallLength: null,
    manualOverride: null,
    finalPath: "fast" as const,
  };
}

function buildLeadSignals(intake: Record<string, any>) {
  const signals: Array<{ label: string; weight: number; note: string }> = [];
  let score = 45;

  const add = (label: string, weight: number, note: string) => {
    score += weight;
    signals.push({ label, weight, note });
  };

  const contentReady = cleanString(intake.contentReady || intake.contentReadiness).toLowerCase();
  if (contentReady.includes("ready")) add("Content ready", 10, "Fast-moving clients are easier to deliver for.");
  else if (contentReady.includes("some") || contentReady.includes("partial")) {
    add("Partial content", 3, "Some prep exists, but follow-up will still be needed.");
  } else {
    add("Content gap", -8, "Missing content usually slows sales-to-delivery momentum.");
  }

  const budget = parseMoneyBand(cleanString(intake.budgetRange || intake.budget));
  if ((budget.max ?? 0) >= 6500) add("Healthy budget", 12, "Budget can support the recommended build path.");
  else if ((budget.max ?? 0) >= 3500) add("Viable budget", 7, "Budget is workable for a Growth-tier engagement.");
  else if ((budget.max ?? 0) > 0) add("Tight budget", -5, "Budget may require phasing or scope reduction.");

  if (cleanString(intake.businessName)) add("Business name supplied", 4, "Signals a more complete intake.");
  if (/asap|urgent/i.test(cleanString(intake.timeline))) add("Urgency", 3, "Active buying signal, though it adds delivery pressure.");
  if (safeArray(intake.neededFeatures).length >= 4) add("High intent feature list", 4, "The client is thinking concretely about the outcome.");

  score = clamp(score, 0, 100);
  const priority: PiePayloadV3["lead"]["priority"] =
    score >= 70 ? "high" : score >= 45 ? "normal" : "low";
  return {
    score,
    priority,
    signals,
    notes:
      score >= 70
        ? "Strong lead quality with good buying signals."
        : score >= 45
        ? "Worth pursuing with normal follow-up."
        : "Proceed carefully and protect scope.",
  };
}

function buildScope(args: {
  pagesEstimate: number;
  features: string[];
  tier: TierName;
  intake: Record<string, any>;
}) {
  const pagesIncluded =
    args.pagesEstimate <= 1
      ? ["Homepage / one-page flow"]
      : Array.from({ length: args.pagesEstimate }, (_, index) => `Page ${index + 1}`);

  const assumptions = [
    `${args.pagesEstimate} launch page(s) are included in the current recommendation.`,
    "Client provides approvals and feedback on time.",
    "Project includes mobile responsiveness and launch support.",
  ];

  if (!/ready/i.test(cleanString(args.intake.contentReady || args.intake.contentReadiness))) {
    assumptions.push("Timeline includes buffer for staged content delivery.");
  }
  if (hasTruthy(args.intake.needCopywriting)) {
    assumptions.push("Copy support covers core launch messaging, not a full brand strategy project.");
  }

  const exclusions = [
    "Third-party fees",
    "Advanced SEO campaigns",
    "Unscoped web app behavior",
  ];
  if (!args.features.some((feature) => /payment|ecommerce|checkout/i.test(feature))) {
    exclusions.push("Commerce setup and payment processing");
  }

  const deliverables = [
    "Kickoff and scope confirmation",
    `${args.tier} tier website build`,
    "Responsive QA pass",
    "Launch coordination and handoff",
  ];
  for (const feature of args.features.slice(0, 4)) {
    deliverables.push(`${feature} implementation`);
  }

  return {
    pagesIncluded,
    featuresIncluded: args.features,
    assumptions,
    exclusions,
    deliverables,
    revisionRounds: args.tier === "Premium" ? 3 : 2,
  };
}

function buildDiscoveryQuestions(args: {
  intake: Record<string, any>;
  features: string[];
  pagesEstimate: number;
}) {
  const questions: string[] = [
    "What are the top one or two outcomes this site needs to drive first?",
    "What are the final launch pages, by name?",
    "Who is responsible for copy, images, and approvals?",
  ];

  if (!cleanString(args.intake.budgetRange || args.intake.budget)) {
    questions.push("What budget range are you comfortable with for phase one?");
  }
  if (!cleanString(args.intake.timeline)) {
    questions.push("What launch date are you aiming for?");
  }
  if (args.features.some((feature) => /booking|calendar/i.test(feature))) {
    questions.push("Does booking need to connect to an existing scheduling tool?");
  }
  if (args.features.some((feature) => /payment|ecommerce|checkout/i.test(feature))) {
    questions.push("How many products or services will be sold at launch?");
  }
  if (args.features.some((feature) => /portal|login|member|auth/i.test(feature))) {
    questions.push("What user roles are required, and what can each role do?");
  }
  if (cleanString(args.intake.domainHosting).toLowerCase() === "no") {
    questions.push("Do you already own a domain, and where is it registered?");
  }

  return Array.from(new Set(questions));
}

function buildRisks(args: {
  intake: Record<string, any>;
  features: string[];
  routing: PiePayloadV3["routing"];
}) {
  const risks: PiePayloadV3["risks"] = [];

  if (!/ready/i.test(cleanString(args.intake.contentReady || args.intake.contentReadiness))) {
    risks.push({
      flag: "Content readiness",
      impact: "high",
      mitigation: "Require page-by-page content deadlines before build starts.",
    });
  }

  if (args.features.some((feature) => /payment|ecommerce|checkout/i.test(feature))) {
    risks.push({
      flag: "Commerce QA",
      impact: "high",
      mitigation: "Confirm payment flows, policies, and test cases before launch.",
    });
  }

  if (args.features.some((feature) => /portal|member|auth|login/i.test(feature))) {
    risks.push({
      flag: "Access control",
      impact: "high",
      mitigation: "Lock user roles and permissions during discovery.",
    });
  }

  if (args.routing.path !== "fast") {
    risks.push({
      flag: "Scope ambiguity",
      impact: args.routing.path === "deep" ? "high" : "medium",
      mitigation: "Use the recommended call to confirm assumptions before commitment.",
    });
  }

  return risks;
}

function buildNegotiation(args: {
  pagesEstimate: number;
  features: string[];
  tier: TierName;
}) {
  const lowerCostOptions = [
    `Launch with ${Math.min(3, args.pagesEstimate)} page(s), then add the rest after launch.`,
    "Reduce advanced features and keep the first release focused on one conversion goal.",
    "Have the client provide final copy and imagery to reduce revision overhead.",
  ];

  const upsellOptions = [
    "Add ongoing maintenance and support",
    "Add analytics and conversion tracking",
    "Add post-launch SEO refinement",
  ];

  if (args.tier !== "Premium") {
    upsellOptions.push("Upgrade into a deeper brand and content package");
  }

  const priceDefense = [
    "Pricing includes planning, build, revisions, QA, and launch support.",
    "A stronger tier protects timeline and quality better than a stretched discount.",
    "We can phase scope without compromising the foundation.",
  ];

  return { lowerCostOptions, upsellOptions, priceDefense };
}

function buildMarkdownSummary(payload: PiePayloadV3) {
  return [
    `# PIE Report (${payload.tier.recommended})`,
    "",
    `Complexity: ${payload.complexity.score}/100 (${payload.complexity.label})`,
    `Recommended tier: ${payload.tier.recommended}`,
    `Target price: $${payload.tier.targetPrice.toLocaleString()}`,
    `Routing: ${payload.routing.finalPath}`,
    `Capacity: ${payload.capacity.estimatedHours.target}h target (~${payload.capacity.estimatedWeeks.target} weeks)`,
    "",
    `## Rationale`,
    payload.tier.rationale,
    "",
    `## Profit signal`,
    payload.capacity.profitMessage,
    "",
    `## Triggers`,
    ...(payload.routing.triggerDetails.length
      ? payload.routing.triggerDetails.map(
          (detail) => `- ${detail.rule}: ${detail.note}`
        )
      : ["- Clean scope and confident recommendation."]),
  ].join("\n");
}

function buildPiePayload(args: {
  quote: QuoteRow;
  lead: LeadRow | null;
  call: CallRequestRow | null;
}) {
  const intake = safeObj(args.quote.intake_normalized);
  const pagesEstimate = parsePagesWanted(
    cleanString(intake.pagesWanted || intake.pages)
  );
  const features = extractFeatures(intake);
  const complexity = buildComplexity({
    intake,
    features,
    pagesEstimate,
    call: args.call,
  });
  const tier = recommendTier({
    features,
    pagesEstimate,
    complexityScore: complexity.score,
  });
  const targetPrice = targetPriceWithinTier(tier, complexity.score);
  const capacity = buildCapacity({
    featurePoints: complexity.featurePoints,
    pagesEstimate,
    complexityScore: complexity.score,
    targetPrice,
    contentReady: /ready/i.test(cleanString(intake.contentReady || intake.contentReadiness)),
  });
  const routing = evaluateRouting({
    intake,
    features,
    pagesEstimate,
    complexityScore: complexity.score,
    recommendedTier: tier,
    call: args.call,
    targetPrice,
  });
  const lead = buildLeadSignals(intake);
  const scope = buildScope({ pagesEstimate, features, tier, intake });
  const risks = buildRisks({ intake, features, routing });
  const tierNotes = buildTierRationale({
    tier,
    pagesEstimate,
    features,
    complexityScore: complexity.score,
  });

  return {
    version: "3.0" as const,
    complexity: {
      score: complexity.score,
      label: complexity.label,
      drivers: complexity.drivers,
      confidence: complexity.confidence,
    },
    tier: {
      recommended: tier,
      priceBand: {
        min: TIER_CONFIG[tier].min,
        max: TIER_CONFIG[tier].max,
      },
      targetPrice,
      rationale: tierNotes.rationale,
      upsellNote: tierNotes.upsellNote,
      downsellNote: tierNotes.downsellNote,
    },
    capacity,
    lead,
    risks,
    scope,
    discoveryQuestions: buildDiscoveryQuestions({ intake, features, pagesEstimate }),
    negotiation: buildNegotiation({ pagesEstimate, features, tier }),
    routing,
  };
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
    const leadRes = await pieDb
      .from("leads")
      .select("id,email,name")
      .eq("id", quote.lead_id)
      .single();
    if (!leadRes.error && leadRes.data) {
      lead = leadRes.data as LeadRow;
    }
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

async function getExistingPieByLatestId(latestPieId: string | null) {
  if (!latestPieId) return null;
  const res = await pieDb
    .from("pie_reports")
    .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence,summary")
    .eq("id", latestPieId)
    .single();

  if (res.error || !res.data) return null;
  return res.data as PieReportRow;
}

async function getLatestPieByQuoteId(quoteId: string) {
  const res = await pieDb
    .from("pie_reports")
    .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence,summary")
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
        (await getExistingPieByLatestId(quote.latest_pie_report_id)) ||
        (await getLatestPieByQuoteId(quoteId));
      if (existing) {
        if (!quote.latest_pie_report_id || quote.latest_pie_report_id !== existing.id) {
          await pieDb
            .from("quotes")
            .update({ latest_pie_report_id: existing.id })
            .eq("id", quoteId);
        }
        return { ok: true, created: false, quoteId, pie: existing };
      }
    }

    const payload = buildPiePayload({ quote, lead, call });
    const summary = payload.tier.rationale;
    const report = buildMarkdownSummary(payload);
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
    };

    const insertRes = await pieDb
      .from("pie_reports")
      .insert({
        token: randomUUID(),
        project_id: null,
        created_at: new Date().toISOString(),
        report,
        expires_at: null,
        quote_id: quote.id,
        payload,
        score: payload.complexity.score,
        tier: payload.tier.recommended,
        confidence: payload.complexity.confidence,
        summary,
        input: inputSnapshot,
        status: "generated",
      })
      .select("id,quote_id,project_id,created_at,payload,input,report,score,tier,confidence,summary")
      .single();

    if (insertRes.error || !insertRes.data) {
      throw new Error(insertRes.error?.message || "Failed to insert PIE report");
    }

    const pie = insertRes.data as PieReportRow;

    await pieDb
      .from("quotes")
      .update({ latest_pie_report_id: pie.id })
      .eq("id", quote.id);

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

export async function generatePieForQuoteId(
  quoteId: string,
  opts?: { force?: boolean }
): Promise<EnsureResult> {
  return ensurePieForQuoteId(quoteId, { force: opts?.force ?? true });
}
