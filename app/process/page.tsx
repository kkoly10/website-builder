import Link from "next/link";
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
      <main className="container section marketingPage">
        <div className="heroFadeUp">
          <p className="kicker"><span className="kickerDot" />How it works</p>
          <h1 className="h1">A simple process with clear milestones</h1>
          <p className="p maxW860">Every lane uses the same execution rhythm so projects stay predictable and visible.</p>
        </div>

        <section className="panel fadeUp marketingStackLg">
          <div className="panelBody">
            {STEPS.map(([title, body], idx) => (
              <article key={title} className="card">
                <div className="cardInner">
                  <p className="metaLabel">Step 0{idx + 1}</p>
                  <h2 className="h3">{title}</h2>
                  <p className="p">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="row marketingActions">
          <Link href="/build/intro" className="btn btnPrimary">Start website estimate</Link>
          <Link href="/faq" className="btn btnGhost">Read FAQs</Link>
        </div>
      </main>
    </ScrollReveal>
  );
}
