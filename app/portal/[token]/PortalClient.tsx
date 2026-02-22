// app/portal/[token]/PortalClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type PortalClientProps = {
  token: string;
  quote: any;
  lead?: any | null;
  callRequest?: any | null;
};

type Milestone = {
  id: string;
  title: string;
  detail?: string | null;
  status: "todo" | "in_progress" | "done" | string;
  due_date?: string | null;
  sort_order?: number | null;
};

type AssetRow = {
  id: string;
  created_at?: string;
  label?: string;
  asset_type?: string;
  url?: string | null;
  notes?: string | null;
  signed_url?: string | null;
  file_name?: string | null;
  status?: string | null;
};

type RevisionRow = {
  id: string;
  created_at?: string;
  page?: string | null;
  priority?: string | null;
  request_type?: string | null;
  message?: string | null;
  status?: string | null;
};

function money(value: any) {
  if (value == null) return "—";

  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;

  if (Number.isNaN(n)) return "—";

  // If it's cents, convert (heuristic)
  const dollars = n > 9999 ? n / 100 : n;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
}

function getQuoteTier(quote: any) {
  return (
    quote?.tier ||
    quote?.recommended_tier ||
    quote?.selected_tier ||
    quote?.quote_tier ||
    "—"
  );
}

function getQuoteEstimate(quote: any) {
  return (
    quote?.target_price ??
    quote?.estimate_total ??
    quote?.recommended_price ??
    quote?.total ??
    quote?.amount ??
    quote?.price ??
    quote?.estimate ??
    null
  );
}

