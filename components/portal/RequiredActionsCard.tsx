"use client";

// Phase 3.9 — "Action needed from you" card.
//
// Renders the open client-facing required actions for a portal. Sourced
// from customer_portal_required_actions (Phase 3.10 table) which is
// seeded from the lane's workflow template at portal creation.
//
// Some actions have dedicated UI elsewhere — e.g. "complete_design_direction"
// is fulfilled by submitting the DesignDirectionForm. Those actions
// auto-complete via downstream activity events and don't need their own
// "mark complete" button. The card auto-hides those (see ACTION_HAS_OWN_FLOW)
// so we don't show a redundant "click here" CTA next to the actual form.

import { useState } from "react";
import type { RequiredAction } from "@/lib/requiredActions";

type Props = {
  actions: RequiredAction[];
  onComplete?: (actionKey: string) => Promise<void> | void;
};

// Required actions whose completion is signalled by another flow (not by
// clicking a "mark done" button on this card). The card still LISTS these
// for context but doesn't render a manual "complete" button.
const ACTION_HAS_OWN_FLOW = new Set([
  // Direction-related: completed by submitting the direction form.
  "complete_design_direction",
  "complete_product_direction",
  "complete_workflow_direction",
  "complete_store_direction",
  "complete_rescue_diagnosis",
  // MVP scope / wireframes / UAT etc. happen through admin-controlled
  // milestones rather than client self-marking.
  "approve_mvp_scope",
  "approve_wireframes",
  "complete_uat",
  "approve_production_launch",
  "approve_fix_plan",
  "review_test_run",
  "review_test_order",
  "review_first_preview",
  "review_rescue_fixes",
  "approve_launch",
]);

const STATUS_PILL: Record<
  RequiredAction["status"],
  { label: string; bg: string; fg: string; border: string }
> = {
  not_started: { label: "Not started yet", bg: "var(--paper-2)", fg: "var(--muted)", border: "var(--rule)" },
  waiting_on_client: { label: "Action needed", bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  submitted: { label: "Submitted", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  complete: { label: "Done", bg: "var(--paper-2)", fg: "var(--muted)", border: "var(--rule)" },
  blocked: { label: "Blocked", bg: "var(--paper-2)", fg: "var(--accent-2)", border: "var(--accent)" },
};

export default function RequiredActionsCard({ actions, onComplete }: Props) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only show client-owned actions on the client portal. Studio/system
  // actions are admin-side concerns.
  const visible = actions.filter((a) => a.owner === "client");
  if (visible.length === 0) return null;

  async function handleComplete(actionKey: string) {
    if (!onComplete) return;
    setBusyKey(actionKey);
    setError(null);
    try {
      await onComplete(actionKey);
    } catch (err) {
      // Surface the error inline. Without this catch, the parent's
      // fetch error becomes an unhandled rejection swallowed by void —
      // the user sees nothing change after clicking "Mark as done".
      setError(err instanceof Error ? err.message : "Failed to mark action complete.");
    } finally {
      setBusyKey(null);
    }
  }

  // Sort: incomplete first (pending action), complete last (history).
  const sorted = [...visible].sort((a, b) => {
    const aDone = a.status === "complete" ? 1 : 0;
    const bDone = b.status === "complete" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div
      className="portalPanel fadeUp"
      style={{ animationDelay: "0.02s", marginBottom: "1rem" }}
    >
      <div className="portalPanelHeader">
        <div>
          <h2 className="portalPanelTitle">Action needed from you</h2>
          <div className="portalMessageIntro">
            Each step below moves the project toward launch. Pending items show what
            we&apos;re waiting on from you right now.
          </div>
        </div>
        <span className="portalPanelCount">
          {sorted.filter((a) => a.status !== "complete").length} pending
        </span>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            border: "1px solid var(--accent)",
            background: "var(--accent-bg)",
            color: "var(--accent-2)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {sorted.map((action) => {
          const pill = STATUS_PILL[action.status];
          const isDone = action.status === "complete";
          const hasOwnFlow = ACTION_HAS_OWN_FLOW.has(action.actionKey);
          const showCompleteButton =
            !isDone && !hasOwnFlow && action.status !== "submitted";

          return (
            <div
              key={action.id}
              style={{
                border: "1px solid",
                borderColor: action.status === "waiting_on_client" ? "var(--accent)" : "var(--rule)",
                borderRadius: 14,
                background: "var(--paper-2)",
                padding: 16,
                opacity: isDone ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>
                  {action.title}
                  {hasOwnFlow ? (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--muted)",
                      }}
                    >
                      (use the form below)
                    </span>
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
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
              {action.description ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.6,
                    marginBottom: showCompleteButton ? 12 : 0,
                  }}
                >
                  {action.description}
                </div>
              ) : null}
              {showCompleteButton && onComplete ? (
                <button
                  type="button"
                  className="btn btnGhost"
                  onClick={() => void handleComplete(action.actionKey)}
                  disabled={busyKey === action.actionKey}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  {busyKey === action.actionKey ? "Saving..." : "Mark as done"}
                </button>
              ) : null}
              {isDone && action.completedAt ? (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                  Completed {new Date(action.completedAt).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
