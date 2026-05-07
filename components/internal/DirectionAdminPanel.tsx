"use client";

// Admin panel for non-website directions (Phase 3.5). Mirrors
// DesignDirectionAdminPanel for the website lane, but operates on the
// generic GenericDirection record at scope_snapshot.direction.

import { useState } from "react";
import type { GenericDirection } from "@/lib/directions/types";
import { getDirectionSchema } from "@/lib/directions/schemas";
import DirectionSummary from "@/components/portal/directions/DirectionSummary";

type AdminAction = "mark_under_review" | "request_changes" | "approve" | "lock";

type Props = {
  quoteId: string;
  direction: GenericDirection | null;
  projectType: string;
  // Receives the action + new direction state so the parent can update
  // local state and optionally toggle the auto-completed milestone.
  onTransitioned?: (
    action: AdminAction,
    next: GenericDirection,
  ) => void | Promise<void>;
};

const STATUS_PILL: Record<
  GenericDirection["status"],
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

const TITLE_BY_TYPE: Record<GenericDirection["type"], string> = {
  design_direction: "Design Direction",
  product_direction: "Product Direction",
  workflow_direction: "Workflow Direction",
  store_direction: "Store Direction",
  rescue_diagnosis: "Rescue Diagnosis",
};

export default function DirectionAdminPanel({
  quoteId,
  direction,
  projectType,
  onTransitioned,
}: Props) {
  const [publicNote, setPublicNote] = useState(direction?.adminPublicNote ?? "");
  const [internalNote, setInternalNote] = useState(direction?.adminInternalNote ?? "");
  const [busy, setBusy] = useState<AdminAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (projectType === "website") {
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
        Use the Design Direction panel above for website projects.
      </div>
    );
  }

  if (!direction) {
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
        Direction isn&apos;t enabled for this project. The portal predates Phase 3.3.
      </div>
    );
  }

  const pill = STATUS_PILL[direction.status];
  const title = TITLE_BY_TYPE[direction.type];
  const schema = getDirectionSchema(direction.type);

  async function transition(action: AdminAction) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/internal/portal/admin-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          direction: {
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
      if (onTransitioned && json.direction) {
        await onTransitioned(action, json.direction as GenericDirection);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition failed.");
    } finally {
      setBusy(null);
    }
  }

  const canMarkUnderReview =
    direction.status === "submitted" || direction.status === "changes_requested";
  const canRequestChanges = direction.status !== "locked";
  const canApprove =
    direction.status === "submitted" || direction.status === "under_review";
  // Lock requires the client to have at least submitted the form (or
  // for it to already be approved). Mirrors the server precondition in
  // transitionDirectionByQuoteId.
  const canLock =
    direction.status === "submitted" ||
    direction.status === "under_review" ||
    direction.status === "approved";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          {title} status
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

      {schema && direction.status !== "not_started" && direction.status !== "waiting_on_client" ? (
        <details style={{ border: "1px solid var(--rule)", borderRadius: 12, padding: 12, background: "var(--paper-2)" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
            Submitted answers
          </summary>
          <div style={{ marginTop: 12 }}>
            <DirectionSummary value={direction} schema={schema} />
          </div>
        </details>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)", padding: 12, border: "1px dashed var(--rule)", borderRadius: 12 }}>
          Client hasn&apos;t submitted the form yet.
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Public note (visible to client)</label>
        <textarea
          className="textarea"
          rows={2}
          value={publicNote}
          onChange={(e) => setPublicNote(e.target.value)}
          placeholder="Optional context for the client when you transition."
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
        Locking marks the lane&apos;s direction-approved milestone complete and
        signals the client that major changes will require a change order.
      </div>
    </div>
  );
}
