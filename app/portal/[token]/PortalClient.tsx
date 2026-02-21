"use client";

import { useMemo, useState } from "react";

type AnyObj = Record<string, any>;

type PortalClientProps = {
  // Keep this flexible so it works with different server wrappers
  token?: string;
  params?: { token?: string };
  data?: AnyObj;
  portal?: AnyObj;
  initialData?: AnyObj;

  quote?: AnyObj;
  lead?: AnyObj;
  callRequest?: AnyObj;
  pie?: AnyObj;
  milestones?: AnyObj[];
};

function asObj(v: unknown): AnyObj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as AnyObj) : {};
}

function asArr<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function pick(obj: AnyObj, keys: string[], fallback: any = null) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function money(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function dateTime(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function titleCase(s: unknown) {
  const raw = String(s ?? "").trim();
  if (!raw) return "—";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizePortalData(props: PortalClientProps) {
  const root =
    asObj(props.portal).quote || asObj(props.portal).lead || asObj(props.portal).pie
      ? asObj(props.portal)
      : asObj(props.data).quote || asObj(props.data).lead || asObj(props.data).pie
      ? asObj(props.data)
      : asObj(props.initialData).quote || asObj(props.initialData).lead || asObj(props.initialData).pie
      ? asObj(props.initialData)
      : {};

  const quote = asObj(props.quote).id ? asObj(props.quote) : asObj(root.quote);
  const lead = asObj(props.lead).id ? asObj(props.lead) : asObj(root.lead);
  const callRequest = asObj(props.callRequest).id ? asObj(props.callRequest) : asObj(root.callRequest);
  const pie = asObj(props.pie).id ? asObj(props.pie) : asObj(root.pie);

  const token =
    props.token ||
    props.params?.token ||
    pick(root, ["token", "portal_token", "client_token"], "");

  const quoteData = asObj(pick(quote, ["quote_data", "payload", "details", "form_data"], {}));
  const scopeSnapshot =
    asObj(pick(quote, ["scope_snapshot", "scopeSnapshot"], {})) ||
    asObj(pick(quoteData, ["scope_snapshot", "scopeSnapshot"], {})) ||
    asObj(pick(asObj(pie), ["scope_snapshot", "scopeSnapshot"], {})) ||
    {};

  const pieReport =
    asObj(pick(pie, ["report_json", "report", "data"], {})) ||
    asObj(pick(root, ["pieReport", "pie_report"], {})) ||
    {};

  const pricing = asObj(pick(pieReport, ["pricing"], {}));
  const labor = asObj(pick(pieReport, ["labor"], {}));
  const timeline = asObj(pick(pieReport, ["timeline"], {}));
  const deliverables = asObj(pick(pieReport, ["deliverables"], {}));
  const nextQuestions = asArr<string>(pick(pieReport, ["nextQuestions", "next_questions"], []));

  const estimateTarget =
    pick(quote, ["estimated_price", "estimate", "total_estimate"], null) ??
    pick(quote, ["estimate_total"], null) ??
    (typeof quote.total_cents === "number" ? quote.total_cents / 100 : null) ??
    pick(pricing, ["target"], null);

  const estimateMin =
    pick(quote, ["estimate_min"], null) ??
    (typeof quote.min_cents === "number" ? quote.min_cents / 100 : null) ??
    pick(pricing, ["minimum"], null);

  const estimateMax =
    pick(quote, ["estimate_max"], null) ??
    (typeof quote.max_cents === "number" ? quote.max_cents / 100 : null) ??
    pick(pricing, ["maximum"], null) ??
    (Array.isArray(pricing.buffers)
      ? pricing.buffers.find((b: any) => /upper|max/i.test(String(b?.label ?? "")))?.amount
      : null);

  const hourlyRate = Number(pick(labor, ["hourlyRate"], 40)) || 40;
  const hoursLow = Number(pick(labor, ["hoursLow"], null));
  const hoursHigh = Number(pick(labor, ["hoursHigh"], null));
  const hoursTarget = Number(pick(labor, ["hoursTarget"], null));

  const timelineDays =
    Number(
      pick(timeline, ["daysTarget"], null) ??
        pick(pieReport, ["timeline_days"], null) ??
        pick(quote, ["timeline_days"], null)
    ) || 0;

  const tier =
    titleCase(pick(quote, ["tier", "package_tier"], null) ?? pick(pieReport, ["tier"], null));

  const status = titleCase(pick(quote, ["status"], null));

  const recommendedDepositPct =
    Number(
      pick(pieReport, ["depositPercent", "deposit_percent"], null) ??
        pick(quote, ["deposit_percent"], null)
    ) || 50;

  const depositAmount =
    Number(
      pick(pieReport, ["depositAmount", "deposit_amount"], null) ??
        (estimateTarget && Number.isFinite(Number(estimateTarget))
          ? (Number(estimateTarget) * recommendedDepositPct) / 100
          : 0)
    ) || 0;

  const milestonesFromData = asArr<any>(
    props.milestones?.length ? props.milestones : pick(root, ["milestones"], [])
  );

  const milestoneDefaults = [
    { title: "Kickoff & scope confirmation", status: "upcoming", eta: "Day 1" },
    { title: "Content/assets collection", status: "upcoming", eta: "Day 1–3" },
    { title: "First build draft", status: "upcoming", eta: "Day 3–7" },
    { title: "Review & revisions", status: "upcoming", eta: "Day 7–10" },
    { title: "Launch prep & handoff", status: "upcoming", eta: "Day 10–14" },
  ];

  const milestones =
    milestonesFromData.length > 0
      ? milestonesFromData.map((m) => ({
          title: pick(asObj(m), ["title", "name"], "Milestone"),
          status: titleCase(pick(asObj(m), ["status"], "upcoming")).toLowerCase(),
          eta: pick(asObj(m), ["eta", "due_label", "due"], "—"),
          notes: pick(asObj(m), ["notes"], ""),
        }))
      : milestoneDefaults;

  const pages =
    asArr<string>(pick(scopeSnapshot, ["pages", "sections"], [])) ||
    asArr<string>(pick(quoteData, ["pages", "sections"], [])) ||
    [];

  const features =
    asArr<string>(pick(scopeSnapshot, ["features", "requested_features"], [])) ||
    asArr<string>(pick(quoteData, ["features", "requested_features"], [])) ||
    [];

  const assetsNeeded =
    asArr<string>(pick(scopeSnapshot, ["assets_needed", "assetsNeeded"], [])) ||
    asArr<string>(pick(deliverables, ["assetsNeeded"], [])) ||
    [
      "Logo (PNG/SVG)",
      "Brand colors/fonts (if you have them)",
      "Website text/content",
      "Photos/images",
      "Contact info + social links",
    ];

  const platform =
    titleCase(
      pick(scopeSnapshot, ["platform"], null) ??
        pick(quoteData, ["platform"], null) ??
        pick(pieReport, ["platformRecommendation", "platform_recommendation"], null)
    ) || "To be confirmed";

  const businessName =
    pick(lead, ["name", "full_name"], null) ??
    pick(quoteData, ["business_name", "businessName"], null) ??
    "Your project";

  const clientEmail =
    pick(lead, ["email"], null) ?? pick(quote, ["email"], null) ?? pick(quoteData, ["email"], null);

  const contentReadiness =
    titleCase(
      pick(scopeSnapshot, ["content_readiness", "contentReadiness"], null) ??
        pick(quoteData, ["content_readiness", "contentReadiness"], null) ??
        "Unknown"
    );

  const quoteId = pick(quote, ["id"], "—");
  const createdAt = pick(quote, ["created_at", "createdAt"], null);

  const paymentUrl =
    pick(root, ["paymentUrl", "payment_url"], null) ??
    pick(quote, ["payment_url", "deposit_payment_url"], null) ??
    null;

  const uploadUrl =
    pick(root, ["uploadUrl", "upload_url"], null) ??
    pick(quote, ["upload_url"], null) ??
    null;

  const trackerUrl =
    pick(root, ["trackerUrl", "tracker_url"], null) ??
    pick(quote, ["tracker_url"], null) ??
    null;

  return {
    token,
    quote,
    lead,
    callRequest,
    pie,
    pieReport,
    tier,
    status,
    quoteId,
    createdAt,
    businessName,
    clientEmail,
    platform,
    contentReadiness,
    pages,
    features,
    assetsNeeded,
    nextQuestions,
    estimateTarget,
    estimateMin,
    estimateMax,
    hourlyRate,
    hoursLow,
    hoursHigh,
    hoursTarget,
    timelineDays,
    recommendedDepositPct,
    depositAmount,
    milestones,
    paymentUrl,
    uploadUrl,
    trackerUrl,
  };
}

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "badge badgeHot";
  if (s.includes("deposit")) return "badge badgeHot";
  return "badge";
}

export default function PortalClient(props: PortalClientProps) {
  const model = useMemo(() => normalizePortalData(props), [props]);

  const [revisionText, setRevisionText] = useState("");
  const [localRevisionRequests, setLocalRevisionRequests] = useState<string[]>([]);
  const [assetNote, setAssetNote] = useState("");
  const [copied, setCopied] = useState(false);

  const remainingBalance =
    Number.isFinite(Number(model.estimateTarget)) && Number.isFinite(Number(model.depositAmount))
      ? Math.max(0, Number(model.estimateTarget) - Number(model.depositAmount))
      : null;

  const canShowPortal = model.quoteId !== "—" || !!model.clientEmail || !!model.businessName;

  const handleCopyRevision = async () => {
    const text = revisionText.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // no-op
    }
  };

  const addLocalRevision = () => {
    const text = revisionText.trim();
    if (!text) return;
    setLocalRevisionRequests((prev) => [text, ...prev]);
    setRevisionText("");
  };

  if (!canShowPortal) {
    return (
      <main className="section">
        <div className="container">
          <div className="card">
            <div className="cardInner">
              <h1 className="h2">Client Portal</h1>
              <p className="p" style={{ marginTop: 10 }}>
                We couldn’t load this portal yet. The token may be invalid, expired, or the server page
                is not passing data into <code>PortalClient</code>.
              </p>
              <div className="row" style={{ marginTop: 14 }}>
                <a className="btn btnGhost" href="/estimate">
                  Get a new quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container">
        {/* Header */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="cardInner">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div className="kicker">
                  <span className="kickerDot" />
                  Client Portal
                </div>
                <h1 className="h2" style={{ marginTop: 10 }}>
                  {model.businessName}
                </h1>
                <p className="p" style={{ marginTop: 6 }}>
                  Quote #{String(model.quoteId).slice(0, 8)} • {model.tier} • {model.clientEmail || "—"}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className={statusPill(model.status)}>{model.status}</div>
                <div className="pDark" style={{ marginTop: 8 }}>
                  Created: {dateTime(model.createdAt)}
                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              {model.paymentUrl ? (
                <a className="btn btnPrimary" href={model.paymentUrl}>
                  Pay deposit
                </a>
              ) : (
                <button className="btn btnPrimary" type="button" disabled title="Deposit link not connected yet">
                  Pay deposit (coming soon)
                </button>
              )}

              {model.uploadUrl ? (
                <a className="btn btnGhost" href={model.uploadUrl}>
                  Upload assets
                </a>
              ) : (
                <button className="btn btnGhost" type="button" disabled title="Upload flow not connected yet">
                  Upload assets (coming soon)
                </button>
              )}

              {model.trackerUrl ? (
                <a className="btn btnGhost" href={model.trackerUrl}>
                  Track progress
                </a>
              ) : (
                <button className="btn btnGhost" type="button" disabled title="Tracker not connected yet">
                  Track progress (coming soon)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top grid */}
        <div className="grid2" style={{ alignItems: "start" }}>
          {/* Scope Snapshot */}
          <div className="panel">
            <div className="panelHeader">
              <div className="h2" style={{ fontSize: 20 }}>
                Scope Snapshot
              </div>
            </div>
            <div className="panelBody">
              <div className="grid2">
                <div>
                  <div className="fieldLabel">Platform</div>
                  <div className="pDark">{model.platform}</div>
                </div>
                <div>
                  <div className="fieldLabel">Content readiness</div>
                  <div className="pDark">{model.contentReadiness}</div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="fieldLabel">Pages / Sections</div>
                {model.pages.length ? (
                  <div className="row">
                    {model.pages.map((p, idx) => (
                      <span key={`${p}-${idx}`} className="badge">
                        {titleCase(p)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pDark">Will be confirmed during kickoff.</div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="fieldLabel">Requested features</div>
                {model.features.length ? (
                  <ul className="pDark" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {model.features.map((f, idx) => (
                      <li key={`${f}-${idx}`}>{titleCase(f)}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="pDark">No feature list captured yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Budget / Timeline */}
          <div className="panel">
            <div className="panelHeader">
              <div className="h2" style={{ fontSize: 20 }}>
                Pricing & Timeline
              </div>
            </div>
            <div className="panelBody">
              <div className="grid2">
                <div>
                  <div className="fieldLabel">Estimated total</div>
                  <div style={{ fontWeight: 950, fontSize: 22 }}>
                    {money(model.estimateTarget)}
                  </div>
                  {(model.estimateMin || model.estimateMax) && (
                    <div className="pDark" style={{ marginTop: 4 }}>
                      Range: {money(model.estimateMin)} – {money(model.estimateMax)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="fieldLabel">Recommended deposit</div>
                  <div style={{ fontWeight: 950, fontSize: 22 }}>
                    {money(model.depositAmount)}
                  </div>
                  <div className="pDark" style={{ marginTop: 4 }}>
                    {model.recommendedDepositPct}% to start
                  </div>
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 14 }}>
                <div>
                  <div className="fieldLabel">Timeline estimate</div>
                  <div className="pDark">
                    {model.timelineDays > 0 ? `${model.timelineDays} days` : "To be confirmed"}
                  </div>
                </div>
                <div>
                  <div className="fieldLabel">Remaining balance</div>
                  <div className="pDark">
                    {remainingBalance !== null ? money(remainingBalance) : "—"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="fieldLabel">Labor estimate (for transparency)</div>
                <div className="pDark">
                  {Number.isFinite(model.hoursTarget)
                    ? `${model.hoursTarget} hrs @ ${money(model.hourlyRate)}/hr`
                    : Number.isFinite(model.hoursLow) && Number.isFinite(model.hoursHigh)
                    ? `${model.hoursLow}–${model.hoursHigh} hrs @ ${money(model.hourlyRate)}/hr`
                    : `Based on project complexity and scope`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <div className="h2" style={{ fontSize: 20 }}>Progress & Milestones</div>
          </div>
          <div className="panelBody">
            <div style={{ display: "grid", gap: 10 }}>
              {model.milestones.map((m, idx) => {
                const s = String(m.status || "").toLowerCase();
                const isDone = s.includes("done") || s.includes("complete");
                const isActive = s.includes("active") || s.includes("progress");
                return (
                  <div
                    key={`${m.title}-${idx}`}
                    className="checkRow"
                    style={{
                      borderColor: isDone
                        ? "rgba(255,122,24,0.35)"
                        : isActive
                        ? "rgba(255,255,255,0.18)"
                        : "rgba(255,255,255,0.10)",
                    }}
                  >
                    <div className="checkLeft">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          display: "inline-block",
                          background: isDone
                            ? "var(--accent)"
                            : isActive
                            ? "rgba(255,255,255,0.85)"
                            : "rgba(255,255,255,0.28)",
                          boxShadow: isDone
                            ? "0 0 0 4px rgba(255,122,24,0.12)"
                            : "none",
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="checkLabel" style={{ whiteSpace: "normal" }}>
                          {m.title}
                        </div>
                        {m.notes ? <div className="checkHint">{m.notes}</div> : null}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="checkHint">{titleCase(m.status)}</div>
                      <div className="checkHint">{m.eta || "—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assets + Revisions */}
        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="panel">
            <div className="panelHeader">
              <div className="h2" style={{ fontSize: 20 }}>Upload Content & Assets</div>
            </div>
            <div className="panelBody">
              <div className="fieldLabel">Requested assets</div>
              <ul className="pDark" style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                {model.assetsNeeded.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{titleCase(item)}</li>
                ))}
              </ul>

              <div className="fieldLabel">Notes for your upload</div>
              <textarea
                className="textarea"
                placeholder="Example: Logo is attached. Photos are in Google Drive. Use the same colors as Instagram."
                value={assetNote}
                onChange={(e) => setAssetNote(e.target.value)}
              />

              <div className="smallNote" style={{ marginTop: 10 }}>
                Upload storage can be wired next (Supabase Storage / Drive link intake). This UI is ready for it.
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className="btn btnGhost" disabled>
                  Choose files (next step)
                </button>
                {model.uploadUrl ? (
                  <a className="btn btnPrimary" href={model.uploadUrl}>
                    Open upload page
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div className="h2" style={{ fontSize: 20 }}>Request Revisions</div>
            </div>
            <div className="panelBody">
              <div className="fieldLabel">What would you like changed?</div>
              <textarea
                className="textarea"
                placeholder="Example: Please move the contact form above the footer and make the CTA button orange."
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
              />

              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className="btn btnPrimary" onClick={addLocalRevision}>
                  Add request
                </button>
                <button type="button" className="btn btnGhost" onClick={handleCopyRevision}>
                  {copied ? "Copied" : "Copy text"}
                </button>
              </div>

              {localRevisionRequests.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="fieldLabel">Saved requests (local preview)</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {localRevisionRequests.map((r, i) => (
                      <div key={`${r}-${i}`} className="checkRow">
                        <div className="checkLeft">
                          <div className="checkLabel" style={{ whiteSpace: "normal" }}>
                            {r}
                          </div>
                        </div>
                        <div className="checkHint">Draft</div>
                      </div>
                    ))}
                  </div>
                  <div className="smallNote" style={{ marginTop: 8 }}>
                    Next step: connect this to a real <code>portal_revisions</code> table.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions / Communication */}
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <div className="h2" style={{ fontSize: 20 }}>Questions to Finalize Your Build</div>
          </div>
          <div className="panelBody">
            {model.nextQuestions.length > 0 ? (
              <ul className="pDark" style={{ margin: 0, paddingLeft: 18 }}>
                {model.nextQuestions.map((q, idx) => (
                  <li key={`${q}-${idx}`}>{q}</li>
                ))}
              </ul>
            ) : (
              <ul className="pDark" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Do you already have your final website text/content ready?</li>
                <li>Do you have a logo and brand colors?</li>
                <li>What websites do you like as references?</li>
                <li>What is your ideal launch date?</li>
              </ul>
            )}

            <div className="smallNote" style={{ marginTop: 10 }}>
              Portal token: <code>{model.token || "—"}</code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}