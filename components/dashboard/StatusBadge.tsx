import { ProjectStatus } from "@/lib/projectTypes";

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, { label: string; bg: string; fg: string }> =
    {
      in_progress: { label: "In Progress", bg: "#FEF3C7", fg: "#92400E" },
      review_needed: { label: "Review Needed", bg: "#DBEAFE", fg: "#1E40AF" },
      ready_for_launch: { label: "Ready for Launch", bg: "#D1FAE5", fg: "#065F46" },
    };

  const s = map[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {s.label}
    </span>
  );
}