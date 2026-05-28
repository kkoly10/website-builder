// Phase 4.x — Client portal pricing engine.
//
// Four tiers match the /client-portals landing page (with a custom
// fallback for over-band signals):
//   - portal_add_on:       $5,000–$10,000   (most common starting point)
//   - standalone_portal:   $22,000–$45,000  (portal as its own product)
//   - enterprise_portal:   $75,000–$150,000 (multi-tenant + compliance + scale)
//   - custom_portal_scope: explicit over-band (multi-tenant + compliance +
//                          white-label + heavy integration surface). Admin
//                          will scope manually via a discovery sprint.
//
// Input shape mirrors PortalIntakeClient form values directly — no
// mapping layer in between. The form doesn't capture multi-tenant /
// white-label / custom-domain signals today; those default to false at
// intake time and admin refines the tier once portal_direction surfaces
// them.

import {
  PORTAL_TIER_CONFIG,
  PRICING_MESSAGES,
  PRICING_VERSION,
  formatRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  PortalPricingInput,
  PortalTierKey,
  PricingReason,
  PricingResult,
} from "@/lib/pricing/types";

function choosePosition(score: number): "low" | "middle" | "high" {
  if (score >= 5) return "high";
  if (score >= 2) return "middle";
  return "low";
}

// Maps the form's userCount strings to whether the project is small,
// medium, or large in user-base terms.
function userCountSignal(userCount: string): "small" | "medium" | "large" | "very_large" {
  switch (userCount) {
    case "under-25":    return "small";
    case "25-100":      return "medium";
    case "100-500":     return "medium";
    case "500-2000":    return "large";
    case "2000-plus":   return "very_large";
    default:            return "medium";
  }
}

function budgetIsEnterprise(budget: string): boolean {
  return budget === "100k-plus" || budget === "50k-100k";
}

function isCustomScopeSignal(input: PortalPricingInput): boolean {
  // Strongest possible enterprise signals together — multi-tenant +
  // compliance + white-label + heavy integration surface OR 2000+ users
  // with enterprise budget. Admin handles scoping via discovery sprint.
  const allEnterpriseSignals =
    input.isMultiTenant === true &&
    (input.compliance?.length ?? 0) > 0 &&
    input.hasWhiteLabel === true &&
    (input.integrations?.length ?? 0) >= 5;
  const veryLargeWithEnterpriseBudget =
    userCountSignal(input.userCount) === "very_large" && budgetIsEnterprise(input.budget);
  return allEnterpriseSignals || veryLargeWithEnterpriseBudget;
}

function isEnterpriseSignal(input: PortalPricingInput): boolean {
  // Strong: white-label + multi-tenant is the textbook enterprise pairing
  if (input.isMultiTenant && input.hasWhiteLabel) return true;
  // Strong: multi-tenant + compliance (e.g. HIPAA portal serving multiple orgs)
  if (input.isMultiTenant && (input.compliance?.length ?? 0) > 0) return true;
  // Scale: 500+ users typically implies enterprise infra and SLA
  const scale = userCountSignal(input.userCount);
  if (scale === "large" || scale === "very_large") return true;
  // Budget signal: explicit $100k+ budget always lands here
  if (input.budget === "100k-plus") return true;
  // Budget + multi-tenant combination
  if (input.budget === "50k-100k" && input.isMultiTenant) return true;
  return false;
}

// Add-on tier is currently UNREACHABLE from PortalIntakeClient (it hard-
// codes isAddOn: false, since /portal-intake is the standalone-portal
// form, not the add-on flow). The tier exists for a future caller — most
// likely the website intake adding a portal as an upsell, or an admin-
// side wizard that knows about an existing website build. Don't remove
// the path; preserve the option for that future surface.
function isAddOnSignal(input: PortalPricingInput): boolean {
  // Add-on is small-scope and bolted onto an existing website build.
  // Bail out of add-on if any heavy signal is set — a "small" add-on
  // with multi-tenant or white-label is a contradiction.
  if (input.isMultiTenant) return false;
  if (input.hasWhiteLabel) return false;
  if (input.hasCustomDomain) return false;
  if ((input.compliance?.length ?? 0) > 0) return false;
  const scale = userCountSignal(input.userCount);
  if (scale === "large" || scale === "very_large") return false;
  if (input.features.length > 4) return false;
  if (input.integrations.length > 2) return false;
  if (budgetIsEnterprise(input.budget)) return false;
  return input.isAddOn === true;
}

