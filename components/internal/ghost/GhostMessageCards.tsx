import type { GhostMessageAnalysis, GhostReplySuggestion } from "@/lib/ghost/types";

export function GhostMessageAnalysisCard({ analysis }: { analysis: GhostMessageAnalysis | null }) {
  if (!analysis) return null;
  return <div className="card"><div className="cardInner"><strong>Message Analysis</strong><div className="pDark">Category: {analysis.categoryLabel} · Sentiment: {analysis.sentimentLabel} · Urgency: {analysis.urgencyLabel}</div><div className="pDark" style={{ marginTop: 8 }}>{analysis.whatClientIsReallyAsking}</div></div></div>;
}

export function GhostSuggestedReplyCard({ suggestion }: { suggestion: GhostReplySuggestion | null }) {
  if (!suggestion) return null;
  return <div className="card"><div className="cardInner"><strong>Suggested Reply</strong><p className="pDark" style={{ marginTop: 8 }}>{suggestion.defaultReply}</p></div></div>;
}

export function GhostReplyExplanationCard({ suggestion }: { suggestion: GhostReplySuggestion | null }) {
  if (!suggestion) return null;
  return <div className="card"><div className="cardInner"><strong>Why This Works</strong><p className="pDark" style={{ marginTop: 8 }}>{suggestion.whyThisWorks}</p></div></div>;
}

export function GhostReplyVariantsTabs({ suggestion }: { suggestion: GhostReplySuggestion | null }) {
  if (!suggestion) return null;
  return (
    <div className="card"><div className="cardInner"><strong>Reply Variants</strong>
      <div className="pDark" style={{ marginTop: 8 }}><strong>Warmer:</strong> {suggestion.variants.warmer || "—"}</div>
      <div className="pDark" style={{ marginTop: 8 }}><strong>Firmer:</strong> {suggestion.variants.firmer || "—"}</div>
      <div className="pDark" style={{ marginTop: 8 }}><strong>Shorter:</strong> {suggestion.variants.shorter || "—"}</div>
    </div></div>
  );
}

export function GhostRiskWarningCard({ suggestion }: { suggestion: GhostReplySuggestion | null }) {
  if (!suggestion) return null;
  return <div className="card"><div className="cardInner"><strong>Risk Warning</strong><p className="pDark" style={{ marginTop: 8 }}>{suggestion.cautionText}</p></div></div>;
}

export function GhostNextActionSuggestionCard({ suggestion }: { suggestion: GhostReplySuggestion | null }) {
  if (!suggestion) return null;
  return <div className="card"><div className="cardInner"><strong>Suggested Next Action</strong><p className="pDark" style={{ marginTop: 8 }}>{suggestion.nextActionText}</p></div></div>;
}
