"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import styles from "./design-direction-form.module.css";
import {
  type DesignControlLevel,
  type WebsiteDesignDirection,
  type WebsiteDesignDirectionInput,
  type ReferenceWebsite,
  type TasteSpectrum,
  BRAND_MOOD_OPTIONS,
  CONTENT_TONE_OPTIONS,
  CONTROL_LEVEL_OPTIONS,
  IMAGERY_DIRECTION_OPTIONS,
  IMAGERY_DIRECTION_VISUALS,
  TYPOGRAPHY_FEEL_OPTIONS,
  TYPOGRAPHY_FEEL_VISUALS,
  VISUAL_STYLE_OPTIONS,
  VISUAL_STYLE_VISUALS,
} from "@/lib/designDirection";
import {
  ImageryGlyph,
  StyleSketch,
  TypeSample,
} from "./design-direction-visuals";

type Props = {
  initial: WebsiteDesignDirection;
  saving: boolean;
  error: string | null;
  onSubmit: (value: WebsiteDesignDirectionInput) => Promise<void> | void;
  // Optional auto-save callback. When provided, the form debounces every
  // change at ~800ms and persists the current values as a draft. Returns
  // a Promise so the form can surface "saving / saved" status.
  onSaveDraft?: (value: WebsiteDesignDirectionInput) => Promise<void>;
};

type DraftStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error" };

