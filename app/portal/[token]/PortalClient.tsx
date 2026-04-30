"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ═══════════════════════════════════
   TYPES
   ═══════════════════════════════════ */

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

type PortalMessage = {
  id: string;
  senderRole: "client" | "studio" | "internal";
  senderName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  attachment: {
    url: string | null;
    name: string | null;
    type: string | null;
    size: number | null;
  } | null;
};
type ProjectInvoice = {
  id: string;
  quoteId: string;
  invoiceType: "deposit" | "milestone" | "final" | "retainer";
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string | null;
  paidAt: string | null;
  notes: string;
  paymentUrl: string | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  isPayable: boolean;
};
type ProjectActivity = {
  id: string;
  quoteId: string;
  actorRole: "client" | "studio" | "system";
  eventType: string;
  summary: string;
  payload: Record<string, any>;
  createdAt: string;
  clientVisible: boolean;
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
  invoices: ProjectInvoice[];
  activityFeed: ProjectActivity[];
  messages: PortalMessage[];
};

/* ═══════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════ */

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupMessagesByDay(messages: PortalMessage[]) {
  const groups: { key: string; label: string; items: PortalMessage[] }[] = [];

  for (const message of messages) {
    const date = new Date(message.createdAt || "");
    const key = Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleDateString("en-CA");
    const label = Number.isNaN(date.getTime())
      ? "Unknown day"
      : date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
    const last = groups[groups.length - 1];

    if (!last || last.key !== key) {
      groups.push({ key, label, items: [message] });
    } else {
      last.items.push(message);
    }
  }

  return groups;
}

function isReadyState(value?: string | null) {
  const v = String(value || "").toLowerCase();
  return v === "ready" || v === "complete";
}

function invoiceTone(status: ProjectInvoice["status"]) {
  switch (status) {
    case "paid":
      return {
        background: "var(--success-bg)",
        border: "1px solid var(--success)",
        color: "var(--success)",
      };
    case "overdue":
      return {
        background: "var(--accent-bg)",
        border: "1px solid var(--accent)",
        color: "var(--accent)",
      };
    case "sent":
      return {
        background: "var(--accent-bg)",
        border: "1px solid var(--rule)",
        color: "var(--muted)",
      };
    case "cancelled":
      return {
        background: "rgba(53,48,41,0.08)",
        border: "1px solid rgba(53,48,41,0.16)",
        color: "var(--muted)",
      };
    default:
      return {
        background: "rgba(53,48,41,0.06)",
        border: "1px solid rgba(53,48,41,0.12)",
        color: "var(--muted-2)",
      };
  }
}

/* ═══════════════════════════════════
   COMPUTED STATE
   ═══════════════════════════════════ */

function computeClientLaunchReadiness(bundle: PortalBundle) {
  const checks = [
    {
      key: "agreement",
      label: "Agreement",
      done:
        !!bundle.agreement.publishedText?.trim() ||
        ["published to client", "signed", "kickoff ready"].includes(
          String(bundle.agreement.status || "").toLowerCase()
        ),
    },
    { key: "preview", label: "Preview", done: !!bundle.preview.url },
    { key: "domain", label: "Domain", done: isReadyState(bundle.launch.domainStatus) },
    { key: "analytics", label: "Analytics", done: isReadyState(bundle.launch.analyticsStatus) },
    { key: "forms", label: "Forms", done: isReadyState(bundle.launch.formsStatus) },
    { key: "seo", label: "SEO", done: isReadyState(bundle.launch.seoStatus) },
    { key: "handoff", label: "Handoff", done: isReadyState(bundle.launch.handoffStatus) },
  ];
  const completed = checks.filter((c) => c.done).length;
  const percent = Math.round((completed / checks.length) * 100);
  return { checks, percent, completed };
}

function getPhaseKey(bundle: PortalBundle) {
  const quoteStatus = String(bundle.quote.status || "").toLowerCase();
  const depositStatus = String(bundle.quote.deposit.status || "").toLowerCase();
  const launchStatus = String(bundle.launch.status || "").toLowerCase();
  const clientStatus = String(bundle.portalState.clientStatus || "").toLowerCase();

  if (launchStatus === "live" || clientStatus === "live") return "live";
  if (launchStatus === "ready for launch" || clientStatus === "launch_ready") return "launch_ready";
  if (bundle.preview.url && bundle.preview.clientReviewStatus === "Pending review") return "preview_review";
  if (quoteStatus === "active" || clientStatus === "preview_ready") return "build";
  if (depositStatus === "paid") return "kickoff";
  if (clientStatus === "deposit_sent") return "deposit_sent";
  if (bundle.portalState.assets.length > 0) return "assets_submitted";
  if (["proposal", "deposit"].includes(quoteStatus)) return "pre_start";
  return "intake";
}

