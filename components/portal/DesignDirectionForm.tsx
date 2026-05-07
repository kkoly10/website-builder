"use client";

import { useState, type FormEvent } from "react";
import {
  type DesignControlLevel,
  type WebsiteDesignDirection,
  type WebsiteDesignDirectionInput,
  type ReferenceWebsite,
  BRAND_MOOD_OPTIONS,
  CONTENT_TONE_OPTIONS,
  CONTROL_LEVEL_OPTIONS,
  IMAGERY_DIRECTION_OPTIONS,
  TYPOGRAPHY_FEEL_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from "@/lib/designDirection";

type Props = {
  initial: WebsiteDesignDirection;
  saving: boolean;
  error: string | null;
  onSubmit: (value: WebsiteDesignDirectionInput) => Promise<void> | void;
};

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
}: {
  options: readonly T[];
  value: T[] | T;
  onChange: (value: T[] | T) => void;
  multi?: boolean;
  max?: number;
  ariaLabel: string;
}) {
  const isSelected = (option: T) =>
    multi ? (value as T[]).includes(option) : value === option;
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = isSelected(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
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
            }}
          >
            {option}
          </button>
        );
      })}
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
        <div key={index} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto" }}>
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

export default function DesignDirectionForm({ initial, saving, error, onSubmit }: Props) {
  const [controlLevel, setControlLevel] = useState<DesignControlLevel>(initial.controlLevel);
  const [brandMood, setBrandMood] = useState<string[]>(initial.brandMood);
  const [visualStyle, setVisualStyle] = useState<string>(initial.visualStyle);
  const [brandColorsKnown, setBrandColorsKnown] = useState(initial.brandColorsKnown);
  const [preferredColors, setPreferredColors] = useState(initial.preferredColors);
  const [colorsToAvoid, setColorsToAvoid] = useState(initial.colorsToAvoid);
  const [letCrecyChoosePalette, setLetCrecyChoosePalette] = useState(initial.letCrecyChoosePalette);
  const [typographyFeel, setTypographyFeel] = useState(initial.typographyFeel);
  const [imageryDirection, setImageryDirection] = useState<string[]>(initial.imageryDirection);
  const [likedWebsites, setLikedWebsites] = useState<ReferenceWebsite[]>(initial.likedWebsites);
  const [dislikedWebsites, setDislikedWebsites] = useState<ReferenceWebsite[]>(initial.dislikedWebsites);
  const [contentTone, setContentTone] = useState<string[]>(initial.contentTone);
  const [hasLogo, setHasLogo] = useState(initial.hasLogo);
  const [hasBrandGuide, setHasBrandGuide] = useState(initial.hasBrandGuide);
  const [brandAssetsNotes, setBrandAssetsNotes] = useState(initial.brandAssetsNotes);
  const [clientNotes, setClientNotes] = useState(initial.clientNotes);
  const [approvedDirectionTerms, setApprovedDirectionTerms] = useState(initial.approvedDirectionTerms);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void onSubmit({
      controlLevel,
      brandMood,
      visualStyle,
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
      {/* Control level */}
      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        <legend className="fieldLabel" style={{ marginBottom: 4 }}>
          How involved do you want to be?
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

      {/* Brand mood */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Brand mood (pick up to 3)</label>
        <PillSelect
          options={BRAND_MOOD_OPTIONS}
          value={brandMood}
          onChange={(v) => setBrandMood(v as string[])}
          multi
          max={3}
          ariaLabel="Brand mood"
        />
      </div>

      {/* Visual style */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Visual style</label>
        <PillSelect
          options={VISUAL_STYLE_OPTIONS}
          value={visualStyle}
          onChange={(v) => setVisualStyle(v as string)}
          ariaLabel="Visual style"
        />
      </div>

      {/* Color guidance */}
      <div style={{ display: "grid", gap: 12 }}>
        <label className="fieldLabel">Color guidance</label>
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
              {opt === "yes" ? "I have brand colors" : opt === "no" ? "No brand colors yet" : "Not sure"}
            </label>
          ))}
        </div>
        <input
          className="input"
          type="text"
          placeholder="Preferred colors (e.g. navy, white, gold)"
          value={preferredColors}
          onChange={(e) => setPreferredColors(e.target.value)}
        />
        <input
          className="input"
          type="text"
          placeholder="Colors to avoid"
          value={colorsToAvoid}
          onChange={(e) => setColorsToAvoid(e.target.value)}
        />
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--muted)" }}>
          <input
            type="checkbox"
            checked={letCrecyChoosePalette}
            onChange={(e) => setLetCrecyChoosePalette(e.target.checked)}
          />
          Let CrecyStudio choose the final palette.
        </label>
      </div>

      {/* Typography feel */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Typography feel</label>
        <PillSelect
          options={TYPOGRAPHY_FEEL_OPTIONS}
          value={typographyFeel}
          onChange={(v) => setTypographyFeel(v as string)}
          ariaLabel="Typography feel"
        />
      </div>

      {/* Imagery direction */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Imagery direction</label>
        <PillSelect
          options={IMAGERY_DIRECTION_OPTIONS}
          value={imageryDirection}
          onChange={(v) => setImageryDirection(v as string[])}
          multi
          ariaLabel="Imagery direction"
        />
      </div>

      {/* Reference websites */}
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="fieldLabel">Websites you like (up to 3)</label>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Be specific in the reason: layout, colors, tone, simplicity, premium feel, etc.
          </p>
        </div>
        <ReferenceListEditor
          value={likedWebsites}
          onChange={setLikedWebsites}
          max={3}
          urlPlaceholder="https://example.com"
          reasonPlaceholder="What you like about it"
          addLabel="Add a liked website"
          removeLabel="Remove liked website"
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <label className="fieldLabel">Websites you dislike (up to 2, optional)</label>
        <ReferenceListEditor
          value={dislikedWebsites}
          onChange={setDislikedWebsites}
          max={2}
          urlPlaceholder="https://example.com"
          reasonPlaceholder="What you don't like about it"
          addLabel="Add a disliked website"
          removeLabel="Remove disliked website"
        />
      </div>

      {/* Content tone */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Content tone (pick 1 or 2)</label>
        <PillSelect
          options={CONTENT_TONE_OPTIONS}
          value={contentTone}
          onChange={(v) => setContentTone(v as string[])}
          multi
          max={2}
          ariaLabel="Content tone"
        />
      </div>

      {/* Brand assets */}
      <div style={{ display: "grid", gap: 12 }}>
        <label className="fieldLabel">Existing brand assets</label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Logo</span>
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
                  {opt === "yes" ? "Yes" : opt === "no" ? "No" : "In progress"}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Brand guide</span>
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
                  {opt === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          </div>
        </div>
        <textarea
          className="input"
          rows={3}
          placeholder="Any notes about existing brand assets, fonts, colors, or guidelines"
          value={brandAssetsNotes}
          onChange={(e) => setBrandAssetsNotes(e.target.value)}
        />
      </div>

      {/* Client notes */}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="fieldLabel">Anything else we should know?</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Optional context about your audience, tone, competitors, deadlines, etc."
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
          I approve this design direction. CrecyStudio will make professional decisions around
          layout, spacing, typography, responsive behavior, and visual hierarchy based on this
          direction. Major style changes after approval may affect the timeline or require a
          change order.
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

      <div>
        <button
          type="submit"
          className="btn btnPrimary"
          disabled={saving || !approvedDirectionTerms}
          style={{ padding: "12px 22px", fontSize: 14 }}
        >
          {saving ? "Submitting..." : "Submit design direction"}
          <span className="btnArrow"> →</span>
        </button>
      </div>
    </form>
  );
}
