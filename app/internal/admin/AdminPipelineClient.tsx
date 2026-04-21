"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INTERNAL_HOURLY_RATE } from "@/lib/pricing/config";

/* ═══════════════════════════════════
   TYPES
   ═══════════════════════════════════ */

type PieView = {
  exists: boolean;
  id: string | null;
  score: number | null;
  tier: string | null;
  summary: string;
};

type PortalAdminView = {
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

export type PipelineRow = {
  quoteId: string;
  createdAt: string;
  status: string;
  tier: string;
  leadEmail: string;
  leadName: string;
  estimate: { target: number; min: number; max: number };
  estimateFormatted: { target: string; min: string; max: string };
  pie: PieView;
  adminPricing: {
    discountPercent: number;
    flatAdjustment: number;
    hourlyRate: number;
    notes: string;
  };
  portalAdmin: PortalAdminView;
  proposalText: string;
  links?: { detail?: string; workspace?: string };
};

/* ═══════════════════════════════════
   HELPERS
   ═══════════════════════════════════ */

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pretty(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function adjustedTarget(row: PipelineRow) {
  const base = row.estimate.target || 0;
  const discounted = Math.round(base * (1 - (row.adminPricing?.discountPercent || 0) / 100));
  return discounted + (row.adminPricing?.flatAdjustment || 0);
}

const STATUS_ORDER = ["new", "call_requested", "call", "proposal", "deposit", "active", "closed"];
const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new: { label: "New", color: "#8da4ff", bg: "rgba(141,164,255,0.08)", border: "rgba(141,164,255,0.2)" },
  call_requested: { label: "Call Req", color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.2)" },
  call: { label: "Call", color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.2)" },
  proposal: { label: "Proposal", color: "#dfc06a", bg: "rgba(223,192,106,0.08)", border: "rgba(223,192,106,0.2)" },
  deposit: { label: "Deposit", color: "#dfc06a", bg: "rgba(223,192,106,0.08)", border: "rgba(223,192,106,0.2)" },
  active: { label: "Active", color: "#5DCAA5", bg: "rgba(46,160,67,0.08)", border: "rgba(46,160,67,0.2)" },
  closed: { label: "Closed", color: "#9a9690", bg: "rgba(154,150,144,0.08)", border: "rgba(154,150,144,0.2)" },
  closed_won: { label: "Won", color: "#5DCAA5", bg: "rgba(46,160,67,0.08)", border: "rgba(46,160,67,0.2)" },
};

function statusMeta(status: string) {
  return STATUS_META[status] || STATUS_META.new;
}

function pieTone(score: number | null) {
  if (score == null) return { color: "var(--muted-2)", label: "—" };
  if (score >= 80) return { color: "#5DCAA5", label: "Strong" };
  if (score >= 60) return { color: "#c9a84c", label: "Good" };
  if (score >= 40) return { color: "#dfc06a", label: "Fair" };
  return { color: "#F09595", label: "Low" };
}

/* ═══════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════ */

function PieRing({ score, size = 40 }: { score: number | null; size?: number }) {
  const tone = pieTone(score);
  const r = (size - 6) / 2;
  const c = Math.PI * 2 * r;
  const pct = score != null ? score / 100 : 0;
  const offset = c - c * pct;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule)" strokeWidth="3" />
      {score != null && (
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={tone.color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transform: `rotate(-90deg)`, transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.8s ease" }}
        />
      )}
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
        fill={tone.color} fontSize={size > 36 ? 11 : 9} fontWeight="600" fontFamily="DM Sans">
        {score != null ? score : "—"}
      </text>
    </svg>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="productCard productCardPad" style={{ background: "var(--paper-2)", flex: "1 1 0" }}>
      <div className="fieldLabel" style={{ marginBottom: 0 }}>
        {label}
      </div>
      <div className="productLaneCount" style={{ marginTop: 6 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
      background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color,
    }}>
      {meta.label}
    </span>
  );
}

