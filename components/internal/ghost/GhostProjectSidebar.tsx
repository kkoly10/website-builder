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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function ask() {
    if (!question.trim()) return;

    setBusy(true);
    setMsg("");

    try {
      const res = await fetch("/api/internal/ghost/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lane,
          projectId,
          question,
          sessionId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Ghost query failed");
      }

      setAnswer(json.answer || null);
      setSessionId(json.sessionId || null);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Ghost query failed");
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) {
    return (
      <aside className="card">
        <div className="cardInner">
          <strong>Ghost Admin</strong>
          <p className="pDark">No project snapshot available.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside style={{ display: "grid", gap: 10 }}>
      <GhostProjectSnapshotCard snapshot={snapshot} />
      <GhostWaitingOnCard waitingOn={snapshot.waitingOn} />
      <GhostNextActionCard nextAction={snapshot.nextActionTitle} />
      <GhostRiskFlagsCard riskFlags={snapshot.riskFlags} />
      <GhostSuggestedActionsCard snapshot={snapshot} />

      <div className="card">
        <div className="cardInner">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Ask about this project</div>
          <div className="pDark" style={{ fontSize: 13, marginBottom: 8 }}>
            Lane: <strong>{lane}</strong> • Project: <strong>{projectId}</strong>
          </div>

          <input
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Ghost what is blocked, next action, risks, quote state, preview, etc."
          />

          <button
            className="btn btnGhost"
            style={{ marginTop: 8 }}
            onClick={ask}
            disabled={busy}
          >
            {busy ? "Thinking..." : "Ask Ghost"}
          </button>

          {msg ? (
            <p className="pDark" style={{ color: "#ef4444", marginTop: 8 }}>
              {msg}
            </p>
          ) : null}

          <GhostAnswerPanel answer={answer} />
        </div>
      </div>
    </aside>
  );
}