function parseScopeSnapshot(quote: any) {
  const candidates = [
    quote?.scope_snapshot,
    quote?.scopeSnapshot,
    quote?.scope,
    quote?.snapshot,
    quote?.intake_snapshot,
    quote?.build_answers,
    quote?.payload,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "object") return c;
    if (typeof c === "string") {
      try {
        return JSON.parse(c);
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function prettyDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function PortalClient({
  token,
  quote,
  lead,
  callRequest,
}: PortalClientProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);

  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingRevisions, setLoadingRevisions] = useState(true);

  const [assetMsg, setAssetMsg] = useState<string | null>(null);
  const [assetErr, setAssetErr] = useState<string | null>(null);
  const [revMsg, setRevMsg] = useState<string | null>(null);
  const [revErr, setRevErr] = useState<string | null>(null);

  const [assetLinkForm, setAssetLinkForm] = useState({
    assetType: "content",
    label: "",
    url: "",
    notes: "",
  });

  const [assetFileForm, setAssetFileForm] = useState({
    assetType: "file",
    label: "",
    notes: "",
    file: null as File | null,
  });

  const [revisionForm, setRevisionForm] = useState({
    page: "General",
    priority: "normal",
    requestType: "change",
    message: "",
  });

  const scope = useMemo(() => parseScopeSnapshot(quote), [quote]);

  const depositUrl =
    quote?.deposit_checkout_url ||
    quote?.checkout_url ||
    quote?.stripe_checkout_url ||
    quote?.deposit_url ||
    null;

  const refreshMilestones = async () => {
    setLoadingMilestones(true);
    try {
      const res = await fetch(
        `/api/portal/milestones?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json?.ok) setMilestones(json.milestones || []);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const refreshAssets = async () => {
    setLoadingAssets(true);
    try {
      const res = await fetch(
        `/api/portal/assets?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json?.ok) setAssets(json.assets || []);
    } finally {
      setLoadingAssets(false);
    }
  };

  const refreshRevisions = async () => {
    setLoadingRevisions(true);
    try {
      const res = await fetch(
        `/api/portal/revision?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json?.ok) setRevisions(json.revisions || []);
    } finally {
      setLoadingRevisions(false);
    }
  };

  useEffect(() => {
    refreshMilestones();
    refreshAssets();
    refreshRevisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submitAssetLink(e: React.FormEvent) {
    e.preventDefault();
    setAssetErr(null);
    setAssetMsg(null);

    try {
      const res = await fetch("/api/portal/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          assetType: assetLinkForm.assetType,
          label: assetLinkForm.label,
          url: assetLinkForm.url,
          notes: assetLinkForm.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not save link");
      }

      setAssetMsg("Asset link submitted successfully.");
      setAssetLinkForm({
        assetType: "content",
        label: "",
        url: "",
        notes: "",
      });
      refreshAssets();
    } catch (err: any) {
      setAssetErr(err?.message || "Could not submit link");
    }
  }

  async function submitAssetFile(e: React.FormEvent) {
    e.preventDefault();
    setAssetErr(null);
    setAssetMsg(null);

    if (!assetFileForm.file) {
      setAssetErr("Please choose a file first.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("token", token);
      fd.append("assetType", assetFileForm.assetType);
      fd.append("label", assetFileForm.label);
      fd.append("notes", assetFileForm.notes);
      fd.append("file", assetFileForm.file);

      const res = await fetch("/api/portal/assets", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not upload file");
      }

      setAssetMsg("File uploaded successfully.");
      setAssetFileForm({
        assetType: "file",
        label: "",
        notes: "",
        file: null,
      });

      // reset input visually by forcing refresh of state only
      const input = document.getElementById("portal-file-input") as HTMLInputElement | null;
      if (input) input.value = "";

      refreshAssets();
    } catch (err: any) {
      setAssetErr(err?.message || "Could not upload file");
    }
  }

  async function submitRevision(e: React.FormEvent) {
    e.preventDefault();
    setRevErr(null);
    setRevMsg(null);

    try {
      const res = await fetch("/api/portal/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...revisionForm }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not submit revision");
      }

      setRevMsg("Revision request submitted.");
      setRevisionForm((prev) => ({ ...prev, message: "" }));
      refreshRevisions();
    } catch (err: any) {
      setRevErr(err?.message || "Could not submit revision");
    }
  }

  const doneCount = milestones.filter((m) => m.status === "done").length;
  const totalCount = milestones.length;
  const progressPct =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="sectionSm">
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="kicker">
              <span className="kickerDot" />
              Client Portal
            </div>
            <h1 className="h2" style={{ marginTop: 10 }}>
              Project dashboard
            </h1>
            <p className="pDark" style={{ marginTop: 8 }}>
              View your project scope, upload assets, track progress, and request revisions.
            </p>
          </div>

          {depositUrl ? (
            <a className="btn btnPrimary" href={depositUrl} target="_blank" rel="noreferrer">
              Pay deposit <span className="btnArrow">→</span>
            </a>
          ) : (
            <div className="badge badgeHot">Deposit link will appear here</div>
          )}
        </div>

        {/* Top summary */}
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Project summary</h2>
            </div>
            <div className="panelBody">
              <div className="pDark"><strong>Quote ID:</strong> {quote?.id || "—"}</div>
              <div className="pDark"><strong>Status:</strong> {quote?.status || "—"}</div>
              <div className="pDark"><strong>Tier:</strong> {String(getQuoteTier(quote))}</div>
              <div className="pDark"><strong>Estimate:</strong> {money(getQuoteEstimate(quote))}</div>
              <div className="pDark"><strong>Created:</strong> {prettyDate(quote?.created_at)}</div>
              <div className="pDark"><strong>Client:</strong> {lead?.email || lead?.name || "—"}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Progress tracker</h2>
            </div>
            <div className="panelBody">
              <div className="pDark" style={{ marginBottom: 8 }}>
                {totalCount > 0
                  ? `${doneCount} of ${totalCount} milestones completed`
                  : "Milestones will appear here once the project is started."}
              </div>

              <div
                style={{
                  width: "100%",
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.10)",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, rgba(255,122,24,1), rgba(255,154,77,0.95))",
                  }}
                />
              </div>

              <div className="pDark">
                <strong>{progressPct}%</strong> complete
              </div>
            </div>
          </div>
        </div>

        {/* Scope Snapshot */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 18 }}>Scope snapshot</h2>
          </div>
          <div className="panelBody">
            {!scope ? (
              <p className="pDark">
                No scope snapshot found yet. Your builder will add project details here.
              </p>
            ) : (
              <div className="grid2">
                {Object.entries(scope).map(([key, value]) => (
                  <div
                    key={key}
                    className="card"
                    style={{ borderRadius: 14, boxShadow: "none" }}
                  >
                    <div className="cardInner" style={{ padding: 14 }}>
                      <div className="smallNote" style={{ textTransform: "capitalize" }}>
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          color: "rgba(255,255,255,0.92)",
                          fontWeight: 800,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.55,
                          fontSize: 14,
                        }}
                      >
                        {typeof value === "string"
                          ? value
                          : Array.isArray(value)
                          ? value.join(", ")
                          : JSON.stringify(value, null, 2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 18 }}>Milestones</h2>
          </div>
          <div className="panelBody">
            {loadingMilestones ? (
              <p className="pDark">Loading milestones…</p>
            ) : milestones.length === 0 ? (
              <p className="pDark">
                No milestones yet. Your builder will publish milestones when work begins.
              </p>
            ) : (
              <div className="row" style={{ flexDirection: "column" }}>
                {milestones.map((m) => {
                  const tone =
                    m.status === "done"
                      ? "rgba(34,197,94,0.16)"
                      : m.status === "in_progress"
                      ? "rgba(255,122,24,0.16)"
                      : "rgba(255,255,255,0.03)";

                  const border =
                    m.status === "done"
                      ? "rgba(34,197,94,0.35)"
                      : m.status === "in_progress"
                      ? "rgba(255,122,24,0.35)"
                      : "rgba(255,255,255,0.10)";

                  return (
                    <div
                      key={m.id}
                      style={{
                        border: `1px solid ${border}`,
                        background: tone,
                        borderRadius: 14,
                        padding: 12,
                      }}
                    >
                      <div
                        className="row"
                        style={{ justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div style={{ fontWeight: 900 }}>{m.title || "Untitled milestone"}</div>
                        <div className="badge">
                          {m.status === "in_progress"
                            ? "In Progress"
                            : m.status === "done"
                            ? "Done"
                            : "Planned"}
                        </div>
                      </div>
                      {m.detail ? (
                        <div className="pDark" style={{ marginTop: 6 }}>
                          {m.detail}
                        </div>
                      ) : null}
                      {m.due_date ? (
                        <div className="smallNote" style={{ marginTop: 6 }}>
                          Target: {m.due_date}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Asset upload area */}
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Submit asset link</h2>
            </div>
            <div className="panelBody">
              <form onSubmit={submitAssetLink}>
                <div className="fieldLabel">Asset type</div>
                <select
                  className="select"
                  value={assetLinkForm.assetType}
                  onChange={(e) =>
                    setAssetLinkForm((p) => ({ ...p, assetType: e.target.value }))
                  }
                >
                  <option value="content">Content doc</option>
                  <option value="images">Image folder</option>
                  <option value="brand">Brand assets</option>
                  <option value="login">Login / access note</option>
                  <option value="link">Other link</option>
                </select>

                <div className="fieldLabel" style={{ marginTop: 10 }}>Label</div>
                <input
                  className="input"
                  value={assetLinkForm.label}
                  onChange={(e) =>
                    setAssetLinkForm((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Example: Google Drive content folder"
                />

                <div className="fieldLabel" style={{ marginTop: 10 }}>URL</div>
                <input
                  className="input"
                  value={assetLinkForm.url}
                  onChange={(e) =>
                    setAssetLinkForm((p) => ({ ...p, url: e.target.value }))
                  }
                  placeholder="https://..."
                />

                <div className="fieldLabel" style={{ marginTop: 10 }}>Notes (optional)</div>
                <textarea
                  className="textarea"
                  value={assetLinkForm.notes}
                  onChange={(e) =>
                    setAssetLinkForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Anything we should know about this asset?"
                />

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btnPrimary" type="submit">
                    Submit link
                  </button>
                </div>
              </form>

              {assetMsg ? <div className="smallNote" style={{ marginTop: 10, color: "#8ef0b1" }}>{assetMsg}</div> : null}
              {assetErr ? <div className="smallNote" style={{ marginTop: 10, color: "#ffb4b4" }}>{assetErr}</div> : null}
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Upload file</h2>
            </div>
            <div className="panelBody">
              <form onSubmit={submitAssetFile}>
                <div className="fieldLabel">Asset type</div>
                <select
                  className="select"
                  value={assetFileForm.assetType}
                  onChange={(e) =>
                    setAssetFileForm((p) => ({ ...p, assetType: e.target.value }))
                  }
                >
                  <option value="file">General file</option>
                  <option value="logo">Logo</option>
                  <option value="photo">Photo</option>
                  <option value="document">Document</option>
                  <option value="copy">Text file</option>
                </select>

                <div className="fieldLabel" style={{ marginTop: 10 }}>Label (optional)</div>
                <input
                  className="input"
                  value={assetFileForm.label}
                  onChange={(e) =>
                    setAssetFileForm((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Example: Main logo PNG"
                />

                <div className="fieldLabel" style={{ marginTop: 10 }}>File</div>
                <input
                  id="portal-file-input"
                  className="input"
                  type="file"
                  onChange={(e) =>
                    setAssetFileForm((p) => ({
                      ...p,
                      file: e.target.files?.[0] ?? null,
                    }))
                  }
                />

                <div className="fieldLabel" style={{ marginTop: 10 }}>Notes (optional)</div>
                <textarea
                  className="textarea"
                  value={assetFileForm.notes}
                  onChange={(e) =>
                    setAssetFileForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Any notes about this file?"
                />

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btnPrimary" type="submit">
                    Upload file
                  </button>
                </div>
              </form>

              <div className="smallNote" style={{ marginTop: 10 }}>
                Supported file size depends on your hosting/server limits. For large assets, use the link form with Google Drive/Dropbox.
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded assets list */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 18 }}>Submitted assets</h2>
          </div>
          <div className="panelBody">
            {loadingAssets ? (
              <p className="pDark">Loading assets…</p>
            ) : assets.length === 0 ? (
              <p className="pDark">No assets submitted yet.</p>
            ) : (
              <div className="row" style={{ flexDirection: "column" }}>
                {assets.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 900 }}>
                        {a.label || a.file_name || "Untitled asset"}
                      </div>
                      <div className="badge">{a.status || "new"}</div>
                    </div>
                    <div className="smallNote" style={{ marginTop: 6 }}>
                      {a.asset_type || "asset"} • {prettyDate(a.created_at)}
                    </div>

                    {a.url ? (
                      <div style={{ marginTop: 8 }}>
                        <a
                          className="btn btnGhost"
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open submitted link
                        </a>
                      </div>
                    ) : null}

                    {a.signed_url ? (
                      <div style={{ marginTop: 8 }}>
                        <a
                          className="btn btnGhost"
                          href={a.signed_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open uploaded file
                        </a>
                      </div>
                    ) : null}

                    {a.notes ? (
                      <div className="pDark" style={{ marginTop: 8 }}>
                        {a.notes}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revision requests */}
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Request a revision</h2>
            </div>
            <div className="panelBody">
              <form onSubmit={submitRevision}>
                <div className="grid2">
                  <div>
                    <div className="fieldLabel">Page/area</div>
                    <input
                      className="input"
                      value={revisionForm.page}
                      onChange={(e) =>
                        setRevisionForm((p) => ({ ...p, page: e.target.value }))
                      }
                      placeholder="Home page / Pricing / Contact form"
                    />
                  </div>

                  <div>
                    <div className="fieldLabel">Priority</div>
                    <select
                      className="select"
                      value={revisionForm.priority}
                      onChange={(e) =>
                        setRevisionForm((p) => ({ ...p, priority: e.target.value }))
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="fieldLabel" style={{ marginTop: 10 }}>Request type</div>
                <select
                  className="select"
                  value={revisionForm.requestType}
                  onChange={(e) =>
                    setRevisionForm((p) => ({ ...p, requestType: e.target.value }))
                  }
                >
                  <option value="change">Change</option>
                  <option value="content">Content update</option>
                  <option value="bug">Fix an issue</option>
                  <option value="design">Design adjustment</option>
                  <option value="new_feature">New feature request</option>
                </select>

                <div className="fieldLabel" style={{ marginTop: 10 }}>Details</div>
                <textarea
                  className="textarea"
                  value={revisionForm.message}
                  onChange={(e) =>
                    setRevisionForm((p) => ({ ...p, message: e.target.value }))
                  }
                  placeholder="Describe exactly what should be changed..."
                />

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btnPrimary" type="submit">
                    Submit revision
                  </button>
                </div>
              </form>

              {revMsg ? <div className="smallNote" style={{ marginTop: 10, color: "#8ef0b1" }}>{revMsg}</div> : null}
              {revErr ? <div className="smallNote" style={{ marginTop: 10, color: "#ffb4b4" }}>{revErr}</div> : null}
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Revision history</h2>
            </div>
            <div className="panelBody">
              {loadingRevisions ? (
                <p className="pDark">Loading revisions…</p>
              ) : revisions.length === 0 ? (
                <p className="pDark">No revision requests yet.</p>
              ) : (
                <div className="row" style={{ flexDirection: "column" }}>
                  {revisions.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 14,
                        padding: 12,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 900 }}>
                          {r.page || "General"} • {r.request_type || "change"}
                        </div>
                        <div className="badge">{r.status || "new"}</div>
                      </div>
                      <div className="smallNote" style={{ marginTop: 6 }}>
                        {r.priority || "normal"} priority • {prettyDate(r.created_at)}
                      </div>
                      <div className="pDark" style={{ marginTop: 8 }}>
                        {r.message || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional call request info */}
        {callRequest ? (
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 18 }}>Call request</h2>
            </div>
            <div className="panelBody">
              <div className="pDark"><strong>Status:</strong> {callRequest.status || "—"}</div>
              <div className="pDark">
                <strong>Best time:</strong>{" "}
                {callRequest.best_time_to_call || callRequest.preferred_times || "—"}
              </div>
              <div className="pDark"><strong>Timezone:</strong> {callRequest.timezone || "—"}</div>
              <div className="pDark"><strong>Notes:</strong> {callRequest.notes || "—"}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}