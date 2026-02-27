import Link from "next/link";

export const dynamic = "force-dynamic";

const WEBSITE_PROCESS = [
  "Discovery & Qualification: align on goals, audience, conversion targets, and requirements.",
  "Scope & Estimate: define pages, features, integrations, and timeline; lock a practical build plan.",
  "Design Direction: establish visual system, layout hierarchy, and messaging structure.",
  "Build & Integrations: implement responsive pages, forms, booking, payments, and analytics stack.",
  "QA & Launch: test performance, SEO basics, forms, and handoff before go-live.",
  "Optimization: monitor behavior, improve conversion paths, and iterate with data.",
];

const OPS_PROCESS = [
  "Ops Intake: gather current tools, bottlenecks, and manual workflow pain points.",
  "System Mapping: document lead-to-delivery flow and identify automation opportunities.",
  "Blueprint & Prioritization: define quick wins, dependencies, and rollout sequence.",
  "Implementation: connect forms, CRM, billing, and communications into one repeatable system.",
  "Team Enablement: train usage standards and provide operational documentation.",
  "Measurement & Iteration: track throughput, response time, and admin workload reduction.",
];

export default function ProcessPage() {
  return (
    <main className="container" style={{ padding: "56px 0 90px", maxWidth: 980 }}>
      <div className="kicker"><span className="kickerDot" aria-hidden="true" /> Delivery Process</div>
      <h1 className="h1" style={{ marginTop: 14 }}>End-to-end process for both service lines</h1>
      <p className="p" style={{ marginTop: 10 }}>
        Transparent execution from intake to launch, whether you need a high-converting website or operational automation.
      </p>

      <section className="grid2" style={{ marginTop: 28 }}>
        <div className="panel">
          <div className="panelHeader"><h2 className="h2" style={{ fontSize: 24 }}>Custom Website Process</h2></div>
          <div className="panelBody">
            <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: "var(--muted)" }}>
              {WEBSITE_PROCESS.map((step) => (<li key={step}>{step}</li>))}
            </ol>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader"><h2 className="h2" style={{ fontSize: 24 }}>Workflow Systems Process</h2></div>
          <div className="panelBody">
            <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: "var(--muted)" }}>
              {OPS_PROCESS.map((step) => (<li key={step}>{step}</li>))}
            </ol>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/faq" className="btn btnGhost">Read FAQ</Link>
        <Link href="/build/intro" className="btn btnPrimary">Start Custom Build <span className="btnArrow">→</span></Link>
        <Link href="/systems" className="btn btnGhost">Explore Workflow Systems</Link>
      </div>
    </main>
  );
}
