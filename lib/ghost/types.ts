// "ops" retained for backward compat with stored ghost snapshots /
// sessions whose lane was persisted before the rename. New code writes
// "automation"; readers normalize via normalizeGhostLane().
export type GhostLane = "website" | "ops" | "automation" | "ecommerce";

export function normalizeGhostLane(lane: string | null | undefined): GhostLane {
  if (lane === "ops" || lane === "automation") return "automation";
  if (lane === "website" || lane === "ecommerce") return lane;
  return "website";
}

export type GhostProjectSnapshot = {
  lane: GhostLane;
  projectId: string;
  phase: string;
  status: string;
  healthState: "healthy" | "watch" | "at-risk";
  waitingOn: string;
  nextActionTitle: string;
  riskFlags: string[];
  latestActivitySummary: string;
  sourceFacts: string[];
};

export type GhostMessageAnalysis = {
  categoryLabel: string;
  sentimentLabel: "positive" | "neutral" | "negative";
  urgencyLabel: "low" | "medium" | "high";
  riskLabel: "low" | "medium" | "high";
  whatClientIsReallyAsking: string;
  coachingJson: Record<string, unknown>;
};

export type GhostReplySuggestion = {
  defaultReply: string;
  variants: {
    warmer?: string;
    firmer?: string;
    shorter?: string;
  };
  whyThisWorks: string;
  cautionText: string;
  nextActionText: string;
};

export type GhostAnswer = {
  directAnswer: string;
  context: string;
  nextAction: string;
  cautionRisk: string;
};
