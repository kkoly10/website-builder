import { ProjectReferences } from "@/lib/projectTypes";

export default function ReferencesCard({ refs }: { refs: ProjectReferences }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>Project References</h3>

      {refs.referenceUrl ? (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#6B7280", fontSize: 13, marginBottom: 6 }}>
            Reference website
          </div>
          <a
            href={refs.referenceUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#111827",
              fontWeight: 700,
              textDecoration: "underline",
              wordBreak: "break-word",
            }}
          >
            {refs.referenceUrl}
          </a>
        </div>
      ) : (
        <div style={{ color: "#6B7280", fontSize: 13, marginBottom: 10 }}>
          No reference link provided yet.
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <Block title="Client notes" text={refs.clientNotes} />
        <Block title="Internal notes" text={refs.internalNotes} subtle />
      </div>
    </div>
  );
}

function Block({
  title,
  text,
  subtle,
}: {
  title: string;
  text?: string;
  subtle?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: 12,
        background: subtle ? "#F9FAFB" : "#F3F4F6",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>
        {text || "—"}
      </div>
    </div>
  );
}