function toggleInArray<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function PillSelect<T extends string>({
  options,
  value,
  onChange,
  multi = false,
  max,
  ariaLabel,
  renderVisual,
}: {
  options: readonly T[];
  value: T[] | T;
  onChange: (value: T[] | T) => void;
  multi?: boolean;
  max?: number;
  ariaLabel: string;
  // Optional visual rendered to the left of each pill's label. Used by
  // visual-style / typography / imagery options to give the client an
  // actual idea of what each choice looks like instead of just text.
  renderVisual?: (option: T) => React.ReactNode;
}) {
  const isSelected = (option: T) =>
    multi ? (value as T[]).includes(option) : value === option;
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = isSelected(option);
        const visual = renderVisual?.(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            className={styles.pill}
            onClick={() => {
              if (multi) {
                const arr = value as T[];
                if (!selected && max !== undefined && arr.length >= max) return;
                onChange(toggleInArray(arr, option));
              } else {
                onChange(option);
              }
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid",
              borderColor: selected ? "var(--accent)" : "var(--rule)",
              background: selected ? "var(--accent-bg)" : "var(--paper-2)",
              color: selected ? "var(--accent-2)" : "var(--fg)",
              fontSize: 13,
              fontWeight: selected ? 700 : 500,
              cursor: "pointer",
              transition: "all 120ms ease",
              display: "inline-flex",
              alignItems: "center",
              gap: visual ? 8 : 0,
            }}
          >
            {visual}
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function TasteSliderRow({
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.tasteSliderRow}>
      <span style={{ fontSize: 13, color: "var(--muted)", textAlign: "right" }}>{leftLabel}</span>
      <input
        type="range"
        min={-2}
        max={2}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={`${leftLabel} to ${rightLabel}`}
        style={{ width: "100%" }}
      />
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{rightLabel}</span>
    </div>
  );
}

function ReferenceListEditor({
  value,
  onChange,
  max,
  urlPlaceholder,
  reasonPlaceholder,
  addLabel,
  removeLabel,
}: {
  value: ReferenceWebsite[];
  onChange: (value: ReferenceWebsite[]) => void;
  max: number;
  urlPlaceholder: string;
  reasonPlaceholder: string;
  addLabel: string;
  removeLabel: string;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {value.map((item, index) => (
        <div key={index} className={styles.referenceItem}>
          <div style={{ display: "grid", gap: 6 }}>
            <input
              className="input"
              type="url"
              value={item.url}
              placeholder={urlPlaceholder}
              onChange={(e) => {
                const next = [...value];
                next[index] = { ...item, url: e.target.value };
                onChange(next);
              }}
            />
            <input
              className="input"
              type="text"
              value={item.reason}
              placeholder={reasonPlaceholder}
              onChange={(e) => {
                const next = [...value];
                next[index] = { ...item, reason: e.target.value };
                onChange(next);
              }}
            />
          </div>
          <button
            type="button"
            className="btn btnGhost"
            onClick={() => {
              onChange(value.filter((_, i) => i !== index));
            }}
            aria-label={removeLabel}
            style={{ alignSelf: "start" }}
          >
            ✕
          </button>
        </div>
      ))}
      {value.length < max ? (
        <button
          type="button"
          className="btn btnGhost"
          style={{ justifySelf: "start" }}
          onClick={() => onChange([...value, { url: "", reason: "" }])}
        >
          + {addLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function DesignDirectionForm({ initial, saving, error, onSubmit, onSaveDraft }: Props) {
  const t = useTranslations("portalToken.designDirection");
  // Prefer in-progress draft values over the underlying record's stored
  // values. Falls back to the record when no draft exists. Lets the client
  // close the tab mid-form and resume where they left off.
  const seed = initial.draftPayload ?? initial;

  const [controlLevel, setControlLevel] = useState<DesignControlLevel>(seed.controlLevel);
  // Filter to current allowlist so historical mood values (pre-sharpening)
  // don't render as "selected" against pills that no longer exist. Old
  // values are still safe in the stored record; they just won't pre-select
  // on a resubmission flow.
  const [brandMood, setBrandMood] = useState<string[]>(
    seed.brandMood.filter((m) => (BRAND_MOOD_OPTIONS as readonly string[]).includes(m)),
  );
  const [visualStyle, setVisualStyle] = useState<string>(seed.visualStyle);
  const [taste, setTaste] = useState<TasteSpectrum>(seed.taste);
  const [brandColorsKnown, setBrandColorsKnown] = useState(seed.brandColorsKnown);
  const [preferredColors, setPreferredColors] = useState(seed.preferredColors);
  const [colorsToAvoid, setColorsToAvoid] = useState(seed.colorsToAvoid);
  const [letCrecyChoosePalette, setLetCrecyChoosePalette] = useState(seed.letCrecyChoosePalette);
  const [typographyFeel, setTypographyFeel] = useState(seed.typographyFeel);
  const [imageryDirection, setImageryDirection] = useState<string[]>(seed.imageryDirection);
  const [likedWebsites, setLikedWebsites] = useState<ReferenceWebsite[]>(seed.likedWebsites);
  const [dislikedWebsites, setDislikedWebsites] = useState<ReferenceWebsite[]>(seed.dislikedWebsites);
  const [contentTone, setContentTone] = useState<string[]>(seed.contentTone);
  const [hasLogo, setHasLogo] = useState(seed.hasLogo);
  const [hasBrandGuide, setHasBrandGuide] = useState(seed.hasBrandGuide);
  const [brandAssetsNotes, setBrandAssetsNotes] = useState(seed.brandAssetsNotes);
  const [clientNotes, setClientNotes] = useState(seed.clientNotes);
  // Approval terms are never carried forward from a draft — the client
  // must re-tick the box at submit time.
  const [approvedDirectionTerms, setApprovedDirectionTerms] = useState(
    initial.draftPayload ? false : initial.approvedDirectionTerms,
  );

  // Auto-save plumbing. Skip the initial render so opening the form for
  // the first time doesn't immediately write a draft over an existing
  // record. After that, every state change schedules an 800ms-debounced
  // save.
  const [draftStatus, setDraftStatus] = useState<DraftStatus>(() =>
    initial.draftSavedAt
      ? {
          kind: "saved",
          at: new Date(initial.draftSavedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        }
      : { kind: "idle" },
  );
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!onSaveDraft) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const timer = setTimeout(async () => {
      setDraftStatus({ kind: "saving" });
      try {
        await onSaveDraft({
          controlLevel,
          brandMood,
          visualStyle,
          taste,
          brandColorsKnown,
          preferredColors,
          colorsToAvoid,
          letCrecyChoosePalette,
          typographyFeel,
          imageryDirection,
          likedWebsites: likedWebsites.filter((w) => w.url.trim().length > 0 || w.reason.trim().length > 0),
          dislikedWebsites: dislikedWebsites.filter((w) => w.url.trim().length > 0 || w.reason.trim().length > 0),
          contentTone,
          hasLogo,
          hasBrandGuide,
          brandAssetsNotes,
          clientNotes,
          // approvedDirectionTerms is intentionally not saved — see seed
          // hydration above; clients must re-tick at submit.
          approvedDirectionTerms: false,
        });
        const now = new Date();
        setDraftStatus({
          kind: "saved",
          at: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        });
      } catch {
        setDraftStatus({ kind: "error" });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [
    onSaveDraft,
    controlLevel,
    brandMood,
    visualStyle,
    taste,
    brandColorsKnown,
    preferredColors,
    colorsToAvoid,
    letCrecyChoosePalette,
    typographyFeel,
    imageryDirection,
    likedWebsites,
    dislikedWebsites,
    contentTone,
    hasLogo,
    hasBrandGuide,
    brandAssetsNotes,
    clientNotes,
  ]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void onSubmit({
      controlLevel,
      brandMood,
      visualStyle,
      taste,
      brandColorsKnown,
      preferredColors,
      colorsToAvoid,
      letCrecyChoosePalette,
      typographyFeel,
      imageryDirection,
      likedWebsites: likedWebsites.filter((w) => w.url.trim().length > 0),
      dislikedWebsites: dislikedWebsites.filter((w) => w.url.trim().length > 0),
      contentTone,
      hasLogo,
      hasBrandGuide,
      brandAssetsNotes,
      clientNotes,
      approvedDirectionTerms,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Control level */}
      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        <legend className="fieldLabel" style={{ marginBottom: 4 }}>
          {t("controlLevelLegend")}
        </legend>
        {CONTROL_LEVEL_OPTIONS.map((option) => {
          const selected = controlLevel === option.value;
          return (
            <label
              key={option.value}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 12,
                padding: 14,
                border: "1px solid",
                borderColor: selected ? "var(--accent)" : "var(--rule)",
                borderRadius: 12,
                background: selected ? "var(--accent-bg)" : "var(--paper-2)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="controlLevel"
                value={option.value}
                checked={selected}
                onChange={() => setControlLevel(option.value)}
                style={{ marginTop: 4 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--fg)" }}>
                  {option.label}
                  <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                    {option.recommendedTier}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
                  {option.description}
                </div>
              </div>
            </label>
          );
        })}
      </fieldset>

      {/* Taste spectrum — adjective-pair sliders. Forces a real lean on each
          axis where pill mush ("Clean + Premium + Modern") can't. */}
      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
        <legend className="fieldLabel" style={{ marginBottom: 0 }}>{t("tasteLegend")}</legend>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
          {t("tasteHelper")}
        </p>
        <TasteSliderRow
          leftLabel={t("tasteAxes.calm")}
          rightLabel={t("tasteAxes.energetic")}
          value={taste.calmEnergetic}
          onChange={(v) => setTaste((prev) => ({ ...prev, calmEnergetic: v }))}
        />
        <TasteSliderRow
          leftLabel={t("tasteAxes.traditional")}
          rightLabel={t("tasteAxes.modern")}
          value={taste.traditionalModern}
          onChange={(v) => setTaste((prev) => ({ ...prev, traditionalModern: v }))}
        />
        <TasteSliderRow
          leftLabel={t("tasteAxes.stripped")}
          rightLabel={t("tasteAxes.layered")}
          value={taste.strippedLayered}
          onChange={(v) => setTaste((prev) => ({ ...prev, strippedLayered: v }))}
        />
        <TasteSliderRow
          leftLabel={t("tasteAxes.warmToned")}
          rightLabel={t("tasteAxes.coolToned")}
          value={taste.warmCool}
          onChange={(v) => setTaste((prev) => ({ ...prev, warmCool: v }))}
        />
      </fieldset>

      {/* Brand mood */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">{t("brandMoodLabel")}</label>
        <PillSelect
          options={BRAND_MOOD_OPTIONS}
          value={brandMood}
          onChange={(v) => setBrandMood(v as string[])}
          multi
          max={3}
          ariaLabel={t("brandMoodAria")}
        />
      </div>

      {/* Visual style */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">{t("visualStyleLabel")}</label>
        <PillSelect
          options={VISUAL_STYLE_OPTIONS}
          value={visualStyle}
          onChange={(v) => setVisualStyle(v as string)}
          ariaLabel={t("visualStyleAria")}
          renderVisual={(opt) => <StyleSketch sketch={VISUAL_STYLE_VISUALS[opt]} />}
        />
      </div>

      {/* Color guidance */}
      <div style={{ display: "grid", gap: 12 }}>
        <label className="fieldLabel">{t("colorGuidanceLabel")}</label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {(["yes", "no", "not_sure"] as const).map((opt) => (
            <label key={opt} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
              <input
                type="radio"
                name="brandColorsKnown"
                value={opt}
                checked={brandColorsKnown === opt}
                onChange={() => setBrandColorsKnown(opt)}
              />
              {opt === "yes"
                ? t("brandColorsKnown.yes")
                : opt === "no"
                  ? t("brandColorsKnown.no")
                  : t("brandColorsKnown.notSure")}
            </label>
          ))}
        </div>
        <input
          className="input"
          type="text"
          placeholder={t("preferredColorsPlaceholder")}
          value={preferredColors}
          onChange={(e) => setPreferredColors(e.target.value)}
        />
        <input
          className="input"
          type="text"
          placeholder={t("colorsToAvoidPlaceholder")}
          value={colorsToAvoid}
          onChange={(e) => setColorsToAvoid(e.target.value)}
        />
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--muted)" }}>
          <input
            type="checkbox"
            checked={letCrecyChoosePalette}
            onChange={(e) => setLetCrecyChoosePalette(e.target.checked)}
          />
          {t("letStudioChoosePalette")}
        </label>
      </div>

      {/* Typography feel */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">{t("typographyFeelLabel")}</label>
        <PillSelect
          options={TYPOGRAPHY_FEEL_OPTIONS}
          value={typographyFeel}
          onChange={(v) => setTypographyFeel(v as string)}
          ariaLabel={t("typographyFeelAria")}
          renderVisual={(opt) => <TypeSample sample={TYPOGRAPHY_FEEL_VISUALS[opt]} />}
        />
      </div>

      {/* Imagery direction */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">{t("imageryDirectionLabel")}</label>
        <PillSelect
          options={IMAGERY_DIRECTION_OPTIONS}
          value={imageryDirection}
          onChange={(v) => setImageryDirection(v as string[])}
          multi
          ariaLabel={t("imageryDirectionAria")}
          renderVisual={(opt) => <ImageryGlyph glyph={IMAGERY_DIRECTION_VISUALS[opt]} />}
        />
      </div>

      {/* Reference websites */}
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="fieldLabel">{t("likedWebsitesLabel")}</label>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            {t("likedWebsitesHelper")}
          </p>
        </div>
        <ReferenceListEditor
          value={likedWebsites}
          onChange={setLikedWebsites}
          max={3}
          urlPlaceholder={t("urlPlaceholder")}
          reasonPlaceholder={t("likedWebsitesReasonPlaceholder")}
          addLabel={t("likedWebsitesAdd")}
          removeLabel={t("likedWebsitesRemove")}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <label className="fieldLabel">{t("dislikedWebsitesLabel")}</label>
        <ReferenceListEditor
          value={dislikedWebsites}
          onChange={setDislikedWebsites}
          max={2}
          urlPlaceholder={t("urlPlaceholder")}
          reasonPlaceholder={t("dislikedWebsitesReasonPlaceholder")}
          addLabel={t("dislikedWebsitesAdd")}
          removeLabel={t("dislikedWebsitesRemove")}
        />
      </div>

      {/* Content tone */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">{t("contentToneLabel")}</label>
        <PillSelect
          options={CONTENT_TONE_OPTIONS}
          value={contentTone}
          onChange={(v) => setContentTone(v as string[])}
          multi
          max={2}
          ariaLabel={t("contentToneAria")}
        />
      </div>

      {/* Brand assets */}
      <div style={{ display: "grid", gap: 12 }}>
        <label className="fieldLabel">{t("brandAssetsLabel")}</label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("logoLabel")}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {(["yes", "no", "in_progress"] as const).map((opt) => (
                <label key={opt} style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="radio"
                    name="hasLogo"
                    value={opt}
                    checked={hasLogo === opt}
                    onChange={() => setHasLogo(opt)}
                  />
                  {opt === "yes"
                    ? t("yesNo.yes")
                    : opt === "no"
                      ? t("yesNo.no")
                      : t("yesNo.inProgress")}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("brandGuideLabel")}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {(["yes", "no"] as const).map((opt) => (
                <label key={opt} style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="radio"
                    name="hasBrandGuide"
                    value={opt}
                    checked={hasBrandGuide === opt}
                    onChange={() => setHasBrandGuide(opt)}
                  />
                  {opt === "yes" ? t("yesNo.yes") : t("yesNo.no")}
                </label>
              ))}
            </div>
          </div>
        </div>
        <textarea
          className="input"
          rows={3}
          placeholder={t("brandAssetsNotesPlaceholder")}
          value={brandAssetsNotes}
          onChange={(e) => setBrandAssetsNotes(e.target.value)}
        />
      </div>

      {/* Client notes */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">{t("clientNotesLabel")}</label>
        <textarea
          className="input"
          rows={3}
          placeholder={t("clientNotesPlaceholder")}
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
        />
      </div>

      {/* Approval terms */}
      <label
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 12,
          padding: 14,
          border: "1px solid var(--rule)",
          borderRadius: 12,
          background: "var(--paper-2)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={approvedDirectionTerms}
          onChange={(e) => setApprovedDirectionTerms(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.6 }}>
          {t("approvalTerms")}
        </div>
      </label>

      {error ? (
        <div
          style={{
            padding: 12,
            border: "1px solid var(--accent)",
            background: "var(--accent-bg)",
            color: "var(--accent-2)",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          type="submit"
          className="btn btnPrimary"
          disabled={saving || !approvedDirectionTerms}
          style={{ padding: "12px 22px", fontSize: 14 }}
        >
          {saving ? t("submittingButton") : t("submitButton")}
         
        </button>
        {onSaveDraft ? (
          <span style={{ fontSize: 12, color: "var(--muted)" }} aria-live="polite">
            {draftStatus.kind === "saving" ? "Saving…" : null}
            {draftStatus.kind === "saved" ? `Draft saved · ${draftStatus.at}` : null}
            {draftStatus.kind === "error" ? "Couldn't save draft — your input stays in this tab." : null}
          </span>
        ) : null}
      </div>
    </form>
  );
}
