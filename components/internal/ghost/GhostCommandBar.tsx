"use client";

import { useState } from "react";
import type { GhostAnswer, GhostLane } from "@/lib/ghost/types";
import GhostAnswerPanel from "@/components/internal/ghost/GhostAnswerPanel";

export default function GhostCommandBar() {
  const [lane, setLane] = useState<GhostLane>("website");
  const [projectId, setProjectId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<GhostAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function ask() {
    if (!projectId.trim() || !question.trim()) return;

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
        throw new Error(json?.error || "Query failed");
      }

      setAnswer(json.answer || null);
      setSessionId(json.sessionId || null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" style={{ marginTop: 10 }}>
      <div className="cardInner">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Ghost Command Bar (Internal)</div>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
          <select
            className="input"
            value={lane}
            onChange={(e) => {
              setLane(e.target.value as GhostLane);
              setSessionId(null);
            }}
          >
            <option value="website">Website</option>
            <option value="ops">Ops</option>
            <option value="ecommerce">E-Commerce</option>
          </select>

          <input
            className="input"
            placeholder="Project ID"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setSessionId(null);
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            className="input"
            placeholder="Ask Ghost about waiting on, risks, next action, quote status, preview, etc."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn btnPrimary" onClick={ask} disabled={busy}>
            {busy ? "Asking..." : "Ask"}
          </button>
        </div>

        {msg ? (
          <p className="pDark" style={{ color: "#ef4444" }}>
            {msg}
          </p>
        ) : null}

        <GhostAnswerPanel answer={answer} />
      </div>
    </section>
  );
}