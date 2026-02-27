import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="homePage">
      <section className="section" style={{ padding: "100px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="kicker" style={{ margin: "0 auto 24px" }}>
            Websites & Workflow Systems
          </div>

          <h1 className="h1">
            Build a professional presence. <br />
            Automate the busywork.
          </h1>

          <p className="p" style={{ marginTop: 24, fontSize: 20 }}>
            CrecyStudio helps local businesses look elite online and run seamlessly behind the scenes.
            From high-converting websites to automated client intake and invoicing workflows.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/systems" className="btn btnPrimary" style={{ padding: "16px 24px", fontSize: 16 }}>
              Fix My Workflow Operations
            </Link>
            <Link href="/build/intro" className="btn btnGhost" style={{ padding: "16px 24px", fontSize: 16 }}>
              Start Custom Build
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="grid2" style={{ alignItems: "stretch" }}>
            <div className="card">
              <div className="cardInner" style={{ padding: 0, overflow: "hidden" }}>
                <Image src="/marketing/website-preview-v2.svg" alt="Website design preview" width={1200} height={700} style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, color: "var(--fg)" }}>Website Delivery Preview</div>
                  <p className="pDark" style={{ marginTop: 8 }}>Conversion layout, mobile responsiveness, lead capture, and performance baseline included.</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="cardInner" style={{ padding: 0, overflow: "hidden" }}>
                <Image src="/marketing/workflow-preview.svg" alt="Workflow automation preview" width={1200} height={700} style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ padding: 20 }}>
                  <div style={{ fontWeight: 800, color: "var(--fg)" }}>Operations Workflow Preview</div>
                  <p className="pDark" style={{ marginTop: 8 }}>Lead intake, status tracking, billing handoff, and reporting flow designed for less admin overhead.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--panel)", borderTop: "1px solid var(--stroke)", borderBottom: "1px solid var(--stroke)" }}>
        <div className="container">
          <div className="grid2" style={{ alignItems: "center" }}>
            <div>
              <h2 className="h2">Most local businesses outgrow their systems.</h2>
              <p className="p" style={{ marginTop: 16 }}>
                You started by tracking leads in a notebook or an Excel sheet. Now, you are spending 15 hours a week chasing down invoices, copying data between tools, and losing potential clients because your website doesn&apos;t convert them instantly.
              </p>
              <div className="pills" style={{ marginTop: 24 }}>
                <span className="badge">Data Entry Bottlenecks</span>
                <span className="badge">Messy Client Intake</span>
                <span className="badge">Outdated Web Design</span>
              </div>
            </div>

            <div className="card">
              <div className="cardInner" style={{ padding: 40 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>1-3</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>Days to deploy a quick win.</div>
                <p className="pDark" style={{ marginTop: 8 }}>
                  Stop bleeding time. We can implement a fully automated lead-to-invoice pipeline or a fresh website landing page in under a week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="h2">Choose your path</h2>
            <p className="p" style={{ marginTop: 12 }}>Start with the immediate bottleneck holding your business back.</p>
          </div>

          <div className="grid2">
            <div className="card cardHover">
              <div className="cardInner" style={{ padding: 40, height: "100%", display: "flex", flexDirection: "column" }}>
                <div>
                  <div className="badge badgeHot">Operations</div>
                  <h3 className="h2" style={{ fontSize: 28, marginTop: 16 }}>Workflow Systems</h3>
                  <p className="p" style={{ marginTop: 12 }}>
                    Stop manually typing client data. CrecyStudio connects your forms, CRM, and accounting stack so data flows automatically.
                  </p>
                  <ul style={{ margin: "24px 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>Automated Client Intake Portals</li>
                    <li>CRM to Billing Synchronization</li>
                    <li>Internal Admin Dashboards</li>
                  </ul>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link href="/systems" className="btn btnPrimary" style={{ width: "100%" }}>
                    Start Workflow Audit
                  </Link>
                </div>
              </div>
            </div>

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
