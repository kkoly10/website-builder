import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="homePage">
      
      {/* 1. CLEAN, CENTERED HERO SECTION */}
      <section className="section" style={{ padding: "100px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="kicker" style={{ margin: "0 auto 24px" }}>
            Websites & Workflow Systems
          </div>
          
          <h1 className="h1">
            Build a professional presence. <br />
            Automate the busywork.
          </h1>
          
          <p className="p" style={{ marginTop: 24, fontSize: 20 }}>
            I help local businesses look elite online and run seamlessly behind the scenes. 
            From high-converting websites to automated client intake and invoicing workflows.
          </p>
          
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/systems" className="btn btnPrimary" style={{ padding: "16px 24px", fontSize: 16 }}>
              Fix My Workflow Operations
            </Link>
            <Link href="/build/intro" className="btn btnGhost" style={{ padding: "16px 24px", fontSize: 16 }}>
              Get a Website Quote
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM (AGITATION) */}
      <section className="section" style={{ background: "var(--panel)", borderTop: "1px solid var(--stroke)", borderBottom: "1px solid var(--stroke)" }}>
        <div className="container">
          <div className="grid2" style={{ alignItems: "center" }}>
            
            {/* TEXT COLUMN */}
            <div>
              <h2 className="h2">Most local businesses outgrow their systems.</h2>
              <p className="p" style={{ marginTop: 16 }}>
                You started by tracking leads in a notebook or an Excel sheet. Now, you are spending 15 hours a week chasing down invoices, copying data between tools, and losing potential clients because your website doesn't convert them instantly.
              </p>
              <div className="pills" style={{ marginTop: 24 }}>
                <span className="badge">Data Entry Bottlenecks</span>
                <span className="badge">Messy Client Intake</span>
                <span className="badge">Outdated Web Design</span>
              </div>
            </div>
            
            {/* PATH 1: WORKFLOW SYSTEMS (With the 1-3 metric) */}
            <div className="card">
              <div className="cardInner" style={{ padding: 40, height: "100%", display: "flex", flexDirection: "column" }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>1-3</div>
                  <div className="badge" style={{ marginTop: 16 }}>Operations</div>
                  <h3 className="h2" style={{ fontSize: 28, marginTop: 16 }}>Workflow Systems</h3>
                  <p className="p" style={{ marginTop: 12 }}>
                    Custom automations to eliminate manual data entry. Connect your CRM, email, and invoicing tools to run on autopilot.
                  </p>
                  <ul style={{ margin: "24px 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>Automated Client Intake</li>
                    <li>Zapier & Make.com Integrations</li>
                    <li>Custom CRM Dashboards</li>
                  </ul>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link href="/systems" className="btn btnPrimary" style={{ width: "100%" }}>
                    Start Workflow Audit
                  </Link>
                </div>
              </div>
            </div>

            {/* PATH 2: CUSTOM WEBSITES */}
            <div className="card cardHover">
              <div className="cardInner" style={{ padding: 40, height: "100%", display: "flex", flexDirection: "column" }}>
                <div>
                  <div className="badge">Marketing</div>
                  <h3 className="h2" style={{ fontSize: 28, marginTop: 16 }}>Custom Websites</h3>
                  <p className="p" style={{ marginTop: 12 }}>
                    Professional, mobile-optimized sites built to convert visitors into booked jobs. Perfect for local services needing to outrank competitors.
                  </p>
                  <ul style={{ margin: "24px 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>Lead Capture & Booking Forms</li>
                    <li>SEO & Performance Optimized</li>
                    <li>Starting at $550</li>
                  </ul>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link href="/build/intro" className="btn btnGhost" style={{ width: "100%" }}>
                    Get Instant Website Quote
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
