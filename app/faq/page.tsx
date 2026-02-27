import Link from "next/link";

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
    <main className="container" style={{ padding: "56px 0 90px", maxWidth: 900 }}>
      <div className="kicker"><span className="kickerDot" aria-hidden="true" /> Frequently Asked Questions</div>
      <h1 className="h1" style={{ marginTop: 14 }}>Answers before you start your project</h1>
      <p className="p" style={{ marginTop: 10 }}>
        Quick clarity on process, timelines, and what to expect when working with CrecyStudio.
      </p>

      <section style={{ marginTop: 28, display: "grid", gap: 12 }}>
        {FAQS.map((item) => (
          <details key={item.q} className="panel" style={{ overflow: "hidden" }}>
            <summary style={{ cursor: "pointer", padding: 18, fontWeight: 800, color: "var(--fg)" }}>{item.q}</summary>
            <div style={{ padding: "0 18px 18px", color: "var(--muted)", lineHeight: 1.7 }}>{item.a}</div>
          </details>
        ))}
      </section>

      <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/process" className="btn btnGhost">View Full Process</Link>
        <Link href="/build/intro" className="btn btnPrimary">Start Custom Build <span className="btnArrow">→</span></Link>
      </div>
    </main>
  );
}
