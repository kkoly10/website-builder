import {
  OPS_TIER_CONFIG,
  PRICING_MESSAGES,
  PRICING_VERSION,
  formatRange,
  targetFromBand,
} from "@/lib/pricing/config";
import type {
  OpsPricingInput,
  OpsTierKey,
  PricingReason,
  PricingResult,
} from "@/lib/pricing/types";

function choosePosition(score: number): "low" | "middle" | "high" {
  if (score >= 5) return "high";
  if (score >= 2) return "middle";
  return "low";
}

function includesLegacyTool(tools: string[]) {
  return tools.some((t) => /legacy/i.test(t));
}

function includesDashboardWorkflow(workflows: string[]) {
  return workflows.some((w) => /dashboard/i.test(w));
}

function includesBillingWorkflow(workflows: string[]) {
  return workflows.some((w) => /invoice|payment|billing/i.test(w));
}

function isUrgent(urgency: string) {
  return /asap|costing us now|urgent/i.test(String(urgency || ""));
}

export function getOpsPricing(
  input: OpsPricingInput
): PricingResult<OpsTierKey> {
  const reasons: PricingReason[] = [];
  const flags: string[] = [];
  let complexityScore = 0;

  const workflowCount = input.workflowsNeeded.length;
  const toolCount = input.currentTools.length;
  const painCount = input.painPoints.length;
  const hasLegacy = includesLegacyTool(input.currentTools);
  const hasDashboard = includesDashboardWorkflow(input.workflowsNeeded);
  const hasBilling = includesBillingWorkflow(input.workflowsNeeded);
  const urgent = isUrgent(input.urgency);
  const triedBefore = !/first time/i.test(String(input.triedBefore || ""));
  const teamSize = String(input.teamSize || "");

  if (workflowCount <= 1) {
    reasons.push({
      label: "Focused workflow need",
      note: "This looks like a single main process fix rather than a full systems overhaul.",
      impact: "supporting",
    });
  } else if (workflowCount <= 4) {
    flags.push("Multiple workflows");
    reasons.push({
      label: "Multi-step workflow scope",
      note: "Connecting multiple workflows usually pushes the project into a system build.",
      impact: "upward",
    });
    complexityScore += 2;
  } else {
    flags.push("Heavy workflow count");
    complexityScore += 4;
  }

  if (toolCount >= 3) {
    flags.push("Several tools involved");
    reasons.push({
      label: "Multi-tool environment",
      note: "More connected tools usually means more mapping, testing, and cleanup.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (hasLegacy) {
    flags.push("Legacy software");
    reasons.push({
      label: "Legacy / hard-to-integrate software",
      note: "Legacy tools increase unknowns, workaround risk, and setup effort.",
      impact: "upward",
    });
    complexityScore += 2;
  }

  if (hasDashboard) {
    flags.push("Dashboard / reporting");
    reasons.push({
      label: "Dashboard / reporting requirement",
      note: "Reporting and dashboard views add structure, metrics, and admin logic.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (hasBilling) {
    flags.push("Billing / payment workflow");
    reasons.push({
      label: "Billing / invoice automation",
      note: "Billing flow work usually needs stronger caution because it affects real money movement.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (painCount >= 4) {
    flags.push("High operational pain");
    reasons.push({
      label: "Many active pain points",
      note: "A business with several major pain points usually needs more discovery and change management.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (triedBefore) {
    flags.push("Previous failed fix");
    reasons.push({
      label: "Previous attempt already failed",
      note: "If this was already attempted before, expectations and cleanup risk usually go up.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (urgent) {
    flags.push("Urgent ops problem");
    reasons.push({
      label: "Urgency",
      note: "High urgency usually increases coordination pressure and reduces room for discovery.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  if (/16-50|50\+/i.test(teamSize)) {
    flags.push("Larger team footprint");
    reasons.push({
      label: "Larger team size",
      note: "More people often means more handoffs, approvals, and training considerations.",
      impact: "upward",
    });
    complexityScore += 1;
  }

  const isCustom =
    workflowCount > 4 ||
    (hasLegacy && workflowCount >= 3) ||
    (hasDashboard && workflowCount >= 4) ||
    (painCount >= 5 && workflowCount >= 3) ||
    (toolCount >= 5 && workflowCount >= 4);

  if (isCustom) {
    reasons.unshift({
      label: "Custom-scope threshold reached",
      note: "This operations request is beyond the normal instant-range bands and should be scoped on a strategy call.",
      impact: "custom",
    });

    return {
      version: PRICING_VERSION,
      lane: "automation",
      tierKey: "custom_ops_scope",
      tierLabel: "Custom Ops Scope",
      position: "custom",
      isCustomScope: true,
      band: {
        min: OPS_TIER_CONFIG.ops_system_build.max,
        max: OPS_TIER_CONFIG.ops_system_build.max,
        target: OPS_TIER_CONFIG.ops_system_build.max,
      },
      displayRange: PRICING_MESSAGES.opsCustom,
      publicMessage: PRICING_MESSAGES.opsCustom,
      summary:
        "This ops request crosses the normal instant-range threshold and should be scoped manually.",
      estimatorSummary:
        "Custom ops scope triggered by workflow count, tool complexity, or reporting/system depth.",
      reasons,
      complexityFlags: flags,
      complexityScore: Math.max(complexityScore, 7),
    };
  }

  let tierKey: "quick_workflow_fix" | "ops_system_build" = "quick_workflow_fix";

  if (
    workflowCount <= 1 &&
    toolCount <= 2 &&
    !hasLegacy &&
    !hasDashboard &&
    painCount <= 3
  ) {
    tierKey = "quick_workflow_fix";
  } else {
    tierKey = "ops_system_build";
  }

  const band = OPS_TIER_CONFIG[tierKey];
  const position = choosePosition(complexityScore);
  const target = targetFromBand(band.min, band.max, position);

  if (reasons.length === 0) {
    reasons.push({
      label: "Standard ops fit",
      note: "This request fits a normal workflow improvement engagement.",
      impact: "supporting",
    });
  }

  return {
    version: PRICING_VERSION,
    lane: "automation",
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
    summary: `This request fits the ${band.label} range based on workflow count, tools, urgency, and operational friction.`,
    estimatorSummary: `${band.label} selected with a ${position} price position inside the tier range.`,
    reasons,
    complexityFlags: flags,
    complexityScore,
  };
}