// app/internal/admin/page.tsx
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type QuoteRow = {
  id: string;
  created_at: string | null;
  lead_id: string | null;
  status: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  tier_recommended: string | null; // ✅ correct column on quotes
  pie_latest_report_id: string | null;
  scope_snapshot: any;
};

type LeadRow = {
  id: string;
  created_at: string | null;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
};

type CallRequestRow = {
  id: string;
  created_at: string | null;
  quote_id: string | null;
  status: string | null;
  preferred_times: string | null;
  timezone: string | null;
  notes: string | null;
  best_time_to_call: string | null;
};

type PieRow = {
  id: string;
  quote_id: string | null;
  created_at: string | null;
  score: number | null;
  tier: string | null; // ✅ tier belongs to pie_reports
  confidence: string | null;
  payload: any;
};

function fmtCurrency(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function safeObj(v: any): Record<string, any> | null {
  if (!v) return null;
  if (typeof v === "object") return v as Record<string, any>;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return typeof parsed === "object" && parsed ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function getPieSummary(payload: any): string | null {
  const p = safeObj(payload);
  if (!p) return null;
  if (typeof p.summary === "string" && p.summary.trim()) return p.summary.trim();
  if (typeof p.executiveSummary === "string" && p.executiveSummary.trim())
    return p.executiveSummary.trim();
  if (typeof p.overview === "string" && p.overview.trim()) return p.overview.trim();
  return null;
}

function getEffortHours(payload: any): { min?: number; max?: number; exact?: number } | null {
  const p = safeObj(payload);
  if (!p) return null;

  // Flexible parsing to support your evolving PIE payload shape
  const candidates = [
    p?.effort?.hours,
    p?.effort?.estimatedHours,
    p?.timeline?.estimatedHours,
    p?.hours,
    p?.estimatedHours,
    p?.buildHours,
  ];

  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) {
      return { exact: c };
    }
  }

  const rangeCandidates = [
    p?.effort?.hoursRange,
    p?.timeline?.hoursRange,
    p?.hoursRange,
  ];

  for (const r of rangeCandidates) {
    if (!r) continue;
    const min = typeof r.min === "number" ? r.min : undefined;
    const max = typeof r.max === "number" ? r.max : undefined;
    if (min !== undefined || max !== undefined) {
      return { min, max };
    }
  }

  return null;
}

function getScopeMini(scopeSnapshot: any): { pages?: number; features?: number; timeline?: string } {
  const s = safeObj(scopeSnapshot) ?? {};
  const pages =
    typeof s?.pagesCount === "number"
      ? s.pagesCount
      : Array.isArray(s?.pages)
      ? s.pages.length
      : typeof s?.siteMap?.pagesCount === "number"
      ? s.siteMap.pagesCount
      : undefined;

  const features =
    Array.isArray(s?.features)
      ? s.features.length
      : Array.isArray(s?.selectedFeatures)
      ? s.selectedFeatures.length
      : Array.isArray(s?.scope?.features)
      ? s.scope.features.length
      : undefined;

  const timeline =
    typeof s?.timeline === "string"
      ? s.timeline
      : typeof s?.timelineTarget === "string"
      ? s.timelineTarget
      : typeof s?.deliveryTimeline === "string"
      ? s.deliveryTimeline
      : undefined;

  return { pages, features, timeline };
}

async function loadAdminData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ✅ NOTE: tier_recommended is the correct column on quotes
  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select(
      "id, created_at, lead_id, status, estimate_total, estimate_low, estimate_high, tier_recommended, pie_latest_report_id, scope_snapshot"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (quotesError) {
    throw new Error(quotesError.message);
  }

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const leadIds = Array.from(
    new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[])
  );
  const quoteIds = quoteRows.map((q) => q.id);

  const leadsMap = new Map<string, LeadRow>();
  if (leadIds.length) {
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, created_at, email, full_name, business_name")
      .in("id", leadIds);

    if (error) throw new Error(error.message);
    for (const l of (leads ?? []) as LeadRow[]) leadsMap.set(l.id, l);
  }

  const callMap = new Map<string, CallRequestRow>();
  if (quoteIds.length) {
    const { data: calls, error } = await supabase
      .from("call_requests")
      .select(
        "id, created_at, quote_id, status, preferred_times, timezone, notes, best_time_to_call"
      )
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    for (const c of (calls ?? []) as CallRequestRow[]) {
      if (!c.quote_id) continue;
      // Keep newest only
      if (!callMap.has(c.quote_id)) callMap.set(c.quote_id, c);
    }
  }

  const pieMap = new Map<string, PieRow>();
  if (quoteIds.length) {
    const { data: pies, error } = await supabase
      .from("pie_reports")
      .select("id, quote_id, created_at, score, tier, confidence, payload")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    for (const p of (pies ?? []) as PieRow[]) {
      if (!p.quote_id) continue;
      // Keep newest only
      if (!pieMap.has(p.quote_id)) pieMap.set(p.quote_id, p);
    }
  }

  return quoteRows.map((q) => ({
    quote: q,
    lead: q.lead_id ? leadsMap.get(q.lead_id) ?? null : null,
    call: callMap.get(q.id) ?? null,
    pie: pieMap.get(q.id) ?? null,
  }));
}

function statusBadgeClass(status: string | null | undefined) {
  const s = (status || "").toLowerCase();
  if (s.includes("call")) return "badge badgeHot";
  return "badge";
}

