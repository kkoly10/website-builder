import { RevisionPolicy } from "@/lib/projectTypes";

export default function RevisionTracker({ revisions }: { revisions: RevisionPolicy }) {
  const remaining = Math.max(0, revisions.included - revisions.used);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>Revisions</h3>

      <div style={{ display: "grid", gap: 8 }}>
        <Row label="Included" value={`${revisions.included}`} />
        <Row label="Used" value={`${revisions.used}`} />
        <Row label="Remaining" value={`${remaining}`} />
      </div>

      <p style={{ margin: 0, marginTop: 12, color: "#6B7280", fontSize: 13 }}>
        Revisions are used during designated review stages (design review + final review).
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
      <div style={{ color: "#6B7280", fontSize: 13 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{value}</div>
    </div>
  );
}