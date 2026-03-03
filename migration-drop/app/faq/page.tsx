import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "How long does a typical website build take?",
    a: "Most service-business sites launch in 2-3 weeks once strategy, content, and assets are confirmed. Faster timelines are possible for focused landing pages.",
  },
  {
    q: "Do you handle content, images, and branding?",
    a: "Yes. Projects can be delivered with client-provided assets or with guided support for copy, stock visuals, and design direction.",
  },
  {
    q: "Can my website include booking, payments, or automations?",
    a: "Absolutely. Booking flows, payment checkout, CRM integrations, and lead-routing automations are common options in the build process.",
  },
  {
    q: "How does pricing work?",
    a: "Pricing is scope-based. The guided build intake captures goals, pages, and complexity, then generates an estimate range before final scope confirmation.",
  },
  {
    q: "What happens after launch?",
    a: "Post-launch support can include updates, optimization, and workflow improvements so your site continues to drive measurable results.",
  },
];

export default function FaqPage() {
  return (
    <ScrollReveal>
      <main className="container section">
        <div className="heroFadeUp" >
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Frequently Asked Questions
          </div>
          <h1 className="h1">Answers before you start your project</h1>
          <p className="p">
            Quick clarity on process, timelines, and what to expect when working
            with CrecyStudio.
          </p>
        </div>

        <section className="grid4" style={{ maxWidth: 900, gridTemplateColumns: "1fr" }}>
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              className={`panel fadeUp stagger-${Math.min(i + 1, 4)}`}
            >
              <summary className="panelHeader" style={{ cursor: "pointer" }}>
                {item.q}
              </summary>
              <div className="panelBody">
                <p className="p">{item.a}</p>
              </div>
            </details>
          ))}
        </section>

        <div className="row fadeUp">
          <Link href="/process" className="btn btnGhost">View Full Process</Link>
          <Link href="/build/intro" className="btn btnPrimary">
            Start Custom Build <span className="btnArrow">→</span>
          </Link>
        </div>
      </main>
    </ScrollReveal>
  );
}
