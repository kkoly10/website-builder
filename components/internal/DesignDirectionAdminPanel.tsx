"use client";

import { useState } from "react";
import type { WebsiteDesignDirection } from "@/lib/designDirection";
import DesignDirectionSummary from "@/components/portal/DesignDirectionSummary";

type AdminAction = "mark_under_review" | "request_changes" | "approve" | "lock";

type Props = {
  quoteId: string;
  designDirection: WebsiteDesignDirection | null;
  projectType: string;
  // Called after a successful transition with the action and the new
  // direction state from the server, so the parent can update local
  // state (and optimistically toggle dependent fields like the
  // "Design direction approved" milestone on lock).
  onTransitioned?: (
    action: AdminAction,
    next: WebsiteDesignDirection,
  ) => void | Promise<void>;
};

const STATUS_PILL: Record<
  WebsiteDesignDirection["status"],
  { label: string; bg: string; fg: string; border: string }
> = {
  not_started: { label: "Not started", bg: "var(--paper-2)", fg: "var(--muted)", border: "var(--rule)" },
  waiting_on_client: { label: "Waiting on client", bg: "var(--paper-2)", fg: "var(--muted)", border: "var(--rule)" },
  submitted: { label: "Awaiting review", bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  under_review: { label: "Under review", bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  changes_requested: { label: "Changes requested", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  approved: { label: "Approved", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  locked: { label: "Locked", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
};

export default function DesignDirectionAdminPanel({
  quoteId,
  designDirection,
  projectType,
  onTransitioned,
}: Props) {
  const [publicNote, setPublicNote] = useState(designDirection?.adminPublicNote ?? "");
  const [internalNote, setInternalNote] = useState(designDirection?.adminInternalNote ?? "");
  const [busy, setBusy] = useState<AdminAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (projectType !== "website") {
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid var(--rule)",
          borderRadius: 12,
          background: "var(--paper-2)",
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        Design Direction is only used for website projects. This is a{" "}
        <strong style={{ color: "var(--fg)" }}>{projectType}</strong> project.
      </div>
    );
  }

  if (!designDirection) {
    return (
      <div
        style={{
          padding: 16,
          border: "1px solid var(--rule)",
          borderRadius: 12,
          background: "var(--paper-2)",
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        Design Direction isn&apos;t enabled for this project. The portal predates Phase 2.
      </div>
    );
  }

  const pill = STATUS_PILL[designDirection.status];

  async function transition(action: AdminAction) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/internal/portal/admin-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          designDirection: {
            action,
            publicNote: publicNote.trim() || null,
            internalNote: internalNote.trim() || null,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Transition failed.");
      }
      if (onTransitioned && json.designDirection) {
        await onTransitioned(action, json.designDirection as WebsiteDesignDirection);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition failed.");
    } finally {
      setBusy(null);
    }
  }

  // Disable transitions that don't make sense from the current state.
  const canMarkUnderReview =
    designDirection.status === "submitted" || designDirection.status === "changes_requested";
  const canRequestChanges = designDirection.status !== "locked";
  const canApprove =
    designDirection.status === "submitted" || designDirection.status === "under_review";
  const canLock = designDirection.status !== "locked";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          Status
        </h4>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${pill.border}`,
            background: pill.bg,
            color: pill.fg,
            whiteSpace: "nowrap",
          }}
        >
          {pill.label}
        </span>
      </div>

      {/* Submitted summary */}
      {designDirection.status !== "not_started" && designDirection.status !== "waiting_on_client" ? (
        <details style={{ border: "1px solid var(--rule)", borderRadius: 12, padding: 12, background: "var(--paper-2)" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
            Submitted answers
          </summary>
          <div style={{ marginTop: 12 }}>
            <DesignDirectionSummary value={designDirection} />
          </div>
        </details>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)", padding: 12, border: "1px dashed var(--rule)", borderRadius: 12 }}>
          Client hasn&apos;t submitted the form yet.
        </div>
      )}

      {/* Notes */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Public note (visible to client)</label>
        <textarea
          className="textarea"
          rows={2}
          value={publicNote}
          onChange={(e) => setPublicNote(e.target.value)}
          placeholder='e.g. "Direction looks great. I&apos;ll use this to guide the first preview."'
        />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Internal note (admin-only)</label>
        <textarea
          className="textarea"
          rows={2}
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Notes for the studio that the client won&apos;t see."
        />
      </div>

      {error ? (
        <div
          style={{
            padding: 10,
            border: "1px solid var(--accent)",
            background: "var(--accent-bg)",
            color: "var(--accent-2)",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Action buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          className="btn btnGhost"
          disabled={!canMarkUnderReview || busy !== null}
          onClick={() => transition("mark_under_review")}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          {busy === "mark_under_review" ? "Marking..." : "Mark under review"}
        </button>
        <button
          className="btn btnGhost"
          disabled={!canRequestChanges || busy !== null}
          onClick={() => transition("request_changes")}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          {busy === "request_changes" ? "Requesting..." : "Request changes"}
        </button>
        <button
          className="btn btnPrimary"
          disabled={!canApprove || busy !== null}
          onClick={() => transition("approve")}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          {busy === "approve" ? "Approving..." : "Approve"}
        </button>
        <button
          className="btn btnPrimary"
          disabled={!canLock || busy !== null}
          onClick={() => transition("lock")}
          style={{ fontSize: 12, padding: "8px 14px", background: "var(--ink)" }}
        >
          {busy === "lock" ? "Locking..." : "Approve & lock for build"}
        </button>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--muted)",
          lineHeight: 1.6,
          paddingTop: 4,
          borderTop: "1px dashed var(--rule)",
        }}
      >
        Locking marks the &ldquo;Design direction approved&rdquo; milestone complete and signals
        the client that major visual changes will require a change order.
      </div>
    </div>
  );
}
