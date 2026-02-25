import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOpsPieForIntake } from "@/lib/opsPie";

export const dynamic = "force-dynamic";

/* =========================
   Types (loose on purpose)
   ========================= */
type Row = Record<string, any>;

type AdminAuthResult = {
  user: { id: string; email: string };
  isAdmin: boolean;
  profileRole: string | null;
};

type DashboardData = {
  quotes: Row[];
  leadsById: Map<string, Row>;
  opsIntakes: Row[];
  latestPieByIntakeId: Map<string, Row>;
  latestCallByIntakeId: Map<string, Row>;
  errors: string[];
};

/* =========================
   Server Action: PIE Gen
   ========================= */
async function generatePieAction(formData: FormData) {
  "use server";

  const opsIntakeId = String(formData.get("opsIntakeId") || "").trim();
  if (!opsIntakeId) return;

  const auth = await getAdminAuth();
  if (!auth.isAdmin) {
    redirect("/login?next=/internal/admin");
  }

  await generateOpsPieForIntake(opsIntakeId, { force: true });

  revalidatePath("/internal/admin");
}

/* =========================
   Page
   ========================= */
export default async function InternalAdminPage() {
  const auth = await getAdminAuth();

  if (!auth.user?.email) {
    redirect("/login?next=/internal/admin");
  }

  if (!auth.isAdmin) {
    // If signed in but not admin, send them to the normal dashboard
    redirect("/dashboard");
  }

  const data = await getDashboardData();

  const websiteRows = data.quotes;
  const opsRows = data.opsIntakes;

  const websiteMissingEmail = websiteRows.filter((q) => !getQuoteEmail(q, data.leadsById)).length;
  const websiteMissingEstimate = websiteRows.filter((q) => !hasEstimatePayload(q)).length;
  const opsMissingEmail = opsRows.filter((r) => !getOpsEmail(r)).length;
  const opsMissingPie = opsRows.filter((r) => !data.latestPieByIntakeId.get(String(r.id))).length;

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        {/* Header */}
        <section style={styles.heroCard}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={styles.kicker}>CrecyStudio • Internal Admin</div>
              <h1 style={styles.h1}>Admin Dashboard</h1>
              <p style={styles.subtle}>
                Unified view for website quotes and workflow-ops intakes. PIE reports can be generated directly from here.
              </p>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                Signed in as <strong>{auth.user.email}</strong>
                {auth.profileRole ? <> • role: <strong>{auth.profileRole}</strong></> : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Link href="/dashboard" style={styles.ghostBtn}>
                Client Dashboard
              </Link>
              <a href="/auth/signout" style={styles.primaryBtn}>
                Sign out
              </a>
            </div>
          </div>
        </section>

        {/* KPI / Health strip */}
        <section style={styles.grid4}>
          <StatCard label="Website Quotes" value={String(websiteRows.length)} />
          <StatCard label="Ops Intakes" value={String(opsRows.length)} />
          <StatCard label="Ops PIE Reports Missing" value={String(opsMissingPie)} warn={opsMissingPie > 0} />
          <StatCard
            label="Data Hygiene Issues"
            value={String(websiteMissingEmail + websiteMissingEstimate + opsMissingEmail)}
            warn={websiteMissingEmail + websiteMissingEstimate + opsMissingEmail > 0}
          />
        </section>

        {/* Issues / attention */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>Pipeline checks</div>
          <div style={styles.issueGrid}>
            <IssuePill
              label="Website quotes missing lead email"
              value={websiteMissingEmail}
              severity={websiteMissingEmail > 0 ? "warn" : "ok"}
            />
            <IssuePill
              label="Website quotes missing estimate payload"
              value={websiteMissingEstimate}
              severity={websiteMissingEstimate > 0 ? "warn" : "ok"}
            />
            <IssuePill
              label="Ops intakes missing email"
              value={opsMissingEmail}
              severity={opsMissingEmail > 0 ? "warn" : "ok"}
            />
            <IssuePill
              label="Ops intakes without PIE report"
              value={opsMissingPie}
              severity={opsMissingPie > 0 ? "warn" : "ok"}
            />
          </div>

          {data.errors.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#ffd7a3" }}>Query warnings</div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>
                {data.errors.map((e, i) => (
                  <li key={`${e}-${i}`}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Website Quotes */}
        <section style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.kicker}>Sales Pipeline</div>
              <h2 style={styles.h2}>Website Quotes</h2>
              <p style={styles.subtle}>Quotes from the website estimator / web design flow.</p>
            </div>
          </div>

          {websiteRows.length === 0 ? (
            <EmptyState text="No website quotes found yet." />
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>Company</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Tier</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Hygiene</th>
                    <th style={styles.th}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {websiteRows.map((q) => {
                    const lead = getLeadForQuote(q, data.leadsById);
                    const email = getQuoteEmail(q, data.leadsById);
                    const company =
                      pickFirst(
                        q.company_name,
                        q.business_name,
                        q.client_company,
                        lead?.company_name,
                        lead?.business_name
                      ) || "—";

                    const contact =
                      pickFirst(
                        q.contact_name,
                        q.client_name,
                        q.name,
                        lead?.contact_name,
                        lead?.name,
                        email
                      ) || "—";

                    const status = String(pickFirst(q.status, q.quote_status, lead?.status, "new"));
                    const tier = pickFirst(
                      q.recommended_tier,
                      q.tier,
                      q.tier_name,
                      q.package_name,
                      q.recommendation_tier,
                      "—"
                    );
                    const priceText = getQuotePriceText(q);
                    const hygieneFlags = getQuoteHygieneFlags(q, data.leadsById);

                    return (
                      <tr key={String(q.id)} style={styles.tr}>
                        <td style={styles.td}>{fmtDateTime(q.created_at)}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 700 }}>{truncate(contact, 28)}</div>
                          <div style={styles.mutedTiny}>{truncate(email || "—", 34)}</div>
                        </td>
                        <td style={styles.td}>{truncate(company, 28)}</td>
                        <td style={styles.td}>
                          <StatusBadge label={status} />
                        </td>
                        <td style={styles.td}>{String(tier)}</td>
                        <td style={styles.td}>{priceText}</td>
                        <td style={styles.td}>
                          {hygieneFlags.length === 0 ? (
                            <span style={styles.goodDot}>OK</span>
                          ) : (
                            <div style={{ display: "grid", gap: 4 }}>
                              {hygieneFlags.map((f) => (
                                <span key={f} style={styles.warnMini}>
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={styles.tdMono}>{shortId(q.id)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Ops Intakes */}
        <section style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.kicker}>Operations Pipeline</div>
              <h2 style={styles.h2}>Ops Intakes</h2>
              <p style={styles.subtle}>
                Workflow automation / billing / CRM ops submissions. Generate PIE reports directly from this queue.
              </p>
            </div>
          </div>

          {opsRows.length === 0 ? (
            <EmptyState text="No ops intakes found yet." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {opsRows.map((intake) => {
                const intakeId = String(intake.id);
                const pie = data.latestPieByIntakeId.get(intakeId);
                const callReq = data.latestCallByIntakeId.get(intakeId);

                const email = getOpsEmail(intake);
                const company = pickFirst(intake.company_name, intake.business_name, "—");
                const contact = pickFirst(intake.contact_name, intake.name, email, "—");
                const industry = pickFirst(intake.industry, "—");
                const status = String(pickFirst(intake.status, "new"));
                const tier = pickFirst(
                  intake.recommendation_tier,
                  intake.recommended_tier,
                  "—"
                );
                const priceRange = pickFirst(
                  intake.recommendation_price_range,
                  intake.recommended_price_range,
                  "—"
                );

                const pieStatus = pie ? String(pickFirst(pie.status, "completed")) : "missing";
                const pieSummary =
                  pie && typeof pie.summary === "string" && pie.summary.trim()
                    ? pie.summary.trim()
                    : null;

                const tools = toStringArray(intake.current_tools);
                const pains = toStringArray(intake.pain_points);
                const workflows = toStringArray(intake.workflows_needed);

                const hygieneFlags = getOpsHygieneFlags(intake, pie);

                return (
                  <div key={intakeId} style={styles.opsCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={styles.opsTitle}>{company}</div>
                          <StatusBadge label={status} />
                          <StatusBadge label={`PIE: ${pieStatus}`} kind={pie ? "ok" : "warn"} />
                        </div>

                        <div style={styles.subtleLine}>
                          {contact} • {email || "No email"} • {industry}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <MiniTag label={`Tier: ${String(tier)}`} />
                          <MiniTag label={`Range: ${String(priceRange)}`} />
                          <MiniTag label={`Urgency: ${String(pickFirst(intake.urgency, "—"))}`} />
                          <MiniTag label={`Readiness: ${String(pickFirst(intake.readiness, "—"))}`} />
                          {callReq ? (
                            <MiniTag
                              label={`Call: ${String(
                                pickFirst(callReq.preferred_times, callReq.best_time_to_call, "requested")
                              )}`}
                            />
                          ) : null}
                        </div>

                        <div style={styles.threeCols}>
                          <ListBlock title="Tools" items={tools} />
                          <ListBlock title="Pain points" items={pains} />
                          <ListBlock title="Workflows needed" items={workflows} />
                        </div>

                        <div style={{ marginTop: 8 }}>
                          {pieSummary ? (
                            <div style={styles.pieSummaryBox}>
                              <div style={styles.pieSummaryLabel}>Latest PIE summary</div>
                              <div style={styles.pieSummaryText}>{truncate(pieSummary, 320)}</div>
                            </div>
                          ) : (
                            <div style={styles.pieMissingBox}>
                              No PIE report yet. Generate one to populate diagnosis, quick wins, and implementation plan.
                            </div>
                          )}
                        </div>

                        {hygieneFlags.length > 0 ? (
                          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {hygieneFlags.map((f) => (
                              <span key={f} style={styles.warnMini}>
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ minWidth: 220, display: "grid", gap: 8, alignContent: "start" }}>
                        <div style={styles.metaBox}>
                          <div style={styles.metaRow}>
                            <span>Created</span>
                            <strong>{fmtDateTime(intake.created_at)}</strong>
                          </div>
                          <div style={styles.metaRow}>
                            <span>Intake ID</span>
                            <code style={styles.code}>{shortId(intakeId)}</code>
                          </div>
                          {pie ? (
                            <div style={styles.metaRow}>
                              <span>PIE Generator</span>
                              <strong>{String(pickFirst(pie.generator, "—"))}</strong>
                            </div>
                          ) : null}
                        </div>

                        <form action={generatePieAction}>
                          <input type="hidden" name="opsIntakeId" value={intakeId} />
                          <button type="submit" style={styles.primaryBtnBlock}>
                            {pie ? "Regenerate PIE Report" : "Generate PIE Report"}
                          </button>
                        </form>

                        <Link href={`/ops-book?opsIntakeId=${encodeURIComponent(intakeId)}`} style={styles.ghostBtnBlock}>
                          Open Booking Page
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================
   Data Fetching
   ========================= */

async function getDashboardData(): Promise<DashboardData> {
  const errors: string[] = [];

  // Website side
  const quotesRes = await supabaseAdmin
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (quotesRes.error) {
    errors.push(`quotes query: ${quotesRes.error.message}`);
  }

  const leadsRes = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  // leads table may exist or not depending on your schema; treat as optional
  if (leadsRes.error) {
    errors.push(`leads query: ${leadsRes.error.message}`);
  }

  const leadsById = new Map<string, Row>();
  for (const lead of leadsRes.data || []) {
    if (lead?.id) leadsById.set(String(lead.id), lead);
  }

  // Ops side
  const opsIntakesRes = await supabaseAdmin
    .from("ops_intakes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (opsIntakesRes.error) {
    errors.push(`ops_intakes query: ${opsIntakesRes.error.message}`);
  }

  const opsPieRes = await supabaseAdmin
    .from("ops_pie_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (opsPieRes.error) {
    errors.push(`ops_pie_reports query: ${opsPieRes.error.message}`);
  }

  const opsCallsRes = await supabaseAdmin
    .from("ops_call_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (opsCallsRes.error) {
    errors.push(`ops_call_requests query: ${opsCallsRes.error.message}`);
  }

  const latestPieByIntakeId = new Map<string, Row>();
  for (const row of opsPieRes.data || []) {
    const key = row?.ops_intake_id ? String(row.ops_intake_id) : "";
    if (!key) continue;
    if (!latestPieByIntakeId.has(key)) latestPieByIntakeId.set(key, row);
  }

  const latestCallByIntakeId = new Map<string, Row>();
  for (const row of opsCallsRes.data || []) {
    const key = row?.ops_intake_id ? String(row.ops_intake_id) : "";
    if (!key) continue;
    if (!latestCallByIntakeId.has(key)) latestCallByIntakeId.set(key, row);
  }

  return {
    quotes: quotesRes.data || [],
    leadsById,
    opsIntakes: opsIntakesRes.data || [],
    latestPieByIntakeId,
    latestCallByIntakeId,
    errors,
  };
}

/* =========================
   Auth / Admin Gate
   ========================= */

async function getAdminAuth(): Promise<AdminAuthResult> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const mutable = cookieStore as any;
            cookiesToSet.forEach(({ name, value, options }) => {
              mutable.set(name, value, options);
            });
          } catch {
            // In server components, set may not be available; safe to ignore.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = (user?.email || "").trim().toLowerCase();
  if (!user || !email) {
    return {
      user: { id: "", email: "" },
      isAdmin: false,
      profileRole: null,
    };
  }

  // Check profiles by user id, then email fallback
  let profileRole: string | null = null;

  const profileById = await supabaseAdmin
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileById.data?.role) {
    profileRole = String(profileById.data.role).toLowerCase();
  } else {
    const profileByEmail = await supabaseAdmin
      .from("profiles")
      .select("id,email,role")
      .ilike("email", email)
      .maybeSingle();

    if (profileByEmail.data?.role) {
      profileRole = String(profileByEmail.data.role).toLowerCase();
    }
  }

  const adminEmails = new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const isAdmin = adminEmails.has(email) || profileRole === "admin";

  return {
    user: { id: user.id, email },
    isAdmin,
    profileRole,
  };
}

/* =========================
   Helpers (quote side)
   ========================= */

function getLeadForQuote(q: Row, leadsById: Map<string, Row>) {
  const leadId = q?.lead_id ? String(q.lead_id) : "";
  if (!leadId) return null;
  return leadsById.get(leadId) || null;
}

function getQuoteEmail(q: Row, leadsById: Map<string, Row>) {
  const lead = getLeadForQuote(q, leadsById);
  return (
    normalizeEmail(
      pickFirst(
        q.lead_email,
        q.email,
        q.contact_email,
        q.client_email,
        lead?.email,
        lead?.lead_email
      )
    ) || ""
  );
}

function hasEstimatePayload(q: Row) {
  return Boolean(
    q?.estimate ||
      q?.estimate_json ||
      q?.quote_json ||
      q?.pricing_json ||
      q?.input_snapshot ||
      q?.scope_snapshot ||
      q?.recommended_price ||
      q?.recommendation_price_range
  );
}

function getQuotePriceText(q: Row) {
  const directRange = pickFirst(
    q.recommendation_price_range,
    q.price_range,
    q.estimated_range,
    q.recommended_range
  );
  if (directRange) return String(directRange);

  const directMoney = pickFirst(q.recommended_price, q.price, q.total_price, q.amount);
  if (typeof directMoney === "number") return formatMoney(directMoney);

  if (typeof directMoney === "string" && directMoney.trim()) return directMoney;

  const estimateObj = q?.estimate || q?.estimate_json || q?.quote_json || q?.pricing_json;
  if (estimateObj && typeof estimateObj === "object") {
    const min = (estimateObj as any).recommended ?? (estimateObj as any).price ?? (estimateObj as any).total;
    const lo = (estimateObj as any).floor;
    const hi = (estimateObj as any).premium;

    if (typeof lo === "number" && typeof hi === "number") return `${formatMoney(lo)} - ${formatMoney(hi)}`;
    if (typeof min === "number") return formatMoney(min);
  }

  return "Pending estimate";
}

function getQuoteHygieneFlags(q: Row, leadsById: Map<string, Row>) {
  const flags: string[] = [];
  if (!getQuoteEmail(q, leadsById)) flags.push("Missing email");
  if (!hasEstimatePayload(q)) flags.push("No estimate");
  return flags;
}

/* =========================
   Helpers (ops side)
   ========================= */

function getOpsEmail(intake: Row) {
  return normalizeEmail(pickFirst(intake.email, intake.lead_email, intake.contact_email)) || "";
}

function getOpsHygieneFlags(intake: Row, pie?: Row | null) {
  const flags: string[] = [];
  if (!getOpsEmail(intake)) flags.push("Missing email");
  if (!pie) flags.push("No PIE");
  return flags;
}

/* =========================
   UI Helpers
   ========================= */

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ ...styles.statCard, ...(warn ? styles.statCardWarn : null) }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function IssuePill({
  label,
  value,
  severity,
}: {
  label: string;
  value: number;
  severity: "ok" | "warn";
}) {
  return (
    <div
      style={{
        ...styles.issuePill,
        borderColor: severity === "warn" ? "rgba(255,170,80,.35)" : "rgba(120,255,170,.22)",
        background: severity === "warn" ? "rgba(255,170,80,.06)" : "rgba(120,255,170,.05)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px dashed rgba(255,255,255,.15)",
        borderRadius: 14,
        padding: "16px 14px",
        color: "rgba(255,255,255,.78)",
      }}
    >
      {text}
    </div>
  );
}

function StatusBadge({ label, kind }: { label: string; kind?: "ok" | "warn" | "neutral" }) {
  const l = String(label || "").toLowerCase();

  let bg = "rgba(255,255,255,.06)";
  let bd = "rgba(255,255,255,.15)";
  let color = "rgba(255,255,255,.92)";

  const inferredWarn =
    l.includes("missing") || l.includes("error") || l.includes("blocked") || l.includes("warn");
  const inferredOk =
    l.includes("completed") ||
    l.includes("paid") ||
    l.includes("admin") ||
    l.includes("done") ||
    l.includes("approved");

  const finalKind = kind || (inferredWarn ? "warn" : inferredOk ? "ok" : "neutral");

  if (finalKind === "warn") {
    bg = "rgba(255,170,80,.10)";
    bd = "rgba(255,170,80,.28)";
    color = "#ffd9b0";
  } else if (finalKind === "ok") {
    bg = "rgba(120,255,170,.09)";
    bd = "rgba(120,255,170,.22)";
    color = "#d6ffe9";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${bd}`,
        background: bg,
        color,
        borderRadius: 999,
        padding: "4px 9px",
        fontSize: 12,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function MiniTag({ label }: { label: string }) {
  return (
    <span
      style={{
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.04)",
        borderRadius: 999,
        padding: "4px 8px",
        fontSize: 12,
        color: "rgba(255,255,255,.9)",
      }}
    >
      {label}
    </span>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={styles.listBlock}>
      <div style={styles.listTitle}>{title}</div>
      {items.length === 0 ? (
        <div style={styles.mutedTiny}>None provided</div>
      ) : (
        <ul style={styles.listUl}>
          {items.slice(0, 4).map((i) => (
            <li key={`${title}-${i}`}>{truncate(i, 56)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================
   Primitive helpers
   ========================= */

function pickFirst(...vals: any[]) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    return v;
  }
  return null;
}

function normalizeEmail(value: any): string {
  if (typeof value !== "string") return "";
  const v = value.trim().toLowerCase();
  return v.includes("@") ? v : "";
}

function toStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function fmtDateTime(v: any) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function truncate(v: string, n: number) {
  if (!v) return "";
  return v.length > n ? `${v.slice(0, n - 1)}…` : v;
}

function shortId(v: any) {
  const s = String(v || "");
  return s ? `${s.slice(0, 8)}…` : "—";
}

function formatMoney(n: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

/* =========================
   Styles (inline, self-contained)
   ========================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0f",
    color: "white",
    padding: "20px 14px 40px",
  },
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gap: 14,
  },
  heroCard: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "linear-gradient(180deg, rgba(255,122,24,.08), rgba(255,255,255,.03))",
    borderRadius: 18,
    padding: 16,
  },
  card: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.03)",
    borderRadius: 18,
    padding: 14,
  },
  h1: {
    margin: "8px 0 6px",
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: -0.3,
  },
  h2: {
    margin: "6px 0 2px",
    fontSize: 22,
    lineHeight: 1.15,
    fontWeight: 850,
    letterSpacing: -0.2,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    opacity: 0.82,
    fontWeight: 700,
  },
  subtle: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,.78)",
    lineHeight: 1.5,
    fontSize: 14,
  },
  subtleLine: {
    marginTop: 4,
    color: "rgba(255,255,255,.78)",
    fontSize: 13,
    lineHeight: 1.4,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: "1px solid rgba(255,122,24,.35)",
    background: "rgba(255,122,24,.16)",
    color: "#fff",
    padding: "9px 12px",
    textDecoration: "none",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    padding: "9px 12px",
    textDecoration: "none",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  primaryBtnBlock: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,122,24,.35)",
    background: "rgba(255,122,24,.16)",
    color: "#fff",
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostBtnBlock: {
    display: "inline-flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.04)",
    color: "#fff",
    padding: "10px 12px",
    textDecoration: "none",
    fontWeight: 700,
    boxSizing: "border-box",
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },
  statCard: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.03)",
    borderRadius: 14,
    padding: 12,
  },
  statCardWarn: {
    border: "1px solid rgba(255,170,80,.22)",
    background: "rgba(255,170,80,.05)",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,.78)",
  },
  statValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 10,
  },
  issueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  issuePill: {
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 12,
    padding: 10,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 920,
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "rgba(255,255,255,.72)",
    fontWeight: 700,
    borderBottom: "1px solid rgba(255,255,255,.08)",
    padding: "10px 10px",
    background: "rgba(255,255,255,.02)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,.06)",
  },
  td: {
    padding: "10px 10px",
    verticalAlign: "top",
    fontSize: 13,
    color: "rgba(255,255,255,.94)",
  },
  tdMono: {
    padding: "10px 10px",
    verticalAlign: "top",
    fontSize: 12,
    color: "rgba(255,255,255,.86)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    whiteSpace: "nowrap",
  },
  mutedTiny: {
    color: "rgba(255,255,255,.62)",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 1.3,
  },
  goodDot: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid rgba(120,255,170,.22)",
    background: "rgba(120,255,170,.06)",
    color: "#d6ffe9",
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  warnMini: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid rgba(255,170,80,.24)",
    background: "rgba(255,170,80,.07)",
    color: "#ffd9b0",
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  opsCard: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.02)",
    borderRadius: 14,
    padding: 12,
  },
  opsTitle: {
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.2,
  },
  threeCols: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginTop: 8,
  },
  listBlock: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 10,
    padding: 8,
    background: "rgba(255,255,255,.015)",
    minHeight: 64,
  },
  listTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: "rgba(255,255,255,.72)",
    marginBottom: 6,
    fontWeight: 700,
  },
  listUl: {
    margin: 0,
    paddingLeft: 16,
    color: "rgba(255,255,255,.92)",
    fontSize: 12,
    lineHeight: 1.55,
  },
  pieSummaryBox: {
    border: "1px solid rgba(120,255,170,.16)",
    background: "rgba(120,255,170,.04)",
    borderRadius: 10,
    padding: 10,
  },
  pieSummaryLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: "rgba(255,255,255,.72)",
    fontWeight: 700,
    marginBottom: 4,
  },
  pieSummaryText: {
    fontSize: 13,
    color: "rgba(255,255,255,.92)",
    lineHeight: 1.45,
  },
  pieMissingBox: {
    border: "1px dashed rgba(255,170,80,.24)",
    background: "rgba(255,170,80,.04)",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "rgba(255,255,255,.86)",
    lineHeight: 1.45,
  },
  metaBox: {
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 10,
    padding: 10,
    background: "rgba(255,255,255,.015)",
    display: "grid",
    gap: 6,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
    color: "rgba(255,255,255,.84)",
  },
  code: {
    fontSize: 11,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    opacity: 0.95,
  },
};

/* Basic responsive tweaks via inline-safe pattern */
styles.grid4 = {
  ...styles.grid4,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};
styles.issueGrid = {
  ...styles.issueGrid,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};
styles.threeCols = {
  ...styles.threeCols,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};
