import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const SHARED_STEPS = [
  {
    n: "1",
    title: "Submit the right intake",
    desc: "You start in the lane that matches your real problem: Websites, E-Commerce, or Workflow Systems.",
  },
  {
    n: "2",
    title: "Get a scoped recommendation",
    desc: "We review goals, constraints, timeline, and complexity so the project starts with a clear direction instead of guesswork.",
  },
  {
    n: "3",
    title: "Approve scope and next steps",
    desc: "Before work begins, you know the priority, the path, the expected investment, and what we need from you.",
  },
  {
    n: "4",
    title: "Build, implement, and review",
    desc: "We execute the work, share progress, collect approvals, and keep the project moving with visible next actions.",
  },
  {
    n: "5",
    title: "Launch, handoff, or rollout",
    desc: "Each lane ends with a clear completion point: launch, operational handoff, or readiness for the next growth stage.",
  },
];

const LANES = [
  {
    name: "Websites",
    href: "/websites",
    ctaHref: "/build/intro",
    ctaLabel: "Start Website Quote",
    intro:
      "Best for businesses that need stronger credibility, clearer positioning, and better lead conversion.",
    steps: [
      "Discovery and qualification to align on goals, audience, offer, and conversion priorities.",
      "Scope and site plan covering pages, features, integrations, timeline, and recommended tier.",
      "Design direction and messaging alignment so the site feels intentional before full build begins.",
      "Build and integrations for pages, forms, booking, payments, analytics, and responsive behavior.",
      "QA, revisions, launch prep, and handoff so the site goes live cleanly and confidently.",
    ],
  },
  {
    name: "E-Commerce",
    href: "/ecommerce",
    ctaHref: "/ecommerce/intake",
    ctaLabel: "Start E-Commerce Intake",
    intro:
      "Best for businesses that need a cleaner storefront, smoother checkout flow, and stronger order experience.",
    steps: [
      "Store and sales-channel intake covering platform, catalog size, fulfillment model, and current bottlenecks.",
      "Planning and recommendation phase to identify what is hurting conversion, operations, or launch readiness.",
      "Service plan and implementation path for storefront improvements, quote direction, and support priorities.",
      "Setup, refinement, and readiness work across store UX, operational setup, and launch preparation.",
      "Post-setup review so you know what is complete, what is next, and what should be improved over time.",
    ],
  },
  {
    name: "Workflow Systems",
    href: "/systems",
    ctaHref: "/ops-intake",
    ctaLabel: "Start Workflow Audit",
    intro:
      "Best for businesses losing time to manual handoffs, disconnected tools, messy intake, and admin drag.",
    steps: [
      "Workflow intake to capture tools, pain points, team reality, and where time or revenue is leaking.",
      "System mapping and strategy review to identify quick wins, priorities, and implementation order.",
      "Recommendation phase with a clearer picture of what should be automated, simplified, or reorganized first.",
      "Rollout of forms, routing, status logic, communications, and internal workflow improvements.",
      "Training, documentation, and follow-through so the system can actually be used and maintained.",
    ],
  },
] as const;

export default function ProcessPage() {
  return (
    <ScrollReveal>
      <main className="container section" style={{ paddingBottom: 84 }}>
        <div className="heroFadeUp">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            How It Works
          </div>
          <h1 className="h1">A clearer process for all three service lanes</h1>
          <p className="p" style={{ maxWidth: 860 }}>
            CrecyStudio is built around three service lanes — Websites,
            E-Commerce, and Workflow Systems — but the client experience should
            still feel consistent, guided, and easy to understand.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {LANES.map((lane, i) => (
            <article
              key={lane.name}
              className={`panel fadeUp stagger-${Math.min(i + 1, 4)}`}
            >
              <div className="panelHeader">
                <div>
                  <div
                    style={{
                      color: "var(--accent)",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Service lane
                  </div>
                  <h2 className="h2" style={{ margin: 0 }}>
                    {lane.name}
                  </h2>
                </div>
              </div>
              <div className="panelBody">
                <p className="p" style={{ marginTop: 0 }}>
                  {lane.intro}
                </p>
                <div className="row" style={{ marginTop: 16 }}>
                  <Link href={lane.href} className="btn btnGhost">
                    Learn More
                  </Link>
                  <Link href={lane.ctaHref} className="btn btnPrimary">
                    {lane.ctaLabel} <span className="btnArrow">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">What every engagement includes</h2>
            </div>
            <div className="panelBody">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: 14,
                }}
              >
                {SHARED_STEPS.map((step) => (
                  <div
                    key={step.n}
                    style={{
                      border: "1px solid var(--stroke)",
                      borderRadius: 16,
                      background: "var(--panel2)",
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        fontSize: 18,
                        background: "var(--accentSoft)",
                        color: "var(--accent)",
                        border: "1px solid var(--accentStroke)",
                        marginBottom: 14,
                      }}
                    >
                      {step.n}
                    </div>
                    <div
                      style={{
                        color: "var(--fg)",
                        fontWeight: 800,
                        fontSize: 17,
                        lineHeight: 1.25,
                        marginBottom: 8,
                      }}
                    >
                      {step.title}
                    </div>
                    <div className="p" style={{ fontSize: 14, margin: 0 }}>
                      {step.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="heroFadeUp">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Lane-by-lane detail
            </div>
            <h2 className="h2">What the process looks like inside each lane</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
              marginTop: 18,
            }}
          >
            {LANES.map((lane, i) => (
              <article
                key={lane.name}
                className={`panel fadeUp stagger-${Math.min(i + 1, 4)}`}
              >
                <div className="panelHeader">
                  <h3 className="h2" style={{ margin: 0 }}>
                    {lane.name} Process
                  </h3>
                </div>
                <div className="panelBody">
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: "var(--muted)",
                      lineHeight: 1.8,
                    }}
                  >
                    {lane.steps.map((step) => (
                      <li key={step} style={{ marginBottom: 10 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">What clients should expect from us</h2>
            </div>
            <div className="panelBody">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  {
                    title: "Clarity before commitment",
                    text: "You should understand the direction, scope, and next step before the work gets deep.",
                  },
                  {
                    title: "Visible progress",
                    text: "Projects should not feel mysterious. Every lane should show clear progress, status, and next action.",
                  },
                  {
                    title: "A cleaner handoff",
                    text: "Launch, rollout, or delivery should end with clarity — not confusion about what happens next.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      border: "1px solid var(--stroke)",
                      borderRadius: 16,
                      background: "var(--panel2)",
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        color: "var(--fg)",
                        fontWeight: 800,
                        fontSize: 18,
                        marginBottom: 8,
                      }}
                    >
                      {item.title}
                    </div>
                    <p className="p" style={{ margin: 0, fontSize: 14 }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="row fadeUp" style={{ marginTop: 28 }}>
          <Link href="/faq" className="btn btnGhost">
            Read FAQ
          </Link>
          <Link href="/build/intro" className="btn btnPrimary">
            Start Here <span className="btnArrow">→</span>
          </Link>
          <Link href="/websites" className="btn btnGhost">
            Explore Websites
          </Link>
          <Link href="/ecommerce" className="btn btnGhost">
            Explore E-Commerce
          </Link>
          <Link href="/systems" className="btn btnGhost">
            Explore Workflow Systems
          </Link>
        </div>
      </main>
    </ScrollReveal>
  );
}