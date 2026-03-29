import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const FAQ_GROUPS = [
  {
    title: "General",
    intro:
      "Questions that apply across all three service lanes — Websites, E-Commerce, and Workflow Systems.",
    items: [
      {
        q: "How do I know which service lane I need?",
        a: "Use Websites if your biggest issue is trust, credibility, and lead conversion. Use E-Commerce if your biggest issue is storefront flow, checkout, or order experience. Use Workflow Systems if your biggest issue is backend friction, manual handoffs, or disconnected tools.",
      },
      {
        q: "Do you rebuild everything from scratch?",
        a: "Not usually. The goal is to improve the right layer of the business without replacing things that are already working. Some projects are full builds, others are upgrades, integrations, or system cleanups.",
      },
      {
        q: "How does pricing work?",
        a: "Pricing is scope-based and transparent. Website projects range from $1,500 to $5,200+ depending on complexity. E-Commerce starts at $1,800 for builds, $500/mo for ongoing management, or $1,200 for targeted fix sprints. Workflow Systems range from $1,000 for quick fixes to $3,800+ for full system builds, with ongoing support from $500/mo. Every project starts with an intake and scoping process before pricing is confirmed.",
      },
      {
        q: "Can I start with one lane and expand later?",
        a: "Yes. That is often the smartest route. Many clients start with the lane solving the most urgent bottleneck, then expand into the next lane once the first improvement is in place.",
      },
      {
        q: "What does the process look like?",
        a: "Every lane follows the same core structure: intake, scoping, discovery call, build, review, and launch. The details vary by lane, but the rhythm is designed to keep things moving without surprises.",
      },
    ],
  },
  {
    title: "Websites",
    intro:
      "For businesses that need stronger online credibility, better lead conversion, or a professional web presence.",
    items: [
      {
        q: "What kind of website projects do you handle?",
        a: "Service-business websites, landing pages, structured multi-page marketing sites, and sites that need booking, forms, payments, lead routing, or stronger conversion strategy.",
      },
      {
        q: "What are the website tiers?",
        a: "Starter ($1,500–$2,200) covers focused single-page or small multi-page builds. Growth ($2,300–$3,400) adds more pages, integrations, and conversion strategy. Premium ($3,500–$5,200+) is for complex multi-page builds with advanced features, automation, and custom functionality.",
      },
      {
        q: "Do you help with messaging, content, and visuals?",
        a: "Yes. Projects can use client-provided assets, guided copy support, or a more collaborative structure where the messaging and visual direction are refined together.",
      },
      {
        q: "How long does a typical website build take?",
        a: "Starter builds can move in under two weeks. Growth and Premium projects typically take two to four weeks depending on content readiness, approvals, and integrations.",
      },
      {
        q: "Can the website connect to bookings, payments, or CRM tools?",
        a: "Yes. That is a common part of the build process and is often one of the biggest reasons a simple site upgrade turns into a higher-performing system.",
      },
    ],
  },
  {
    title: "E-Commerce",
    intro:
      "For businesses selling products online — whether you need to build a store, run it day-to-day, or fix what is already broken.",
    items: [
      {
        q: "What does Build, Run, and Fix mean?",
        a: "Build is for launching or rebuilding a store — from $1,800 for a basic setup to $4,000+ for premium builds with advanced features. Run is ongoing store management starting at $500/month, covering products, orders, analytics, and optimization. Fix is a targeted $1,200 sprint to diagnose and resolve specific issues like checkout friction, slow pages, or broken flows.",
      },
      {
        q: "Do you only build stores from scratch?",
        a: "No. E-Commerce work includes store refinement, conversion improvements, launch readiness, ongoing management, and targeted fix sprints — not just brand-new store builds.",
      },
      {
        q: "Can you help with checkout and order experience?",
        a: "Yes. Whether that is a Build project to set it up right, a Run engagement to optimize it over time, or a Fix sprint to solve a specific conversion problem — the approach depends on where the friction is.",
      },
      {
        q: "Do you work with marketplaces and multichannel sellers?",
        a: "Yes. The Run tier is specifically designed to support broader selling operations across multiple channels, not just a single storefront.",
      },
      {
        q: "What if I am still figuring out fulfillment or launch readiness?",
        a: "That is exactly the kind of uncertainty the intake process is designed to clarify. The goal is to make the next step more concrete, not force you to pretend everything is already solved.",
      },
    ],
  },
  {
    title: "Workflow Systems",
    intro:
      "For businesses dealing with operational drag, manual work, and disconnected tools.",
    items: [
      {
        q: "What kinds of workflow problems do you solve?",
        a: "Intake issues, handoff breakdowns, quote and invoice friction, disconnected software, weak routing, status visibility problems, and repetitive admin tasks that should not still be manual.",
      },
      {
        q: "What are the ops pricing tiers?",
        a: "Quick Fix ($1,000–$1,800) solves a single high-friction workflow. System Build ($2,000–$3,800+) designs and connects multiple workflows into a working system. Ongoing support ($500–$1,250/month) provides continuous optimization, monitoring, and maintenance.",
      },
      {
        q: "Do I need to replace all my current software?",
        a: "Almost never. Most of the time, the smarter move is to make your existing stack work together better instead of ripping everything out.",
      },
      {
        q: "Will my team need training after implementation?",
        a: "Yes — and that is part of making the work stick. A cleaner workflow is not useful if the team does not understand how to use it properly.",
      },
      {
        q: "Can I start with one workflow fix instead of a giant rebuild?",
        a: "Yes. The Quick Fix tier exists for exactly this reason. Starting with the highest-friction workflow is the best way to reduce risk and create momentum before expanding.",
      },
    ],
  },
] as const;

