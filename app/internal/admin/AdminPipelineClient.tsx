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
  createdAt: string;
  status: string; // internal/admin pipeline status (project/quote status)
  tier: string;
  leadEmail: string;
  leadName: string | null;

  // NEW / optional sync fields for Admin v2
  clientStatus?: string | null;
  assetCount?: number | null;
  revisionCount?: number | null;
  latestClientNote?: string | { body?: string; createdAt?: string } | null;

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

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "deposit" || s === "active" || s === "closed_won") return "badge badgeHot";
  return "badge";
}

function normalize(s: unknown) {
  return String(s ?? "").toLowerCase().trim();
}

function latestNoteText(row: PipelineRow) {
  const note = row.latestClientNote;
  if (!note) return "";
  if (typeof note === "string") return note;
  return note.body || "";
}

function latestNoteDate(row: PipelineRow) {
  const note = row.latestClientNote;
  if (!note || typeof note === "string") return null;
  return note.createdAt || null;
}

function clientStatusLabel(row: PipelineRow) {
  return row.clientStatus || "new";
}

function hasPie(row: PipelineRow) {
  return !!(row.pie?.exists || row.pie?.id);
}

function assetCount(row: PipelineRow) {
  return toNum(row.assetCount, 0);
}

function revisionCount(row: PipelineRow) {
  return toNum(row.revisionCount, 0);
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

  // Admin v2 filters
  const [search, setSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [clientStatusFilter, setClientStatusFilter] = useState("all");
  const [pieFilter, setPieFilter] = useState<"all" | "has_pie" | "missing_pie">("all");
  const [assetFilter, setAssetFilter] = useState<"all" | "has_assets" | "no_assets">("all");
  const [revisionFilter, setRevisionFilter] = useState<
    "all" | "has_revisions" | "no_revisions"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "price_high" | "price_low" | "score_high" | "score_low"
  >("newest");

  const summaryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = r.status || "new";
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    let next = [...rows];

    const q = normalize(search);
    if (q) {
      next = next.filter((r) => {
        const hay = [
          r.quoteId,
          r.leadEmail,
          r.leadName,
          r.status,
          r.clientStatus,
          r.tier,
          r.callRequest?.bestTime,
          r.callRequest?.preferredTimes,
          r.callRequest?.notes,
          r.pie?.summary,
          latestNoteText(r),
        ]
          .map((x) => normalize(x))
          .join(" ");
        return hay.includes(q);
      });
    }

    if (projectStatusFilter !== "all") {
      next = next.filter((r) => normalize(r.status) === normalize(projectStatusFilter));
    }

    if (clientStatusFilter !== "all") {
      next = next.filter(
        (r) => normalize(clientStatusLabel(r)) === normalize(clientStatusFilter)
      );
    }

    if (pieFilter === "has_pie") {
      next = next.filter((r) => hasPie(r));
    } else if (pieFilter === "missing_pie") {
      next = next.filter((r) => !hasPie(r));
    }

    if (assetFilter === "has_assets") {
      next = next.filter((r) => assetCount(r) > 0);
    } else if (assetFilter === "no_assets") {
      next = next.filter((r) => assetCount(r) === 0);
    }

    if (revisionFilter === "has_revisions") {
      next = next.filter((r) => revisionCount(r) > 0);
    } else if (revisionFilter === "no_revisions") {
      next = next.filter((r) => revisionCount(r) === 0);
    }

    next.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();

      const aBase = a.pie?.pricingTarget ?? a.estimate?.target ?? 0;
      const bBase = b.pie?.pricingTarget ?? b.estimate?.target ?? 0;

      const aScore = a.pie?.score ?? -1;
      const bScore = b.pie?.score ?? -1;

      switch (sortBy) {
        case "oldest":
          return aDate - bDate;
        case "price_high":
          return bBase - aBase;
        case "price_low":
          return aBase - bBase;
        case "score_high":
          return bScore - aScore;
        case "score_low":
          return aScore - bScore;
        case "newest":
        default:
          return bDate - aDate;
      }
    });

    return next;
  }, [
    rows,
    search,
    projectStatusFilter,
    clientStatusFilter,
    pieFilter,
    assetFilter,
    revisionFilter,
    sortBy,
  ]);

  const filteredSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    let missingPie = 0;
    let noAssets = 0;
    let withRevisions = 0;

    for (const r of filteredRows) {
      const k = r.status || "new";
      counts[k] = (counts[k] || 0) + 1;
      if (!hasPie(r)) missingPie += 1;
      if (assetCount(r) === 0) noAssets += 1;
      if (revisionCount(r) > 0) withRevisions += 1;
    }

    return { counts, missingPie, noAssets, withRevisions };
  }, [filteredRows]);

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

  async function quickSetStatus(row: PipelineRow, nextStatus: string) {
    await saveQuoteAdmin(row.quoteId, { status: nextStatus });
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
        [row.quoteId]:
          data.mode === "ai" ? "AI proposal generated." : "Proposal generated.",
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

  const projectStatusOptions = [
    "all",
    "new",
    "call_requested",
    "call",
    "proposal",
    "deposit",
    "active",
    "closed_won",
    "closed_lost",
  ];

  const clientStatusOptions = [
    "all",
    "new",
    "awaiting_content",
    "content_received",
    "in_progress",
    "in_review",
    "revision_requested",
    "completed",
  ];

  return (
    <div>
      {/* Top summary */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardInner">
          <div
            className="row"
            style={{ gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}
          >
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <span className="badge">Total: {rows.length}</span>
              <span className="badge">Showing: {filteredRows.length}</span>
              <span className="badge">Missing PIE: {filteredSummary.missingPie}</span>
              <span className="badge">No assets: {filteredSummary.noAssets}</span>
              <span className="badge">
                Revisions: {filteredSummary.withRevisions}
              </span>
            </div>

            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {Object.entries(summaryCounts).map(([k, v]) => (
                <span key={k} className="badge">
                  {k}: {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardInner">
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Admin v2 filters</div>

          <div className="grid2">
            <div>
              <label className="fieldLabel">Search</label>
              <input
                className="input"
                placeholder="Search email, quote ID, PIE summary, client note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="fieldLabel">Sort</label>
              <select
                className="select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "newest"
                      | "oldest"
                      | "price_high"
                      | "price_low"
                      | "score_high"
                      | "score_low"
                  )
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_high">Price high → low</option>
                <option value="price_low">Price low → high</option>
                <option value="score_high">PIE score high → low</option>
                <option value="score_low">PIE score low → high</option>
              </select>
            </div>
          </div>

          <div className="grid2" style={{ marginTop: 10 }}>
            <div>
              <label className="fieldLabel">Project status</label>
              <select
                className="select"
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
              >
                {projectStatusOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="fieldLabel">Client status</label>
              <select
                className="select"
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
              >
                {clientStatusOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button
              className={`btn ${pieFilter === "all" ? "btnPrimary" : "btnGhost"}`}
              onClick={() => setPieFilter("all")}
            >
              PIE: All
            </button>
            <button
              className={`btn ${pieFilter === "missing_pie" ? "btnPrimary" : "btnGhost"}`}
              onClick={() => setPieFilter("missing_pie")}
            >
              PIE Missing
            </button>
            <button
              className={`btn ${pieFilter === "has_pie" ? "btnPrimary" : "btnGhost"}`}
              onClick={() => setPieFilter("has_pie")}
            >
              PIE Ready
            </button>

            <button
              className={`btn ${assetFilter === "no_assets" ? "btnPrimary" : "btnGhost"}`}
              onClick={() => setAssetFilter(assetFilter === "no_assets" ? "all" : "no_assets")}
            >
              No Assets
            </button>
            <button
              className={`btn ${assetFilter === "has_assets" ? "btnPrimary" : "btnGhost"}`}
              onClick={() =>
                setAssetFilter(assetFilter === "has_assets" ? "all" : "has_assets")
              }
            >
              Has Assets
            </button>

            <button
              className={`btn ${
                revisionFilter === "has_revisions" ? "btnPrimary" : "btnGhost"
              }`}
              onClick={() =>
                setRevisionFilter(
                  revisionFilter === "has_revisions" ? "all" : "has_revisions"
                )
              }
            >
              Has Revisions
            </button>

            <button
              className="btn btnGhost"
              onClick={() => {
                setSearch("");
                setProjectStatusFilter("all");
                setClientStatusFilter("all");
                setPieFilter("all");
                setAssetFilter("all");
                setRevisionFilter("all");
                setSortBy("newest");
              }}
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="row" style={{ flexDirection: "column", gap: 14 }}>
        {filteredRows.map((row) => {
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

          const clientState = clientStatusLabel(row);
          const assets = assetCount(row);
          const revisions = revisionCount(row);
          const hasPieReport = hasPie(row);

          const noteText = latestNoteText(row);
          const noteDate = latestNoteDate(row);

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
                      <span className="badge">{row.pie.tier || row.tier || "—"}</span>

                      <span className="badge">Client: {clientState}</span>

                      <span className="badge">Assets: {assets}</span>
                      <span className="badge">Revisions: {revisions}</span>

                      {!hasPieReport ? (
                        <span className="badge badgeHot">PIE missing</span>
                      ) : null}

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
                    <div style={{ opacity: 0.78, fontSize: 13 }}>Quote: {row.quoteId}</div>
                    <div style={{ opacity: 0.78, fontSize: 13 }}>
                      Created: {fmtDate(row.createdAt)}
                    </div>

                    {row.callRequest ? (
                      <div style={{ opacity: 0.85, fontSize: 13, marginTop: 6 }}>
                        Call request: {row.callRequest.status || "new"} •{" "}
                        {row.callRequest.bestTime ||
                          row.callRequest.preferredTimes ||
                          "—"}
                      </div>
                    ) : null}

                    {noteText ? (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 13,
                          lineHeight: 1.45,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>
                          Latest client note
                          {noteDate ? (
                            <span style={{ opacity: 0.7, fontWeight: 500 }}>
                              {" "}
                              • {fmtDate(noteDate)}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ opacity: 0.92 }}>
                          {noteText.length > 220 ? `${noteText.slice(0, 220)}…` : noteText}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ minWidth: 240 }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>
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
                        Labor @ ${hourlyRate}/hr: {fmtCurrency(laborMin)}–
                        {fmtCurrency(laborMax)}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Quick pipeline buttons */}
                <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    className="btn btnGhost"
                    disabled={isBusy}
                    onClick={() => quickSetStatus(row, "call")}
                  >
                    Set: call
                  </button>
                  <button
                    className="btn btnGhost"
                    disabled={isBusy}
                    onClick={() => quickSetStatus(row, "proposal")}
                  >
                    Set: proposal
                  </button>
                  <button
                    className="btn btnGhost"
                    disabled={isBusy}
                    onClick={() => quickSetStatus(row, "deposit")}
                  >
                    Set: deposit
                  </button>
                  <button
                    className="btn btnGhost"
                    disabled={isBusy}
                    onClick={() => quickSetStatus(row, "active")}
                  >
                    Set: active
                  </button>
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
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>PIE summary</div>

                    {hasPieReport ? (
                      <>
                        <div style={{ lineHeight: 1.6, opacity: 0.92 }}>
                          {row.pie.summary || "PIE summary not available."}
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
                              {row.pie.pitch.emphasize.map(
                                (item: string, i: number) => (
                                  <span key={i} className="badge">
                                    {item}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div style={{ opacity: 0.85, lineHeight: 1.6 }}>
                        No PIE report yet for this quote. Open quote detail and generate PIE, or
                        run your PIE backfill endpoint after verifying project links.
                      </div>
                    )}
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
                          placeholder="Example: discount only if client supplies content/logo this week."
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

                      <div
                        className="row"
                        style={{ gap: 10, marginBottom: 10, flexWrap: "wrap" }}
                      >
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
                                [row.quoteId]: "Copy failed",
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

        {filteredRows.length === 0 ? (
          <div className="card">
            <div className="cardInner" style={{ opacity: 0.85 }}>
              No quotes match your current filters.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}