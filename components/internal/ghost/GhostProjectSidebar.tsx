"use client";

import { useState } from "react";
import type { GhostAnswer, GhostLane, GhostProjectSnapshot } from "@/lib/ghost/types";
import GhostAnswerPanel from "@/components/internal/ghost/GhostAnswerPanel";
import {
  GhostNextActionCard,
  GhostProjectSnapshotCard,
  GhostRiskFlagsCard,
  GhostSuggestedActionsCard,
  GhostWaitingOnCard,
} from "@/components/internal/ghost/GhostProjectCards";

export default function GhostProjectSidebar({
  lane,
  projectId,
  snapshot,
}: {
  lane: GhostLane;
  projectId: string;
  snapshot: GhostProjectSnapshot | null;
}) {
  const [question, setQuestion] = useState("What is this project waiting on?");
  const [answer, setAnswer] = useState<GhostAnswer | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    setBusy(true);
    try {
      const res = await fetch("/api/internal/ghost/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lane, projectId, question }),
      });
      const json = await res.json();
      if (res.ok && json?.ok) setAnswer(json.answer || null);
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) {
    return <aside className="card"><div className="cardInner"><strong>Ghost Admin</strong><p className="pDark">No project snapshot available.</p></div></aside>;
  }

  return (
    <aside style={{ display: "grid", gap: 10 }}>
      <GhostProjectSnapshotCard snapshot={snapshot} />
      <GhostWaitingOnCard waitingOn={snapshot.waitingOn} />
      <GhostNextActionCard nextAction={snapshot.nextActionTitle} />
      <GhostRiskFlagsCard riskFlags={snapshot.riskFlags} />
      <GhostSuggestedActionsCard snapshot={snapshot} />

      <div className="card"><div className="cardInner">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Ask about this project</div>
        <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="btn btnGhost" style={{ marginTop: 8 }} onClick={ask} disabled={busy}>{busy ? "Thinking..." : "Ask Ghost"}</button>
        <GhostAnswerPanel answer={answer} />
      </div></div>
    </aside>
  );
}
