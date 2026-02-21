"use client";

import Link from "next/link";

type AnyObj = Record<string, any>;

type PortalClientProps = {
  token: string;
  data?: AnyObj | null;
  error?: string | null;
};

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function toNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatMoney(value: unknown): string {
  const n = toNum(value);
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function prettyStatus(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusBadgeStyles(statusRaw: unknown): React.CSSProperties {
  const s = String(statusRaw || "").toLowerCase();

  if (["done", "completed", "live", "paid", "active"].includes(s)) {
    return {
      border: "1px solid rgba(34,197,94,0.35)",
      background: "rgba(34,197,94,0.12)",
      color: "rgba(220,255,235,0.95)",
    };
  }

  if (["new", "pending", "needs_review", "awaiting_content"].includes(s)) {
    return {
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.04)",
      color: "rgba(255,255,255,0.86)",
    };
  }

  if (["blocked", "overdue", "issue"].includes(s)) {
    return {
      border: "1px solid rgba(239,68,68,0.35)",
      background: "rgba(239,68,68,0.12)",
      color: "rgba(255,220,220,0.95)",
    };
  }

  return {
    border: "1px solid rgba(255,122,24,0.35)",
    background: "rgba(255,122,24,0.12)",
    color: "rgba(255,230,210,0.95)",
  };
}

function getLead(data: AnyObj) {
  return data?.lead ?? data?.quote?.lead ?? null;
}

function getQuote(data: AnyObj) {
  return data?.quote ?? null;
}

function getPie(data: AnyObj) {
  const pie =
    data?.pie ??
    data?.pieReport ??
    data?.latestPie ??
    (Array.isArray(data?.pieReports) ? data.pieReports[0] : null);

  if (!pie) return null;

  // Some rows store analysis in `report_json`, `report`, or `data`
  const payload =
    pie?.report_json ??
    pie?.report ??
    pie?.data ??
    pie?.payload ??
    pie;

  return { row: pie, payload };
}

function getScopeSnapshot(data: AnyObj) {
  return (
    data?.scopeSnapshot ??
    data?.scope_snapshot ??
    data?.project?.scopeSnapshot ??
    data?.project?.scope_snapshot ??
    null
  );
}

function shortToken(token: string) {
  if (!token) return "—";
  if (token.length <= 10) return token;
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function pickArrayStrings(...values: unknown[]): string[] {
  for (const v of values) {
    if (Array.isArray(v)) {
      const arr = v
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean);
      if (arr.length) return arr;
    }
  }
  return [];
}

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function getMilestones(data: AnyObj): AnyObj[] {
  return asArray(
    data?.milestones ??
      data?.project_milestones ??
      data?.project?.milestones ??
      data?.timeline?.milestones
  );
}

function getRevisions(data: AnyObj): AnyObj[] {
  return asArray(
    data?.revisions ??
      data?.revision_requests ??
      data?.project?.revisions ??
      data?.requests?.revisions
  );
}

function getAssets(data: AnyObj): AnyObj[] {
  return asArray(
    data?.assets ??
      data?.uploads ??
      data?.project_assets ??
      data?.project?.assets ??
      data?.files
  );
}

function getDeposit(data: AnyObj) {
  return (
    data?.deposit ??
    data?.payment ??
    data?.payments?.deposit ??
    data?.project?.deposit ??
    null
  );
}

function getPortalTitle(data: AnyObj) {
  return (
    pickString(
      data?.project?.name,
      data?.project_name,
      data?.scopeSnapshot?.businessName,
      data?.scopeSnapshot?.projectName,
      data?.quote?.business_name,
      data?.quote?.project_name,
      data?.quote?.website_name
    ) ?? "Customer Portal"
  );
}

function getProgressFromMilestones(milestones: AnyObj[]): number {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => {
    const s = String(m?.status || "").toLowerCase();
    return ["done", "completed", "live"].includes(s);
  }).length;
  return Math.round((done / milestones.length) * 100);
}

