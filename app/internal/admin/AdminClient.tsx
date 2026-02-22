// app/internal/admin/AdminClient.tsx
"use client";

import { useMemo, useState } from "react";

type AnyObj = Record<string, any>;

type Item = AnyObj;

const PIPELINE_OPTIONS = ["new", "call", "proposal", "deposit", "active"] as const;

function toObj(v: any): AnyObj {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function parsePieReport(pie: any): AnyObj {
  if (!pie) return {};
  return toObj(pie.report);
}

function getAdminV15(item: Item): AnyObj {
  const debug = toObj(item?.debug);
  return toObj(debug.admin_v15);
}

function inferPipeline(item: Item): string {
  const admin = getAdminV15(item);
  if (typeof admin.pipelineStatus === "string" && admin.pipelineStatus.trim()) {
    return admin.pipelineStatus;
  }

  // fallback mapping from quote/call statuses
  const quoteStatus = String(item?.status ?? "").toLowerCase();
  if (quoteStatus === "call_requested") return "call";

  const callStatus = String(item?._callRequest?.status ?? "").toLowerCase();
  if (callStatus === "new" || callStatus === "scheduled") return "call";

  return "new";
}

function fmtCurrency(v: any): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(v: any): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function getLeadEmail(item: Item): string {
  return (
    item?._lead?.email ||
    item?.email ||
    item?.scope_snapshot?.contact?.email ||
    item?.scope_snapshot?.email ||
    "—"
  );
}

function getLeadName(item: Item): string {
  return (
    item?._lead?.name ||
    item?._lead?.full_name ||
    item?.scope_snapshot?.contact?.name ||
    item?.scope_snapshot?.name ||
    item?.business_name ||
    ""
  );
}

function getTierLabel(item: Item, pieReport: AnyObj): string {
  return (
    pieReport?.tier ||
    item?.tier_recommended ||
    item?.scope_snapshot?.tier ||
    "—"
  );
}

function getPieEffort(pie: AnyObj) {
  const effort = toObj(pie?.effort);
  const timeline = toObj(pie?.timeline);
  const build = toObj(pie?.build_plan);

  const hours =
    Number(effort.estimated_hours) ||
    Number(effort.hours) ||
    Number(build.total_hours_estimate) ||
    null;

  const hourlyRate =
    Number(effort.hourly_rate) ||
    Number(effort.rate_per_hour) ||
    Number(build.hourly_rate) ||
    40;

  const laborAtRate =
    Number(effort.labor_at_hourly_rate) ||
    (hours ? Math.round(hours * hourlyRate) : null);

  const days =
    Number(timeline.estimated_days) ||
    Number(timeline.days) ||
    Number(build.estimated_days) ||
    null;

  const weeks =
    Number(timeline.estimated_weeks) ||
    Number(timeline.weeks) ||
    Number(build.estimated_weeks) ||
    null;

  return { hours, hourlyRate, laborAtRate, days, weeks };
}

function extractList(value: any): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x)).filter(Boolean);
  return [];
}

function getPricingFromPie(item: Item, pie: AnyObj) {
  const pricing = toObj(pie?.pricing);

  const target =
    Number(pricing.target) ||
    Number(pricing.recommended) ||
    Number(item?.estimated_total) ||
    null;

  const min =
    Number(pricing.minimum) ||
    Number(pricing.floor) ||
    Number(item?.estimated_low) ||
    null;

  const max =
    Number(pricing.maximum) ||
    Number(pricing.ceiling) ||
    Number(item?.estimated_high) ||
    null;

  return { target, min, max };
}

