"use client";

import { useTranslations } from "next-intl";
import type { WebsiteDesignDirection } from "@/lib/designDirection";
import {
  CONTROL_LEVEL_OPTIONS,
  IMAGERY_DIRECTION_VISUALS,
  TYPOGRAPHY_FEEL_VISUALS,
  VISUAL_STYLE_VISUALS,
} from "@/lib/designDirection";
import {
  ImageryGlyph,
  StyleSketch,
  TypeSample,
} from "./design-direction-visuals";

function controlLevelLabel(value: string) {
  return CONTROL_LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 180px) 1fr",
        gap: 16,
        paddingBottom: 12,
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.6 }}>
        {children || <span style={{ color: "var(--muted)" }}>—</span>}
      </div>
    </div>
  );
}

function joinList(values: string[] | undefined | null) {
  if (!values || values.length === 0) return "";
  return values.join(", ");
}

// Read-only 5-tick visualization of a single taste axis. Used by both
// client and admin (admin re-renders Summary in DesignDirectionAdminPanel),
// so a single update here surfaces taste data to both surfaces.
function TasteBar({
  leftLabel,
  rightLabel,
  value,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
}) {
  const ticks = [-2, -1, 0, 1, 2];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(80px, 110px) 1fr minmax(80px, 110px)",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>{leftLabel}</span>
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
        {ticks.map((t) => (
          <span
            key={t}
            aria-hidden
            style={{
              width: t === value ? 12 : 8,
              height: t === value ? 12 : 8,
              borderRadius: 999,
              background: t === value ? "var(--accent)" : "var(--rule)",
              transition: "all 120ms ease",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{rightLabel}</span>
    </div>
  );
}

export default function DesignDirectionSummary({ value }: { value: WebsiteDesignDirection }) {
  const t = useTranslations("portalToken.directionModule");
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Row label="Direction">{controlLevelLabel(value.controlLevel)}</Row>
      {value.taste ? (
        <Row label="Taste">
          <div style={{ display: "grid", gap: 8 }}>
            <TasteBar leftLabel="Calm" rightLabel="Energetic" value={value.taste.calmEnergetic} />
            <TasteBar leftLabel="Traditional" rightLabel="Modern" value={value.taste.traditionalModern} />
            <TasteBar leftLabel="Stripped" rightLabel="Layered" value={value.taste.strippedLayered} />
            <TasteBar leftLabel="Warm-toned" rightLabel="Cool-toned" value={value.taste.warmCool} />
          </div>
        </Row>
      ) : null}
      <Row label="Brand mood">{joinList(value.brandMood)}</Row>
      <Row label="Visual style">
        {value.visualStyle ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {VISUAL_STYLE_VISUALS[value.visualStyle as keyof typeof VISUAL_STYLE_VISUALS] ? (
              <StyleSketch
                sketch={VISUAL_STYLE_VISUALS[value.visualStyle as keyof typeof VISUAL_STYLE_VISUALS]}
              />
            ) : null}
            <span>{value.visualStyle}</span>
          </span>
        ) : (
          ""
        )}
      </Row>
      <Row label="Colors">
        {value.preferredColors || (value.brandColorsKnown === "yes" ? "Provided" : value.letCrecyChoosePalette ? "CrecyStudio to choose" : "Not specified")}
      </Row>
      {value.colorsToAvoid ? <Row label="Avoid">{value.colorsToAvoid}</Row> : null}
      <Row label="Typography">
        {value.typographyFeel ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {TYPOGRAPHY_FEEL_VISUALS[value.typographyFeel as keyof typeof TYPOGRAPHY_FEEL_VISUALS] ? (
              <TypeSample
                sample={TYPOGRAPHY_FEEL_VISUALS[value.typographyFeel as keyof typeof TYPOGRAPHY_FEEL_VISUALS]}
              />
            ) : null}
            <span>{value.typographyFeel}</span>
          </span>
        ) : (
          ""
        )}
      </Row>
      {value.imageryDirection.length > 0 ? (
        <Row label="Imagery">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {value.imageryDirection.map((opt) => {
              const key = IMAGERY_DIRECTION_VISUALS[opt as keyof typeof IMAGERY_DIRECTION_VISUALS];
              return (
                <span key={opt} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {key ? <ImageryGlyph glyph={key} /> : null}
                  <span>{opt}</span>
                </span>
              );
            })}
          </div>
        </Row>
      ) : null}
      <Row label="Tone">{joinList(value.contentTone)}</Row>
      {value.likedWebsites.length > 0 ? (
        <Row label="Liked sites">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {value.likedWebsites.map((w, i) => (
              <li key={i}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>
                  {w.url}
                </a>
                {w.reason ? <span style={{ color: "var(--muted)" }}> — {w.reason}</span> : null}
              </li>
            ))}
          </ul>
        </Row>
      ) : null}
      {value.dislikedWebsites.length > 0 ? (
        <Row label="Disliked sites">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {value.dislikedWebsites.map((w, i) => (
              <li key={i}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>
                  {w.url}
                </a>
                {w.reason ? <span style={{ color: "var(--muted)" }}> — {w.reason}</span> : null}
              </li>
            ))}
          </ul>
        </Row>
      ) : null}
      {value.clientNotes ? <Row label="Notes">{value.clientNotes}</Row> : null}
      {value.adminPublicNote ? (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--rule)",
            background: "var(--paper-2)",
            fontSize: 13,
            color: "var(--fg)",
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
            {t("noteFromCrecyStudio")}
          </div>
          {value.adminPublicNote}
        </div>
      ) : null}
    </div>
  );
}
