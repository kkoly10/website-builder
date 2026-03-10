import type { GhostAnswer, GhostProjectSnapshot } from "@/lib/ghost/types";

function findFact(snapshot: GhostProjectSnapshot, prefixes: string[]) {
  return (
    snapshot.sourceFacts.find((fact) =>
      prefixes.some((prefix) => fact.toLowerCase().startsWith(prefix.toLowerCase()))
    ) || null
  );
}

function valueFromFact(fact: string | null, fallback = "No matching source fact found.") {
  if (!fact) return fallback;
  const idx = fact.indexOf("=");
  if (idx === -1) return fact;
  return fact.slice(idx + 1);
}

function riskText(snapshot: GhostProjectSnapshot) {
  return snapshot.riskFlags.length
    ? snapshot.riskFlags.join("; ")
    : "No major risk flags detected.";
}

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

  if (q.includes("waiting") || q.includes("blocked") || q.includes("stuck")) {
    return {
      directAnswer: snapshot.waitingOn,
      context: snapshot.latestActivitySummary,
      nextAction: snapshot.nextActionTitle,
      cautionRisk: riskText(snapshot),
    };
  }

  if (q.includes("next") || q.includes("owner") || q.includes("do now") || q.includes("follow up")) {
    return {
      directAnswer: snapshot.nextActionTitle,
      context: `${snapshot.lane.toUpperCase()} lane is currently ${snapshot.status} (${snapshot.healthState}).`,
      nextAction: "Assign the owner and due time for that action, then post a timestamped update.",
      cautionRisk: riskText(snapshot),
    };
  }

  if (q.includes("risk") || q.includes("red flag") || q.includes("danger") || q.includes("watch")) {
    return {
      directAnswer: snapshot.riskFlags.length
        ? snapshot.riskFlags.join("; ")
        : "No active risk flags right now.",
      context: snapshot.latestActivitySummary,
      nextAction: snapshot.nextActionTitle,
      cautionRisk: "Do not promise outcomes until the current blockers are resolved.",
    };
  }

  if (q.includes("status") || q.includes("health") || q.includes("phase")) {
    return {
      directAnswer: `${snapshot.lane.toUpperCase()} project is ${snapshot.status} (${snapshot.healthState}).`,
      context: snapshot.latestActivitySummary,
      nextAction: snapshot.nextActionTitle,
      cautionRisk: riskText(snapshot),
    };
  }

  if (
    q.includes("price") ||
    q.includes("quote") ||
    q.includes("budget") ||
    q.includes("cost") ||
    q.includes("setup") ||
    q.includes("monthly")
  ) {
    const quoteStatus = findFact(snapshot, ["ecom_quote_status=", "quote.status="]);
    const setupFee = findFact(snapshot, ["setup_fee=", "deposit_amount="]);
    const monthlyFee = findFact(snapshot, ["monthly_fee="]);
    const budgetRange = findFact(snapshot, ["budget_range=", "recommendation_price_range="]);

    const parts = [
      valueFromFact(quoteStatus, ""),
      valueFromFact(setupFee, ""),
      valueFromFact(monthlyFee, ""),
      valueFromFact(budgetRange, ""),
    ].filter(Boolean);

    return {
      directAnswer: parts.length
        ? parts.join(" • ")
        : "Pricing/quote details are limited in current source facts for this project.",
      context: snapshot.latestActivitySummary,
      nextAction: snapshot.nextActionTitle,
      cautionRisk: "Do not quote new numbers unless they match the approved source-of-truth records.",
    };
  }

  if (q.includes("call") || q.includes("meeting") || q.includes("discovery")) {
    const callStatus = findFact(snapshot, ["call_status=", "ops_call_exists=", "call_exists="]);

    return {
      directAnswer: callStatus
        ? `Call context: ${valueFromFact(callStatus)}`
        : "No call status fact found in current source records.",
      context: snapshot.latestActivitySummary,
      nextAction: snapshot.nextActionTitle,
      cautionRisk: riskText(snapshot),
    };
  }

  if (q.includes("preview") || q.includes("link") || q.includes("design")) {
    const previewFact = findFact(snapshot, ["preview_url="]);

    return {
      directAnswer: previewFact
        ? `Preview link: ${valueFromFact(previewFact)}`
        : "No preview link found in current source records.",
      context: snapshot.sourceFacts.join(" | "),
      nextAction: "If a preview should exist, add or update the preview URL in the source records.",
      cautionRisk: "Do not send speculative or stale preview links to clients.",
    };
  }

  return {
    directAnswer: `${snapshot.lane.toUpperCase()} project is ${snapshot.status} (${snapshot.healthState}).`,
    context: `${snapshot.latestActivitySummary} Waiting on: ${snapshot.waitingOn}.`,
    nextAction: snapshot.nextActionTitle,
    cautionRisk: riskText(snapshot),
  };
}