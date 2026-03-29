import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const SHARED_STEPS = [
  {
    n: "1",
    title: "Submit the right intake",
    desc: "You start in the lane that matches your real problem — Websites, E-Commerce, or Workflow Systems. Each has its own intake designed for that type of project.",
  },
  {
    n: "2",
    title: "Get a scoped recommendation",
    desc: "We review goals, constraints, timeline, and complexity so the project starts with a clear direction — not guesswork or generic proposals.",
  },
  {
    n: "3",
    title: "Approve scope and investment",
    desc: "Before work begins, you know the priority, the path, the expected cost, and what we need from you. No surprises.",
  },
  {
    n: "4",
    title: "Build, implement, and review",
    desc: "We execute the work, share progress through your portal, collect approvals, and keep the project moving with visible next actions.",
  },
  {
    n: "5",
    title: "Launch, handoff, or rollout",
    desc: "Every lane ends with a clear completion point — site launch, operational handoff, or readiness for the next growth stage.",
  },
];

const LANES = [
  {
    name: "Websites",
    href: "/websites",
    ctaHref: "/build/intro",
    ctaLabel: "Start Website Estimate",
    pricing: "From $1,500 · Starter, Growth, and Premium tiers",
    intro:
      "For businesses that need stronger credibility, clearer positioning, and better lead conversion. Projects range from $1,500 to $5,200+ depending on scope and complexity.",
    steps: [
      "Discovery and qualification to align on goals, audience, offer, and conversion priorities.",
      "Scope and site plan covering pages, features, integrations, timeline, and recommended tier.",
      "Design direction and messaging alignment so the site feels intentional before full build begins.",
      "Build and integrations — pages, forms, booking, payments, analytics, and responsive behavior.",
      "QA, revisions, launch prep, and handoff so the site goes live cleanly and confidently.",
    ],
  },
  {
    name: "E-Commerce",
    href: "/ecommerce",
    ctaHref: "/ecommerce/intake",
    ctaLabel: "Start E-Commerce Intake",
    pricing: "Build from $1,800 · Run from $500/mo · Fix $1,200",
    intro:
      "For businesses that need to launch a store, manage it day-to-day, or fix what is already broken. The intake determines whether you need a Build, Run, or Fix engagement.",
    steps: [
      "Store and channel intake covering platform, catalog, fulfillment model, and current bottlenecks.",
      "Recommendation phase to determine whether the project is a Build, Run, or Fix — and scope accordingly.",
      "Service plan and pricing confirmation based on the type of engagement and store complexity.",
      "Setup, refinement, and readiness work across store UX, operations, and launch preparation.",
      "Post-setup review so you know what is complete, what is next, and what to improve over time.",
    ],
  },
  {
    name: "Workflow Systems",
    href: "/systems",
    ctaHref: "/ops-intake",
    ctaLabel: "Start Workflow Audit",
    pricing: "Quick Fix from $1,000 · System Build from $2,000 · Ongoing from $500/mo",
    intro:
      "For businesses losing time to manual handoffs, disconnected tools, messy intake, and admin drag. Projects range from targeted quick fixes to full system builds with ongoing support.",
    steps: [
      "Workflow intake to capture tools, pain points, team reality, and where time or revenue is leaking.",
      "System mapping and strategy review to identify quick wins, priorities, and implementation order.",
      "Recommendation phase with a clear picture of what should be automated, simplified, or reorganized first.",
      "Rollout of forms, routing, status logic, communications, and internal workflow improvements.",
      "Training, documentation, and follow-through so the system can actually be used and maintained.",
    ],
  },
] as const;

export default function ProcessPage() {
  return (
    <ScrollReveal>
      <main className="container section" style={{ paddingBottom: 84 }}>
        {/* Hero */}
        <div className="heroFadeUp">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            How It Works
          </div>
          <h1
            className="h1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            One process, three service lanes
          </h1>
          <p className="p" style={{ maxWidth: 860 }}>
            Whether you need a website, an e-commerce store, or cleaner
            operations — the process follows the same rhythm: intake, scope,
            build, launch. The details change by lane, but the experience stays
            consistent and guided.
          </p>
        </div>

        {/* Lane cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                    Service Lane
                  </div>
                  <h2
                    className="h2"
                    style={{
                      margin: 0,
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {lane.name}
                  </h2>
                </div>
              </div>
              <div className="panelBody">
                <p className="p" style={{ marginTop: 0 }}>
                  {lane.intro}
                </p>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--stroke)",
                    background: "var(--panel2)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--accent)",
                    marginBottom: 16,
                  }}
                >
                  {lane.pricing}
                </div>
                <div className="row">
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

        {/* Shared 5-step process */}
        <section style={{ marginTop: 28 }}>
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2
                className="h2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                What every engagement includes
              </h2>
            </div>
            <div className="panelBody">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                        fontFamily: "'Playfair Display', Georgia, serif",
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

        {/* Lane-by-lane detail */}
        <section style={{ marginTop: 28 }}>
          <div className="heroFadeUp">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Lane-by-Lane Detail
            </div>
            <h2
              className="h2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              What the process looks like inside each lane
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                  <h3
                    className="h2"
                    style={{
                      margin: 0,
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {lane.name}
                  </h3>
                </div>
                <div className="panelBody">
                  <div style={{ display: "grid", gap: 12 }}>
                    {lane.steps.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr",
                          gap: 12,
                          alignItems: "start",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            background: "var(--accentSoft)",
                            color: "var(--accent)",
                            border: "1px solid var(--accentStroke)",
                            flexShrink: 0,
                          }}
                        >
                          {stepIdx + 1}
                        </div>
                        <p
                          className="p"
                          style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: 1.55,
                          }}
                        >
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Expectations */}
        <section style={{ marginTop: 28 }}>
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2
                className="h2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                What clients should expect from us
              </h2>
            </div>
            <div className="panelBody">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  {
                    title: "Clarity before commitment",
                    text: "You understand the direction, scope, pricing, and next step before deep work begins. No ambiguity about what you are paying for.",
                  },
                  {
                    title: "Visible progress",
                    text: "Projects should not feel mysterious. Your portal shows clear progress, status, milestones, and next actions throughout the engagement.",
                  },
                  {
                    title: "A cleaner handoff",
                    text: "Launch, rollout, or delivery ends with clarity — not confusion about what happens next, who owns what, or what still needs to be done.",
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
                        fontFamily: "'Playfair Display', Georgia, serif",
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

        {/* Bottom CTA */}
        <div className="row fadeUp" style={{ marginTop: 28 }}>
          <Link href="/faq" className="btn btnGhost">
            Read FAQ
          </Link>
          <Link href="/build/intro" className="btn btnPrimary">
            Start Here <span className="btnArrow">→</span>
          </Link>
          <Link href="/websites" className="btn btnGhost">
            Websites
          </Link>
          <Link href="/ecommerce" className="btn btnGhost">
            E-Commerce
          </Link>
          <Link href="/systems" className="btn btnGhost">
            Workflow Systems
          </Link>
        </div>
      </main>
    </ScrollReveal>
  );
}
