"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { WebsiteDesignDirection, WebsiteDesignDirectionInput } from "@/lib/designDirection";
import DesignDirectionForm from "./DesignDirectionForm";
import DesignDirectionSummary from "./DesignDirectionSummary";

type Props = {
  value: WebsiteDesignDirection;
  // Async submit callback. Returns nothing on success, throws or rejects on failure.
  onSubmit: (input: WebsiteDesignDirectionInput) => Promise<void>;
};

// Style-only pill record. Labels come from i18n keys at
// portalToken.directionModule.statusPill.*
const STATUS_PILL_STYLE: Record<
  WebsiteDesignDirection["status"],
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

const STATUS_PILL_KEY: Record<WebsiteDesignDirection["status"], string> = {
  not_started: "notStarted",
  waiting_on_client: "waitingOnClient",
  submitted: "submitted",
  under_review: "underReview",
  changes_requested: "changesRequested",
  approved: "approved",
  locked: "locked",
};

const SUBTITLE: Record<WebsiteDesignDirection["status"], string> = {
  not_started:
    "Before the full build starts, choose the visual direction that best matches your business.",
  waiting_on_client:
    "Choose your design direction. CrecyStudio uses your input to make professional decisions about layout, typography, and visual hierarchy.",
  submitted:
    "CrecyStudio is reviewing your direction and will lock the visual path before the build begins.",
  under_review:
    "CrecyStudio is reviewing your direction. We'll respond shortly.",
  changes_requested:
    "CrecyStudio needs a little more detail before the direction can be locked. See the note below and resubmit.",
  approved:
    "Your design direction has been approved. CrecyStudio will use it to guide the first preview.",
  locked:
    "Design direction is locked. Major visual changes may affect the timeline or require a change order.",
};

export default function DesignDirectionCard({ value, onSubmit }: Props) {
  const t = useTranslations("portalToken.directionModule");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pillStyle = STATUS_PILL_STYLE[value.status];
  const pillLabel = t(`statusPill.${STATUS_PILL_KEY[value.status]}`);

  async function handleSubmit(input: WebsiteDesignDirectionInput) {
    setError(null);
    setSaving(true);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitDesignDirectionError"));
    } finally {
      setSaving(false);
    }
  }

  const isFormState = value.status === "waiting_on_client" || value.status === "changes_requested" || value.status === "not_started";

  return (
    <div
      className="portalPanel fadeUp"
      style={{ animationDelay: "0.04s", marginBottom: "1rem", border: value.status === "waiting_on_client" || value.status === "changes_requested" ? "1px solid var(--accent)" : undefined }}
    >
      <div className="portalPanelHeader">
        <div>
          <h2 className="portalPanelTitle">{t("title.design")}</h2>
          {/* Lane-specific subtitle copy stays inline — verbose marketing
              text per status that's better edited as code than carried as
              messages.json bloat. */}
          <div className="portalMessageIntro">{SUBTITLE[value.status]}</div>
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
          <DesignDirectionForm
            initial={value}
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
          />
        ) : (
          <DesignDirectionSummary value={value} />
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
            {t("lockedNoticeDesignDirection")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
