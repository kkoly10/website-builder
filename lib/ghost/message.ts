import type {
  GhostMessageAnalysis,
  GhostProjectSnapshot,
  GhostReplySuggestion,
} from "@/lib/ghost/types";
import type { GhostSessionLane } from "@/lib/ghost/session";

type HistoryRole = "client" | "admin" | "system";

type HistoryItem = {
  role: HistoryRole;
  text: string;
  createdAt?: string | null;
};

type GhostMessageContext = {
  lane?: GhostSessionLane;
  projectId?: string | null;
  threadId?: string | null;
  history?: HistoryItem[];
  snapshot?: GhostProjectSnapshot | null;
};

const POSITIVE_WORDS = ["thanks", "great", "love", "awesome", "appreciate", "perfect"];
const NEGATIVE_WORDS = ["upset", "frustrated", "disappointed", "angry", "bad", "worried", "concerned"];
const URGENT_WORDS = ["urgent", "asap", "today", "immediately", "deadline", "blocked", "stuck"];
const MONEY_WORDS = ["price", "cost", "budget", "invoice", "payment", "deposit", "contract", "quote"];
const TIMELINE_WORDS = ["when", "timeline", "delivery", "launch", "launching", "date", "eta"];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function sanitizeHistory(history?: HistoryItem[]) {
  return Array.isArray(history)
    ? history
        .map((item) => ({
          role:
            item?.role === "admin" || item?.role === "system" || item?.role === "client"
              ? item.role
              : "client",
          text: String(item?.text || "").trim(),
          createdAt: item?.createdAt || null,
        }))
        .filter((item) => item.text)
        .slice(-12)
    : [];
}

function buildProjectContextSummary(snapshot?: GhostProjectSnapshot | null) {
  if (!snapshot) return "No linked project snapshot.";
  return `${snapshot.lane.toUpperCase()} project is ${snapshot.status} (${snapshot.healthState}). Waiting on ${snapshot.waitingOn}. Next action: ${snapshot.nextActionTitle}.`;
}

function buildAskIntent(categoryLabel: string, snapshot?: GhostProjectSnapshot | null) {
  if (categoryLabel === "pricing_or_contract") {
    return snapshot
      ? `They want clarity on money/terms in the context of a ${snapshot.status} project and need a confident, bounded answer.`
      : "They want clarity on money/terms and need a confident, bounded answer.";
  }

  if (categoryLabel === "scope_change") {
    return snapshot
      ? `They are asking for change against the current ${snapshot.lane} project state and need scope boundaries plus a next step.`
      : "They are asking for change and need scope boundaries plus a next step.";
  }

  if (categoryLabel === "timeline_question") {
    return snapshot
      ? `They need delivery confidence tied to the real project state and the next concrete milestone.`
      : "They need delivery confidence and a concrete next milestone.";
  }

  return snapshot
    ? `They want reassurance tied to the current project state plus a clear next action.`
    : "They want reassurance and a clear next action.";
}

export function analyzeClientMessage(
  message: string,
  context: GhostMessageContext = {}
): GhostMessageAnalysis {
  const raw = message.trim();
  const text = raw.toLowerCase();
  const history = sanitizeHistory(context.history);
  const historyText = history.map((item) => item.text.toLowerCase()).join(" ");
  const combinedText = `${historyText} ${text}`.trim();
  const snapshot = context.snapshot || null;

  const sentimentLabel = includesAny(combinedText, NEGATIVE_WORDS)
    ? "negative"
    : includesAny(combinedText, POSITIVE_WORDS)
    ? "positive"
    : "neutral";

  const repeatedTimelineAsk =
    history.filter((item) => item.role === "client" && includesAny(item.text.toLowerCase(), TIMELINE_WORDS))
      .length >= 1 && includesAny(text, TIMELINE_WORDS);

  const urgencyLabel =
    includesAny(combinedText, URGENT_WORDS) || repeatedTimelineAsk
      ? "high"
      : raw.length > 240 || history.length > 0
      ? "medium"
      : "low";

  const categoryLabel = includesAny(combinedText, MONEY_WORDS)
    ? "pricing_or_contract"
    : text.includes("change") || text.includes("revision") || text.includes("add this") || text.includes("update this")
    ? "scope_change"
    : includesAny(combinedText, TIMELINE_WORDS)
    ? "timeline_question"
    : "general_update";

  const riskSignals = [
    categoryLabel === "pricing_or_contract" ? "pricing_or_contract" : null,
    sentimentLabel === "negative" ? "negative_sentiment" : null,
    urgencyLabel === "high" ? "high_urgency" : null,
    snapshot?.healthState === "at-risk" ? "project_at_risk" : null,
    repeatedTimelineAsk ? "repeated_timeline_ask" : null,
  ].filter(Boolean);

  const riskLabel =
    riskSignals.length >= 3 ? "high" : riskSignals.length === 2 ? "medium" : riskSignals.length === 1 ? "low" : "low";

  return {
    categoryLabel,
    sentimentLabel,
    urgencyLabel,
    riskLabel,
    whatClientIsReallyAsking: buildAskIntent(categoryLabel, snapshot),
    coachingJson: {
      acknowledgeEmotion: sentimentLabel === "negative",
      keepBoundariesVisible:
        categoryLabel === "scope_change" || categoryLabel === "pricing_or_contract",
      suggestNextAction: true,
      lane: context.lane || "global",
      projectId: context.projectId || null,
      threadId: context.threadId || null,
      historyCount: history.length,
      projectHealthState: snapshot?.healthState || null,
      waitingOn: snapshot?.waitingOn || null,
      nextActionTitle: snapshot?.nextActionTitle || null,
      projectContextSummary: buildProjectContextSummary(snapshot),
      riskSignals,
    },
  };
}

