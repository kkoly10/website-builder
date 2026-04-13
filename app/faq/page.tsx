import SupportPageShell from "@/components/site/SupportPageShell";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const FAQS = [
  ["How fast do I get an estimate?", "Most website estimates are delivered within 24 hours after intake submission."],
  ["Do you only build websites?", "Websites are the primary lane. We also support e-commerce and workflow automation when needed."],
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
          <div className="panelHeader">
            <p className="metaLabel">Common questions</p>
          </div>
          <div className="panelBody supportFaqRows">
            {FAQS.map(([question, answer], idx) => (
              <article key={question} className="supportFaqRow">
                <p className="supportFaqIndex">{String(idx + 1).padStart(2, "0")}</p>
                <div>
                  <h2 className="h3 supportFaqQuestion">{question}</h2>
                  <p className="p faqAnswer">{answer}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </SupportPageShell>
    </ScrollReveal>
  );
}
