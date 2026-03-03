// app/page.tsx
import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="homePage">
      <ScrollReveal />

      {/* ── HERO ── */}
      <section className="section heroSection">
        <div className="container heroContainer">
          <div className="heroFadeUp">
            <div className="kicker">Websites &amp; Workflow Systems</div>
          </div>

          <h1 className="h1 heroFadeUp stagger-1">
            Look <span className="textGradient">elite</span> online.<br />
            Run on autopilot behind the scenes.
          </h1>

          <p className="p heroSubtitle heroFadeUp stagger-2">
            CrecyStudio builds high-converting websites and custom workflow systems for local businesses
            that are ready to stop doing everything manually.
          </p>

          <div className="heroActions heroFadeUp stagger-3">
            <Link href="/build/intro" className="btn btnPrimary btnLg">
              Get a Website Quote <span className="btnArrow">→</span>
            </Link>
            <Link href="/systems" className="btn btnGhost btnLg">
              Fix My Workflow Systems
            </Link>
          </div>

          <div className="pills heroPills heroFadeUp stagger-4">
            <span className="pill">Free estimates</span>
            <span className="pill">50% deposit to start</span>
            <span className="pill">Local business specialists</span>
            <span className="pill">Fast turnaround</span>
          </div>
        </div>
      </section>

      {/* ── PREVIEW CARDS ── */}
      <section className="section">
        <div className="container">
          <div className="grid2stretch">
            <div className="card cardMedia cardHover scaleIn">
              <div className="cardInner">
                <img
                  src="/marketing/website-preview-v2.svg"
                  alt="Website design preview"
                  width={1200}
                  height={700}
                />
                <div className="cardMediaBody">
                  <div className="cardMediaTitle">Website Delivery Preview</div>
                  <p className="pDark cardMediaDesc">
                    Conversion layout, mobile responsiveness, lead capture, and performance baseline included.
                  </p>
                </div>
              </div>
            </div>

            <div className="card cardMedia cardHover scaleIn stagger-1">
              <div className="cardInner">
                <img
                  src="/marketing/workflow-preview.svg"
                  alt="Workflow automation preview"
                  width={1200}
                  height={700}
                />
                <div className="cardMediaBody">
                  <div className="cardMediaTitle">Operations Workflow Preview</div>
                  <p className="pDark cardMediaDesc">
                    Lead intake, status tracking, billing handoff, and reporting flow designed for less admin overhead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section className="section sectionBand">
        <div className="container">
          <div className="sectionIntro fadeUp">
            <h2 className="h2">Most local businesses outgrow their systems.</h2>
            <p className="p">
              You started by tracking leads in a notebook or spreadsheet. Now you&apos;re spending 15 hours
              a week chasing invoices, copying data between tools, and losing clients because your website
              doesn&apos;t convert them instantly.
            </p>
          </div>

          <div className="pills pillsCenter fadeUp stagger-1">
            <span className="badge">Data Entry Bottlenecks</span>
            <span className="badge">Messy Client Intake</span>
            <span className="badge">Outdated Web Design</span>
            <span className="badge">Disconnected Software</span>
            <span className="badge">Lost Revenue</span>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section">
        <div className="container">
          <div className="sectionHead fadeUp">
            <div className="kicker">What We Build</div>
            <h2 className="h2">Two ways to transform your business</h2>
          </div>

          <div className="grid2stretch">
            <div className="card cardHover serviceCard scaleIn">
              <div className="cardInner">
                <div className="serviceCardBody">
                  <div className="badge">Operations</div>
                  <h3 className="h3 serviceCardTitle">Workflow Systems</h3>
                  <p className="p serviceCardDesc">
                    Custom automations to eliminate manual data entry. Connect your CRM, email,
                    and invoicing tools to run on autopilot.
                  </p>
                  <ul className="serviceCardList">
                    <li>Automated Client Intake</li>
                    <li>Zapier &amp; Make.com Integrations</li>
                    <li>Custom CRM Dashboards</li>
                    <li>Invoice &amp; Billing Automation</li>
                  </ul>
                  <div className="serviceCardPills">
                    <span className="pill">From $1,000</span>
                    <span className="pill">Free workflow audit</span>
                  </div>
                </div>
                <div className="serviceCardCta">
                  <Link href="/systems" className="btn btnPrimary">
                    Start Workflow Audit <span className="btnArrow">→</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="card cardHover serviceCard scaleIn stagger-1">
              <div className="cardInner">
                <div className="serviceCardBody">
                  <div className="badge">Marketing</div>
                  <h3 className="h3 serviceCardTitle">Custom Websites</h3>
                  <p className="p serviceCardDesc">
                    Professional, mobile-optimized sites built to convert visitors into booked jobs.
                    Perfect for local services needing to outrank competitors.
                  </p>
                  <ul className="serviceCardList">
                    <li>Lead Capture &amp; Booking Forms</li>
                    <li>SEO &amp; Performance Optimized</li>
                    <li>Booking &amp; Payment Integrations</li>
                    <li>Mobile-first, fast delivery</li>
                  </ul>
                  <div className="serviceCardPills">
                    <span className="pill">From $1,500</span>
                    <span className="pill">Free instant estimate</span>
                  </div>
                </div>
                <div className="serviceCardCta">
                  <Link href="/build/intro" className="btn btnGhost">
                    Get Instant Website Quote <span className="btnArrow">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section sectionBand">
        <div className="container">
          <div className="sectionHead fadeUp">
            <div className="kicker">The Process</div>
            <h2 className="h2">Simple from first click to launch</h2>
          </div>

          <div className="grid4">
            {[
              { n: "1", title: "Submit Your Intake", desc: "Answer a few questions about your goals, tools, and timeline. Takes under 3 minutes." },
              { n: "2", title: "Get a Scoped Estimate", desc: "Our AI-powered PIE system analyzes your needs and generates a transparent price range instantly." },
              { n: "3", title: "Quick Strategy Call", desc: "We align on scope, timeline, and budget. No pressure — just a clear plan." },
              { n: "4", title: "We Build. You Launch.", desc: "50% deposit to start. We deliver fast, revise until you're happy, then hand it over." },
            ].map(({ n, title, desc }) => (
              <div key={n} className={`card processCard fadeUp stagger-${n}`}>
                <div className="cardInner">
                  <div className="processNum">{n}</div>
                  <div className="processTitle">{title}</div>
                  <p className="pDark">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div className="sectionHead fadeUp">
            <div className="kicker">Results</div>
            <h2 className="h2">What clients say</h2>
          </div>

          <div className="grid2stretch">
            <div className="card testimonialCard fadeUp">
              <div className="cardInner">
                <p className="testimonialQuote">
                  &ldquo;Before CrecyStudio, our intake process was a mess of spreadsheets and missed follow-ups.
                  Now everything runs automatically and we haven&apos;t lost a lead in months.&rdquo;
                </p>
                <div className="testimonialAuthor">Sarah M.</div>
                <div className="testimonialRole">Owner, boutique law firm</div>
              </div>
            </div>
            <div className="card testimonialCard fadeUp stagger-1">
              <div className="cardInner">
                <p className="testimonialQuote">
                  &ldquo;We were paying for five tools that didn&apos;t talk to each other.
                  CrecyStudio connected everything in two weeks. It paid for itself in the first month.&rdquo;
                </p>
                <div className="testimonialAuthor">Marcus T.</div>
                <div className="testimonialRole">Operations Manager, HVAC company</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="section">
        <div className="container">
          <div className="card ctaCard scaleIn">
            <div className="cardInner">
              <div className="kicker">Ready to start?</div>
              <h2 className="h2">
                Tell us what you need.<br />Get a clear plan in 24 hours.
              </h2>
              <p className="p">
                No vague proposals. No hidden fees. Every project starts with a free estimate and a strategy call
                so you know exactly what you&apos;re getting before anything is built.
              </p>
              <div className="heroActions">
                <Link href="/build/intro" className="btn btnPrimary btnLg">
                  Get a Website Quote <span className="btnArrow">→</span>
                </Link>
                <Link href="/systems" className="btn btnGhost btnLg">
                  Start Workflow Audit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
