"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PieView = {
  exists: boolean;
  id: string | null;
  score: number | null;
  tier: string | null;
  summary: string;
};

export type PipelineRow = {
  quoteId: string;
  createdAt: string;
  status: string;
  tier: string;
  leadEmail: string;

  estimate: { target: number; min: number; max: number };
  estimateFormatted: { target: string; min: string; max: string };

  pie: PieView;

  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };

  proposalText: string;

  links?: {
    detail?: string;
    workspace?: string;
  };
};

export default function AdminPipelineClient({ initialRows }: { initialRows: PipelineRow[] }) {
  const router = useRouter();

  const [rows, setRows] = useState<PipelineRow[]>(initialRows ?? []);
  const [busyByQuote, setBusyByQuote] = useState<Record<string, boolean>>({});
  const [messageByQuote, setMessageByQuote] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    let next = [...rows];
    const q = search.toLowerCase().trim();

    if (q) {
      next = next.filter((r) => {
        const lead = (r.leadEmail || "").toLowerCase();
        const id = (r.quoteId || "").toLowerCase();
        return lead.includes(q) || id.includes(q);
      });
    }

    if (statusFilter !== "all") {
      next = next.filter((r) => r.status === statusFilter);
    }

    return next;
  }, [rows, search, statusFilter]);

  function updateRowLocal(quoteId: string, updater: (row: PipelineRow) => PipelineRow) {
    setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? updater(r) : r)));
  }

  async function generatePie(quoteId: string) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [quoteId]: "Analyzing lead with AI..." }));

    try {
      const res = await fetch("/api/internal/pie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, force: true }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to generate PIE");

      setMessageByQuote((m) => ({ ...m, [quoteId]: "PIE generated. Refreshing..." }));
      router.refresh();
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  async function saveQuoteAdmin(quoteId: string, payload: any) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [quoteId]: "Saving..." }));

    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, ...payload }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save");

      setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? { ...r, ...payload } : r)));
      setMessageByQuote((m) => ({ ...m, [quoteId]: "Saved successfully." }));
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Save failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  const statusOptions = ["new", "call_requested", "call", "proposal", "deposit", "active", "closed"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Filters */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row">
          <input
            className="input"
            style={{ maxWidth: 320 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or quote id…"
          />

          <select
            className="select"
            style={{ maxWidth: 220 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="smallNote">
          Total: <strong>{filteredRows.length}</strong>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: "grid", gap: 12 }}>
        {filteredRows.map((row) => {
          const isBusy = !!busyByQuote[row.quoteId];
          const isExpanded = !!expanded[row.quoteId];

          const baseTarget = row.estimate.target || 0;
          const discounted = Math.round(baseTarget * (1 - (row.adminPricing?.discountPercent || 0) / 100));
          const adjustedTarget = discounted + (row.adminPricing?.flatAdjustment || 0);

          return (
            <div key={row.quoteId} className="card">
              <div className="cardInner" style={{ display: "grid", gap: 10 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 950, color: "var(--fg)" }}>{row.leadEmail}</div>
                    <div className="pDark">
                      Created: {new Date(row.createdAt).toLocaleString()} • ID:{" "}
                      <code>{row.quoteId.slice(0, 8)}</code>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge">{row.status}</span>
                      <span className="badge">{row.tier}</span>
                      {row.pie?.exists ? (
                        <span className="badge badgeHot">
                          PIE {row.pie.score != null ? `Score ${row.pie.score}` : "Ready"}
                        </span>
                      ) : (
                        <span className="badge">PIE Missing</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 950, fontSize: 20 }}>${adjustedTarget.toLocaleString()}</div>
                    <div className="pDark" style={{ marginTop: 6 }}>
                      Base: {row.estimateFormatted.target}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="row" style={{ gap: 10 }}>
                  <button className="btn btnPrimary" disabled={isBusy} onClick={() => generatePie(row.quoteId)}>
                    {row.pie?.exists ? "Refresh PIE" : "Generate PIE"} <span className="btnArrow">→</span>
                  </button>

                  <button
                    className="btn btnGhost"
                    type="button"
                    onClick={() => setExpanded((m) => ({ ...m, [row.quoteId]: !m[row.quoteId] }))}
                  >
                    {isExpanded ? "Hide" : "Details"}
                  </button>

                  {row.links?.detail ? (
                    <Link className="btn btnGhost" href={row.links.detail}>
                      Quote Details
                    </Link>
                  ) : null}

                  {row.links?.workspace ? (
                    <Link className="btn btnPrimary" href={row.links.workspace}>
                      Workspace →
                    </Link>
                  ) : null}
                </div>

                {/* PIE summary */}
                <div className="panel">
                  <div className="panelHeader">
                    <div style={{ fontWeight: 900 }}>AI PIE Summary</div>
                    <div className="smallNote">Quick snapshot of scope + risks + next steps.</div>
                  </div>
                  <div className="panelBody">
                    {row.pie?.exists ? (
                      <div className="pDark" style={{ whiteSpace: "pre-wrap" }}>
                        {row.pie.summary || "No summary yet."}
                      </div>
                    ) : (
                      <div className="pDark">No analysis yet. Click “Generate PIE”.</div>
                    )}
                  </div>
                </div>

                {/* Editable admin controls */}
                <div className="panel">
                  <div className="panelHeader">
                    <div style={{ fontWeight: 900 }}>Pipeline & Pricing</div>
                    <div className="smallNote">Update status + pricing adjustments, then save.</div>
                  </div>

                  <div className="panelBody" style={{ display: "grid", gap: 12 }}>
                    <div className="grid2">
                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="fieldLabel">Status</span>
                        <select
                          className="select"
                          value={row.status}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              status: e.target.value,
                            }))
                          }
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="fieldLabel">Discount %</span>
                        <input
                          className="input"
                          type="number"
                          value={row.adminPricing?.discountPercent ?? 0}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              adminPricing: {
                                ...r.adminPricing,
                                discountPercent: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="fieldLabel">Adjustment ($)</span>
                        <input
                          className="input"
                          type="number"
                          value={row.adminPricing?.flatAdjustment ?? 0}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              adminPricing: {
                                ...r.adminPricing,
                                flatAdjustment: Number(e.target.value || 0),
                              },
                            }))
                          }
                        />
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="fieldLabel">Hourly rate</span>
                        <input
                          className="input"
                          type="number"
                          value={row.adminPricing?.hourlyRate ?? 40}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              adminPricing: {
                                ...r.adminPricing,
                                hourlyRate: Number(e.target.value || 40),
                              },
                            }))
                          }
                        />
                      </label>
                    </div>

                    <button
                      className="btn btnGhost"
                      disabled={isBusy}
                      onClick={() =>
                        saveQuoteAdmin(row.quoteId, {
                          status: row.status,
                          adminPricing: row.adminPricing,
                        })
                      }
                    >
                      Save Config
                    </button>

                    {isExpanded ? (
                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="fieldLabel">Proposal Draft</span>
                        <textarea
                          className="textarea"
                          rows={8}
                          value={row.proposalText || ""}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              proposalText: e.target.value,
                            }))
                          }
                          placeholder="Draft proposal here…"
                        />
                        <div className="row">
                          <button
                            className="btn btnGhost"
                            disabled={isBusy}
                            onClick={() => saveQuoteAdmin(row.quoteId, { proposalText: row.proposalText })}
                          >
                            Save Proposal Draft
                          </button>

                          <button
                            className="btn btnGhost"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(row.proposalText || "")}
                          >
                            Copy
                          </button>
                        </div>
                      </label>
                    ) : null}

                    {messageByQuote[row.quoteId] ? (
                      <div style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 800 }}>
                        {messageByQuote[row.quoteId]}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}