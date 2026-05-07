"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DesignDirectionCard from "@/components/portal/DesignDirectionCard";
import type {
  WebsiteDesignDirection,
  WebsiteDesignDirectionInput,
} from "@/lib/designDirection";

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
  projectType?: string;
  // null when the portal is legacy (created before Phase 2) — the feature
  // should not be applied retroactively. undefined for forward-compat with
  // older API responses.
  designDirection?: WebsiteDesignDirection | null;
};

type Phase =
  | "live"
  | "launch_ready"
  | "preview_review"
  | "build"
  | "kickoff"
  | "deposit_sent"
  | "assets_submitted"
  | "pre_start"
  | "intake";

type LaunchCheckKey =
  | "agreement"
  | "preview"
  | "domain"
  | "analytics"
  | "forms"
  | "seo"
  | "handoff";

/* ═══════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════ */

function money(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function fmtDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function prettyFallback(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupMessagesByDay(messages: PortalMessage[], locale: string, unknownLabel: string) {
  const groups: { key: string; label: string; items: PortalMessage[] }[] = [];

  for (const message of messages) {
    const date = new Date(message.createdAt || "");
    const key = Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleDateString("en-CA");
    const label = Number.isNaN(date.getTime())
      ? unknownLabel
      : date.toLocaleDateString(locale, {
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
        background: "var(--paper-2)",
        border: "1px solid var(--rule)",
        color: "var(--muted)",
      };
    default:
      return {
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        color: "var(--muted-2)",
      };
  }
}

/* ═══════════════════════════════════
   COMPUTED STATE
   ═══════════════════════════════════ */

function computeClientLaunchReadiness(bundle: PortalBundle) {
  const checks: { key: LaunchCheckKey; done: boolean }[] = [
    {
      key: "agreement",
      done:
        !!bundle.agreement.publishedText?.trim() ||
        ["published to client", "signed", "kickoff ready"].includes(
          String(bundle.agreement.status || "").toLowerCase()
        ),
    },
    { key: "preview", done: !!bundle.preview.url },
    { key: "domain", done: isReadyState(bundle.launch.domainStatus) },
    { key: "analytics", done: isReadyState(bundle.launch.analyticsStatus) },
    { key: "forms", done: isReadyState(bundle.launch.formsStatus) },
    { key: "seo", done: isReadyState(bundle.launch.seoStatus) },
    { key: "handoff", done: isReadyState(bundle.launch.handoffStatus) },
  ];
  const completed = checks.filter((c) => c.done).length;
  const percent = Math.round((completed / checks.length) * 100);
  return { checks, percent, completed };
}

function getPhaseKey(bundle: PortalBundle): Phase {
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

function getMilestoneState(milestones: PortalMilestone[], index: number) {
  if (milestones[index]?.done) return "done";
  const activeIndex = milestones.findIndex((item) => !item.done);
  return activeIndex === index ? "active" : "pending";
}

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function JourneyMap({ milestones, locale }: { milestones: PortalMilestone[]; locale: string }) {
  const t = useTranslations("portalToken.journey");
  const doneCount = milestones.filter((m) => m.done).length;
  const fillPercent = milestones.length > 1
    ? ((doneCount - 0.5) / (milestones.length - 1)) * 100
    : 0;

  return (
    <div className="portalJourney">
      <div className="portalSectionLabel">{t("title")}</div>
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
                {m.updatedAt ? fmtDate(m.updatedAt, locale) : "—"}
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
                  {m.updatedAt ? fmtDate(m.updatedAt, locale) : t("waiting")}
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
  checks: { key: LaunchCheckKey; done: boolean }[];
  percent: number;
  completed: number;
}) {
  const t = useTranslations("portalToken.launch");
  const tChecks = useTranslations("portalToken.launch.checks");
  const remaining = checks.filter((c) => !c.done);

  return (
    <div className="portalLaunchSummary">
      <div className="portalLaunchHero">
        <div className="portalLaunchPercent">{percent}%</div>
        <div className="portalLaunchInfo">
          <h4>
            {remaining.length === 0
              ? t("ready")
              : t("leftBeforeLaunch", { count: remaining.length })}
          </h4>
          <p>{t("checksPassed", { completed, total: checks.length })}</p>
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
            <span>{tChecks(c.key)}</span>
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
  const locale = useLocale();
  const t = useTranslations("portalToken");
  const tActions = useTranslations("portalToken.actions");
  const tMeta = useTranslations("portalToken.meta");
  const tDeposit = useTranslations("portalToken.deposit");
  const tInvoices = useTranslations("portalToken.invoices");
  const tInvoiceTypes = useTranslations("portalToken.invoices.types");
  const tInvoiceStatuses = useTranslations("portalToken.invoices.statuses");
  const tPreview = useTranslations("portalToken.preview");
  const tMessages = useTranslations("portalToken.messages");
  const tMessageRoles = useTranslations("portalToken.messages.roles");
  const tActivity = useTranslations("portalToken.activity");
  const tActivityActors = useTranslations("portalToken.activity.actors");
  const tAssets = useTranslations("portalToken.assets");
  const tAssetCategories = useTranslations("portalToken.assets.categories");
  const tAssetStatuses = useTranslations("portalToken.assets.statuses");
  const tFeedback = useTranslations("portalToken.feedback");
  const tFeedbackPriority = useTranslations("portalToken.feedback.priority");
  const tFeedbackPriorityShort = useTranslations("portalToken.feedback.priorityShort");
  const tFeedbackStatuses = useTranslations("portalToken.feedback.statuses");
  const tDetails = useTranslations("portalToken.details");
  const tDetailRows = useTranslations("portalToken.details.rows");
  const tImpacts = useTranslations("portalToken.details.changeOrderImpacts");
  const tFooter = useTranslations("portalToken.footer");
  const tErrors = useTranslations("portalToken.errors");
  const tPhases = useTranslations("portalToken.phases");
  const tStories = useTranslations("portalToken.stories");
  const tLaunch = useTranslations("portalToken.launch");

  const lookup = useCallback(
    (dict: ReturnType<typeof useTranslations>, raw: string | null | undefined) => {
      const key = String(raw || "").toLowerCase().trim();
      if (!key) return "—";
      return dict.has(key) ? dict(key) : prettyFallback(raw);
    },
    []
  );

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
  const launchReadiness = useMemo(() => computeClientLaunchReadiness(bundle), [bundle]);
  const depositPaid = String(bundle.quote.deposit.status || "").toLowerCase() === "paid";
  const groupedMessages = useMemo(
    () => groupMessagesByDay(bundle.messages, locale, tMessages("unknownDay")),
    [bundle.messages, locale, tMessages]
  );

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
      if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("updateFailed"));
      setBundle(json.data as PortalBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("updateFailed"));
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
        if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("uploadFailed"));
        await refreshBundle(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : tErrors("uploadFailed"));
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
        if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("uploadFailed"));
        await refreshBundle(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : tErrors("uploadFailed"));
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
      if (!res.ok || !json?.ok) throw new Error(json?.error || tErrors("messageFailed"));
      await refreshBundle(true);
      setMessageBody("");
      setMessageFile(null);
      if (messageFileRef.current) messageFileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("messageFailed"));
    } finally {
      setSaving(false);
    }
  }

  /* ═══════════════════════════════════
     RENDER
     ═══════════════════════════════════ */

  return (
    <>
    {token === "demo" && (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--ink)",
        borderBottom: "1px solid color-mix(in srgb, var(--paper) 15%, transparent)",
        padding: "10px 0",
      }}>
        <div className="container" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.2rem",
          flexWrap: "wrap",
        }}>
          <span style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "color-mix(in srgb, var(--paper) 55%, transparent)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            Demo workspace — read-only · data resets periodically
          </span>
          <a
            href="/build/intro"
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--accent-soft, #e06c5a)",
              textDecoration: "none",
              letterSpacing: "0.03em",
            }}
          >
            Start a real project →
          </a>
        </div>
      </div>
    )}
    <div className="container portalShell">

      {/* ── Story Hero ── */}
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          {t("kicker")}
        </div>

        <h1 className="portalStoryHeadline">
          {t.rich("headline", {
            phase: tPhases(phase),
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>

        <p className="portalStoryBody">{tStories(phase)}</p>

        <div className="portalStoryActions">
          {bundle.preview.url ? (
            <a
              href={`/api/portal/${token}/preview`}
              target="_blank"
              rel="noreferrer"
              className="portalStoryCta"
            >
              {tActions("openPreview")}
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
              {tActions("openLiveSite")}
            </a>
          ) : null}

          <button
            className="btn btnGhost"
            disabled={refreshing}
            onClick={() => refreshBundle(false)}
            style={{ fontSize: 13 }}
          >
            {refreshing ? tActions("refreshing") : tActions("refresh")}
          </button>

          <Link href="/portal" className="btn btnGhost" style={{ fontSize: 13 }}>
            {tActions("backToPortal")}
          </Link>
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">
            {tMeta("projectId", { id: String(bundle.quote.id).slice(0, 8) })}
          </span>
          <span className="portalStoryMetaItem">
            {tMeta("started", { date: fmtDate(bundle.quote.createdAt, locale) })}
          </span>
          <span className="portalStoryMetaItem">
            {tMeta("tierLabel", { tier: bundle.scopeSnapshot.tierLabel })}
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
            <h3>{depositPaid ? tDeposit("headerPaid") : tDeposit("headerPending")}</h3>
            <p>{depositPaid ? tDeposit("bodyPaid") : tDeposit("bodyPending")}</p>
          </div>
          <div className="portalDepositActions">
            {bundle.quote.deposit.amount ? (
              <span className="portalDepositAmount">
                {money(bundle.quote.deposit.amount, locale)}
              </span>
            ) : null}

            {!depositPaid && bundle.quote.deposit.link ? (
              <a
                href={bundle.quote.deposit.link}
                target="_blank"
                rel="noreferrer"
                className="portalStoryCta"
              >
                {tActions("payDeposit")} <span className="portalStoryCtaArrow">→</span>
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
                    note: tDeposit("depositSentReason"),
                  })
                }
              >
                {saving ? tActions("depositSending") : tActions("depositSent")}
              </button>
            ) : null}

            {bundle.portalState.clientStatus === "deposit_sent" ? (
              <span className="portalDepositMeta">
                {tActions("depositNoticeAwaiting")}
              </span>
            ) : null}
            {depositPaid && bundle.quote.deposit.paidAt ? (
              <span className="portalDepositMeta">
                {tActions("depositPaidOn", { date: fmtDate(bundle.quote.deposit.paidAt, locale) })}
              </span>
            ) : null}
          </div>
        </div>

      {/* ── Design Direction ──
          Only renders when the portal has an explicit designDirection record.
          Legacy portals (pre-Phase 2) have no record and intentionally
          don't see this card so their existing workflow isn't disrupted. */}
      {(!bundle.projectType || bundle.projectType === "website") &&
      bundle.quote.deposit.status === "paid" &&
      bundle.designDirection ? (
        <DesignDirectionCard
          value={bundle.designDirection}
          onSubmit={async (input: WebsiteDesignDirectionInput) => {
            const res = await fetch(`/api/portal/${token}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "design_direction_submit", designDirection: input }),
            });
            const json = await res.json();
            if (!res.ok || !json?.ok) {
              throw new Error(json?.error || tErrors("updateFailed"));
            }
            setBundle(json.data as PortalBundle);
          }}
        />
      ) : null}

      {/* ── Journey Map ── */}
      {bundle.portalState.milestones.length > 0 ? (
        <JourneyMap milestones={bundle.portalState.milestones} locale={locale} />
      ) : null}

      <div className="portalPanel fadeUp" style={{ animationDelay: "0.06s", marginBottom: "1rem" }}>
        <div className="portalPanelHeader">
          <div>
            <h2 className="portalPanelTitle">{tInvoices("title")}</h2>
            <div className="portalMessageIntro">{tInvoices("intro")}</div>
          </div>
          <span className="portalPanelCount">
            {tInvoices("count", { count: bundle.invoices.length })}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {bundle.invoices.length === 0 ? (
            <div className="portalEmptyState">{tInvoices("empty")}</div>
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
                          {tInvoiceTypes.has(invoice.invoiceType)
                            ? tInvoiceTypes(invoice.invoiceType)
                            : `${prettyFallback(invoice.invoiceType)} invoice`}
                        </div>
                        <span style={{ ...tone, borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {lookup(tInvoiceStatuses, invoice.status)}
                        </span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted-2)" }}>
                        {tInvoices("issued", { date: fmtDate(invoice.createdAt, locale) })}
                        {invoice.dueDate ? tInvoices("due", { date: fmtDate(invoice.dueDate, locale) }) : ""}
                        {invoice.paidAt ? tInvoices("paid", { date: fmtDate(invoice.paidAt, locale) }) : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
                        {money(invoice.amount, locale)}
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
                        {tActions("payNow")} <span className="portalStoryCtaArrow">→</span>
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
                        {tActions("openInvoice")}
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
            <div className="portalNoteLabel">{t("studioNote")}</div>
            <div className="portalNoteText">{bundle.portalState.adminPublicNote}</div>
          </div>
        </div>
      ) : null}

      {/* ── Preview + Launch ── */}
      <div className="portalGrid2 portalGrid2Wide">
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.1s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tPreview("panelTitle")}</h2>
          </div>

          <div className="portalPreviewCard">
            <div className="portalPreviewImg">
              <span className="portalPreviewImgLabel">
                {bundle.preview.url
                  ? new URL(bundle.preview.url).hostname
                  : tPreview("notPublished")}
              </span>
              {bundle.preview.url ? (
                <span className="portalPreviewLiveBadge">
                  <span className="portalPreviewLiveDot" />
                  {tPreview("live")}
                </span>
              ) : null}
            </div>
            <div className="portalPreviewBody">
              <div className="portalPreviewUrl">
                {bundle.preview.url || tPreview("pending")}
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
                    {tPreview("openPreview")} <span className="btnArrow">→</span>
                  </a>
                ) : (
                  <button className="btn btnGhost" disabled>
                    {tPreview("previewPending")}
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
                    {tPreview("openLiveSite")}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {bundle.preview.notes ? (
            <div className="portalInfoNote">
              <div className="portalInfoNoteLabel">{tPreview("notesLabel")}</div>
              <p className="portalInfoNoteText">{bundle.preview.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="portalPanel fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tLaunch("panelTitle")}</h2>
          </div>
          <LaunchSummary
            checks={launchReadiness.checks}
            percent={launchReadiness.percent}
            completed={launchReadiness.completed}
          />
          <div className="portalLaunchAside">{tLaunch("asideText")}</div>

          {bundle.launch.notes ? (
            <div className="portalInfoNote">
              <div className="portalInfoNoteLabel">{tLaunch("notesLabel")}</div>
              <p className="portalInfoNoteText">{bundle.launch.notes}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Messages Panel ── */}
      <div className="portalPanel fadeUp" style={{ animationDelay: "0.18s", marginBottom: "1rem" }}>
        <div className="portalPanelHeader">
          <div>
            <h2 className="portalPanelTitle">{tMessages("panelTitle")}</h2>
            <div className="portalMessageIntro">{tMessages("intro")}</div>
          </div>
          <span className="portalPanelCount">
            {tMessages("count", { count: bundle.messages.length })}
          </span>
        </div>

        <div className="portalMessageThread">
          {groupedMessages.length === 0 ? (
            <div className="portalEmptyState">{tMessages("empty")}</div>
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
                          <span className="pill">{lookup(tMessageRoles, entry.senderRole)}</span>
                          <span className="portalMessageTime">{fmtDateTime(entry.createdAt, locale)}</span>
                          {entry.senderRole === "studio" ? (
                            <span className="portalMessageTime">
                              {entry.readAt
                                ? tMessages("seen", { time: fmtDateTime(entry.readAt, locale) })
                                : tMessages("unread")}
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
                              <span>{entry.attachment.name || tMessages("attachmentFallback")}</span>
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
            placeholder={tMessages("writePlaceholder")}
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
                {tMessages("attach")}
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
              {saving ? tMessages("sending") : tMessages("send")}
            </button>
          </div>
        </form>
      </div>

      {/* ── Activity Panel ── */}
      <div className="portalPanel fadeUp" style={{ animationDelay: "0.2s", marginBottom: "1rem" }}>
        <div className="portalPanelHeader">
          <div>
            <h2 className="portalPanelTitle">{tActivity("panelTitle")}</h2>
            <div className="portalMessageIntro">{tActivity("intro")}</div>
          </div>
          <span className="portalPanelCount">
            {tActivity("count", { count: bundle.activityFeed.length })}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {bundle.activityFeed.length === 0 ? (
            <div className="portalEmptyState">{tActivity("empty")}</div>
          ) : (
            bundle.activityFeed.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr)", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--rule)", background: "var(--paper-2)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: item.actorRole === "client" ? "var(--accent)" : "var(--muted-2)" }}>
                  {lookup(tActivityActors, item.actorRole)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{item.summary}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted-2)" }}>
                    {fmtDateTime(item.createdAt, locale)}
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
            <h2 className="portalPanelTitle">{tAssets("panelTitle")}</h2>
            <span className="portalPanelCount">
              {tAssets("count", { count: bundle.portalState.assets.length })}
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
                {tAssets("uploadDrop")} <b>{tAssets("uploadBrowse")}</b>
              </div>
              <div className="portalUploadHint">
                {tAssets("uploadHint")}
              </div>
            </div>
          ) : (
            <form onSubmit={submitAsset} className="portalUploadForm">
              <div>
                <div className="fieldLabel">{tAssets("labelLabel")}</div>
                <input
                  className="input"
                  value={assetLabel}
                  onChange={(e) => setAssetLabel(e.target.value)}
                  placeholder={tAssets("labelPlaceholder")}
                />
              </div>

              <div className="portalInlineGrid2">
                <div>
                  <div className="fieldLabel">{tAssets("categoryLabel")}</div>
                  <select
                    className="select"
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                  >
                    {(["Brand", "Copy", "Images", "Access", "Legal", "Other"] as const).map((opt) => (
                      <option key={opt} value={opt}>{tAssetCategories(opt)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="fieldLabel">{tAssets("submitAsLabel")}</div>
                  <div className="row" style={{ gap: 6 }}>
                    <button
                      type="button"
                      className={`btn ${assetMode === "link" ? "btnPrimary" : "btnGhost"}`}
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setAssetMode("link")}
                    >
                      {tAssets("modeLink")}
                    </button>
                    <button
                      type="button"
                      className={`btn ${assetMode === "file" ? "btnPrimary" : "btnGhost"}`}
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setAssetMode("file")}
                    >
                      {tAssets("modeFile")}
                    </button>
                  </div>
                </div>
              </div>

              {assetMode === "link" ? (
                <div>
                  <div className="fieldLabel">{tAssets("urlLabel")}</div>
                  <input
                    className="input"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder={tAssets("urlPlaceholder")}
                  />
                </div>
              ) : (
                <div>
                  <div className="fieldLabel">{tAssets("fileLabel")}</div>
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
                <div className="fieldLabel">{tAssets("notesLabel")}</div>
                <textarea
                  className="textarea"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  placeholder={tAssets("notesPlaceholder")}
                  style={{ minHeight: 60 }}
                />
              </div>

              <div className="row" style={{ gap: 8 }}>
                <button type="submit" className="btn btnPrimary" disabled={saving}>
                  {saving ? tAssets("submitting") : tAssets("submit")} <span className="btnArrow">→</span>
                </button>
                <button
                  type="button"
                  className="btn btnGhost"
                  onClick={() => setShowUploadForm(false)}
                >
                  {tAssets("cancel")}
                </button>
              </div>
            </form>
          )}

          {bundle.portalState.assets.length === 0 && !showUploadForm ? (
            <div className="portalEmptyState">{tAssets("empty")}</div>
          ) : (
            bundle.portalState.assets.map((asset) => (
              <div key={asset.id} className="portalAsset">
                <div>
                  <div className="portalAssetName">{asset.label}</div>
                  <div className="portalAssetMeta">
                    {tAssetCategories.has(asset.category)
                      ? tAssetCategories(asset.category)
                      : asset.category}
                    {" · "}
                    {fmtDate(asset.createdAt, locale)}
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
                    {lookup(tAssetStatuses, asset.status)}
                  </span>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}
                  >
                    {tAssets("open")}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Feedback */}
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.25s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{tFeedback("panelTitle")}</h2>
            <span className="portalPanelCount">
              {tFeedback("count", { count: bundle.portalState.revisions.length })}
            </span>
          </div>

          <form onSubmit={submitRevision} className="portalFeedbackForm">
            <textarea
              className="portalFeedbackArea"
              placeholder={tFeedback("placeholder")}
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
                    {tFeedbackPriority(priority)}
                  </button>
                ))}
              </div>
              <button type="submit" className="portalFeedbackBtn" disabled={saving}>
                {saving ? tFeedback("submitting") : tFeedback("submit")}
              </button>
            </div>
          </form>

          {bundle.portalState.revisions.length === 0 ? (
            <div className="portalEmptyState">{tFeedback("empty")}</div>
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
                  <span className="portalRevStatus">{lookup(tFeedbackStatuses, rev.status)}</span>
                  <span
                    className={`portalRevPriority ${
                      rev.priority === "high"
                        ? "portalRevPriorityHigh"
                        : "portalRevPriorityNormal"
                    }`}
                  >
                    {tFeedbackPriorityShort(rev.priority)}
                  </span>
                </div>
                <div className="portalRevMsg">{rev.message}</div>
                <div className="portalRevDate">
                  {tFeedback("submittedOn", { date: fmtDate(rev.createdAt, locale) })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Project Details (Drawers) ── */}
      <div className="portalSectionLabel fadeUp" style={{ marginTop: 8 }}>
        {tDetails("title")}
      </div>

      <Drawer
        label={tDetails("scopeLabel")}
        value={tDetails("scopeValue", {
          pages: bundle.scopeSnapshot.pagesIncluded.length,
          features: bundle.scopeSnapshot.featuresIncluded.length,
        })}
      >
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("tier")}</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.tierLabel}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("platform")}</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.platform}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("websiteType")}</span>
          <span className="portalDrawerVal">{prettyFallback(bundle.scope.websiteType)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("timeline")}</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.timeline}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("revisionPolicy")}</span>
          <span className="portalDrawerVal">{bundle.scopeSnapshot.revisionPolicy}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("contentReady")}</span>
          <span className="portalDrawerVal">{prettyFallback(bundle.scope.contentReady)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("domainHosting")}</span>
          <span className="portalDrawerVal">{prettyFallback(bundle.scope.domainHosting)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("integrations")}</span>
          <span className="portalDrawerVal">
            {bundle.scope.integrations.length ? bundle.scope.integrations.join(", ") : tDetailRows("noneListed")}
          </span>
        </div>
        {bundle.scopeSnapshot.pagesIncluded.length > 0 && (
          <div className="portalDrawerRow" style={{ borderBottom: "none", flexWrap: "wrap" }}>
            <span className="portalDrawerKey">{tDetailRows("pages")}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bundle.scopeSnapshot.pagesIncluded.map((p) => (
                <span key={p} className="portalFeatureTag">{p}</span>
              ))}
            </div>
          </div>
        )}
        {bundle.scopeSnapshot.featuresIncluded.length > 0 && (
          <div className="portalDrawerRow" style={{ borderBottom: "none", flexWrap: "wrap", paddingTop: 4 }}>
            <span className="portalDrawerKey">{tDetailRows("features")}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bundle.scopeSnapshot.featuresIncluded.map((f) => (
                <span key={f} className="portalFeatureTag">{f}</span>
              ))}
            </div>
          </div>
        )}
        {bundle.scopeSnapshot.exclusions.length > 0 && (
          <div className="portalDrawerRow" style={{ borderBottom: "none", flexWrap: "wrap", paddingTop: 4 }}>
            <span className="portalDrawerKey">{tDetailRows("exclusions")}</span>
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
              {tDetailRows("intakeNotes")}
            </div>
            <p className="p" style={{ margin: 0, fontSize: 14 }}>{bundle.scope.notes}</p>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        label={tDetails("agreementLabel")}
        value={prettyFallback(bundle.agreement.status)}
      >
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("agreementStatus")}</span>
          <span className="portalDrawerVal">{prettyFallback(bundle.agreement.status)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("agreementModel")}</span>
          <span className="portalDrawerVal">{bundle.agreement.model}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("ownershipModel")}</span>
          <span className="portalDrawerVal">{bundle.agreement.ownershipModel}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("published")}</span>
          <span className="portalDrawerVal">{fmtDate(bundle.agreement.publishedAt, locale)}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("depositStatus")}</span>
          <span className={`portalDrawerVal ${depositPaid ? "portalDrawerValPaid" : ""}`}>
            {depositPaid
              ? tDetailRows("depositPaid", { amount: money(bundle.quote.deposit.amount, locale) })
              : prettyFallback(bundle.quote.deposit.status)}
          </span>
        </div>
        {!depositPaid && bundle.quote.deposit.amount ? (
          <div className="portalDrawerRow">
            <span className="portalDrawerKey">{tDetailRows("depositAmount")}</span>
            <span className="portalDrawerVal">{money(bundle.quote.deposit.amount, locale)}</span>
          </div>
        ) : null}
        {bundle.quote.deposit.notes ? (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 10,
            background: "var(--paper-2)", border: "1px solid var(--rule)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              {tDetailRows("depositNotes")}
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
              {tDetailRows("publishedAgreement")}
            </div>

            {bundle.agreement.status === "accepted" ? (
              <>
                <div style={{
                  marginBottom: 8, padding: 10, borderRadius: 10,
                  background: "var(--success-bg)", border: "1px solid var(--success)",
                  color: "var(--success)", fontSize: 13, fontWeight: 700,
                }}>
                  {tDetailRows("agreementAccepted")}
                </div>
                <a
                  href={`/api/portal/${token}/certificate`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginBottom: 12, fontSize: 13, color: "var(--accent)" }}
                >
                  Download signed certificate →
                </a>
              </>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <button
                  className="btn btnPrimary"
                  disabled={saving}
                  onClick={() => applyAction({ type: "agreement_accept" })}
                >
                  {saving ? tActions("agreementSaving") : tActions("acceptAgreement")}
                </button>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
                  {tDetailRows("acceptHelp")}
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
          label={tDetails("scopeHistoryLabel")}
          value={tDetails("scopeHistoryValue", {
            versions: bundle.history.scopeVersions.length,
            changes: bundle.history.changeOrders.length,
          })}
        >
          {bundle.history.scopeVersions.map((sv) => (
            <div key={sv.id} className="portalDrawerRow">
              <span className="portalDrawerKey">{sv.label}</span>
              <span className="portalDrawerVal">{fmtDate(sv.createdAt, locale)}</span>
            </div>
          ))}
          {bundle.history.changeOrders.map((co) => (
            <div key={co.id} style={{
              marginTop: 8, padding: 12, borderRadius: 10,
              background: "var(--paper-2)", border: "1px solid var(--rule)",
            }}>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{co.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4 }}>
                {fmtDate(co.createdAt, locale)} · {prettyFallback(co.status)}
              </div>
              <p className="p" style={{ margin: "8px 0 0", fontSize: 14 }}>{co.summary}</p>
              {(co.priceImpact || co.timelineImpact || co.scopeImpact) && (
                <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 8 }}>
                  {co.priceImpact ? tImpacts("price", { value: co.priceImpact }) : ""}
                  {co.priceImpact && co.timelineImpact ? " · " : ""}
                  {co.timelineImpact ? tImpacts("timeline", { value: co.timelineImpact }) : ""}
                  {(co.priceImpact || co.timelineImpact) && co.scopeImpact ? " · " : ""}
                  {co.scopeImpact ? tImpacts("scope", { value: co.scopeImpact }) : ""}
                </div>
              )}
            </div>
          ))}
        </Drawer>
      )}

      <Drawer
        label={tDetails("notesContactLabel")}
        value={bundle.callRequest?.bestTime || tDetails("notesContactDefault")}
      >
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("projectNotes")}</span>
          <span className="portalDrawerVal">{bundle.portalState.clientNotes || tDetailRows("none")}</span>
        </div>
        <div className="portalDrawerRow">
          <span className="portalDrawerKey">{tDetailRows("bestTimeToCall")}</span>
          <span className="portalDrawerVal">
            {bundle.callRequest?.bestTime
              ? bundle.callRequest.timezone
                ? tDetails("callTimeWithTimezone", {
                    time: bundle.callRequest.bestTime,
                    timezone: bundle.callRequest.timezone,
                  })
                : bundle.callRequest.bestTime
              : tDetailRows("notProvided")}
          </span>
        </div>
        {bundle.pie.summary ? (
          <div className="portalDrawerRow" style={{ borderBottom: "none" }}>
            <span className="portalDrawerKey">{tDetailRows("pieSummary")}</span>
            <span className="portalDrawerVal" style={{ maxWidth: 300, textAlign: "right" }}>
              {bundle.pie.summary}
            </span>
          </div>
        ) : null}
      </Drawer>

      {/* ── Footer ── */}
      <div className="portalFooter">
        {tFooter("poweredBy")} <a href="/">Crecy Studio</a>{tFooter("tagline")}
      </div>
    </div>
    </>
  );
}
