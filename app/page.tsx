// app/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="homePage">

      {/* ── HERO ── */}
      <section className="section" style={{ padding: "100px 0 80px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="kicker" style={{ margin: "0 auto 24px" }}>
            Websites & Workflow Systems
          </div>

          <h1 className="h1">
            Look elite online.<br />
            Run on autopilot behind the scenes.
          </h1>

          <p className="p" style={{ marginTop: 24, fontSize: 20, maxWidth: 640, margin: "24px auto 0" }}>
            CrecyStudio builds high-converting websites and custom workflow systems for local businesses
            that are ready to stop doing everything manually.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/build/intro" className="btn btnPrimary" style={{ padding: "16px 28px", fontSize: 16 }}>
              Get a Website Quote <span className="btnArrow">→</span>
            </Link>
            <Link href="/systems" className="btn btnGhost" style={{ padding: "16px 28px", fontSize: 16 }}>
              Fix My Workflow Systems
            </Link>
          </div>

          <div className="pills" style={{ justifyContent: "center", marginTop: 28 }}>
            <span className="pill">Free estimates</span>
            <span className="pill">50% deposit to start</span>
            <span className="pill">Local business specialists</span>
            <span className="pill">Fast turnaround</span>
          </div>
        </div>
      </section>

      {/* ── PREVIEW CARDS ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="grid2" style={{ alignItems: "stretch" }}>
            <div className="card">
              <div className="cardInner" style={{ padding: 0, overflow: "hidden" }}>
                <img
                  src="/marketing/website-preview-v2.svg"
                  alt="Website design preview"
                  width={1200}
                  height={700}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
                <div style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, color: "var(--fg)" }}>Website Delivery Preview</div>
                  <p className="pDark" style={{ marginTop: 8 }}>
                    Conversion layout, mobile responsiveness, lead capture, and performance baseline included.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardInner" style={{ padding: 0, overflow: "hidden" }}>
                <img
                  src="/marketing/workflow-preview.svg"
                  alt="Workflow automation preview"
                  width={1200}
                  height={700}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
                <div style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, color: "var(--fg)" }}>Operations Workflow Preview</div>
                  <p className="pDark" style={{ marginTop: 8 }}>
                    Lead intake, status tracking, billing handoff, and reporting flow designed for less admin overhead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section className="section" style={{ background: "var(--panel)", borderTop: "1px solid var(--stroke)", borderBottom: "1px solid var(--stroke)" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 48px" }}>
            <h2 className="h2">Most local businesses outgrow their systems.</h2>
            <p className="p" style={{ marginTop: 16 }}>
              You started by tracking leads in a notebook or spreadsheet. Now you&apos;re spending 15 hours
              a week chasing invoices, copying data between tools, and losing clients because your website
              doesn&apos;t convert them instantly.
            </p>
          </div>

          <div className="pills" style={{ justifyContent: "center" }}>
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
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="kicker" style={{ margin: "0 auto 16px" }}>What We Build</div>
            <h2 className="h2">Two ways to transform your business</h2>
          </div>

          {/* Fixed: was grid2 with 3 children — now proper two-column layout */}
          <div className="grid2" style={{ alignItems: "stretch", gap: 16 }}>

            <div className="card cardHover" style={{ display: "flex", flexDirection: "column" }}>
              <div className="cardInner" style={{ padding: 40, height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1 }}>
                  <div className="badge">Operations</div>
                  <h3 className="h2" style={{ fontSize: 28, marginTop: 16 }}>Workflow Systems</h3>
                  <p className="p" style={{ marginTop: 12 }}>
                    Custom automations to eliminate manual data entry. Connect your CRM, email,
                    and invoicing tools to run on autopilot.
                  </p>
                  <ul style={{ margin: "24px 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>Automated Client Intake</li>
                    <li>Zapier &amp; Make.com Integrations</li>
                    <li>Custom CRM Dashboards</li>
                    <li>Invoice &amp; Billing Automation</li>
                  </ul>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <span className="pill">From $1,000</span>
                    <span className="pill">Free workflow audit</span>
                  </div>
                </div>
                <div style={{ marginTop: 28 }}>
                  <Link href="/systems" className="btn btnPrimary" style={{ width: "100%" }}>
                    Start Workflow Audit <span className="btnArrow">→</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="card cardHover" style={{ display: "flex", flexDirection: "column" }}>
              <div className="cardInner" style={{ padding: 40, height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1 }}>
                  <div className="badge">Marketing</div>
                  <h3 className="h2" style={{ fontSize: 28, marginTop: 16 }}>Custom Websites</h3>
                  <p className="p" style={{ marginTop: 12 }}>
                    Professional, mobile-optimized sites built to convert visitors into booked jobs.
                    Perfect for local services needing to outrank competitors.
                  </p>
                  <ul style={{ margin: "24px 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>Lead Capture &amp; Booking Forms</li>
                    <li>SEO &amp; Performance Optimized</li>
                    <li>Booking &amp; Payment Integrations</li>
                    <li>Mobile-first, fast delivery</li>
                  </ul>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <span className="pill">From $1,500</span>
                    <span className="pill">Free instant estimate</span>
                  </div>
                </div>
                <div style={{ marginTop: 28 }}>
                  <Link href="/build/intro" className="btn btnGhost" style={{ width: "100%" }}>
                    Get Instant Website Quote <span className="btnArrow">→</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" style={{ background: "var(--panel)", borderTop: "1px solid var(--stroke)", borderBottom: "1px solid var(--stroke)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="kicker" style={{ margin: "0 auto 16px" }}>The Process</div>
            <h2 className="h2">Simple from first click to launch</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { n: "1", title: "Submit Your Intake", desc: "Answer a few questions about your goals, tools, and timeline. Takes under 3 minutes." },
              { n: "2", title: "Get a Scoped Estimate", desc: "Our AI-powered PIE system analyzes your needs and generates a transparent price range instantly." },
              { n: "3", title: "Quick Strategy Call", desc: "We align on scope, timeline, and budget. No pressure — just a clear plan." },
              { n: "4", title: "We Build. You Launch.", desc: "50% deposit to start. We deliver fast, revise until you're happy, then hand it over." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="card" style={{ background: "var(--panel2)" }}>
                <div className="cardInner" style={{ padding: 24 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center",
                    fontWeight: 800, fontSize: 18, background: "var(--accentSoft)",
                    border: "1px solid var(--accentStroke)", color: "var(--accent)", marginBottom: 16,
                  }}>
                    {n}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--fg)", marginBottom: 8 }}>{title}</div>
                  <p className="pDark" style={{ margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="kicker" style={{ margin: "0 auto 16px" }}>Results</div>
            <h2 className="h2">What clients say</h2>
          </div>

          <div className="grid2" style={{ gap: 16 }}>
            <div className="card">
              <div className="cardInner" style={{ padding: 32 }}>
                <p className="pDark" style={{ fontSize: 16, lineHeight: 1.7, fontStyle: "italic", color: "var(--muted)" }}>
                  &ldquo;Before CrecyStudio, our intake process was a mess of spreadsheets and missed follow-ups.
                  Now everything runs automatically and we haven&apos;t lost a lead in months.&rdquo;
                </p>
                <div style={{ marginTop: 20, fontWeight: 700, color: "var(--fg)" }}>Sarah M.</div>
                <div style={{ fontSize: 13, color: "var(--muted2)" }}>Owner, boutique law firm</div>
              </div>
            </div>
            <div className="card">
              <div className="cardInner" style={{ padding: 32 }}>
                <p className="pDark" style={{ fontSize: 16, lineHeight: 1.7, fontStyle: "italic", color: "var(--muted)" }}>
                  &ldquo;We were paying for five tools that didn&apos;t talk to each other.
                  CrecyStudio connected everything in two weeks. It paid for itself in the first month.&rdquo;
                </p>
                <div style={{ marginTop: 20, fontWeight: 700, color: "var(--fg)" }}>Marcus T.</div>
                <div style={{ fontSize: 13, color: "var(--muted2)" }}>Operations Manager, HVAC company</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="section" style={{ paddingBottom: 100 }}>
        <div className="container">
          <div className="card" style={{ background: "var(--panel2)", border: "1px solid var(--accentStroke)" }}>
            <div className="cardInner" style={{ padding: "60px 40px", textAlign: "center" }}>
              <div className="kicker" style={{ margin: "0 auto 20px" }}>Ready to start?</div>
              <h2 className="h2" style={{ fontSize: 32 }}>
                Tell us what you need.<br />Get a clear plan in 24 hours.
              </h2>
              <p className="p" style={{ marginTop: 16, maxWidth: 520, margin: "16px auto 0" }}>
                No vague proposals. No hidden fees. Every project starts with a free estimate and a strategy call
                so you know exactly what you&apos;re getting before anything is built.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
                <Link href="/build/intro" className="btn btnPrimary" style={{ padding: "16px 28px", fontSize: 16 }}>
                  Get a Website Quote <span className="btnArrow">→</span>
                </Link>
                <Link href="/systems" className="btn btnGhost" style={{ padding: "16px 28px", fontSize: 16 }}>
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
