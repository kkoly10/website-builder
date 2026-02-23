// app/internal/admin/AdminPipelineClient.tsx
"use client";

import { useMemo, useState } from "react";

type PieView = {
  exists: boolean;
  id: string | null;
  score: number | null;
  tier: string | null;
  confidence: string | null;
  summary: string;
  pricingTarget: number | null;
  pricingMin: number | null;
  pricingMax: number | null;
  risks: string[];
  pitch: any;
  hoursMin: number | null;
  hoursMax: number | null;
  timelineText: string | null;
};

type PipelineRow = {
  quoteId: string;
  projectId?: string;
  createdAt: string;
  status: string; // internal/admin project status
  clientStatus?: string; // client-facing status
  tier: string;
  leadEmail: string;
  leadName: string | null;
  estimate: { target: number; min: number; max: number };
  estimateFormatted: { target: string; min: string; max: string };
  callRequest: null | {
    status: string;
    bestTime: string | null;
    preferredTimes: string | null;
    timezone: string | null;
    notes: string | null;
  };
  pie: PieView;
  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };
  proposalText: string;
  sync?: {
    assetCount: number;
    revisionCount: number;
    latestClientNote: string;
    latestClientNoteAt: string | null;
  };
  links: { detail: string };
};

function fmtCurrency(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "deposit" || s === "active" || s === "closed_won") return "badge badgeHot";
  return "badge";
}

function clientStatusBadge(status?: string) {
  const s = (status || "new").toLowerCase();
  if (s === "awaiting_content" || s === "needs_client_review") return "badge";
  if (s === "ready_for_launch" || s === "launched") return "badge badgeHot";
  return "badge";
}

