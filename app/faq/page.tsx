import SupportPageShell from "@/components/site/SupportPageShell";
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
      <SupportPageShell
        kicker="FAQ"
        title="Answers before you commit"
        description="Clear answers on scope, pricing, ownership, and project workflow."
        ctas={[
          { href: "/websites", label: "Explore websites" },
          { href: "/contact", label: "Contact support", variant: "ghost" },
        ]}
      >
        <section className="panel fadeUp marketingStackLg">
          <div className="panelBody supportCardsStack">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="card">
                <summary className="cardInner faqSummary">{question}</summary>
                <p className="p faqAnswer">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </SupportPageShell>
    </ScrollReveal>
  );
}
