"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { EnrichedOpsWorkspaceBundle } from "@/lib/opsWorkspace/state";

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function tone(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (["active", "approved", "live", "completed", "ready"].includes(s)) {
    return {
      bg: "rgba(46,160,67,0.14)",
      border: "rgba(46,160,67,0.34)",
      color: "#b7f5c4",
      label: pretty(status),
    };
  }
  if (
    ["requested", "review", "new", "pending", "scoped", "planning", "process mapping", "discovery"].includes(
      s
    )
  ) {
    return {
      bg: "rgba(201,168,76,0.14)",
      border: "rgba(201,168,76,0.34)",
      color: "#f1d98a",
      label: pretty(status),
    };
  }
  return {
    bg: "rgba(141,164,255,0.12)",
    border: "rgba(141,164,255,0.26)",
    color: "#d8e0ff",
    label: pretty(status || "new"),
  };
}

export default function OpsPortalClient({
  initialData,
}: {
  initialData: EnrichedOpsWorkspaceBundle;
}) {
  const [bundle, setBundle] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const intakeTone = useMemo(() => tone(bundle.intake.status), [bundle.intake.status]);
  const phaseTone = useMemo(() => tone(bundle.workspace.phase), [bundle.workspace.phase]);

  const refreshWorkspace = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/ops/${bundle.intake.id}`);
      const json = await res.json();
      if (!res.ok || !json?.ok || !json?.data) {
        throw new Error(json?.error || "Failed to refresh workspace.");
      }
      setBundle(json.data as EnrichedOpsWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh workspace.");
    } finally {
      setRefreshing(false);
    }
  }, [bundle.intake.id]);

  return (
    <main className="container section" style={{ paddingBottom: 84 }}>
      <div className="heroFadeUp">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Systems Lab
        </div>
        <div style={{ height: 12 }} />
        <h1 className="h1">{bundle.intake.companyName}</h1>
        <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
          This workspace shows the operations problem we are solving, the current workflow plan,
          and what still needs to happen before systems go live.
        </p>

        <div className="row" style={{ marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Badge toneValue={intakeTone}>{intakeTone.label}</Badge>
          <Badge toneValue={phaseTone}>Phase {phaseTone.label}</Badge>
          <span className="badge">Waiting on {bundle.workspace.waitingOn}</span>
          <span className="badge">Best tool {bundle.ghostAdmin.bestTool}</span>
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btnGhost" onClick={refreshWorkspace} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh Workspace"}
          </button>
          <Link href="/portal" className="btn btnGhost">
            Back to Portal
          </Link>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(255,0,0,0.35)",
            background: "rgba(255,0,0,0.08)",
            borderRadius: 14,
            padding: 14,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      <section className="grid4" style={{ marginTop: 26 }}>
        <MetricCard label="Current Phase" value={bundle.workspace.phase} />
        <MetricCard label="Waiting On" value={bundle.workspace.waitingOn} />
        <MetricCard label="Recommended Service" value={bundle.intake.recommendationTier} />
        <MetricCard
          label="Last Saved"
          value={bundle.workspace.lastSavedAt ? fmtDate(bundle.workspace.lastSavedAt) : "Not saved yet"}
        />
      </section>

      <section className="grid2stretch" style={{ marginTop: 28 }}>
        <Panel title="Problem We’re Solving" note="Business context and the intended outcome.">
          <Info label="Business Objective" value={bundle.ghostAdmin.businessObjective} />
          <Info label="Main Bottleneck" value={bundle.ghostAdmin.mainBottleneck} />
          <Info label="Best First Fix" value={bundle.ghostAdmin.bestFirstFix} />
          {bundle.workspace.adminPublicNote ? (
            <Info label="Studio Update" value={bundle.workspace.adminPublicNote} />
          ) : null}
        </Panel>

        <Panel title="Current Process vs New Process" note="How the workflow should improve over time.">
          <SubList
            title="Current Process"
            items={bundle.workspace.currentProcess}
            emptyLabel="Current process not mapped yet."
          />
          <SubList
            title="Future Process"
            items={bundle.workspace.futureProcess}
            emptyLabel="Future process not mapped yet."
          />
        </Panel>
      </section>

      <section className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Connected Systems" note="Tools involved in the workflow build.">
          <CardList
            items={bundle.workspace.systems.map((item) => ({
              title: item.name,
              subtitle: `${item.role} • ${item.status}`,
              body: item.notes,
            }))}
            emptyLabel="No systems mapped yet."
          />
        </Panel>

        <Panel title="Waiting on Client" note="What we still need from you to move forward.">
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
            <li>{bundle.workspace.waitingOn}</li>
            {bundle.pie.clientQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Automation Backlog" note="What we plan to build, in what order, and why.">
          <CardList
            items={bundle.workspace.automationBacklog.map((item) => ({
              title: item.name,
              subtitle: `${item.status} • ${item.priority} • ${item.toolRecommendation}`,
              body: item.purpose,
            }))}
            emptyLabel="No backlog items saved yet."
          />
        </Panel>

        <Panel title="Live Automations" note="Automation items currently marked live.">
          <CardList
            items={bundle.workspace.liveAutomations.map((item) => ({
              title: item.name,
              subtitle: `${item.status} • ${item.toolRecommendation}`,
              body: item.purpose,
            }))}
            emptyLabel="No live automations yet."
          />
        </Panel>
      </section>

      <section className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Approvals Needed" note="Items that should be confirmed before launch.">
          <CardList
            items={bundle.workspace.approvals.map((item) => ({
              title: item.label,
              subtitle: item.status,
              body: item.notes,
            }))}
            emptyLabel="No approvals logged yet."
          />
        </Panel>

        <Panel title="SOPs / Training" note="Operational instructions and expectations.">
          <CardList
            items={bundle.workspace.sops.map((item) => ({
              title: item.workflow,
              subtitle: `Trigger: ${item.trigger}`,
              body: item.steps.join(" • "),
            }))}
            emptyLabel="No SOPs published yet."
          />
        </Panel>
      </section>

      <section className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Incident / Issue Log" note="Known problems and how they are being handled.">
          <CardList
            items={bundle.workspace.incidents.map((item) => ({
              title: item.title,
              subtitle: `${item.severity} • ${item.status}`,
              body: item.summary || item.resolution,
            }))}
            emptyLabel="No incidents logged yet."
          />
        </Panel>

        <Panel title="Change Requests" note="Requested changes and scope adjustments.">
          <CardList
            items={bundle.workspace.changeRequests.map((item) => ({
              title: item.title,
              subtitle: `${item.urgency} • ${item.status}`,
              body: item.reason || item.impact,
            }))}
            emptyLabel="No change requests logged yet."
          />
        </Panel>
      </section>

      <section className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="KPI / Results" note="How we will measure whether the system is helping.">
          <CardList
            items={bundle.workspace.kpis.map((item) => ({
              title: item.name,
              subtitle: `Target: ${item.target}`,
              body: item.why,
            }))}
            emptyLabel="No KPIs configured yet."
          />
        </Panel>

        <Panel title="Risk Log" note="What could go wrong and how we plan to reduce risk.">
          <CardList
            items={bundle.workspace.risks.map((item) => ({
              title: item.risk,
              subtitle: "Mitigation",
              body: item.mitigation,
            }))}
            emptyLabel="No risks logged yet."
          />
        </Panel>
      </section>

      <section className="grid2stretch" style={{ marginTop: 18 }}>
        <Panel title="Recommended Service" note="Where this project currently fits.">
          <Info label="Recommended Package" value={bundle.pie.recommendedOffer.primaryPackage} />
          <Info label="Project Range" value={bundle.pie.recommendedOffer.projectRange} />
          <Info label="Retainer Range" value={bundle.pie.recommendedOffer.retainerRange} />
        </Panel>

        <Panel title="Next Actions" note="What happens next in the ops build.">
          <SubList
            title="Next Actions"
            items={bundle.workspace.nextActions}
            emptyLabel="No next actions yet."
          />
        </Panel>
      </section>
    </main>
  );
}

function Badge({
  toneValue,
  children,
}: {
  toneValue: { bg: string; border: string; color: string };
  children: any;
}) {
  return (
    <span
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        background: toneValue.bg,
        border: `1px solid ${toneValue.border}`,
        color: toneValue.color,
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div className="smallNote">{label}</div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: 22, lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: any;
}) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>{title}</div>
        <div className="smallNote">{note}</div>
      </div>
      <div className="panelBody" style={{ display: "grid", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div className="fieldLabel">{label}</div>
        <div style={{ color: "var(--fg)", fontWeight: 800, fontSize: 15, lineHeight: 1.45 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SubList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="fieldLabel">{title}</div>
      {items.length === 0 ? (
        <div className="smallNote">{emptyLabel}</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CardList({
  items,
  emptyLabel,
}: {
  items: Array<{ title: string; subtitle: string; body: string }>;
  emptyLabel: string;
}) {
  if (!items.length) {
    return <div className="smallNote">{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="panel" style={{ background: "var(--panel2)" }}>
          <div className="panelBody">
            <div style={{ fontWeight: 800 }}>{item.title}</div>
            <div className="smallNote" style={{ marginTop: 4 }}>
              {item.subtitle}
            </div>
            <div className="pDark" style={{ marginTop: 8 }}>
              {item.body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}