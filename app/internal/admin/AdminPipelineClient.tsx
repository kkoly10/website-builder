"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PieView = {
  exists: boolean;
  score: number | null;
  tier: string | null;
  summary: string;
  risks: string[];
  pricingTarget: number | null;
  hoursMin: number | null;
  hoursMax: number | null;
  timelineText: string | null;
};

type PipelineRow = {
  quoteId: string;
  createdAt: string;
  status: string;
  tier: string;
  leadEmail: string;
  estimate: { target: number; min: number; max: number };
  estimateFormatted: { target: string; min: string; max: string };
  pie: PieView;
  adminPricing: { discountPercent: number; flatAdjustment: number; hourlyRate: number; notes: string; };
  proposalText: string;
  links: { detail: string; workspace: string }; 
};

export default function AdminPipelineClient({ initialRows }: { initialRows: PipelineRow[] }) {
  const router = useRouter(); 
  const [rows, setRows] = useState<PipelineRow[]>(initialRows);
  const [busyByQuote, setBusyByQuote] = useState<Record<string, boolean>>({});
  const [messageByQuote, setMessageByQuote] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    let next = [...rows];
    const q = search.toLowerCase().trim();
    if (q) {
      next = next.filter((r) => r.leadEmail.toLowerCase().includes(q) || r.quoteId.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") next = next.filter((r) => r.status === statusFilter);
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
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId, force: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to generate PIE");
      setMessageByQuote((m) => ({ ...m, [quoteId]: "PIE Generated! Refreshing..." }));
      router.refresh(); 
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err.message || "Failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  async function saveQuoteAdmin(quoteId: string, payload: any) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId, ...payload }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? { ...r, ...payload } : r)));
      setMessageByQuote((m) => ({ ...m, [quoteId]: "Saved successfully." }));
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Save failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  async function generateProposal(row: PipelineRow) {
    setBusyByQuote((m) => ({ ...m, [row.quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [row.quoteId]: "Drafting proposal..." }));

    try {
      const res = await fetch("/api/internal/admin/proposal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: row.quoteId, hourlyRate: row.adminPricing.hourlyRate || 40 }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to generate proposal");

      updateRowLocal(row.quoteId, (r) => ({ ...r, proposalText: data.proposalText || r.proposalText }));
      setExpanded((m) => ({ ...m, [row.quoteId]: true }));
      setMessageByQuote((m) => ({ ...m, [row.quoteId]: "Proposal generated." }));
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [row.quoteId]: err?.message || "Proposal generation failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [row.quoteId]: false }));
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardInner" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Filters:</div>
          <input className="input" placeholder="Search email or ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="call_requested">Call Requested</option>
            <option value="proposal">Proposal</option>
            <option value="active">Active</option>
          </select>
          <div className="badge" style={{ marginLeft: "auto" }}>Total: {filteredRows.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {filteredRows.map((row) => {
          const isBusy = !!busyByQuote[row.quoteId];
          const isExpanded = !!expanded[row.quoteId];
          const baseTarget = row.pie.pricingTarget ?? row.estimate.target;
          const discounted = Math.round(baseTarget * (1 - row.adminPricing.discountPercent / 100));
          const adjustedTarget = discounted + row.adminPricing.flatAdjustment;

          return (
            <div key={row.quoteId} className="card">
              <div className="cardInner">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ minWidth: 280, flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className="badge" style={{ background: 'var(--panel2)', color: 'var(--fg)' }}>{row.status}</span>
                      <span className="badge">{row.tier}</span>
                      {row.pie.score != null && <span className="badge">Score: {row.pie.score}</span>}
                      {!row.pie.exists && <span className="badge" style={{ background: 'var(--accentSoft)', color: 'var(--accent)' }}>PIE Missing</span>}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "var(--fg)" }}>{row.leadEmail}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Created: {new Date(row.createdAt).toLocaleDateString()} • ID: {row.quoteId.slice(0, 8)}...</div>
                  </div>

                  <div style={{ minWidth: 200, textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 24, color: "var(--fg)" }}>
                      ${adjustedTarget.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                      Base: {row.estimateFormatted.target}
                    </div>
                  </div>
                </div>

                <div className="grid2" style={{ marginTop: 16 }}>
                  
                  {/* LEFT: PIE & Pricing */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: "var(--bg2)", border: "1px solid var(--stroke)", padding: 16, borderRadius: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontWeight: 800, color: "var(--fg)" }}>AI PIE Analysis</div>
                        <button className="btn btnPrimary" style={{ padding: "6px 12px", fontSize: 13 }} disabled={isBusy} onClick={() => generatePie(row.quoteId)}>
                          {row.pie.exists ? "Refresh" : "Generate"}
                        </button>
                      </div>

                      {row.pie.exists ? (
                        <div style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: 14 }}>{row.pie.summary}</div>
                      ) : (
                        <div style={{ color: "var(--muted2)", fontStyle: "italic", fontSize: 14 }}>No analysis available.</div>
                      )}
                    </div>

                    <div style={{ background: "var(--panel2)", border: "1px solid var(--stroke)", padding: 16, borderRadius: 12 }}>
                      <div style={{ fontWeight: 800, color: "var(--fg)", marginBottom: 12 }}>Pipeline & Pricing</div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <label className="fieldLabel">Status</label>
                        <select className="select" value={row.status} onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, status: e.target.value }))}>
                          <option value="new">new</option><option value="call_requested">call_requested</option><option value="call">call</option><option value="proposal">proposal</option><option value="deposit">deposit</option><option value="active">active</option>
                        </select>
                      </div>

                      <div className="grid2">
                        <div>
                          <label className="fieldLabel">Discount %</label>
                          <input className="input" type="number" value={row.adminPricing.discountPercent} onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, adminPricing: { ...r.adminPricing, discountPercent: Number(e.target.value || 0) } }))} />
                        </div>
                        <div>
                          <label className="fieldLabel">Adjustment ($)</label>
                          <input className="input" type="number" value={row.adminPricing.flatAdjustment} onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, adminPricing: { ...r.adminPricing, flatAdjustment: Number(e.target.value || 0) } }))} />
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                        <button className="btn btnPrimary" disabled={isBusy} onClick={() => saveQuoteAdmin(row.quoteId, { status: row.status, adminPricing: row.adminPricing })}>Save Config</button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Proposal Generator */}
                  <div style={{ background: "var(--panel2)", border: "1px solid var(--stroke)", padding: 16, borderRadius: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--fg)", marginBottom: 12 }}>Proposal Generator</div>
                    <div className="smallNote" style={{ marginBottom: 12 }}>Drafts a sales proposal using the PIE scope and pricing rules.</div>
                    
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn btnPrimary" disabled={isBusy} onClick={() => generateProposal(row)}>Generate Draft</button>
                      <button className="btn btnGhost" onClick={() => setExpanded((m) => ({ ...m, [row.quoteId]: !m[row.quoteId] }))}>{isExpanded ? "Hide" : "Show"}</button>
                      {row.proposalText && (
                         <button className="btn btnGhost" onClick={() => navigator.clipboard.writeText(row.proposalText)}>Copy</button>
                      )}
                    </div>

                    {isExpanded && (
                      <textarea
                        className="textarea"
                        style={{ minHeight: 220, marginTop: 12, background: "var(--bg2)" }}
                        value={row.proposalText || ""}
                        onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, proposalText: e.target.value }))}
                      />
                    )}
                    
                    {isExpanded && (
                      <button className="btn btnGhost" style={{ marginTop: 12 }} disabled={isBusy} onClick={() => saveQuoteAdmin(row.quoteId, { proposalText: row.proposalText })}>
                        Save Proposal Draft
                      </button>
                    )}
                  </div>
                </div>

                {messageByQuote[row.quoteId] && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>
                    {messageByQuote[row.quoteId]}
                  </div>
                )}

                {/* RESTORED: Admin Project Initiator Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid var(--stroke)", paddingTop: 16 }}>
                  <button className="btn btnGhost" style={{ padding: "6px 12px", fontSize: 13 }} disabled={isBusy} onClick={() => saveQuoteAdmin(row.quoteId, { status: "call_requested" })}>Mark Call Req</button>
                  <button className="btn btnGhost" style={{ padding: "6px 12px", fontSize: 13 }} disabled={isBusy} onClick={() => saveQuoteAdmin(row.quoteId, { status: "proposal" })}>Mark Proposal</button>
                  
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <Link href={row.links.detail} className="btn btnGhost" style={{ padding: "6px 12px", fontSize: 13 }}>
                      Quote Details
                    </Link>
                    <Link href={row.links.workspace} className="btn btnPrimary" style={{ padding: "6px 12px", fontSize: 13 }}>
                      Initialize Project Workspace →
                    </Link>
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
