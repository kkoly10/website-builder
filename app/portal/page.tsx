import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  isAdminUser,
} from "@/lib/supabase/server";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

type QuoteRow = {
  id: string;
  lead_id: string | null;
  created_at: string | null;
  status: string | null;
  tier_recommended: string | null;
  estimate_total: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  public_token: string | null;
  deposit_status?: string | null;
};

type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
};

type OpsIntakeRow = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  industry: string | null;
  status: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
};

type OpsCallRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
};

type OpsPieRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
  summary: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function money(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (["closed_won", "active", "approved", "live", "paid"].includes(s)) {
    return {
      bg: "rgba(46, 160, 67, 0.14)",
      border: "rgba(46, 160, 67, 0.34)",
      color: "#b7f5c4",
      label: status || "Active",
    };
  }

  if (["proposal", "reviewing", "evaluating", "deposit", "pending"].includes(s)) {
    return {
      bg: "rgba(201, 168, 76, 0.14)",
      border: "rgba(201, 168, 76, 0.34)",
      color: "#f1d98a",
      label: status || "Pending",
    };
  }

  return {
    bg: "rgba(141, 164, 255, 0.12)",
    border: "rgba(141, 164, 255, 0.26)",
    color: "#d8e0ff",
    label: status || "New",
  };
}

function estimateLabel(q: QuoteRow) {
  if (q.estimate_total != null) return money(q.estimate_total);
  if (q.estimate_low != null || q.estimate_high != null) {
    return `${money(q.estimate_low)} - ${money(q.estimate_high)}`;
  }
  return "Scoped after review";
}

function laneMetaForQuote(q: QuoteRow) {
  const status = String(q.status || "").toLowerCase();
  const deposit = String(q.deposit_status || "").toLowerCase();

  if (deposit === "paid") {
    return {
      phase: "Kickoff Ready",
      nextAction: "Open Project Studio",
    };
  }

  if (["proposal", "deposit"].includes(status)) {
    return {
      phase: "Pre-Start",
      nextAction: "Review workspace and confirm next step",
    };
  }

  if (["active", "closed_won"].includes(status)) {
    return {
      phase: "In Progress",
      nextAction: "Review latest project status",
    };
  }

  return {
    phase: "Intake / Estimate",
    nextAction: q.public_token ? "Open workspace" : "Continue booking",
  };
}

