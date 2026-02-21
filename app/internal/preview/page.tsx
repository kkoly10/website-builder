// app/internal/preview/page.tsx
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import GeneratePieButton from "./GeneratePieButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function tryParseJson(v: any): any {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return v;

  const s = v.trim();
  if (!s) return null;
  if (!(s.startsWith("{") || s.startsWith("["))) return v;

  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

function pickFirst(...vals: any[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function moneyFromCents(cents?: number | null) {
  if (typeof cents !== "number" || Number.isNaN(cents)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function money(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function flattenText(input: any, out: string[] = []): string[] {
  if (input == null) return out;
  if (typeof input === "string") {
    out.push(input.toLowerCase());
    return out;
  }
  if (typeof input === "number" || typeof input === "boolean") {
    out.push(String(input).toLowerCase());
    return out;
  }
  if (Array.isArray(input)) {
    for (const item of input) flattenText(item, out);
    return out;
  }
  if (typeof input === "object") {
    for (const [k, v] of Object.entries(input)) {
      out.push(String(k).toLowerCase());
      flattenText(v, out);
    }
  }
  return out;
}

function findNumberByKey(obj: any, keyHints: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;

  const stack: any[] = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;

    for (const [k, v] of Object.entries(cur)) {
      const key = String(k).toLowerCase();

      if (keyHints.some((h) => key.includes(h))) {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const m = v.match(/\d+/);
          if (m) return Number(m[0]);
        }
      }

      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function hasAny(textBag: string[], keywords: string[]) {
  return keywords.some((kw) => textBag.some((t) => t.includes(kw)));
}

function extractPriceCents(quote: AnyRow) {
  const candidates = [
    quote.total_cents,
    quote.quoted_total_cents,
    quote.estimate_total_cents,
    quote.price_cents,
    quote.recommended_total_cents,
    quote.amount_cents,
  ];

  for (const c of candidates) {
    if (typeof c === "number") return c;
    if (typeof c === "string" && /^\d+$/.test(c)) return Number(c);
  }

  // Try nested JSON blobs
  const nested = [
    tryParseJson(quote.quote_json),
    tryParseJson(quote.summary_json),
    tryParseJson(quote.payload),
    tryParseJson(quote.answers),
  ];

  for (const n of nested) {
    if (!n || typeof n !== "object") continue;
    const x = pickFirst(
      n.total_cents,
      n.price_cents,
      n.quoted_total_cents,
      n.recommended_total_cents,
      n.total
    );
    if (typeof x === "number") return x;
    if (typeof x === "string" && /^\d+$/.test(x)) return Number(x);
  }

  return null;
}

function extractTier(quote: AnyRow) {
  return (
    pickFirst(
      quote.tier,
      quote.recommended_tier,
      quote.package_tier,
      tryParseJson(quote.summary_json)?.tier,
      tryParseJson(quote.quote_json)?.tier
    ) ?? "—"
  );
}

function extractEmail(quote: AnyRow, lead?: AnyRow | null) {
  const fromLead = pickFirst(
    lead?.email,
    lead?.customer_email,
    lead?.contact_email
  );
  const fromQuote = pickFirst(
    quote.email,
    quote.customer_email,
    quote.contact_email,
    tryParseJson(quote.summary_json)?.email,
    tryParseJson(quote.quote_json)?.email
  );
  return fromLead ?? fromQuote ?? "—";
}

function extractQuoteInputs(quote: AnyRow, lead?: AnyRow | null) {
  const blobs = [
    tryParseJson(quote.answers),
    tryParseJson(quote.quote_json),
    tryParseJson(quote.summary_json),
    tryParseJson(quote.payload),
    tryParseJson(quote.intake),
    tryParseJson(quote.intake_json),
    tryParseJson(quote.scope_snapshot),
    tryParseJson(lead?.payload),
    tryParseJson(lead?.lead_json),
  ].filter(Boolean);

  // Merge shallowly, keep all sources under _sources for debugging
  const merged: AnyRow = {};
  for (const b of blobs) {
    if (b && typeof b === "object" && !Array.isArray(b)) {
      Object.assign(merged, b);
    }
  }
  merged._sources = blobs;
  return merged;
}

function extractPiePayload(pieRow?: AnyRow | null) {
  if (!pieRow) return null;

  const directCandidates = [
    pieRow.report_json,
    pieRow.pie_json,
    pieRow.output_json,
    pieRow.result_json,
    pieRow.analysis_json,
    pieRow.payload,
    pieRow.content,
    pieRow.report,
    pieRow.output,
    pieRow.data,
  ];

  for (const c of directCandidates) {
    const parsed = tryParseJson(c);
    if (parsed && (typeof parsed === "object" || Array.isArray(parsed))) return parsed;
  }

  // Last fallback: entire row
  return pieRow;
}

type AssistantReport = {
  complexityScore: number;
  complexityBand: string;
  pageEstimate: number;
  hoursLow: number;
  hoursHigh: number;
  buildDaysLow: number;
  buildDaysHigh: number;
  hourlyRate: number;
  costLow: number;
  costHigh: number;
  quotePrice?: number | null;
  priceGapNote: string;
  signals: string[];
  risks: string[];
  questions: string[];
  phases: { name: string; hours: number; note: string }[];
};

function buildAssistantReport(quote: AnyRow, lead: AnyRow | null, latestPieRow: AnyRow | null): AssistantReport {
  const inputs = extractQuoteInputs(quote, lead);
  const pie = extractPiePayload(latestPieRow);
  const textBag = flattenText([inputs, pie]);

  const quotePriceCents = extractPriceCents(quote);
  const quotePrice = typeof quotePriceCents === "number" ? quotePriceCents / 100 : null;

  const pageEstimateRaw =
    findNumberByKey(inputs, ["page", "pages", "page_count", "num_pages"]) ??
    findNumberByKey(pie, ["page", "pages", "page_count"]) ??
    null;

  let pageEstimate = pageEstimateRaw && pageEstimateRaw > 0 ? pageEstimateRaw : 5;

  // Feature detection (keyword-based, very tolerant)
  const features = {
    ecommerce: hasAny(textBag, ["ecommerce", "e-commerce", "shop", "cart", "checkout", "product"]),
    booking: hasAny(textBag, ["booking", "appointment", "schedule", "calendar"]),
    blog: hasAny(textBag, ["blog", "articles", "posts", "news"]),
    cms: hasAny(textBag, ["cms", "content management", "editable", "admin", "dashboard"]),
    customCode: hasAny(textBag, ["custom", "next.js", "react", "supabase", "web app", "portal", "app"]),
    forms: hasAny(textBag, ["form", "intake", "lead form", "contact form", "quote form"]),
    payments: hasAny(textBag, ["stripe", "payment", "deposit", "checkout"]),
    auth: hasAny(textBag, ["login", "sign in", "account", "auth", "member"]),
    integrations: hasAny(textBag, ["integration", "api", "zapier", "mailchimp", "crm", "google"]),
    seo: hasAny(textBag, ["seo", "search engine", "keywords", "metadata"]),
    copywriting: hasAny(textBag, ["copywriting", "write content", "content creation", "need content"]),
    branding: hasAny(textBag, ["logo", "branding", "brand", "style guide"]),
    fastTimeline: hasAny(textBag, ["rush", "urgent", "asap", "this week", "48 hours"]),
    multiLocation: hasAny(textBag, ["multiple locations", "location pages", "service areas"]),
    multilingual: hasAny(textBag, ["multilingual", "bilingual", "translation", "spanish", "french"]),
  };

  const signals: string[] = [];

  // Complexity score
  let score = 18; // base
  score += Math.max(0, pageEstimate - 3) * 4;

  const add = (cond: boolean, pts: number, label: string) => {
    if (cond) {
      score += pts;
      signals.push(label);
    }
  };

  add(features.ecommerce, 22, "E-commerce / product checkout");
  add(features.booking, 12, "Booking / scheduling flow");
  add(features.blog, 7, "Blog/content section");
  add(features.cms, 10, "Editable CMS/admin needs");
  add(features.customCode, 12, "Custom build / app-style requirements");
  add(features.forms, 5, "Lead/quote/contact forms");
  add(features.payments, 8, "Payment or deposit handling");
  add(features.auth, 10, "Login/accounts/auth");
  add(features.integrations, 10, "3rd-party integrations/API");
  add(features.seo, 4, "SEO setup expectations");
  add(features.copywriting, 6, "Needs copy/content help");
  add(features.branding, 6, "Branding/logo/design direction needed");
  add(features.fastTimeline, 7, "Rush/urgent timeline");
  add(features.multiLocation, 5, "Multiple service/location pages");
  add(features.multilingual, 8, "Multilingual content");

  score = Math.max(10, Math.min(100, score));

  let complexityBand = "Low";
  if (score >= 75) complexityBand = "Advanced";
  else if (score >= 55) complexityBand = "High";
  else if (score >= 35) complexityBand = "Medium";

  // Hours model (solo builder)
  let baseHours = 6;
  baseHours += pageEstimate * 2.5;
  if (features.ecommerce) baseHours += 18;
  if (features.booking) baseHours += 8;
  if (features.blog) baseHours += 4;
  if (features.cms) baseHours += 6;
  if (features.customCode) baseHours += 10;
  if (features.forms) baseHours += 3;
  if (features.payments) baseHours += 5;
  if (features.auth) baseHours += 8;
  if (features.integrations) baseHours += 8;
  if (features.seo) baseHours += 3;
  if (features.copywriting) baseHours += 6;
  if (features.branding) baseHours += 5;
  if (features.multilingual) baseHours += 8;

  const uncertainty = score >= 70 ? 0.3 : score >= 45 ? 0.2 : 0.15;
  const hoursLow = Math.max(8, Math.round(baseHours * (1 - uncertainty)));
  const hoursHigh = Math.round(baseHours * (1 + uncertainty));

  // "Build days" assuming ~5 focused production hours/day after admin/comms
  const buildDaysLow = Math.max(2, Math.round(hoursLow / 5));
  const buildDaysHigh = Math.max(buildDaysLow, Math.round(hoursHigh / 5));

  const hourlyRate = 40;
  const costLow = hoursLow * hourlyRate;
  const costHigh = hoursHigh * hourlyRate;

  let priceGapNote = "No quote price found yet.";
  if (quotePrice != null) {
    if (quotePrice < costLow) {
      priceGapNote = `Quoted price looks LOW vs your $40/hr baseline (about ${money(costLow - quotePrice)} under the low estimate).`;
    } else if (quotePrice > costHigh) {
      priceGapNote = `Quoted price is above the $40/hr baseline range (about ${money(quotePrice - costHigh)} over the high estimate). This may be fine if you’re pricing strategy/risk/value in.`;
    } else {
      priceGapNote = `Quoted price sits inside your $40/hr baseline range.`;
    }
  }

  const risks: string[] = [];
  if (features.fastTimeline) risks.push("Rush timeline can compress QA and revision time.");
  if (features.copywriting) risks.push("If client content is not ready, timeline can slip.");
  if (features.integrations) risks.push("Integrations/APIs can add hidden debugging time.");
  if (features.ecommerce) risks.push("Product/checkout setups need extra testing and policy pages.");
  if (features.auth) risks.push("Account/login flows increase complexity and support needs.");
  if (pageEstimate >= 8) risks.push("Higher page count increases content coordination overhead.");

  const questions: string[] = [
    "How many final pages/sections do you want in v1?",
    "Do you already have your content (text, photos, logo), or do you need help creating it?",
    "Do you want this on Wix/Squarespace, or a custom Next.js build?",
    "Do you need booking, payments, or client login in phase 1?",
    "What is your ideal launch date (hard deadline vs flexible)?",
    "Who will handle domain/hosting access (or should I handle setup)?",
    "How many revision rounds do you expect?",
  ];

  if (features.ecommerce) {
    questions.push("How many products and product variants are needed at launch?");
    questions.push("What payment/shipping/tax setup do you want?");
  }
  if (features.integrations) {
    questions.push("Which tools must be integrated (CRM, email, forms, calendar, etc.)?");
  }
  if (features.booking) {
    questions.push("Do you already use a calendar/booking system or should I set one up?");
  }

  const phases = [
    { name: "Discovery & Scope Lock", hours: Math.max(3, Math.round(hoursLow * 0.12)), note: "Requirements review, sitemap, platform decision, missing assets list." },
    { name: "Design & Content Prep", hours: Math.max(4, Math.round(hoursLow * 0.22)), note: "Layout direction, visual system, content placement, brand styling." },
    { name: "Build Implementation", hours: Math.max(6, Math.round(hoursLow * 0.42)), note: "Pages, forms, features, mobile responsiveness, integrations." },
    { name: "QA, Revisions & Launch", hours: Math.max(3, Math.round(hoursLow * 0.18)), note: "Testing, fixes, launch checks, handoff notes." },
    { name: "Buffer", hours: Math.max(2, Math.round(hoursLow * 0.06)), note: "Unexpected edits, client delays, final polish." },
  ];

  return {
    complexityScore: score,
    complexityBand,
    pageEstimate,
    hoursLow,
    hoursHigh,
    buildDaysLow,
    buildDaysHigh,
    hourlyRate,
    costLow,
    costHigh,
    quotePrice,
    priceGapNote,
    signals,
    risks,
    questions,
    phases,
  };
}

function JsonBlock({ title, value }: { title: string; value: any }) {
  return (
    <details className="card" style={{ marginTop: 12 }}>
      <summary
        className="cardInner"
        style={{ cursor: "pointer", fontWeight: 900 }}
      >
        {title}
      </summary>
      <div style={{ padding: "0 22px 22px 22px" }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.9)",
            background: "rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </details>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 12,
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
}

async function renderListPage() {
  const supabase = getAdminClient();

  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="container" style={{ padding: "20px 0 40px" }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" />
            Internal Preview
          </div>
          <h1 className="h2" style={{ marginTop: 12 }}>
            Recent quotes (tap “View details”)
          </h1>
          <p className="p" style={{ marginTop: 8 }}>
            Professional admin view + PIE assistant (hours, pricing check, questions, risks).
          </p>

          {error && (
            <p style={{ color: "#ffb4b4", fontWeight: 700 }}>
              Failed to load quotes: {error.message}
            </p>
          )}

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {asArray(quotes).map((q: AnyRow) => {
              const email = extractEmail(q, null);
              const tier = extractTier(q);
              const status = pickFirst(q.status, "new");
              const total = moneyFromCents(extractPriceCents(q));

              return (
                <div
                  key={q.id}
                  className="card"
                  style={{ borderRadius: 16, background: "rgba(255,255,255,0.035)" }}
                >
                  <div className="cardInner" style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900 }}>
                          {total} • {String(tier)} • {String(status)}
                        </div>
                        <div className="smallNote" style={{ marginTop: 4 }}>
                          {fmtDate(q.created_at)}
                        </div>
                        <div className="smallNote" style={{ marginTop: 4 }}>
                          {String(email)} • {String(q.id)}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Link className="btn btnGhost" href={`/internal/preview?quoteId=${q.id}`}>
                          View details <span className="btnArrow">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!asArray(quotes).length && !error && (
              <div className="smallNote">No quotes found yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

async function renderDetailsPage(quoteId: string) {
  const supabase = getAdminClient();

  const [{ data: quote, error: quoteErr }, { data: callRows }, { data: pieRows }] =
    await Promise.all([
      supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
      supabase.from("call_requests").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false }),
      supabase.from("pie_reports").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false }),
    ]);

  let lead: AnyRow | null = null;
  const leadId = quote?.lead_id;
  if (leadId) {
    const { data: leadRow } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
    lead = leadRow ?? null;
  }

  const latestPie = asArray(pieRows)[0] ?? null;
  const assistant = quote ? buildAssistantReport(quote, lead, latestPie) : null;
  const piePayload = extractPiePayload(latestPie);

  return (
    <main className="container" style={{ padding: "20px 0 40px" }}>
      <div style={{ marginBottom: 12 }}>
        <Link className="btn btnGhost" href="/internal/preview">
          ← Back to quotes
        </Link>
      </div>

      {quoteErr && (
        <div className="card">
          <div className="cardInner">
            <p style={{ color: "#ffb4b4", fontWeight: 700 }}>
              Error loading quote: {quoteErr.message}
            </p>
          </div>
        </div>
      )}

      {!quote && !quoteErr && (
        <div className="card">
          <div className="cardInner">
            <p className="p">Quote not found.</p>
          </div>
        </div>
      )}

      {quote && (
        <>
          {/* Header */}
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" />
                Quote Details
              </div>
              <h1 className="h2" style={{ marginTop: 12 }}>
                {moneyFromCents(extractPriceCents(quote))} • {String(extractTier(quote))} •{" "}
                {String(pickFirst(quote.status, "new"))}
              </h1>
              <p className="p" style={{ marginTop: 8 }}>
                {extractEmail(quote, lead)} • {String(quote.id)}
              </p>
              <div className="smallNote" style={{ marginTop: 6 }}>
                Created: {fmtDate(quote.created_at)}
              </div>
            </div>
          </div>

          {/* PIE Assistant */}
          {assistant && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="cardInner">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div className="kicker" style={{ background: "rgba(255,122,24,0.12)", borderColor: "rgba(255,122,24,0.28)" }}>
                      <span className="kickerDot" />
                      PIE Assistant
                    </div>
                    <h2 className="h2" style={{ marginTop: 10 }}>
                      Admin-ready project readout
                    </h2>
                    <p className="p" style={{ marginTop: 8 }}>
                      This is a professional interpretation of the quote + PIE data so you can scope, price, and lead the client conversation fast.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "start", gap: 8, flexWrap: "wrap" }}>
                    <GeneratePieButton quoteId={String(quote.id)} />
                  </div>
                </div>

                <div className="grid2" style={{ marginTop: 12 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <StatPill label="Complexity" value={`${assistant.complexityBand} (${assistant.complexityScore}/100)`} />
                    <StatPill label="Estimated pages" value={`${assistant.pageEstimate}`} />
                    <StatPill label="Build hours (solo)" value={`${assistant.hoursLow}–${assistant.hoursHigh} hrs`} />
                    <StatPill label="Timeline (realistic)" value={`${assistant.buildDaysLow}–${assistant.buildDaysHigh} build days`} />
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <StatPill label="$40/hr baseline range" value={`${money(assistant.costLow)} – ${money(assistant.costHigh)}`} />
                    <StatPill label="Quoted price" value={assistant.quotePrice != null ? money(assistant.quotePrice) : "—"} />
                    <div
                      style={{
                        border: "1px solid rgba(255,122,24,0.22)",
                        background: "rgba(255,122,24,0.08)",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ fontWeight: 900, marginBottom: 4 }}>Pricing check</div>
                      <div className="smallNote" style={{ color: "rgba(255,255,255,0.82)" }}>
                        {assistant.priceGapNote}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signals */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Complexity signals detected</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {assistant.signals.length ? (
                      assistant.signals.map((s, i) => (
                        <span
                          key={i}
                          style={{
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="smallNote">No special features detected from the saved data yet.</span>
                    )}
                  </div>
                </div>

                {/* Risks + Questions */}
                <div className="grid2" style={{ marginTop: 14 }}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Risk flags</div>
                    {assistant.risks.length ? (
                      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                        {assistant.risks.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="smallNote">No major risk flags detected from current intake.</div>
                    )}
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Questions to ask client</div>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                      {assistant.questions.slice(0, 8).map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Build plan */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Suggested build phases</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {assistant.phases.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          padding: 10,
                          background: "rgba(255,255,255,0.03)",
                          display: "grid",
                          gridTemplateColumns: "1.3fr auto",
                          gap: 10,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>{p.name}</div>
                          <div className="smallNote" style={{ marginTop: 4 }}>
                            {p.note}
                          </div>
                        </div>
                        <div
                          style={{
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 999,
                            padding: "4px 8px",
                            fontWeight: 800,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          ~{p.hours}h
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    padding: 10,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>How to use this</div>
                  <div className="smallNote" style={{ color: "rgba(255,255,255,0.82)" }}>
                    Use the hours and pricing range as your internal floor check, then adjust up for strategy, revisions, urgency, and business value.
                    The raw JSON is still below if you want to inspect the original PIE payload.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call Request */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardInner">
              <h2 className="h2">Call request</h2>
              {asArray(callRows).length ? (
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {asArray(callRows).map((c: AnyRow) => (
                    <div
                      key={c.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        padding: 10,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {pickFirst(c.status, "—")} • {fmtDate(c.created_at)}
                      </div>
                      <div className="smallNote" style={{ marginTop: 4 }}>
                        preferred_times: {pickFirst(c.preferred_times, "—")} • best_time_to_call:{" "}
                        {pickFirst(c.best_time_to_call, "—")} • timezone: {pickFirst(c.timezone, "—")}
                      </div>
                      {c.notes ? (
                        <div className="smallNote" style={{ marginTop: 4, color: "rgba(255,255,255,0.85)" }}>
                          Notes: {String(c.notes)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p" style={{ marginTop: 8 }}>No call request found for this quote.</p>
              )}
            </div>
          </div>

          {/* PIE Reports */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardInner">
              <h2 className="h2">PIE report</h2>
              {!asArray(pieRows).length ? (
                <div style={{ marginTop: 10 }}>
                  <p className="p">No PIE report saved yet for this quote.</p>
                  <GeneratePieButton quoteId={String(quote.id)} />
                </div>
              ) : (
                <>
                  <div className="smallNote" style={{ marginTop: 8 }}>
                    Latest saved PIE: {fmtDate(asArray(pieRows)[0]?.created_at)}
                  </div>

                  <JsonBlock title="Latest PIE (raw JSON)" value={piePayload} />

                  {asArray(pieRows).length > 1 && (
                    <details className="card" style={{ marginTop: 12 }}>
                      <summary className="cardInner" style={{ cursor: "pointer", fontWeight: 900 }}>
                        Older PIE reports ({asArray(pieRows).length - 1})
                      </summary>
                      <div style={{ padding: "0 22px 22px 22px", display: "grid", gap: 8 }}>
                        {asArray(pieRows).slice(1).map((r: AnyRow, idx: number) => (
                          <JsonBlock
                            key={r.id ?? idx}
                            title={`PIE #${idx + 2} — ${fmtDate(r.created_at)}`}
                            value={extractPiePayload(r)}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Raw records for debugging */}
          <JsonBlock title="Raw quote row" value={quote} />
          {lead ? <JsonBlock title="Raw lead row" value={lead} /> : null}
          {asArray(callRows).length ? <JsonBlock title="Raw call request rows" value={callRows} /> : null}
          {asArray(pieRows).length ? <JsonBlock title="Raw pie_reports rows" value={pieRows} /> : null}
        </>
      )}
    </main>
  );
}

export default async function InternalPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = (await Promise.resolve(searchParams)) ?? {};
  const quoteIdParam = sp.quoteId;
  const quoteId = Array.isArray(quoteIdParam) ? quoteIdParam[0] : quoteIdParam;

  if (!quoteId) return renderListPage();
  return renderDetailsPage(String(quoteId));
}