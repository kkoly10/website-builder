// Phase 4.x — Client portal pricing engine.
//
// Three tiers match the /client-portals landing page:
//   - portal_add_on:      $5,000–$10,000   (most common starting point)
//   - standalone_portal:  $22,000–$45,000  (portal as its own product)
//   - enterprise_portal:  $75,000–$150,000 (multi-tenant, white-label, compliance)
//
// Plus a custom_portal_scope fallback for explicitly over-tier inputs.
//
// Tier selection is signal-based, not budget-driven (the audit noted
// budget can mislead — let the scope speak). Strongest signal wins:
//   - Enterprise: multi-tenant + compliance + white-label, OR very large
//     user base, OR budget ≥ $50k with multi-tenant requirements.
//   - Add-on: bolted onto an existing website build, small scope,
//     single-tenant, no compliance, ≤50 users.
//   - Standalone: everything in between.

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

function isEnterpriseSignal(input: PortalPricingInput): boolean {
  // Strong: white-label + multi-tenant is the textbook enterprise pairing
  if (input.hasWhiteLabel && input.isMultiTenant) return true;
  // Strong: multi-tenant + compliance (e.g. HIPAA portal serving multiple orgs)
  if (input.isMultiTenant && input.hasCompliance) return true;
  // Scale: 200+ users typically implies enterprise infra and SLA
  if (input.userCount === "200+") return true;
  // Budget signal: explicit $100k+ budget always lands here
  if (input.budget === "100k_plus") return true;
  // Budget + multi-tenant combination
  if (input.budget === "50k_100k" && input.isMultiTenant) return true;
  return false;
}

function isAddOnSignal(input: PortalPricingInput): boolean {
  // Add-on is small-scope and bolted onto an existing website build.
  // Bail out of add-on if any of the following heavy signals are set —
  // a "small" add-on with white-label is a contradiction.
  if (input.isMultiTenant) return false;
  if (input.hasCompliance) return false;
  if (input.hasWhiteLabel) return false;
  if (input.hasCustomDomain) return false;
  if (input.userCount === "51-200" || input.userCount === "200+") return false;
  if (input.featureCount > 4) return false;
  if (input.integrationCount > 2) return false;
  if (input.budget === "25k_50k" || input.budget === "50k_100k" || input.budget === "100k_plus") {
    return false;
  }
  // Final check: is it actually framed as an add-on?
  return input.isAddOn === true;
}

export function getPortalPricing(
  input: PortalPricingInput,
): PricingResult<PortalTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  // ── Signals (collected upfront for position scoring) ─────────────────

  if (input.integrationCount >= 4) {
    flags.push("Many integrations");
    reasons.push({
      label: "Heavy integration surface",
      note: "Multiple external systems require careful auth, rate limiting, and reconciliation.",
      impact: "upward",
    });
    complexityScore += 2;
  } else if (input.integrationCount >= 2) {
    reasons.push({
      label: "Multiple integrations",
      note: "Each integration adds setup, error handling, and ongoing maintenance.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.hasCompliance) {
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

  if (input.featureCount >= 6) {
    reasons.push({
      label: "Broad feature set",
      note: "Six or more must-have features expand the build surface.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (input.techTeam === "yes") {
    reasons.push({
      label: "Client tech team available",
      note: "Faster integrations and shared maintenance responsibility.",
      impact: "supporting",
    });
  }

  // ── Tier selection (most specific signal wins) ──────────────────────

  let tierKey: PortalTierKey;
  let tierLabel: string;
  let band: { min: number; max: number };
  let isCustomScope = false;

  if (isEnterpriseSignal(input)) {
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
      note: "Scoped as a smaller surface bolted onto an existing website build. Common starting point.",
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
