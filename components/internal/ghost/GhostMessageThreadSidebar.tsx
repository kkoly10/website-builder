"use client";

import { useState } from "react";
import type { GhostMessageAnalysis, GhostReplySuggestion } from "@/lib/ghost/types";
import {
  GhostMessageAnalysisCard,
  GhostNextActionSuggestionCard,
  GhostReplyExplanationCard,
  GhostReplyVariantsTabs,
  GhostRiskWarningCard,
  GhostSuggestedReplyCard,
} from "@/components/internal/ghost/GhostMessageCards";

export default function GhostMessageThreadSidebar() {
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<GhostMessageAnalysis | null>(null);
  const [suggestion, setSuggestion] = useState<GhostReplySuggestion | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!message.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/internal/ghost/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        setAnalysis(json.analysis || null);
        setSuggestion(json.suggestion || null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside style={{ display: "grid", gap: 10 }}>
      <div className="card"><div className="cardInner">
        <strong>Ghost Message Thread</strong>
        <textarea className="textarea" style={{ marginTop: 8 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Paste a client message thread snippet" />
        <button className="btn btnPrimary" style={{ marginTop: 8 }} onClick={run} disabled={busy}>{busy ? "Analyzing..." : "Analyze + Suggest Reply"}</button>
      </div></div>

      <GhostMessageAnalysisCard analysis={analysis} />
      <GhostSuggestedReplyCard suggestion={suggestion} />
      <GhostReplyExplanationCard suggestion={suggestion} />
      <GhostReplyVariantsTabs suggestion={suggestion} />
      <GhostRiskWarningCard suggestion={suggestion} />
      <GhostNextActionSuggestionCard suggestion={suggestion} />
    </aside>
  );
}
