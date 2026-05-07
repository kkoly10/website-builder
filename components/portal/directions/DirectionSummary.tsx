import type { GenericDirection } from "@/lib/directions/types";
import type { DirectionSchema } from "@/lib/directions/schemas";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 200px) 1fr",
        gap: 16,
        paddingBottom: 12,
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.6 }}>
        {children || <span style={{ color: "var(--muted)" }}>—</span>}
      </div>
    </div>
  );
}

function renderValue(value: unknown): React.ReactNode {
  if (value == null || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.filter((v) => typeof v === "string" && v.trim()).join(", ");
  }
  if (typeof value === "string") return value;
  return String(value);
}

export default function DirectionSummary({
  value,
  schema,
}: {
  value: GenericDirection;
  schema: DirectionSchema;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {schema.fields.map((field) => (
        <Row key={field.key} label={field.label}>
          {renderValue(value.payload[field.key])}
        </Row>
      ))}
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
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Note from CrecyStudio
          </div>
          {value.adminPublicNote}
        </div>
      ) : null}
    </div>
  );
}
