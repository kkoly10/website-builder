"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PortalMilestone = { key: string; label: string; done: boolean; updatedAt?: string | null; };
type PortalAsset = { id: string; category: string; label: string; url: string; notes?: string; status: string; createdAt: string; };
type PortalRevision = { id: string; message: string; priority: string; status: string; createdAt: string; };

type PortalBundle = {
  quote: { id: string; publicToken: string; createdAt: string; status: string; tier: string; estimate: { target: number | null; min: number | null; max: number | null }; deposit: { status: string; paidAt: string | null; link: string | null; amount: number | null; notes: string | null; }; };
  lead: { email: string | null; phone: string | null; name: string | null };
  scope: { websiteType: string | null; pages: string | null; intent: string | null; timeline: string | null; contentReady: string | null; domainHosting: string | null; integrations: string[]; notes: string | null; };
  callRequest: { status: string | null; bestTime: string | null; timezone: string | null; notes: string | null; } | null;
  portalState: { clientStatus: string; clientUpdatedAt: string | null; clientNotes: string; adminPublicNote: string | null; milestones: PortalMilestone[]; assets: PortalAsset[]; revisions: PortalRevision[]; };
};

function fmtCurrency(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function badgeForAdminStatus(status: string) {
  const s = (status || "").toLowerCase();
  if (["deposit", "active", "closed_won"].includes(s)) return "badge badgeHot";
  return "badge";
}

function friendlyClientStatus(s: string) {
  switch ((s || "").toLowerCase()) {
    case "new": return "New";
    case "waiting_on_client": return "Waiting on client";
    case "content_submitted": return "Content submitted";
    case "need_help": return "Need help";
    case "revision_requested": return "Revision requested";
    case "deposit_sent": return "Client says deposit sent";
    default: return s || "—";
  }
}

export default function PortalClient({ initial }: { initial: PortalBundle }) {
  const [data, setData] = useState<PortalBundle>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [clientStatusDraft, setClientStatusDraft] = useState(initial.portalState.clientStatus || "new");
  const [clientNoteDraft, setClientNoteDraft] = useState(initial.portalState.clientNotes || "");

  const [assetDraft, setAssetDraft] = useState({ category: "Logo", label: "", url: "", notes: "" });
  const [revisionDraft, setRevisionDraft] = useState({ message: "", priority: "normal" });

  const progress = useMemo(() => {
    const total = data.portalState.milestones.length || 1;
    const done = data.portalState.milestones.filter((m) => m.done).length;
    return Math.round((done / total) * 100);
  }, [data.portalState.milestones]);

  async function sendAction(payload: any, successMsg?: string) {
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/portal/${data.quote.publicToken}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Update failed");
      setData(json.data as PortalBundle);
      setMessage(successMsg || "Updated successfully.");
    } catch (err: any) { setMessage(err?.message || "Something went wrong"); } 
    finally { setBusy(false); }
  }

  return (
    <main className="container section">
      <div className="row" style={{ flexDirection: "column", gap: 14 }}>
        
        {/* HEADER */}
        <div className="card">
          <div className="cardInner">
            <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="kicker" style={{ marginBottom: 10 }}><span className="kickerDot" /> Client Portal</div>
                <div className="h2" style={{ marginBottom: 8 }}>Project dashboard</div>
                <div className="p" style={{ margin: 0 }}>{data.lead.email || "Client"} • Quote #{data.quote.id.slice(0, 8)}</div>

                <div className="row" style={{ gap: 8, marginTop: 10 }}>
                  <span className={badgeForAdminStatus(data.quote.status)}>Admin status: {data.quote.status}</span>
                  <span className="badge">Client status: {friendlyClientStatus(data.portalState.clientStatus)}</span>
                  <span className="badge">Tier: {data.quote.tier}</span>
                </div>
              </div>

              <div style={{ minWidth: 210 }}>
                <div style={{ fontWeight: 900, fontSize: 20 }}>{fmtCurrency(data.quote.estimate.target)}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Estimate range: {fmtCurrency(data.quote.estimate.min)}–{fmtCurrency(data.quote.estimate.max)}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Created: {fmtDate(data.quote.createdAt)}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Progress: {progress}%</div>
              </div>
            </div>

            {data.portalState.adminPublicNote && (
              <div className="hint" style={{ marginTop: 12 }}><strong>Note from admin:</strong> {data.portalState.adminPublicNote}</div>
            )}
            {message && <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9, color: "var(--accent)" }}>{message}</div>}
          </div>
        </div>

        {/* CALL TO ACTION ROW */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <Link href="/editor" className="btn btnPrimary" style={{ padding: "14px 24px", fontSize: 16 }}>
            Open Website Preview / Editor →
          </Link>
        </div>

        <div className="grid2">
          {/* LEFT: Scope & Status */}
          <div className="panel">
            <div className="panelHeader"><div style={{ fontWeight: 900 }}>Scope snapshot</div></div>
            <div className="panelBody">
              <div className="twoCol">
                <div><div className="fieldLabel">Website type</div><div>{data.scope.websiteType || "—"}</div></div>
                <div><div className="fieldLabel">Pages</div><div>{data.scope.pages || "—"}</div></div>
                <div><div className="fieldLabel">Primary goal</div><div>{data.scope.intent || "—"}</div></div>
                <div><div className="fieldLabel">Content readiness</div><div>{data.scope.contentReady || "—"}</div></div>
              </div>
              
              {/* Sync Status */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <div className="fieldLabel">Sync Status with Admin</div>
                <select className="select" style={{ marginBottom: 10 }} value={clientStatusDraft} onChange={(e) => setClientStatusDraft(e.target.value)}>
                  <option value="new">New</option>
                  <option value="waiting_on_client">Working on content</option>
                  <option value="content_submitted">Content submitted</option>
                  <option value="need_help">Need help / have questions</option>
                  <option value="revision_requested">Revision requested</option>
                </select>
                <textarea className="textarea" value={clientNoteDraft} onChange={(e) => setClientNoteDraft(e.target.value)} placeholder="Message to admin..." style={{ marginBottom: 10 }} />
                <button className="btn btnGhost" disabled={busy} onClick={() => sendAction({ type: "client_status", clientStatus: clientStatusDraft, clientNotes: clientNoteDraft }, "Status sent.")} style={{ width: "100%" }}>
                  Send Update
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Financials & Deposit */}
          <div className="card" style={{ borderColor: "var(--accentStroke)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            <div className="cardInner">
              <h2 className="h2" style={{ fontSize: 20, marginBottom: 16 }}>Financials</h2>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--stroke)", paddingBottom: 12, marginBottom: 12 }}>
                <span style={{ color: "var(--muted)" }}>Total Investment</span>
                <strong style={{ color: "var(--fg)", fontSize: 16 }}>{fmtCurrency(data.quote.estimate.target)}</strong>
              </div>

              <div style={{ background: "var(--panel2)", padding: 16, borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="fieldLabel">Deposit Due</span>
                  <span className={data.quote.deposit.status === "paid" ? "badge badgeHot" : "badge"}>
                    {data.quote.deposit.status || "unpaid"}
                  </span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 28, color: "var(--fg)", marginBottom: 12 }}>{fmtCurrency(data.quote.deposit.amount)}</div>

                {data.quote.deposit.link ? (
                  <a className="btn btnPrimary" href={data.quote.deposit.link} target="_blank" rel="noreferrer" style={{ width: "100%" }}>Pay Deposit via Stripe</a>
                ) : (
                  <button className="btn btnGhost" disabled style={{ width: "100%" }}>Invoice Generating...</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Milestones */}
        <div className="panel">
          <div className="panelHeader"><div style={{ fontWeight: 900 }}>Project Milestones</div></div>
          <div className="panelBody">
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 8, borderRadius: 999, background: "var(--bg2)", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }} />
              </div>
            </div>
            <div className="row" style={{ flexDirection: "column", gap: 8 }}>
              {data.portalState.milestones.map((m) => (
                <label key={m.key} className="checkRow" style={{ background: m.done ? "var(--panel2)" : "var(--bg2)", borderColor: m.done ? "var(--stroke2)" : "var(--stroke)" }}>
                  <div className="checkLeft">
                    <input type="checkbox" checked={!!m.done} disabled={busy} onChange={(e) => sendAction({ type: "milestone_toggle", key: m.key, done: e.target.checked })} />
                    <div className="checkLabel" style={{ color: m.done ? "var(--muted)" : "var(--fg)", textDecoration: m.done ? "line-through" : "none" }}>{m.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
