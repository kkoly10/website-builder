import type { GhostAnswer, GhostProjectSnapshot } from "@/lib/ghost/types";

export function answerProjectQuestion(snapshot: GhostProjectSnapshot | null, question: string): GhostAnswer {
  if (!snapshot) {
    return {
      directAnswer: "I couldn't find project records for that lane/id.",
      context: "Ghost Admin only answers from existing source-of-truth rows.",
      nextAction: "Verify the lane and project ID, then retry.",
      cautionRisk: "No inferred/projected facts were generated.",
    };
  }

  const q = question.toLowerCase();

  if (q.includes("waiting")) {
    return {
      directAnswer: snapshot.waitingOn,
      context: snapshot.latestActivitySummary,
      nextAction: snapshot.nextActionTitle,
      cautionRisk: snapshot.riskFlags[0] || "No active risk flags right now.",
    };
  }

  if (q.includes("preview")) {
    const previewFact = snapshot.sourceFacts.find((f) => f.toLowerCase().includes("preview"));
    return {
      directAnswer: previewFact ? previewFact.replace("preview_url=", "Preview link: ") : "No preview link found in current source records.",
      context: snapshot.sourceFacts.join(" | "),
      nextAction: "If preview is expected, add/update the preview URL in source records.",
      cautionRisk: "Do not send speculative links to clients.",
    };
  }

  return {
    directAnswer: `${snapshot.lane.toUpperCase()} project is ${snapshot.status} (${snapshot.healthState}).`,
    context: snapshot.latestActivitySummary,
    nextAction: snapshot.nextActionTitle,
    cautionRisk: snapshot.riskFlags.length ? snapshot.riskFlags.join("; ") : "No major risk flags detected.",
  };
}
