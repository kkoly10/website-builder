// app/internal/project/[quoteId]/ProjectWorkspaceClient.tsx
"use client";

import { useMemo, useState } from "react";

type ScopeSnapshot = {
  id: string;
  project_id: string;
  quote_id: string | null;
  version_no: number;
  status: string;
  source: string;
  summary_text: string | null;
  timeline_text: string | null;
  price_target: number | null;
  price_min: number | null;
  price_max: number | null;
  hours_min: number | null;
  hours_max: number | null;
  snapshot: any;
  created_at: string;
};

type ChangeOrder = {
  id: string;
  project_id: string;
  quote_id: string | null;
  base_snapshot_id: string | null;
  applied_snapshot_id: string | null;
  title: string;
  reason: string | null;
  client_message: string | null;
  admin_notes: string | null;
  delta_price: number;
  delta_hours: number;
  status: string;
  requested_by: string;
  created_at: string;
};

function fmtMoney(n?: number | null) {
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

export default function ProjectWorkspaceClient({
  quoteId,
  projectId,
  project,
  quote,
  pie,
  initialSnapshots,
  initialChangeOrders,
}: {
  quoteId: string;
  projectId: string;
  project: any;
  quote: any;
  pie: any;
  initialSnapshots: ScopeSnapshot[];
  initialChangeOrders: ChangeOrder[];
}) {
  const [snapshots, setSnapshots] = useState<ScopeSnapshot[]>(initialSnapshots || []);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(initialChangeOrders || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [coForm, setCoForm] = useState({
    title: "Scope change",
    reason: "",
    deltaPrice: 0,
    deltaHours: 0,
    adminNotes: "",
  });

  const latestSnapshot = useMemo(
    () => [...snapshots].sort((a, b) => b.version_no - a.version_no)[0] || null,
    [snapshots]
  );

  async function createSnapshotFromPie() {
    setBusy(true);
    setMsg("Generating scope snapshot from PIE...");

    try {
      const res = await fetch("/api/internal/admin/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_from_pie", quoteId }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");
      setSnapshots((prev) => [data.scopeSnapshot, ...prev].sort((a, b) => b.version_no - a.version_no));
      setMsg("Scope snapshot created from PIE.");
    } catch (err: any) {
      setMsg(err?.message || "Failed to create scope snapshot");
    } finally {
      setBusy(false);
    }
  }

  async function updateSnapshot(snapshotId: string, patch: Partial<ScopeSnapshot>) {
    setBusy(true);
    setMsg("Saving snapshot...");

    try {
      const res = await fetch("/api/internal/admin/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_snapshot",
          scopeSnapshotId: snapshotId,
          status: patch.status,
          summaryText: patch.summary_text,
          timelineText: patch.timeline_text,
          priceTarget: patch.price_target,
          priceMin: patch.price_min,
          priceMax: patch.price_max,
          hoursMin: patch.hours_min,
          hoursMax: patch.hours_max,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to update");

      setSnapshots((prev) =>
        prev.map((s) => (s.id === snapshotId ? data.scopeSnapshot : s))
      );
      setMsg("Snapshot updated.");
    } catch (err: any) {
      setMsg(err?.message || "Failed to update snapshot");
    } finally {
      setBusy(false);
    }
  }

  async function createChangeOrder() {
    setBusy(true);
    setMsg("Creating change order...");

    try {
      const res = await fetch("/api/internal/admin/change-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          quoteId,
          baseSnapshotId: latestSnapshot?.id || null,
          title: coForm.title,
          reason: coForm.reason,
          deltaPrice: coForm.deltaPrice,
          deltaHours: coForm.deltaHours,
          adminNotes: coForm.adminNotes,
          requestedBy: "admin",
          status: "requested",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");
      setChangeOrders((prev) => [data.changeOrder, ...prev]);
      setMsg("Change order created.");
      setCoForm((p) => ({ ...p, reason: "", adminNotes: "", deltaPrice: 0, deltaHours: 0 }));
    } catch (err: any) {
      setMsg(err?.message || "Failed to create change order");
    } finally {
      setBusy(false);
    }
  }

  async function setChangeOrderStatus(changeOrderId: string, status: string) {
    setBusy(true);
    setMsg(`Updating change order to ${status}...`);

    try {
      const res = await fetch("/api/internal/admin/change-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          changeOrderId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed");

      setChangeOrders((prev) => prev.map((c) => (c.id === changeOrderId ? data.changeOrder : c)));
      setMsg("Change order updated.");
    } catch (err: any) {
      setMsg(err?.message || "Failed to update change order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row" style={{ flexDirection: "column", gap: 14 }}>
      {/* Header summary */}
      <div className="card">
        <div className="cardInner">
          <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                Quote: {quoteId}
              </div>
              <div className="smallNote">Project ID: {projectId}</div>
              <div className="smallNote">Lead: {project?.lead_email || "—"}</div>
              <div className="smallNote">Project status: {project?.project_status || project?.status || "—"}</div>
              <div className="smallNote">Client status: {project?.client_status || "—"}</div>
            </div>

            <div>
              <button className="btn btnPrimary" disabled={busy} onClick={createSnapshotFromPie}>
                Generate Scope Snapshot from PIE
              </button>
            </div>
          </div>

          {msg ? <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>{msg}</div> : null}
        </div>
      </div>

      {/* Latest PIE quick info */}
      <div className="card">
        <div className="cardInner">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Latest PIE quick view</div>
          {pie ? (
            <div className="grid2">
              <div>
                <div className="smallNote">PIE ID</div>
                <div>{pie.id}</div>
              </div>
              <div>
                <div className="smallNote">Tier / Score / Confidence</div>
                <div>
                  {pie.tier || "—"} / {pie.score ?? "—"} / {pie.confidence || "—"}
                </div>
              </div>
            </div>
          ) : (
            <div className="smallNote">No PIE report attached to this project yet.</div>
          )}
        </div>
      </div>

      {/* Scope snapshots */}
      <div className="card">
        <div className="cardInner">
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Scope Snapshots</div>

          {!snapshots.length ? (
            <div className="smallNote">No scope snapshots yet. Generate one from PIE first.</div>
          ) : (
            <div className="row" style={{ flexDirection: "column", gap: 12 }}>
              {snapshots
                .slice()
                .sort((a, b) => b.version_no - a.version_no)
                .map((s) => (
                  <div key={s.id} className="panel">
                    <div className="panelHeader">
                      <div style={{ fontWeight: 900 }}>
                        v{s.version_no} • {s.status} • {s.source}
                      </div>
                      <div className="smallNote">{fmtDate(s.created_at)}</div>
                    </div>
                    <div className="panelBody">
                      <div className="grid2">
                        <div>
                          <label className="fieldLabel">Summary</label>
                          <textarea
                            className="textarea"
                            value={s.summary_text || ""}
                            onChange={(e) =>
                              setSnapshots((prev) =>
                                prev.map((x) =>
                                  x.id === s.id ? { ...x, summary_text: e.target.value } : x
                                )
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="fieldLabel">Timeline</label>
                          <input
                            className="input"
                            value={s.timeline_text || ""}
                            onChange={(e) =>
                              setSnapshots((prev) =>
                                prev.map((x) =>
                                  x.id === s.id ? { ...x, timeline_text: e.target.value } : x
                                )
                              )
                            }
                          />
                          <div className="grid2" style={{ marginTop: 10 }}>
                            <div>
                              <label className="fieldLabel">Hours Min</label>
                              <input
                                className="input"
                                type="number"
                                value={s.hours_min ?? ""}
                                onChange={(e) =>
                                  setSnapshots((prev) =>
                                    prev.map((x) =>
                                      x.id === s.id
                                        ? { ...x, hours_min: Number(e.target.value || 0) }
                                        : x
                                    )
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="fieldLabel">Hours Max</label>
                              <input
                                className="input"
                                type="number"
                                value={s.hours_max ?? ""}
                                onChange={(e) =>
                                  setSnapshots((prev) =>
                                    prev.map((x) =>
                                      x.id === s.id
                                        ? { ...x, hours_max: Number(e.target.value || 0) }
                                        : x
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid2" style={{ marginTop: 10 }}>
                        <div>
                          <label className="fieldLabel">Target Price</label>
                          <input
                            className="input"
                            type="number"
                            value={s.price_target ?? ""}
                            onChange={(e) =>
                              setSnapshots((prev) =>
                                prev.map((x) =>
                                  x.id === s.id
                                    ? { ...x, price_target: Number(e.target.value || 0) }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="fieldLabel">Range (Min / Max)</label>
                          <div className="row" style={{ gap: 8 }}>
                            <input
                              className="input"
                              type="number"
                              value={s.price_min ?? ""}
                              onChange={(e) =>
                                setSnapshots((prev) =>
                                  prev.map((x) =>
                                    x.id === s.id
                                      ? { ...x, price_min: Number(e.target.value || 0) }
                                      : x
                                  )
                                )
                              }
                            />
                            <input
                              className="input"
                              type="number"
                              value={s.price_max ?? ""}
                              onChange={(e) =>
                                setSnapshots((prev) =>
                                  prev.map((x) =>
                                    x.id === s.id
                                      ? { ...x, price_max: Number(e.target.value || 0) }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="smallNote" style={{ marginTop: 10 }}>
                        Pricing preview: {fmtMoney(s.price_target)} ({fmtMoney(s.price_min)}–{fmtMoney(s.price_max)})
                      </div>

                      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn btnPrimary"
                          disabled={busy}
                          onClick={() => updateSnapshot(s.id, s)}
                        >
                          Save Snapshot
                        </button>

                        <button
                          className="btn btnGhost"
                          disabled={busy}
                          onClick={() => updateSnapshot(s.id, { ...s, status: "sent" })}
                        >
                          Mark Sent
                        </button>

                        <button
                          className="btn btnGhost"
                          disabled={busy}
                          onClick={() => updateSnapshot(s.id, { ...s, status: "approved" })}
                        >
                          Mark Approved
                        </button>

                        <button
                          className="btn btnGhost"
                          disabled={busy}
                          onClick={() => updateSnapshot(s.id, { ...s, status: "superseded" })}
                        >
                          Mark Superseded
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Change orders */}
      <div className="card">
        <div className="cardInner">
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Change Orders</div>

          <div className="panel" style={{ marginBottom: 12 }}>
            <div className="panelHeader">
              <div style={{ fontWeight: 800 }}>Create change order</div>
            </div>
            <div className="panelBody">
              <div className="grid2">
                <div>
                  <label className="fieldLabel">Title</label>
                  <input
                    className="input"
                    value={coForm.title}
                    onChange={(e) => setCoForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="fieldLabel">Reason</label>
                  <input
                    className="input"
                    value={coForm.reason}
                    onChange={(e) => setCoForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Example: Add booking form + payment integration"
                  />
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 10 }}>
                <div>
                  <label className="fieldLabel">Delta Price ($)</label>
                  <input
                    className="input"
                    type="number"
                    value={coForm.deltaPrice}
                    onChange={(e) =>
                      setCoForm((p) => ({ ...p, deltaPrice: Number(e.target.value || 0) }))
                    }
                  />
                </div>
                <div>
                  <label className="fieldLabel">Delta Hours</label>
                  <input
                    className="input"
                    type="number"
                    value={coForm.deltaHours}
                    onChange={(e) =>
                      setCoForm((p) => ({ ...p, deltaHours: Number(e.target.value || 0) }))
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="fieldLabel">Admin Notes</label>
                <textarea
                  className="textarea"
                  value={coForm.adminNotes}
                  onChange={(e) => setCoForm((p) => ({ ...p, adminNotes: e.target.value }))}
                  placeholder="Private note: include conditions, dependencies, timeline impact"
                />
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btnPrimary" disabled={busy} onClick={createChangeOrder}>
                  Create Change Order
                </button>
              </div>
            </div>
          </div>

          {!changeOrders.length ? (
            <div className="smallNote">No change orders yet.</div>
          ) : (
            <div className="row" style={{ flexDirection: "column", gap: 10 }}>
              {changeOrders.map((co) => (
                <div key={co.id} className="panel">
                  <div className="panelHeader">
                    <div style={{ fontWeight: 800 }}>
                      {co.title} • {co.status}
                    </div>
                    <div className="smallNote">{fmtDate(co.created_at)}</div>
                  </div>
                  <div className="panelBody">
                    <div className="smallNote" style={{ marginBottom: 6 }}>
                      Requested by: {co.requested_by}
                    </div>
                    {co.reason ? <div style={{ marginBottom: 6 }}>{co.reason}</div> : null}
                    {co.client_message ? (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Client message:</strong> {co.client_message}
                      </div>
                    ) : null}
                    {co.admin_notes ? (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Admin note:</strong> {co.admin_notes}
                      </div>
                    ) : null}

                    <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                      <span className="badge">Δ Price: {fmtMoney(co.delta_price)}</span>
                      <span className="badge">Δ Hours: {co.delta_hours ?? 0}</span>
                    </div>

                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btnGhost"
                        disabled={busy}
                        onClick={() => setChangeOrderStatus(co.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btnGhost"
                        disabled={busy}
                        onClick={() => setChangeOrderStatus(co.id, "rejected")}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btnGhost"
                        disabled={busy}
                        onClick={() => setChangeOrderStatus(co.id, "applied")}
                      >
                        Mark Applied
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="row" style={{ gap: 8 }}>
        <a className="btn btnGhost" href={`/internal/preview/${quoteId}`} target="_blank" rel="noreferrer">
          Open Quote Detail
        </a>
        <a className="btn btnGhost" href="/internal/admin" target="_blank" rel="noreferrer">
          Back to Admin Pipeline
        </a>
      </div>
    </div>
  );
}