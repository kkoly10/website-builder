import type { WebsiteDesignDirection } from "@/lib/designDirection";
import { CONTROL_LEVEL_OPTIONS } from "@/lib/designDirection";

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

export default function DesignDirectionSummary({ value }: { value: WebsiteDesignDirection }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Row label="Direction">{controlLevelLabel(value.controlLevel)}</Row>
      <Row label="Brand mood">{joinList(value.brandMood)}</Row>
      <Row label="Visual style">{value.visualStyle}</Row>
      <Row label="Colors">
        {value.preferredColors || (value.brandColorsKnown === "yes" ? "Provided" : value.letCrecyChoosePalette ? "CrecyStudio to choose" : "Not specified")}
      </Row>
      {value.colorsToAvoid ? <Row label="Avoid">{value.colorsToAvoid}</Row> : null}
      <Row label="Typography">{value.typographyFeel}</Row>
      {value.imageryDirection.length > 0 ? <Row label="Imagery">{joinList(value.imageryDirection)}</Row> : null}
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
            Note from CrecyStudio
          </div>
          {value.adminPublicNote}
        </div>
      ) : null}
    </div>
  );
}
