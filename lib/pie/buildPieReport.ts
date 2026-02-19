// lib/pie/buildPieReport.ts
type AnyObj = Record<string, any>;

function asBool(v: any) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function asStr(v: any) {
  return String(v ?? "").trim();
}

function pick(obj: AnyObj, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function extractEstimateUSD(q: AnyObj): number {
  const total =
    (typeof q?.total === "number" ? q.total : undefined) ??
    (typeof q?.total_usd === "number" ? q.total_usd : undefined) ??
    (typeof q?.total_cents === "number" ? q.total_cents / 100 : undefined) ??
    (typeof q?.estimate_total === "number" ? q.estimate_total : undefined) ??
    (typeof q?.estimate?.total === "number" ? q.estimate.total : undefined);

  return Number.isFinite(total) ? Number(total) : 0;
}

export function buildPieReport({ quote, lead }: { quote: AnyObj; lead: AnyObj | null }) {
  const intake = (quote?.intake_normalized ?? quote?.intakeNormalized ?? quote?.intake_raw ?? quote?.intakeRaw ?? {}) as AnyObj;
  const estUSD = extractEstimateUSD(quote);
  const tier =
    asStr(pick(quote, ["tier", "tier_recommended"])) ||
    asStr(pick(quote?.estimate ?? {}, ["tierRecommended", "tier_recommended"])) ||
    "essential";

  // ----- Lead score (0–100)
  let score = 55;
  const contentReady = asStr(intake?.contentReady || intake?.content_ready).toLowerCase();
  const domainHosting = asStr(intake?.domainHosting || intake?.domain_hosting).toLowerCase();

  if (lead?.email) score += 3;
  if (asStr(intake?.leadPhone || intake?.lead_phone)) score += 4;

  if (contentReady.includes("ready")) score += 10;
  else if (contentReady.includes("not")) score -= 10;
  else score += 3;

  if (domainHosting === "yes") score += 4;
  if (domainHosting === "no") score -= 2;

  const wantsPayments = asBool(intake?.payments);
  const wantsMembership = asBool(intake?.membership);
  const wantsBooking = asBool(intake?.booking);
  const wantsAutomation = asStr(intake?.wantsAutomation || intake?.wants_automation).toLowerCase() === "yes";

  // More complexity can mean more revenue but also more risk; treat as mild risk
  if (wantsPayments) score += 2;
  if (wantsMembership) score -= 4;

  const risks: string[] = [];
  if (wantsPayments) risks.push("Payments/checkout adds QA + edge cases.");
  if (wantsMembership) risks.push("Membership/gated content increases complexity + support load.");
  if (wantsAutomation) risks.push("Automation workflows require careful testing (email + data).");
  if (contentReady.includes("not")) risks.push("Client content not ready — timeline risk.");

  score = Math.max(0, Math.min(100, Math.round(score)));

  // ----- Pricing
  const floor = Math.max(0, Math.round(estUSD * 0.9));
  const recommended = Math.max(0, Math.round(estUSD));
  const premium = Math.max(recommended + 1, Math.round(estUSD * 1.25 + (wantsPayments ? 100 : 0) + (wantsMembership ? 150 : 0)));

  // ----- Negotiation / tradeoffs
  const tradeoffs = [
    "Reduce page count / sections",
    "Start with one conversion page + expand later",
    "Delay blog / integrations to phase 2",
    "Use template sections for faster delivery",
  ];

  const pitchBullets = [
    "Clear scope + exclusions (no surprise work).",
    "Conversion-first layout and clean mobile experience.",
    "Structured revisions so the project finishes on time.",
    "Built on Wix/Squarespace/Next.js depending on needs.",
  ];

  return {
    version: "pie-v1",
    createdAt: new Date().toISOString(),
    lead: {
      email: lead?.email ?? null,
      score,
      notes: score >= 75 ? "Strong lead" : score >= 55 ? "Decent lead" : "Risky lead",
    },
    pricing: {
      tierRecommended: String(tier).toLowerCase(),
      floor,
      recommended,
      premium,
    },
    riskFlags: risks,
    negotiation: {
      adminDiscountMaxPct: 25,
      tradeoffs,
    },
    pitch: {
      headline: "Built to convert. Clear scope. Clean builds.",
      bullets: pitchBullets,
    },
    snapshot: {
      wantsBooking,
      wantsPayments,
      wantsMembership,
      wantsAutomation,
      contentReady: contentReady || null,
    },
    rawInputs: {
      intake,
      quoteId: quote?.id ?? null,
    },
  };
}