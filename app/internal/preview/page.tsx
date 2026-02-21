// app/internal/preview/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import GeneratePieButton from "./GeneratePieButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type QuoteRow = {
  id: string;
  created_at: string | null;
  lead_id: string | null;
  status: string | null;
  recommended_tier: string | null;
  estimated_price_cents: number | null;
  low_estimate_cents: number | null;
  high_estimate_cents: number | null;
  answers: any;
};

type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
};

type CallRequestRow = {
  id: string;
  quote_id: string | null;
  status: string | null;
  best_time_to_call: string | null;
  preferred_times: string | null;
  timezone: string | null;
  notes: string | null;
  created_at: string | null;
};

type PieReportRow = {
  id: string;
  quote_id: string | null;
  created_at: string | null;
  score: number | null;
  tier: string | null;
  confidence: string | null;
  payload: any;
  report: any;
};

function moneyFromCents(cents?: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function money(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function safeJson(value: any): any {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function asArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [String(value)];
}

function pickNumber(...values: any[]): number | null {
  for (const v of values) {
    if (v == null) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function pickString(...values: any[]): string | null {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function estimateHoursFallback(score: number | null, tier: string | null) {
  const s = score ?? 30;
  const t = (tier || "").toLowerCase();

  // Basic fallback until PIE generator is upgraded
  let base = 8;
  if (t.includes("premium")) base = 24;
  else if (t.includes("growth")) base = 16;
  else if (t.includes("essential")) base = 10;

  const complexityLift = Math.round(s * 0.35); // 30 => +11h
  return Math.max(6, base + complexityLift);
}

function extractPieView(pie: PieReportRow | null, quote: QuoteRow) {
  const raw = safeJson(pie?.payload) ?? safeJson(pie?.report) ?? {};
  const pricing = raw?.pricing ?? {};
  const pitch = raw?.pitch ?? {};
  const timeline = raw?.timeline ?? {};
  const effort = raw?.effort ?? raw?.hours ?? {};

  const score = pickNumber(raw?.score, pie?.score);
  const tier = pickString(raw?.tier, pie?.tier, quote.recommended_tier);
  const confidence = pickString(raw?.confidence, pie?.confidence);
  const summary = pickString(raw?.summary);

  const targetPrice = pickNumber(
    pricing?.target,
    raw?.recommended_price,
    quote.estimated_price_cents != null ? quote.estimated_price_cents / 100 : null
  );
  const minimumPrice = pickNumber(
    pricing?.minimum,
    pricing?.floor,
    quote.low_estimate_cents != null ? quote.low_estimate_cents / 100 : null
  );
  const upperFromBuffer =
    Array.isArray(pricing?.buffers) && pricing.buffers.length
      ? pickNumber(pricing.buffers[0]?.amount)
      : null;
  const maximumPrice = pickNumber(
    pricing?.maximum,
    pricing?.premium,
    upperFromBuffer,
    quote.high_estimate_cents != null ? quote.high_estimate_cents / 100 : null
  );

  const hourlyRate = pickNumber(
    raw?.hourly?.rate,
    raw?.hourlyRate,
    raw?.pricingModel?.hourlyRate,
    40
  );

  const hoursTotal = pickNumber(
    effort?.total,
    effort?.hours_total,
    raw?.estimated_hours,
    raw?.hours_total
  );

  const fallbackHours = estimateHoursFallback(score, tier || quote.recommended_tier);
  const totalHours = hoursTotal ?? fallbackHours;

  const hoursLow = pickNumber(
    effort?.low,
    raw?.hours_low,
    Math.max(4, Math.round(totalHours * 0.8))
  );
  const hoursHigh = pickNumber(
    effort?.high,
    raw?.hours_high,
    Math.round(totalHours * 1.25)
  );

  const hourlyEquivalent = hourlyRate != null && totalHours != null ? hourlyRate * totalHours : null;

  const timelineText = pickString(
    timeline?.estimate,
    raw?.timeline_estimate,
    raw?.eta,
    `${Math.max(2, Math.ceil(totalHours / 6))}–${Math.max(3, Math.ceil(totalHours / 4))} working days`
  );

  const risks = asArray(raw?.risks);
  const questions = asArray(raw?.questions_for_call ?? raw?.questions ?? raw?.discovery_questions);
  const assumptions = asArray(raw?.assumptions);
  const drivers = asArray(raw?.complexity_drivers ?? raw?.drivers);

  const emphasize = asArray(pitch?.emphasize);
  const objections = asArray(pitch?.objections);
  const recommendation = pickString(pitch?.recommend, raw?.recommendation);

  return {
    raw,
    score,
    tier,
    confidence,
    summary,
    targetPrice,
    minimumPrice,
    maximumPrice,
    hourlyRate,
    totalHours,
    hoursLow,
    hoursHigh,
    hourlyEquivalent,
    timelineText,
    risks,
    questions,
    assumptions,
    drivers,
    emphasize,
    objections,
    recommendation,
  };
}

async function loadListData() {
  const { data: quotesData, error: quotesErr } = await supabaseAdmin
    .from("quotes")
    .select(
      "id, created_at, lead_id, status, recommended_tier, estimated_price_cents, low_estimate_cents, high_estimate_cents, answers"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (quotesErr) throw new Error(quotesErr.message);

  const quotes = (quotesData ?? []) as QuoteRow[];
  const leadIds = Array.from(new Set(quotes.map((q) => q.lead_id).filter(Boolean))) as string[];
  const quoteIds = quotes.map((q) => q.id);

  let leads: LeadRow[] = [];
  let calls: CallRequestRow[] = [];
  let pies: PieReportRow[] = [];

  if (leadIds.length) {
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("id, email, name")
      .in("id", leadIds);
    if (error) throw new Error(error.message);
    leads = (data ?? []) as LeadRow[];
  }

  if (quoteIds.length) {
    const { data, error } = await supabaseAdmin
      .from("call_requests")
      .select("id, quote_id, status, best_time_to_call, preferred_times, timezone, notes, created_at")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    calls = (data ?? []) as CallRequestRow[];

    const { data: pieData, error: pieErr } = await supabaseAdmin
      .from("pie_reports")
      .select("id, quote_id, created_at, score, tier, confidence, payload, report")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: false });
    if (pieErr) throw new Error(pieErr.message);
    pies = (pieData ?? []) as PieReportRow[];
  }

  const leadById = new Map(leads.map((l) => [l.id, l]));
  const latestCallByQuoteId = new Map<string, CallRequestRow>();
  for (const c of calls) {
    if (!c.quote_id) continue;
    if (!latestCallByQuoteId.has(c.quote_id)) latestCallByQuoteId.set(c.quote_id, c);
  }

  const latestPieByQuoteId = new Map<string, PieReportRow>();
  for (const p of pies) {
    if (!p.quote_id) continue;
    if (!latestPieByQuoteId.has(p.quote_id)) latestPieByQuoteId.set(p.quote_id, p);
  }

  return { quotes, leadById, latestCallByQuoteId, latestPieByQuoteId };
}

async function loadDetailData(quoteId: string) {
  const { data: quote, error: qErr } = await supabaseAdmin
    .from("quotes")
    .select(
      "id, created_at, lead_id, status, recommended_tier, estimated_price_cents, low_estimate_cents, high_estimate_cents, answers"
    )
    .eq("id", quoteId)
    .single();

  if (qErr) throw new Error(qErr.message);

  const quoteRow = quote as QuoteRow;

  let lead: LeadRow | null = null;
  if (quoteRow.lead_id) {
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("id, email, name")
      .eq("id", quoteRow.lead_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    lead = (data as LeadRow | null) ?? null;
  }

  const { data: callReq } = await supabaseAdmin
    .from("call_requests")
    .select("id, quote_id, status, best_time_to_call, preferred_times, timezone, notes, created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pie } = await supabaseAdmin
    .from("pie_reports")
    .select("id, quote_id, created_at, score, tier, confidence, payload, report")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    quote: quoteRow,
    lead,
    callRequest: (callReq as CallRequestRow | null) ?? null,
    pie: (pie as PieReportRow | null) ?? null,
  };
}

function KeyVal({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: 12,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return <div style={{ opacity: 0.75 }}>—</div>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
      {items.map((item, i) => (
        <li key={`${item}-${i}`}>{item}</li>
      ))}
    </ul>
  );
}

export default async function InternalPreviewPage(props: any) {
  const resolvedSearchParams = props?.searchParams
    ? typeof props.searchParams.then === "function"
      ? await props.searchParams
      : props.searchParams
    : {};

  const quoteIdParam = resolvedSearchParams?.quoteId;
  const quoteId = Array.isArray(quoteIdParam) ? quoteIdParam[0] : quoteIdParam;

  // Detail view
  if (quoteId) {
    const { quote, lead, callRequest, pie } = await loadDetailData(quoteId);
    const pieView = extractPieView(pie, quote);

    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 40px" }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/internal/preview"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            ← Back to quotes
          </Link>
        </div>

        <h1 style={{ margin: "0 0 14px", fontSize: 28 }}>Quote detail</h1>

        <div style={{ display: "grid", gap: 14 }}>
          <SectionCard title="Summary">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              <KeyVal label="Quote ID" value={quote.id} />
              <KeyVal label="Status" value={quote.status || "—"} />
              <KeyVal label="Tier" value={quote.recommended_tier || "—"} />
              <KeyVal label="Estimate" value={moneyFromCents(quote.estimated_price_cents)} />
              <KeyVal
                label="Range"
                value={`${moneyFromCents(quote.low_estimate_cents)} – ${moneyFromCents(
                  quote.high_estimate_cents
                )}`}
              />
              <KeyVal label="Created" value={fmtDate(quote.created_at)} />
              <KeyVal label="Lead" value={lead?.email || lead?.name || "—"} />
            </div>
          </SectionCard>

          <SectionCard title="Call request">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              <KeyVal label="Status" value={callRequest?.status || "—"} />
              <KeyVal
                label="Best time"
                value={callRequest?.best_time_to_call || callRequest?.preferred_times || "—"}
              />
              <KeyVal label="Timezone" value={callRequest?.timezone || "—"} />
              <KeyVal label="Notes" value={callRequest?.notes || "—"} />
            </div>
          </SectionCard>

          <SectionCard
            title="PIE report"
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {pie?.created_at ? `Updated ${fmtDate(pie.created_at)}` : "No report yet"}
                </span>
                <GeneratePieButton quoteId={quote.id} />
              </div>
            }
          >
            {pie ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  <KeyVal label="PIE ID" value={pie.id} />
                  <KeyVal label="Score" value={pieView.score != null ? String(pieView.score) : "—"} />
                  <KeyVal label="Tier" value={pieView.tier || "—"} />
                  <KeyVal label="Confidence" value={pieView.confidence || "—"} />
                </div>

                <SectionCard title="Executive summary">
                  <div style={{ lineHeight: 1.7 }}>
                    {pieView.summary || "No summary generated yet."}
                  </div>
                </SectionCard>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  <SectionCard title="Pricing guidance">
                    <div style={{ display: "grid", gap: 10 }}>
                      <KeyVal label="Target" value={money(pieView.targetPrice)} />
                      <KeyVal label="Minimum" value={money(pieView.minimumPrice)} />
                      <KeyVal label="Upper / Premium" value={money(pieView.maximumPrice)} />
                      <KeyVal label="Hourly rate check" value={`${money(pieView.hourlyRate)}/hr`} />
                      <KeyVal
                        label="Hours × rate equivalent"
                        value={money(pieView.hourlyEquivalent)}
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="Effort & timeline">
                    <div style={{ display: "grid", gap: 10 }}>
                      <KeyVal
                        label="Estimated hours"
                        value={`${pieView.totalHours ?? "—"} hrs`}
                      />
                      <KeyVal
                        label="Hour range"
                        value={`${pieView.hoursLow ?? "—"} – ${pieView.hoursHigh ?? "—"} hrs`}
                      />
                      <KeyVal label="Timeline" value={pieView.timelineText} />
                    </div>
                  </SectionCard>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  <SectionCard title="Complexity drivers">
                    <Bullets items={pieView.drivers} />
                  </SectionCard>

                  <SectionCard title="Risks">
                    <Bullets items={pieView.risks} />
                  </SectionCard>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  <SectionCard title="Questions to ask on the call">
                    <Bullets items={pieView.questions} />
                  </SectionCard>

                  <SectionCard title="Assumptions">
                    <Bullets items={pieView.assumptions} />
                  </SectionCard>
                </div>

                <SectionCard title="Sales guidance">
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Recommendation</div>
                      <div>{pieView.recommendation || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>What to emphasize</div>
                      <Bullets items={pieView.emphasize} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                        Likely objections to prepare for
                      </div>
                      <Bullets items={pieView.objections} />
                    </div>
                  </div>
                </SectionCard>

                <details
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    Raw PIE JSON (debug)
                  </summary>
                  <pre
                    style={{
                      marginTop: 12,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: 12,
                      lineHeight: 1.5,
                      background: "rgba(0,0,0,0.35)",
                      padding: 12,
                      borderRadius: 10,
                      overflowX: "auto",
                    }}
                  >
                    {JSON.stringify(pieView.raw, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div style={{ opacity: 0.85 }}>
                No PIE report yet for this quote. Click <strong>Generate PIE now</strong>.
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  // List view
  const { quotes, leadById, latestCallByQuoteId, latestPieByQuoteId } = await loadListData();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 40px" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Internal Preview</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>Recent quotes (tap “View details”)</p>

      <div style={{ display: "grid", gap: 12 }}>
        {quotes.map((q) => {
          const lead = q.lead_id ? leadById.get(q.lead_id) : undefined;
          const callReq = latestCallByQuoteId.get(q.id);
          const pie = latestPieByQuoteId.get(q.id);

          return (
            <div
              key={q.id}
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {moneyFromCents(q.estimated_price_cents)} • {q.recommended_tier || "—"} •{" "}
                  {q.status || "—"} • {pie ? "PIE ✓" : "PIE —"}
                </div>
                <Link
                  href={`/internal/preview?quoteId=${q.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.04)",
                    fontWeight: 700,
                  }}
                >
                  View details →
                </Link>
              </div>

              <div style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>{fmtDate(q.created_at)}</div>
              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                {lead?.email || lead?.name || "No lead email"} • {q.id}
              </div>
              {callReq ? (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                  Call request: {callReq.status || "—"} •{" "}
                  {callReq.best_time_to_call || callReq.preferred_times || "—"}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
