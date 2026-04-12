import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const FAQS = [
  ["How fast do I get an estimate?", "Most website estimates are delivered within 24 hours after intake submission."],
  ["Do you only build websites?", "Websites are the primary lane. We also support e-commerce and workflow systems when needed."],
  ["Will I own the finished project?", "Yes. You keep your domain, code, assets, and production access once payments are complete."],
  ["How does portal access work?", "Clients get secure portal access for milestones, uploads, feedback, and launch tracking."],
];

export default function FaqPage() {
  return (
    <ScrollReveal>
      <main className="container section marketingPage">
        <div className="heroFadeUp">
          <p className="kicker"><span className="kickerDot" />FAQ</p>
          <h1 className="h1">Answers before you commit</h1>
          <p className="p maxW860">Clear answers on scope, pricing, ownership, and project workflow.</p>
        </div>

        <section className="panel fadeUp" style={{ marginTop: 20 }}>
          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            {FAQS.map(([question, answer]) => (
              <details key={question} className="card">
                <summary className="cardInner" style={{ cursor: "pointer", fontWeight: 600 }}>{question}</summary>
                <p className="p" style={{ margin: 0, padding: "0 1rem 1rem" }}>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="row" style={{ marginTop: 16 }}>
          <Link href="/websites" className="btn btnPrimary">Explore websites</Link>
          <Link href="/contact" className="btn btnGhost">Contact support</Link>
        </div>
      </main>
    </ScrollReveal>
  );
}
