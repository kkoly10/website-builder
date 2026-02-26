"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ScopeSnapshot = {
  id: string; project_id: string; quote_id: string | null; version_no: number;
  status: string; source: string; summary_text: string | null; timeline_text: string | null;
  price_target: number | null; price_min: number | null; price_max: number | null;
  hours_min: number | null; hours_max: number | null; snapshot: any; created_at: string;
};

type ChangeOrder = {
  id: string; project_id: string; quote_id: string | null; base_snapshot_id: string | null;
  applied_snapshot_id: string | null; title: string; reason: string | null;
  client_message: string | null; admin_notes: string | null; delta_price: number;
  delta_hours: number; status: string; requested_by: string; created_at: string;
};

function fmtMoney(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function ProjectWorkspaceClient({
  quoteId, projectId, project, pie, initialSnapshots, initialChangeOrders,
}: {
  quoteId: string; projectId: string; project: any; quote: any; pie: any;
  initialSnapshots: ScopeSnapshot[]; initialChangeOrders: ChangeOrder[];
}) {
  const [snapshots, setSnapshots] = useState<ScopeSnapshot[]>(initialSnapshots || []);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(initialChangeOrders || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [coForm, setCoForm] = useState({ title: "Scope change", reason: "", deltaPrice: 0, deltaHours: 0, adminNotes: "" });

  const latestSnapshot = useMemo(() => [...snapshots].sort((a, b) => b.version_no - a.version_no)[0] || null, [snapshots]);

  async function createSnapshotFromPie() {
    setBusy(true); setMsg("Generating scope snapshot from PIE...");
    try {
      const res = await fetch("/api/internal/admin/scope", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_from_pie", quoteId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");
      setSnapshots((prev) => [data.scopeSnapshot, ...prev].sort((a, b) => b.version_no - a.version_no));
      setMsg("Scope snapshot created from PIE.");
    } catch (err: any) { setMsg(err?.message || "Failed to create scope snapshot"); } 
    finally { setBusy(false); }
  }

  async function updateSnapshot(snapshotId: string, patch: Partial<ScopeSnapshot>) {
    setBusy(true); setMsg("Saving snapshot...");
    try {
      const res = await fetch("/api/internal/admin/scope", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_snapshot", scopeSnapshotId: snapshotId, status: patch.status, summaryText: patch.summary_text, timelineText: patch.timeline_text, priceTarget: patch.price_target, priceMin: patch.price_min, priceMax: patch.price_max, hoursMin: patch.hours_min, hoursMax: patch.hours_max }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to update");
      setSnapshots((prev) => prev.map((s) => (s.id === snapshotId ? data.scopeSnapshot : s)));
      setMsg("Snapshot updated.");
    } catch (err: any) { setMsg(err?.message || "Failed to update snapshot"); } 
    finally { setBusy(false); }
  }

  async function createChangeOrder() {
    setBusy(true); setMsg("Creating change order...");
    try {
      const res = await fetch("/api/internal/admin/change-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", quoteId, baseSnapshotId: latestSnapshot?.id || null, title: coForm.title, reason: coForm.reason, deltaPrice: coForm.deltaPrice, deltaHours: coForm.deltaHours, adminNotes: coForm.adminNotes, requestedBy: "admin", status: "requested" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");
      setChangeOrders((prev) => [data.changeOrder, ...prev]);
      setMsg("Change order created.");
      setCoForm({ title: "Scope change", reason: "", deltaPrice: 0, deltaHours: 0, adminNotes: "" });
    } catch (err: any) { setMsg(err?.message || "Failed to create change order"); } 
    finally { setBusy(false); }
  }

  async function setChangeOrderStatus(changeOrderId: string, status: string) {
    setBusy(true); setMsg(`Updating change order to ${status}...`);
    try {
      const res = await fetch("/api/internal/admin/change-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", changeOrderId, status }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");
      setChangeOrders((prev) => prev.map((c) => (c.id === changeOrderId ? data.changeOrder : c)));
      setMsg("Change order updated.");
    } catch (err: any) { setMsg(err?.message || "Failed to update change order"); } 
    finally { setBusy(false); }
  }

  return (
    <div className="row" style={{ flexDirection: "column", gap: 14 }}>
      
      {/* Header summary */}
      <div className="card" style={{ border: "1px solid var(--accentStroke)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <div className="cardInner">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 260 }}>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8, color: "var(--fg)" }}>Quote: {quoteId.slice(0,8)}...</div>
              <div className="pDark" style={{ marginBottom: 4 }}><strong>Lead:</strong> {project?.lead_email || "—"}</div>
              <div className="pDark" style={{ marginBottom: 4 }}><strong>Project ID:</strong> {projectId}</div>
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <span className="badge" style={{ background: "var(--panel2)" }}>Admin: {project?.project_status || project?.status || "—"}</span>
                <span className="badge">Client: {project?.client_status || "—"}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <button className="btn btnPrimary" disabled={busy} onClick={createSnapshotFromPie}>
                Generate Scope from PIE
              </button>
              <Link href={`/internal/admin/${quoteId}`} className="btn btnGhost" style={{ width: "100%" }}>
                ← Back to Quote Detail
              </Link>
            </div>
          </div>
          {msg && <div style={{ marginTop: 12, fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{msg}</div>}
        </div>
      </div>

      {/* Snapshots & Change Orders Grid */}
      <div className="grid2" style={{ alignItems: "start" }}>
        
        {/* Scope Snapshots */}
        <div className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ fontSize: 18, marginBottom: 16 }}>Scope Snapshots</h2>

            {!snapshots.length ? (
              <div className="pDark">No scope snapshots yet. Generate one from PIE first.</div>
            ) : (
              <div className="row" style={{ flexDirection: "column", gap: 12 }}>
                {snapshots.slice().sort((a, b) => b.version_no - a.version_no).map((s) => (
                  <div key={s.id} className="panel" style={{ border: s.status === 'approved' ? "1px solid var(--accentStroke)" : "1px solid var(--stroke)" }}>
                    <div className="panelHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 900, color: "var(--fg)" }}>v{s.version_no} • <span style={{ color: s.status === 'approved' ? "var(--accent)" : "inherit" }}>{s.status}</span></div>
                      <div className="smallNote">{fmtDate(s.created_at)}</div>
                    </div>
                    <div className="panelBody">
                      <div style={{ marginBottom: 12 }}>
                        <label className="fieldLabel">Summary Scope</label>
                        <textarea className="textarea" value={s.summary_text || ""} onChange={(e) => setSnapshots((prev) => prev.map((x) => x.id === s.id ? { ...x, summary_text: e.target.value } : x))} />
                      </div>

                      <div className="grid2" style={{ marginBottom: 12 }}>
                        <div>
                          <label className="fieldLabel">Target Price</label>
                          <input className="input" type="number" value={s.price_target ?? ""} onChange={(e) => setSnapshots((prev) => prev.map((x) => x.id === s.id ? { ...x, price_target: Number(e.target.value || 0) } : x))} />
                        </div>
                        <div>
                          <label className="fieldLabel">Timeline</label>
                          <input className="input" value={s.timeline_text || ""} onChange={(e) => setSnapshots((prev) => prev.map((x) => x.id === s.id ? { ...x, timeline_text: e.target.value } : x))} />
                        </div>
                      </div>

                      <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap", borderTop: "1px solid var(--stroke)", paddingTop: 12 }}>
                        <button className="btn btnPrimary" style={{ padding: "6px 12px", fontSize: 13 }} disabled={busy} onClick={() => updateSnapshot(s.id, s)}>Save Edits</button>
                        <button className="btn btnGhost" style={{ padding: "6px 12px", fontSize: 13 }} disabled={busy} onClick={() => updateSnapshot(s.id, { ...s, status: "sent" })}>Mark Sent</button>
                        <button className="btn btnGhost" style={{ padding: "6px 12px", fontSize: 13 }} disabled={busy} onClick={() => updateSnapshot(s.id, { ...s, status: "approved" })}>Approve</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change Orders */}
        <div className="card">
          <div className="cardInner">
            <h2 className="h2" style={{ fontSize: 18, marginBottom: 16 }}>Change Orders</h2>

            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="panelHeader"><div style={{ fontWeight: 800 }}>Create New Change Order</div></div>
              <div className="panelBody">
                <div style={{ marginBottom: 10 }}>
                  <label className="fieldLabel">Title</label>
                  <input className="input" value={coForm.title} onChange={(e) => setCoForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="fieldLabel">Reason</label>
                  <input className="input" value={coForm.reason} onChange={(e) => setCoForm((p) => ({ ...p, reason: e.target.value }))} placeholder="e.g. Added booking integration" />
                </div>
                <div className="grid2" style={{ marginBottom: 10 }}>
                  <div>
                    <label className="fieldLabel">Delta Price ($)</label>
                    <input className="input" type="number" value={coForm.deltaPrice} onChange={(e) => setCoForm((p) => ({ ...p, deltaPrice: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <label className="fieldLabel">Delta Hours</label>
                    <input className="input" type="number" value={coForm.deltaHours} onChange={(e) => setCoForm((p) => ({ ...p, deltaHours: Number(e.target.value || 0) }))} />
                  </div>
                </div>
                <button className="btn btnPrimary" style={{ width: "100%", marginTop: 8 }} disabled={busy} onClick={createChangeOrder}>Create CO</button>
              </div>
            </div>

            {!changeOrders.length ? (
              <div className="pDark">No change orders exist yet.</div>
            ) : (
              <div className="row" style={{ flexDirection: "column", gap: 10 }}>
                {changeOrders.map((co) => (
                  <div key={co.id} className="panel">
                    <div className="panelHeader">
                      <div style={{ fontWeight: 800, color: "var(--fg)" }}>{co.title}</div>
                      <div className="smallNote">Status: {co.status}</div>
                    </div>
                    <div className="panelBody">
                      <div className="pDark" style={{ marginBottom: 8 }}>{co.reason}</div>
                      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                        <span className="badge">Δ {fmtMoney(co.delta_price)}</span>
                        <span className="badge">Δ {co.delta_hours} Hours</span>
                      </div>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--stroke)", paddingTop: 12 }}>
                        <button className="btn btnGhost" style={{ padding: "6px 10px", fontSize: 12 }} disabled={busy} onClick={() => setChangeOrderStatus(co.id, "approved")}>Approve</button>
                        <button className="btn btnGhost" style={{ padding: "6px 10px", fontSize: 12 }} disabled={busy} onClick={() => setChangeOrderStatus(co.id, "rejected")}>Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
