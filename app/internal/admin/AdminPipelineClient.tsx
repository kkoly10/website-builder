"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminProjectData } from "@/lib/adminProjectData";
import ProjectControlClient from "./[id]/ProjectControlClient";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function fmtDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pretty(value?: string | null) {
  if (!value) return "-";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function adjustedTarget(project: AdminProjectData) {
  const base = project.estimate.target || 0;
  const discounted = Math.round(
    base * (1 - (project.adminPricing.discountPercent || 0) / 100)
  );
  return discounted + (project.adminPricing.flatAdjustment || 0);
}

function daysSince(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
}

function readinessPercent(project: AdminProjectData) {
  const checks = [
    !!project.portalAdmin.previewUrl,
    !!project.portalAdmin.productionUrl,
    ["ready", "complete"].includes(project.portalAdmin.domainStatus.toLowerCase()),
    ["ready", "complete"].includes(project.portalAdmin.analyticsStatus.toLowerCase()),
    ["ready", "complete"].includes(project.portalAdmin.formsStatus.toLowerCase()),
    ["ready", "complete"].includes(project.portalAdmin.seoStatus.toLowerCase()),
    ["ready", "complete"].includes(project.portalAdmin.handoffStatus.toLowerCase()),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function hasWarnings(project: AdminProjectData) {
  const age = daysSince(project.createdAt);
  if (project.status === "new" && age >= 5) return true;
  if (project.status === "proposal" && age >= 7) return true;
  if (project.status === "deposit" && project.depositStatus !== "paid" && age >= 4) return true;
  if (project.clientSync.revisions.some((revision) => revision.status === "new")) return true;
  if (project.portalAdmin.clientReviewStatus === "Changes requested") return true;
  return false;
}

function urgencyScore(project: AdminProjectData) {
  const age = daysSince(project.createdAt);
  const revisionBoost = project.clientSync.revisions.filter(
    (revision) => revision.status === "new"
  ).length;
  const blockedDeposit =
    project.status === "deposit" && project.depositStatus !== "paid" ? 8 : 0;
  const previewReview =
    project.portalAdmin.clientReviewStatus === "Changes requested" ? 6 : 0;
  const proposalAging = project.status === "proposal" ? Math.min(age, 10) : 0;
  const intakeAging = project.status === "new" ? Math.min(age, 8) : 0;

  return blockedDeposit + previewReview + revisionBoost * 3 + proposalAging + intakeAging;
}

function nextAction(project: AdminProjectData) {
  if (project.status === "deposit" && project.depositStatus !== "paid") {
    return "Get the deposit cleared";
  }
  if (project.portalAdmin.agreementStatus === "Not published yet") {
    return "Publish the agreement";
  }
  if (!project.portalAdmin.previewUrl && ["proposal", "deposit", "active"].includes(project.status)) {
    return "Publish the first preview";
  }
  if (project.clientSync.revisions.some((revision) => revision.status === "new")) {
    return "Respond to new revision requests";
  }
  if (project.portalAdmin.clientReviewStatus === "Pending review") {
    return "Wait for client review";
  }
  if (project.portalAdmin.launchStatus !== "Live" && readinessPercent(project) < 100) {
    return "Advance launch readiness";
  }
  if (project.portalAdmin.launchStatus === "Live") {
    return "Monitor the live handoff";
  }
  return "Review the workspace";
}

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "closed_won":
      return "adminStagePill adminStagePillGood";
    case "deposit":
    case "proposal":
      return "adminStagePill adminStagePillWarm";
    case "closed":
      return "adminStagePill adminStagePillMuted";
    default:
      return "adminStagePill";
  }
}

export default function AdminPipelineClient({
  initialProjects,
}: {
  initialProjects: AdminProjectData[];
}) {
  const [projects, setProjects] = useState(initialProjects ?? []);
  const [selectedId, setSelectedId] = useState(initialProjects[0]?.quoteId ?? "");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("urgency");

  useEffect(() => {
    let cancelled = false;

    async function refreshConversations() {
      try {
        const res = await fetch("/api/internal/admin/messages");
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !Array.isArray(json?.conversations) || cancelled) return;

        const summaryByQuote = new Map<string, AdminProjectData["messageSummary"]>(
          json.conversations.map((conversation: any) => [
            String(conversation.quoteId || ""),
            {
              unreadCount: Number(conversation.unreadCount || 0),
              lastPreview: String(conversation.lastMessagePreview || ""),
              lastAt: String(conversation.lastMessageAt || ""),
              lastRole: conversation.lastMessageRole || null,
            },
          ])
        );

        setProjects((current) =>
          current.map((project) => {
            const nextSummary = summaryByQuote.get(project.quoteId);
            return nextSummary ? { ...project, messageSummary: nextSummary } : project;
          })
        );
      } catch {
        // Silent polling refresh.
      }
    }

    refreshConversations();
    const timer = setInterval(refreshConversations, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = projects.filter((project) => {
      if (!query) return true;
      return (
        project.leadName.toLowerCase().includes(query) ||
        project.leadEmail.toLowerCase().includes(query) ||
        project.quoteId.toLowerCase().includes(query)
      );
    });

    next.sort((left, right) => {
      if (sort === "value") return adjustedTarget(right) - adjustedTarget(left);
      if (sort === "newest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
      if (sort === "stage") return left.status.localeCompare(right.status);
      return urgencyScore(right) - urgencyScore(left);
    });

    return next;
  }, [projects, search, sort]);

  useEffect(() => {
    if (!filteredProjects.some((project) => project.quoteId === selectedId)) {
      setSelectedId(filteredProjects[0]?.quoteId ?? "");
    }
  }, [filteredProjects, selectedId]);

  const selectedProject =
    filteredProjects.find((project) => project.quoteId === selectedId) ?? filteredProjects[0] ?? null;

  const summary = useMemo(() => {
    const totalValue = filteredProjects.reduce(
      (sum, project) => sum + adjustedTarget(project),
      0
    );
    const activeCount = filteredProjects.filter((project) =>
      ["proposal", "deposit", "active"].includes(project.status)
    ).length;
    const warningCount = filteredProjects.filter(hasWarnings).length;

    return { totalValue, activeCount, warningCount };
  }, [filteredProjects]);

  return (
    <div className="adminPipelineShell">
      <div className="adminPipelineMeta">
        <div className="adminPipelineSentence">
          You&apos;re tracking {money(summary.totalValue)} across {summary.activeCount} active
          website projects. {summary.warningCount} item
          {summary.warningCount === 1 ? "" : "s"} need attention.
        </div>
      </div>

      <div className="adminPipelineLayout">
        <aside className="adminPipelineSidebar">
          <div className="adminPipelineSidebarSticky">
            <div className="adminPipelineSidebarTop">
              <div>
                <div className="adminSidebarEyebrow">Project list</div>
                <h2 className="adminSidebarTitle">Urgency queue</h2>
              </div>
              <div className="adminSidebarCount">
                {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="adminSidebarControls">
              <input
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or quote ID"
              />
              <select
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="urgency">Sort by urgency</option>
                <option value="value">Sort by value</option>
                <option value="newest">Sort by newest</option>
                <option value="stage">Sort by stage</option>
              </select>
            </div>

            <div className="adminProjectQueue">
              {filteredProjects.map((project) => {
                const warning = hasWarnings(project);
                const days = daysSince(project.createdAt);

                return (
                  <button
                    key={project.quoteId}
                    type="button"
                    className={`adminProjectRow ${
                      project.quoteId === selectedProject?.quoteId ? "adminProjectRowActive" : ""
                    }`}
                    onClick={() => setSelectedId(project.quoteId)}
                  >
                    <div className="adminProjectRowHead">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="adminProjectName">{project.leadName}</div>
                        {project.messageSummary.unreadCount > 0 ? (
                          <span className="adminMessageBadge">
                            {project.messageSummary.unreadCount} new
                          </span>
                        ) : null}
                      </div>
                      <div className="adminProjectValue">{money(adjustedTarget(project))}</div>
                    </div>

                    <div className="adminProjectRowMeta">
                      <span className={statusTone(project.status)}>{pretty(project.status)}</span>
                      <span className="adminProjectTier">{project.tier}</span>
                    </div>

                    <div className="adminProjectRowFoot">
                      <span className={`adminDaysInStage ${warning ? "adminDaysInStageWarn" : ""}`}>
                        <span
                          className={`adminWarningDot ${warning ? "adminWarningDotLive" : ""}`}
                        />
                        {days} day{days === 1 ? "" : "s"} in stage
                      </span>
                      <span className="adminNextAction">{nextAction(project)}</span>
                    </div>

                    {project.messageSummary.lastPreview ? (
                      <div className="adminProjectMessagePreview">
                        <span className="adminProjectMessageRole">
                          {pretty(project.messageSummary.lastRole)}
                        </span>
                        <span className="adminProjectMessageText">
                          {project.messageSummary.lastPreview}
                        </span>
                        {project.messageSummary.lastAt ? (
                          <span className="adminProjectMessageTime">
                            {fmtDate(project.messageSummary.lastAt)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}

              {filteredProjects.length === 0 ? (
                <div className="adminEmptyState">No projects match this search.</div>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="adminPipelineDetail">
          {selectedProject ? (
            <>
              <div className="adminDetailHeader">
                <div>
                  <div className="adminSidebarEyebrow">Selected project</div>
                  <h2 className="adminDetailTitle">{selectedProject.leadName}</h2>
                  <div className="adminDetailContact">
                    {selectedProject.leadEmail} • Created {fmtDate(selectedProject.createdAt)} • #
                    {selectedProject.quoteId.slice(0, 8)}
                  </div>
                </div>

                <div className="adminDetailActions">
                  {selectedProject.workspaceUrl ? (
                    <Link href={selectedProject.workspaceUrl} className="btn btnGhost">
                      Client portal
                    </Link>
                  ) : null}
                  <Link
                    href={`/internal/admin/${selectedProject.quoteId}`}
                    className="btn btnPrimary"
                  >
                    Open standalone
                  </Link>
                </div>
              </div>

              <div className="adminDetailBadgeRow">
                <span className={statusTone(selectedProject.status)}>
                  {pretty(selectedProject.status)}
                </span>
                <span className="adminDetailBadge">{selectedProject.tier}</span>
                <span className="adminDetailBadge">
                  Launch {readinessPercent(selectedProject)}%
                </span>
                <span className="adminDetailBadge">
                  {selectedProject.depositStatus === "paid" ? "Deposit paid" : "Deposit pending"}
                </span>
                <span className="adminDetailBadge adminDetailBadgeSoft">
                  {nextAction(selectedProject)}
                </span>
              </div>

              <ProjectControlClient
                key={selectedProject.quoteId}
                initialData={selectedProject}
                embedded
                onMessageSummaryChange={(summary) => {
                  setProjects((current) =>
                    current.map((project) =>
                      project.quoteId === selectedProject.quoteId
                        ? { ...project, messageSummary: summary }
                        : project
                    )
                  );
                }}
              />
            </>
          ) : (
            <div className="adminDetailEmpty">
              Select a project to open the full admin workbench.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
