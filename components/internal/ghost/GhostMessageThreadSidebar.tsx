"use client";

import { useState } from "react";
import type { GhostLane, GhostMessageAnalysis, GhostReplySuggestion } from "@/lib/ghost/types";
import {
  GhostMessageAnalysisCard,
  GhostNextActionSuggestionCard,
  GhostReplyExplanationCard,
  GhostReplyVariantsTabs,
  GhostRiskWarningCard,
  GhostSuggestedReplyCard,
} from "@/components/internal/ghost/GhostMessageCards";

type MessageLane = GhostLane | "global";
type MessageHistoryRole = "client" | "admin" | "system";

type MessageHistoryItem = {
  role: MessageHistoryRole;
  text: string;
  createdAt?: string | null;
};

function parseHistory(raw: string): MessageHistoryItem[] {
  const blocks = raw
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.slice(-12).map((block) => {
    const match = block.match(/^(client|admin|system)\s*:\s*([\s\S]+)$/i);

    if (match) {
      return {
        role: match[1].toLowerCase() as MessageHistoryRole,
        text: match[2].trim(),
      };
    }

    return {
      role: "client",
      text: block,
    };
  });
}

export default function GhostMessageThreadSidebar() {
  const [lane, setLane] = useState<MessageLane>("global");
  const [projectId, setProjectId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [historyText, setHistoryText] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<GhostMessageAnalysis | null>(null);
  const [suggestion, setSuggestion] = useState<GhostReplySuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function run() {
    if (!message.trim()) return;

    setBusy(true);
    setMsg("");

    try {
      const res = await fetch("/api/internal/ghost/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lane,
          projectId: projectId.trim() || null,
          threadId: threadId.trim() || null,
          history: parseHistory(historyText),
          message,
          sessionId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Message analysis failed");
      }

      setAnalysis(json.analysis || null);
      setSuggestion(json.suggestion || null);
      setSessionId(json.sessionId || null);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Message analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside style={{ display: "grid", gap: 10 }}>
      <div className="card">
        <div className="cardInner">
          <strong>Ghost Message Thread</strong>
          <p className="pDark" style={{ marginTop: 6, fontSize: 13 }}>
            Add lane/project/thread context when available so Ghost can ground the reply in the real project state.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr 1fr",
              gap: 8,
              marginTop: 10,
            }}
          >
            <select
              className="input"
              value={lane}
              onChange={(e) => {
                setLane(e.target.value as MessageLane);
                setSessionId(null);
              }}
            >
              <option value="global">Global / no project</option>
              <option value="website">Website</option>
              <option value="ops">Ops</option>
              <option value="ecommerce">E-Commerce</option>
            </select>

            <input
              className="input"
              placeholder="Project ID (optional)"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setSessionId(null);
              }}
            />

            <input
              className="input"
              placeholder="Thread ID (optional)"
              value={threadId}
              onChange={(e) => {
                setThreadId(e.target.value);
                setSessionId(null);
              }}
            />
          </div>

          <textarea
            className="textarea"
            style={{ marginTop: 8, minHeight: 120 }}
            value={historyText}
            onChange={(e) => setHistoryText(e.target.value)}
            placeholder={`Optional recent history.
Use blank lines between entries.
Example:

client: Just checking if we're still on track for launch this week.

admin: We are reviewing the final milestone now.

client: Okay, but I need a firm answer today.`}
          />

          <textarea
            className="textarea"
            style={{ marginTop: 8 }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste the latest client message you want Ghost to analyze."
          />

          <button
            className="btn btnPrimary"
            style={{ marginTop: 8 }}
            onClick={run}
            disabled={busy}
          >
            {busy ? "Analyzing..." : "Analyze + Suggest Reply"}
          </button>

          {msg ? (
            <p className="pDark" style={{ color: "#ef4444", marginTop: 8 }}>
              {msg}
            </p>
          ) : null}
        </div>
      </div>

      <GhostMessageAnalysisCard analysis={analysis} />
      <GhostSuggestedReplyCard suggestion={suggestion} />
      <GhostReplyExplanationCard suggestion={suggestion} />
      <GhostReplyVariantsTabs suggestion={suggestion} />
      <GhostRiskWarningCard suggestion={suggestion} />
      <GhostNextActionSuggestionCard suggestion={suggestion} />
    </aside>
  );
}