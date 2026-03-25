"use client";

import Link from "next/link";
import { useState } from "react";

type Milestone = {
  key: string;
  label: string;
  done: boolean;
  updatedAt?: string | null;
};

type ClientAsset = {
  id: string;
  category: string;
  label: string;
  url: string;
  notes?: string;
  status: string;
  createdAt: string;
};

type ClientRevision = {
  id: string;
  message: string;
  priority: string;
  status: string;
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

type ProjectControlData = {
  quoteId: string;
  publicToken: string;
  workspaceUrl: string;
  createdAt: string;
  status: string;
  tier: string;
  leadName: string;
  leadEmail: string;
  estimate: {
    target: number;
    min: number;
    max: number;
  };
  pie: {
    exists: boolean;
    score: number | null;
    tier: string | null;
    summary: string;
  };
  callRequest: {
    status: string;
    bestTime: string;
    timezone: string;
    notes: string;
  } | null;
  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };
  scopeSnapshot: {
    tierLabel: string;
    platform: string;
    timeline: string;
    revisionPolicy: string;
    pagesIncluded: string[];
    featuresIncluded: string[];
    exclusions: string[];
  };
  portalAdmin: {
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
    launchStatus: string;
    domainStatus: string;
    analyticsStatus: string;
    formsStatus: string;
    seoStatus: string;
    handoffStatus: string;
    launchNotes: string;
  };
  portalStateAdmin: {
    clientStatus: string;
    clientNotes: string;
    adminPublicNote: string;
    depositAmount: number;
    depositNotes: string;
    milestones: Milestone[];
  };
  clientSync: {
    lastClientUpdate: string;
    assets: ClientAsset[];
    revisions: ClientRevision[];
  };
  workspaceHistory: {
    scopeVersions: ScopeVersion[];
    changeOrders: ChangeOrder[];
  };
  proposalText: string;
  preContractDraft: string;
  publishedAgreementText: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function fmtDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function listToText(values: string[]) {
  return values.join("\n");
}

function textToList(value: string) {
  return value
    .split(/\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function isReadyState(value?: string | null) {
  const v = String(value || "").toLowerCase();
  return v === "ready" || v === "complete";
}

function isAgreementPublished(input: {
  agreementStatus: string;
  publishedAgreementText: string;
}) {
  const status = String(input.agreementStatus || "").toLowerCase();
  return (
    !!input.publishedAgreementText.trim() ||
    status === "published to client" ||
    status === "signed" ||
    status === "kickoff ready"
  );
}

function computeLaunchReadiness(data: ProjectControlData) {
  const checks = [
    {
      key: "agreement",
      label: "Agreement published",
      done: isAgreementPublished({
        agreementStatus: data.portalAdmin.agreementStatus,
        publishedAgreementText: data.publishedAgreementText,
      }),
    },
    {
      key: "preview",
      label: "Preview published",
      done: !!data.portalAdmin.previewUrl.trim(),
    },
    {
      key: "domain",
      label: "Domain ready",
      done: isReadyState(data.portalAdmin.domainStatus),
    },
    {
      key: "analytics",
      label: "Analytics ready",
      done: isReadyState(data.portalAdmin.analyticsStatus),
    },
    {
      key: "forms",
      label: "Forms ready",
      done: isReadyState(data.portalAdmin.formsStatus),
    },
    {
      key: "seo",
      label: "SEO basics ready",
      done: isReadyState(data.portalAdmin.seoStatus),
    },
    {
      key: "handoff",
      label: "Handoff ready",
      done: isReadyState(data.portalAdmin.handoffStatus),
    },
  ];

  const completed = checks.filter((item) => item.done).length;
  const percent = Math.round((completed / checks.length) * 100);
  const blockers = checks.filter((item) => !item.done).map((item) => item.label);

  return {
    checks,
    completed,
    percent,
    blockers,
    canMarkLaunchReady: percent === 100,
    canMarkLive: percent === 100 && !!data.portalAdmin.productionUrl.trim(),
  };
}

function setMilestoneDone(
  milestones: Milestone[],
  key: string,
  label: string,
  done: boolean
): Milestone[] {
  const now = new Date().toISOString();
  const found = milestones.some((m) => m.key === key);

  if (!found) {
    return [...milestones, { key, label, done, updatedAt: now }];
  }

  return milestones.map((m) =>
    m.key === key ? { ...m, label: m.label || label, done, updatedAt: now } : m
  );
}

export default function ProjectControlClient({
  initialData,
}: {
  initialData: ProjectControlData;
}) {
  const [data, setData] = useState<ProjectControlData>(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [newChangeOrder, setNewChangeOrder] = useState({
    title: "",
    summary: "",
    priceImpact: "",
    timelineImpact: "",
    scopeImpact: "",
    status: "draft",
  });

  const readiness = computeLaunchReadiness(data);

  async function savePatch(payload: Record<string, any>, successMessage: string) {
    setBusy(true);
    setMessage("Saving...");
    setMessageIsError(false);

    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: data.quoteId,
          ...payload,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to save changes.");
      }

      setMessageIsError(false);
      setMessage(successMessage);
    } catch (err) {
      setMessageIsError(true);
      setMessage(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function generatePreContract() {
    setBusy(true);
    setMessage("Generating pre-contract draft...");
    setMessageIsError(false);

    try {
      const res = await fetch("/api/internal/admin/pre-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: data.quoteId,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to generate pre-contract draft.");
      }

      setData((prev) => ({
        ...prev,
        preContractDraft: String(json.draft || ""),
      }));
      setMessageIsError(false);
      setMessage("Pre-contract draft generated.");
    } catch (err) {
      setMessageIsError(true);
      setMessage(
        err instanceof Error ? err.message : "Failed to generate pre-contract draft."
      );
    } finally {
      setBusy(false);
    }
  }

  function copyDraftToPublishedAgreement() {
    if (!data.preContractDraft.trim()) {
      setMessageIsError(true);
      setMessage("Generate or write a pre-contract draft first.");
      return;
    }

    setData((prev) => ({
      ...prev,
      publishedAgreementText: prev.preContractDraft,
    }));
    setMessageIsError(false);
    setMessage("Pre-contract copied into published agreement.");
  }

  function requestPublishAgreement() {
    if (!data.publishedAgreementText.trim()) {
      setMessageIsError(true);
      setMessage("Add published agreement text first.");
      return;
    }

    setConfirmAction({
      title: "Publish Agreement to Client",
      description:
        "This will make the agreement visible in the client workspace. The client will be able to see the full agreement text immediately.",
      onConfirm: executePublishAgreement,
    });
  }

  async function executePublishAgreement() {
    setConfirmAction(null);

    const nextPortalAdmin = {
      ...data.portalAdmin,
      agreementStatus: "Published to client",
      agreementPublishedAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      portalAdmin: nextPortalAdmin,
    }));

    await savePatch(
      {
        publishedAgreementText: data.publishedAgreementText,
        portalAdmin: nextPortalAdmin,
        _event: "agreement_published",
      },
      "Agreement published to client."
    );
  }

  function requestMarkLaunchReady() {
    if (!readiness.canMarkLaunchReady) {
      setMessageIsError(true);
      setMessage("Complete all launch readiness items first.");
      return;
    }

    setConfirmAction({
      title: "Mark Ready for Launch",
      description:
        "This will update the client workspace to show the project is ready for launch. Build and review milestones will be marked complete.",
      onConfirm: executeMarkLaunchReady,
    });
  }

  async function executeMarkLaunchReady() {
    setConfirmAction(null);

    const nextPortalAdmin = {
      ...data.portalAdmin,
      launchStatus: "Ready for launch",
    };

    let nextMilestones = [...data.portalStateAdmin.milestones];
    nextMilestones = setMilestoneDone(
      nextMilestones,
      "build_in_progress",
      "Build in progress",
      true
    );
    nextMilestones = setMilestoneDone(
      nextMilestones,
      "review_round",
      "Review / revisions",
      true
    );

    const nextPortalStateAdmin = {
      ...data.portalStateAdmin,
      clientStatus: "launch_ready",
      milestones: nextMilestones,
    };

    setData((prev) => ({
      ...prev,
      portalAdmin: nextPortalAdmin,
      portalStateAdmin: nextPortalStateAdmin,
    }));

    await savePatch(
      {
        portalAdmin: nextPortalAdmin,
        portalStateAdmin: nextPortalStateAdmin,
        _event: "launch_ready",
      },
      "Launch status marked ready."
    );
  }

  function requestMarkLive() {
    if (!readiness.canMarkLive) {
      setMessageIsError(true);
      setMessage("Add a production URL and complete all launch items first.");
      return;
    }

    setConfirmAction({
      title: "Mark Project Live",
      description:
        "This will mark the website as live. The client workspace will update to show the project is launched. This is the final lifecycle step.",
      onConfirm: executeMarkLive,
    });
  }

  async function executeMarkLive() {
    setConfirmAction(null);

    const nextPortalAdmin = {
      ...data.portalAdmin,
      launchStatus: "Live",
      previewStatus: "Live",
      clientReviewStatus: "Live",
    };

    let nextMilestones = [...data.portalStateAdmin.milestones];
    nextMilestones = setMilestoneDone(
      nextMilestones,
      "build_in_progress",
      "Build in progress",
      true
    );
    nextMilestones = setMilestoneDone(
      nextMilestones,
      "review_round",
      "Review / revisions",
      true
    );
    nextMilestones = setMilestoneDone(
      nextMilestones,
      "launch",
      "Launch completed",
      true
    );

    const nextPortalStateAdmin = {
      ...data.portalStateAdmin,
      clientStatus: "live",
      milestones: nextMilestones,
    };

    setData((prev) => ({
      ...prev,
      portalAdmin: nextPortalAdmin,
      portalStateAdmin: nextPortalStateAdmin,
    }));

    await savePatch(
      {
        portalAdmin: nextPortalAdmin,
        portalStateAdmin: nextPortalStateAdmin,
        _event: "site_live",
      },
      "Project marked live."
    );
  }

  async function unpublishAgreement() {
    const nextPortalAdmin = {
      ...data.portalAdmin,
      agreementStatus: "Pre-draft / agreement stage",
      agreementPublishedAt: "",
    };

    setData((prev) => ({
      ...prev,
      portalAdmin: nextPortalAdmin,
      publishedAgreementText: "",
    }));

    await savePatch(
      {
        publishedAgreementText: "",
        portalAdmin: nextPortalAdmin,
      },
      "Agreement unpublished. Client can no longer see agreement text."
    );
  }

  async function revertLaunchStatus(targetStatus: string, targetClientStatus: string) {
    const nextPortalAdmin = {
      ...data.portalAdmin,
      launchStatus: targetStatus,
      previewStatus: targetStatus === "Not ready" ? "Awaiting published preview" : data.portalAdmin.previewStatus,
      clientReviewStatus: targetStatus === "Not ready" ? "Preview pending" : data.portalAdmin.clientReviewStatus,
    };

    let nextMilestones = [...data.portalStateAdmin.milestones];
    if (targetStatus !== "Live") {
      nextMilestones = setMilestoneDone(nextMilestones, "launch", "Launch completed", false);
    }

    const nextPortalStateAdmin = {
      ...data.portalStateAdmin,
      clientStatus: targetClientStatus,
      milestones: nextMilestones,
    };

    setData((prev) => ({
      ...prev,
      portalAdmin: nextPortalAdmin,
      portalStateAdmin: nextPortalStateAdmin,
    }));

    await savePatch(
      {
        portalAdmin: nextPortalAdmin,
        portalStateAdmin: nextPortalStateAdmin,
      },
      `Launch status reverted to "${targetStatus}".`
    );
  }

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

  const launchStatusOptions = [
    "Not ready",
    "Pre-launch",
    "Ready for launch",
    "Live",
  ];

  const readinessOptions = ["Pending", "In progress", "Ready", "Complete"];

  const statusOptions = [
    "new",
    "call_requested",
    "call",
    "proposal",
    "deposit",
    "active",
    "closed_won",
  ];

  const workspaceStatusOptions = [
    "new",
    "intake_review",
    "content_submitted",
    "preview_ready",
    "revision_requested",
    "launch_ready",
    "live",
  ];

  const assetStatusOptions = ["submitted", "received", "approved"];
  const revisionStatusOptions = ["new", "reviewed", "scheduled", "done"];
  const changeOrderStatusOptions = ["draft", "sent", "approved", "declined"];

  function toggleMilestone(key: string) {
    setData((prev) => ({
      ...prev,
      portalStateAdmin: {
        ...prev.portalStateAdmin,
        milestones: prev.portalStateAdmin.milestones.map((m) =>
          m.key === key ? { ...m, done: !m.done } : m
        ),
      },
    }));
  }

  function updateAssetStatus(id: string, status: string) {
    setData((prev) => ({
      ...prev,
      clientSync: {
        ...prev.clientSync,
        assets: prev.clientSync.assets.map((asset) =>
          asset.id === id ? { ...asset, status } : asset
        ),
      },
    }));
  }

  function updateRevisionStatus(id: string, status: string) {
    setData((prev) => ({
      ...prev,
      clientSync: {
        ...prev.clientSync,
        revisions: prev.clientSync.revisions.map((rev) =>
          rev.id === id ? { ...rev, status } : rev
        ),
      },
    }));
  }

  function captureScopeVersion() {
    const nextVersion: ScopeVersion = {
      id: `scope-${Date.now()}`,
      createdAt: new Date().toISOString(),
      label: `${data.scopeSnapshot.tierLabel || "Scope"} snapshot`,
      summary: `${data.scopeSnapshot.pagesIncluded.length} pages • ${data.scopeSnapshot.featuresIncluded.length} features`,
      tierLabel: data.scopeSnapshot.tierLabel,
      platform: data.scopeSnapshot.platform,
      timeline: data.scopeSnapshot.timeline,
      revisionPolicy: data.scopeSnapshot.revisionPolicy,
      pagesIncluded: [...data.scopeSnapshot.pagesIncluded],
      featuresIncluded: [...data.scopeSnapshot.featuresIncluded],
      exclusions: [...data.scopeSnapshot.exclusions],
    };

    setData((prev) => ({
      ...prev,
      workspaceHistory: {
        ...prev.workspaceHistory,
        scopeVersions: [nextVersion, ...prev.workspaceHistory.scopeVersions],
      },
    }));
    setMessageIsError(false);
    setMessage("Current scope captured locally. Save history to persist it.");
  }

  function addChangeOrder() {
    if (!newChangeOrder.title.trim() || !newChangeOrder.summary.trim()) {
      setMessageIsError(true);
      setMessage("Add at least a change-order title and summary.");
      return;
    }

    const nextItem: ChangeOrder = {
      id: `co-${Date.now()}`,
      createdAt: new Date().toISOString(),
      title: newChangeOrder.title.trim(),
      summary: newChangeOrder.summary.trim(),
      priceImpact: newChangeOrder.priceImpact.trim(),
      timelineImpact: newChangeOrder.timelineImpact.trim(),
      scopeImpact: newChangeOrder.scopeImpact.trim(),
      status: newChangeOrder.status,
    };

    setData((prev) => ({
      ...prev,
      workspaceHistory: {
        ...prev.workspaceHistory,
        changeOrders: [nextItem, ...prev.workspaceHistory.changeOrders],
      },
    }));

    setNewChangeOrder({
      title: "",
      summary: "",
      priceImpact: "",
      timelineImpact: "",
      scopeImpact: "",
      status: "draft",
    });
    setMessageIsError(false);
    setMessage("Change order added locally. Save history to persist it.");
  }

  function updateChangeOrderStatus(id: string, status: string) {
    setData((prev) => ({
      ...prev,
      workspaceHistory: {
        ...prev.workspaceHistory,
        changeOrders: prev.workspaceHistory.changeOrders.map((item) =>
          item.id === id ? { ...item, status } : item
        ),
      },
    }));
  }

  return (
    <main className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div className="kicker">
                <span className="kickerDot" />
                Project Control
              </div>
              <h1 className="h2" style={{ marginTop: 10 }}>
                {data.leadName}
              </h1>
              <p className="pDark" style={{ marginTop: 6 }}>
                {data.leadEmail}
              </p>
              <p className="pDark" style={{ marginTop: 6 }}>
                Quote ID <code>{data.quoteId}</code> • Created {fmtDate(data.createdAt)}
              </p>
            </div>

            <div className="row">
              <Link href="/internal/admin" className="btn btnGhost">
                Back to Pipeline
              </Link>
              {data.workspaceUrl ? (
                <Link href={data.workspaceUrl} className="btn btnPrimary">
                  Open Client Workspace →
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid4" style={{ marginTop: 18 }}>
            <StatCard label="Status" value={data.status} />
            <StatCard label="Tier" value={data.tier} />
            <StatCard label="Target" value={money(data.estimate.target)} />
            <StatCard
              label="PIE"
              value={
                data.pie.exists
                  ? data.pie.score != null
                    ? `Score ${data.pie.score}`
                    : "Ready"
                  : "Missing"
              }
            />
          </div>

          {message ? (
            <div
              style={{
                marginTop: 14,
                color: messageIsError ? "#ff6b6b" : "#b7f5c4",
                fontWeight: 800,
              }}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Scope Snapshot</div>
            <div className="smallNote">
              This becomes the client-facing source of truth for what is included.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <label>
                <div className="fieldLabel">Tier label</div>
                <input
                  className="input"
                  value={data.scopeSnapshot.tierLabel}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      scopeSnapshot: {
                        ...prev.scopeSnapshot,
                        tierLabel: e.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Platform</div>
                <input
                  className="input"
                  value={data.scopeSnapshot.platform}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      scopeSnapshot: {
                        ...prev.scopeSnapshot,
                        platform: e.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Timeline</div>
                <input
                  className="input"
                  value={data.scopeSnapshot.timeline}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      scopeSnapshot: {
                        ...prev.scopeSnapshot,
                        timeline: e.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Revision policy</div>
                <input
                  className="input"
                  value={data.scopeSnapshot.revisionPolicy}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      scopeSnapshot: {
                        ...prev.scopeSnapshot,
                        revisionPolicy: e.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Pages included</div>
              <textarea
                className="textarea"
                rows={5}
                value={listToText(data.scopeSnapshot.pagesIncluded)}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    scopeSnapshot: {
                      ...prev.scopeSnapshot,
                      pagesIncluded: textToList(e.target.value),
                    },
                  }))
                }
                placeholder="Homepage&#10;About&#10;Services&#10;Contact"
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Features included</div>
              <textarea
                className="textarea"
                rows={5}
                value={listToText(data.scopeSnapshot.featuresIncluded)}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    scopeSnapshot: {
                      ...prev.scopeSnapshot,
                      featuresIncluded: textToList(e.target.value),
                    },
                  }))
                }
                placeholder="Contact form&#10;CMS&#10;Booking flow"
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Exclusions</div>
              <textarea
                className="textarea"
                rows={5}
                value={listToText(data.scopeSnapshot.exclusions)}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    scopeSnapshot: {
                      ...prev.scopeSnapshot,
                      exclusions: textToList(e.target.value),
                    },
                  }))
                }
                placeholder="Copywriting beyond provided draft&#10;Third-party fees"
              />
            </label>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    { scopeSnapshot: data.scopeSnapshot },
                    "Scope Snapshot saved."
                  )
                }
              >
                Save Scope Snapshot →
              </button>

              <button
                className="btn btnGhost"
                disabled={busy}
                onClick={captureScopeVersion}
              >
                Capture Scope Version
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>Workspace Publishing</div>
            <div className="smallNote">
              Control preview, agreement, ownership, launch, and handoff from one place.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <label>
                <div className="fieldLabel">Preview URL</div>
                <input
                  className="input"
                  value={data.portalAdmin.previewUrl}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        previewUrl: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://project-branch.vercel.app"
                />
              </label>

              <label>
                <div className="fieldLabel">Production URL</div>
                <input
                  className="input"
                  value={data.portalAdmin.productionUrl}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        productionUrl: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://clientsite.com"
                />
              </label>

              <label>
                <div className="fieldLabel">Preview status</div>
                <select
                  className="select"
                  value={data.portalAdmin.previewStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        previewStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {previewStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Client review status</div>
                <select
                  className="select"
                  value={data.portalAdmin.clientReviewStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        clientReviewStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {reviewStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Agreement status</div>
                <select
                  className="select"
                  value={data.portalAdmin.agreementStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        agreementStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {agreementStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Agreement model</div>
                <input
                  className="input"
                  value={data.portalAdmin.agreementModel}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        agreementModel: e.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Ownership model</div>
                <select
                  className="select"
                  value={data.portalAdmin.ownershipModel}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        ownershipModel: e.target.value,
                      },
                    }))
                  }
                >
                  {ownershipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Agreement published at</div>
                <input
                  className="input"
                  value={data.portalAdmin.agreementPublishedAt}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        agreementPublishedAt: e.target.value,
                      },
                    }))
                  }
                  placeholder="2026-03-13T14:30:00.000Z"
                />
              </label>

              <label>
                <div className="fieldLabel">Launch status</div>
                <select
                  className="select"
                  value={data.portalAdmin.launchStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        launchStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {launchStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Domain</div>
                <select
                  className="select"
                  value={data.portalAdmin.domainStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        domainStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {readinessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Analytics</div>
                <select
                  className="select"
                  value={data.portalAdmin.analyticsStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        analyticsStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {readinessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Forms</div>
                <select
                  className="select"
                  value={data.portalAdmin.formsStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        formsStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {readinessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">SEO basics</div>
                <select
                  className="select"
                  value={data.portalAdmin.seoStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        seoStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {readinessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Handoff</div>
                <select
                  className="select"
                  value={data.portalAdmin.handoffStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalAdmin: {
                        ...prev.portalAdmin,
                        handoffStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {readinessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Preview notes</div>
              <textarea
                className="textarea"
                rows={5}
                value={data.portalAdmin.previewNotes}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    portalAdmin: {
                      ...prev.portalAdmin,
                      previewNotes: e.target.value,
                    },
                  }))
                }
                placeholder="What changed in this preview? What should the client review?"
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Launch notes</div>
              <textarea
                className="textarea"
                rows={5}
                value={data.portalAdmin.launchNotes}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    portalAdmin: {
                      ...prev.portalAdmin,
                      launchNotes: e.target.value,
                    },
                  }))
                }
                placeholder="Domain, analytics, forms, SEO, launch readiness, or handoff notes..."
              />
            </label>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    { portalAdmin: data.portalAdmin },
                    "Workspace publishing updated."
                  )
                }
              >
                Save Workspace Publishing →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Workspace State & Timeline</div>
            <div className="smallNote">
              Control what the client workspace shows for status, notes, and milestones.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <label>
                <div className="fieldLabel">Quote status</div>
                <select
                  className="select"
                  value={data.status}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Workspace status</div>
                <select
                  className="select"
                  value={data.portalStateAdmin.clientStatus}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalStateAdmin: {
                        ...prev.portalStateAdmin,
                        clientStatus: e.target.value,
                      },
                    }))
                  }
                >
                  {workspaceStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div className="fieldLabel">Deposit amount</div>
                <input
                  className="input"
                  type="number"
                  value={data.portalStateAdmin.depositAmount}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      portalStateAdmin: {
                        ...prev.portalStateAdmin,
                        depositAmount: Number(e.target.value || 0),
                      },
                    }))
                  }
                />
              </label>
            </div>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Client notes</div>
              <textarea
                className="textarea"
                rows={5}
                value={data.portalStateAdmin.clientNotes}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    portalStateAdmin: {
                      ...prev.portalStateAdmin,
                      clientNotes: e.target.value,
                    },
                  }))
                }
                placeholder="Internal client-specific notes that can surface in the workspace."
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Admin public note</div>
              <textarea
                className="textarea"
                rows={6}
                value={data.portalStateAdmin.adminPublicNote}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    portalStateAdmin: {
                      ...prev.portalStateAdmin,
                      adminPublicNote: e.target.value,
                    },
                  }))
                }
                placeholder="Client-facing update that appears inside the workspace."
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Deposit notes</div>
              <textarea
                className="textarea"
                rows={5}
                value={data.portalStateAdmin.depositNotes}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    portalStateAdmin: {
                      ...prev.portalStateAdmin,
                      depositNotes: e.target.value,
                    },
                  }))
                }
                placeholder="Anything the client should know about deposit timing or payment."
              />
            </label>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Timeline milestones</div>
              <div style={{ display: "grid", gap: 10 }}>
                {data.portalStateAdmin.milestones.map((milestone) => (
                  <label
                    key={milestone.key}
                    className="checkLine"
                    style={{
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div className="checkLeft" style={{ alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={milestone.done}
                        onChange={() => toggleMilestone(milestone.key)}
                      />
                      <div>
                        <div className="checkLabel" style={{ whiteSpace: "normal" }}>
                          {milestone.label}
                        </div>
                        <div className="checkHint">
                          {milestone.updatedAt
                            ? `Updated ${fmtDate(milestone.updatedAt)}`
                            : "Not updated yet"}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    {
                      status: data.status,
                      portalStateAdmin: data.portalStateAdmin,
                    },
                    "Workspace state updated."
                  )
                }
              >
                Save Workspace State →
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>Pricing & Proposal</div>
            <div className="smallNote">
              Internal pricing controls and proposal draft for this one project.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <label>
                <div className="fieldLabel">Discount %</div>
                <input
                  className="input"
                  type="number"
                  value={data.adminPricing.discountPercent}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      adminPricing: {
                        ...prev.adminPricing,
                        discountPercent: Number(e.target.value || 0),
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Flat adjustment</div>
                <input
                  className="input"
                  type="number"
                  value={data.adminPricing.flatAdjustment}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      adminPricing: {
                        ...prev.adminPricing,
                        flatAdjustment: Number(e.target.value || 0),
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Hourly rate</div>
                <input
                  className="input"
                  type="number"
                  value={data.adminPricing.hourlyRate}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      adminPricing: {
                        ...prev.adminPricing,
                        hourlyRate: Number(e.target.value || 40),
                      },
                    }))
                  }
                />
              </label>

              <label>
                <div className="fieldLabel">Adjusted target</div>
                <input
                  className="input"
                  value={money(
                    Math.round(
                      data.estimate.target *
                        (1 - data.adminPricing.discountPercent / 100)
                    ) + data.adminPricing.flatAdjustment
                  )}
                  disabled
                />
              </label>
            </div>

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="fieldLabel">Pricing notes</div>
              <textarea
                className="textarea"
                rows={4}
                value={data.adminPricing.notes}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    adminPricing: {
                      ...prev.adminPricing,
                      notes: e.target.value,
                    },
                  }))
                }
              />
            </label>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnGhost"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    { adminPricing: data.adminPricing },
                    "Pricing controls updated."
                  )
                }
              >
                Save Pricing
              </button>
            </div>

            <label style={{ display: "block", marginTop: 18 }}>
              <div className="fieldLabel">Proposal draft</div>
              <textarea
                className="textarea"
                rows={10}
                value={data.proposalText}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    proposalText: e.target.value,
                  }))
                }
                placeholder="Draft proposal here..."
              />
            </label>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    { proposalText: data.proposalText },
                    "Proposal draft saved."
                  )
                }
              >
                Save Proposal Draft →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>Pre-Contract Draft</div>
          <div className="smallNote">
            Generated from the admin-confirmed scope, deposit, ownership, preview, and launch data.
          </div>
        </div>
        <div className="panelBody">
          <div className="row" style={{ marginBottom: 14 }}>
            <button
              className="btn btnPrimary"
              disabled={busy}
              onClick={generatePreContract}
            >
              {data.preContractDraft ? "Regenerate Draft →" : "Generate Draft →"}
            </button>

            <button
              className="btn btnGhost"
              disabled={busy || !data.preContractDraft.trim()}
              onClick={() =>
                savePatch(
                  { preContractDraft: data.preContractDraft },
                  "Pre-contract draft saved."
                )
              }
            >
              Save Draft
            </button>
          </div>

          <label style={{ display: "block" }}>
            <div className="fieldLabel">Draft text</div>
            <textarea
              className="textarea"
              rows={18}
              value={data.preContractDraft}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  preContractDraft: e.target.value,
                }))
              }
              placeholder="Generate a pre-contract draft to review and edit."
            />
          </label>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>Published Agreement</div>
          <div className="smallNote">
            This is the client-facing agreement text that can be published into the workspace.
          </div>
        </div>
        <div className="panelBody">
          <div className="row" style={{ marginBottom: 14 }}>
            <button
              className="btn btnGhost"
              disabled={busy}
              onClick={copyDraftToPublishedAgreement}
            >
              Copy From Pre-Contract
            </button>

            <button
              className="btn btnGhost"
              disabled={busy || !data.publishedAgreementText.trim()}
              onClick={() =>
                savePatch(
                  { publishedAgreementText: data.publishedAgreementText },
                  "Published agreement saved."
                )
              }
            >
              Save Agreement
            </button>

            <button
              className="btn btnPrimary"
              disabled={busy || !data.publishedAgreementText.trim()}
              onClick={requestPublishAgreement}
            >
              Publish To Client →
            </button>

            {isAgreementPublished({
              agreementStatus: data.portalAdmin.agreementStatus,
              publishedAgreementText: data.publishedAgreementText,
            }) && (
              <button
                className="btn btnGhost"
                disabled={busy}
                onClick={unpublishAgreement}
                style={{ color: "#ff6b6b" }}
              >
                Unpublish Agreement
              </button>
            )}
          </div>

          <label style={{ display: "block" }}>
            <div className="fieldLabel">Published agreement text</div>
            <textarea
              className="textarea"
              rows={18}
              value={data.publishedAgreementText}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  publishedAgreementText: e.target.value,
                }))
              }
              placeholder="This agreement text will be shown to the client once published."
            />
          </label>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>Launch Readiness</div>
          <div className="smallNote">
            Complete every item below before marking the website ready for launch.
          </div>
        </div>
        <div className="panelBody">
          <div className="grid2">
            <ReadOnly label="Readiness" value={`${readiness.percent}%`} />
            <ReadOnly label="Open blockers" value={String(readiness.blockers.length)} />
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {readiness.checks.map((item) => (
              <div
                key={item.key}
                style={{
                  border: "1px solid var(--stroke)",
                  borderRadius: 14,
                  background: "var(--panel2)",
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 800 }}>{item.label}</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: item.done ? "#b7f5c4" : "var(--muted)",
                  }}
                >
                  {item.done ? "Ready" : "Pending"}
                </div>
              </div>
            ))}
          </div>

          {readiness.blockers.length > 0 ? (
            <div
              style={{
                marginTop: 14,
                border: "1px solid var(--stroke)",
                borderRadius: 14,
                background: "var(--panel2)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Remaining blockers</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7 }}>
                {readiness.blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button
              className="btn btnGhost"
              disabled={busy || !readiness.canMarkLaunchReady}
              onClick={requestMarkLaunchReady}
            >
              Mark Ready For Launch
            </button>

            <button
              className="btn btnPrimary"
              disabled={busy || !readiness.canMarkLive}
              onClick={requestMarkLive}
            >
              Mark Live →
            </button>

            {(data.portalAdmin.launchStatus === "Ready for launch" ||
              data.portalAdmin.launchStatus === "Live") && (
              <button
                className="btn btnGhost"
                disabled={busy}
                onClick={() => revertLaunchStatus("Not ready", "preview_ready")}
                style={{ color: "#ff6b6b" }}
              >
                Revert to Not Ready
              </button>
            )}

            {data.portalAdmin.launchStatus === "Live" && (
              <button
                className="btn btnGhost"
                disabled={busy}
                onClick={() => revertLaunchStatus("Ready for launch", "launch_ready")}
                style={{ color: "#ff6b6b" }}
              >
                Revert to Ready
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid2stretch" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panelHeader">
            <div>Scope Versions & Change Orders</div>
            <div className="smallNote">
              Track approved scope history and proposed scope changes over time.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <ReadOnly
                label="Scope versions"
                value={String(data.workspaceHistory.scopeVersions.length)}
              />
              <ReadOnly
                label="Change orders"
                value={String(data.workspaceHistory.changeOrders.length)}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Scope history</div>
              <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                {data.workspaceHistory.scopeVersions.length === 0 ? (
                  <div className="smallNote">No saved scope versions yet.</div>
                ) : (
                  data.workspaceHistory.scopeVersions.map((version) => (
                    <div
                      key={version.id}
                      style={{
                        border: "1px solid var(--stroke)",
                        borderRadius: 14,
                        background: "var(--panel2)",
                        padding: 14,
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{version.label}</div>
                      <div className="smallNote" style={{ marginTop: 4 }}>
                        {fmtDate(version.createdAt)} • {version.summary}
                      </div>
                      <div className="pDark" style={{ marginTop: 8 }}>
                        {version.platform} • {version.timeline}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Create change order</div>

              <div className="grid2" style={{ marginTop: 8 }}>
                <label>
                  <div className="fieldLabel">Title</div>
                  <input
                    className="input"
                    value={newChangeOrder.title}
                    onChange={(e) =>
                      setNewChangeOrder((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Add booking flow"
                  />
                </label>

                <label>
                  <div className="fieldLabel">Status</div>
                  <select
                    className="select"
                    value={newChangeOrder.status}
                    onChange={(e) =>
                      setNewChangeOrder((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    {changeOrderStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {pretty(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: "block", marginTop: 12 }}>
                <div className="fieldLabel">Summary</div>
                <textarea
                  className="textarea"
                  rows={4}
                  value={newChangeOrder.summary}
                  onChange={(e) =>
                    setNewChangeOrder((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  placeholder="Describe the requested scope change."
                />
              </label>

              <div className="grid2" style={{ marginTop: 12 }}>
                <label>
                  <div className="fieldLabel">Price impact</div>
                  <input
                    className="input"
                    value={newChangeOrder.priceImpact}
                    onChange={(e) =>
                      setNewChangeOrder((prev) => ({
                        ...prev,
                        priceImpact: e.target.value,
                      }))
                    }
                    placeholder="+$300"
                  />
                </label>

                <label>
                  <div className="fieldLabel">Timeline impact</div>
                  <input
                    className="input"
                    value={newChangeOrder.timelineImpact}
                    onChange={(e) =>
                      setNewChangeOrder((prev) => ({
                        ...prev,
                        timelineImpact: e.target.value,
                      }))
                    }
                    placeholder="+3 business days"
                  />
                </label>
              </div>

              <label style={{ display: "block", marginTop: 12 }}>
                <div className="fieldLabel">Scope impact</div>
                <textarea
                  className="textarea"
                  rows={3}
                  value={newChangeOrder.scopeImpact}
                  onChange={(e) =>
                    setNewChangeOrder((prev) => ({ ...prev, scopeImpact: e.target.value }))
                  }
                  placeholder="What changes in the build if approved?"
                />
              </label>

              <div className="row" style={{ marginTop: 12 }}>
                <button
                  className="btn btnGhost"
                  type="button"
                  disabled={busy}
                  onClick={addChangeOrder}
                >
                  Add Change Order
                </button>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Change orders</div>
              <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                {data.workspaceHistory.changeOrders.length === 0 ? (
                  <div className="smallNote">No change orders yet.</div>
                ) : (
                  data.workspaceHistory.changeOrders.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid var(--stroke)",
                        borderRadius: 14,
                        background: "var(--panel2)",
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) 220px",
                          gap: 14,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>{item.title}</div>
                          <div className="smallNote" style={{ marginTop: 4 }}>
                            {fmtDate(item.createdAt)}
                          </div>
                          <div className="pDark" style={{ marginTop: 8 }}>
                            {item.summary}
                          </div>
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

                        <label>
                          <div className="fieldLabel">Change-order status</div>
                          <select
                            className="select"
                            value={item.status}
                            onChange={(e) =>
                              updateChangeOrderStatus(item.id, e.target.value)
                            }
                          >
                            {changeOrderStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {pretty(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    { workspaceHistory: data.workspaceHistory },
                    "Scope history and change orders updated."
                  )
                }
              >
                Save Scope History →
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>Client Sync</div>
            <div className="smallNote">
              View the latest client activity and manage submission statuses.
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <ReadOnly
                label="Last client update"
                value={fmtDate(data.clientSync.lastClientUpdate)}
              />
              <ReadOnly
                label="Assets submitted"
                value={String(data.clientSync.assets.length)}
              />
              <ReadOnly
                label="Revision requests"
                value={String(data.clientSync.revisions.length)}
              />
              <ReadOnly
                label="Workspace status"
                value={pretty(data.portalStateAdmin.clientStatus)}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Submitted assets</div>
              <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                {data.clientSync.assets.length === 0 ? (
                  <div className="smallNote">No client assets submitted yet.</div>
                ) : (
                  data.clientSync.assets.map((asset) => (
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
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) 220px",
                          gap: 14,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>{asset.label}</div>
                          <div className="smallNote" style={{ marginTop: 4 }}>
                            {asset.category} • {fmtDate(asset.createdAt)}
                          </div>
                          {asset.notes ? (
                            <div className="pDark" style={{ marginTop: 8 }}>
                              {asset.notes}
                            </div>
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

                        <label>
                          <div className="fieldLabel">Asset status</div>
                          <select
                            className="select"
                            value={asset.status}
                            onChange={(e) => updateAssetStatus(asset.id, e.target.value)}
                          >
                            {assetStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {pretty(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="fieldLabel">Revision requests</div>
              <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                {data.clientSync.revisions.length === 0 ? (
                  <div className="smallNote">No client revision requests yet.</div>
                ) : (
                  data.clientSync.revisions.map((rev) => (
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
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) 220px",
                          gap: 14,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800 }}>
                            {pretty(rev.priority)} priority
                          </div>
                          <div className="smallNote" style={{ marginTop: 4 }}>
                            {fmtDate(rev.createdAt)}
                          </div>
                          <div className="pDark" style={{ marginTop: 8 }}>
                            {rev.message}
                          </div>
                        </div>

                        <label>
                          <div className="fieldLabel">Revision status</div>
                          <select
                            className="select"
                            value={rev.status}
                            onChange={(e) => updateRevisionStatus(rev.id, e.target.value)}
                          >
                            {revisionStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {pretty(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={() =>
                  savePatch(
                    {
                      clientSync: {
                        assets: data.clientSync.assets,
                        revisions: data.clientSync.revisions,
                      },
                    },
                    "Client submission statuses updated."
                  )
                }
              >
                Save Client Sync Statuses →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panelHeader">
          <div>PIE Snapshot</div>
        </div>
        <div className="panelBody">
          <div className="grid2">
            <ReadOnly
              label="PIE status"
              value={data.pie.exists ? "Ready" : "Missing"}
            />
            <ReadOnly
              label="PIE score"
              value={data.pie.score != null ? String(data.pie.score) : "—"}
            />
            <ReadOnly label="PIE tier" value={data.pie.tier || "—"} />
            <ReadOnly label="Call request" value={data.callRequest?.status || "—"} />
          </div>

          <label style={{ display: "block", marginTop: 14 }}>
            <div className="fieldLabel">PIE summary</div>
            <textarea
              className="textarea"
              rows={8}
              value={data.pie.summary || ""}
              disabled
            />
          </label>

          <div className="row" style={{ marginTop: 14 }}>
            <Link href="/internal/admin" className="btn btnGhost">
              Back to Pipeline
            </Link>
            {data.workspaceUrl ? (
              <Link href={data.workspaceUrl} className="btn btnPrimary">
                Client Workspace →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      {confirmAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setConfirmAction(null)}
        >
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--stroke)",
              borderRadius: 18,
              padding: "28px 28px 22px",
              maxWidth: 460,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {confirmAction.title}
            </div>
            <p className="pDark" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {confirmAction.description}
            </p>
            <div className="row" style={{ marginTop: 18 }}>
              <button
                className="btn btnGhost"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn btnPrimary"
                disabled={busy}
                onClick={confirmAction.onConfirm}
              >
                Confirm →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel2)" }}>
      <div className="panelBody">
        <div className="smallNote">{label}</div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: 24 }}>{value}</div>
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <input className="input" value={value} disabled />
    </div>
  );
}