export default function FaqPage() {
  return (
    <ScrollReveal>
      <main className="container section" style={{ paddingBottom: 84 }}>
        <div className="heroFadeUp">
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Frequently Asked Questions
          </div>
          <h1 className="h1">
            Answers for Websites, E-Commerce, and Workflow Systems
          </h1>
          <p className="p" style={{ maxWidth: 860 }}>
            Understand what each lane does, how pricing works, what the process
            feels like, and what to expect before getting started.
          </p>
        </div>

        {/* Lane quick-links */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 28,
          }}
        >
          {[
            {
              title: "Websites",
              text: "Trust, credibility, and lead conversion. From $1,500.",
              href: "/websites",
            },
            {
              title: "E-Commerce",
              text: "Build, Run, or Fix your store. From $1,200.",
              href: "/ecommerce",
            },
            {
              title: "Workflow Systems",
              text: "Operations, routing, and automation. From $1,000.",
              href: "/systems",
            },
          ].map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              className={`panel fadeUp stagger-${Math.min(i + 1, 4)}`}
              style={{ textDecoration: "none" }}
            >
              <div className="panelBody">
                <div
                  style={{
                    color: "var(--fg)",
                    fontWeight: 800,
                    fontSize: 21,
                    marginBottom: 8,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </div>
                <p className="p" style={{ margin: 0 }}>
                  {item.text}
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* FAQ groups */}
        <section style={{ marginTop: 28, display: "grid", gap: 18 }}>
          {FAQ_GROUPS.map((group, groupIndex) => (
            <div
              key={group.title}
              className={`panel fadeUp stagger-${Math.min(groupIndex + 1, 4)}`}
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
                    {group.title === "General" ? "All Lanes" : group.title}
                  </div>
                  <h2
                    className="h2"
                    style={{
                      margin: 0,
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {group.title}
                  </h2>
                </div>
              </div>

              <div className="panelBody">
                <p className="p" style={{ marginTop: 0, marginBottom: 18 }}>
                  {group.intro}
                </p>

                <div style={{ display: "grid", gap: 12 }}>
                  {group.items.map((item) => (
                    <details
                      key={item.q}
                      style={{
                        border: "1px solid var(--stroke)",
                        borderRadius: 16,
                        background: "var(--panel2)",
                        overflow: "hidden",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          listStyle: "none",
                          padding: "18px 20px",
                          fontWeight: 800,
                          color: "var(--fg)",
                          fontSize: 16,
                        }}
                      >
                        {item.q}
                      </summary>
                      <div style={{ padding: "0 20px 18px" }}>
                        <p className="p" style={{ margin: 0 }}>
                          {item.a}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section style={{ marginTop: 28 }}>
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2
                className="h2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Still not sure where to start?
              </h2>
            </div>
            <div className="panelBody">
              <p className="p" style={{ marginTop: 0, maxWidth: 760 }}>
                That is normal. The best next move is not guessing — it is
                entering the lane that matches your most urgent problem first.
                Every lane starts with a free intake.
              </p>
              <div className="row" style={{ marginTop: 16 }}>
                <Link href="/process" className="btn btnGhost">
                  View Full Process
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
            </div>
          </div>
        </section>
      </main>
    </ScrollReveal>
  );
}
