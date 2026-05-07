// Phase 4 — Website rescue pricing engine.
//
// Tier selection between basic_rescue ($800–$1,500) and full_rescue_sprint
// ($1,500–$3,500). Scope is intentionally narrow — the audit positioned
// rescue as an entry service, not a rebuild in disguise. If the answers
// suggest a true rebuild, the engine flags it but still returns the
// rescue tier; the studio routes the lead toward Website Growth/Premium
// in the follow-up call.

import {
  PRICING_MESSAGES,
  PRICING_VERSION,
  RESCUE_TIER_CONFIG,
  formatRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  PricingReason,
  PricingResult,
  RescuePricingInput,
  RescueTierKey,
} from "@/lib/pricing/types";

function choosePosition(score: number): "low" | "middle" | "high" {
  if (score >= 4) return "high";
  if (score >= 2) return "middle";
  return "low";
}

export function getRescuePricing(
  input: RescuePricingInput,
): PricingResult<RescueTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  const issueCount = input.issues.length;
  const isUrgent = /critical|asap|urgent/i.test(input.urgency ?? "");
  const wantsSeoPreservation = /yes|need|critical/i.test(
    input.seoPreservation ?? "",
  );
  const platform = (input.platform ?? "").toLowerCase();
  const isComplexPlatform = /custom|other|squarespace/.test(platform);
  const noAccess = input.assetAccess.length === 0;
  const olderSite = /2020-earlier|2021/.test(input.builtWhen ?? "");

  // ── Issue count drives most of the score ──────────────────────────────
  if (issueCount <= 2) {
    reasons.push({
      label: "Focused issue list",
      note: "A short issue list usually fits inside a basic rescue.",
      impact: "supporting",
    });
  } else if (issueCount <= 4) {
    flags.push("Multiple issues");
    reasons.push({
      label: "Multiple issues",
      note: "Several connected issues usually push a rescue into a full sprint.",
      impact: "upward",
    });
    complexityScore += 2;
  } else {
    flags.push("Heavy issue count");
    reasons.push({
      label: "Wide issue scope",
      note: "Once we're touching this many areas, a rescue starts to look like a rebuild — we'll discuss on the call.",
      impact: "upward",
    });
    complexityScore += 3;
  }

  if (isUrgent) {
    flags.push("Urgent timeline");
    reasons.push({
      label: "Critical urgency",
      note: "Critical urgency requires immediate scheduling and may affect cost.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (wantsSeoPreservation) {
    flags.push("SEO preservation");
    reasons.push({
      label: "SEO preservation required",
      note: "Preserving rankings during fixes adds redirect mapping, careful content migration, and verification work.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (isComplexPlatform) {
    flags.push("Complex platform");
    reasons.push({
      label: "Complex platform",
      note: "Custom or non-standard platforms require deeper diagnosis before fixes can be scoped.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (noAccess) {
    flags.push("No access yet");
    reasons.push({
      label: "Access not yet provided",
      note: "We need site/CMS/hosting access before the fix sprint can start. We'll guide you through it on the call.",
      impact: "supporting",
    });
  }

  if (olderSite) {
    flags.push("Older site");
    reasons.push({
      label: "Older site",
      note: "Older sites carry technical debt that increases the chance of unexpected fixes.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  // ── Tier selection ────────────────────────────────────────────────────
  // basic_rescue = score 0–1, simple work
  // full_rescue_sprint = score 2+, multiple issues / urgency / SEO

  const isBasic = complexityScore <= 1;
  const tierKey: RescueTierKey = isBasic ? "basic_rescue" : "full_rescue_sprint";
  const tierLabel = isBasic
    ? RESCUE_TIER_CONFIG.basic_rescue.label
    : RESCUE_TIER_CONFIG.full_rescue_sprint.label;
  const band = isBasic
    ? RESCUE_TIER_CONFIG.basic_rescue
    : RESCUE_TIER_CONFIG.full_rescue_sprint;

  reasons.push({
    label: tierLabel,
    note: isBasic
      ? "Fits the basic rescue scope — focused fixes, predictable timeline."
      : "Multiple issues / urgency / SEO concerns push this into the full rescue sprint.",
    impact: "fit",
  });

  const position = choosePosition(complexityScore);
  const target = targetFromBand(band.min, band.max, position);

  return {
    version: PRICING_VERSION,
    lane: "rescue",
    tierKey,
    tierLabel,
    position,
    isCustomScope: false,
    band: { min: band.min, max: band.max, target },
    billingModel: "project",
    displayRange: formatRange(band.min, band.max),
    publicMessage: PRICING_MESSAGES.depositPolicy,
    summary: `${tierLabel} (${formatRange(band.min, band.max)})`,
    estimatorSummary: `Estimated rescue cost: ${formatRange(band.min, band.max)} based on the issues you described.`,
    reasons,
    complexityFlags: flags,
    complexityScore,
  };
}
