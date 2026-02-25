import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SystemsPage() {
  return (
    <main className="container">
      <section className="hero">
        <div className="heroGrid">
          <div className="card cardHover heroCopy">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio • Business Systems
              </div>

              <div style={{ height: 12 }} />

              <h1 className="h1">
                Fix the workflow problems slowing down your business.
              </h1>

              <p className="p" style={{ marginTop: 12, maxWidth: 760 }}>
                I build practical systems for small businesses: intake forms, invoice flows,
                job tracking, client portals, CRM cleanup, and automation between the tools
                you already use.
              </p>

              <div className="heroActions">
                <Link href="/ops-intake" className="btn btnPrimary">
                  Fix My Workflow <span className="btnArrow">→</span>
                </Link>
                <Link href="/build" className="btn btnGhost">
                  Website Quote
                </Link>
              </div>

              <div className="pills">
                <span className="pill">Quick wins + retainers</span>
                <span className="pill">Local business friendly</span>
                <span className="pill">Custom systems</span>
                <span className="pill">Clear scope</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="statRow">
              <div className="stat">
                <div className="statNum">1–3 days</div>
                <div className="statLab">Fast fixes (typical)</div>
              </div>
              <div className="stat">
                <div className="statNum">Ongoing</div>
                <div className="statLab">Retainer support</div>
              </div>
            </div>

            <div className="cardInner">
              <div style={{ fontWeight: 950, marginBottom: 10 }}>
                Common problems I solve
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  lineHeight: 1.85,
                  color: "rgba(255,255,255,0.84)",
                }}
              >
                <li>Leads coming in but no organized follow-up</li>
                <li>Invoices/estimates done manually every time</li>
                <li>Client updates spread across text/email/notes</li>
                <li>No clear handoff from quote to booking</li>
                <li>Too many tools, no system connecting them</li>
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="badge badgeHot">Fast-start services available</span>
                <span className="badge">Custom workflows</span>
              </div>

              <div style={{ marginTop: 14 }}>
                <Link className="btn btnPrimary" href="/ops-intake">
                  Start Workflow Intake <span className="btnArrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services / examples */}
      <section className="section">
        <div>
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Service Examples
          </div>

          <div style={{ height: 12 }} />
          <h2 className="h2">Built for both quick fixes and long-term systems</h2>
          <p className="p" style={{ marginTop: 10, maxWidth: 860 }}>
            Some clients need one workflow fixed fast. Others need ongoing help improving
            operations as they grow. This service is designed for both.
          </p>
        </div>

        <div className="tierGrid" style={{ marginTop: 18 }}>
          <ServiceCard
            title="Quick Workflow Fix"
            subtitle="Fast-start"
            bullets={[
              "Fix a broken intake / booking flow",
              "Clean up lead handoff to email/CRM",
              "Improve quote or invoice process",
              "Small automation setup (practical wins)",
            ]}
            ctaHref="/ops-intake"
            ctaLabel="Start Intake"
          />

          <ServiceCard
            title="Ops System Build"
            subtitle="Most common"
            hot
            bullets={[
              "Custom intake + booking + status flow",
              "Client-facing portal/dashboard setup",
              "Back-office admin tracking + reporting",
              "Automations between your existing tools",
            ]}
            ctaHref="/ops-intake"
            ctaLabel="Fix My Workflow"
          />

          <ServiceCard
            title="Ongoing Systems Support"
            subtitle="Retainer"
            bullets={[
              "Monthly improvements and maintenance",
              "Workflow updates as your team grows",
              "New forms, automations, and reports",
              "Priority support for issues and changes",
            ]}
            ctaHref="/ops-intake"
            ctaLabel="Request a Plan"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="card">
          <div className="cardInner">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Process
            </div>

            <div style={{ height: 12 }} />
            <h2 className="h2">Simple path from issue to solution</h2>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <Step
                n="1"
                title="Workflow intake"
                desc="Tell me what’s breaking, what tools you use, and what outcome you need."
              />
              <Step
                n="2"
                title="PIE analysis + recommendation"
                desc="You get a structured plan with priorities, scope options, and the best next step."
              />
              <Step
                n="3"
                title="Build + handoff"
                desc="I implement the fix or system and organize a clean handoff so your team can use it."
              />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/ops-intake" className="btn btnPrimary">
                Start Workflow Intake <span className="btnArrow">→</span>
              </Link>
              <Link href="/build" className="btn btnGhost">
                I need a website instead
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({
  title,
  subtitle,
  bullets,
  ctaHref,
  ctaLabel,
  hot,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaHref: string;
  ctaLabel: string;
  hot?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{subtitle}</div>
          </div>

          <div>
            <span className={`badge ${hot ? "badgeHot" : ""}`}>
              {hot ? "Recommended" : "Service"}
            </span>
          </div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href={ctaHref}>
            {ctaLabel} <span className="btnArrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="card"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      <div
        className="cardInner"
        style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            fontWeight: 950,
            background: "rgba(255,122,24,0.14)",
            border: "1px solid rgba(255,122,24,0.30)",
            color: "rgba(255,220,200,0.95)",
            flex: "0 0 auto",
          }}
        >
          {n}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950 }}>{title}</div>
          <div className="p" style={{ marginTop: 4 }}>
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
}