"use client";

import StatusBadge from "./StatusBadge";
import MilestoneTimeline from "./MilestoneTimeline";
import PaymentSummary from "./PaymentSummary";
import RevisionTracker from "./RevisionTracker";
import ReferencesCard from "./ReferencesCard";
import ActionPanel from "./ActionPanel";
import { Project } from "@/lib/projectTypes";

export default function DashboardShell({ project }: { project: Project }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "14px 18px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 900, color: "#111827" }}>Dashboard</div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>
              Logged in as: {project.clientName}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={project.status} />
            <a
              href="/editor"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                textDecoration: "none",
                color: "#111827",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Edit Website
            </a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "18px auto", padding: "0 18px" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <ProjectOverview project={project} />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "1.3fr 1fr",
              alignItems: "start",
            }}
          >
            <MilestoneTimeline
              milestones={project.milestones}
              activeKey={project.activeMilestoneKey}
            />

            <div style={{ display: "grid", gap: 14 }}>
              <PaymentSummary payment={project.payment} />
              <RevisionTracker revisions={project.revisions} />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "1.3fr 1fr",
              alignItems: "start",
            }}
          >
            <ReferencesCard refs={project.references} />
            <ActionPanel
              status={project.status}
              activeMilestoneKey={project.activeMilestoneKey}
            />
          </div>

          <footer style={{ padding: "12px 4px", color: "#6B7280", fontSize: 13 }}>
            You can edit or unpublish your site anytime.
          </footer>
        </div>
      </main>
    </div>
  );
}

function ProjectOverview({ project }: { project: Project }) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <h2 style={{ margin: 0, marginBottom: 6, fontSize: 18 }}>
        {project.projectName}
      </h2>

      <div style={{ color: "#6B7280", fontSize: 13, marginBottom: 12 }}>
        {project.websiteType} · {project.platform}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <Info label="Start date" value={project.startDateLabel} />
        <Info label="Estimated launch" value={project.estimatedLaunchLabel} />
        <Info label="Project ID" value={project.id} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: 12,
        background: "#F9FAFB",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 800, fontSize: 13 }}>{value}</div>
    </div>
  );
}