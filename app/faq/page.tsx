import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const FAQ_GROUPS = [
  {
    title: "General",
    intro:
      "Questions that apply across all three service lanes.",
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
        a: "Pricing is scope-based. We use the intake and project context to determine what level of work is actually needed before the final path is confirmed.",
      },
      {
        q: "Can I start with one lane and expand later?",
        a: "Yes. That is often the smartest route. Many clients start with the lane solving the most urgent bottleneck, then expand into the next lane once the first improvement is in place.",
      },
    ],
  },
  {
    title: "Websites",
    intro:
      "Questions for businesses looking for stronger online credibility and lead conversion.",
    items: [
      {
        q: "What kind of website projects do you handle?",
        a: "Service-business websites, landing pages, structured multi-page marketing sites, and sites that need booking, forms, payments, lead routing, or stronger conversion strategy.",
      },
      {
        q: "Do you help with messaging, content, and visuals?",
        a: "Yes. Projects can use client-provided assets, guided copy support, or a more collaborative structure where the messaging and visual direction are refined together.",
      },
      {
        q: "How long does a typical website build take?",
        a: "Smaller focused builds can move quickly. Broader multi-page projects take longer depending on content readiness, approvals, revisions, and integrations.",
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
      "Questions for businesses selling products online or planning to improve how their store operates.",
    items: [
      {
        q: "Do you only build stores from scratch?",
        a: "No. E-Commerce work can include store refinement, conversion improvements, quote/service planning, launch readiness, and backend operational support — not just brand-new store builds.",
      },
      {
        q: "Can you help with checkout and order experience?",
        a: "Yes. E-Commerce support can focus on the customer-facing experience, the planning/setup side, or both, depending on where the real friction is happening.",
      },
      {
        q: "Do you work with marketplaces and multichannel sellers?",
        a: "Yes. The lane is designed to support broader selling operations, not just a single storefront view.",
      },
      {
        q: "What if I am still figuring out fulfillment or launch readiness?",
        a: "That is exactly the kind of uncertainty this lane can help clarify. The goal is to make the next step more concrete, not force you to pretend everything is already solved.",
      },
    ],
  },
  {
    title: "Workflow Systems",
    intro:
      "Questions for businesses dealing with operational drag, manual work, and disconnected tools.",
    items: [
      {
        q: "What kinds of workflow problems do you solve?",
        a: "Intake issues, handoff breakdowns, quote/invoice friction, disconnected software, weak routing, status visibility problems, and repetitive admin tasks that should not still be manual.",
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
        a: "Yes. In many cases, starting with the highest-friction workflow is the best way to reduce risk and create momentum.",
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
          <h1 className="h1">Answers for Websites, E-Commerce, and Workflow Systems</h1>
          <p className="p" style={{ maxWidth: 860 }}>
            This page should help clients understand what each lane does, what
            the process feels like, and what to expect before starting.
          </p>
        </div>

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
              text: "Trust, credibility, and lead conversion.",
              href: "/websites",
            },
            {
              title: "E-Commerce",
              text: "Storefront, checkout, and order experience.",
              href: "/ecommerce",
            },
            {
              title: "Workflow Systems",
              text: "Internal operations, routing, and automation.",
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
                    FAQ Group
                  </div>
                  <h2 className="h2" style={{ margin: 0 }}>
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

        <section style={{ marginTop: 28 }}>
          <div className="panel fadeUp">
            <div className="panelHeader">
              <h2 className="h2">Still not sure where to start?</h2>
            </div>
            <div className="panelBody">
              <p className="p" style={{ marginTop: 0, maxWidth: 760 }}>
                That is normal. The best next move is not guessing — it is
                entering the lane that matches your most urgent problem first.
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