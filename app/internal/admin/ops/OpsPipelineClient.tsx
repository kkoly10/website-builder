"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type OpsAdminRow = {
  opsIntakeId: string;
  createdAt: string | null;
  companyName: string;
  contactName: string;
  email: string;
  industry: string;
  status: string;
  recommendationTier: string;
  recommendationPriceRange: string;
  recommendationScore: number | null;
  callStatus: string;
  pieStatus: string;
  pieSummary: string;
  bestTool: string;
  phase: string;
  waitingOn: string;
  links: {
    detail: string;
    portal: string;
  };
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (["active", "approved", "live", "completed", "ready"].includes(s)) {
    return {
      bg: "var(--success-bg)",
      border: "var(--success)",
      color: "var(--success)",
      label: pretty(status),
    };
  }

  if (["requested", "review", "new", "pending"].includes(s)) {
    return {
      bg: "var(--accent-bg)",
      border: "var(--accent)",
      color: "var(--accent)",
      label: pretty(status),
    };
  }

  return {
    bg: "var(--paper-2)",
    border: "var(--rule)",
    color: "var(--muted)",
    label: pretty(status || "new"),
  };
}

export default function OpsPipelineClient({
  initialRows,
}: {
  initialRows: OpsAdminRow[];
}) {
  const [rows] = useState(initialRows ?? []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((row) => {
      const matchesSearch = !q
        ? true
        : row.companyName.toLowerCase().includes(q) ||
          row.contactName.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.opsIntakeId.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" ? true : row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const statusOptions = Array.from(new Set(rows.map((r) => r.status).filter(Boolean)));

  return (
    <div style={{ marginTop: 18 }}>
      <div className="panel">
        <div className="panelBody">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row">
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company, contact, email, or intake id…"
              />
              <select
                className="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {pretty(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="smallNote">
              Total: <strong>{filtered.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {filtered.length === 0 ? (
          <div className="panel">
            <div className="panelBody">
              <div style={{ color: "var(--fg)", fontWeight: 900, fontSize: 20 }}>
                No ops requests found
              </div>
              <p className="p" style={{ marginBottom: 0 }}>
                When workflow intakes are submitted, they will appear here with discovery, PIE,
                and Ghost Admin guidance.
              </p>
            </div>
          </div>
        ) : null}

        {filtered.map((row) => {
          const tone = statusTone(row.status);
          const callTone = statusTone(row.callStatus);
          return (
            <article key={row.opsIntakeId} className="panel fadeUp">
              <div className="panelBody">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--fg)", fontWeight: 900, fontSize: 24 }}>
                      {row.companyName}
                    </div>
                    <div className="pDark" style={{ marginTop: 6 }}>
                      {row.contactName} • {row.email}
                    </div>
                    <div className="pDark" style={{ marginTop: 4 }}>
                      ID #{row.opsIntakeId.slice(0, 8)} • {fmtDate(row.createdAt)} • {row.industry}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: tone.bg,
                      border: `1px solid ${tone.border}`,
                      color: tone.color,
                      fontWeight: 800,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {tone.label}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <InfoTile label="Phase" value={row.phase} />
                  <InfoTile label="Waiting On" value={row.waitingOn} />
                  <InfoTile label="Recommendation" value={row.recommendationTier} />
                  <InfoTile label="Best Tool" value={row.bestTool} />
                  <InfoTile label="PIE" value={row.pieStatus} />
                </div>

                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid var(--stroke)",
                    background: "var(--panel2)",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div className="smallNote">Ghost Admin snapshot</div>
                  <div style={{ marginTop: 8, color: "var(--fg)", fontWeight: 800 }}>
                    {row.pieSummary}
                  </div>
                </div>

                <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
                  <div className="row">
                    <span
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: callTone.bg,
                        border: `1px solid ${callTone.border}`,
                        color: callTone.color,
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Call {callTone.label}
                    </span>
                    {row.recommendationScore != null ? (
                      <span className="badge">Score {row.recommendationScore}</span>
                    ) : null}
                  </div>

                  <div className="row">
                    <Link href={row.links.detail} className="btn btnPrimary">
                      Open Ops Project <span className="btnArrow">→</span>
                    </Link>
                    <Link href={row.links.portal} className="btn btnGhost">
                      Client Workspace
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--stroke)",
        borderRadius: 14,
        background: "var(--panel2)",
        padding: 14,
      }}
    >
      <div
        style={{
          color: "var(--muted)",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ color: "var(--fg)", fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>
        {value}
      </div>
    </div>
  );
}