export default function AdminPipelineClient({
  initialRows,
}: {
  initialRows: PipelineRow[];
}) {
  const [rows, setRows] = useState<PipelineRow[]>(initialRows);
  const [busyByQuote, setBusyByQuote] = useState<Record<string, boolean>>({});
  const [messageByQuote, setMessageByQuote] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const summaryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = r.status || "new";
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [rows]);

  async function saveQuoteAdmin(
    quoteId: string,
    payload: {
      status?: string;
      adminPricing?: PipelineRow["adminPricing"];
      proposalText?: string;
    }
  ) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [quoteId]: "" }));

    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, ...payload }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.quoteId === quoteId
            ? {
                ...r,
                status: payload.status ?? r.status,
                adminPricing: payload.adminPricing ?? r.adminPricing,
                proposalText: payload.proposalText ?? r.proposalText,
              }
            : r
        )
      );

      setMessageByQuote((m) => ({ ...m, [quoteId]: "Saved." }));
    } catch (err: any) {
      setMessageByQuote((m) => ({
        ...m,
        [quoteId]: err?.message || "Save failed",
      }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  async function generateProposal(row: PipelineRow) {
    setBusyByQuote((m) => ({ ...m, [row.quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [row.quoteId]: "Generating proposal..." }));

    try {
      const res = await fetch("/api/internal/admin/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: row.quoteId,
          hourlyRate: row.adminPricing.hourlyRate || 40,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to generate proposal");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.quoteId === row.quoteId
            ? { ...r, proposalText: data.proposalText || r.proposalText }
            : r
        )
      );

      setExpanded((m) => ({ ...m, [row.quoteId]: true }));
      setMessageByQuote((m) => ({
        ...m,
        [row.quoteId]: data.mode === "ai" ? "AI proposal generated." : "Proposal generated.",
      }));
    } catch (err: any) {
      setMessageByQuote((m) => ({
        ...m,
        [row.quoteId]: err?.message || "Proposal generation failed",
      }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [row.quoteId]: false }));
    }
  }

  function updateRowLocal(quoteId: string, updater: (row: PipelineRow) => PipelineRow) {
    setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? updater(r) : r)));
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardInner">
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="badge">Total: {rows.length}</span>
            {Object.entries(summaryCounts).map(([k, v]) => (
              <span key={k} className="badge">
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="row" style={{ flexDirection: "column", gap: 14 }}>
        {rows.map((row) => {
          const baseTarget = row.pie.pricingTarget ?? row.estimate.target;
          const discountPercent = Number(row.adminPricing.discountPercent || 0);
          const flatAdjustment = Number(row.adminPricing.flatAdjustment || 0);
          const hourlyRate = Number(row.adminPricing.hourlyRate || 40);

          const discounted = Math.round(baseTarget * (1 - discountPercent / 100));
          const adjustedTarget = discounted + flatAdjustment;

          const hoursMin = row.pie.hoursMin ?? null;
          const hoursMax = row.pie.hoursMax ?? null;
          const laborMin = hoursMin != null ? Math.round(hoursMin * hourlyRate) : null;
          const laborMax = hoursMax != null ? Math.round(hoursMax * hourlyRate) : null;

          const isBusy = !!busyByQuote[row.quoteId];
          const isExpanded = !!expanded[row.quoteId];

          return (
            <div key={row.quoteId} className="card">
              <div className="cardInner">
                <div
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className={statusBadge(row.status)}>{row.status}</span>
                      <span className={clientStatusBadge(row.clientStatus)}>
                        client: {row.clientStatus || "new"}
                      </span>
                      <span className="badge">{row.pie.tier || row.tier || "—"}</span>
                      {row.pie.score != null ? (
                        <span className="badge">Score: {row.pie.score}</span>
                      ) : null}
                      {row.pie.confidence ? (
                        <span className="badge">{row.pie.confidence}</span>
                      ) : null}
                    </div>

                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                      {row.leadEmail}
                    </div>
                    <div style={{ opacity: 0.78, fontSize: 13 }}>
                      Quote: {row.quoteId}
                    </div>
                    <div style={{ opacity: 0.78, fontSize: 13 }}>
                      Created: {fmtDate(row.createdAt)}
                    </div>

                    {row.callRequest ? (
                      <div style={{ opacity: 0.85, fontSize: 13, marginTop: 6 }}>
                        Call request: {row.callRequest.status || "new"} •{" "}
                        {row.callRequest.bestTime || row.callRequest.preferredTimes || "—"}
                      </div>
                    ) : null}

                    {/* Admin ↔ Client Sync Visibility */}
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13 }}>
                        Client portal activity
                      </div>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <span className="badge">Assets: {row.sync?.assetCount ?? 0}</span>
                        <span className="badge">Revisions: {row.sync?.revisionCount ?? 0}</span>
                        <span className="badge">
                          Client status: {row.clientStatus || "new"}
                        </span>
                      </div>

                      {row.sync?.latestClientNote ? (
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.92, lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            Latest client note {row.sync.latestClientNoteAt ? `• ${fmtDate(row.sync.latestClientNoteAt)}` : ""}
                          </div>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {row.sync.latestClientNote}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                          No client note yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      {fmtCurrency(adjustedTarget)}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.82, marginTop: 4 }}>
                      Base quote: {row.estimateFormatted.target} ({row.estimateFormatted.min}–
                      {row.estimateFormatted.max})
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.82, marginTop: 4 }}>
                      PIE target: {fmtCurrency(baseTarget)}
                    </div>
                    {hoursMin != null && hoursMax != null ? (
                      <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
                        Time: {hoursMin}–{hoursMax} hrs ({row.pie.timelineText || "—"})
                      </div>
                    ) : null}
                    {laborMin != null && laborMax != null ? (
                      <div style={{ fontSize: 13, opacity: 0.9 }}>
                        Labor @ ${hourlyRate}/hr: {fmtCurrency(laborMin)}–{fmtCurrency(laborMax)}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* PIE summary card */}
                <div
                  className="card"
                  style={{
                    marginTop: 14,
                    borderColor: "rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="cardInner">
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>
                      PIE summary
                    </div>
                    <div style={{ lineHeight: 1.6, opacity: 0.92 }}>
                      {row.pie.summary}
                    </div>

                    {row.pie.risks?.length ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>
                          Risks / blockers
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                          {row.pie.risks.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {row.pie.pitch?.emphasize?.length ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>
                          What to emphasize on the call
                        </div>
                        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                          {row.pie.pitch.emphasize.map((item: string, i: number) => (
                            <span key={i} className="badge">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Admin controls */}
                <div className="grid2" style={{ marginTop: 14 }}>
                  <div className="panel">
                    <div className="panelHeader">
                      <div style={{ fontWeight: 900 }}>Pipeline + pricing controls</div>
                    </div>
                    <div className="panelBody">
                      <div style={{ marginBottom: 10 }}>
                        <label className="fieldLabel">Status</label>
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
                          <option value="new">new</option>
                          <option value="call_requested">call_requested</option>
                          <option value="call">call</option>
                          <option value="proposal">proposal</option>
                          <option value="deposit">deposit</option>
                          <option value="active">active</option>
                          <option value="closed_won">closed_won</option>
                          <option value="closed_lost">closed_lost</option>
                        </select>
                      </div>

                      <div className="grid2">
                        <div>
                          <label className="fieldLabel">Discount %</label>
                          <input
                            className="input"
                            type="number"
                            value={row.adminPricing.discountPercent}
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
                        </div>

                        <div>
                          <label className="fieldLabel">Flat adjustment ($)</label>
                          <input
                            className="input"
                            type="number"
                            value={row.adminPricing.flatAdjustment}
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
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <label className="fieldLabel">Hourly rate ($/hr)</label>
                        <input
                          className="input"
                          type="number"
                          value={row.adminPricing.hourlyRate}
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
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <label className="fieldLabel">Admin notes (private)</label>
                        <textarea
                          className="textarea"
                          value={row.adminPricing.notes}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              adminPricing: {
                                ...r.adminPricing,
                                notes: e.target.value,
                              },
                            }))
                          }
                          placeholder="Example: can discount if they provide content + logo, otherwise hold target."
                        />
                      </div>

                      <div
                        className="row"
                        style={{ marginTop: 12, alignItems: "center", gap: 10, flexWrap: "wrap" }}
                      >
                        <button
                          className="btn btnPrimary"
                          disabled={isBusy}
                          onClick={() =>
                            saveQuoteAdmin(row.quoteId, {
                              status: row.status,
                              adminPricing: row.adminPricing,
                            })
                          }
                        >
                          Save status + pricing
                        </button>

                        <a
                          className="btn btnGhost"
                          href={row.links.detail}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open quote detail
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panelHeader">
                      <div style={{ fontWeight: 900 }}>Proposal generator</div>
                    </div>
                    <div className="panelBody">
                      <div className="smallNote" style={{ marginBottom: 10 }}>
                        Uses PIE + quote info to draft proposal text. If OpenAI is configured,
                        it can generate a stronger version automatically.
                      </div>

                      <div className="row" style={{ gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn btnPrimary"
                          disabled={isBusy}
                          onClick={() => generateProposal(row)}
                        >
                          Generate proposal text
                        </button>

                        <button
                          className="btn btnGhost"
                          disabled={isBusy || !row.proposalText}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(row.proposalText || "");
                              setMessageByQuote((m) => ({
                                ...m,
                                [row.quoteId]: "Proposal copied.",
                              }));
                            } catch {
                              setMessageByQuote((m) => ({
                                ...m,
                                [row.quoteId]: "Could not copy to clipboard.",
                              }));
                            }
                          }}
                        >
                          Copy
                        </button>

                        <button
                          className="btn btnGhost"
                          onClick={() =>
                            setExpanded((m) => ({
                              ...m,
                              [row.quoteId]: !m[row.quoteId],
                            }))
                          }
                        >
                          {isExpanded ? "Hide" : "Show"} proposal
                        </button>
                      </div>

                      {isExpanded ? (
                        <textarea
                          className="textarea"
                          value={row.proposalText || ""}
                          onChange={(e) =>
                            updateRowLocal(row.quoteId, (r) => ({
                              ...r,
                              proposalText: e.target.value,
                            }))
                          }
                          placeholder="Generated proposal text will appear here..."
                          style={{ minHeight: 220 }}
                        />
                      ) : null}

                      {isExpanded ? (
                        <div className="row" style={{ marginTop: 10 }}>
                          <button
                            className="btn btnGhost"
                            disabled={isBusy}
                            onClick={() =>
                              saveQuoteAdmin(row.quoteId, {
                                proposalText: row.proposalText,
                              })
                            }
                          >
                            Save proposal text
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!!messageByQuote[row.quoteId] && (
                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
                    {messageByQuote[row.quoteId]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}