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

type PortalAdminView = {
  previewUrl: string;
  productionUrl: string;
  previewStatus: string;
  previewNotes: string;
  previewUpdatedAt: string;
  clientReviewStatus: string;
  agreementStatus: string;
  agreementModel: string;
  ownershipModel: string;
  agreementPublishedAt: string;
};

export type PipelineRow = {
  quoteId: string;
  createdAt: string;
  status: string;
  tier: string;
  leadEmail: string;
  leadName: string;

  estimate: { target: number; min: number; max: number };
  estimateFormatted: { target: string; min: string; max: string };

  pie: PieView;

  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };

  portalAdmin: PortalAdminView;

  proposalText: string;

  links?: {
    detail?: string;
    workspace?: string;
  };
};

export default function AdminPipelineClient({
  initialRows,
}: {
  initialRows: PipelineRow[];
}) {
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
        return (
          (r.leadEmail || "").toLowerCase().includes(q) ||
          (r.leadName || "").toLowerCase().includes(q) ||
          (r.quoteId || "").toLowerCase().includes(q)
        );
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
      router.refresh();
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Save failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  const statusOptions = [
    "new",
    "call_requested",
    "call",
    "proposal",
    "deposit",
    "active",
    "closed",
  ];

  const previewStatusOptions = [
    "Awaiting published preview",
    "Ready for review",
    "Revision in progress",
    "Approved for launch",
    "Live",
  ];

  const reviewStatusOptions = [
    "Preview pending",
    "Pending review",
    "Changes requested",
    "Approved",
    "Live",
  ];

  const agreementStatusOptions = [
    "Not published yet",
    "Pre-draft / agreement stage",
    "Published to client",
    "Signed",
    "Kickoff ready",
  ];

  const ownershipOptions = [
    "Managed with project handoff options",
    "Client-owned / handoff",
  ];

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row">
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or quote id…"
          />

          <select
            className="select"
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

      <div>
        {filteredRows.map((row) => {
          const isBusy = !!busyByQuote[row.quoteId];
          const isExpanded = !!expanded[row.quoteId];

          const baseTarget = row.estimate.target || 0;
          const discounted = Math.round(
            baseTarget * (1 - (row.adminPricing?.discountPercent || 0) / 100)
          );
          const adjustedTarget = discounted + (row.adminPricing?.flatAdjustment || 0);

          return (
            <div key={row.quoteId} className="card">
              <div className="cardInner">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{row.leadName}</div>
                    <div className="pDark" style={{ marginTop: 4 }}>{row.leadEmail}</div>
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
                      <span className="badge">{row.portalAdmin.previewStatus}</span>
                      <span className="badge">{row.portalAdmin.agreementStatus}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 24 }}>
                      ${adjustedTarget.toLocaleString()}
                    </div>
                    <div className="pDark" style={{ marginTop: 6 }}>
                      Base: {row.estimateFormatted.target}
                    </div>
                  </div>
                </div>

                <div className="row" style={{ marginTop: 16 }}>
                  <button
                    className="btn btnPrimary"
                    disabled={isBusy}
                    onClick={() => generatePie(row.quoteId)}
                  >
                    {row.pie?.exists ? "Refresh PIE" : "Generate PIE"}{" "}
                    <span className="btnArrow">→</span>
                  </button>

                  <button
                    className="btn btnGhost"
                    type="button"
                    onClick={() =>
                      setExpanded((m) => ({ ...m, [row.quoteId]: !m[row.quoteId] }))
                    }
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

                <div className="panel" style={{ marginTop: 16 }}>
                  <div className="panelHeader">
                    <div>AI PIE Summary</div>
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

                <div className="panel" style={{ marginTop: 16 }}>
                  <div className="panelHeader">
                    <div>Pipeline & Pricing</div>
                    <div className="smallNote">Update status + pricing adjustments, then save.</div>
                  </div>

                  <div className="panelBody">
                    <div className="grid2">
                      <label>
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

                      <label>
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

                      <label>
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

                      <label>
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

                    <div className="row" style={{ marginTop: 14 }}>
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
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <>
                    <div className="panel" style={{ marginTop: 16 }}>
                      <div className="panelHeader">
                        <div>Workspace Publishing</div>
                        <div className="smallNote">
                          Publish preview and agreement data into the Website Project Studio.
                        </div>
                      </div>

                      <div className="panelBody">
                        <div className="grid2">
                          <label>
                            <span className="fieldLabel">Preview URL</span>
                            <input
                              className="input"
                              value={row.portalAdmin.previewUrl}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    previewUrl: e.target.value,
                                  },
                                }))
                              }
                              placeholder="https://project-branch.vercel.app"
                            />
                          </label>

                          <label>
                            <span className="fieldLabel">Production URL</span>
                            <input
                              className="input"
                              value={row.portalAdmin.productionUrl}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    productionUrl: e.target.value,
                                  },
                                }))
                              }
                              placeholder="https://clientsite.com"
                            />
                          </label>

                          <label>
                            <span className="fieldLabel">Preview Status</span>
                            <select
                              className="select"
                              value={row.portalAdmin.previewStatus}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    previewStatus: e.target.value,
                                  },
                                }))
                              }
                            >
                              {previewStatusOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="fieldLabel">Client Review Status</span>
                            <select
                              className="select"
                              value={row.portalAdmin.clientReviewStatus}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    clientReviewStatus: e.target.value,
                                  },
                                }))
                              }
                            >
                              {reviewStatusOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="fieldLabel">Agreement Status</span>
                            <select
                              className="select"
                              value={row.portalAdmin.agreementStatus}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    agreementStatus: e.target.value,
                                  },
                                }))
                              }
                            >
                              {agreementStatusOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="fieldLabel">Ownership Model</span>
                            <select
                              className="select"
                              value={row.portalAdmin.ownershipModel}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    ownershipModel: e.target.value,
                                  },
                                }))
                              }
                            >
                              {ownershipOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="fieldLabel">Agreement Model</span>
                            <input
                              className="input"
                              value={row.portalAdmin.agreementModel}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    agreementModel: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Managed build agreement"
                            />
                          </label>

                          <label>
                            <span className="fieldLabel">Agreement Published At</span>
                            <input
                              className="input"
                              value={row.portalAdmin.agreementPublishedAt}
                              onChange={(e) =>
                                updateRowLocal(row.quoteId, (r) => ({
                                  ...r,
                                  portalAdmin: {
                                    ...r.portalAdmin,
                                    agreementPublishedAt: e.target.value,
                                  },
                                }))
                              }
                              placeholder="2026-03-13T14:30:00.000Z"
                            />
                          </label>
                        </div>

                        <label style={{ display: "block", marginTop: 14 }}>
                          <span className="fieldLabel">Preview Notes</span>
                          <textarea
                            className="textarea"
                            rows={5}
                            value={row.portalAdmin.previewNotes}
                            onChange={(e) =>
                              updateRowLocal(row.quoteId, (r) => ({
                                ...r,
                                portalAdmin: {
                                  ...r.portalAdmin,
                                  previewNotes: e.target.value,
                                },
                              }))
                            }
                            placeholder="What changed in this preview? What should the client review?"
                          />
                        </label>

                        <div className="row" style={{ marginTop: 14 }}>
                          <button
                            className="btn btnPrimary"
                            disabled={isBusy}
                            onClick={() =>
                              saveQuoteAdmin(row.quoteId, {
                                portalAdmin: row.portalAdmin,
                              })
                            }
                          >
                            Publish to Workspace <span className="btnArrow">→</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="panel" style={{ marginTop: 16 }}>
                      <div className="panelHeader">
                        <div>Proposal Draft</div>
                        <div className="smallNote">Save proposal draft separately.</div>
                      </div>
                      <div className="panelBody">
                        <label>
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
                        </label>

                        <div className="row" style={{ marginTop: 14 }}>
                          <button
                            className="btn btnGhost"
                            disabled={isBusy}
                            onClick={() =>
                              saveQuoteAdmin(row.quoteId, {
                                proposalText: row.proposalText,
                              })
                            }
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
                      </div>
                    </div>
                  </>
                ) : null}

                {messageByQuote[row.quoteId] ? (
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--accent2)", fontWeight: 800 }}>
                    {messageByQuote[row.quoteId]}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}