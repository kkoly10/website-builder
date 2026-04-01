"use client";

import { useState } from "react";
import type { EnrichedOpsWorkspaceBundle } from "@/lib/opsWorkspace/state";

const STAGES = [
  "new",
  "discovery",
  "scoping",
  "proposal_sent",
  "agreement_sent",
  "agreement_accepted",
  "deposit_sent",
  "deposit_paid",
  "in_progress",
  "process_mapping",
  "building",
  "testing",
  "live",
  "retainer_active",
  "completed",
  "closed_lost",
] as const;

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function OpsStageChecklistPanel({
  initialData,
  onUpdated,
}: {
  initialData: EnrichedOpsWorkspaceBundle;
  onUpdated: (data: EnrichedOpsWorkspaceBundle) => void;
}) {
  const [savingStage, setSavingStage] = useState("");
  const [adminPublicNote, setAdminPublicNote] = useState(initialData.workspace.adminPublicNote || "");
  const [message, setMessage] = useState("");

  async function applyStage(stage: string) {
    setSavingStage(stage);
    setMessage("");
    try {
      const res = await fetch("/api/internal/admin/ops/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opsIntakeId: initialData.intake.id,
          stage,
          adminPublicNote,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.data) {
        throw new Error(json?.error || "Failed to update stage.");
      }
      onUpdated(json.data as EnrichedOpsWorkspaceBundle);
      setMessage(`Moved to ${pretty(stage)}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update stage.");
    } finally {
      setSavingStage("");
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panelHeader">
        <div>Stage control</div>
        <div className="smallNote">Advance this OPS project from lead to completion without digging through the full editor.</div>
      </div>
      <div className="panelBody" style={{ display: "grid", gap: 14 }}>
        <div>
          <div className="fieldLabel">Client-facing note to carry with stage changes</div>
          <textarea className="input" rows={3} value={adminPublicNote} onChange={(e) => setAdminPublicNote(e.target.value)} style={{ resize: "vertical", width: "100%" }} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              className="btn btnGhost"
              disabled={!!savingStage}
              onClick={() => applyStage(stage)}
              style={{ fontSize: 12 }}
            >
              {savingStage === stage ? `Saving ${pretty(stage)}...` : pretty(stage)}
            </button>
          ))}
        </div>

        {message ? <div className="smallNote">{message}</div> : null}
      </div>
    </div>
  );
}
