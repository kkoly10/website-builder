"use client";

import { useState } from "react";
import type { GenericDirection, GenericDirectionInput } from "@/lib/directions/types";
import { getDirectionSchema } from "@/lib/directions/schemas";
import DirectionForm from "./DirectionForm";
import DirectionSummary from "./DirectionSummary";

type Props = {
  value: GenericDirection;
  onSubmit: (input: GenericDirectionInput) => Promise<void>;
};

const STATUS_PILL: Record<
  GenericDirection["status"],
  { label: string; bg: string; fg: string; border: string }
> = {
  not_started: { label: "Not started", bg: "var(--paper-2)", fg: "var(--muted)", border: "var(--rule)" },
  waiting_on_client: { label: "Action needed", bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  submitted: { label: "Submitted", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  under_review: { label: "Under review", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  changes_requested: { label: "Clarification needed", bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  approved: { label: "Approved", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  locked: { label: "Locked for build", bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
};

const TITLE_BY_TYPE: Record<GenericDirection["type"], string> = {
  design_direction: "Design Direction",
  product_direction: "Product Direction",
  workflow_direction: "Workflow Direction",
  store_direction: "Store Direction",
  rescue_diagnosis: "Rescue Diagnosis",
};

const SUBTITLE_BY_TYPE_AND_STATUS: Record<
  GenericDirection["type"],
  Record<GenericDirection["status"], string>
> = {
  // design_direction is handled by Phase 2A's DesignDirectionCard, but we
  // include a copy here in case the resolver ever falls through.
  design_direction: {
    not_started: "Choose the visual direction before the full build begins.",
    waiting_on_client: "Choose your design direction. CrecyStudio will use it to make professional decisions about layout, typography, and visual hierarchy.",
    submitted: "CrecyStudio is reviewing your direction.",
    under_review: "CrecyStudio is reviewing your direction.",
    changes_requested: "CrecyStudio needs more detail before locking the direction.",
    approved: "Your design direction has been approved.",
    locked: "Design direction is locked. Major changes require a change order.",
  },
  product_direction: {
    not_started: "Tell us how the app should work before development starts.",
    waiting_on_client: "Tell us how the app should work. We'll turn this into the MVP scope before development starts.",
    submitted: "CrecyStudio is reviewing your product direction.",
    under_review: "CrecyStudio is reviewing your product direction.",
    changes_requested: "CrecyStudio needs more detail before MVP scope can be locked.",
    approved: "Product direction approved. MVP scope will follow.",
    locked: "Product direction locked. Major scope changes require a change order.",
  },
  workflow_direction: {
    not_started: "Tell us about the manual process you want automated.",
    waiting_on_client: "Tell us about the manual process you want automated. We'll turn this into the automation plan before build starts.",
    submitted: "CrecyStudio is reviewing your workflow direction.",
    under_review: "CrecyStudio is reviewing your workflow direction.",
    changes_requested: "CrecyStudio needs more detail before locking the automation scope.",
    approved: "Workflow direction approved.",
    locked: "Workflow direction locked. Adding new triggers or tools requires a change order.",
  },
  store_direction: {
    not_started: "Tell us how your store should work before we start building.",
    waiting_on_client: "Tell us how your store should work. We'll turn this into the build plan.",
    submitted: "CrecyStudio is reviewing your store direction.",
    under_review: "CrecyStudio is reviewing your store direction.",
    changes_requested: "CrecyStudio needs more detail before locking the store scope.",
    approved: "Store direction approved.",
    locked: "Store direction locked. Adding new platforms or major checkout changes requires a change order.",
  },
  rescue_diagnosis: {
    not_started: "Tell us what's broken so we can put together the fix plan.",
    waiting_on_client: "Tell us what's broken so we can put together the fix plan.",
    submitted: "CrecyStudio is reviewing the rescue details.",
    under_review: "CrecyStudio is reviewing the rescue details.",
    changes_requested: "CrecyStudio needs more detail before the fix plan can be locked.",
    approved: "Fix plan approved.",
    locked: "Fix plan locked. New issues outside the priority list will be documented separately.",
  },
};

export default function DirectionCard({ value, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schema = getDirectionSchema(value.type);
  const pill = STATUS_PILL[value.status];
  const title = TITLE_BY_TYPE[value.type];
  const subtitle = SUBTITLE_BY_TYPE_AND_STATUS[value.type][value.status];

  if (!schema) {
    // Shouldn't reach here for the 4 generic lanes — design_direction
    // doesn't have a generic schema and should be handled by Phase 2A's
    // dedicated component instead.
    return null;
  }

  async function handleSubmit(input: GenericDirectionInput) {
    setError(null);
    setSaving(true);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit direction.");
    } finally {
      setSaving(false);
    }
  }

  const isFormState =
    value.status === "waiting_on_client" ||
    value.status === "changes_requested" ||
    value.status === "not_started";
  const accentBorder =
    value.status === "waiting_on_client" || value.status === "changes_requested";

  return (
    <div
      className="portalPanel fadeUp"
      style={{
        animationDelay: "0.04s",
        marginBottom: "1rem",
        border: accentBorder ? "1px solid var(--accent)" : undefined,
      }}
    >
      <div className="portalPanelHeader">
        <div>
          <h2 className="portalPanelTitle">{title}</h2>
          <div className="portalMessageIntro">{subtitle}</div>
        </div>
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

      <div style={{ paddingTop: 8 }}>
        {isFormState ? (
          <DirectionForm
            schema={schema}
            initialPayload={value.payload}
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
          />
        ) : (
          <DirectionSummary value={value} schema={schema} />
        )}

        {value.status === "locked" ? (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--rule)",
              background: "var(--paper-2)",
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Direction is locked. Feedback should focus on functionality, content accuracy, and
            reasonable polish. Major changes to the approved direction may affect the timeline or
            require a change order.
          </div>
        ) : null}
      </div>
    </div>
  );
}
