"use client";

import Link from "next/link";
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

type ScopeVersion = {
  id: string;
  createdAt: string;
  label: string;
  summary: string;
  tierLabel: string;
  platform: string;
  timeline: string;
  revisionPolicy: string;
  pagesIncluded: string[];
  featuresIncluded: string[];
  exclusions: string[];
};

type ChangeOrder = {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  priceImpact: string;
  timelineImpact: string;
  scopeImpact: string;
  status: string;
};

type PortalBundle = {
  quote: {
    id: string;
    publicToken: string;
    createdAt: string;
    status: string;
    tier: string;
    estimate: {
      target: number | null;
      min: number | null;
      max: number | null;
    };
    deposit: {
      status: string;
      paidAt: string | null;
      link: string | null;
      amount: number | null;
      notes: string | null;
    };
  };
  lead: {
    email: string | null;
    phone: string | null;
    name: string | null;
  };
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
  scopeSnapshot: {
    tierLabel: string;
    platform: string;
    pagesIncluded: string[];
    featuresIncluded: string[];
    timeline: string;
    revisionPolicy: string;
    exclusions: string[];
  };
  history: {
    scopeVersions: ScopeVersion[];
    changeOrders: ChangeOrder[];
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
    hours: {
      min: number | null;
      max: number | null;
    };
    timelineText: string | null;
    discoveryQuestions: string[];
  };
  preview: {
    url: string | null;
    productionUrl: string | null;
    status: string;
    updatedAt: string | null;
    notes: string | null;
    clientReviewStatus: string;
  };
  agreement: {
    status: string;
    model: string;
    ownershipModel: string;
    publishedAt: string | null;
    publishedText: string;
  };
  launch: {
    status: string;
    productionUrl: string | null;
    domainStatus: string;
    analyticsStatus: string;
    formsStatus: string;
    seoStatus: string;
    handoffStatus: string;
    notes: string | null;
  };
  portalState: {
    clientStatus: string;
    clientUpdatedAt: string | null;
    clientNotes: string;
    adminPublicNote: string | null;
    milestones: PortalMilestone[];
    assets: PortalAsset[];
    revisions: PortalRevision[];
    waitingOn: string;
  };
};

function money(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (
    ["active", "approved", "live", "paid", "closed_won", "kickoff_ready"].includes(
      s
    )
  ) {
    return {
      bg: "rgba(46, 160, 67, 0.14)",
      border: "rgba(46, 160, 67, 0.34)",
      color: "#b7f5c4",
      label: pretty(status),
    };
  }

  if (["proposal", "deposit", "reviewing", "evaluating", "pending"].includes(s)) {
    return {
      bg: "rgba(201, 168, 76, 0.14)",
      border: "rgba(201, 168, 76, 0.34)",
      color: "#f1d98a",
      label: pretty(status),
    };
  }

  return {
    bg: "rgba(141, 164, 255, 0.12)",
    border: "rgba(141, 164, 255, 0.28)",
    color: "#d8e0ff",
    label: pretty(status || "new"),
  };
}

function getCurrentPhase(bundle: PortalBundle) {
  const quoteStatus = String(bundle.quote.status || "").toLowerCase();
  const depositStatus = String(bundle.quote.deposit.status || "").toLowerCase();
  const assetsCount = bundle.portalState.assets.length;
  const previewStatus = String(bundle.preview.status || "").toLowerCase();
  const launchStatus = String(bundle.launch.status || "").toLowerCase();

  if (launchStatus === "live") return "Live";
  if (depositStatus === "paid") return "Kickoff Ready";
  if (previewStatus.includes("review")) return "Preview Review";
  if (quoteStatus === "active") return "Build In Progress";
  if (assetsCount > 0) return "Assets Submitted";
  if (["proposal", "deposit"].includes(quoteStatus)) return "Pre-Start";
  return "Intake / Estimate";
}

function getNextAction(bundle: PortalBundle) {
  const depositStatus = String(bundle.quote.deposit.status || "").toLowerCase();
  const revisions = bundle.portalState.revisions.length;
  const assetsCount = bundle.portalState.assets.length;

  if (depositStatus !== "paid" && bundle.quote.deposit.link) {
    return "Review deposit step";
  }
  if (bundle.preview.url && bundle.preview.clientReviewStatus === "Pending review") {
    return "Review current preview";
  }
  if (assetsCount === 0) {
    return "Upload content and assets";
  }
  if (revisions > 0) {
    return "Review revision queue";
  }
  return "Review project workspace";
}

