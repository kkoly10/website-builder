// app/portal/[token]/PortalClient.tsx
"use client";

import { useMemo, useState } from "react";

type PortalMilestone = {
  key: string;
  label: string;
  done: boolean;
  updatedAt?: string | null;
};

type PortalAsset = {
  id: string;
  category: string;
  label: string;
  url: string;
  notes?: string;
  status: "submitted" | "received" | "approved";
  createdAt: string;
};

type PortalRevision = {
  id: string;
  message: string;
  priority: "low" | "normal" | "high";
  status: "new" | "reviewed" | "scheduled" | "done";
  createdAt: string;
};

type PortalBundle = {
  quote: {
    id: string;
    publicToken: string;
    createdAt: string;
    status: string;
    tier: string;
    estimate: { target: number | null; min: number | null; max: number | null };
    deposit: {
      status: string;
      paidAt: string | null;
      link: string | null;
      amount: number | null;
      notes: string | null;
    };
  };
  lead: { email: string | null; phone: string | null; name: string | null };
  scope: {
    websiteType: string | null;
    pages: string | null;
    intent: string | null;
    timeline: string | null;
    contentReady: string | null;
    domainHosting: string | null;
    integrations: string[];
    notes: string | null;
  };
  callRequest: {
    status: string | null;
    bestTime: string | null;
    timezone: string | null;
    notes: string | null;
  } | null;
  pie: {
    exists: boolean;
    id: string | null;
    score: number | null;
    tier: string | null;
    confidence: string | null;
    summary: string;
    risks: string[];
    pitch: {
      emphasize: string[];
      recommend: string | null;
      objections: string[];
    };
    pricing: {
      target: number | null;
      minimum: number | null;
      maximum: number | null;
    };
    hours: { min: number | null; max: number | null };
    timelineText: string | null;
    discoveryQuestions: string[];
  };
  portalState: {
    clientStatus: string;
    clientUpdatedAt: string | null;
    clientNotes: string;
    adminPublicNote: string | null;
    milestones: PortalMilestone[];
    assets: PortalAsset[];
    revisions: PortalRevision[];
  };
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

function badgeForAdminStatus(status: string) {
  const s = (status || "").toLowerCase();
  if (["deposit", "active", "closed_won"].includes(s)) return "badge badgeHot";
  return "badge";
}

function friendlyClientStatus(s: string) {
  switch ((s || "").toLowerCase()) {
    case "new":
      return "New";
    case "waiting_on_client":
      return "Waiting on client";
    case "content_submitted":
      return "Content submitted";
    case "need_help":
      return "Need help";
    case "revision_requested":
      return "Revision requested";
    case "deposit_sent":
      return "Client says deposit sent";
    default:
      return s || "—";
  }
}

export default function PortalClient({ initial }: { initial: PortalBundle }) {
  const [data, setData] = useState<PortalBundle>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [clientStatusDraft, setClientStatusDraft] = useState(
    initial.portalState.clientStatus || "new"
  );
  const [clientNoteDraft, setClientNoteDraft] = useState(initial.portalState.clientNotes || "");

  const [assetDraft, setAssetDraft] = useState({
    category: "Logo",
    label: "",
    url: "",
    notes: "",
  });

  const [revisionDraft, setRevisionDraft] = useState({
    message: "",
    priority: "normal",
  });

  const progress = useMemo(() => {
    const total = data.portalState.milestones.length || 1;
    const done = data.portalState.milestones.filter((m) => m.done).length;
    return Math.round((done / total) * 100);
  }, [data.portalState.milestones]);

  async function sendAction(payload: any, successMsg?: string) {
    setBusy(true);
    setMessage("");

    try {
      const res = await fetch(`/api/portal/${data.quote.publicToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Update failed");
      }

      setData(json.data as PortalBundle);
      setMessage(successMsg || "Updated.");
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container section">
      <div className="row" style={{ flexDirection: "column", gap: 14 }}>
        {/* Header */}
        <div className="card">
          <div className="cardInner">
            <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="kicker" style={{ marginBottom: 10 }}>
                  <span className="kickerDot" />
                  Client Portal
                </div>

                <div className="h2" style={{ marginBottom: 8 }}>
                  Project dashboard
                </div>

                <div className="p" style={{ margin: 0 }}>
                  {data.lead.email || "Client"} • Quote #{data.quote.id.slice(0, 8)}
                </div>

                <div className="row" style={{ gap: 8, marginTop: 10 }}>
                  <span className={badgeForAdminStatus(data.quote.status)}>
                    Admin status: {data.quote.status}
                  </span>
                  <span className="badge">
                    Client status: {friendlyClientStatus(data.portalState.clientStatus)}
                  </span>
                  <span className="badge">Tier: {data.quote.tier}</span>
                  {data.pie.score != null ? (
                    <span className="badge">Complexity: {data.pie.score}/100</span>
                  ) : null}
                </div>
              </div>

              <div style={{ minWidth: 210 }}>
                <div style={{ fontWeight: 900, fontSize: 20 }}>
                  {fmtCurrency(data.quote.estimate.target)}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                  Estimate range: {fmtCurrency(data.quote.estimate.min)}–{fmtCurrency(data.quote.estimate.max)}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                  Created: {fmtDate(data.quote.createdAt)}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                  Progress: {progress}%
                </div>
              </div>
            </div>

            {data.portalState.adminPublicNote ? (
              <div className="hint" style={{ marginTop: 12 }}>
                <strong>Note from admin:</strong> {data.portalState.adminPublicNote}
              </div>
            ) : null}

            {!!message && (
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>{message}</div>
            )}
          </div>
        </div>

        {/* Top row: scope + payment */}
        <div className="grid2">
          <div className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 900 }}>Scope snapshot</div>
            </div>
            <div className="panelBody">
              <div className="twoCol">
                <div>
                  <div className="fieldLabel">Website type</div>
                  <div>{data.scope.websiteType || "—"}</div>
                </div>
                <div>
                  <div className="fieldLabel">Pages</div>
                  <div>{data.scope.pages || "—"}</div>
                </div>
                <div>
                  <div className="fieldLabel">Primary goal</div>
                  <div>{data.scope.intent || "—"}</div>
                </div>
                <div>
                  <div className="fieldLabel">Timeline</div>
                  <div>{data.scope.timeline || data.pie.timelineText || "—"}</div>
                </div>
                <div>
                  <div className="fieldLabel">Content readiness</div>
                  <div>{data.scope.contentReady || "—"}</div>
                </div>
                <div>
                  <div className="fieldLabel">Domain / hosting</div>
                  <div>{data.scope.domainHosting || "—"}</div>
                </div>
              </div>

              {data.scope.integrations?.length ? (
                <div style={{ marginTop: 12 }}>
                  <div className="fieldLabel">Integrations</div>
                  <div className="row" style={{ gap: 8 }}>
                    {data.scope.integrations.map((i) => (
                      <span key={i} className="badge">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {data.callRequest ? (
                <div style={{ marginTop: 12 }}>
                  <div className="fieldLabel">Call request</div>
                  <div style={{ opacity: 0.9, lineHeight: 1.6 }}>
                    Status: {data.callRequest.status || "—"}
                    <br />
                    Best time: {data.callRequest.bestTime || "—"}
                    <br />
                    Timezone: {data.callRequest.timezone || "—"}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 900 }}>Deposit & payment</div>
            </div>
            <div className="panelBody">
              <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                <span
                  className={
                    (data.quote.deposit.status || "").toLowerCase() === "paid"
                      ? "badge badgeHot"
                      : "badge"
                  }
                >
                  Deposit status: {data.quote.deposit.status || "unpaid"}
                </span>
              </div>

              <div style={{ marginBottom: 6 }}>
                <span className="fieldLabel">Deposit amount</span>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {fmtCurrency(data.quote.deposit.amount)}
                </div>
              </div>

              {data.quote.deposit.paidAt ? (
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
                  Marked paid: {fmtDate(data.quote.deposit.paidAt)}
                </div>
              ) : null}

              {data.quote.deposit.notes ? (
                <div className="hint" style={{ marginBottom: 10 }}>
                  {data.quote.deposit.notes}
                </div>
              ) : null}

              <div className="row" style={{ gap: 10 }}>
                {data.quote.deposit.link ? (
                  <a
                    className="btn btnPrimary"
                    href={data.quote.deposit.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pay deposit
                  </a>
                ) : (
                  <button className="btn btnGhost" disabled>
                    Deposit link pending
                  </button>
                )}

                <button
                  className="btn btnGhost"
                  disabled={busy}
                  onClick={() =>
                    sendAction(
                      { type: "deposit_mark_paid", note: "Client marked deposit as sent." },
                      "Noted — admin has been updated."
                    )
                  }
                >
                  I sent payment
                </button>
              </div>

              <div className="smallNote" style={{ marginTop: 10 }}>
                If you already paid, tap “I sent payment” so we can confirm faster.
              </div>
            </div>
          </div>
        </div>

        {/* Milestones + client status */}
        <div className="grid2">
          <div className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 900 }}>Milestone tracker</div>
            </div>
            <div className="panelBody">
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, rgba(255,122,24,0.9), rgba(255,154,77,0.9))",
                    }}
                  />
                </div>
              </div>

              <div className="row" style={{ flexDirection: "column", gap: 8 }}>
                {data.portalState.milestones.map((m) => (
                  <label key={m.key} className="checkRow">
                    <div className="checkLeft">
                      <input
                        type="checkbox"
                        checked={!!m.done}
                        onChange={(e) =>
                          sendAction(
                            {
                              type: "milestone_toggle",
                              key: m.key,
                              done: e.target.checked,
                            },
                            "Milestone updated."
                          )
                        }
                        disabled={busy}
                      />
                      <div>
                        <div className="checkLabel" style={{ whiteSpace: "normal" }}>
                          {m.label}
                        </div>
                        <div className="checkHint">
                          {m.updatedAt ? `Updated ${fmtDate(m.updatedAt)}` : " "}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 900 }}>Status sync with admin</div>
            </div>
            <div className="panelBody">
              <div style={{ marginBottom: 10 }}>
                <label className="fieldLabel">Your current status</label>
                <select
                  className="select"
                  value={clientStatusDraft}
                  onChange={(e) => setClientStatusDraft(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="waiting_on_client">Working on content</option>
                  <option value="content_submitted">Content submitted</option>
                  <option value="need_help">Need help / have questions</option>
                  <option value="revision_requested">Revision requested</option>
                  <option value="deposit_sent">Deposit sent</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label className="fieldLabel">Message to admin</label>
                <textarea
                  className="textarea"
                  value={clientNoteDraft}
                  onChange={(e) => setClientNoteDraft(e.target.value)}
                  placeholder="Example: I uploaded the logo and home page text in the assets section."
                />
              </div>

              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  sendAction(
                    {
                      type: "client_status",
                      clientStatus: clientStatusDraft,
                      clientNotes: clientNoteDraft,
                    },
                    "Status sent to admin."
                  )
                }
              >
                Update my status
              </button>

              <div className="smallNote" style={{ marginTop: 10 }}>
                Admin status comes from your project pipeline. Your status here helps the admin know
                what you’ve completed on your side.
              </div>
            </div>
          </div>
        </div>

        {/* Assets + revisions */}
        <div className="grid2">
          <div className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 900 }}>Assets & content submission</div>
            </div>
            <div className="panelBody">
              <div className="grid2">
                <div>
                  <label className="fieldLabel">Category</label>
                  <select
                    className="select"
                    value={assetDraft.category}
                    onChange={(e) =>
                      setAssetDraft((s) => ({ ...s, category: e.target.value }))
                    }
                  >
                    <option>Logo</option>
                    <option>Brand Guide</option>
                    <option>Photos</option>
                    <option>Website Copy</option>
                    <option>Login Access</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="fieldLabel">Label</label>
                  <input
                    className="input"
                    value={assetDraft.label}
                    onChange={(e) =>
                      setAssetDraft((s) => ({ ...s, label: e.target.value }))
                    }
                    placeholder="Homepage copy draft"
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="fieldLabel">Link / URL</label>
                <input
                  className="input"
                  value={assetDraft.url}
                  onChange={(e) =>
                    setAssetDraft((s) => ({ ...s, url: e.target.value }))
                  }
                  placeholder="Google Drive / Dropbox / Canva / Figma / etc."
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <label className="fieldLabel">Notes (optional)</label>
                <textarea
                  className="textarea"
                  value={assetDraft.notes}
                  onChange={(e) =>
                    setAssetDraft((s) => ({ ...s, notes: e.target.value }))
                  }
                  placeholder="Anything admin should know about this asset"
                />
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn btnPrimary"
                  disabled={busy}
                  onClick={async () => {
                    await sendAction(
                      {
                        type: "asset_add",
                        asset: assetDraft,
                      },
                      "Asset submitted."
                    );
                    setAssetDraft({
                      category: "Logo",
                      label: "",
                      url: "",
                      notes: "",
                    });
                  }}
                >
                  Submit asset
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="fieldLabel">Submitted assets</div>
                {data.portalState.assets.length === 0 ? (
                  <div className="smallNote">No assets submitted yet.</div>
                ) : (
                  <div className="row" style={{ flexDirection: "column", gap: 8 }}>
                    {data.portalState.assets.map((a) => (
                      <div key={a.id} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="cardInner" style={{ padding: 12 }}>
                          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 900 }}>{a.label}</div>
                              <div style={{ fontSize: 12, opacity: 0.75 }}>
                                {a.category} • {fmtDate(a.createdAt)}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                                <a href={a.url} target="_blank" rel="noreferrer">
                                  {a.url}
                                </a>
                              </div>
                              {a.notes ? (
                                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                                  {a.notes}
                                </div>
                              ) : null}
                            </div>
                            <span className="badge">{a.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div style={{ fontWeight: 900 }}>Revision requests</div>
            </div>
            <div className="panelBody">
              <div style={{ marginBottom: 10 }}>
                <label className="fieldLabel">Priority</label>
                <select
                  className="select"
                  value={revisionDraft.priority}
                  onChange={(e) =>
                    setRevisionDraft((s) => ({ ...s, priority: e.target.value }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label className="fieldLabel">What would you like changed?</label>
                <textarea
                  className="textarea"
                  value={revisionDraft.message}
                  onChange={(e) =>
                    setRevisionDraft((s) => ({ ...s, message: e.target.value }))
                  }
                  placeholder="Example: Please make the hero text bigger and change the CTA button wording."
                />
              </div>

              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={async () => {
                  await sendAction(
                    { type: "revision_add", revision: revisionDraft },
                    "Revision request sent."
                  );
                  setRevisionDraft({ message: "", priority: "normal" });
                }}
              >
                Send revision request
              </button>

              <div style={{ marginTop: 12 }}>
                <div className="fieldLabel">Revision history</div>
                {data.portalState.revisions.length === 0 ? (
                  <div className="smallNote">No revision requests yet.</div>
                ) : (
                  <div className="row" style={{ flexDirection: "column", gap: 8 }}>
                    {data.portalState.revisions.map((r) => (
                      <div key={r.id} className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="cardInner" style={{ padding: 12 }}>
                          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 12, opacity: 0.75 }}>
                                {fmtDate(r.createdAt)} • Priority: {r.priority}
                              </div>
                              <div style={{ marginTop: 6, lineHeight: 1.5 }}>{r.message}</div>
                            </div>
                            <span className="badge">{r.status}</span>
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

        {/* PIE guidance */}
        <div className="panel">
          <div className="panelHeader">
            <div style={{ fontWeight: 900 }}>Project guidance</div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="fieldLabel">Estimated build effort</div>
                <div>
                  {data.pie.hours.min != null && data.pie.hours.max != null
                    ? `${data.pie.hours.min}–${data.pie.hours.max} hours`
                    : "—"}
                </div>

                <div className="fieldLabel" style={{ marginTop: 10 }}>
                  Timeline
                </div>
                <div>{data.pie.timelineText || data.scope.timeline || "—"}</div>

                <div className="fieldLabel" style={{ marginTop: 10 }}>
                  Summary
                </div>
                <div style={{ lineHeight: 1.6 }}>{data.pie.summary}</div>

                {data.pie.risks?.length ? (
                  <>
                    <div className="fieldLabel" style={{ marginTop: 10 }}>
                      Watchouts
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                      {data.pie.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>

              <div>
                {data.pie.pitch?.emphasize?.length ? (
                  <>
                    <div className="fieldLabel">Focus areas</div>
                    <div className="row" style={{ gap: 8 }}>
                      {data.pie.pitch.emphasize.map((item, i) => (
                        <span key={i} className="badge">
                          {item}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}

                {data.pie.discoveryQuestions?.length ? (
                  <>
                    <div className="fieldLabel" style={{ marginTop: 12 }}>
                      Questions to prepare for
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                      {data.pie.discoveryQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="smallNote">
                    You’ll see more guided questions here as PIE gets upgraded further.
                  </div>
                )}

                <div className="fieldLabel" style={{ marginTop: 12 }}>
                  PIE pricing reference
                </div>
                <div>
                  Target: {fmtCurrency(data.pie.pricing.target)} • Min: {fmtCurrency(data.pie.pricing.minimum)}
                  {" • "}
                  Max: {fmtCurrency(data.pie.pricing.maximum)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}