function getStoryContent(phase: string) {
  switch (phase) {
    case "live":
      return { headline: "live", body: "Your website is live and serving visitors. You can still submit feedback or upload new content at any time." };
    case "launch_ready":
      return { headline: "ready to launch", body: "Everything is in place. We're preparing your site for launch — you'll be notified as soon as it goes live." };
    case "preview_review":
      return { headline: "ready for review", body: "We've published a preview of your website. Take your time looking through every page — when you're ready, leave feedback below or open the preview to see it live." };
    case "build":
      return { headline: "being built", body: "We're building your website right now. You can track progress here, upload content, and submit feedback as things take shape." };
    case "kickoff":
      return { headline: "about to begin", body: "Your deposit has been received and the project is queued for kickoff. We'll start building shortly." };
    case "deposit_sent":
      return { headline: "awaiting verification", body: "We received your deposit notice and are verifying the payment. Work begins as soon as it clears." };
    case "assets_submitted":
      return { headline: "getting organized", body: "Thanks for submitting your content. We're reviewing your assets and preparing to start the build." };
    case "pre_start":
      return { headline: "in early planning", body: "Your project has been scoped. Review the agreement and deposit details below to get things moving." };
    default:
      return { headline: "taking shape", body: "Your project workspace is ready. Review the details below, upload your content, and we'll take it from there." };
  }
}