export default async function InternalAdminPage() {
  try {
    const rows = await loadAdminData();

    const counts = rows.reduce<Record<string, number>>((acc, r) => {
      const key = (r.quote.status || "unknown").toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return (
      <main className="container section">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="h2" style={{ marginBottom: 8 }}>
              Internal Admin
            </h1>
            <p className="pDark" style={{ margin: 0 }}>
              Pipeline view with quick PIE summaries (admin-friendly, no raw JSON).
            </p>
          </div>

          <div className="row">
            <Link className="btn btnGhost" href="/internal/preview">
              Preview List
            </Link>
            <Link className="btn btnPrimary" href="/estimate">
              New Quote
            </Link>
          </div>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <span className="badge">Total: {rows.length}</span>
          {Object.entries(counts).map(([k, v]) => (
            <span key={k} className="badge">
              {k}: {v}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {rows.map(({ quote, lead, call, pie }) => {
            const piePayload = safeObj(pie?.payload);
            const pieSummary = getPieSummary(pie?.payload);
            const effort = getEffortHours(pie?.payload);
            const scopeMini = getScopeMini(quote.scope_snapshot);

            return (
              <div key={quote.id} className="card">
                <div className="cardInner">
                  <div
                    className="row"
                    style={{ justifyContent: "space-between", alignItems: "flex-start" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        {lead?.email || lead?.full_name || "Unknown lead"}
                      </div>
                      <div className="pDark" style={{ marginTop: 4 }}>
                        Quote ID: {quote.id}
                      </div>
                      <div className="pDark" style={{ marginTop: 4 }}>
                        Created: {fmtDate(quote.created_at)}
                      </div>
                    </div>

                    <div className="row">
                      <Link
                        className="btn btnGhost"
                        href={`/internal/preview?quoteId=${quote.id}`}
                      >
                        View details
                      </Link>
                    </div>
                  </div>

                  <div className="row" style={{ marginTop: 10 }}>
                    <span className={statusBadgeClass(quote.status)}>{quote.status || "—"}</span>
                    <span className="badge">
                      Tier: {quote.tier_recommended || "—"}
                    </span>
                    <span className="badge">
                      Est: {fmtCurrency(quote.estimate_total)}
                    </span>
                    <span className="badge">
                      Range: {fmtCurrency(quote.estimate_low)}–{fmtCurrency(quote.estimate_high)}
                    </span>
                    {call?.status ? <span className="badge">Call: {call.status}</span> : null}
                  </div>

                  <div className="row" style={{ marginTop: 10 }}>
                    {scopeMini.pages !== undefined ? (
                      <span className="badge">Pages: {scopeMini.pages}</span>
                    ) : null}
                    {scopeMini.features !== undefined ? (
                      <span className="badge">Features: {scopeMini.features}</span>
                    ) : null}
                    {scopeMini.timeline ? (
                      <span className="badge">Timeline: {scopeMini.timeline}</span>
                    ) : null}
                  </div>

                  <div
                    className="panel"
                    style={{ marginTop: 12, borderRadius: 14, overflow: "hidden" }}
                  >
                    <div className="panelHeader" style={{ padding: "10px 12px" }}>
                      <div
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>PIE Summary</div>
                        {pie ? (
                          <div className="row">
                            <span className="badge">Score: {pie.score ?? "—"}</span>
                            <span className="badge">PIE Tier: {pie.tier || "—"}</span>
                            <span className="badge">Confidence: {pie.confidence || "—"}</span>
                          </div>
                        ) : (
                          <span className="badge">No PIE yet</span>
                        )}
                      </div>
                    </div>

                    <div className="panelBody" style={{ padding: 12 }}>
                      {pie ? (
                        <>
                          <p className="pDark" style={{ margin: 0 }}>
                            {pieSummary || "PIE exists, but no summary text was found."}
                          </p>

                          <div className="row" style={{ marginTop: 10 }}>
                            {effort?.exact !== undefined ? (
                              <>
                                <span className="badge">Build hours: ~{effort.exact}h</span>
                                <span className="badge">
                                  @ $40/hr: {fmtCurrency(effort.exact * 40)}
                                </span>
                              </>
                            ) : effort?.min !== undefined || effort?.max !== undefined ? (
                              <>
                                <span className="badge">
                                  Build hours:{" "}
                                  {effort.min !== undefined ? effort.min : "?"}–{effort.max !== undefined ? effort.max : "?"}h
                                </span>
                                {effort.min !== undefined && effort.max !== undefined ? (
                                  <span className="badge">
                                    @ $40/hr: {fmtCurrency(effort.min * 40)}–{fmtCurrency(effort.max * 40)}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="badge">
                                Add hours estimation to PIE payload for labor-cost view
                              </span>
                            )}
                          </div>

                          {piePayload?.nextQuestions && Array.isArray(piePayload.nextQuestions) ? (
                            <div style={{ marginTop: 10 }}>
                              <div className="pDark" style={{ fontWeight: 800, marginBottom: 4 }}>
                                Suggested follow-up questions
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {piePayload.nextQuestions.slice(0, 4).map((q: any, i: number) => (
                                  <li key={i} className="pDark">
                                    {String(q)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="pDark" style={{ margin: 0 }}>
                          No PIE report found yet for this quote.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!rows.length ? (
            <div className="card">
              <div className="cardInner">
                <p className="pDark" style={{ margin: 0 }}>
                  No quotes found.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  } catch (err: any) {
    return (
      <main className="container section">
        <div className="card">
          <div className="cardInner">
            <h1 className="h2" style={{ marginBottom: 8 }}>
              Internal Admin
            </h1>
            <p className="pDark" style={{ margin: 0 }}>
              Could not load quotes: {err?.message || "Unknown error"}
            </p>
            <p className="pDark" style={{ marginTop: 8 }}>
              Most likely cause was a schema mismatch (using <code>quotes.tier</code> instead of{" "}
              <code>quotes.tier_recommended</code>).
            </p>
          </div>
        </div>
      </main>
    );
  }
}