export default function PortalClient({
  token,
  initialData,
}: {
  token: string;
  initialData: PortalBundle;
}) {
  const [bundle, setBundle] = useState<PortalBundle>(initialData);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [assetLabel, setAssetLabel] = useState("");
  const [assetCategory, setAssetCategory] = useState("Brand");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetNotes, setAssetNotes] = useState("");

  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionPriority, setRevisionPriority] = useState<"low" | "normal" | "high">(
    "normal"
  );

  const phase = useMemo(() => getCurrentPhase(bundle), [bundle]);
  const nextAction = useMemo(() => getNextAction(bundle), [bundle]);
  const quoteTone = useMemo(() => statusTone(bundle.quote.status), [bundle]);

  async function applyAction(body: any) {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update workspace.");
      }

      setBundle(json.data as PortalBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetLabel.trim() || !assetUrl.trim()) return;

    await applyAction({
      type: "asset_add",
      asset: {
        category: assetCategory,
        label: assetLabel.trim(),
        url: assetUrl.trim(),
        notes: assetNotes.trim(),
      },
    });

    setAssetLabel("");
    setAssetUrl("");
    setAssetNotes("");
  }

  async function submitRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!revisionMessage.trim()) return;

    await applyAction({
      type: "revision_add",
      revision: {
        message: revisionMessage.trim(),
        priority: revisionPriority,
      },
    });

    setRevisionMessage("");
    setRevisionPriority("normal");
  }

  return (
    <main className="container section" style={{ paddingBottom: 84 }}>
      <div className="heroFadeUp">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Website Project Studio
        </div>

        <div style={{ height: 12 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div>
            <h1 className="h1">{bundle.lead.name || "Website Project"}</h1>

            <p className="p" style={{ maxWidth: 860, marginTop: 12 }}>
              This is your website workspace. It shows what is being built,
              where the project stands, what we need from you, and what happens next.
            </p>

            <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: quoteTone.bg,
                  border: `1px solid ${quoteTone.border}`,
                  color: quoteTone.color,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {quoteTone.label}
              </span>

              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Project ID #{String(bundle.quote.id).slice(0, 8)}
              </span>

              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Created {fmtDate(bundle.quote.createdAt)}
              </span>
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Link href="/portal" className="btn btnGhost">
              Back to Portal
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 18,
            border: "1px solid rgba(255,0,0,0.35)",
            background: "rgba(255,0,0,0.08)",
            borderRadius: 14,
            padding: 14,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginTop: 26,
        }}
      >
        <MiniCard label="Current Phase" value={phase} />
        <MiniCard label="Next Action" value={nextAction} />
        <MiniCard label="Waiting On" value={bundle.portalState.waitingOn} />
        <MiniCard
          label="Target Investment"
          value={
            bundle.quote.estimate.target != null
              ? money(bundle.quote.estimate.target)
              : `${money(bundle.quote.estimate.min)} - ${money(bundle.quote.estimate.max)}`
          }
        />
      </section>

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.16fr) minmax(320px, 0.84fr)",
            gap: 16,
          }}
        >
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Overview</h2>
            </div>
            <div className="panelBody">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <InfoBlock label="Website Type" value={pretty(bundle.scope.websiteType)} />
                <InfoBlock label="Pages" value={pretty(bundle.scope.pages)} />
                <InfoBlock label="Timeline" value={pretty(bundle.scope.timeline)} />
                <InfoBlock label="Content Readiness" value={pretty(bundle.scope.contentReady)} />
                <InfoBlock label="Domain / Hosting" value={pretty(bundle.scope.domainHosting)} />
                <InfoBlock
                  label="Integrations"
                  value={
                    bundle.scope.integrations.length
                      ? bundle.scope.integrations.join(", ")
                      : "None listed yet"
                  }
                />
              </div>

              {bundle.scope.notes ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid var(--stroke)",
                    borderRadius: 14,
                    background: "var(--panel2)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      color: "var(--fg)",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    Intake Notes
                  </div>
                  <p className="p" style={{ margin: 0, fontSize: 14 }}>
                    {bundle.scope.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Project Health</h2>
            </div>
            <div className="panelBody" style={{ display: "grid", gap: 12 }}>
              <CompactStatus label="Workspace Status" value={pretty(bundle.portalState.clientStatus || "new")} />
              <CompactStatus label="Agreement Layer" value={bundle.agreement.status} />
              <CompactStatus label="Ownership Model" value={bundle.agreement.ownershipModel} />
              <CompactStatus label="Preview Review" value={bundle.preview.clientReviewStatus} />
              <CompactStatus label="Launch Status" value={bundle.launch.status} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Scope Snapshot</h2>
            </div>
            <div className="panelBody">
              <div style={{ display: "grid", gap: 12 }}>
                <InfoBlock label="Tier" value={bundle.scopeSnapshot.tierLabel} />
                <InfoBlock label="Platform" value={bundle.scopeSnapshot.platform} />
                <InfoBlock label="Timeline" value={bundle.scopeSnapshot.timeline} />
                <InfoBlock label="Revision Policy" value={bundle.scopeSnapshot.revisionPolicy} />
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                <ListBlock title="Pages Included" items={bundle.scopeSnapshot.pagesIncluded} />
                <ListBlock title="Features Included" items={bundle.scopeSnapshot.featuresIncluded} />
                <ListBlock title="Exclusions" items={bundle.scopeSnapshot.exclusions} />
              </div>
            </div>
          </div>

          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Agreement</h2>
            </div>
            <div className="panelBody">
              <div style={{ display: "grid", gap: 12 }}>
                <InfoBlock label="Agreement Status" value={bundle.agreement.status} />
                <InfoBlock label="Agreement Model" value={bundle.agreement.model} />
                <InfoBlock label="Ownership Model" value={bundle.agreement.ownershipModel} />
                <InfoBlock label="Published" value={fmtDate(bundle.agreement.publishedAt)} />
                <InfoBlock label="Deposit Status" value={pretty(bundle.quote.deposit.status)} />
                <InfoBlock label="Deposit Amount" value={money(bundle.quote.deposit.amount)} />
              </div>

              {bundle.quote.deposit.notes ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid var(--stroke)",
                    borderRadius: 14,
                    background: "var(--panel2)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      color: "var(--fg)",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    Deposit Notes
                  </div>
                  <p className="p" style={{ margin: 0, fontSize: 14 }}>
                    {bundle.quote.deposit.notes}
                  </p>
                </div>
              ) : null}

              {bundle.agreement.publishedText ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid var(--stroke)",
                    borderRadius: 14,
                    background: "var(--panel2)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      color: "var(--fg)",
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    Published Agreement
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 14,
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {bundle.agreement.publishedText}
                  </div>
                </div>
              ) : null}

              <div className="row" style={{ marginTop: 14 }}>
                {bundle.quote.deposit.link ? (
                  <a
                    href={bundle.quote.deposit.link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btnPrimary"
                  >
                    Open Deposit Link <span className="btnArrow">→</span>
                  </a>
                ) : (
                  <button className="btn btnGhost" type="button" disabled>
                    Deposit Link Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Preview & Review</h2>
            </div>
            <div className="panelBody">
              <div style={{ display: "grid", gap: 12 }}>
                <InfoBlock label="Preview Status" value={bundle.preview.status} />
                <InfoBlock label="Client Review Status" value={bundle.preview.clientReviewStatus} />
                <InfoBlock label="Latest Preview" value={bundle.preview.url || "Preview not published yet"} />
                <InfoBlock label="Production URL" value={bundle.preview.productionUrl || "Not live yet"} />
                <InfoBlock label="Last Updated" value={fmtDate(bundle.preview.updatedAt)} />
              </div>

              {bundle.preview.notes ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid var(--stroke)",
                    borderRadius: 14,
                    background: "var(--panel2)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      color: "var(--fg)",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    Preview Notes
                  </div>
                  <p className="p" style={{ margin: 0, fontSize: 14 }}>
                    {bundle.preview.notes}
                  </p>
                </div>
              ) : null}

              <div className="row" style={{ marginTop: 14 }}>
                {bundle.preview.url ? (
                  <a
                    href={bundle.preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btnPrimary"
                  >
                    Open Preview <span className="btnArrow">→</span>
                  </a>
                ) : (
                  <button className="btn btnGhost" type="button" disabled>
                    Preview Pending
                  </button>
                )}

                {bundle.preview.productionUrl ? (
                  <a
                    href={bundle.preview.productionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btnGhost"
                  >
                    Open Live Site
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Launch & Handoff</h2>
            </div>
            <div className="panelBody">
              <div style={{ display: "grid", gap: 12 }}>
                <InfoBlock label="Launch Status" value={bundle.launch.status} />
                <InfoBlock label="Domain" value={bundle.launch.domainStatus} />
                <InfoBlock label="Analytics" value={bundle.launch.analyticsStatus} />
                <InfoBlock label="Forms" value={bundle.launch.formsStatus} />
                <InfoBlock label="SEO Basics" value={bundle.launch.seoStatus} />
                <InfoBlock label="Handoff" value={bundle.launch.handoffStatus} />
              </div>

              {bundle.launch.notes ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid var(--stroke)",
                    borderRadius: 14,
                    background: "var(--panel2)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      color: "var(--fg)",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    Launch Notes
                  </div>
                  <p className="p" style={{ margin: 0, fontSize: 14 }}>
                    {bundle.launch.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="panel fadeUp">
          <div className="panelHeader">
            <h2 className="h2">Scope History & Change Orders</h2>
          </div>
          <div className="panelBody">
            <div style={{ display: "grid", gap: 12 }}>
              {bundle.history.scopeVersions.length === 0 ? (
                <InfoBlock label="Scope History" value="No saved scope versions yet." />
              ) : (
                <ListBlock
                  title="Saved Scope Versions"
                  items={bundle.history.scopeVersions.map(
                    (item) => `${item.label} — ${fmtDate(item.createdAt)}`
                  )}
                />
              )}

              {bundle.history.changeOrders.length === 0 ? (
                <InfoBlock label="Change Orders" value="No change orders have been logged yet." />
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {bundle.history.changeOrders.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid var(--stroke)",
                        borderRadius: 14,
                        background: "var(--panel2)",
                        padding: 14,
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{item.title}</div>
                      <div className="smallNote" style={{ marginTop: 4 }}>
                        {fmtDate(item.createdAt)} • {pretty(item.status)}
                      </div>
                      <p className="p" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
                        {item.summary}
                      </p>
                      {(item.priceImpact || item.timelineImpact || item.scopeImpact) && (
                        <div className="smallNote" style={{ marginTop: 8 }}>
                          {item.priceImpact ? `Price: ${item.priceImpact}` : ""}
                          {item.priceImpact && item.timelineImpact ? " • " : ""}
                          {item.timelineImpact ? `Timeline: ${item.timelineImpact}` : ""}
                          {(item.priceImpact || item.timelineImpact) && item.scopeImpact
                            ? " • "
                            : ""}
                          {item.scopeImpact ? `Scope: ${item.scopeImpact}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Content & Assets</h2>
            </div>
            <div className="panelBody">
              <form onSubmit={submitAsset} style={{ display: "grid", gap: 12 }}>
                <div className="fieldLabel">Asset label</div>
                <input
                  className="input"
                  value={assetLabel}
                  onChange={(e) => setAssetLabel(e.target.value)}
                  placeholder="Homepage copy, logo file, service photos..."
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 180px) minmax(0, 1fr)",
                    gap: 12,
                  }}
                >
                  <div>
                    <div className="fieldLabel">Category</div>
                    <select
                      className="select"
                      value={assetCategory}
                      onChange={(e) => setAssetCategory(e.target.value)}
                    >
                      <option>Brand</option>
                      <option>Copy</option>
                      <option>Images</option>
                      <option>Access</option>
                      <option>Legal</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <div className="fieldLabel">URL</div>
                    <input
                      className="input"
                      value={assetUrl}
                      onChange={(e) => setAssetUrl(e.target.value)}
                      placeholder="Google Drive / Dropbox / direct file link"
                    />
                  </div>
                </div>

                <div className="fieldLabel">Notes</div>
                <textarea
                  className="textarea"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  placeholder="Anything we should know about this asset?"
                />

                <div className="row">
                  <button type="submit" className="btn btnPrimary" disabled={saving}>
                    {saving ? "Saving..." : "Submit Asset"} <span className="btnArrow">→</span>
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                {bundle.portalState.assets.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed var(--stroke)",
                      borderRadius: 14,
                      padding: 14,
                      color: "var(--muted)",
                    }}
                  >
                    No assets submitted yet.
                  </div>
                ) : (
                  bundle.portalState.assets.map((asset) => (
                    <div
                      key={asset.id}
                      style={{
                        border: "1px solid var(--stroke)",
                        borderRadius: 14,
                        background: "var(--panel2)",
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--fg)",
                            fontWeight: 800,
                            fontSize: 16,
                          }}
                        >
                          {asset.label}
                        </div>
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid var(--stroke)",
                            background: "rgba(255,255,255,0.03)",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "var(--fg)",
                          }}
                        >
                          {pretty(asset.status)}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          color: "var(--muted)",
                          fontSize: 13,
                        }}
                      >
                        {asset.category} • {fmtDate(asset.createdAt)}
                      </div>

                      {asset.notes ? (
                        <p className="p" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
                          {asset.notes}
                        </p>
                      ) : null}

                      <div className="row" style={{ marginTop: 10 }}>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btnGhost"
                        >
                          Open Asset
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Timeline</h2>
            </div>
            <div className="panelBody" style={{ display: "grid", gap: 10 }}>
              {bundle.portalState.milestones.map((m) => (
                <div
                  key={m.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "16px minmax(0, 1fr) auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 0",
                    borderTop: "1px solid var(--stroke)",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: m.done ? "var(--accent)" : "transparent",
                      border: `2px solid ${m.done ? "var(--accent)" : "var(--stroke2)"}`,
                      boxShadow: m.done
                        ? "0 0 0 4px rgba(201,168,76,0.12)"
                        : "none",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        color: "var(--fg)",
                        fontWeight: 800,
                        fontSize: 15,
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {m.updatedAt ? `Updated ${fmtDate(m.updatedAt)}` : "Waiting"}
                    </div>
                  </div>
                  <div
                    style={{
                      color: m.done ? "#b7f5c4" : "var(--muted)",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {m.done ? "Done" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Revisions & Feedback</h2>
            </div>
            <div className="panelBody">
              <form onSubmit={submitRevision} style={{ display: "grid", gap: 12 }}>
                <div className="fieldLabel">Request a revision or leave feedback</div>
                <textarea
                  className="textarea"
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  placeholder="Tell us what should change, what feels off, or what needs attention."
                />

                <div style={{ maxWidth: 220 }}>
                  <div className="fieldLabel">Priority</div>
                  <select
                    className="select"
                    value={revisionPriority}
                    onChange={(e) =>
                      setRevisionPriority(e.target.value as "low" | "normal" | "high")
                    }
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="row">
                  <button type="submit" className="btn btnPrimary" disabled={saving}>
                    {saving ? "Saving..." : "Submit Feedback"} <span className="btnArrow">→</span>
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                {bundle.portalState.revisions.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed var(--stroke)",
                      borderRadius: 14,
                      padding: 14,
                      color: "var(--muted)",
                    }}
                  >
                    No revision requests yet.
                  </div>
                ) : (
                  bundle.portalState.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        border: "1px solid var(--stroke)",
                        borderRadius: 14,
                        background: "var(--panel2)",
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--fg)",
                            fontWeight: 800,
                            fontSize: 15,
                          }}
                        >
                          {pretty(rev.status)}
                        </div>
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid var(--stroke)",
                            background: "rgba(255,255,255,0.03)",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "var(--fg)",
                          }}
                        >
                          {pretty(rev.priority)}
                        </span>
                      </div>

                      <p className="p" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
                        {rev.message}
                      </p>

                      <div
                        style={{
                          marginTop: 8,
                          color: "var(--muted)",
                          fontSize: 12,
                        }}
                      >
                        Submitted {fmtDate(rev.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Public Notes</h2>
            </div>
            <div className="panelBody" style={{ display: "grid", gap: 12 }}>
              <InfoBlock label="Admin Note" value={bundle.portalState.adminPublicNote || "No public update yet"} />
              <InfoBlock label="Client Notes" value={bundle.portalState.clientNotes || "No client notes yet"} />
              <InfoBlock
                label="Best Time to Call"
                value={
                  bundle.callRequest?.bestTime
                    ? `${bundle.callRequest.bestTime}${bundle.callRequest.timezone ? ` (${bundle.callRequest.timezone})` : ""}`
                    : "Not provided"
                }
              />
              <InfoBlock label="PIE Summary" value={bundle.pie.summary || "No PIE summary yet"} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div
          style={{
            color: "var(--muted)",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: "var(--fg)",
            fontWeight: 900,
            fontSize: 22,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--stroke)",
        borderRadius: 14,
        background: "var(--panel2)",
        padding: 14,
      }}
    >
      <div
        style={{
          color: "var(--muted)",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "var(--fg)",
          fontWeight: 800,
          fontSize: 15,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CompactStatus({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--stroke)",
        borderRadius: 14,
        background: "var(--panel2)",
        padding: 14,
      }}
    >
      <div
        style={{
          color: "var(--muted)",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "var(--fg)",
          fontWeight: 800,
          fontSize: 15,
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: "1px solid var(--stroke)",
        borderRadius: 14,
        background: "var(--panel2)",
        padding: 14,
      }}
    >
      <div
        style={{
          color: "var(--fg)",
          fontWeight: 800,
          fontSize: 15,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      {items.length === 0 ? (
        <div className="p" style={{ margin: 0, fontSize: 14 }}>
          None listed yet.
        </div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}