function getMilestoneState(milestones: PortalMilestone[], index: number) {
  if (milestones[index]?.done) return "done";
  const activeIndex = milestones.findIndex((item) => !item.done);
  return activeIndex === index ? "active" : "pending";
}

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function JourneyMap({ milestones }: { milestones: PortalMilestone[] }) {
  const doneCount = milestones.filter((m) => m.done).length;
  const fillPercent = milestones.length > 1
    ? ((doneCount - 0.5) / (milestones.length - 1)) * 100
    : 0;

  return (
    <div className="portalJourney">
      <div className="portalSectionLabel">Your project journey</div>
      <div className="portalJourneyTrack">
        <div className="portalJourneyLine">
          <div
            className="portalJourneyLineFill"
            style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
          />
        </div>
        {milestones.map((m, index) => {
          const state = getMilestoneState(milestones, index);
          return (
            <div key={m.key} className="portalJourneyStep">
              <div
                className={`portalJourneyDot ${
                  state === "done"
                    ? "portalJourneyDotDone"
                    : state === "active"
                      ? "portalJourneyDotActive"
                      : "portalJourneyDotPending"
                }`}
              >
                {state !== "pending" ? (
                  <div className="portalJourneyDotInner" />
                ) : null}
              </div>
              <div
                className={`portalJourneyLabel ${
                  state === "done"
                    ? "portalJourneyLabelDone"
                    : state === "active"
                      ? "portalJourneyLabelActive"
                      : "portalJourneyLabelPending"
                }`}
              >
                {m.label}
              </div>
              <div className="portalJourneyDate">
                {m.updatedAt ? fmtDate(m.updatedAt) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="portalMilestoneList">
        {milestones.map((m, index) => {
          const state = getMilestoneState(milestones, index);
          const stateClass = state.charAt(0).toUpperCase() + state.slice(1);

          return (
            <div
              key={`${m.key}-detail`}
              className={`portalMilestoneItem portalMilestoneItem${stateClass}`}
            >
              <span className={`portalMilestoneBox portalMilestoneBox${stateClass}`}>
                <span className="portalMilestoneBoxInner" />
              </span>
              <div className="portalMilestoneCopy">
                <div className="portalMilestoneLabel">{m.label}</div>
                <div className="portalMilestoneDate">
                  {m.updatedAt ? fmtDate(m.updatedAt) : "Waiting on this step"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LaunchSummary({ checks, percent, completed }: {
  checks: { key: string; label: string; done: boolean }[];
  percent: number;
  completed: number;
}) {
  const remaining = checks.filter((c) => !c.done);

  return (
    <div className="portalLaunchSummary">
      <div className="portalLaunchHero">
        <div className="portalLaunchPercent">{percent}%</div>
        <div className="portalLaunchInfo">
          <h4>
            {remaining.length === 0
              ? "Ready to launch"
              : `${remaining.length} thing${remaining.length > 1 ? "s" : ""} left before launch`}
          </h4>
          <p>{completed} of {checks.length} checks passed</p>
        </div>
      </div>

      <div className="portalLaunchBar">
        <div className="portalLaunchBarFill" style={{ width: `${percent}%` }} />
      </div>

      <div className="portalLaunchItems">
        {checks.map((c) => (
          <div
            key={c.key}
            className={`portalLaunchCheck ${c.done ? "portalLaunchCheckDone" : "portalLaunchCheckPending"}`}
          >
            <span className="portalLaunchCheckBox">
              <span className="portalLaunchCheckBoxInner" />
            </span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Drawer({
  label, value, children, defaultOpen = false,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button className="portalDrawerToggle" onClick={() => setOpen(!open)}>
        <span className="portalDrawerToggleLabel">{label}</span>
        <span className="portalDrawerToggleValue">
          {value}
          <span className={`portalDrawerArrow ${open ? "portalDrawerArrowOpen" : ""}`}>
            ▾
          </span>
        </span>
      </button>
      <div className={`portalDrawerContent ${open ? "portalDrawerContentOpen" : ""}`}>
        {children}
      </div>
    </>
  );
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */

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

  /* ── Upload form state ── */
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [assetLabel, setAssetLabel] = useState("");
  const [assetCategory, setAssetCategory] = useState("Brand");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [assetMode, setAssetMode] = useState<"link" | "file">("link");
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Feedback form state ── */
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionPriority, setRevisionPriority] = useState<"low" | "normal" | "high">("normal");
  const [messageBody, setMessageBody] = useState("");
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const messageFileRef = useRef<HTMLInputElement>(null);

  /* ── Polling ── */
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshBundle = useCallback(
    async (silent = true) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch(`/api/portal/${token}`, { method: "GET" });
        const json = await res.json();
        if (res.ok && json?.data) {
          setBundle(json.data as PortalBundle);
        }
      } catch {
        /* silent */
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    pollRef.current = setInterval(() => refreshBundle(true), 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshBundle]);

  /* ── Computed ── */
  const phase = useMemo(() => getPhaseKey(bundle), [bundle]);
  const story = useMemo(() => getStoryContent(phase), [phase]);
  const launchReadiness = useMemo(() => computeClientLaunchReadiness(bundle), [bundle]);
  const depositPaid = String(bundle.quote.deposit.status || "").toLowerCase() === "paid";
  const groupedMessages = useMemo(() => groupMessagesByDay(bundle.messages), [bundle.messages]);

  /* ── Actions ── */
  async function applyAction(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to update workspace.");
      setBundle(json.data as PortalBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetLabel.trim()) return;

    if (assetMode === "file" && assetFile) {
      setSaving(true);
      setError("");
      try {
        const form = new FormData();
        form.append("token", token);
        form.append("file", assetFile);
        form.append("label", assetLabel.trim());
        form.append("assetType", assetCategory);
        form.append("notes", assetNotes.trim());
        const res = await fetch("/api/portal/assets", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Upload failed.");
        await refreshBundle(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setSaving(false);
      }
    } else {
      if (!assetUrl.trim()) return;
      setSaving(true);
      setError("");
      try {
        const res = await fetch("/api/portal/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            assetType: assetCategory,
            label: assetLabel.trim(),
            url: assetUrl.trim(),
            notes: assetNotes.trim(),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Upload failed.");
        await refreshBundle(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setSaving(false);
      }
    }

    setAssetLabel("");
    setAssetUrl("");
    setAssetNotes("");
    setAssetFile(null);
    setShowUploadForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!revisionMessage.trim()) return;
    await applyAction({
      type: "revision_add",
      revision: { message: revisionMessage.trim(), priority: revisionPriority },
    });
    setRevisionMessage("");
    setRevisionPriority("normal");
  }

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageBody.trim() && !messageFile) return;

    setSaving(true);
    setError("");

    try {
      let res: Response;

      if (messageFile) {
        const form = new FormData();
        form.append("body", messageBody.trim());
        form.append("file", messageFile);
        form.append("senderRole", "client");
        res = await fetch(`/api/portal/${token}/messages`, {
          method: "POST",
          body: form,
        });
      } else {
        res = await fetch(`/api/portal/${token}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderRole: "client",
            body: messageBody.trim(),
          }),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to send message.");
      await refreshBundle(true);
      setMessageBody("");
      setMessageFile(null);
      if (messageFileRef.current) messageFileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSaving(false);
    }
  }

  /* ═══════════════════════════════════
     RENDER
     ═══════════════════════════════════ */

  return (
    <div className="container portalShell">

      {/* ── Story Hero ── */}
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          Website project
        </div>

        <h1 className="portalStoryHeadline">
          Your website is <em>{story.headline}</em>
        </h1>

        <p className="portalStoryBody">{story.body}</p>

        <div className="portalStoryActions">
          {bundle.preview.url ? (
            <a
              href={`/api/portal/${token}/preview`}
              target="_blank"
              rel="noreferrer"
              className="portalStoryCta"
            >
              Open your preview
              <span className="portalStoryCtaArrow">→</span>
            </a>
          ) : null}

          {bundle.preview.productionUrl ? (
            <a
              href={bundle.preview.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btnGhost"
            >
              Open live site
            </a>
          ) : null}

          <button
            className="btn btnGhost"
            disabled={refreshing}
            onClick={() => refreshBundle(false)}
            style={{ fontSize: 13 }}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link href="/portal" className="btn btnGhost" style={{ fontSize: 13 }}>
            Back to portal
          </Link>
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">
            Project #{String(bundle.quote.id).slice(0, 8)}
          </span>
          <span className="portalStoryMetaItem">
            Started {fmtDate(bundle.quote.createdAt)}
          </span>
          <span className="portalStoryMetaItem">
            {bundle.scopeSnapshot.tierLabel} tier
          </span>
        </div>
      </div>

      {/* ── Error ── */}
      {error ? <div className="portalError">{error}</div> : null}

      {/* ── Deposit Banner (only if unpaid) ── */}
      <div
        className={`portalDepositBanner ${
          depositPaid ? "portalDepositBannerPaid" : "portalDepositBannerPending"
        }`}
      >
          <div className="portalDepositLead">
            <h3>{depositPaid ? "Deposit received" : "Your deposit is waiting"}</h3>
            <p>
              {depositPaid
                ? "Your deposit has been recorded and the project is moving through kickoff. We will keep the workspace updated as build work progresses."
                : "Work begins as soon as the deposit clears. Pay securely via the link and we will confirm receipt within 24 hours."}
            </p>
          </div>
          <div className="portalDepositActions">
            {bundle.quote.deposit.amount ? (
              <span className="portalDepositAmount">
                {money(bundle.quote.deposit.amount)}
              </span>
            ) : null}

            {!depositPaid && bundle.quote.deposit.link ? (
              <a
                href={bundle.quote.deposit.link}
                target="_blank"
                rel="noreferrer"
                className="portalStoryCta"
              >
                Pay deposit <span className="portalStoryCtaArrow">→</span>
              </a>
            ) : null}

            {!depositPaid && bundle.portalState.clientStatus !== "deposit_sent" ? (
              <button
                className="btn btnGhost"
                type="button"
                disabled={saving}
                onClick={() =>
                  applyAction({
                    type: "deposit_notice_sent",
                    note: "Client reported that the deposit was sent and is awaiting verification.",
                  })
                }
              >
                {saving ? "Sending..." : "I sent the deposit"}
              </button>
            ) : null}

            {bundle.portalState.clientStatus === "deposit_sent" ? (
              <span className="portalDepositMeta">
                Deposit notice sent — awaiting verification
              </span>
            ) : null}
            {depositPaid && bundle.quote.deposit.paidAt ? (
              <span className="portalDepositMeta">
                Paid {fmtDate(bundle.quote.deposit.paidAt)}
              </span>
            ) : null}
          </div>
        </div>

      {/* ── Journey Map ── */}
      {bundle.portalState.milestones.length > 0 ? (
        <JourneyMap milestones={bundle.portalState.milestones} />
      ) : null}

      <div className="portalPanel fadeUp" style={{ animationDelay: "0.06s", marginBottom: "1rem" }}>
        <div className="portalPanelHeader">
          <div>
            <h2 className="portalPanelTitle">Invoices</h2>
            <div className="portalMessageIntro">
              Every invoice for your project appears here, including paid history and any open balances.
            </div>
          </div>
          <span className="portalPanelCount">
            {bundle.invoices.length} invoice{bundle.invoices.length === 1 ? "" : "s"}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {bundle.invoices.length === 0 ? (
            <div className="portalEmptyState">No invoices have been issued yet.</div>
          ) : (
            bundle.invoices.map((invoice) => {
              const tone = invoiceTone(invoice.status);
              return (
                <div
                  key={invoice.id}
                  style={{
                    border: "1px solid var(--rule)",
                    borderRadius: 14,
                    background: "var(--paper-2)",
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                          {pretty(invoice.invoiceType)} invoice
                        </div>
                        <span style={{ ...tone, borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {pretty(invoice.status)}
                        </span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted-2)" }}>
                        Issued {fmtDate(invoice.createdAt)}
                        {invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ""}
                        {invoice.paidAt ? ` · Paid ${fmtDate(invoice.paidAt)}` : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
                        {money(invoice.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {invoice.currency}
                      </div>
                    </div>
                  </div>

                  {invoice.notes ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", whiteSpace: "pre-wrap" }}>
                      {invoice.notes}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    {invoice.isPayable && invoice.paymentUrl ? (
                      <a
                        href={invoice.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="portalStoryCta"
                      >
                        Pay now <span className="portalStoryCtaArrow">→</span>
                      </a>
                    ) : null}
                    {invoice.paymentUrl ? (
                      <a
                        href={invoice.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btnGhost"
                        style={{ fontSize: 13 }}
                      >
                        Open invoice
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Studio Note ── */}
      {bundle.portalState.adminPublicNote ? (
        <div className="portalNote fadeUp">
          <div className="portalNoteIcon">C</div>
          <div>
            <div className="portalNoteLabel">Note from the studio</div>
            <div className="portalNoteText">{bundle.portalState.adminPublicNote}</div>
          </div>
        </div>
      ) : null}

      {/* ── Preview + Launch ── */}
      <div className="portalGrid2 portalGrid2Wide">
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.1s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Preview</h2>
          </div>

          <div className="portalPreviewCard">
            <div className="portalPreviewImg">
              <span className="portalPreviewImgLabel">
                {bundle.preview.url
                  ? new URL(bundle.preview.url).hostname
                  : "Preview not published yet"}
              </span>
              {bundle.preview.url ? (
                <span className="portalPreviewLiveBadge">
                  <span className="portalPreviewLiveDot" />
                  Preview live
                </span>
              ) : null}
            </div>
            <div className="portalPreviewBody">
              <div className="portalPreviewUrl">
                {bundle.preview.url || "Pending"}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {bundle.preview.url ? (
                  <a
                    href={`/api/portal/${token}/preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btnPrimary"
                    style={{ fontSize: 13 }}
                  >
                    Open preview <span className="btnArrow">→</span>
                  </a>
                ) : (
                  <button className="btn btnGhost" disabled>
                    Preview pending
                  </button>
                )}
                {bundle.preview.productionUrl ? (
                  <a
                    href={bundle.preview.productionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btnGhost"
                    style={{ fontSize: 13 }}
                  >
                    Open live site
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {bundle.preview.notes ? (
            <div className="portalInfoNote">
              <div className="portalInfoNoteLabel">Preview notes</div>
              <p className="portalInfoNoteText">{bundle.preview.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="portalPanel fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Launch</h2>
          </div>
          <LaunchSummary
            checks={launchReadiness.checks}
            percent={launchReadiness.percent}
            completed={launchReadiness.completed}
          />
          <div className="portalLaunchAside">
            We&apos;re handling the remaining items behind the scenes. You&apos;ll be notified
            when everything&apos;s ready to go live.
          </div>

          {bundle.launch.notes ? (
            <div className="portalInfoNote">
              <div className="portalInfoNoteLabel">Launch notes</div>
              <p className="portalInfoNoteText">{bundle.launch.notes}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Content & Assets + Feedback ── */}
      <div className="portalPanel fadeUp" style={{ animationDelay: "0.18s", marginBottom: "1rem" }}>
        <div className="portalPanelHeader">
          <div>
            <h2 className="portalPanelTitle">Messages</h2>
            <div className="portalMessageIntro">
              Ask questions, confirm approvals, or send the studio anything you want us to see.
            </div>
          </div>
          <span className="portalPanelCount">
            {bundle.messages.length} message{bundle.messages.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="portalMessageThread">
          {groupedMessages.length === 0 ? (
            <div className="portalEmptyState">No messages yet</div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.key}>
                <div className="portalMessageDay">
                  <span />
                  <div>{group.label}</div>
                  <span />
                </div>

                <div className="portalMessageGroup">
                  {group.items.map((entry) => (
                    <div
                      key={entry.id}
                      className={`portalMessageCard ${
                        entry.senderRole === "studio"
                          ? "portalMessageCardStudio"
                          : "portalMessageCardClient"
                      }`}
                    >
                      <div
                        className={`portalMessageAvatar ${
                          entry.senderRole === "studio"
                            ? "portalMessageAvatarStudio"
                            : "portalMessageAvatarClient"
                        }`}
                      >
                        {entry.senderRole === "studio"
                          ? "CS"
                          : (entry.senderName || "CL").slice(0, 2)}
                      </div>

                      <div className="portalMessageBody">
                        <div className="portalMessageMeta">
                          <div className="portalMessageSender">{entry.senderName}</div>
                          <span className="pill">{pretty(entry.senderRole)}</span>
                          <span className="portalMessageTime">{fmtDateTime(entry.createdAt)}</span>
                          {entry.senderRole === "studio" ? (
                            <span className="portalMessageTime">
                              {entry.readAt ? `Seen ${fmtDateTime(entry.readAt)}` : "Unread"}
                            </span>
                          ) : null}
                        </div>

                        {entry.body ? <div className="portalMessageText">{entry.body}</div> : null}

                        {entry.attachment ? (
                          <div className="portalMessageAttachmentRow">
                            <a
                              href={entry.attachment.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="portalAttachmentChip"
                            >
                              <span>{entry.attachment.name || "Attachment"}</span>
                              {entry.attachment.size ? (
                                <span className="portalAttachmentMeta">
                                  {(entry.attachment.size / 1024).toFixed(0)} KB
                                </span>
                              ) : null}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submitMessage} className="portalMessageComposer">
          <textarea
            className="portalFeedbackArea"
            placeholder="Write a message to the studio..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
          />
          <div className="portalMessageActions">
            <div className="portalMessageAttachWrap">
              <button
                type="button"
                className="btn btnGhost"
                style={{ fontSize: 12 }}
                onClick={() => messageFileRef.current?.click()}
              >
                Attach file
              </button>
              <input
                ref={messageFileRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setMessageFile(e.target.files?.[0] ?? null)}
              />
              {messageFile ? (
                <div className="portalAttachmentMeta">
                  {messageFile.name} ({(messageFile.size / 1024).toFixed(0)} KB)
                </div>
              ) : null}
            </div>
            <button type="submit" className="portalFeedbackBtn" disabled={saving}>
              {saving ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      </div>

      <div className="portalPanel fadeUp" style={{ animationDelay: "0.2s", marginBottom: "1rem" }}>
        <div className="portalPanelHeader">
          <div>
            <h2 className="portalPanelTitle">Activity</h2>
            <div className="portalMessageIntro">
              A running timeline of the client-facing milestones and updates for your project.
            </div>
          </div>
          <span className="portalPanelCount">
            {bundle.activityFeed.length} event{bundle.activityFeed.length === 1 ? "" : "s"}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {bundle.activityFeed.length === 0 ? (
            <div className="portalEmptyState">No activity yet.</div>
          ) : (
            bundle.activityFeed.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr)", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--rule)", background: "var(--paper-2)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: item.actorRole === "client" ? "var(--accent)" : "var(--muted-2)" }}>
                  {pretty(item.actorRole)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{item.summary}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted-2)" }}>
                    {fmtDateTime(item.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="portalGrid2">
        {/* Assets */}
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.2s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Your content</h2>
            <span className="portalPanelCount">
              {bundle.portalState.assets.length} item{bundle.portalState.assets.length !== 1 ? "s" : ""}
            </span>
          </div>

          {!showUploadForm ? (
            <div
              className="portalUploadZone"
              onClick={() => setShowUploadForm(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setShowUploadForm(true)}
            >
              <div className="portalUploadIcon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v10M5 6l4-4 4 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="portalUploadText">
                Drop files here or <b>browse</b>
              </div>
              <div className="portalUploadHint">
                Logos, copy, photos, credentials — we&apos;ll sort them
              </div>
            </div>
          ) : (
            <form onSubmit={submitAsset} className="portalUploadForm">
              <div>
                <div className="fieldLabel">Asset label</div>
                <input
                  className="input"
                  value={assetLabel}
                  onChange={(e) => setAssetLabel(e.target.value)}
                  placeholder="Homepage copy, logo file, service photos..."
                />
              </div>

              <div className="portalInlineGrid2">
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
                  <div className="fieldLabel">Submit as</div>
                  <div className="row" style={{ gap: 6 }}>
                    <button
                      type="button"
                      className={`btn ${assetMode === "link" ? "btnPrimary" : "btnGhost"}`}
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setAssetMode("link")}
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      className={`btn ${assetMode === "file" ? "btnPrimary" : "btnGhost"}`}
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setAssetMode("file")}
                    >
                      File
                    </button>
                  </div>
                </div>
              </div>

              {assetMode === "link" ? (
                <div>
                  <div className="fieldLabel">URL</div>
                  <input
                    className="input"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder="Google Drive / Dropbox / direct link"
                  />
                </div>
              ) : (
                <div>
                  <div className="fieldLabel">Choose file</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="input"
                    style={{ padding: 8 }}
                    onChange={(e) => setAssetFile(e.target.files?.[0] ?? null)}
                  />
                  {assetFile && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted-2)" }}>
                      {assetFile.name} ({(assetFile.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="fieldLabel">Notes</div>
                <textarea
                  className="textarea"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  placeholder="Anything we should know?"
                  style={{ minHeight: 60 }}
                />
              </div>

              <div className="row" style={{ gap: 8 }}>
                <button type="submit" className="btn btnPrimary" disabled={saving}>
                  {saving ? "Saving..." : "Submit asset"} <span className="btnArrow">→</span>
                </button>
                <button
                  type="button"
                  className="btn btnGhost"
                  onClick={() => setShowUploadForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {bundle.portalState.assets.length === 0 && !showUploadForm ? (
            <div className="portalEmptyState">No assets submitted yet</div>
          ) : (
            bundle.portalState.assets.map((asset) => (
              <div key={asset.id} className="portalAsset">
                <div>
                  <div className="portalAssetName">{asset.label}</div>
                  <div className="portalAssetMeta">
                    {asset.category} · {fmtDate(asset.createdAt)}
                    {asset.notes ? ` · ${asset.notes}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className={`portalPill ${
                      asset.status === "approved"
                        ? "portalPillApproved"
                        : asset.status === "received"
                        ? "portalPillReceived"
                        : "portalPillSubmitted"
                    }`}
                  >
                    {pretty(asset.status)}
                  </span>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}
                  >
                    Open
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Feedback */}
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.25s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Feedback</h2>
            <span className="portalPanelCount">
              {bundle.portalState.revisions.length} item{bundle.portalState.revisions.length !== 1 ? "s" : ""}
            </span>
          </div>

          <form onSubmit={submitRevision} className="portalFeedbackForm">
            <textarea
              className="portalFeedbackArea"
              placeholder="What should change? What feels off?"
              value={revisionMessage}
              onChange={(e) => setRevisionMessage(e.target.value)}
            />
            <div className="portalFeedbackRow">
              <div className="portalPriorityRow">
                {(["low", "normal", "high"] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    className={`portalPriorityPill ${
                      revisionPriority === priority
                        ? `portalPriorityPillActive portalPriorityPill${priority.charAt(0).toUpperCase()}${priority.slice(1)}`
                        : ""
                    }`}
                    onClick={() => setRevisionPriority(priority)}
                  >
                    {priority} priority
                  </button>
                ))}
              </div>
              <button type="submit" className="portalFeedbackBtn" disabled={saving}>
                {saving ? "Sending..." : "Submit feedback"}
              </button>
            </div>
          </form>

          {bundle.portalState.revisions.length === 0 ? (
            <div className="portalEmptyState">No revision requests yet</div>
          ) : (
            bundle.portalState.revisions.map((rev) => (
              <div
                key={rev.id}
                className={`portalRev ${
                  rev.priority === "high"
                    ? "portalRevHigh"
                    : rev.status === "new"
                    ? "portalRevNew"
                    : ""
                }`}
              >
                <div className="portalRevTop">
                  <span className="portalRevStatus">{pretty(rev.status)}</span>
                  <span
                    className={`portalRevPriority ${
                      rev.priority === "high"
                        ? "portalRevPriorityHigh"
                        : "portalRevPriorityNormal"
                    }`}
                  >
                    {rev.priority}
                  </span>
                </div>
                <div className="portalRevMsg">{rev.message}</div>
                <div className="portalRevDate">Submitted {fmtDate(rev.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Project Details (Drawers) ── */}
      <div className="portalSectionLabel fadeUp" style={{ marginTop: 8 }}>
        Project details
      </div>

      <Drawer
        label="Scope & features"
        value={`${bundle.scopeSnapshot.pagesIncluded.length} pages · ${bundle.scopeSnapshot.featuresIncluded.length} features`}
      >
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Tier</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.tierLabel}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Platform</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.platform}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Website type</span>
          <span className="portalDrawerVal">{pretty(bundle.scope.websiteType)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Timeline</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.timeline}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Revision policy</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.revisionPolicy}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Content readiness</span>
          <span className="portalDrawerVal">{pretty(bundle.scope.contentReady)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Domain / hosting</span>
          <span className="portalDrawerVal">{pretty(bundle.scope.domainHosting)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Integrations</span>
          <span className="portalDrawerVal">
            {bundle.scope.integrations.length ? bundle.scope.integrations.join(", ") : "None listed"}
          </span>
        </div>
        {bundle.scopeSnapshot.pagesIncluded.length > 0 && (
          <div className="portalDrawerRow" style={{ borderBottom: "none", flexWrap: "wrap" }}>
            <span className="portalDrawerKey">Pages</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bundle.scopeSnapshot.pagesIncluded.map((p) => (
                <span key={p} className="portalFeatureTag">{p}</span>
              ))}
            </div>
          </div>
        )}
        {bundle.scopeSnapshot.featuresIncluded.length > 0 && (
          <div className="portalDrawerRow" style={{ borderBottom: "none", flexWrap: "wrap", paddingTop: 4 }}>
            <span className="portalDrawerKey">Features</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bundle.scopeSnapshot.featuresIncluded.map((f) => (
                <span key={f} className="portalFeatureTag">{f}</span>
              ))}
            </div>
          </div>
        )}
        {bundle.scopeSnapshot.exclusions.length > 0 && (
          <div className="portalDrawerRow" style={{ borderBottom: "none", flexWrap: "wrap", paddingTop: 4 }}>
            <span className="portalDrawerKey">Exclusions</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bundle.scopeSnapshot.exclusions.map((x) => (
                <span key={x} className="portalFeatureTag">{x}</span>
              ))}
            </div>
          </div>
        )}
        {bundle.scope.notes ? (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 10,
            background: "var(--paper-2)", border: "1px solid var(--rule)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Intake notes
            </div>
            <p className="p" style={{ margin: 0, fontSize: 14 }}>{bundle.scope.notes}</p>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        label="Agreement & payment"
        value={pretty(bundle.agreement.status)}
      >
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Agreement status</span>
          <span className="portalDrawerVal">{pretty(bundle.agreement.status)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Agreement model</span>
          <span className="portalDrawerVal">{bundle.agreement.model}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Ownership model</span>
          <span className="portalDrawerVal">{bundle.agreement.ownershipModel}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Published</span>
          <span className="portalDrawerVal">{fmtDate(bundle.agreement.publishedAt)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Deposit status</span>
          <span className={`portalDrawerVal ${depositPaid ? "portalDrawerValPaid" : ""}`}>
            {depositPaid ? `Paid — ${money(bundle.quote.deposit.amount)}` : pretty(bundle.quote.deposit.status)}
          </span>
        </div>
        {!depositPaid && bundle.quote.deposit.amount ? (
          <div className="portalDrawerRow">
            <span className="portalDrawerKey">Deposit amount</span>
            <span className="portalDrawerVal">{money(bundle.quote.deposit.amount)}</span>
          </div>
        ) : null}
        {bundle.quote.deposit.notes ? (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 10,
            background: "var(--paper-2)", border: "1px solid var(--rule)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Deposit notes
            </div>
            <p className="p" style={{ margin: 0, fontSize: 14 }}>{bundle.quote.deposit.notes}</p>
          </div>
        ) : null}
        {bundle.agreement.publishedText ? (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 10,
            background: "var(--paper-2)", border: "1px solid var(--rule)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Published agreement
            </div>

            {bundle.agreement.status === "accepted" ? (
              <div style={{
                marginBottom: 12, padding: 10, borderRadius: 10,
                background: "var(--success-bg)", border: "1px solid var(--success)",
                color: "var(--success)", fontSize: 13, fontWeight: 700,
              }}>
                Agreement accepted
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <button
                  className="btn btnPrimary"
                  disabled={saving}
                  onClick={() => applyAction({ type: "agreement_accept" })}
                >
                  {saving ? "Saving..." : "Accept Agreement"}
                </button>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
                  Scroll through the agreement below, then click Accept to sign.
                </p>
              </div>
            )}

            <div style={{
              color: "var(--muted)", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
              maxHeight: 420, overflowY: "auto", padding: "10px 4px",
              borderTop: "1px solid var(--rule)",
            }}>
              {bundle.agreement.publishedText}
            </div>
          </div>
        ) : null}
      </Drawer>

      {(bundle.history.scopeVersions.length > 0 || bundle.history.changeOrders.length > 0) && (
        <Drawer
          label="Scope history & change orders"
          value={`${bundle.history.scopeVersions.length} versions · ${bundle.history.changeOrders.length} changes`}
        >
          {bundle.history.scopeVersions.map((sv) => (
            <div key={sv.id} className="portalDrawerRow">
              <span className="portalDrawerKey">{sv.label}</span>
              <span className="portalDrawerVal">{fmtDate(sv.createdAt)}</span>
            </div>
          ))}
          {bundle.history.changeOrders.map((co) => (
            <div key={co.id} style={{
              marginTop: 8, padding: 12, borderRadius: 10,
              background: "var(--paper-2)", border: "1px solid var(--rule)",
            }}>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{co.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4 }}>
                {fmtDate(co.createdAt)} · {pretty(co.status)}
              </div>
              <p className="p" style={{ margin: "8px 0 0", fontSize: 14 }}>{co.summary}</p>
              {(co.priceImpact || co.timelineImpact || co.scopeImpact) && (
                <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 8 }}>
                  {co.priceImpact ? `Price: ${co.priceImpact}` : ""}
                  {co.priceImpact && co.timelineImpact ? " · " : ""}
                  {co.timelineImpact ? `Timeline: ${co.timelineImpact}` : ""}
                  {(co.priceImpact || co.timelineImpact) && co.scopeImpact ? " · " : ""}
                  {co.scopeImpact ? `Scope: ${co.scopeImpact}` : ""}
                </div>
              )}
            </div>
          ))}
        </Drawer>
      )}

      <Drawer
        label="Notes & contact"
        value={bundle.callRequest?.bestTime || "Details"}
      >
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Project notes</span>
          <span className="portalDrawerVal">{bundle.portalState.clientNotes || "None"}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">Best time to call</span>
          <span className="portalDrawerVal">
            {bundle.callRequest?.bestTime
              ? `${bundle.callRequest.bestTime}${bundle.callRequest.timezone ? ` (${bundle.callRequest.timezone})` : ""}`
              : "Not provided"}
          </span>
        </div>
        {bundle.pie.summary ? (
          <div className="portalDrawerRow" style={{ borderBottom: "none" }}>
            <span className="portalDrawerKey">PIE summary</span>
            <span className="portalDrawerVal" style={{ maxWidth: 300, textAlign: "right" }}>
              {bundle.pie.summary}
            </span>
          </div>
        ) : null}
      </Drawer>

      {/* ── Footer ── */}
      <div className="portalFooter">
        Powered by <a href="/">Crecy Studio</a> · Your website, your ownership
      </div>
    </div>
  );
}
