"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { EcommerceWorkspaceBundle } from "@/lib/ecommerce/workspace";

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function money(v?: number | null) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function pretty(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getStory(mode: string, phase: string) {
  const m = String(mode).toLowerCase();
  const p = String(phase).toLowerCase();

  if (m === "build") {
    if (p.includes("launch")) return { headline: "almost ready to launch", body: "Your storefront is in final review. Use this workspace to track approvals, required assets, and launch readiness." };
    if (p.includes("build")) return { headline: "being built", body: "We’re assembling your storefront, loading products, and preparing launch details. Your milestones and deliverables are below." };
    if (p.includes("proposal")) return { headline: "ready for proposal review", body: "We’ve scoped the store build and placed the proposal in this workspace so you can review the path to launch." };
    return { headline: "getting started", body: "We’ve received your build request. Next step is discovery, assets, and final scope alignment." };
  }

  if (m === "fix") {
    if (p.includes("testing") || p.includes("qa")) return { headline: "being validated", body: "We’ve implemented the highest-priority fixes and are validating the new experience before closing the project." };
    if (p.includes("build") || p.includes("fix") || p.includes("work")) return { headline: "being repaired", body: "We’re working through the improvement plan. This workspace shows what was found, what is being fixed, and what is next." };
    return { headline: "under review", body: "We’re diagnosing the store issues and turning them into a clear repair plan." };
  }

  if (p.includes("active") || p.includes("operations") || p.includes("report")) {
    return { headline: "being managed", body: "Your e-commerce operations are active. This workspace is where you track current priorities, issues, and monthly performance." };
  }

  if (p.includes("onboarding")) {
    return { headline: "being onboarded", body: "We’ve aligned on the service path and are setting up the recurring operating rhythm for your store." };
  }

  return { headline: "getting set up", body: "We’re defining the operating model, priorities, and reporting structure for your store." };
}

function statusTone(value: string) {
  const v = String(value || "").toLowerCase();
  if (["done", "approved", "accepted", "live", "completed", "paid"].includes(v)) {
    return { color: "#5DCAA5", bg: "rgba(46,160,67,0.08)", border: "rgba(46,160,67,0.22)" };
  }
  if (["building", "in_progress", "review", "sent", "scheduled", "testing", "planned"].includes(v)) {
    return { color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.22)" };
  }
  return { color: "#8da4ff", bg: "rgba(141,164,255,0.08)", border: "rgba(141,164,255,0.22)" };
}

function Drawer({ label, value, children, defaultOpen = false }: { label: string; value: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button className="portalDrawerToggle" onClick={() => setOpen(!open)}>
        <span className="portalDrawerToggleLabel">{label}</span>
        <span className="portalDrawerToggleValue">{value}<span className={`portalDrawerArrow ${open ? "portalDrawerArrowOpen" : ""}`}>▾</span></span>
      </button>
      <div className={`portalDrawerContent ${open ? "portalDrawerContentOpen" : ""}`}>{children}</div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="portalDrawerRow">
      <span className="portalDrawerKey">{label}</span>
      <span className="portalDrawerVal">{value}</span>
    </div>
  );
}

function ItemList({ items }: { items: Array<{ id: string; title: string; status: string; notes: string }> }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => {
        const tone = statusTone(item.status);
        return (
          <div key={item.id} style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ color: "var(--fg)", fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <span style={{ padding: "4px 8px", borderRadius: 999, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{pretty(item.status)}</span>
            </div>
            {item.notes ? <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13, lineHeight: 1.55 }}>{item.notes}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function EcomPortalClient({ data }: { data: EcommerceWorkspaceBundle }) {
  const [bundle, setBundle] = useState(data);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { intake, quote, call, workspace } = bundle;
  const story = useMemo(() => getStory(workspace.mode, workspace.phase), [workspace.mode, workspace.phase]);

  const refreshWorkspace = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/ecommerce/${intake.id}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Refresh failed.");
      setBundle(json.data as EcommerceWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }, [intake.id]);

  const applyAction = useCallback(async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/ecommerce/${intake.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Action failed.");
      setBundle(json.data as EcommerceWorkspaceBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  }, [intake.id]);

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <div className="portalStory heroFadeUp">
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          E-commerce · {pretty(workspace.mode)} lane
        </div>

        <h1 className="portalStoryHeadline">
          Your store is <em>{story.headline}</em>
        </h1>
        <p className="portalStoryBody">{story.body}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {workspace.previewUrl ? (
            <a href={workspace.previewUrl} target="_blank" rel="noreferrer" className="portalStoryCta">
              Open preview <span className="portalStoryCtaArrow">→</span>
            </a>
          ) : null}
          {workspace.productionUrl ? (
            <a href={workspace.productionUrl} target="_blank" rel="noreferrer" className="btn btnGhost" style={{ fontSize: 13 }}>
              Visit live store
            </a>
          ) : null}
          <button className="btn btnGhost" disabled={refreshing} onClick={refreshWorkspace} style={{ fontSize: 13 }}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link href="/portal" className="btn btnGhost" style={{ fontSize: 13 }}>Back to portal</Link>
        </div>

        <div className="portalStoryMeta">
          <span className="portalStoryMetaItem">{intake.business_name || "E-commerce project"}</span>
          <span className="portalStoryMetaItem">Started {fmtDate(intake.created_at)}</span>
          <span className="portalStoryMetaItem">Phase: {pretty(workspace.phase)}</span>
          <span className="portalStoryMetaItem">Waiting on: {workspace.waitingOn}</span>
        </div>
      </div>

      {error ? <div className="portalError">{error}</div> : null}

      {workspace.adminPublicNote ? (
        <div className="portalNote fadeUp">
          <div className="portalNoteIcon">C</div>
          <div>
            <div className="portalNoteLabel">Note from the studio</div>
            <div className="portalNoteText">{workspace.adminPublicNote}</div>
          </div>
        </div>
      ) : null}

      <div className="portalGrid2 portalGrid2Wide">
        <div className="portalPanel fadeUp" style={{ animationDelay: "0.1s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Workspace overview</h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <Row label="Service path" value={pretty(workspace.mode)} />
            <Row label="Current phase" value={pretty(workspace.phase)} />
            <Row label="Planning call" value={pretty(call?.status || "not requested")} />
            <Row label="Quote status" value={pretty(quote?.status || "not started")} />
            <Row label="Waiting on" value={workspace.waitingOn} />
          </div>
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Service summary</div>
            <div style={{ color: "var(--fg)", fontWeight: 700 }}>{workspace.serviceSummary}</div>
            {workspace.onboardingSummary ? <div style={{ marginTop: 6, color: "var(--muted)", lineHeight: 1.6, fontSize: 13 }}>{workspace.onboardingSummary}</div> : null}
          </div>
        </div>

        <div className="portalPanel fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Proposal + service pricing</h2>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <MetricCard label={workspace.mode === "run" ? "Setup fee" : "Project fee"} value={money(quote?.estimate_setup_fee)} />
              <MetricCard label="Monthly fee" value={money(quote?.estimate_monthly_fee)} />
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Fulfillment / service model</div>
              <div style={{ color: "var(--fg)", fontWeight: 700 }}>{quote?.estimate_fulfillment_model || "To be confirmed"}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted2)" }}>Last updated {fmtDate(quote?.updated_at || quote?.created_at)}</div>
          </div>
        </div>
      </div>

      {workspace.deliverables.length > 0 ? (
        <div className="portalPanel fadeUp" style={{ marginBottom: 24 }}>
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Deliverables</h2>
            <span className="portalPanelCount">{workspace.deliverables.length}</span>
          </div>
          <ItemList items={workspace.deliverables} />
        </div>
      ) : null}

      <div className="portalGrid2">
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Milestones</h2>
            <span className="portalPanelCount">{workspace.milestones.length}</span>
          </div>
          <ItemList items={workspace.milestones} />
        </div>

        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">Current tasks</h2>
            <span className="portalPanelCount">{workspace.tasks.length}</span>
          </div>
          <ItemList items={workspace.tasks} />
        </div>
      </div>

      {(workspace.assetsNeeded.length > 0 || workspace.approvals.length > 0) ? (
        <div className="portalGrid2">
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">Assets / info needed</h2>
            </div>
            <ItemList items={workspace.assetsNeeded} />
          </div>
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">Approvals needed</h2>
            </div>
            <ItemList items={workspace.approvals} />
          </div>
        </div>
      ) : null}

      {(workspace.metrics.length > 0 || workspace.issues.length > 0) ? (
        <div className="portalGrid2">
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">Tracked metrics</h2>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {workspace.metrics.map((metric) => (
                <div key={metric.id} style={{ border: "1px solid var(--stroke)", background: "var(--panel2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ color: "var(--fg)", fontWeight: 700 }}>{metric.label}</div>
                    <div style={{ color: "var(--accent)", fontWeight: 700 }}>{metric.value || "—"}</div>
                  </div>
                  <div style={{ marginTop: 4, color: "var(--muted2)", fontSize: 12 }}>Target: {metric.target || "—"}</div>
                  {metric.notes ? <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{metric.notes}</div> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">Open issues / requests</h2>
            </div>
            <ItemList items={[...workspace.issues, ...workspace.requests]} />
          </div>
        </div>
      ) : null}

      {(workspace.monthlyPlan.length > 0 || workspace.nextActions.length > 0) ? (
        <div className="portalGrid2">
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">Monthly plan</h2></div>
            <SimpleList items={workspace.monthlyPlan} empty="No monthly plan added yet." />
          </div>
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">Next actions</h2></div>
            <SimpleList items={workspace.nextActions} empty="No next actions listed yet." />
          </div>
        </div>
      ) : null}

      <Drawer label="Agreement & deposit" value={pretty(workspace.depositStatus || workspace.agreementStatus || "pending")}>
        <Row label="Agreement status" value={pretty(workspace.agreementStatus || "pending")} />
        <Row label="Accepted" value={fmtDate(workspace.agreementAcceptedAt)} />
        <Row label="Deposit status" value={pretty(workspace.depositStatus || "pending")} />
        <Row label="Deposit amount" value={money(workspace.depositAmount)} />
        <Row label="Paid at" value={fmtDate(workspace.depositPaidAt)} />
        {workspace.agreementText ? (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--panel2)", whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--muted)", fontSize: 13 }}>{workspace.agreementText}</div>
        ) : null}
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {workspace.agreementStatus !== "accepted" ? (
            <button className="btn btnPrimary" disabled={saving} onClick={() => applyAction({ type: "agreement_accept" })}>
              {saving ? "Saving..." : "Accept agreement"}
            </button>
          ) : null}
          {workspace.agreementStatus === "accepted" && !workspace.depositUrl && workspace.depositStatus !== "paid" ? (
            <button className="btn btnGhost" disabled={saving} onClick={() => applyAction({ type: "ensure_deposit_link" })}>
              {saving ? "Preparing..." : "Prepare deposit payment"}
            </button>
          ) : null}
          {workspace.depositUrl && workspace.depositStatus !== "paid" ? (
            <a className="btn btnPrimary" href={workspace.depositUrl} target="_blank" rel="noreferrer">
              Pay deposit <span className="btnArrow">→</span>
            </a>
          ) : null}
        </div>
      </Drawer>

      <Drawer label="Project details" value={pretty(workspace.mode)}>
        <Row label="Business" value={intake.business_name || "—"} />
        <Row label="Contact" value={intake.contact_name || "—"} />
        <Row label="Email" value={intake.email || "—"} />
        <Row label="Store URL" value={workspace.productionUrl || intake.store_url || "—"} />
        <Row label="Sales channels" value={(intake.sales_channels || []).join(", ") || "—"} />
        <Row label="Monthly orders" value={intake.monthly_orders || "—"} />
        <Row label="Timeline" value={intake.timeline || "—"} />
        <Row label="Budget" value={intake.budget_range || "—"} />
      </Drawer>

      <div className="portalFooter">
        Powered by <a href="/">Crecy Studio</a> · Your store, your workspace
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ marginTop: 4, color: "var(--fg)", fontWeight: 800, fontSize: 24 }}>{value}</div>
    </div>
  );
}

function SimpleList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <div className="smallNote">{empty}</div>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => (
        <div key={item} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--panel2)", color: "var(--muted)", fontSize: 13, lineHeight: 1.55 }}>{item}</div>
      ))}
    </div>
  );
}
