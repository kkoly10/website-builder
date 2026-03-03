import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

export default function SystemsPage() {
  return (
    <ScrollReveal>
      <main className="container">

        {/* 1. HERO */}
        <section className="heroSection">
          <div className="heroContainer">
            <div className="kicker heroFadeUp">
              <span className="kickerDot" aria-hidden="true" />
              Business Systems &amp; Automation
            </div>

            <h1 className="h1 heroFadeUp stagger-1">
              Scale your operations without scaling your headcount.
            </h1>

            <p className="p heroSubtitle heroFadeUp stagger-2">
              I build practical, custom workflow systems for local businesses.
              Stop losing hours to manual data entry, disconnected software,
              and messy client onboarding.
            </p>

            <div className="heroActions heroFadeUp stagger-3">
              <Link href="/ops-intake" className="btn btnPrimary btnLg">
                Start Workflow Audit <span className="btnArrow">→</span>
              </Link>
            </div>

            <div className="pills pillsCenter heroPills heroFadeUp stagger-4">
              <span className="pill">Quick wins + retainers</span>
              <span className="pill">CRM Cleanup</span>
              <span className="pill">Intake &amp; Billing Automation</span>
            </div>
          </div>
        </section>

        {/* 2. AGITATION: The Problem Outline */}
        <section className="section sectionBand">
          <div className="container">
            <div className="grid2stretch">
              <div className="fadeUp">
                <h2 className="h2">The signs your systems are breaking:</h2>
                <ul className="serviceCardList">
                  <li><strong>Data Entry:</strong> You manually type the same client info into 3 different tools.</li>
                  <li><strong>Lost Revenue:</strong> Leads come in, but follow-ups and invoices fall through the cracks.</li>
                  <li><strong>Client Friction:</strong> Onboarding requires endless back-and-forth emails and messy PDFs.</li>
                  <li><strong>Software Soup:</strong> You pay for 8 different SaaS tools, but none of them talk to each other.</li>
                </ul>
              </div>

              <div className="card cardHover fadeUp stagger-2">
                <div className="cardInner">
                  <h3 className="h3">The Solution is Connection.</h3>
                  <p className="pDark">
                    You don&rsquo;t need more software. You need your current
                    software (QuickBooks, HubSpot, Stripe, Google Workspace)
                    wired together properly. I build the bridges and
                    client-facing portals that make your business run on
                    autopilot.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SOLUTIONS: Service Tiers */}
        <section className="section">
          <div className="sectionHead fadeUp">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Service Levels
            </div>
            <h2 className="h2">Built for quick fixes and long-term scaling</h2>
          </div>

          <div className="tierGrid">
            <ServiceCard
              title="Quick Workflow Fix"
              subtitle="Fast-start sprint"
              delay="stagger-1"
              bullets={[
                "Fix a broken intake / booking flow",
                "Clean up lead handoff to email/CRM",
                "Improve quote or invoice process",
                "Small automation setup (Zapier/Make)",
              ]}
              ctaHref="/ops-intake"
              ctaLabel="Start Intake"
            />

            <ServiceCard
              title="Ops System Build"
              subtitle="Most common engagement"
              hot
              delay="stagger-2"
              bullets={[
                "Custom intake + booking + status flow",
                "Client-facing portal/dashboard setup",
                "Back-office admin tracking + reporting",
                "Complex integrations between your tools",
              ]}
              ctaHref="/ops-intake"
              ctaLabel="Start Full Audit"
            />

            <ServiceCard
              title="Ongoing Systems Partner"
              subtitle="Monthly Retainer"
              delay="stagger-3"
              bullets={[
                "Continuous improvements & maintenance",
                "Workflow updates as your team grows",
                "New forms, automations, and reports",
                "Priority support for issues and changes",
              ]}
              ctaHref="/ops-intake"
              ctaLabel="Request a Plan"
            />
          </div>
        </section>

        {/* 4. PROCESS */}
        <section className="section">
          <div className="card fadeUp">
            <div className="cardInner">
              <div className="sectionHead">
                <h2 className="h2">The path to a smoother business</h2>
              </div>

              <div className="grid4">
                <Step n="1" title="Submit the Workflow Audit" desc="Tell me what's breaking, what tools you currently pay for, and what your ideal outcome is." delay="stagger-1" />
                <Step n="2" title="AI & Expert Analysis" desc="I run your data through my PIE framework to identify risks, scope options, and generate a projected investment range." delay="stagger-2" />
                <Step n="3" title="Strategy Call & Build" desc="We review the plan. If it makes sense, I build the automation, test it, and train your team on how to use it." delay="stagger-3" />
              </div>

              <div className="heroActions fadeUp stagger-4">
                <Link href="/ops-intake" className="btn btnPrimary btnLg">
                  Start Workflow Audit <span className="btnArrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </ScrollReveal>
  );
}

/* ============================
   COMPONENTS
   ============================ */

function ServiceCard({
  title, subtitle, bullets, ctaHref, ctaLabel, hot, delay,
}: {
  title: string; subtitle: string; bullets: string[];
  ctaHref: string; ctaLabel: string; hot?: boolean; delay?: string;
}) {
  return (
    <div className={`card cardHover serviceCard scaleIn ${delay ?? ""}`}>
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{subtitle}</div>
          </div>
          <span className={`badge ${hot ? "badgeHot" : ""}`}>
            {hot ? "Recommended" : "Service"}
          </span>
        </div>

        <ul className="tierList serviceCardBody">
          {bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>

        <div className="serviceCardCta">
          <Link className="btn btnPrimary wFull" href={ctaHref}>
            {ctaLabel} <span className="btnArrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc, delay }: { n: string; title: string; desc: string; delay?: string }) {
  return (
    <div className={`card processCard fadeUp ${delay ?? ""}`}>
      <div className="cardInner">
        <div className="processNum">{n}</div>
        <div className="processTitle">{title}</div>
        <p className="pDark">{desc}</p>
      </div>
    </div>
  );
}
