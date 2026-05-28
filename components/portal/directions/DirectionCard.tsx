"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { GenericDirection, GenericDirectionInput } from "@/lib/directions/types";
import { getDirectionSchema } from "@/lib/directions/schemas";
import DirectionForm from "./DirectionForm";
import DirectionSummary from "./DirectionSummary";

type Props = {
  value: GenericDirection;
  onSubmit: (input: GenericDirectionInput) => Promise<void>;
};

// Style-only pill record. Labels come from i18n
// (portalToken.directionModule.statusPill.*).
const STATUS_PILL_STYLE: Record<
  GenericDirection["status"],
  { bg: string; fg: string; border: string }
> = {
  not_started: { bg: "var(--paper-2)", fg: "var(--muted)", border: "var(--rule)" },
  waiting_on_client: { bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  submitted: { bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  under_review: { bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  changes_requested: { bg: "var(--accent-bg)", fg: "var(--accent-2)", border: "var(--accent)" },
  approved: { bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
  locked: { bg: "var(--paper-2)", fg: "var(--fg)", border: "var(--rule)" },
};

const STATUS_PILL_KEY: Record<GenericDirection["status"], string> = {
  not_started: "notStarted",
  waiting_on_client: "waitingOnClient",
  submitted: "submitted",
  under_review: "underReview",
  changes_requested: "changesRequested",
  approved: "approved",
  locked: "locked",
};

// Maps the canonical directionType to the i18n key under
// portalToken.directionModule.title.* (design / product / workflow /
// store / rescue).
const TITLE_KEY_BY_TYPE: Record<GenericDirection["type"], string> = {
  design_direction: "design",
  product_direction: "product",
  workflow_direction: "workflow",
  store_direction: "store",
  rescue_diagnosis: "rescue",
  portal_direction: "portal",
};

// Subtitle copy now lives in messages/*.json under
// portalToken.directionModule.subtitle.<typeKey>.<statusKey>. typeKey
// reuses TITLE_KEY_BY_TYPE (design / product / workflow / store /
// rescue / portal); statusKey reuses STATUS_PILL_KEY (camelCase status
// names matching the existing statusPill keys). Single source of truth
// for direction copy across en/fr/es, replacing the previous
// SUBTITLE_BY_TYPE_AND_STATUS map that hardcoded English for every
// direction type × status combination (~42 strings).

export default function DirectionCard({ value, onSubmit }: Props) {
  const t = useTranslations("portalToken.directionModule");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schema = getDirectionSchema(value.type);
  const pillStyle = STATUS_PILL_STYLE[value.status];
  const pillLabel = t(`statusPill.${STATUS_PILL_KEY[value.status]}`);
  const title = t(`title.${TITLE_KEY_BY_TYPE[value.type]}`);
  const subtitle = t(`subtitle.${TITLE_KEY_BY_TYPE[value.type]}.${STATUS_PILL_KEY[value.status]}`);

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
      // Generic per-lane event so completion rate, time-to-submit, and
      // per-lane funnels are measurable. Tracking lives on the client
      // here (not server) because the form completion moment is what
      // matters; admin re-edits via the payload editor shouldn't count.
      try {
        const { trackEvent } = await import("@/lib/analytics/client");
        trackEvent({
          event: "direction_submitted",
          metadata: { directionType: value.type, status: value.status },
        });
      } catch {
        // Analytics is best-effort — never block a successful submit.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitError"));
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
            border: `1px solid ${pillStyle.border}`,
            background: pillStyle.bg,
            color: pillStyle.fg,
            whiteSpace: "nowrap",
          }}
        >
          {pillLabel}
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
            {t("lockedNotice")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
