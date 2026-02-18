"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QuoteRow = any;

const STATUSES = [
  "new",
  "contacted",
  "call_scheduled",
  "call_done",
  "scope_locked",
  "deposit_sent",
  "paid",
  "archived",
] as const;

function fmtDate(d: any) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d ?? "");
  }
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

function safeObj(v: any) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function roundMoney(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.round(x));
}

export default function InternalDashboardClient({
  initialToken,
  initialWarning,
  initialQuotes,
  initialError,
}: {
  initialToken: string;
  initialWarning: string;
  initialQuotes: QuoteRow[];
  initialError: string;
}) {
  const [token] = useState(initialToken);
  const [warning] = useState(initialWarning);

  const [quotes, setQuotes] = useState<QuoteRow[]>(initialQuotes || []);
  const [error, setError] = useState(initialError || "");

  const [filter, setFilter] = useState<string>("all");

  const [selectedId, setSelectedId] = useState<string>("");
  const [selected, setSelected] = useState<any>(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  const [status, setStatus] = useState<string>("new");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [callScheduledAt, setCallScheduledAt] = useState<string>("");

  // NEW: scope lock + deposit
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositUrl, setDepositUrl] = useState<string>("");

  const filteredQuotes = useMemo(() => {
    if (filter === "all") return quotes;
    return (quotes || []).filter((q: any) => String(q.status) === filter);
  }, [quotes, filter]);

  async function refreshList(nextFilter = filter) {
    setError("");
    setSaveMsg("");
    try {
      const url = new URL(window.location.origin + "/api/internal/list-quotes");
      url.searchParams.set("token", token);
      if (nextFilter && nextFilter !== "all") url.searchParams.set("status", nextFilter);

      const res = await fetch(url.toString(), { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load quotes");
      setQuotes(json?.quotes ?? []);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    }
  }

  async function loadQuote(quoteId: string) {
    setSelectedId(quoteId);
    setSelected(null);
    setSaveMsg("");
    setError("");
    setDepositUrl("");

    if (!quoteId) return;

    setLoadingDetail(true);
    try {
      const url = new URL(window.location.origin + "/api/internal/get-quote");
      url.searchParams.set("token", token);
      url.searchParams.set("quoteId", quoteId);

      const res = await fetch(url.toString(), { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load quote");

      const q = json?.quote;
      setSelected(q || null);

      const dbg = safeObj(q?.debug);
      const internal = safeObj(dbg?.internal);

      setStatus(String(q?.status ?? "new"));
      setAdminNotes(String(internal?.admin_notes ?? ""));
      setCallScheduledAt(String(internal?.call_scheduled_at ?? ""));

      const fp = internal?.final_price ?? q?.estimate_total ?? 0;
      const dp = internal?.deposit_amount ?? Math.max(100, Math.round(Number(fp) * 0.3));

      setFinalPrice(String(roundMoney(fp) || ""));
      setDepositAmount(String(roundMoney(dp) || ""));

      const existingDepositUrl = internal?.deposit?.url ?? "";
      setDepositUrl(String(existingDepositUrl || ""));
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function saveUpdates() {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg("");
    setError("");

    try {
      const res = await fetch("/api/internal/update-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          quoteId: selectedId,
          status,
          adminNotes,
          callScheduledAt,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update quote");

      setSaveMsg("Saved ✅");
      await refreshList(filter);
      await loadQuote(selectedId);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function lockScope() {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg("");
    setError("");

    try {
      const res = await fetch("/api/internal/lock-scope", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          quoteId: selectedId,
          finalPrice: roundMoney(finalPrice),
          depositAmount: roundMoney(depositAmount),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to lock scope");

      setSaveMsg("Scope locked ✅");
      await refreshList(filter);
      await loadQuote(selectedId);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function createDepositLink() {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg("");
    setError("");

    try {
      const res = await fetch("/api/internal/create-deposit-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          quoteId: selectedId,
          depositAmount: roundMoney(depositAmount),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to create deposit link");

      setDepositUrl(String(json?.depositUrl ?? ""));
      setSaveMsg("Deposit link created ✅");
      await refreshList(filter);
      await loadQuote(selectedId);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string) {
    try {
      navigator.clipboard.writeText(text);
      setSaveMsg("Copied ✅");
    } catch {}
  }

  const lead = firstLead(selected?.leads);

  const previewLink = selectedId
    ? `/internal/preview?quoteId=${encodeURIComponent(selectedId)}${token ? `&token=${encodeURIComponent(token)}` : ""}`
    : "";

  const dbg = safeObj(selected?.debug);
  const internal = safeObj(dbg?.internal);
  const isLocked = Boolean(selected?.scope_snapshot?.locked || internal?.locked);
  const hasDeposit = Boolean(internal?.deposit?.url);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Internal • Dashboard
      </div>

      <div style={{ height: 10 }} />

      <h1 className="h1">Quotes</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 8 }}>
        Review estimates, lock scope on the call, then send a deposit link after the call.
      </p>

      {warning ? (
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panelBody">
            <div style={{ fontWeight: 950, color: "rgba(255,180,180,0.95)" }}>Security warning</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              {warning}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panelBody" style={{ color: "#ffb4b4", fontWeight: 850 }}>
            {error}
          </div>
        </div>
      ) : null}

      <div style={{ height: 16 }} />

      <section className="panel">
        <div className="panelHeader" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 950 }}>Recent quotes</div>
            <div className="smallNote">Click one to open details.</div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <select
              className="select"
              value={filter}
              onChange={async (e) => {
                const v = e.target.value;
                setFilter(v);
                await refreshList(v);
              }}
              style={{ minWidth: 180 }}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button className="btn btnGhost" onClick={() => refreshList(filter)}>
              Refresh
            </button>
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 10 }}>
          {(filteredQuotes || []).map((q: any) => {
            const l = firstLead(q.leads);
            const dbgRow = safeObj(q?.debug);
            const internalRow = safeObj(dbgRow?.internal);
            const note = String(internalRow?.admin_notes ?? "").trim();

            return (
              <button
                key={q.id}
                onClick={() => loadQuote(q.id)}
                className="btn"
                style={{
                  textAlign: "left",
                  width: "100%",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: selectedId === q.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 950 }}>
                      ${q.estimate_total ?? "—"}{" "}
                      <span style={{ opacity: 0.7, fontWeight: 800 }}>
                        • {q.tier_recommended ?? "—"} • {q.status ?? "—"}
                      </span>
                    </div>
                    <div style={{ opacity: 0.7 }}>{fmtDate(q.created_at)}</div>
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    {l?.email ?? "(no lead email)"} {l?.phone ? `• ${l.phone}` : ""} •{" "}
                    <code>{q.id}</code>
                  </div>

                  {note ? (
                    <div style={{ marginTop: 6, opacity: 0.85 }}>
                      <span style={{ fontWeight: 900 }}>Note:</span>{" "}
                      {note.length > 120 ? note.slice(0, 120) + "…" : note}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}

          {filteredQuotes.length === 0 ? (
            <div className="smallNote">No quotes found for this filter.</div>
          ) : null}
        </div>
      </section>

      <div style={{ height: 18 }} />

      {/* Detail */}
      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Quote details</div>
          <div className="smallNote">
            Call flow: (1) call scheduled → (2) call done → (3) lock scope → (4) send deposit link.
          </div>
        </div>

        <div className="panelBody">
          {!selectedId ? (
            <div className="smallNote">Select a quote to view details.</div>
          ) : loadingDetail ? (
            <div className="smallNote">Loading…</div>
          ) : !selected ? (
            <div className="smallNote">No data.</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 950, marginBottom: 8 }}>Summary</div>
                <div className="smallNote">
                  <div>
                    <strong>Quote ID:</strong> <code>{selected.id}</code>
                  </div>
                  <div>
                    <strong>Created:</strong> {fmtDate(selected.created_at)}
                  </div>
                  <div>
                    <strong>Total:</strong> ${selected.estimate_total}{" "}
                    <span style={{ opacity: 0.7 }}>
                      (range ${selected.estimate_low}–${selected.estimate_high})
                    </span>
                  </div>
                  <div>
                    <strong>Tier:</strong> {selected.tier_recommended ?? "—"}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <strong>Lead:</strong>{" "}
                    {lead?.email ?? "(missing)"} {lead?.phone ? `• ${lead.phone}` : ""}{" "}
                    {lead?.name ? `• ${lead.name}` : ""}
                  </div>
                </div>

                <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
                  <Link className="btn btnGhost" href="/internal/preview">
                    Open preview list
                  </Link>

                  <a className="btn btnGhost" href={previewLink}>
                    Open internal preview
                  </a>
                </div>
              </div>

              <div className="grid2">
                <div>
                  <div className="fieldLabel">Status</div>
                  <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="fieldLabel">Call scheduled at (optional)</div>
                  <input
                    className="input"
                    value={callScheduledAt}
                    onChange={(e) => setCallScheduledAt(e.target.value)}
                    placeholder="2026-02-17 3:30 PM"
                  />
                </div>
              </div>

              <div>
                <div className="fieldLabel">Internal notes</div>
                <textarea
                  className="textarea"
                  rows={5}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="What to confirm on the call, trade-offs, objections, pricing defense…"
                />
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="smallNote">{saveMsg ? <strong>{saveMsg}</strong> : null}</div>
                <button className="btn btnGhost" onClick={saveUpdates} disabled={saving}>
                  {saving ? "Saving…" : "Save notes/status"}
                </button>
              </div>

              {/* LOCK SCOPE + DEPOSIT */}
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 950, marginBottom: 6 }}>
                  Lock scope + deposit (after call)
                </div>
                <div className="smallNote" style={{ marginBottom: 12 }}>
                  Lock scope on the video call. After the call, generate a Stripe deposit link and send it.
                </div>

                <div className="grid2" style={{ marginBottom: 12 }}>
                  <div>
                    <div className="fieldLabel">Final price (USD)</div>
                    <input
                      className="input"
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                      placeholder="e.g. 1200"
                    />
                  </div>
                  <div>
                    <div className="fieldLabel">Deposit amount (USD)</div>
                    <input
                      className="input"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 360"
                    />
                    <div className="smallNote" style={{ marginTop: 6 }}>
                      Tip: 30% is common for deposits.
                    </div>
                  </div>
                </div>

                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="smallNote">
                    {isLocked ? <strong>Locked ✅</strong> : "Not locked yet"}
                    {hasDeposit ? <span> • Deposit link ready ✅</span> : null}
                  </div>

                  <div className="row">
                    <button className="btn btnGhost" onClick={lockScope} disabled={saving}>
                      Lock scope
                    </button>
                    <button className="btn btnPrimary" onClick={createDepositLink} disabled={saving}>
                      Create deposit link <span className="btnArrow">→</span>
                    </button>
                  </div>
                </div>

                {depositUrl ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="fieldLabel">Deposit link</div>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <a href={depositUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                        Open Stripe checkout
                      </a>
                      <button className="btn btnGhost" onClick={() => copy(depositUrl)}>
                        Copy link
                      </button>
                    </div>
                    <div className="smallNote" style={{ marginTop: 6 }}>
                      Send this link after the call (email/SMS).
                    </div>
                  </div>
                ) : null}
              </div>

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 900 }}>scope_snapshot</summary>
                <pre style={{ whiteSpace: "pre-wrap", marginTop: 10, fontSize: 12 }}>
                  {JSON.stringify(selected.scope_snapshot ?? {}, null, 2)}
                </pre>
              </details>

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 900 }}>intake_normalized</summary>
                <pre style={{ whiteSpace: "pre-wrap", marginTop: 10, fontSize: 12 }}>
                  {JSON.stringify(selected.intake_normalized ?? {}, null, 2)}
                </pre>
              </details>

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 900 }}>debug</summary>
                <pre style={{ whiteSpace: "pre-wrap", marginTop: 10, fontSize: 12 }}>
                  {JSON.stringify(selected.debug ?? {}, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}