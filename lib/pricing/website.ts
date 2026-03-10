import {
  PRICING_MESSAGES,
  PRICING_VERSION,
  WEBSITE_TIER_CONFIG,
  formatRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  PricingPosition,
  PricingReason,
  PricingResult,
  WebsitePricingInput,
  WebsiteTierKey,
} from "@/lib/pricing/types";

const INCLUDED_AUTOMATIONS = new Set([
  "Email confirmations",
  "Email confirmation",
]);

const INCLUDED_INTEGRATIONS = new Set([
  "Google Maps / location",
  "Analytics (GA4 / Pixel)",
  "Stripe payments",
  "PayPal payments",
  "Calendly / scheduling",
]);

function pagesMaxFromBucket(bucket: WebsitePricingInput["pages"]) {
  if (bucket === "1") return 1;
  if (bucket === "1-3") return 3;
  if (bucket === "4-6") return 6;
  if (bucket === "6-8") return 8;
  return 12;
}

function isRushTimeline(timeline: string) {
  return /under 14|asap|rush|fast|today|this week/i.test(String(timeline || ""));
}

function choosePosition(score: number): PricingPosition {
  if (score >= 5) return "high";
  if (score >= 2) return "middle";
  return "low";
}

function budgetLooksBelowRange(budget?: string, tierMin?: number) {
  const raw = String(budget || "").toLowerCase();
  if (!raw || !tierMin) return false;

  if (raw.includes("under-2k")) return tierMin > 2000;
  if (raw.includes("2k-5k")) return tierMin > 5000;
  if (raw.includes("5k-10k")) return tierMin > 10000;
  return false;
}

