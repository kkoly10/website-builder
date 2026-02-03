import { Milestone, MilestoneKey } from "@/lib/projectTypes";

function iconForState(state: "done" | "active" | "todo") {
  if (state === "done") return "✔";
  if (state === "active") return "⏳";
  return "•";
}

export default function MilestoneTimeline({
  milestones,
  activeKey,
}: {
  milestones: Milestone[];
  activeKey: MilestoneKey;
}) {
  const activeIndex = milestones.findIndex((m) => m.key === activeKey);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>Milestones</h3>

      <div style={{ display: "grid", gap: 10 }}>
        {milestones.map((m, idx) => {
          const state: "done" | "active" | "todo" =
            idx < activeIndex ? "done" : idx === activeIndex ? "active" : "todo";

          const color =
            state === "done" ? "#065F46" : state === "active" ? "#92400E" : "#6B7280";

          return (
            <div
              key={m.key}
              style={{
                display: "grid",
                gridTemplateColumns: "26px 1fr",
                gap: 10,
                alignItems: "start",
                padding: 10,
                borderRadius: 12,
                background: state === "active" ? "#FFFBEB" : "#F9FAFB",
                border: state === "active" ? "1px solid #FDE68A" : "1px solid #F3F4F6",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                }}
                aria-label={state}
                title={state}
              >
                {iconForState(state)}
              </div>

              <div>
                <div style={{ fontWeight: 700, color: "#111827" }}>{m.title}</div>
                {m.description ? (
                  <div style={{ marginTop: 4, color: "#6B7280", fontSize: 13 }}>
                    {m.description}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ margin: 0, marginTop: 12, color: "#6B7280", fontSize: 13 }}>
        You’ll always see exactly what stage your project is in.
      </p>
    </div>
  );
}