export default function PortalClient({
  token,
  data = null,
  error = null,
}: PortalClientProps) {
  if (error) {
    return (
      <div className="section">
        <div className="container">
          <div className="panel">
            <div className="panelHeader">
              <div className="h2">Customer Portal</div>
            </div>
            <div className="panelBody">
              <div
                style={{
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.08)",
                  borderRadius: 14,
                  padding: 12,
                  color: "rgba(255,230,230,0.95)",
                }}
              >
                {error}
              </div>
              <div className="smallNote" style={{ marginTop: 10 }}>
                Token: {shortToken(token)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="section">
        <div className="container">
          <div className="panel">
            <div className="panelHeader">
              <div className="h2">Customer Portal</div>
            </div>
            <div className="panelBody">
              <div className="p">Portal data not found for this link.</div>
              <div className="smallNote" style={{ marginTop: 8 }}>
                Token: {shortToken(token)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quote = getQuote(data);
  const lead = getLead(data);
  const pie = getPie(data);
  const scope = getScopeSnapshot(data);
  const milestones = getMilestones(data);
  const revisions = getRevisions(data);
  const assets = getAssets(data);
  const deposit = getDeposit(data);

  const piePayload: AnyObj = (pie?.payload ?? {}) as AnyObj;
  const pieRow: AnyObj = (pie?.row ?? {}) as AnyObj;

  const quoteStatus = quote?.status ?? data?.status ?? "new";
  const projectStatus = data?.project?.status ?? data?.project_status ?? quoteStatus;
  const progressPct =
    toNum(data?.project?.progress_percent) ??
    toNum(data?.progress_percent) ??
    getProgressFromMilestones(milestones);

  const tier =
    pickString(
      piePayload?.tier,
      pieRow?.tier,
      quote?.tier,
      data?.tier
    ) ?? "—";

  const complexityScore =
    toNum(piePayload?.score) ??
    toNum(pieRow?.score) ??
    toNum(data?.complexity_score) ??
    null;

  const confidence =
    pickString(piePayload?.confidence, pieRow?.confidence) ?? "—";

  const pricing = piePayload?.pricing ?? {};
  const targetPrice =
    toNum(pricing?.target) ?? toNum(quote?.estimated_price) ?? toNum(quote?.total) ?? null;
  const minPrice =
    toNum(pricing?.minimum) ?? toNum(quote?.minimum_estimate) ?? toNum(quote?.floor_price) ?? null;

  const upperBuffer = Array.isArray(pricing?.buffers)
    ? pricing.buffers.find((b: AnyObj) =>
        String(b?.label || "").toLowerCase().includes("upper")
      )
    : null;
  const maxPrice =
    toNum(upperBuffer?.amount) ??
    toNum(quote?.maximum_estimate) ??
    toNum(quote?.ceiling_price) ??
    null;

  // PIE hours (newer upgraded shape), with fallbacks
  const hours = piePayload?.hours ?? {};
  const hourlyRate =
    toNum(hours?.hourlyRate) ??
    toNum(hours?.rate) ??
    40;

  const hoursLow = toNum(hours?.low);
  const hoursTarget = toNum(hours?.recommended ?? hours?.target);
  const hoursHigh = toNum(hours?.high);

  const buildCostTarget =
    hoursTarget != null && hourlyRate != null ? Math.round(hoursTarget * hourlyRate) : null;

  const buildCostLow =
    hoursLow != null && hourlyRate != null ? Math.round(hoursLow * hourlyRate) : null;

  const buildCostHigh =
    hoursHigh != null && hourlyRate != null ? Math.round(hoursHigh * hourlyRate) : null;

  const timeline = piePayload?.timeline ?? {};
  const timelineText =
    pickString(
      timeline?.recommended,
      timeline?.label,
      scope?.timeline,
      quote?.timeline,
      data?.timeline
    ) ?? "TBD";

  const pages = pickArrayStrings(
    scope?.pages,
    scope?.pageList,
    quote?.pages,
    quote?.page_list
  );

  const features = pickArrayStrings(
    scope?.features,
    scope?.featureList,
    quote?.features,
    quote?.feature_list
  );

  const deliverables = pickArrayStrings(
    scope?.deliverables,
    piePayload?.deliverables
  );

  const exclusions = pickArrayStrings(
    scope?.exclusions,
    piePayload?.exclusions
  );

  const followUpQuestions = pickArrayStrings(
    piePayload?.followUpQuestions,
    piePayload?.questions,
    piePayload?.discovery_questions
  );

  const assumptions = pickArrayStrings(
    piePayload?.assumptions,
    scope?.assumptions
  );

  const contentReadiness =
    pickString(
      scope?.contentReadiness,
      piePayload?.contentReadiness,
      quote?.content_ready
    ) ?? "Unknown";

  const platform =
    pickString(
      scope?.platform,
      piePayload?.platformRecommendation,
      quote?.platform
    ) ?? "To be confirmed";

  const depositAmount =
    toNum(deposit?.amount) ??
    toNum(deposit?.amount_cents) != null
      ? Math.round((toNum(deposit?.amount_cents) || 0) / 100)
      : null;

  const depositStatus =
    pickString(deposit?.status, data?.deposit_status) ?? "not_started";

  const depositUrl =
    pickString(
      deposit?.checkout_url,
      deposit?.url,
      data?.deposit_checkout_url
    ) ?? null;

  const projectName = getPortalTitle(data);
  const leadEmail =
    pickString(
      lead?.email,
      quote?.email,
      data?.email
    ) ?? "—";

  const leadName =
    pickString(
      lead?.name,
      quote?.name,
      data?.name
    ) ?? null;

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div
              className="row"
              style={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div className="h2">{projectName}</div>
                <div className="smallNote" style={{ marginTop: 6 }}>
                  Client Portal • Token {shortToken(token)}
                </div>
              </div>

              <div className="row">
                <span className="badge" style={statusBadgeStyles(projectStatus)}>
                  {prettyStatus(projectStatus)}
                </span>
                <span className="badge" style={statusBadgeStyles(depositStatus)}>
                  Deposit: {prettyStatus(depositStatus)}
                </span>
              </div>
            </div>
          </div>

          <div className="panelBody">
            <div className="grid2">
              <div className="card">
                <div className="cardInner">
                  <div className="smallNote">Client</div>
                  <div style={{ fontWeight: 900, marginTop: 6 }}>
                    {leadName || "Client"}
                  </div>
                  <div className="pDark" style={{ marginTop: 4 }}>
                    {leadEmail}
                  </div>
                  <div className="pDark" style={{ marginTop: 6 }}>
                    Tier: <strong>{prettyStatus(tier)}</strong>
                  </div>
                  <div className="pDark" style={{ marginTop: 4 }}>
                    Portal status: <strong>{prettyStatus(projectStatus)}</strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="cardInner">
                  <div className="smallNote">Project Progress</div>
                  <div style={{ fontWeight: 950, fontSize: 26, marginTop: 6 }}>
                    {progressPct}%
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      height: 10,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, progressPct))}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, rgba(255,122,24,0.95), rgba(255,154,77,0.9))",
                      }}
                    />
                  </div>
                  <div className="smallNote" style={{ marginTop: 8 }}>
                    Timeline target: {timelineText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scope Snapshot */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="h2">Scope Snapshot</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              Client-facing summary of what will be built
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="fieldLabel">Platform</div>
                <div className="pDark">{platform}</div>

                <div className="fieldLabel" style={{ marginTop: 14 }}>
                  Content readiness
                </div>
                <div className="pDark">{prettyStatus(contentReadiness)}</div>

                <div className="fieldLabel" style={{ marginTop: 14 }}>
                  Timeline
                </div>
                <div className="pDark">{timelineText}</div>
              </div>

              <div>
                <div className="fieldLabel">Budget range</div>
                <div className="pDark">
                  {formatMoney(minPrice)} – {formatMoney(maxPrice || targetPrice)}
                  {targetPrice != null ? (
                    <>
                      {" "}
                      <span style={{ opacity: 0.7 }}>
                        (target {formatMoney(targetPrice)})
                      </span>
                    </>
                  ) : null}
                </div>

                {complexityScore != null ? (
                  <>
                    <div className="fieldLabel" style={{ marginTop: 14 }}>
                      Complexity (PIE)
                    </div>
                    <div className="pDark">
                      {complexityScore}/100 • Confidence {confidence}
                    </div>
                  </>
                ) : null}

                {hoursTarget != null ? (
                  <>
                    <div className="fieldLabel" style={{ marginTop: 14 }}>
                      Estimated build effort
                    </div>
                    <div className="pDark">
                      {hoursLow != null ? `${hoursLow}–` : ""}
                      {hoursTarget}
                      {hoursHigh != null ? `–${hoursHigh}` : ""} hours
                    </div>
                    <div className="smallNote" style={{ marginTop: 4 }}>
                      At ${hourlyRate}/hr:{" "}
                      {buildCostLow != null ? `${formatMoney(buildCostLow)} – ` : ""}
                      {formatMoney(buildCostTarget)}
                      {buildCostHigh != null ? ` – ${formatMoney(buildCostHigh)}` : ""}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {pages.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="fieldLabel">Pages / Sections</div>
                <div className="row">
                  {pages.map((p, i) => (
                    <span key={`${p}-${i}`} className="badge">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="fieldLabel">Features</div>
                <div className="row">
                  {features.map((f, i) => (
                    <span key={`${f}-${i}`} className="badge">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deliverables.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="fieldLabel">Deliverables</div>
                <ul className="pDark" style={{ marginTop: 6, paddingLeft: 18 }}>
                  {deliverables.map((d, i) => (
                    <li key={`${d}-${i}`}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {assumptions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="fieldLabel">Assumptions</div>
                <ul className="pDark" style={{ marginTop: 6, paddingLeft: 18 }}>
                  {assumptions.map((a, i) => (
                    <li key={`${a}-${i}`}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {exclusions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="fieldLabel">Exclusions</div>
                <ul className="pDark" style={{ marginTop: 6, paddingLeft: 18 }}>
                  {exclusions.map((e, i) => (
                    <li key={`${e}-${i}`}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Deposit + Payments */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="h2">Deposit</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              Secure your build slot by paying the deposit
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="fieldLabel">Deposit status</div>
                <span className="badge" style={statusBadgeStyles(depositStatus)}>
                  {prettyStatus(depositStatus)}
                </span>

                <div className="fieldLabel" style={{ marginTop: 14 }}>
                  Deposit amount
                </div>
                <div className="pDark">{formatMoney(depositAmount)}</div>
              </div>

              <div>
                <div className="fieldLabel">Actions</div>
                <div className="row">
                  {depositUrl ? (
                    <a
                      href={depositUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btnPrimary"
                    >
                      Pay Deposit <span className="btnArrow">↗</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn btnGhost"
                      disabled
                      style={{ opacity: 0.65, cursor: "not-allowed" }}
                    >
                      Deposit link coming soon
                    </button>
                  )}
                </div>
                <div className="smallNote" style={{ marginTop: 8 }}>
                  If you need an invoice instead of checkout, reply to the project email.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Uploads / Assets */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="h2">Uploads & Assets</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              Logos, copy, images, brand guide, and access credentials
            </div>
          </div>
          <div className="panelBody">
            {assets.length === 0 ? (
              <div className="pDark">
                No files uploaded yet.
                <div className="smallNote" style={{ marginTop: 6 }}>
                  Upload flow can be wired next (Supabase Storage or UploadThing).
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {assets.map((asset, i) => {
                  const name =
                    pickString(asset?.name, asset?.file_name, asset?.filename, asset?.title) ??
                    `Asset ${i + 1}`;
                  const url = pickString(asset?.url, asset?.public_url);
                  const kind = pickString(asset?.kind, asset?.type) ?? "file";
                  const uploadedAt = pickString(asset?.uploaded_at, asset?.created_at);

                  return (
                    <div
                      key={asset?.id ?? `${name}-${i}`}
                      className="card"
                      style={{ borderRadius: 16 }}
                    >
                      <div
                        className="cardInner"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>{name}</div>
                          <div className="pDark" style={{ marginTop: 4 }}>
                            {prettyStatus(kind)}
                            {uploadedAt ? ` • ${formatDate(uploadedAt)}` : ""}
                          </div>
                        </div>

                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btnGhost"
                          >
                            Open <span className="btnArrow">↗</span>
                          </a>
                        ) : (
                          <span className="smallNote">No link</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="h2">Milestones</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              Track what’s done and what’s next
            </div>
          </div>
          <div className="panelBody">
            {milestones.length === 0 ? (
              <div className="pDark">No milestones added yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {milestones.map((m, i) => {
                  const title =
                    pickString(m?.title, m?.name, m?.label) ?? `Milestone ${i + 1}`;
                  const status = pickString(m?.status) ?? "pending";
                  const dueDate = pickString(m?.due_date, m?.dueDate);
                  const notes = pickString(m?.notes, m?.description);

                  return (
                    <div
                      key={m?.id ?? `${title}-${i}`}
                      className="card"
                      style={{ borderRadius: 16 }}
                    >
                      <div className="cardInner">
                        <div
                          className="row"
                          style={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{title}</div>
                          <span className="badge" style={statusBadgeStyles(status)}>
                            {prettyStatus(status)}
                          </span>
                        </div>

                        {(dueDate || notes) && (
                          <div className="pDark" style={{ marginTop: 8 }}>
                            {dueDate ? `Due: ${formatDate(dueDate)}` : ""}
                            {dueDate && notes ? " • " : ""}
                            {notes ?? ""}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Revisions */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="h2">Revisions</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              Revision requests and responses
            </div>
          </div>
          <div className="panelBody">
            {revisions.length === 0 ? (
              <div className="pDark">No revision requests yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {revisions.map((r, i) => {
                  const status = pickString(r?.status) ?? "new";
                  const requestText =
                    pickString(r?.request, r?.request_text, r?.notes, r?.message) ?? "";
                  const responseText =
                    pickString(r?.response, r?.response_text, r?.admin_response) ?? "";
                  const createdAt = pickString(r?.created_at, r?.createdAt);

                  return (
                    <div
                      key={r?.id ?? `rev-${i}`}
                      className="card"
                      style={{ borderRadius: 16 }}
                    >
                      <div className="cardInner">
                        <div
                          className="row"
                          style={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>
                            Revision #{i + 1}
                          </div>
                          <span className="badge" style={statusBadgeStyles(status)}>
                            {prettyStatus(status)}
                          </span>
                        </div>

                        {createdAt && (
                          <div className="smallNote" style={{ marginTop: 6 }}>
                            {formatDate(createdAt)}
                          </div>
                        )}

                        {requestText && (
                          <div style={{ marginTop: 10 }}>
                            <div className="fieldLabel">Request</div>
                            <div className="pDark">{requestText}</div>
                          </div>
                        )}

                        {responseText && (
                          <div style={{ marginTop: 10 }}>
                            <div className="fieldLabel">Response</div>
                            <div className="pDark">{responseText}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="smallNote" style={{ marginTop: 12 }}>
              Next step: wire a “Request Revision” form post to an API route.
            </div>
          </div>
        </div>

        {/* PIE-powered guidance (client-facing version) */}
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panelHeader">
            <div className="h2">Project Guidance</div>
            <div className="smallNote" style={{ marginTop: 6 }}>
              Smart notes based on the intake and project scope
            </div>
          </div>
          <div className="panelBody">
            {pickString(piePayload?.summary, pieRow?.summary) && (
              <div className="pDark" style={{ marginBottom: 12 }}>
                {pickString(piePayload?.summary, pieRow?.summary)}
              </div>
            )}

            {followUpQuestions.length > 0 ? (
              <>
                <div className="fieldLabel">Questions we may need from you</div>
                <ul className="pDark" style={{ marginTop: 6, paddingLeft: 18 }}>
                  {followUpQuestions.map((q, i) => (
                    <li key={`${q}-${i}`}>{q}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="pDark">
                No outstanding discovery questions listed yet.
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="panel">
          <div className="panelHeader">
            <div className="h2">Support</div>
          </div>
          <div className="panelBody">
            <div className="pDark">
              Need help or need to send access details? Reply to your project email thread.
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <Link href="/" className="btn btnGhost">
                Back to Home
              </Link>
              <Link href="/estimate" className="btn btnGhost">
                New Estimate
              </Link>
            </div>

            {/* Optional debug (collapsed) */}
            <details style={{ marginTop: 14 }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 800,
                }}
              >
                Debug (collapsed)
              </summary>
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.75)",
                  overflowX: "auto",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {JSON.stringify(
                  {
                    quoteId: quote?.id ?? null,
                    projectStatus,
                    milestoneCount: milestones.length,
                    revisionCount: revisions.length,
                    assetCount: assets.length,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}