function safeNum(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeAdjustedTarget(baseTarget: number | null, adjustments: AnyObj) {
  const customTarget = safeNum(adjustments?.customTarget);
  if (customTarget !== null) return Math.round(customTarget);

  if (baseTarget === null) return null;

  let result = baseTarget;
  const discountPct = safeNum(adjustments?.discountPct);
  const discountAmount = safeNum(adjustments?.discountAmount);
  const increaseAmount = safeNum(adjustments?.increaseAmount);

  if (discountPct !== null) result = result - result * (discountPct / 100);
  if (discountAmount !== null) result = result - discountAmount;
  if (increaseAmount !== null) result = result + increaseAmount;

  return Math.max(0, Math.round(result));
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        borderRadius: 14,
        borderColor: "rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div className="cardInner" style={{ padding: 14 }}>
        <div
          style={{
            fontWeight: 900,
            fontSize: 13,
            marginBottom: 8,
            color: "rgba(255,255,255,0.88)",
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems ?? []);
  const [search, setSearch] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [savingAdjustId, setSavingAdjustId] = useState<string | null>(null);
  const [generatingProposalId, setGeneratingProposalId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  // local form state keyed by quoteId
  const [drafts, setDrafts] = useState<Record<string, AnyObj>>(() => {
    const init: Record<string, AnyObj> = {};
    for (const item of initialItems ?? []) {
      const admin = getAdminV15(item);
      init[item.id] = {
        pipelineStatus: inferPipeline(item),
        pricingAdjustments: {
          discountPct: admin?.pricingAdjustments?.discountPct ?? "",
          discountAmount: admin?.pricingAdjustments?.discountAmount ?? "",
          increaseAmount: admin?.pricingAdjustments?.increaseAmount ?? "",
          customTarget: admin?.pricingAdjustments?.customTarget ?? "",
          note: admin?.pricingAdjustments?.note ?? "",
        },
        proposalDraft:
          typeof admin?.proposalDraft === "string" ? admin.proposalDraft : "",
      };
    }
    return init;
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const pie = parsePieReport(item._pie);
      const admin = getAdminV15(item);
      const pipeline = drafts[item.id]?.pipelineStatus || admin.pipelineStatus || inferPipeline(item);

      if (pipelineFilter !== "all" && pipeline !== pipelineFilter) return false;

      if (!q) return true;

      const hay = [
        item.id,
        getLeadEmail(item),
        getLeadName(item),
        item.business_name,
        item.project_kind,
        item.selected_platform,
        item.timeline,
        item.tier_recommended,
        item._pie?.tier,
        pie?.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [items, search, pipelineFilter, drafts]);

  const counts = useMemo(() => {
    const base: Record<string, number> = {
      all: items.length,
      new: 0,
      call: 0,
      proposal: 0,
      deposit: 0,
      active: 0,
    };
    for (const item of items) {
      const p = drafts[item.id]?.pipelineStatus || inferPipeline(item);
      if (base[p] !== undefined) base[p] += 1;
    }
    return base;
  }, [items, drafts]);

  function patchItem(id: string, updater: (old: Item) => Item) {
    setItems((prev) => prev.map((it) => (it.id === id ? updater(it) : it)));
  }

  async function savePipelineStatus(item: Item) {
    const quoteId = item.id;
    const pipelineStatus = drafts[quoteId]?.pipelineStatus || "new";
    setSavingStatusId(quoteId);
    setMsg("");

    try {
      const res = await fetch("/api/internal/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, pipelineStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to save pipeline status");
      }

      patchItem(quoteId, (old) => {
        const debug = toObj(old.debug);
        const admin = toObj(debug.admin_v15);
        admin.pipelineStatus = pipelineStatus;
        debug.admin_v15 = admin;
        return { ...old, debug };
      });

      setMsg("Pipeline status saved.");
    } catch (e: any) {
      setMsg(`Status save failed: ${e.message || "Unknown error"}`);
    } finally {
      setSavingStatusId(null);
    }
  }

  async function saveAdjustments(item: Item) {
    const quoteId = item.id;
    const pricingAdjustments = drafts[quoteId]?.pricingAdjustments ?? {};
    setSavingAdjustId(quoteId);
    setMsg("");

    try {
      const res = await fetch("/api/internal/admin/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, pricingAdjustments }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to save adjustments");
      }

      patchItem(quoteId, (old) => {
        const debug = toObj(old.debug);
        const admin = toObj(debug.admin_v15);
        admin.pricingAdjustments = pricingAdjustments;
        debug.admin_v15 = admin;
        return { ...old, debug };
      });

      setMsg("Admin adjustments saved.");
    } catch (e: any) {
      setMsg(`Adjustment save failed: ${e.message || "Unknown error"}`);
    } finally {
      setSavingAdjustId(null);
    }
  }

  async function generateProposal(item: Item) {
    const quoteId = item.id;
    setGeneratingProposalId(quoteId);
    setMsg("");

    try {
      const res = await fetch("/api/internal/admin/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to generate proposal");
      }

      const proposalText = String(json.proposalText || "");
      setDrafts((prev) => ({
        ...prev,
        [quoteId]: {
          ...prev[quoteId],
          proposalDraft: proposalText,
        },
      }));

      patchItem(quoteId, (old) => {
        const debug = toObj(old.debug);
        const admin = toObj(debug.admin_v15);
        admin.proposalDraft = proposalText;
        admin.proposalGeneratedAt = new Date().toISOString();
        debug.admin_v15 = admin;
        return { ...old, debug };
      });

      setMsg("Proposal text generated and saved.");
    } catch (e: any) {
      setMsg(`Proposal generation failed: ${e.message || "Unknown error"}`);
    } finally {
      setGeneratingProposalId(null);
    }
  }

  return (
    <main className="section">
      <div className="container">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="cardInner">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="kicker">
                  <span className="kickerDot" />
                  Internal Admin v1.5
                </div>
                <h1 className="h2" style={{ marginTop: 10 }}>
                  PIE-powered Pipeline
                </h1>
                <p className="p" style={{ marginTop: 8 }}>
                  Quick triage, pricing adjustments, and proposal drafting without digging into raw JSON.
                </p>
              </div>

              <div style={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
                <input
                  className="input"
                  placeholder="Search email, quote ID, business, tier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {(["all", ...PIPELINE_OPTIONS] as string[]).map((key) => {
                const active = pipelineFilter === key;
                return (
                  <button
                    key={key}
                    className={`btn ${active ? "btnPrimary" : "btnGhost"}`}
                    onClick={() => setPipelineFilter(key)}
                    type="button"
                    style={{ padding: "8px 12px", fontSize: 13 }}
                  >
                    {key} ({counts[key] ?? 0})
                  </button>
                );
              })}
            </div>

            {msg ? (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {msg}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((item) => {
            const pie = parsePieReport(item._pie);
            const admin = getAdminV15(item);
            const draft = drafts[item.id] ?? {
              pipelineStatus: inferPipeline(item),
              pricingAdjustments: {},
              proposalDraft: "",
            };

            const effort = getPieEffort(pie);
            const pricing = getPricingFromPie(item, pie);
            const adjustedTarget = computeAdjustedTarget(
              pricing.target,
              draft.pricingAdjustments
            );

            const summary =
              pie.summary ||
              pie?.executive_summary ||
              "No structured PIE summary yet. You can still use adjustments and generate a proposal draft.";

            const complexityDrivers = extractList(
              pie.complexity_drivers || pie.drivers || pie.factors
            );
            const risks = extractList(pie.risks);
            const questions = extractList(
              pie.discovery_questions || pie.questions_to_ask || pie.questions
            );
            const objections = extractList(pie?.pitch?.objections);

            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderRadius: 16,
                  borderColor: "rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div className="cardInner" style={{ padding: 14 }}>
                  {/* Top summary row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr auto",
                      gap: 12,
                      alignItems: "start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span className="badge">{draft.pipelineStatus}</span>
                        <span className="badge">
                          {String(getTierLabel(item, pie))}
                        </span>
                        <span className="badge">
                          {fmtCurrency(item.estimated_total)}{" "}
                          <span style={{ opacity: 0.7 }}>
                            ({fmtCurrency(item.estimated_low)}–{fmtCurrency(item.estimated_high)})
                          </span>
                        </span>
                        {item._pie?.score != null ? (
                          <span className="badge badgeHot">
                            PIE score {item._pie.score}
                          </span>
                        ) : null}
                      </div>

                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 14,
                          color: "rgba(255,255,255,0.94)",
                          wordBreak: "break-word",
                        }}
                      >
                        {getLeadName(item) || "Lead"} • {getLeadEmail(item)}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.60)",
                          wordBreak: "break-word",
                        }}
                      >
                        Quote {item.id} • Created {fmtDate(item.created_at)}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "rgba(255,255,255,0.78)",
                          lineHeight: 1.5,
                        }}
                      >
                        {summary}
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: 8,
                        }}
                      >
                        <SectionCard title="Effort">
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.82)" }}>
                            <div>Hours: {effort.hours ?? "—"}</div>
                            <div>
                              Timeline:{" "}
                              {effort.weeks
                                ? `${effort.weeks} week(s)`
                                : effort.days
                                ? `${effort.days} day(s)`
                                : "—"}
                            </div>
                            <div>
                              @ ${effort.hourlyRate}/hr:{" "}
                              {effort.laborAtRate ? fmtCurrency(effort.laborAtRate) : "—"}
                            </div>
                          </div>
                        </SectionCard>

                        <SectionCard title="Pricing">
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.82)" }}>
                            <div>Target: {fmtCurrency(pricing.target)}</div>
                            <div>Floor: {fmtCurrency(pricing.min)}</div>
                            <div>Ceiling: {fmtCurrency(pricing.max)}</div>
                            <div style={{ marginTop: 4, color: "rgba(255,220,200,0.92)" }}>
                              Adjusted target: {fmtCurrency(adjustedTarget)}
                            </div>
                          </div>
                        </SectionCard>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btnGhost"
                        onClick={() => setOpenId(isOpen ? null : item.id)}
                        style={{ minWidth: 130 }}
                      >
                        {isOpen ? "Hide details" : "Open card"}
                      </button>

                      <a
                        href={`/internal/preview?quoteId=${item.id}`}
                        className="btn btnGhost"
                        style={{ minWidth: 130, textAlign: "center" }}
                      >
                        Raw detail
                      </a>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isOpen ? (
                    <div
                      style={{
                        marginTop: 12,
                        display: "grid",
                        gap: 12,
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        paddingTop: 12,
                      }}
                    >
                      {/* Admin controls */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <div className="panel">
                          <div className="panelHeader">
                            <div style={{ fontWeight: 900 }}>Pipeline + follow-up</div>
                          </div>
                          <div className="panelBody">
                            <div className="fieldLabel">Pipeline status</div>
                            <select
                              className="select"
                              value={draft.pipelineStatus}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    pipelineStatus: e.target.value,
                                  },
                                }))
                              }
                            >
                              {PIPELINE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <div style={{ marginTop: 10 }}>
                              <button
                                type="button"
                                className="btn btnPrimary"
                                onClick={() => savePipelineStatus(item)}
                                disabled={savingStatusId === item.id}
                              >
                                {savingStatusId === item.id ? "Saving..." : "Save status"}
                              </button>
                            </div>

                            <div className="smallNote" style={{ marginTop: 8 }}>
                              Saved in <code>quotes.debug.admin_v15.pipelineStatus</code> so it won’t interfere with public quote flow statuses.
                            </div>
                          </div>
                        </div>

                        <div className="panel">
                          <div className="panelHeader">
                            <div style={{ fontWeight: 900 }}>Call request snapshot</div>
                          </div>
                          <div className="panelBody">
                            <div className="pDark">
                              <div>
                                <b>Status:</b> {item?._callRequest?.status || "—"}
                              </div>
                              <div>
                                <b>Best time:</b>{" "}
                                {item?._callRequest?.best_time_to_call || "—"}
                              </div>
                              <div>
                                <b>Timezone:</b> {item?._callRequest?.timezone || "—"}
                              </div>
                              <div>
                                <b>Notes:</b> {item?._callRequest?.notes || "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pricing adjustments */}
                      <div className="panel">
                        <div className="panelHeader">
                          <div style={{ fontWeight: 900 }}>Admin pricing adjustments</div>
                        </div>
                        <div className="panelBody">
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, minmax(120px, 1fr))",
                              gap: 10,
                            }}
                          >
                            <div>
                              <div className="fieldLabel">Discount %</div>
                              <input
                                className="input"
                                inputMode="decimal"
                                value={draft.pricingAdjustments?.discountPct ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      pricingAdjustments: {
                                        ...prev[item.id]?.pricingAdjustments,
                                        discountPct: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="10"
                              />
                            </div>

                            <div>
                              <div className="fieldLabel">Discount $</div>
                              <input
                                className="input"
                                inputMode="decimal"
                                value={draft.pricingAdjustments?.discountAmount ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      pricingAdjustments: {
                                        ...prev[item.id]?.pricingAdjustments,
                                        discountAmount: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="75"
                              />
                            </div>

                            <div>
                              <div className="fieldLabel">Increase $</div>
                              <input
                                className="input"
                                inputMode="decimal"
                                value={draft.pricingAdjustments?.increaseAmount ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      pricingAdjustments: {
                                        ...prev[item.id]?.pricingAdjustments,
                                        increaseAmount: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <div className="fieldLabel">Custom target $</div>
                              <input
                                className="input"
                                inputMode="decimal"
                                value={draft.pricingAdjustments?.customTarget ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      pricingAdjustments: {
                                        ...prev[item.id]?.pricingAdjustments,
                                        customTarget: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                placeholder="Override"
                              />
                            </div>
                          </div>

                          <div style={{ marginTop: 10 }}>
                            <div className="fieldLabel">Admin note</div>
                            <textarea
                              className="textarea"
                              value={draft.pricingAdjustments?.note ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    pricingAdjustments: {
                                      ...prev[item.id]?.pricingAdjustments,
                                      note: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="Why this adjustment? (scope cut, rush, content ready, referral, etc.)"
                            />
                          </div>

                          <div
                            style={{
                              marginTop: 10,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 10,
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              className="btn btnPrimary"
                              onClick={() => saveAdjustments(item)}
                              disabled={savingAdjustId === item.id}
                            >
                              {savingAdjustId === item.id ? "Saving..." : "Save adjustments"}
                            </button>

                            <div className="pDark">
                              Adjusted target preview: <b>{fmtCurrency(adjustedTarget)}</b>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PIE intelligence panels */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <div className="panel">
                          <div className="panelHeader">
                            <div style={{ fontWeight: 900 }}>PIE summary (admin-friendly)</div>
                          </div>
                          <div className="panelBody">
                            <div className="pDark" style={{ whiteSpace: "pre-wrap" }}>
                              {summary}
                            </div>

                            {complexityDrivers.length > 0 ? (
                              <>
                                <div className="fieldLabel" style={{ marginTop: 10 }}>
                                  Complexity drivers
                                </div>
                                <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.78)" }}>
                                  {complexityDrivers.map((d, i) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </>
                            ) : null}

                            {risks.length > 0 ? (
                              <>
                                <div className="fieldLabel" style={{ marginTop: 10 }}>
                                  Risks / blockers
                                </div>
                                <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.78)" }}>
                                  {risks.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="panel">
                          <div className="panelHeader">
                            <div style={{ fontWeight: 900 }}>Questions + objections</div>
                          </div>
                          <div className="panelBody">
                            {questions.length > 0 ? (
                              <>
                                <div className="fieldLabel">Discovery questions</div>
                                <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.78)" }}>
                                  {questions.map((q, i) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <div className="pDark">No discovery questions yet in PIE.</div>
                            )}

                            {objections.length > 0 ? (
                              <>
                                <div className="fieldLabel" style={{ marginTop: 10 }}>
                                  Likely objections
                                </div>
                                <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.78)" }}>
                                  {objections.map((o, i) => (
                                    <li key={i}>{o}</li>
                                  ))}
                                </ul>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Proposal generator */}
                      <div className="panel">
                        <div className="panelHeader">
                          <div style={{ fontWeight: 900 }}>Proposal draft from PIE</div>
                        </div>
                        <div className="panelBody">
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 10,
                              marginBottom: 10,
                            }}
                          >
                            <button
                              type="button"
                              className="btn btnPrimary"
                              onClick={() => generateProposal(item)}
                              disabled={generatingProposalId === item.id}
                            >
                              {generatingProposalId === item.id
                                ? "Generating..."
                                : "Generate proposal text"}
                            </button>

                            <button
                              type="button"
                              className="btn btnGhost"
                              onClick={() => {
                                const text = drafts[item.id]?.proposalDraft || "";
                                if (!text) return;
                                navigator.clipboard
                                  .writeText(text)
                                  .then(() => setMsg("Proposal text copied."))
                                  .catch(() => setMsg("Could not copy proposal text."));
                              }}
                            >
                              Copy
                            </button>
                          </div>

                          <textarea
                            className="textarea"
                            style={{ minHeight: 240 }}
                            value={drafts[item.id]?.proposalDraft || ""}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  proposalDraft: e.target.value,
                                },
                              }))
                            }
                            placeholder="Click “Generate proposal text” to build a client-facing proposal draft from this quote + PIE report."
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <div className="card">
              <div className="cardInner">
                <div className="p">No quotes match your current filters.</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}