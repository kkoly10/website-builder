"use client";

import { useMemo, useState } from "react";

type AnyRow = Record<string, any>;

type PortalBundle = {
  quote: AnyRow | null;
  lead: AnyRow | null;
  callRequest: AnyRow | null;
  pieReport: AnyRow | null;
  milestones: AnyRow[];
};

export default function PortalClient({
  token,
  quoteId,
  bundle,
}: {
  token: string;
  quoteId: string;
  bundle: PortalBundle;
}) {
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionText, setRevisionText] = useState("");

  const quote = bundle.quote ?? {};
  const lead = bundle.lead ?? {};
  const call = bundle.callRequest ?? {};
  const pie = bundle.pieReport ?? {};
  const milestones = Array.isArray(bundle.milestones) ? bundle.milestones : [];

  const piePayload = useMemo(() => {
    const raw =
      pie?.report_json ??
      pie?.report ??
      pie?.payload ??
      pie?.data ??
      null;

    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [pie]);

  const pricing = piePayload?.pricing ?? {};
  const targetPrice =
    num(pricing?.target) ??
    num(quote?.recommended_price) ??
    num(quote?.estimate) ??
    centsToDollarsMaybe(quote?.total_cents) ??
    centsToDollarsMaybe(quote?.estimate_cents);

  const minPrice =
    num(pricing?.minimum) ??
    num(quote?.floor_price) ??
    centsToDollarsMaybe(quote?.min_cents);

  const maxPrice =
    num(pricing?.maximum) ??
    num(quote?.premium_price) ??
    num(pricing?.buffers?.find?.((b: any) => /upper/i.test(b?.label || ""))?.amount) ??
    centsToDollarsMaybe(quote?.max_cents);

  const complexityScore = num(piePayload?.score) ?? num(pie?.score);
  const confidence = piePayload?.confidence ?? pie?.confidence ?? "—";
  const tierLabel =
    piePayload?.tier ??
    quote?.tier ??
    "—";

  // PIE upgrades you asked for (hours + labor estimate)
  const estimatedHours =
    num(piePayload?.execution?.hours_estimate) ??
    num(piePayload?.timeline?.hours_estimate) ??
    num(piePayload?.hours_estimate) ??
    estimateHoursFallback({ quote, piePayload });

  const hourlyRate =
    num(piePayload?.execution?.hourly_rate) ??
    num(piePayload?.hourly_rate) ??
    40;

  const laborEstimate =
    estimatedHours != null ? round2(estimatedHours * hourlyRate) : null;

  const timelineDays =
    num(piePayload?.timeline?.days_estimate) ??
    num(piePayload?.timeline_days) ??
    estimateTimelineDaysFallback(estimatedHours);

  const buildSummary =
    piePayload?.summary ??
    "We’ve reviewed your request and prepared a recommended scope and next steps.";

  const scopeSnapshot = buildScopeSnapshot(quote, piePayload);
  const clientChecklist = buildClientChecklist(quote, piePayload);

  const depositAmount =
    num(quote?.deposit_amount) ??
    centsToDollarsMaybe(quote?.deposit_cents) ??
    (targetPrice ? round2(targetPrice * 0.5) : null);

  const depositUrl =
    quote?.deposit_url ||
    quote?.checkout_url ||
    quote?.stripe_checkout_url ||
    "";

  const projectStatus =
    quote?.admin_status ||
    quote?.status ||
    "new";

  const contactEmail =
    "hello@crecystudio.com";

  return (
    <div className="section">
      <div className="container">
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="kicker" style={{ marginBottom: 10 }}>
                  <span className="kickerDot" />
                  Client Portal
                </div>
                <h1 className="h2" style={{ margin: 0 }}>
                  Project dashboard
                </h1>
                <p className="p" style={{ margin: "8px 0 0" }}>
                  Welcome{lead?.full_name ? `, ${lead.full_name}` : ""}. This page shows your scope, next steps, and project progress.
                </p>
              </div>

              <div className="badge badgeHot" title="Portal token">
                {shortToken(token)}
              </div>
            </div>
          </div>

          <div className="panelBody">
            <div className="grid2">
              <InfoBlock
                title="Project"
                rows={[
                  ["Quote ID", quoteId],
                  ["Status", pretty(projectStatus)],
                  ["Tier", pretty(tierLabel)],
                  ["Created", fmtDate(quote?.created_at)],
                ]}
              />
              <InfoBlock
                title="Contact"
                rows={[
                  ["Email", lead?.email || lead?.contact_email || "—"],
                  ["Phone", lead?.phone || "—"],
                  ["Best call time", call?.best_time_to_call || call?.preferred_times || "—"],
                  ["Timezone", call?.timezone || "—"],
                ]}
              />
            </div>
          </div>
        </div>

        <div className="grid2" style={{ alignItems: "start" }}>
          {/* Scope Snapshot */}
          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ margin: 0, fontSize: 22 }}>
                Scope Snapshot
              </h2>
              <p className="pDark" style={{ margin: "8px 0 0" }}>
                Your current requested scope and what we’ll build first.
              </p>
            </div>
            <div className="panelBody">
              <ul style={ulStyle}>
                {scopeSnapshot.map((item, idx) => (
                  <li key={idx} style={liStyle}>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="hint" style={{ marginTop: 12 }}>
                <strong>Build summary:</strong> {buildSummary}
              </div>
            </div>
          </div>

          {/* Pricing + Deposit */}
          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ margin: 0, fontSize: 22 }}>
                Pricing & Deposit
              </h2>
              <p className="pDark" style={{ margin: "8px 0 0" }}>
                Recommended pricing and deposit to start.
              </p>
            </div>
            <div className="panelBody">
              <div className="grid2" style={{ gap: 10 }}>
                <MiniStat label="Recommended" value={money(targetPrice)} />
                <MiniStat label="Deposit" value={money(depositAmount)} />
                <MiniStat label="Range" value={priceRange(minPrice, maxPrice)} />
                <MiniStat label="Confidence" value={String(confidence)} />
              </div>

              <div className="hint" style={{ marginTop: 12 }}>
                <strong>Next step:</strong>{" "}
                {depositUrl
                  ? "Use the button below to pay your deposit and lock in your project slot."
                  : "Deposit checkout link will appear here once your proposal is approved."}
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                {depositUrl ? (
                  <a
                    className="btn btnPrimary"
                    href={depositUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pay deposit <span className="btnArrow">→</span>
                  </a>
                ) : (
                  <button className="btn btnGhost" disabled title="Deposit link not generated yet">
                    Deposit link pending
                  </button>
                )}
                <a
                  className="btn btnGhost"
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                    "CrecyStudio proposal question"
                  )}&body=${encodeURIComponent(
                    `Hi, I have a question about my proposal.\n\nQuote ID: ${quoteId}\n`
                  )}`}
                >
                  Ask a question
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline / Milestones + Build Intelligence */}
        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ margin: 0, fontSize: 22 }}>
                Project Timeline
              </h2>
              <p className="pDark" style={{ margin: "8px 0 0" }}>
                Estimated delivery pace and milestones.
              </p>
            </div>
            <div className="panelBody">
              <div className="grid2" style={{ gap: 10 }}>
                <MiniStat label="Complexity" value={complexityScore != null ? `${complexityScore}/100` : "—"} />
                <MiniStat label="Timeline" value={timelineDays != null ? `${timelineDays} days` : "—"} />
                <MiniStat label="Est. Hours" value={estimatedHours != null ? `${estimatedHours} hrs` : "—"} />
                <MiniStat label="Labor @ $40/hr" value={money(laborEstimate)} />
              </div>

              <div className="hint" style={{ marginTop: 12 }}>
                These estimates help us keep pricing fair and avoid under-scoping your build.
              </div>

              {milestones.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  {milestones.map((m, idx) => {
                    const done = Boolean(m?.is_done ?? m?.done ?? m?.completed);
                    return (
                      <div key={m?.id ?? idx} className="checkRow" style={{ marginBottom: 8 }}>
                        <div className="checkLeft">
                          <input type="checkbox" checked={done} readOnly />
                          <div>
                            <div className="checkLabel">
                              {m?.title || `Milestone ${idx + 1}`}
                            </div>
                            <div className="checkHint">
                              {m?.description || (done ? "Completed" : "In progress")}
                            </div>
                          </div>
                        </div>
                        <div className="checkHint">
                          {m?.due_date ? fmtDate(m.due_date) : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hint" style={{ marginTop: 12 }}>
                  Milestones will appear here after kickoff (e.g., content review, first draft, revisions, launch).
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <h2 className="h2" style={{ margin: 0, fontSize: 22 }}>
                What We Need From You
              </h2>
              <p className="pDark" style={{ margin: "8px 0 0" }}>
                Sending these early helps us build faster.
              </p>
            </div>
            <div className="panelBody">
              <ul style={ulStyle}>
                {clientChecklist.map((item, idx) => (
                  <li key={idx} style={liStyle}>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="row" style={{ marginTop: 12 }}>
                <a
                  className="btn btnGhost"
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                    "CrecyStudio assets for project"
                  )}&body=${encodeURIComponent(
                    `Hi, I’m sending project assets.\n\nQuote ID: ${quoteId}\nPortal token: ${token}\n\nAssets included:\n- \n`
                  )}`}
                >
                  Send assets by email
                </a>
                <button
                  className="btn btnGhost"
                  onClick={() => {
                    navigator.clipboard.writeText(quoteId).catch(() => {});
                  }}
                >
                  Copy Quote ID
                </button>
              </div>

              <div className="hint" style={{ marginTop: 12 }}>
                Next step (we’ll wire this after): a direct upload area for logos, photos, and text files.
              </div>
            </div>
          </div>
        </div>

        {/* Revisions */}
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2" style={{ margin: 0, fontSize: 22 }}>
              Revisions & Requests
            </h2>
            <p className="pDark" style={{ margin: "8px 0 0" }}>
              Need a change? Send a revision note clearly so we can track it.
            </p>
          </div>
          <div className="panelBody">
            {!showRevisionBox ? (
              <div className="row">
                <button className="btn btnPrimary" onClick={() => setShowRevisionBox(true)}>
                  Request a revision <span className="btnArrow">→</span>
                </button>
                <a
                  className="btn btnGhost"
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                    "CrecyStudio revision request"
                  )}&body=${encodeURIComponent(
                    `Hi, I’d like to request a revision.\n\nQuote ID: ${quoteId}\n\nRequested changes:\n1)\n2)\n3)\n`
                  )}`}
                >
                  Email revision instead
                </a>
              </div>
            ) : (
              <>
                <label className="fieldLabel">Revision request details</label>
                <textarea
                  className="textarea"
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="Example: Please replace the hero image, update the About section text, and move the contact button above the fold."
                />

                <div className="row" style={{ marginTop: 12 }}>
                  <a
                    className="btn btnPrimary"
                    href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                      "CrecyStudio revision request"
                    )}&body=${encodeURIComponent(
                      `Hi, I’d like to request a revision.\n\nQuote ID: ${quoteId}\n\nRequested changes:\n${revisionText || "(Please add details)"}\n`
                    )}`}
                  >
                    Send revision request <span className="btnArrow">→</span>
                  </a>
                  <button className="btn btnGhost" onClick={() => setShowRevisionBox(false)}>
                    Cancel
                  </button>
                </div>

                <p className="smallNote" style={{ marginTop: 10 }}>
                  Next step (we’ll wire this after): save revisions directly to your dashboard instead of email.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function InfoBlock({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="panel" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="panelBody">
        <div className="badge" style={{ marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 10,
                alignItems: "start",
              }}
            >
              <div className="checkHint">{k}</div>
              <div style={{ color: "rgba(255,255,255,0.9)", wordBreak: "break-word" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 14,
        padding: 10,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div className="checkHint">{label}</div>
      <div style={{ marginTop: 4, fontWeight: 900 }}>{value || "—"}</div>
    </div>
  );
}

/* ---------- Data shaping ---------- */

function buildScopeSnapshot(quote: AnyRow, piePayload: AnyRow | null): string[] {
  const out: string[] = [];

  const pages =
    quote?.pages ||
    quote?.page_count ||
    piePayload?.scope?.pages ||
    piePayload?.pages ||
    null;

  const features =
    piePayload?.scope?.features ||
    quote?.features ||
    quote?.selected_features ||
    [];

  const platform =
    piePayload?.scope?.platform ||
    quote?.platform ||
    quote?.platform_preference ||
    "Best-fit platform";

  const timeline =
    piePayload?.timeline?.summary ||
    quote?.timeline ||
    null;

  out.push(`Platform: ${String(platform)}`);
  if (pages) out.push(`Pages/sections: ${String(pages)}`);

  if (Array.isArray(features) && features.length) {
    out.push(`Core features: ${features.slice(0, 5).join(", ")}`);
  } else {
    out.push("Core features: Standard marketing site setup + contact conversion flow");
  }

  if (timeline) out.push(`Timeline target: ${String(timeline)}`);

  out.push("Includes: responsive design, structured layout, and launch-ready setup");
  out.push("Excludes (unless added): advanced custom app logic, heavy integrations, or large migrations");

  return out;
}

function buildClientChecklist(quote: AnyRow, piePayload: AnyRow | null): string[] {
  const items: string[] = [];

  items.push("Logo files (PNG/SVG) and brand colors (if available)");
  items.push("Business description + services/products list");
  items.push("Preferred contact info (phone, email, location, hours)");

  const hasGalleryIntent =
    includesAny(quote, ["gallery", "portfolio", "photos"]) ||
    includesAny(piePayload, ["gallery", "portfolio", "photos"]);

  if (hasGalleryIntent) {
    items.push("High-quality photos for gallery/portfolio sections");
  } else {
    items.push("Any hero images or photos you want on the homepage");
  }

  const hasBookingIntent =
    includesAny(quote, ["booking", "appointment", "schedule"]) ||
    includesAny(piePayload, ["booking", "appointment", "schedule"]);

  if (hasBookingIntent) {
    items.push("Booking preferences (calendar tool, time slots, confirmation rules)");
  }

  items.push("Any examples of websites you like (2–3 links)");
  items.push("Final text/content or permission for us to draft placeholder copy");

  return dedupe(items);
}

/* ---------- utils ---------- */

function num(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function centsToDollarsMaybe(v: any): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return round2(n / 100);
}

function money(v: any): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function priceRange(min: any, max: any) {
  const a = Number(min);
  const b = Number(max);
  if (Number.isFinite(a) && Number.isFinite(b)) return `${money(a)}–${money(b)}`;
  if (Number.isFinite(a)) return `From ${money(a)}`;
  if (Number.isFinite(b)) return `Up to ${money(b)}`;
  return "—";
}

function fmtDate(v: any): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function pretty(v: any): string {
  if (!v) return "—";
  return String(v)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function shortToken(token: string) {
  if (!token) return "portal";
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function estimateHoursFallback({
  quote,
  piePayload,
}: {
  quote: AnyRow;
  piePayload: AnyRow | null;
}) {
  const complexity = num(piePayload?.score) ?? 30;
  const tier = String(piePayload?.tier || quote?.tier || "").toLowerCase();

  // Basic baseline:
  // essential ~10-18h, growth ~18-35h, premium ~35-80h
  let base = 12;
  if (tier.includes("growth")) base = 24;
  if (tier.includes("premium")) base = 42;

  // Complexity adjustment
  const adjusted = base + (complexity - 30) * 0.35;

  return Math.max(8, Math.round(adjusted));
}

function estimateTimelineDaysFallback(hours: number | null) {
  if (hours == null) return null;
  // assuming 2-4 focused build hours/day on active projects
  return Math.max(4, Math.ceil(hours / 3));
}

function includesAny(obj: any, words: string[]) {
  try {
    const text = JSON.stringify(obj || {}).toLowerCase();
    return words.some((w) => text.includes(w));
  } catch {
    return false;
  }
}

function dedupe(arr: string[]) {
  return Array.from(new Set(arr));
}

const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 8,
};

const liStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.55,
};