import { MilestoneKey, ProjectStatus } from "@/lib/projectTypes";

export default function ActionPanel({
  status,
  activeMilestoneKey,
}: {
  status: ProjectStatus;
  activeMilestoneKey: MilestoneKey;
}) {
  const action = getAction(status, activeMilestoneKey);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>Next Action</h3>

      <div
        style={{
          borderRadius: 12,
          padding: 12,
          background: "#F9FAFB",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontWeight: 800, color: "#111827" }}>{action.title}</div>
        <div style={{ marginTop: 6, color: "#6B7280", fontSize: 13 }}>
          {action.description}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {action.primaryHref ? (
            <a
              href={action.primaryHref}
              style={primaryBtn}
              aria-label={action.primaryLabel}
            >
              {action.primaryLabel}
            </a>
          ) : (
            <button style={{ ...primaryBtn, opacity: 0.6 }} disabled>
              {action.primaryLabel}
            </button>
          )}

          {action.secondaryHref ? (
            <a
              href={action.secondaryHref}
              style={secondaryBtn}
              aria-label={action.secondaryLabel}
            >
              {action.secondaryLabel}
            </a>
          ) : null}
        </div>
      </div>

      <p style={{ margin: 0, marginTop: 12, color: "#6B7280", fontSize: 13 }}>
        This panel stays focused so you always know what’s needed next.
      </p>
    </div>
  );
}

function getAction(status: ProjectStatus, milestone: MilestoneKey) {
  // V1: read-only UI. Links are placeholders you can wire later.
  if (status === "ready_for_launch" || milestone === "launch") {
    return {
      title: "Approve & Launch",
      description:
        "Final approval is needed before launch. Once approved, the site can go live.",
      primaryLabel: "Approve & Launch",
      primaryHref: undefined, // later: /launch or payment gate
      secondaryLabel: "Preview Website",
      secondaryHref: "/editor",
    };
  }

  if (status === "review_needed" || milestone === "design_review") {
    return {
      title: "Submit Revision Feedback",
      description:
        "Please submit your revision feedback for this review stage. This uses one included revision.",
      primaryLabel: "Submit Feedback",
      primaryHref: undefined, // later: /feedback form
      secondaryLabel: "Preview Website",
      secondaryHref: "/editor",
    };
  }

  // default in progress
  return {
    title: "Project in Progress",
    description:
      "We’re actively working on your website. You’ll be notified when review is ready.",
    primaryLabel: "Edit Website",
    primaryHref: "/editor",
    secondaryLabel: "Preview Website",
    secondaryHref: "/editor",
  };
}

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  textDecoration: "none",
  border: "1px solid #111827",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  textDecoration: "none",
  border: "1px solid #e5e7eb",
};