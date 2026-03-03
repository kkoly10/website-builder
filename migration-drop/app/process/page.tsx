import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

const WEBSITE_PROCESS = [
  "Discovery and Qualification: align on goals, audience, conversion targets, and requirements.",
  "Scope and Estimate: define pages, features, integrations, and timeline; lock a practical build plan.",
  "Design Direction: establish visual system, layout hierarchy, and messaging structure.",
  "Build and Integrations: implement responsive pages, forms, booking, payments, and analytics stack.",
  "QA and Launch: test performance, SEO basics, forms, and handoff before go-live.",
  "Optimization: monitor behavior, improve conversion paths, and iterate with data.",
];

const OPS_PROCESS = [
  "Ops Intake: gather current tools, bottlenecks, and manual workflow pain points.",
  "System Mapping: document lead-to-delivery flow and identify automation opportunities.",
  "Blueprint and Prioritization: define quick wins, dependencies, and rollout sequence.",
  "Implementation: connect forms, CRM, billing, and communications into one repeatable system.",
  "Team Enablement: train usage standards and provide operational documentation.",
  "Measurement and Iteration: track throughput, response time, and admin workload reduction.",
];

export default function ProcessPage() {
  return (
    <ScrollReveal>
      <main className="container section">
        <div className="heroFadeUp" >
          <div className="kicker">
            <span className="kickerDot" aria-hidden="true" />
            Delivery Process
          </div>
          <h1 className="h1">End-to-end process for both service lines</h1>
          <p className="p">
            Transparent execution from intake to launch, whether you need a
            high-converting website or operational automation.
          </p>
        </div>

        <section className="grid2stretch">
          <div className="panel fadeUp stagger-1">
            <div className="panelHeader">
              <h2 className="h2">Custom Website Process</h2>
            </div>
            <div className="panelBody">
              <ol className="serviceCardList">
                {WEBSITE_PROCESS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="panel fadeUp stagger-2">
            <div className="panelHeader">
              <h2 className="h2">Workflow Systems Process</h2>
            </div>
            <div className="panelBody">
              <ol className="serviceCardList">
                {OPS_PROCESS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="row fadeUp">
          <Link href="/faq" className="btn btnGhost">Read FAQ</Link>
          <Link href="/build/intro" className="btn btnPrimary">
            Start Custom Build <span className="btnArrow">→</span>
          </Link>
          <Link href="/systems" className="btn btnGhost">
            Explore Workflow Systems
          </Link>
        </div>
      </main>
    </ScrollReveal>
  );
}