export function getWebsitePricing(
  input: WebsitePricingInput
): PricingResult<WebsiteTierKey> {
  const pagesMax = pagesMaxFromBucket(input.pages);
  const paidAutomationCount =
    input.wantsAutomation === "yes"
      ? input.automationTypes.filter((x) => !INCLUDED_AUTOMATIONS.has(x)).length
      : 0;

  const paidIntegrationCount =
    input.integrations.filter((x) => !INCLUDED_INTEGRATIONS.has(x)).length +
    (input.integrationOther.trim() ? 1 : 0);

  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  if (pagesMax <= 3) {
    reasons.push({
      label: "Small page count",
      note: "This keeps the project in the lighter website tiers.",
      impact: "supporting",
    });
  } else if (pagesMax <= 6) {
    flags.push("Expanded page count");
    reasons.push({
      label: "4–6 page structure",
      note: "This usually needs more planning, page hierarchy, and polish than a starter build.",
      impact: "upward",
    });
    complexityScore += 2;
  } else {
    flags.push("Large page count");
    reasons.push({
      label: "Larger scope",
      note: "A 7+ page build typically needs stronger structure, QA, and content coordination.",
      impact: "upward",
    });
    complexityScore += 4;
  }

  if (input.websiteType === "ecommerce") {
    flags.push("Ecommerce");
    reasons.push({
      label: "Ecommerce direction",
      note: "Selling online usually adds more setup, user flow decisions, and testing.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (input.booking) {
    flags.push("Booking");
    reasons.push({
      label: "Booking flow",
      note: "Booking adds form, scheduling, and conversion-flow setup.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.payments) {
    flags.push("Payments");
    reasons.push({
      label: "Payments / checkout",
      note: "Payments require stronger setup, testing, and launch caution.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (input.blog) {
    flags.push("Blog / CMS");
    reasons.push({
      label: "Blog / CMS needs",
      note: "A blog or content system adds setup and structure even if it is lightweight.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.membership) {
    flags.push("Membership / gated content");
    reasons.push({
      label: "Membership / gated access",
      note: "Gated content and account behavior pushes the project toward more custom territory.",
      impact: "upward",
    });
    complexityScore += 3;
  }

  if (paidAutomationCount > 0) {
    flags.push("Automation");
    reasons.push({
      label: "Automation requested",
      note: "Automations add setup, testing, and follow-up logic beyond a normal brochure site.",
      impact: "upward",
    });
    complexityScore += Math.min(2, paidAutomationCount);
  }

  if (paidIntegrationCount > 0) {
    flags.push("Integrations");
    reasons.push({
      label: "Third-party integrations",
      note: "Every non-trivial integration adds configuration and QA overhead.",
      impact: "upward",
    });
    complexityScore += Math.min(2, paidIntegrationCount);
  }

  if (input.contentReady === "some") {
    flags.push("Partial content readiness");
    reasons.push({
      label: "Partial content readiness",
      note: "Partial content usually increases coordination and revision pressure.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.contentReady === "not_ready") {
    flags.push("Content not ready");
    reasons.push({
      label: "Content not ready",
      note: "Missing content often slows builds and increases scope friction.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (input.domainHosting === "no") {
    flags.push("Domain / hosting support");
    reasons.push({
      label: "Technical setup help needed",
      note: "Domain and hosting help adds launch coordination work.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.hasLogo === "no") {
    flags.push("No logo yet");
    reasons.push({
      label: "Brand asset gap",
      note: "Missing core brand assets can slow visual direction and launch readiness.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.hasBrandGuide === "no") {
    flags.push("Brand guide not defined");
    reasons.push({
      label: "Brand guidance needed",
      note: "Less-defined branding usually means more design interpretation work.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (isRushTimeline(input.timeline)) {
    flags.push("Rush timeline");
    reasons.push({
      label: "Rush timeline",
      note: "A rush launch usually means tighter coordination and less flexibility.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  const isCustom =
    pagesMax > 10 ||
    paidIntegrationCount > 4 ||
    paidAutomationCount > 1 ||
    (input.payments && input.membership) ||
    (input.membership && pagesMax >= 7) ||
    (input.websiteType === "ecommerce" && pagesMax >= 9);

  if (isCustom) {
    reasons.unshift({
      label: "Custom-scope threshold reached",
      note: "This request is beyond the instant-quote tiers and should be confirmed on a strategy call.",
      impact: "custom",
    });

    return {
      version: PRICING_VERSION,
      lane: "website",
      tierKey: "custom_scope",
      tierLabel: "Custom Scope",
      position: "custom",
      isCustomScope: true,
      band: {
        min: WEBSITE_TIER_CONFIG.premium_build.max,
        max: WEBSITE_TIER_CONFIG.premium_build.max,
        target: WEBSITE_TIER_CONFIG.premium_build.max,
      },
      displayRange: PRICING_MESSAGES.websiteCustom,
      publicMessage: PRICING_MESSAGES.websiteCustom,
      summary:
        "This project crosses the instant-quote threshold and should be scoped manually on a strategy call.",
      estimatorSummary:
        "Custom scope triggered by size, complexity, or systems behavior beyond the standard website tiers.",
      reasons,
      complexityFlags: flags,
      complexityScore: Math.max(complexityScore, 7),
    };
  }

  let tierKey: Exclude<WebsiteTierKey, "custom_scope"> = "starter_site";

  if (
    pagesMax <= 3 &&
    !input.payments &&
    !input.membership &&
    paidAutomationCount === 0 &&
    paidIntegrationCount <= 1
  ) {
    tierKey = "starter_site";
  } else if (
    pagesMax <= 6 &&
    !input.membership &&
    paidAutomationCount <= 1 &&
    paidIntegrationCount <= 3
  ) {
    tierKey = "growth_site";
  } else {
    tierKey = "premium_build";
  }

  const band = WEBSITE_TIER_CONFIG[tierKey];
  const position = choosePosition(complexityScore);
  const target = targetFromBand(band.min, band.max, position);

  if (budgetLooksBelowRange(input.budget, band.min)) {
    reasons.push({
      label: "Budget fit warning",
      note: "The stated budget may be below the normal range for this scope. Scope trimming or phasing may help.",
      impact: "fit",
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      label: "Standard build fit",
      note: "This project fits the normal scope for the selected website tier.",
      impact: "supporting",
    });
  }

  return {
    version: PRICING_VERSION,
    lane: "website",
    tierKey,
    tierLabel: band.label,
    position,
    isCustomScope: false,
    band: {
      min: band.min,
      max: band.max,
      target,
    },
    displayRange: formatRange(band.min, band.max),
    publicMessage: formatRange(band.min, band.max),
    summary: `This project fits the ${band.label} range based on scope, features, readiness, and launch pressure.`,
    estimatorSummary: `${band.label} selected with a ${position} price position inside the tier range.`,
    reasons,
    complexityFlags: flags,
    complexityScore,
  };
}