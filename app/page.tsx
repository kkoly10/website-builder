import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="container">
      {/* HERO */}
      <section className="reveal" style={{ marginBottom: 72 }}>
        <div
          className="glass"
          style={{
            padding: 26,
            borderRadius: 24,
            maxWidth: 980,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 900, letterSpacing: 0.2 }}>
            Transparent pricing • Clear scope • Fast builds
          </div>

          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.05,
              margin: "14px 0 10px",
              fontWeight: 950,
              letterSpacing: -1.2,
            }}
          >
            Websites that look premium
            <br />
            and convert.
          </h1>

          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 18, lineHeight: 1.7, maxWidth: 820 }}>
            Get a modern, conversion-focused website with transparent pricing, clear revisions,
            and zero surprises. Start with a guided intake and get an estimate instantly.
          </p>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/build" className="btn btnPrimary btnShimmer">
              Start Intake → Get Estimate
            </Link>

            <Link href="/ai" className="btn btnGhost">
              Try AI Website Option
            </Link>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 14, flexWrap: "wrap", color: "rgba(255,255,255,0.66)", fontSize: 13 }}>
            <span>✓ Revision policy included</span>
            <span>✓ Fast loading pages</span>
            <span>✓ Booking / forms / payments</span>
            <span>✓ Upgrade anytime</span>
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 54,
        }}
      >
        <div className="card cardHover reveal" style={{ padding: 22, animationDelay: "0.08s" as any }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>Custom Website</h2>
          <p style={{ marginTop: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
            Built by a real developer. Best for businesses that want full control, stronger branding,
            and room to grow.
          </p>

          <ul style={{ marginTop: 12, lineHeight: 1.9, paddingLeft: 18, color: "rgba(255,255,255,0.78)" }}>
            <li>Hand-built design</li>
            <li>Clear scope & revisions</li>
            <li>Booking, forms, payments</li>
            <li>SEO & integrations available</li>
          </ul>

          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.85)", fontWeight: 900 }}>
            Typical projects: $450 – $1,500+
          </div>

          <div style={{ marginTop: 14 }}>
            <Link href="/build" className="btn btnPrimary btnShimmer">
              Get Custom Quote →
            </Link>
          </div>
        </div>

        <div className="card cardHover reveal" style={{ padding: 22, animationDelay: "0.14s" as any, borderColor: "rgba(255,255,255,0.18)" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>AI-Assisted Website</h2>
          <p style={{ marginTop: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
            Faster + lower cost. Ideal for MVPs, side projects, and early-stage businesses.
            Upgrade to custom whenever you’re ready.
          </p>

          <ul style={{ marginTop: 12, lineHeight: 1.9, paddingLeft: 18, color: "rgba(255,255,255,0.78)" }}>
            <li>Industry-specific content</li>
            <li>Goal-focused layout</li>
            <li>Launch quickly</li>
            <li>Upgradeable paths</li>
          </ul>

          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.85)", fontWeight: 900 }}>
            Lower cost • Faster launch
          </div>

          <div style={{ marginTop: 14 }}>
            <Link href="/ai" className="btn btnGhost">
              Explore AI Option →
            </Link>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="reveal" style={{ maxWidth: 980, animationDelay: "0.18s" as any }}>
        <div className="glass" style={{ padding: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>Why work with us</h2>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.7,
            }}
          >
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950 }}>Transparent pricing</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>
                No hidden fees — scope is clear before you pay.
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950 }}>Revision limits</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>
                Prevents disputes and keeps projects moving.
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950 }}>Speed + performance</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>
                Modern stack, fast load times, mobile-first.
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 950 }}>Human support</div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>
                You’re not just dealing with software.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
