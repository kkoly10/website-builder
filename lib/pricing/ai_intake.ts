// Phase 5 — AI integration pricing engine.
//
// Tier selection logic:
//   ai_single_integration: suggest/confirm autonomy, single use case, low risk, no compliance
//   ai_production_system: auto-handle autonomy, financial/legal risk, compliance data, or high volume
//   ai_architecture_build: fully autonomous + high-stakes, or sensitive data + very high volume
//   custom_ai_scope: enterprise combinations beyond the standard bands

import {
  AI_INTAKE_TIER_CONFIG,
  PRICING_MESSAGES,
  PRICING_VERSION,
  formatRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  AiIntakePricingInput,
  AiIntakeTierKey,
  PricingReason,
  PricingResult,
} from "@/lib/pricing/types";

function choosePosition(score: number): "low" | "middle" | "high" {
  if (score >= 5) return "high";
  if (score >= 2) return "middle";
  return "low";
}

export function getAiIntakePricing(
  input: AiIntakePricingInput,
): PricingResult<AiIntakeTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  const isAutonomous =
    input.autonomyLevel === "autonomous" || input.autonomyLevel === "auto_low";
  const isFullyAutonomous = input.autonomyLevel === "autonomous";
  const isHighRisk = input.mistakeConsequence === "financial_legal";
  const isClientFacing =
    input.aiOutputAudience === "clients" || input.aiOutputAudience === "both";
  const requiresAudit = input.auditTrail === "required";
  const hasComplianceData = input.dataClassification.some((d) =>
    ["financial", "health", "legal"].includes(d),
  );
  const isHighVolume =
    input.dailyVolume === "1k_10k" || input.dailyVolume === "10k_plus";
  const isVeryHighVolume = input.dailyVolume === "10k_plus";
  const isUrgent = input.timeline === "asap";

  if (isFullyAutonomous) {
    flags.push("Fully autonomous");
    reasons.push({
      label: "Fully autonomous operation",
      note: "Systems that act end-to-end without per-decision human confirmation require multi-layer safety gates, deny lists, confidence thresholds, and extensive edge-case coverage.",
      impact: "upward",
    });
    complexityScore += 3;
  } else if (isAutonomous) {
    flags.push("Auto-handle autonomy");
    reasons.push({
      label: "Autonomous routine handling",
      note: "Auto-resolving clear-cut cases requires confidence gating and a well-defined escalation path for edge cases.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (isHighRisk) {
    flags.push("Financial / legal risk");
    reasons.push({
      label: "High-stakes output",
      note: "AI mistakes with financial or legal consequences require additional safety layers, audit trails, and confidence-threshold gating before any action executes.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (isClientFacing) {
    reasons.push({
      label: "Client-facing AI output",
      note: "AI output seen directly by end-users requires higher reliability standards, graceful error handling, and clear feedback loops.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (requiresAudit) {
    flags.push("Full audit trail");
    reasons.push({
      label: "Audit trail required",
      note: "Logging every AI decision with full input, output, and execution context adds infrastructure, storage, and query requirements.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (hasComplianceData) {
    flags.push("Compliance-sensitive data");
    reasons.push({
      label: "Sensitive data classification",
      note: "Financial, health, or legal data requires access controls, encryption at rest and in transit, data minimisation, and compliance review before any AI processing.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (isHighVolume) {
    flags.push("High operation volume");
    reasons.push({
      label: "High daily AI volume",
      note: "1,000+ daily operations require rate limiting, token-cost budgeting, usage monitoring, and a scalable architecture to avoid runaway spend.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (isUrgent) {
    flags.push("Urgent timeline");
    reasons.push({
      label: "Compressed timeline",
      note: "Faster delivery requires extra scoping discipline upfront and may affect total cost.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  // Tier selection — most specific signals first.
  let tierKey: AiIntakeTierKey;
  let tierLabel: string;
  let band: { min: number; max: number };
  let isCustomScope = false;

  const isEnterpriseScope =
    (isFullyAutonomous && isHighRisk && hasComplianceData) ||
    (isVeryHighVolume && hasComplianceData && requiresAudit) ||
    complexityScore >= 9;

  const isArchitectureTier =
    (isFullyAutonomous && isHighRisk) ||
    (isFullyAutonomous && hasComplianceData) ||
    (hasComplianceData && isVeryHighVolume) ||
    (isAutonomous && hasComplianceData && requiresAudit);

  if (isEnterpriseScope) {
    tierKey = "custom_ai_scope";
    tierLabel = "Custom AI Architecture";
    band = { min: 65000, max: 120000 };
    isCustomScope = true;
    reasons.push({
      label: "Enterprise AI scope",
      note: "The combination of full autonomy, sensitive data, high volume, and compliance requirements places this outside our standard tiers. A strategy call is required before scoping.",
      impact: "custom",
    });
  } else if (isArchitectureTier) {
    tierKey = "ai_architecture_build";
    tierLabel = AI_INTAKE_TIER_CONFIG.ai_architecture_build.label;
    band = AI_INTAKE_TIER_CONFIG.ai_architecture_build;
    reasons.push({
      label: "Full AI architecture scope",
      note: "Autonomous AI with high-stakes output, sensitive data, or very high volume requires a full architecture engagement — multi-layer safety design, audit infrastructure, and formal testing.",
      impact: "fit",
    });
    complexityScore += 2;
  } else if (
    isAutonomous ||
    isHighRisk ||
    hasComplianceData ||
    (isClientFacing && requiresAudit) ||
    isHighVolume
  ) {
    tierKey = "ai_production_system";
    tierLabel = AI_INTAKE_TIER_CONFIG.ai_production_system.label;
    band = AI_INTAKE_TIER_CONFIG.ai_production_system;
    reasons.push({
      label: "Production AI system",
      note: "This use case requires production-grade safety gates, reliability engineering, and proper monitoring — beyond a simple feature integration.",
      impact: "fit",
    });
  } else {
    tierKey = "ai_single_integration";
    tierLabel = AI_INTAKE_TIER_CONFIG.ai_single_integration.label;
    band = AI_INTAKE_TIER_CONFIG.ai_single_integration;
    reasons.push({
      label: "Single AI feature integration",
      note: "A targeted AI feature with human confirmation and low-risk output is a contained, well-defined integration.",
      impact: "fit",
    });
  }

  const position = isCustomScope ? "custom" : choosePosition(complexityScore);
  const target = isCustomScope
    ? band.min
    : targetFromBand(band.min, band.max, position as "low" | "middle" | "high");

  return {
    version: PRICING_VERSION,
    lane: "ai_integration",
    tierKey,
    tierLabel,
    position,
    isCustomScope,
    band: { min: band.min, max: band.max, target },
    billingModel: "project",
    displayRange: isCustomScope
      ? "Custom scope — strategy call required"
      : formatRange(band.min, band.max),
    publicMessage: isCustomScope
      ? PRICING_MESSAGES.aiIntakeCustom
      : PRICING_MESSAGES.depositPolicy,
    summary: `${tierLabel} (${isCustomScope ? "Custom scope" : formatRange(band.min, band.max)})`,
    estimatorSummary: isCustomScope
      ? "This looks like enterprise AI scope — let's scope it together properly first."
      : `Estimated investment: ${formatRange(band.min, band.max)} based on your use case and requirements.`,
    reasons,
    complexityFlags: flags,
    complexityScore,
  };
}