export function buildReplySuggestion(
  _message: string,
  analysis: GhostMessageAnalysis,
  context: GhostMessageContext = {}
): GhostReplySuggestion {
  const snapshot = context.snapshot || null;
  const safePrefix =
    analysis.sentimentLabel === "negative"
      ? "Thanks for flagging this quickly."
      : "Thanks for the update.";

  const projectStateLine = snapshot
    ? `Right now this project is ${snapshot.status} and the current next step is ${snapshot.nextActionTitle.toLowerCase()}.`
    : "";

  const boundedMoneyLine = snapshot
    ? "I’ll confirm the current approved scope, agreement, and payment state before anything new is promised."
    : "I’ll confirm the current agreement and approved scope before anything new is promised.";

  const mainBody =
    analysis.categoryLabel === "pricing_or_contract"
      ? boundedMoneyLine
      : analysis.categoryLabel === "scope_change"
      ? "We can review that change request. I’ll compare it against the current scope and send the cleanest path forward so there are no surprises."
      : analysis.categoryLabel === "timeline_question"
      ? snapshot
        ? `I’m checking the real project status so I can give you a grounded timing update instead of a vague estimate. ${projectStateLine}`
        : "I’m checking the current milestone so I can send you the next concrete delivery date instead of guessing."
      : snapshot
      ? `I’ve got this. ${projectStateLine}`
      : "I’ve got this and will send a clear status update plus next step shortly.";

  const nextActionLine = snapshot
    ? `I’ll follow up with the next confirmed update on ${snapshot.nextActionTitle.toLowerCase()}.`
    : "I’ll follow up with the next confirmed update shortly.";

  const defaultReply = `${safePrefix} ${mainBody} ${nextActionLine}`.replace(/\s+/g, " ").trim();

  const snapshotRiskText = snapshot?.riskFlags?.length
    ? ` Current project risks: ${snapshot.riskFlags.join("; ")}.`
    : "";

  return {
    defaultReply,
    variants: {
      warmer: `${safePrefix} Appreciate your patience here. ${mainBody} ${nextActionLine}`
        .replace(/\s+/g, " ")
        .trim(),
      firmer: `Thanks for the note. To avoid confusion, we’ll proceed based on approved scope, current project status, and documented milestones only. ${mainBody}`
        .replace(/\s+/g, " ")
        .trim(),
      shorter: `${safePrefix} ${snapshot ? `The next confirmed step is ${snapshot.nextActionTitle.toLowerCase()}.` : "I’ll send the next confirmed action today."}`
        .replace(/\s+/g, " ")
        .trim(),
    },
    whyThisWorks: snapshot
      ? "It acknowledges the client, stays grounded in live project context, avoids over-promising, and points to the next confirmed action."
      : "It acknowledges the client, stays factual, avoids over-promising, and gives a specific follow-up action.",
    cautionText:
      analysis.riskLabel === "high"
        ? `High-risk phrasing zone: avoid promising delivery dates, free extra scope, or financial concessions without checking the live project state.${snapshotRiskText}`.trim()
        : `Keep wording factual and tie next steps to current project status when available.${snapshotRiskText}`.trim(),
    nextActionText: snapshot
      ? `Confirm owner for "${snapshot.nextActionTitle}", then post a timestamped client-safe update.`
      : "Post a timestamped update and confirm owner + due time for the next step.",
  };
}