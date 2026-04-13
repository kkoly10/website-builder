import SupportPageShell from "@/components/site/SupportPageShell";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const STEPS = [
  ["Intake", "Submit the lane-specific intake with goals, constraints, and urgency."],
  ["Scope", "Receive a scoped recommendation with range, timeline, and milestones."],
  ["Build", "Track progress, approvals, and uploads in your project workspace."],
  ["Launch", "Go live with QA, handoff, and post-launch guidance."],
] as const;

export default function ProcessPage() {
  return (
    <ScrollReveal>
      <SupportPageShell
        kicker="How it works"
        title="A simple process with clear milestones"
        description="Every lane uses the same execution rhythm so projects stay predictable and visible."
        ctas={[
          { href: "/build/intro", label: "Start website estimate" },
          { href: "/faq", label: "Read FAQs", variant: "ghost" },
        ]}
      >
        <section className="panel fadeUp marketingStackLg">
          <div className="panelBody supportCardsStack">
            {STEPS.map(([title, body], idx) => (
              <article key={title} className="card supportTimelineItem">
                <div className="cardInner supportTimelineInner">
                  <p className="metaLabel supportTimelineStep">Step 0{idx + 1}</p>
                  <h2 className="h3">{title}</h2>
                  <p className="p">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </SupportPageShell>
    </ScrollReveal>
  );
}
