// Phase 4 — Custom web app pricing engine.
//
// Tier selection based on signals collected in CustomAppIntakeClient:
//   - small_internal_tool: internal team only, low scale, simple integrations
//   - portal_dashboard_mvp: client-facing dashboard / portal MVP signals
//   - saas_mvp: paying customers, multi-tenant signals (billing, subs)
//   - full_client_portal: explicit client portal language or composite
//     signals (payments + files + messaging + admin)
//
// Bands come from WEB_APP_TIER_CONFIG in config.ts which already reflects
// the audit's recommended raises.

import {
  PRICING_MESSAGES,
  PRICING_VERSION,
  WEB_APP_TIER_CONFIG,
  formatRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  PricingReason,
  PricingResult,
  WebAppPricingInput,
  WebAppTierKey,
} from "@/lib/pricing/types";

function choosePosition(score: number): "low" | "middle" | "high" {
  if (score >= 5) return "high";
  if (score >= 2) return "middle";
  return "low";
}

function describesClientPortal(input: WebAppPricingInput): boolean {
  // Strong signals that the client wants a multi-tenant client portal
  // (CrecyStudio's strongest differentiator per the audit). Triggers
  // the full_client_portal tier when 2+ signals overlap.
  const desc = `${input.projectDescription} ${input.integrationNotes}`.toLowerCase();
  let score = 0;
  if (/client portal|customer portal|partner portal|vendor portal/.test(desc)) score += 2;
  if (/messaging|chat|inbox/.test(desc)) score += 1;
  if (/file uploads?|document/.test(desc)) score += 1;
  if (/billing|invoice|payments?/.test(desc)) score += 1;
  if (/admin (dashboard|panel)/.test(desc)) score += 1;
  if (/role|permission/.test(desc)) score += 1;
  return score >= 2;
}

function isSaaSSignal(input: WebAppPricingInput): boolean {
  const desc = `${input.projectDescription} ${input.integrationNotes}`.toLowerCase();
  if (/saas|subscription|recurring billing|multi.?tenant/.test(desc)) return true;
  if (input.targetUsers === "paying-customers" && /sign.?up|self.?serve|onboard/.test(desc)) {
    return true;
  }
  return false;
}

function isInternalToolSignal(input: WebAppPricingInput): boolean {
  if (input.targetUsers !== "internal-team") return false;
  const desc = input.projectDescription.toLowerCase();
  // Internal-team + admin-style or workflow-style description
  if (/admin|crud|tracker|inventory|workflow/.test(desc)) return true;
  // Generic catch-all: small internal team + small scale
  if (/^(1.?5|under.?10|small)/i.test(input.userScale)) return true;
  return false;
}

export function getWebAppPricing(
  input: WebAppPricingInput,
): PricingResult<WebAppTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  const integrationCount = input.integrations.length;
  const complianceCount = input.compliance.length;
  const isUrgent = /asap|urgent|critical|days/i.test(input.timeline ?? "");

  // Volume signals
  if (integrationCount >= 4) {
    flags.push("Many integrations");
    reasons.push({
      label: "Heavy integration surface",
      note: "Multiple external systems require careful auth, rate limiting, and reconciliation.",
      impact: "upward",
    });
    complexityScore += 2;
  } else if (integrationCount >= 2) {
    reasons.push({
      label: "Multiple integrations",
      note: "Each integration adds setup, error handling, and ongoing maintenance.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (complianceCount > 0) {
    flags.push("Compliance requirements");
    reasons.push({
      label: "Compliance constraints",
      note: "Compliance work (HIPAA, SOC 2, GDPR, etc.) requires audit logging, access controls, and infra hardening.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (isUrgent) {
    flags.push("Urgent timeline");
    reasons.push({
      label: "Compressed timeline",
      note: "Faster delivery requires extra scoping discipline and may affect cost.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.scopePreference === "full-scope") {
    complexityScore += 1;
    reasons.push({
      label: "Full-scope build",
      note: "Building beyond MVP scope expands what we ship before launch.",
      impact: "upward",
    });
  } else if (input.scopePreference === "mvp-only") {
    reasons.push({
      label: "MVP-first scope",
      note: "Focused MVP keeps build cost contained while validating with real users.",
      impact: "supporting",
    });
  }

  // ── Tier selection ────────────────────────────────────────────────────
  // Start from the most specific signal and fall through to the simpler
  // tiers. Order matters: full_client_portal beats saas_mvp beats
  // portal_dashboard_mvp beats small_internal_tool.

  let tierKey: WebAppTierKey;
  let tierLabel: string;
  let band: { min: number; max: number };

  if (describesClientPortal(input)) {
    tierKey = "full_client_portal";
    tierLabel = WEB_APP_TIER_CONFIG.full_client_portal.label;
    band = WEB_APP_TIER_CONFIG.full_client_portal;
    reasons.push({
      label: "Client portal scope",
      note: "Multi-tenant client portals with messaging, files, payments, and admin tools warrant a dedicated tier — the most differentiated work CrecyStudio ships.",
      impact: "fit",
    });
    complexityScore += 2;
  } else if (isSaaSSignal(input)) {
    tierKey = "saas_mvp";
    tierLabel = WEB_APP_TIER_CONFIG.saas_mvp.label;
    band = WEB_APP_TIER_CONFIG.saas_mvp;
    reasons.push({
      label: "SaaS / multi-tenant signals",
      note: "Subscription billing, sign-up flows, and tenant isolation push the work into the SaaS MVP tier.",
      impact: "fit",
    });
    complexityScore += 2;
  } else if (isInternalToolSignal(input)) {
    tierKey = "small_internal_tool";
    tierLabel = WEB_APP_TIER_CONFIG.small_internal_tool.label;
    band = WEB_APP_TIER_CONFIG.small_internal_tool;
    reasons.push({
      label: "Internal tool scope",
      note: "Internal team + focused admin/workflow shape keeps this in the small internal tool band.",
      impact: "fit",
    });
  } else {
    // Default to portal/dashboard MVP — the audit's "main service-business
    // package" for custom web apps.
    tierKey = "portal_dashboard_mvp";
    tierLabel = WEB_APP_TIER_CONFIG.portal_dashboard_mvp.label;
    band = WEB_APP_TIER_CONFIG.portal_dashboard_mvp;
    reasons.push({
      label: "Portal / dashboard MVP",
      note: "Mixed audience or dashboard-style scope lands in the portal/dashboard MVP tier.",
      impact: "fit",
    });
  }

  const position = choosePosition(complexityScore);
  const target = targetFromBand(band.min, band.max, position);

  return {
    version: PRICING_VERSION,
    lane: "web_app",
    tierKey,
    tierLabel,
    position,
    isCustomScope: false,
    band: { min: band.min, max: band.max, target },
    billingModel: "project",
    displayRange: formatRange(band.min, band.max),
    publicMessage: PRICING_MESSAGES.depositPolicy,
    summary: `${tierLabel} (${formatRange(band.min, band.max)})`,
    estimatorSummary: `Estimated investment: ${formatRange(band.min, band.max)} based on the scope you described.`,
    reasons,
    complexityFlags: flags,
    complexityScore,
  };
}
