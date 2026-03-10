import type { GhostMessageAnalysis, GhostReplySuggestion } from "@/lib/ghost/types";

const POSITIVE_WORDS = ["thanks", "great", "love", "awesome", "appreciate"];
const NEGATIVE_WORDS = ["upset", "frustrated", "disappointed", "angry", "bad", "worried"];
const URGENT_WORDS = ["urgent", "asap", "today", "immediately", "deadline", "blocked", "stuck"];
const MONEY_WORDS = ["price", "cost", "budget", "invoice", "payment", "deposit", "contract"];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function analyzeClientMessage(message: string): GhostMessageAnalysis {
  const raw = message.trim();
  const text = raw.toLowerCase();

  const sentimentLabel = includesAny(text, NEGATIVE_WORDS)
    ? "negative"
    : includesAny(text, POSITIVE_WORDS)
    ? "positive"
    : "neutral";

  const urgencyLabel = includesAny(text, URGENT_WORDS) ? "high" : raw.length > 240 ? "medium" : "low";

  const categoryLabel = includesAny(text, MONEY_WORDS)
    ? "pricing_or_contract"
    : text.includes("change") || text.includes("revision")
    ? "scope_change"
    : text.includes("when") || text.includes("timeline")
    ? "timeline_question"
    : "general_update";

  const riskLabel = categoryLabel === "pricing_or_contract" || urgencyLabel === "high" || sentimentLabel === "negative" ? "high" : "low";

  return {
    categoryLabel,
    sentimentLabel,
    urgencyLabel,
    riskLabel,
    whatClientIsReallyAsking:
      categoryLabel === "pricing_or_contract"
        ? "They want clarity on money/terms and need a confident, bounded answer."
        : categoryLabel === "scope_change"
        ? "They are asking for change and need scope boundaries plus next step."
        : categoryLabel === "timeline_question"
        ? "They need delivery confidence and a concrete next milestone."
        : "They want reassurance and a clear next action.",
    coachingJson: {
      acknowledgeEmotion: sentimentLabel === "negative",
      keepBoundariesVisible: categoryLabel === "scope_change" || categoryLabel === "pricing_or_contract",
      suggestNextAction: true,
    },
  };
}

export function buildReplySuggestion(message: string, analysis: GhostMessageAnalysis): GhostReplySuggestion {
  const safePrefix = analysis.sentimentLabel === "negative" ? "Thanks for flagging this quickly." : "Thanks for the update.";

  const mainBody =
    analysis.categoryLabel === "pricing_or_contract"
      ? "I want to keep us aligned with your current agreement and budget. I’ll confirm the exact line item and share the best approved path before any new work begins."
      : analysis.categoryLabel === "scope_change"
      ? "We can support that change request. I’ll map it against the current scope and send the best option (in-scope vs. change-order) so there are no surprises."
      : analysis.categoryLabel === "timeline_question"
      ? "You’re right to ask about timing. I’ll confirm the current milestone status and send the next concrete delivery date today."
      : "I’ve got this and will post a clear status update plus next step shortly.";

  const defaultReply = `${safePrefix} ${mainBody}`;

  return {
    defaultReply,
    variants: {
      warmer: `${safePrefix} Appreciate your patience here. ${mainBody}`,
      firmer: `Thanks for the note. To avoid confusion, we’ll proceed based on approved scope and documented milestones. ${mainBody}`,
      shorter: `${safePrefix} ${analysis.categoryLabel === "timeline_question" ? "I’ll send the next delivery date today." : "I’ll send the next action today."}`,
    },
    whyThisWorks: "It acknowledges the client, stays grounded in current facts, avoids over-promising, and gives a specific follow-up action.",
    cautionText:
      analysis.riskLabel === "high"
        ? "High-risk phrasing zone: avoid promising delivery dates, free extra scope, or financial concessions without checking current agreement/payment status."
        : "Keep wording factual and tie next steps to current project status.",
    nextActionText: "Post a timestamped update in the project workspace and confirm owner + due time for the next step.",
  };
}