function StageCounts({ rows }: { rows: PipelineRow[] }) {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const s = r.status || "new";
    counts[s] = (counts[s] || 0) + 1;
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {STATUS_ORDER.map((s) => {
        const c = counts[s] || 0;
        if (c === 0) return null;
        const meta = statusMeta(s);
        return (
          <div key={s} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: 8,
            background: meta.bg, border: `1px solid ${meta.border}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{c}</span>
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
}

/* ═══════════════════════════════════
   EXPANDABLE SECTIONS
   ═══════════════════════════════════ */

function AdminSection({ title, hint, children, defaultOpen = false }: {
  title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="productCard" style={{ marginTop: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 18px", background: "none", border: "none",
          fontFamily: "'DM Sans', sans-serif", color: "var(--ink)", cursor: "pointer",
        }}
      >
        <div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          {hint && <span style={{ fontSize: 12, color: "var(--muted-2)", marginLeft: 10 }}>{hint}</span>}
        </div>
        <span style={{ color: "var(--muted-2)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--rule)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */

export default function AdminPipelineClient({ initialRows }: { initialRows: PipelineRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<PipelineRow[]>(initialRows ?? []);
  const [busyByQuote, setBusyByQuote] = useState<Record<string, boolean>>({});
  const [messageByQuote, setMessageByQuote] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    let next = [...rows];
    const q = search.toLowerCase().trim();
    if (q) {
      next = next.filter((r) =>
        (r.leadEmail || "").toLowerCase().includes(q) ||
        (r.leadName || "").toLowerCase().includes(q) ||
        (r.quoteId || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      next = next.filter((r) => r.status === statusFilter);
    }
    return next;
  }, [rows, search, statusFilter]);

  /* ── Metrics ── */
  const metrics = useMemo(() => {
    const active = rows.filter((r) => ["active", "deposit", "proposal"].includes(r.status));
    const totalPipeline = active.reduce((sum, r) => sum + adjustedTarget(r), 0);
    const activeCount = rows.filter((r) => r.status === "active").length;
    const needsAction = rows.filter((r) =>
      r.status === "new" || (r.status === "call_requested" && !r.pie?.exists)
    ).length;
    const avgPie = rows.filter((r) => r.pie?.score != null);
    const avgScore = avgPie.length
      ? Math.round(avgPie.reduce((s, r) => s + (r.pie.score || 0), 0) / avgPie.length)
      : null;
    return { totalPipeline, activeCount, needsAction, avgScore, total: rows.length };
  }, [rows]);

  /* ── Actions ── */
  function updateRowLocal(quoteId: string, updater: (row: PipelineRow) => PipelineRow) {
    setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? updater(r) : r)));
  }

  async function generatePie(quoteId: string) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [quoteId]: "Analyzing lead with AI..." }));
    try {
      const res = await fetch("/api/internal/pie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, force: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to generate PIE");
      setMessageByQuote((m) => ({ ...m, [quoteId]: "PIE generated. Refreshing..." }));
      router.refresh();
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  async function saveQuoteAdmin(quoteId: string, payload: any) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [quoteId]: "Saving..." }));
    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? { ...r, ...payload } : r)));
      setMessageByQuote((m) => ({ ...m, [quoteId]: "Saved." }));
      router.refresh();
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Save failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  const statusOptions = ["new", "call_requested", "call", "proposal", "deposit", "active", "closed"];
  const previewStatusOptions = ["Awaiting published preview", "Ready for review", "Revision in progress", "Approved for launch", "Live"];
  const reviewStatusOptions = ["Preview pending", "Pending review", "Changes requested", "Approved", "Live"];
  const agreementStatusOptions = ["Not published yet", "Pre-draft / agreement stage", "Published to client", "Signed", "Kickoff ready"];
  const ownershipOptions = ["Managed with project handoff options", "Client-owned / handoff"];
  const launchStatusOptions = ["Not ready", "Pre-launch", "Ready for launch", "Live"];
  const readinessOptions = ["Pending", "In progress", "Ready", "Complete"];

  /* ═══════════════════════════════════
     RENDER
     ═══════════════════════════════════ */

  return (
    <div style={{ marginTop: 18 }}>

      {/* ── Metrics Bar ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <MetricCard label="Pipeline value" value={money(metrics.totalPipeline)} sub={`${metrics.total} total quotes`} />
        <MetricCard label="Active projects" value={String(metrics.activeCount)} />
        <MetricCard label="Needs attention" value={String(metrics.needsAction)} sub="New or missing PIE" />
        <MetricCard label="Avg PIE score" value={metrics.avgScore != null ? String(metrics.avgScore) : "—"} />
      </div>

      {/* ── Stage Counts ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, flexWrap: "wrap", marginBottom: 16,
      }}>
        <StageCounts rows={rows} />
        <div style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 600 }}>
          Showing {filteredRows.length} of {rows.length}
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap",
        alignItems: "center",
      }}>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or ID..."
          style={{ maxWidth: 320, fontSize: 14 }}
        />
        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 180, fontSize: 14 }}
        >
          <option value="all">All stages</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{pretty(s)}</option>
          ))}
        </select>
      </div>

      {/* ── Quote Cards ── */}
      <div style={{ display: "grid", gap: 12 }}>
        {filteredRows.map((row) => {
          const isBusy = !!busyByQuote[row.quoteId];
          const isExpanded = !!expanded[row.quoteId];
          const adj = adjustedTarget(row);
          const meta = statusMeta(row.status);
          const pt = pieTone(row.pie?.score ?? null);

          return (
            <div
              key={row.quoteId}
              style={{
                background: "var(--paper)",
                border: `1px solid ${isExpanded ? "var(--rule-2)" : "var(--rule)"}`,
                borderRadius: 16,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* ── Card Header ── */}
              <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 16, alignItems: "start" }}>

                {/* Left: Identity */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 19, fontWeight: 500, color: "var(--ink)",
                      letterSpacing: "-0.02em",
                    }}>
                      {row.leadName}
                    </span>
                    <StatusPill status={row.status} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{row.leadEmail}</span>
                    <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(row.createdAt)}</span>
                    <span style={{ fontSize: 12, color: "var(--muted-2)" }}>#{row.quoteId.slice(0, 8)}</span>
                  </div>

                  {/* Compact info row */}
                  <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {/* PIE Ring */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <PieRing score={row.pie?.score ?? null} size={34} />
                      <div>
                        <div style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>PIE</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: pt.color }}>{row.pie?.exists ? pt.label : "Missing"}</div>
                      </div>
                    </div>

                    <div style={{ width: 1, height: 28, background: "var(--rule)" }} />

                    {/* Tier */}
                    <div>
                      <div style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Tier</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{row.tier || "—"}</div>
                    </div>

                    <div style={{ width: 1, height: 28, background: "var(--rule)" }} />

                    {/* Preview */}
                    <div>
                      <div style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Preview</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{row.portalAdmin.previewStatus.split(" ").slice(0, 2).join(" ")}</div>
                    </div>

                    <div style={{ width: 1, height: 28, background: "var(--rule)" }} />

                    {/* Launch */}
                    <div>
                      <div style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Launch</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: row.portalAdmin.launchStatus === "Live" ? "#5DCAA5" : "var(--muted)" }}>
                        {row.portalAdmin.launchStatus}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Price + Actions */}
                <div style={{ textAlign: "right", minWidth: 140 }}>
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 26, fontWeight: 600, color: "var(--ink)",
                    letterSpacing: "-0.02em",
                  }}>
                    {money(adj)}
                  </div>
                  {adj !== row.estimate.target && row.estimate.target > 0 && (
                    <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>
                      Base {row.estimateFormatted.target}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {row.links?.workspace && (
                      <Link href={row.links.workspace} className="btn btnPrimary" style={{ fontSize: 12, padding: "7px 14px" }}>
                        Workspace →
                      </Link>
                    )}
                    {row.links?.detail && (
                      <Link href={row.links.detail} className="btn btnGhost" style={{ fontSize: 12, padding: "7px 14px" }}>
                        Control
                      </Link>
                    )}
                    <button
                      className="btn btnGhost"
                      style={{ fontSize: 12, padding: "7px 14px" }}
                      onClick={() => setExpanded((m) => ({ ...m, [row.quoteId]: !m[row.quoteId] }))}
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── PIE Summary (always visible if exists) ── */}
              {row.pie?.exists && row.pie.summary && (
                <div style={{
                  padding: "0 22px 14px",
                  fontSize: 13, color: "var(--muted)", lineHeight: 1.55,
                  borderTop: "1px solid var(--rule)",
                  paddingTop: 12,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8 }}>
                    PIE
                  </span>
                  {row.pie.summary.length > 200 ? row.pie.summary.slice(0, 200) + "…" : row.pie.summary}
                </div>
              )}

              {/* ── Expanded Sections ── */}
              {isExpanded && (
                <div style={{ padding: "0 22px 22px", borderTop: "1px solid var(--rule)" }}>

                  {/* PIE Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button
                      className="btn btnGhost"
                      disabled={isBusy}
                      onClick={() => generatePie(row.quoteId)}
                      style={{ fontSize: 12, padding: "7px 14px" }}
                    >
                      {row.pie?.exists ? "Refresh PIE" : "Generate PIE"} →
                    </button>
                  </div>

                  {/* Pipeline & Pricing */}
                  <AdminSection title="Pipeline & pricing" hint="Status, discounts, hourly rate" defaultOpen>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
                      <label>
                        <span className="fieldLabel">Status</span>
                        <select className="select" value={row.status}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, status: e.target.value }))}>
                          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="fieldLabel">Discount %</span>
                        <input className="input" type="number" value={row.adminPricing?.discountPercent ?? 0}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({
                            ...r, adminPricing: { ...r.adminPricing, discountPercent: Number(e.target.value || 0) },
                          }))} />
                      </label>
                      <label>
                        <span className="fieldLabel">Adjustment ($)</span>
                        <input className="input" type="number" value={row.adminPricing?.flatAdjustment ?? 0}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({
                            ...r, adminPricing: { ...r.adminPricing, flatAdjustment: Number(e.target.value || 0) },
                          }))} />
                      </label>
                      <label>
                        <span className="fieldLabel">Hourly rate</span>
                        <input className="input" type="number" value={row.adminPricing?.hourlyRate ?? INTERNAL_HOURLY_RATE}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({
                            ...r, adminPricing: { ...r.adminPricing, hourlyRate: Number(e.target.value || INTERNAL_HOURLY_RATE) },
                          }))} />
                      </label>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn btnGhost" disabled={isBusy} style={{ fontSize: 12, padding: "7px 14px" }}
                        onClick={() => saveQuoteAdmin(row.quoteId, { status: row.status, adminPricing: row.adminPricing })}>
                        Save config
                      </button>
                    </div>
                  </AdminSection>

                  {/* Workspace Publishing */}
                  <AdminSection title="Workspace publishing" hint="Preview, agreement, launch">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                      <label>
                        <span className="fieldLabel">Preview URL</span>
                        <input className="input" value={row.portalAdmin.previewUrl} placeholder="https://preview.vercel.app"
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, previewUrl: e.target.value } }))} />
                      </label>
                      <label>
                        <span className="fieldLabel">Production URL</span>
                        <input className="input" value={row.portalAdmin.productionUrl} placeholder="https://clientsite.com"
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, productionUrl: e.target.value } }))} />
                      </label>
                      <label>
                        <span className="fieldLabel">Preview status</span>
                        <select className="select" value={row.portalAdmin.previewStatus}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, previewStatus: e.target.value } }))}>
                          {previewStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="fieldLabel">Client review</span>
                        <select className="select" value={row.portalAdmin.clientReviewStatus}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, clientReviewStatus: e.target.value } }))}>
                          {reviewStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="fieldLabel">Agreement</span>
                        <select className="select" value={row.portalAdmin.agreementStatus}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, agreementStatus: e.target.value } }))}>
                          {agreementStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="fieldLabel">Ownership</span>
                        <select className="select" value={row.portalAdmin.ownershipModel}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, ownershipModel: e.target.value } }))}>
                          {ownershipOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="fieldLabel">Launch status</span>
                        <select className="select" value={row.portalAdmin.launchStatus}
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, launchStatus: e.target.value } }))}>
                          {launchStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="fieldLabel">Agreement model</span>
                        <input className="input" value={row.portalAdmin.agreementModel} placeholder="Managed build agreement"
                          onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, agreementModel: e.target.value } }))} />
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 12 }}>
                      {(["domainStatus", "analyticsStatus", "formsStatus", "seoStatus", "handoffStatus"] as const).map((key) => (
                        <label key={key}>
                          <span className="fieldLabel">{key.replace("Status", "")}</span>
                          <select className="select" value={row.portalAdmin[key]}
                            onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, [key]: e.target.value } }))}>
                            {readinessOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>

                    <label style={{ display: "block", marginTop: 12 }}>
                      <span className="fieldLabel">Preview notes</span>
                      <textarea className="textarea" rows={3} value={row.portalAdmin.previewNotes} placeholder="What should the client review?"
                        onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, previewNotes: e.target.value } }))} />
                    </label>

                    <label style={{ display: "block", marginTop: 12 }}>
                      <span className="fieldLabel">Launch notes</span>
                      <textarea className="textarea" rows={3} value={row.portalAdmin.launchNotes} placeholder="Domain, analytics, handoff notes..."
                        onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, portalAdmin: { ...r.portalAdmin, launchNotes: e.target.value } }))} />
                    </label>

                    <div style={{ marginTop: 12 }}>
                      <button className="btn btnPrimary" disabled={isBusy} style={{ fontSize: 12, padding: "7px 14px" }}
                        onClick={() => saveQuoteAdmin(row.quoteId, { portalAdmin: row.portalAdmin })}>
                        Publish to workspace →
                      </button>
                    </div>
                  </AdminSection>

                  {/* Proposal */}
                  <AdminSection title="Proposal draft">
                    <label style={{ display: "block", marginTop: 14 }}>
                      <textarea className="textarea" rows={6} value={row.proposalText || ""} placeholder="Draft proposal here..."
                        onChange={(e) => updateRowLocal(row.quoteId, (r) => ({ ...r, proposalText: e.target.value }))} />
                    </label>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btnGhost" disabled={isBusy} style={{ fontSize: 12, padding: "7px 14px" }}
                        onClick={() => saveQuoteAdmin(row.quoteId, { proposalText: row.proposalText })}>
                        Save draft
                      </button>
                      <button className="btn btnGhost" style={{ fontSize: 12, padding: "7px 14px" }}
                        onClick={() => navigator.clipboard.writeText(row.proposalText || "")}>
                        Copy
                      </button>
                    </div>
                  </AdminSection>

                  {/* Status message */}
                  {messageByQuote[row.quoteId] && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                      {messageByQuote[row.quoteId]}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredRows.length === 0 && (
        <div style={{
          textAlign: "center", padding: 48, color: "var(--muted-2)",
          border: "1px dashed var(--rule)", borderRadius: 16, marginTop: 8,
        }}>
          No quotes match your current filters
        </div>
      )}
    </div>
  );
}