export function getPortalPricing(
  input: PortalPricingInput,
): PricingResult<PortalTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  // ── Signals (collected upfront for position scoring) ─────────────────

  const integrationCount = input.integrations.length;
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

  const complianceCount = input.compliance?.length ?? 0;
  if (complianceCount > 0) {
    flags.push("Compliance requirements");
    reasons.push({
      label: "Compliance constraints",
      note: "GDPR/HIPAA/SOC 2/PCI work requires audit logging, access controls, and infra hardening.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (input.isMultiTenant) {
    flags.push("Multi-tenant");
    reasons.push({
      label: "Multi-tenant data isolation",
      note: "Per-organization data isolation requires careful schema design, row-level security, and tenant-aware permissions.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (input.hasWhiteLabel) {
    flags.push("White-label");
    reasons.push({
      label: "Full white-label",
      note: "Custom branding throughout, no studio attribution, often custom domain.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.features.length >= 6) {
    reasons.push({
      label: "Broad feature set",
      note: "Six or more must-have features expand the build surface.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.hasTechTeam === "yes") {
    reasons.push({
      label: "Client tech team available",
      note: "Faster integrations and shared maintenance responsibility.",
      impact: "supporting",
    });
  }

  // Budget left blank or marked "needs guidance" → flag the recommendation
  // as indicative so admin re-scopes before quoting. The tier is still
  // returned (the engine still has to pick something) but the flag tells
  // downstream UI / admin that this estimate is provisional.
  if (input.budget === "" || input.budget === "guidance") {
    flags.push("Budget not specified — indicative estimate");
    reasons.push({
      label: "Budget not specified",
      note: "Client didn't pin a budget at intake. Admin should refine the tier with the client during scoping.",
      impact: "supporting",
    });
  }

  // ── Tier selection (most specific signal wins) ──────────────────────

  let tierKey: PortalTierKey;
  let tierLabel: string;
  let band: { min: number; max: number };
  let isCustomScope = false;

  if (isCustomScopeSignal(input)) {
    tierKey = "custom_portal_scope";
    tierLabel = "Custom portal scope";
    // Use enterprise band's max as floor; admin scopes the upper bound.
    band = {
      min: PORTAL_TIER_CONFIG.enterprise_portal.max,
      max: PORTAL_TIER_CONFIG.enterprise_portal.max * 2,
    };
    isCustomScope = true;
    flags.push("Custom scope required");
    reasons.push({
      label: "Beyond enterprise band",
      note: "Strong overlap of enterprise signals (multi-tenant + compliance + white-label + heavy integrations OR very-large user base) needs a custom-scope discovery sprint to land a realistic estimate.",
      impact: "custom",
    });
    complexityScore += 3;
  } else if (isEnterpriseSignal(input)) {
    tierKey = "enterprise_portal";
    tierLabel = PORTAL_TIER_CONFIG.enterprise_portal.label;
    band = PORTAL_TIER_CONFIG.enterprise_portal;
    reasons.push({
      label: "Enterprise scope",
      note: "Multi-tenant architecture, white-label branding, and/or compliance requirements warrant the enterprise tier with a discovery sprint.",
      impact: "fit",
    });
    flags.push("Discovery sprint required");
    complexityScore += 2;
  } else if (isAddOnSignal(input)) {
    tierKey = "portal_add_on";
    tierLabel = PORTAL_TIER_CONFIG.portal_add_on.label;
    band = PORTAL_TIER_CONFIG.portal_add_on;
    reasons.push({
      label: "Portal as add-on",
      note: "Scoped as a smaller surface bolted onto an existing website build.",
      impact: "fit",
    });
  } else {
    // Default to standalone — the middle path. Most portals land here.
    tierKey = "standalone_portal";
    tierLabel = PORTAL_TIER_CONFIG.standalone_portal.label;
    band = PORTAL_TIER_CONFIG.standalone_portal;
    reasons.push({
      label: "Standalone portal",
      note: "Portal as its own product: payments, files, messaging, admin tools, multi-client workspace.",
      impact: "fit",
    });
  }

  const position = choosePosition(complexityScore);
  const target = targetFromBand(band.min, band.max, position);

  return {
    version: PRICING_VERSION,
    lane: "client_portal",
    tierKey,
    tierLabel,
    position,
    isCustomScope,
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