export default async function PortalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent("/portal")}`);

  const claimResult = await claimCustomerRecordsForUser({
    userId: user.id,
    email: user.email,
  });

  const admin = await isAdminUser({
    userId: user.id,
    email: user.email,
  });

  const [{ data: quotes }, { data: opsIntakes }] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select(
        "id, lead_id, created_at, status, tier_recommended, estimate_total, estimate_low, estimate_high, public_token, deposit_status"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),

    supabaseAdmin
      .from("ops_intakes")
      .select(
        "id, created_at, company_name, contact_name, email, industry, status, recommendation_tier, recommendation_price_range, recommendation_score"
      )
      .eq("auth_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const quoteRows = (quotes ?? []) as QuoteRow[];
  const opsRows = (opsIntakes ?? []) as OpsIntakeRow[];

  const leadIds = Array.from(
    new Set(quoteRows.map((q) => q.lead_id).filter(Boolean) as string[])
  );
  const opsIntakeIds = opsRows.map((r) => r.id);

  const [leadRowsRes, opsCallsRes, opsPiesRes] = await Promise.all([
    leadIds.length
      ? supabaseAdmin.from("leads").select("id, email, name").in("id", leadIds)
      : Promise.resolve({ data: [] as LeadRow[] }),

    opsIntakeIds.length
      ? supabaseAdmin
          .from("ops_call_requests")
          .select("id, ops_intake_id, created_at, status")
          .in("ops_intake_id", opsIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsCallRow[] }),

    opsIntakeIds.length
      ? supabaseAdmin
          .from("ops_pie_reports")
          .select("id, ops_intake_id, created_at, status, summary")
          .in("ops_intake_id", opsIntakeIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as OpsPieRow[] }),
  ]);

  const leadRows = (leadRowsRes.data ?? []) as LeadRow[];
  const opsCalls = (opsCallsRes.data ?? []) as OpsCallRow[];
  const opsPies = (opsPiesRes.data ?? []) as OpsPieRow[];

  const leadById = new Map<string, LeadRow>();
  for (const l of leadRows) leadById.set(l.id, l);

  const latestCallByOpsIntakeId = new Map<string, OpsCallRow>();
  for (const c of opsCalls) {
    if (!latestCallByOpsIntakeId.has(c.ops_intake_id)) {
      latestCallByOpsIntakeId.set(c.ops_intake_id, c);
    }
  }

  const latestPieByOpsIntakeId = new Map<string, OpsPieRow>();
  for (const p of opsPies) {
    if (!latestPieByOpsIntakeId.has(p.ops_intake_id)) {
      latestPieByOpsIntakeId.set(p.ops_intake_id, p);
    }
  }

  const websiteCount = quoteRows.length;
  const opsCount = opsRows.length;
  const signedInAs = user.email || "your account";

  return (
    <main className="container section" style={{ paddingBottom: 84 }}>
      <ScrollReveal />
      <div className="heroFadeUp">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Client Portal
        </div>

        <div style={{ height: 14 }} />
        <h1 className="h1">Welcome back</h1>
        <p className="p" style={{ maxWidth: 840, marginTop: 10 }}>
          This is your project hub across all service lanes. Start with the
          active lane, see what is moving, and open the right workspace without
          digging through emails.
        </p>

        <div className="row" style={{ marginTop: 18, alignItems: "center" }}>
          <span
            style={{
              color: "var(--fg)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Signed in as {signedInAs}
          </span>

          {claimResult.ok && !claimResult.skipped ? (
            <span
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                background: "rgba(46, 160, 67, 0.12)",
                border: "1px solid rgba(46, 160, 67, 0.26)",
                color: "#b7f5c4",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Records synced
            </span>
          ) : null}
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <Link href="/build/intro" className="btn btnPrimary">
            New Website Quote <span className="btnArrow">→</span>
          </Link>
          <Link href="/ops-intake" className="btn btnGhost">
            New Ops Intake
          </Link>
          <Link href="/ecommerce/intake" className="btn btnGhost">
            New E-Commerce Intake
          </Link>
          {admin ? (
            <Link href="/internal/admin" className="btn btnGhost">
              Admin HQ
            </Link>
          ) : null}
        </div>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          marginTop: 28,
        }}
      >
        <LaneCard
          title="Website Project Studio"
          desc="Your flagship client workspace for website quotes, scope, assets, preview review, milestones, and launch readiness."
          countLabel={`${websiteCount} website project${websiteCount === 1 ? "" : "s"}`}
          primaryHref={websiteCount > 0 ? "/#website-projects" : "/build/intro"}
          primaryLabel={websiteCount > 0 ? "Open Website Lane" : "Start Website Quote"}
          secondaryHref="/websites"
          secondaryLabel="Learn More"
          tone="gold"
        />

        <LaneCard
          title="Systems Lab"
          desc="Track workflow audits, call status, recommendations, and the operational lane for backend systems and automation."
          countLabel={`${opsCount} ops request${opsCount === 1 ? "" : "s"}`}
          primaryHref={opsCount > 0 ? "/#ops-projects" : "/ops-intake"}
          primaryLabel={opsCount > 0 ? "Open Ops Lane" : "Start Workflow Audit"}
          secondaryHref="/systems"
          secondaryLabel="Learn More"
          tone="blue"
        />

        <LaneCard
          title="Seller Command Center"
          desc="The e-commerce lane is the next workspace to be expanded after Website Studio and Systems Lab are fully staged."
          countLabel="Lane staging"
          primaryHref="/ecommerce/intake"
          primaryLabel="Start E-Commerce Intake"
          secondaryHref="/ecommerce"
          secondaryLabel="Learn More"
          tone="neutral"
        />
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="panel fadeUp">
          <div className="panelBody">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              <MiniStat label="Website Projects" value={String(websiteCount)} />
              <MiniStat label="Ops Requests" value={String(opsCount)} />
              <MiniStat
                label="Website Workspaces"
                value={String(quoteRows.filter((q) => !!q.public_token).length)}
              />
              <MiniStat
                label="Ready for Next Step"
                value={String(
                  quoteRows.filter((q) =>
                    ["proposal", "deposit", "active", "closed_won"].includes(
                      String(q.status || "").toLowerCase()
                    )
                  ).length
                )}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="website-projects" style={{ marginTop: 28 }}>
        <div className="heroFadeUp">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Website Lane
          </div>
          <div style={{ height: 10 }} />
          <h2 className="h2">Website Project Studio</h2>
          <p className="p" style={{ maxWidth: 760, marginTop: 8 }}>
            This is the flagship lane. Each project should eventually route into
            a full client workspace with scope, assets, preview review,
            agreement status, and milestones.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            marginTop: 18,
          }}
        >
          {quoteRows.length === 0 ? (
            <div className="panel fadeUp">
              <div className="panelBody">
                <div
                  style={{
                    color: "var(--fg)",
                    fontWeight: 800,
                    fontSize: 20,
                    marginBottom: 8,
                  }}
                >
                  No website projects yet
                </div>
                <p className="p" style={{ margin: 0 }}>
                  Start the website intake and estimate flow first. Once a quote
                  exists, the project can route into its workspace.
                </p>
                <div className="row" style={{ marginTop: 16 }}>
                  <Link href="/build/intro" className="btn btnPrimary">
                    Start Website Quote <span className="btnArrow">→</span>
                  </Link>
                  <Link href="/websites" className="btn btnGhost">
                    Explore Website Service
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            quoteRows.map((q, i) => {
              const lead = q.lead_id ? leadById.get(q.lead_id) : null;
              const tone = statusTone(q.status);
              const laneMeta = laneMetaForQuote(q);

              return (
                <article
                  key={q.id}
                  className={`panel fadeUp stagger-${Math.min(i + 1, 4)}`}
                >
                  <div className="panelBody">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 16,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "var(--fg)",
                            fontWeight: 900,
                            fontSize: 24,
                            lineHeight: 1.1,
                          }}
                        >
                          {lead?.name || "Website Project"}
                        </div>

                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                            color: "var(--muted)",
                            fontSize: 14,
                          }}
                        >
                          <span>ID: #{String(q.id).slice(0, 8)}</span>
                          <span>•</span>
                          <span>{fmtDate(q.created_at)}</span>
                          <span>•</span>
                          <span>{q.tier_recommended || "Website Scope"}</span>
                        </div>

                        <div
                          style={{
                            marginTop: 14,
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: 12,
                          }}
                        >
                          <InfoTile
                            label="Investment"
                            value={estimateLabel(q)}
                          />
                          <InfoTile label="Phase" value={laneMeta.phase} />
                          <InfoTile
                            label="Next Action"
                            value={laneMeta.nextAction}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 999,
                          background: tone.bg,
                          border: `1px solid ${tone.border}`,
                          color: tone.color,
                          fontWeight: 800,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tone.label}
                      </div>
                    </div>

                    <div className="row" style={{ marginTop: 18 }}>
                      {q.public_token ? (
                        <Link
                          href={`/portal/${q.public_token}`}
                          className="btn btnPrimary"
                        >
                          Open Project Studio <span className="btnArrow">→</span>
                        </Link>
                      ) : (
                        <Link href="/book" className="btn btnPrimary">
                          Continue Booking <span className="btnArrow">→</span>
                        </Link>
                      )}

                      <Link href="/process" className="btn btnGhost">
                        View Process
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section id="ops-projects" style={{ marginTop: 34 }}>
        <div className="heroFadeUp">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Workflow Lane
          </div>
          <div style={{ height: 10 }} />
          <h2 className="h2">Systems Lab</h2>
          <p className="p" style={{ maxWidth: 760, marginTop: 8 }}>
            This lane stays visible in the hub, but the website workspace is the
            first dashboard being deepened.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            marginTop: 18,
          }}
        >
          {opsRows.length === 0 ? (
            <div className="panel fadeUp">
              <div className="panelBody">
                <div
                  style={{
                    color: "var(--fg)",
                    fontWeight: 800,
                    fontSize: 20,
                    marginBottom: 8,
                  }}
                >
                  No ops requests yet
                </div>
                <p className="p" style={{ margin: 0 }}>
                  Once a workflow audit is submitted, this lane will show call
                  status, recommendation state, and the next operational step.
                </p>
                <div className="row" style={{ marginTop: 16 }}>
                  <Link href="/ops-intake" className="btn btnPrimary">
                    Start Workflow Audit <span className="btnArrow">→</span>
                  </Link>
                  <Link href="/systems" className="btn btnGhost">
                    Explore Workflow Systems
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            opsRows.map((o, i) => {
              const latestCall = latestCallByOpsIntakeId.get(o.id) ?? null;
              const latestPie = latestPieByOpsIntakeId.get(o.id) ?? null;
              const tone = statusTone(o.status);

              return (
                <article
                  key={o.id}
                  className={`panel fadeUp stagger-${Math.min(i + 1, 4)}`}
                >
                  <div className="panelBody">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 16,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "var(--fg)",
                            fontWeight: 900,
                            fontSize: 24,
                            lineHeight: 1.1,
                          }}
                        >
                          {o.company_name || "Ops Request"}
                        </div>

                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                            color: "var(--muted)",
                            fontSize: 14,
                          }}
                        >
                          <span>ID: #{String(o.id).slice(0, 8)}</span>
                          <span>•</span>
                          <span>{fmtDate(o.created_at)}</span>
                          <span>•</span>
                          <span>{o.industry || "Workflow Systems"}</span>
                        </div>

                        <div
                          style={{
                            marginTop: 14,
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: 12,
                          }}
                        >
                          <InfoTile
                            label="Call Request"
                            value={latestCall?.status || "Not requested"}
                          />
                          <InfoTile
                            label="Recommendation"
                            value={o.recommendation_tier || "Pending"}
                          />
                          <InfoTile
                            label="Next Step"
                            value={latestPie?.summary || "Continue ops flow"}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 999,
                          background: tone.bg,
                          border: `1px solid ${tone.border}`,
                          color: tone.color,
                          fontWeight: 800,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tone.label}
                      </div>
                    </div>

                    <div className="row" style={{ marginTop: 18 }}>
                      <Link href={`/portal/ops/${o.id}`} className="btn btnPrimary">
                        Open Workspace <span className="btnArrow">→</span>
                      </Link>
                      <Link href="/ops-intake" className="btn btnGhost">
                        Book / Update Call
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

function LaneCard({
  title,
  desc,
  countLabel,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  tone,
}: {
  title: string;
  desc: string;
  countLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  tone: "gold" | "blue" | "neutral";
}) {
  const toneMap =
    tone === "gold"
      ? {
          border: "rgba(201,168,76,0.28)",
          glow: "rgba(201,168,76,0.12)",
        }
      : tone === "blue"
      ? {
          border: "rgba(141,164,255,0.24)",
          glow: "rgba(141,164,255,0.10)",
        }
      : {
          border: "rgba(255,255,255,0.12)",
          glow: "rgba(255,255,255,0.04)",
        };

  return (
    <article
      className="panel fadeUp"
      style={{
        borderColor: toneMap.border,
        boxShadow: `0 0 0 1px ${toneMap.border}, 0 16px 40px ${toneMap.glow}`,
      }}
    >
      <div className="panelBody">
        <div
          style={{
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Service lane
        </div>

        <div
          style={{
            color: "var(--fg)",
            fontWeight: 900,
            fontSize: 24,
            lineHeight: 1.08,
          }}
        >
          {title}
        </div>

        <p className="p" style={{ marginTop: 10, marginBottom: 0 }}>
          {desc}
        </p>

        <div
          style={{
            marginTop: 16,
            display: "inline-flex",
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid var(--stroke)",
            background: "var(--panel2)",
            color: "var(--fg)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {countLabel}
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <Link href={primaryHref} className="btn btnPrimary">
            {primaryLabel} <span className="btnArrow">→</span>
          </Link>
          <Link href={secondaryHref} className="btn btnGhost">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--stroke)",
        borderRadius: 16,
        background: "var(--panel2)",
        padding: 18,
      }}
    >
      <div
        style={{
          color: "var(--fg)",
          fontWeight: 900,
          fontSize: 28,
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          color: "var(--muted)",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--stroke)",
        borderRadius: 14,
        background: "var(--panel2)",
        padding: 14,
      }}
    >
      <div
        style={{
          color: "var(--muted)",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "var(--fg)",
          fontWeight: 800,
          fontSize: 15,
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}