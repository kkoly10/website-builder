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

      const dbg = (q?.debug && typeof q.debug === "object") ? q.debug : {};
      const internal = (dbg?.internal && typeof dbg.internal === "object") ? dbg.internal : {};

      setStatus(String(q?.status ?? "new"));
      setAdminNotes(String(internal?.admin_notes ?? ""));
      setCallScheduledAt(String(internal?.call_scheduled_at ?? ""));
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

      // refresh both list + detail to stay consistent
      await refreshList(filter);
      await loadQuote(selectedId);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const lead = firstLead(selected?.leads);
  const previewLink = selectedId
    ? `/internal/preview?quoteId=${encodeURIComponent(selectedId)}${token ? `&token=${encodeURIComponent(token)}` : ""}`
    : "";

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Internal • Dashboard
      </div>

      <div style={{ height: 10 }} />

      <h1 className="h1">Quotes</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 8 }}>
        Review estimates, lock scope, and move clients to the call → deposit flow.
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
            const dbg = (q?.debug && typeof q.debug === "object") ? q.debug : {};
            const internal = (dbg?.internal && typeof dbg.internal === "object") ? dbg.internal : {};
            const note = String(internal?.admin_notes ?? "").trim();

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
            Update status + notes here. Keep payment after the call.
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
                  placeholder="What to confirm on the call, risks, suggested trade-offs, pricing defense, etc."
                />
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="smallNote">{saveMsg ? <strong>{saveMsg}</strong> : null}</div>
                <button className="btn btnPrimary" onClick={saveUpdates} disabled={saving}>
                  {saving ? "Saving…" : "Save updates"} <span className="btnArrow">→</span>
                </button>
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