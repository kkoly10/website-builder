"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

/* ═══════════════════════════════════
   TYPES
   ═══════════════════════════════════ */

type EcomIntake = {
  id: string;
  created_at: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  store_url: string | null;
  sales_channels: string[] | null;
  service_types: string[] | null;
  monthly_orders: string | null;
  peak_orders: string | null;
  storage_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  notes: string | null;
  status: string | null;
};

type EcomQuote = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  estimate_setup_fee: number | null;
  estimate_monthly_fee: number | null;
  estimate_fulfillment_model: string | null;
  quote_json?: {
    agreement_status?: string;
    agreement_accepted_at?: string;
    deposit_notice?: string;
    deposit_notice_sent_at?: string;
    [key: string]: unknown;
  } | null;
} | null;

type EcomCall = {
  id: string;
  created_at: string | null;
  status: string | null;
  best_time_to_call: string | null;
  notes: string | null;
} | null;

type EcomPortalBundle = {
  intake: EcomIntake;
  quote: EcomQuote;
  call: EcomCall;
  isAdmin: boolean;
};

/* ═══════════════════════════════════
   HELPERS
   ═══════════════════════════════════ */

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function money(v?: number | null) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v));
}

function pretty(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getEntryPath(intake: EcomIntake): "build" | "run" | "fix" {
  const services = (intake.service_types || []).map((s) => s.toLowerCase());
  const hasBuildService = services.some((s) => s.includes("build") || s.includes("design") || s.includes("setup"));
  const hasFixService = services.some((s) => s.includes("audit") || s.includes("optimization") || s.includes("overhaul") || s.includes("fix"));
  if (hasBuildService) return "build";
  if (hasFixService) return "fix";
  return "run";
}

function getPhase(intake: EcomIntake, quote: EcomQuote, call: EcomCall) {
  const status = String(intake.status || "").toLowerCase();
  const quoteStatus = String(quote?.status || "").toLowerCase();

  if (status === "live" || status === "active") return "operations";
  if (status === "building" || status === "in_progress") return "building";
  if (quoteStatus === "accepted" || quoteStatus === "paid") return "onboarding";
  if (quoteStatus === "sent" || quoteStatus === "review") return "quote_review";
  if (call && call.status) return "discovery";
  return "intake";
}

function getStoryContent(phase: string, entryPath: "build" | "run" | "fix") {
  switch (phase) {
    case "operations":
      return { headline: "being managed", body: "Your store operations are active. We're handling your day-to-day operations — check below for current tasks, performance, and anything that needs your input." };
    case "building":
      return entryPath === "build"
        ? { headline: "being built", body: "Your store is under construction. We're building your pages, setting up checkout, and configuring your products. You'll see a preview here when it's ready." }
        : { headline: "being optimized", body: "We're implementing the fixes from the audit. You'll see progress below as each improvement goes live." };
    case "onboarding":
      return { headline: "being set up", body: "Your proposal has been accepted and we're setting up your workspace. Onboarding tasks are being prepared — you'll see them here shortly." };
    case "quote_review":
      return { headline: "ready for review", body: "We've put together a proposal based on your intake. Review the pricing and scope below, and let us know if you have questions." };
    case "discovery":
      return { headline: "in discovery", body: "We're reviewing your intake and preparing for the planning call. Once we have a clear picture, we'll draft a proposal with pricing and scope." };
    default:
      return { headline: "getting started", body: "We've received your intake. Next step is a planning call to understand your store, your challenges, and what you need from us." };
  }
}

const PATH_META = {
  build: { label: "Store build", color: "#c9a84c", icon: "Build" },
  run: { label: "Managed operations", color: "#5DCAA5", icon: "Run" },
  fix: { label: "Store optimization", color: "#8da4ff", icon: "Fix" },
};

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function Drawer({ label, value, children, defaultOpen = false }: {
  label: string; value: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button className="portalDrawerToggle" onClick={() => setOpen(!open)}>
        <span className="portalDrawerToggleLabel">{label}</span>
        <span className="portalDrawerToggleValue">
          {value}
          <span className={`portalDrawerArrow ${open ? "portalDrawerArrowOpen" : ""}`}>▾</span>
        </span>
      </button>
      <div className={`portalDrawerContent ${open ? "portalDrawerContentOpen" : ""}`}>{children}</div>
    </>
  );
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */

export default function EcomPortalClient({ data }: { data: EcomPortalBundle }) {
  const [bundle, setBundle] = useState(data);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { intake, quote, call } = bundle;
  const entryPath = useMemo(() => getEntryPath(intake), [intake]);
  const phase = useMemo(() => getPhase(intake, quote, call), [intake, quote, call]);
  const story = useMemo(() => getStoryContent(phase, entryPath), [phase, entryPath]);
  const pathInfo = PATH_META[entryPath];

  const callStatus = pretty(call?.status) || "Not requested";
  const quoteStatus = pretty(quote?.status) || "Not started";

  const refreshWorkspace = useCallback(async () => {
    setRefreshing(true); setError("");
    try {
      const res = await fetch(`/api/portal/ecommerce/${intake.id}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Refresh failed.");
      setBundle(json.data as EcomPortalBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed.");
    } finally { setRefreshing(false); }
  }, [intake.id]);

  const applyAction = useCallback(async (payload: Record<string, unknown>) => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/portal/ecommerce/${intake.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Action failed.");
      setBundle(json.data as EcomPortalBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally { setSaving(false); }
  }, [intake.id]);

  return (
    <div className="container" style={{ paddingBottom: 48 }}>

      {/* ── Story Hero ── */}
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          E-commerce · {pathInfo.label}
        </div>

        <h1 className="portalStoryHeadline">
          Your store is <em>{story.headline}</em>
        </h1>

        <p className="portalStoryBody">{story.body}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {intake.store_url && (
            <a href={intake.store_url} target="_blank" rel="noreferrer" className="portalStoryCta">
              Visit your store <span className="portalStoryCtaArrow">→</span>
            </a>
          )}
          <button className="btn btnGhost" disabled={refreshing} onClick={refreshWorkspace} style={{ fontSize: 13 }}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link href="/portal" className="btn btnGhost" style={{ fontSize: 13 }}>Back to portal</Link>
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">{intake.business_name || "E-Commerce Project"}</span>
          <span className="portalStoryMetaItem">Started {fmtDate(intake.created_at)}</span>
          <span className="portalStoryMetaItem" style={{ color: pathInfo.color }}>{pathInfo.label}</span>
        </div>
      </div>

      {error && <div className="portalError">{error}</div>}

      {/* ── Entry Path Badge ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 18px", borderRadius: 14,
        border: `1px solid ${pathInfo.color}25`,
        background: `${pathInfo.color}06`,
        marginBottom: 32,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: pathInfo.color }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: pathInfo.color }}>{pathInfo.label}</div>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>
            {entryPath === "build" ? "We're building your store from scratch."
              : entryPath === "run" ? "We're managing your store's daily operations."
              : "We're auditing and fixing your store's performance issues."}
          </div>
        </div>
      </div>

      {/* ── Status Overview ── */}
      <div className="portalGrid2 portalGrid2Wide">
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.1s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Project status</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <StatusRow label="Intake status" value={pretty(intake.status)} />
            <StatusRow label="Planning call" value={callStatus} />
            <StatusRow label="Proposal" value={quoteStatus} />
            {quote?.estimate_fulfillment_model && (
              <StatusRow label="Service model" value={quote.estimate_fulfillment_model} />
            )}
          </div>
        </div>

        <div className="portalPanel fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">
              {quote ? "Your proposal" : "Proposal pending"}
            </h2>
          </div>

          {quote ? (
            <div style={{ display: "grid", gap: 12 }}>
              {quote.estimate_setup_fee != null && (
                <div style={{
                  padding: "16px 18px", borderRadius: 12,
                  border: "1px solid rgba(201,168,76,0.15)",
                  background: "rgba(201,168,76,0.04)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {entryPath === "build" ? "Build cost" : "Setup fee"}
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28, fontWeight: 600, color: "var(--fg)", marginTop: 4,
                  }}>
                    {money(quote.estimate_setup_fee)}
                  </div>
                </div>
              )}

              {quote.estimate_monthly_fee != null && (
                <div style={{
                  padding: "16px 18px", borderRadius: 12,
                  border: "1px solid rgba(93,202,165,0.15)",
                  background: "rgba(93,202,165,0.04)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#5DCAA5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Monthly operations
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28, fontWeight: 600, color: "var(--fg)", marginTop: 4,
                  }}>
                    {money(quote.estimate_monthly_fee)}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--muted)" }}>/mo</span>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                Proposal sent {fmtDate(quote.created_at)}
                {quote.updated_at && quote.updated_at !== quote.created_at
                  ? ` · Updated ${fmtDate(quote.updated_at)}`
                  : ""}
              </div>
            </div>
          ) : (
            <div style={{
              padding: "20px", borderRadius: 12,
              border: "1px dashed var(--stroke)", textAlign: "center",
              color: "var(--muted2)", fontSize: 14,
            }}>
              Your proposal is being prepared. We&apos;ll update this workspace
              once pricing and scope are ready.
            </div>
          )}
        </div>
      </div>

      {/* ── What you asked for ── */}
      {(intake.service_types || []).length > 0 && (
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.2s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">What you asked for</h2>
            <span className="portalPanelCount">{(intake.service_types || []).length} services</span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {(intake.service_types || []).map((svc) => (
              <div key={svc} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${pathInfo.color}18`,
                background: `${pathInfo.color}04`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: pathInfo.color, opacity: 0.5 }} />
                <span style={{ fontSize: 14, color: "var(--fg)" }}>{svc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Next Steps ── */}
      <div className="portalNote fadeUp" style={{ animationDelay: "0.25s" }}>
        <div className="portalNoteIcon">C</div>
        <div>
          <div className="portalNoteLabel">What happens next</div>
          <div className="portalNoteText">
            {phase === "intake" && "We'll review your intake and reach out to schedule a planning call. You'll hear from us within 24 hours."}
            {phase === "discovery" && "Your planning call is being coordinated. After the call, we'll draft a proposal with pricing, scope, and timeline."}
            {phase === "quote_review" && "Review the proposal above. Once you approve, we'll begin onboarding and start work immediately."}
            {phase === "onboarding" && "We're setting up your workspace and preparing the first batch of tasks. You'll see activity here soon."}
            {phase === "building" && entryPath === "build" && "We're building your store. You'll see a preview link here when the first version is ready for review."}
            {phase === "building" && entryPath !== "build" && "We're implementing optimizations. Each fix will be noted here as it goes live."}
            {phase === "operations" && "Operations are running. Check back monthly for performance summaries, or submit a request below if you need something updated."}
          </div>
        </div>
      </div>

      {/* ── Project Details (Drawers) ── */}
      <div className="portalSectionLabel fadeUp" style={{ marginTop: 8 }}>Project details</div>

      <Drawer label="Intake summary" value={fmtDate(intake.created_at)}>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Business</span><span className="portalDrawerVal">{intake.business_name || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Contact</span><span className="portalDrawerVal">{intake.contact_name || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Email</span><span className="portalDrawerVal">{intake.email || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Store URL</span><span className="portalDrawerVal">{intake.store_url || "Not provided"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Sales channels</span><span className="portalDrawerVal">{(intake.sales_channels || []).join(", ") || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Monthly orders</span><span className="portalDrawerVal">{intake.monthly_orders || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Peak volume</span><span className="portalDrawerVal">{intake.peak_orders || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Budget</span><span className="portalDrawerVal">{intake.budget_range || "—"}</span></div>
        <div className="portalDrawerRow"><span className="portalDrawerKey">Timeline</span><span className="portalDrawerVal">{intake.timeline || "—"}</span></div>
        {intake.notes && (
          <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--stroke)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Notes</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{intake.notes}</p>
          </div>
        )}
      </Drawer>

      {call && (
        <Drawer label="Planning call" value={pretty(call.status)}>
          <div className="portalDrawerRow"><span className="portalDrawerKey">Status</span><span className="portalDrawerVal">{pretty(call.status)}</span></div>
          <div className="portalDrawerRow"><span className="portalDrawerKey">Best time</span><span className="portalDrawerVal">{call.best_time_to_call || "—"}</span></div>
          <div className="portalDrawerRow"><span className="portalDrawerKey">Requested</span><span className="portalDrawerVal">{fmtDate(call.created_at)}</span></div>
          {call.notes && (
            <div className="portalDrawerRow"><span className="portalDrawerKey">Notes</span><span className="portalDrawerVal">{call.notes}</span></div>
          )}
        </Drawer>
      )}

      {quote && (
        <Drawer label="Agreement & deposit" value={
          quote.quote_json?.agreement_status === "accepted" ? "Accepted" : "Pending"
        }>
          <div style={{ display: "grid", gap: 12 }}>
            {/* Agreement section */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Agreement</div>
              {quote.quote_json?.agreement_status === "accepted" ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(93,202,165,0.08)", border: "1px solid rgba(93,202,165,0.2)",
                }}>
                  <span style={{ color: "#5DCAA5", fontWeight: 600, fontSize: 13 }}>Agreement accepted</span>
                  {quote.quote_json?.agreement_accepted_at && (
                    <span style={{ fontSize: 11, color: "var(--muted2)", marginLeft: "auto" }}>
                      {fmtDate(quote.quote_json.agreement_accepted_at)}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                    By accepting, you agree to the proposed scope and pricing outlined in the proposal above.
                  </p>
                  <button
                    className="btn btnPrimary"
                    disabled={saving}
                    onClick={() => applyAction({ type: "agreement_accept" })}
                    style={{ justifySelf: "start" }}
                  >
                    {saving ? "Saving..." : "Accept Agreement"}
                  </button>
                </>
              )}
            </div>

            {/* Deposit section */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Deposit</div>
              {quote.quote_json?.deposit_notice_sent_at ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(93,202,165,0.08)", border: "1px solid rgba(93,202,165,0.2)",
                }}>
                  <span style={{ color: "#5DCAA5", fontWeight: 600, fontSize: 13 }}>Deposit notice sent</span>
                  <span style={{ fontSize: 11, color: "var(--muted2)", marginLeft: "auto" }}>
                    {fmtDate(quote.quote_json.deposit_notice_sent_at)}
                  </span>
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                    Once you&apos;ve sent your deposit, let us know so we can begin work.
                  </p>
                  <button
                    className="btn btnGhost"
                    disabled={saving}
                    onClick={() => applyAction({ type: "deposit_notice_sent" })}
                    style={{ justifySelf: "start" }}
                  >
                    {saving ? "Saving..." : "I've sent the deposit"}
                  </button>
                </>
              )}
            </div>
          </div>
        </Drawer>
      )}

      <Drawer label="Actions" value="Get help">
        <div style={{ display: "grid", gap: 8, padding: "4px 0" }}>
          <Link href={`/ecommerce/book?ecomIntakeId=${encodeURIComponent(intake.id)}`}
            className="btn btnGhost" style={{ justifyContent: "flex-start" }}>
            Book / update planning call
          </Link>
          <Link href="/contact" className="btn btnGhost" style={{ justifyContent: "flex-start" }}>
            Contact support
          </Link>
        </div>
      </Drawer>

      {/* ── Footer ── */}
      <div className="portalFooter">
        Powered by <a href="/">Crecy Studio</a> · Your store, your ownership
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function StatusRow({ label, value }: { label: string; value: string }) {
  const isPositive = ["paid", "accepted", "active", "live", "completed", "scheduled"].includes(value.toLowerCase());
  const isPending = ["pending", "new", "requested", "sent", "review"].includes(value.toLowerCase());
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
        color: isPositive ? "#5DCAA5" : isPending ? "var(--accent)" : "var(--muted2)",
      }}>
        {value}
      </span>
    </div>
  );
}
