import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main style={page}>
      {/* BACKGROUND FX */}
      <div aria-hidden style={bgWrap}>
        <div style={gridBg} />
        <div style={blob1} />
        <div style={blob2} />
        <div style={noise} />
      </div>

      <div style={container}>
        {/* NAV STRIP */}
        <header style={topBar} className="reveal">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={logoDot} />
            <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>Crecy Studio</div>
          </div>

          <nav style={nav}>
            <a href="#how" style={navLink}>
              How it works
            </a>
            <a href="#why" style={navLink}>
              Why us
            </a>
            <Link href="/coming-soon" style={navLink}>
              E-commerce
            </Link>
          </nav>
        </header>

        {/* HERO */}
        <section style={hero} className="reveal">
          <div style={heroLeft}>
            <div style={pill}>
              <span style={pillDot} />
              Modern websites + transparent pricing
            </div>

            <h1 style={h1}>
              Professional Websites,
              <br />
              Built the Right Way.
            </h1>

            <p style={lead}>
              Get a modern, conversion-focused website with clear revisions and zero surprises.
              Launch fast with AI-assist, or go fully custom for a premium build.
            </p>

            <div style={ctaRow}>
              <Link href="/build" style={{ ...btnPrimary, ...btnGlow }} className="btnShimmer">
                Start a Custom Website →
              </Link>

              <Link href="/ai" style={btnSecondary}>
                Try AI Website Option
              </Link>
            </div>

            <div style={trustStrip}>
              <TrustItem title="Fast" desc="Speed-optimized builds" />
              <Divider />
              <TrustItem title="Clear" desc="Scope + revisions upfront" />
              <Divider />
              <TrustItem title="Modern" desc="Next.js + Supabase ready" />
            </div>
          </div>

          {/* HERO RIGHT CARD */}
          <div style={heroRight} className="floaty">
            <div style={heroCard}>
              <div style={miniHeader}>
                <div style={miniDot} />
                Live Build Preview
              </div>

              <div style={miniBody}>
                <div style={miniRow}>
                  <span style={miniLabel}>Tier</span>
                  <span style={miniValue}>Professional</span>
                </div>
                <div style={miniRow}>
                  <span style={miniLabel}>Timeline</span>
                  <span style={miniValue}>2–3 weeks</span>
                </div>
                <div style={miniRow}>
                  <span style={miniLabel}>Focus</span>
                  <span style={miniValue}>Leads + Booking</span>
                </div>

                <div style={miniDivider} />

                <div style={miniRow}>
                  <span style={miniLabel}>Est. range</span>
                  <span style={{ ...miniValue, fontWeight: 900 }}>$750 – $1,000</span>
                </div>

                <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                  <div style={miniTag}>✔ Mobile-responsive</div>
                  <div style={miniTag}>✔ SEO structure</div>
                  <div style={miniTag}>✔ Email automation</div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Link href="/build" style={btnMiniPrimary} className="btnShimmer">
                    Get my estimate →
                  </Link>
                </div>
              </div>
            </div>

            <div style={heroNote}>
              Your site doesn’t just look good — it loads fast, converts, and scales.
            </div>
          </div>
        </section>

        {/* OPTIONS */}
        <section style={section} className="reveal">
          <div style={sectionHead}>
            <h2 style={h2}>Choose Your Build Path</h2>
            <p style={sub}>
              Two ways to launch — both professional. Pick what fits your timeline and budget.
            </p>
          </div>

          <div style={grid}>
            <div style={card} className="cardHover">
              <div style={cardTop}>
                <div style={badge}>Custom</div>
                <div style={priceHint}>Typical: $450 – $1,500+</div>
              </div>

              <h3 style={h3}>Custom Website</h3>
              <p style={muted}>
                Built by a real developer. Best for businesses that want stronger branding,
                unique layout, and room to grow.
              </p>

              <ul style={list}>
                <li>✔ Hand-built design</li>
                <li>✔ Clear scope & revisions</li>
                <li>✔ Booking, forms, payments</li>
                <li>✔ SEO & integrations available</li>
              </ul>

              <div style={{ marginTop: 18 }}>
                <Link href="/build" style={{ ...btnPrimary, width: "100%", textAlign: "center" }} className="btnShimmer">
                  Get Custom Quote →
                </Link>
              </div>
            </div>

            <div style={{ ...card, border: "1px solid rgba(17,24,39,0.25)" }} className="cardHover">
              <div style={cardTop}>
                <div style={{ ...badge, background: "#111827", color: "#fff" }}>AI-Assist</div>
                <div style={priceHint}>Lower cost · Faster launch</div>
              </div>

              <h3 style={h3}>AI-Generated Website</h3>
              <p style={muted}>
                A faster, lower-cost way to get online. Ideal for MVPs, side projects,
                and early-stage businesses.
              </p>

              <ul style={list}>
                <li>✔ Industry-specific content</li>
                <li>✔ Goal-focused layout</li>
                <li>✔ Launch in minutes</li>
                <li>✔ Upgrade to custom anytime</li>
              </ul>

              <div style={{ marginTop: 18 }}>
                <Link href="/ai" style={{ ...btnSecondary, width: "100%", textAlign: "center" }}>
                  Explore AI Option →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={section} className="reveal">
          <div style={sectionHead}>
            <h2 style={h2}>How It Works</h2>
            <p style={sub}>A simple flow that avoids delays and scope confusion.</p>
          </div>

          <div style={grid3}>
            <StepCard n="1" title="Scope" desc="Answer a few questions. We recommend the right tier and timeline." />
            <StepCard n="2" title="Build" desc="Design + development with clear revision checkpoints (50% / 90%)." />
            <StepCard n="3" title="Launch" desc="We deploy, connect your domain, and hand over a clean owner setup." />
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/build" style={btnPrimary} className="btnShimmer">
              Start Scope Intake →
            </Link>
            <Link href="/estimate" style={btnSecondary}>
              View Estimate Page →
            </Link>
          </div>
        </section>

        {/* WHY US */}
        <section id="why" style={section} className="reveal">
          <div style={sectionHead}>
            <h2 style={h2}>Why Work With Us</h2>
            <p style={sub}>We combine clean design with real engineering and clean process.</p>
          </div>

          <div style={whyGrid}>
            <WhyCard title="Transparent pricing" desc="No hidden fees. You know what you’re paying for and why." />
            <WhyCard title="Dispute-proof revisions" desc="Clear revision limits and checkpoints to keep projects smooth." />
            <WhyCard title="Modern stack" desc="Fast loading, SEO-ready, and scalable architecture." />
            <WhyCard title="Human support" desc="You’re not just buying a template — you get real guidance." />
          </div>
        </section>

        {/* FOOTER */}
        <footer style={footer} className="reveal">
          <div style={{ fontWeight: 900 }}>Crecy Studio</div>
          <div style={{ color: "rgba(17,24,39,0.7)", fontSize: 13 }}>
            © {new Date().getFullYear()} · Built with Next.js
          </div>
        </footer>
      </div>

      {/* MICRO-INTERACTIONS + REVEAL */}
      <style>{css}</style>
    </main>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Divider() {
  return <div style={{ width: 1, height: 18, background: "rgba(17,24,39,0.12)" }} />;
}

function TrustItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <div style={{ fontWeight: 900, fontSize: 13 }}>{title}</div>
      <div style={{ color: "rgba(17,24,39,0.65)", fontSize: 12 }}>{desc}</div>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div style={stepCard} className="cardHover">
      <div style={stepNum}>{n}</div>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ color: "rgba(17,24,39,0.7)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function WhyCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={whyCard} className="cardHover">
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ color: "rgba(17,24,39,0.7)", lineHeight: 1.6, marginTop: 6 }}>{desc}</div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const page: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "#0b0f1a",
};

const container: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "26px 24px 80px",
  position: "relative",
  zIndex: 2,
};

const topBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(10px)",
};

const nav: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const navLink: React.CSSProperties = {
  color: "rgba(255,255,255,0.86)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 800,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
};

const hero: React.CSSProperties = {
  marginTop: 26,
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 22,
  alignItems: "center",
};

const heroLeft: React.CSSProperties = {
  padding: "34px 26px",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(10px)",
};

const heroRight: React.CSSProperties = {
  display: "grid",
  gap: 12,
  alignContent: "start",
};

const h1: React.CSSProperties = {
  fontSize: 52,
  lineHeight: 1.05,
  letterSpacing: -1.2,
  margin: "14px 0 12px",
  color: "#fff",
  fontWeight: 950,
};

const lead: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.7,
  maxWidth: 720,
  color: "rgba(255,255,255,0.82)",
  margin: 0,
};

const ctaRow: React.CSSProperties = {
  marginTop: 22,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 18px",
  background: "#ffffff",
  color: "#0b0f1a",
  borderRadius: 14,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.18)",
  position: "relative",
  overflow: "hidden",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 18px",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "rgba(255,255,255,0.92)",
  borderRadius: 14,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 900,
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(10px)",
};

const btnGlow: React.CSSProperties = {
  boxShadow: "0 10px 30px rgba(255,255,255,0.16)",
};

const trustStrip: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.10)",
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.86)",
  fontWeight: 900,
  fontSize: 12,
  width: "fit-content",
};

const pillDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 0 18px rgba(255,255,255,0.55)",
};

const logoDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 0 22px rgba(255,255,255,0.55)",
};

const section: React.CSSProperties = {
  marginTop: 44,
  padding: "34px 26px",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(10px)",
};

const sectionHead: React.CSSProperties = {
  display: "grid",
  gap: 6,
  marginBottom: 18,
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 950,
  color: "#fff",
  letterSpacing: -0.4,
};

const sub: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.6,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 20,
  background: "rgba(15, 23, 42, 0.45)",
};

const cardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  background: "rgba(255,255,255,0.90)",
  color: "#0b0f1a",
};

const priceHint: React.CSSProperties = {
  color: "rgba(255,255,255,0.70)",
  fontSize: 12,
  fontWeight: 900,
};

const h3: React.CSSProperties = {
  marginTop: 14,
  marginBottom: 8,
  fontSize: 18,
  fontWeight: 950,
  color: "#fff",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.7,
  margin: 0,
};

const list: React.CSSProperties = {
  marginTop: 14,
  lineHeight: 1.9,
  paddingLeft: 18,
  color: "rgba(255,255,255,0.86)",
};

const whyGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const whyCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 18,
  background: "rgba(15, 23, 42, 0.45)",
};

const stepCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 18,
  background: "rgba(15, 23, 42, 0.45)",
  display: "grid",
  gap: 10,
};

const stepNum: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  color: "#0b0f1a",
  background: "rgba(255,255,255,0.90)",
};

const footer: React.CSSProperties = {
  marginTop: 40,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  padding: "12px 6px",
  color: "#fff",
};

/* ---------- HERO RIGHT MINI UI ---------- */

const heroCard: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
  overflow: "hidden",
};

const miniHeader: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.90)",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const miniDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "rgba(255,255,255,0.95)",
  boxShadow: "0 0 18px rgba(255,255,255,0.45)",
};

const miniBody: React.CSSProperties = {
  padding: 16,
  color: "#fff",
};

const miniRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 0",
};

const miniLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 900,
  fontSize: 12,
};

const miniValue: React.CSSProperties = {
  color: "rgba(255,255,255,0.92)",
  fontWeight: 800,
  fontSize: 12,
};

const miniDivider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.10)",
  margin: "6px 0",
};

const miniTag: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15, 23, 42, 0.45)",
  color: "rgba(255,255,255,0.86)",
  fontWeight: 900,
  fontSize: 12,
};

const btnMiniPrimary: React.CSSProperties = {
  display: "inline-flex",
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  padding: "12px 14px",
  borderRadius: 14,
  background: "#fff",
  color: "#0b0f1a",
  textDecoration: "none",
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.18)",
  position: "relative",
  overflow: "hidden",
};

const heroNote: React.CSSProperties = {
  color: "rgba(255,255,255,0.70)",
  fontSize: 12,
  lineHeight: 1.6,
  padding: "0 6px",
};

/* ---------------- BACKGROUND ---------------- */

const bgWrap: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
};

const gridBg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
  opacity: 0.25,
  maskImage: "radial-gradient(circle at 40% 10%, black 20%, transparent 70%)",
};

const blob1: React.CSSProperties = {
  position: "absolute",
  width: 540,
  height: 540,
  left: -140,
  top: -180,
  background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent 60%)",
  filter: "blur(10px)",
};

const blob2: React.CSSProperties = {
  position: "absolute",
  width: 520,
  height: 520,
  right: -160,
  bottom: -200,
  background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 60%)",
  filter: "blur(10px)",
};

const noise: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E)",
  opacity: 0.08,
  mixBlendMode: "overlay",
};

/* ---------------- CSS KEYFRAMES ---------------- */

const css = `
  /* reveal animation */
  .reveal { opacity: 0; transform: translateY(10px); animation: rvl .65s ease forwards; }
  .reveal:nth-of-type(1) { animation-delay: .02s; }
  .reveal:nth-of-type(2) { animation-delay: .08s; }
  .reveal:nth-of-type(3) { animation-delay: .14s; }
  .reveal:nth-of-type(4) { animation-delay: .20s; }
  @keyframes rvl { to { opacity: 1; transform: translateY(0); } }

  /* hover micro-interactions */
  .cardHover { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
  .cardHover:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.30); border-color: rgba(255,255,255,0.18); }

  /* button shimmer */
  .btnShimmer::after {
    content: "";
    position: absolute;
    inset: -60%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: translateX(-60%) rotate(12deg);
    transition: transform .55s ease;
    pointer-events: none;
  }
  .btnShimmer:hover::after { transform: translateX(60%) rotate(12deg); }

  /* floaty hero card */
  .floaty { animation: floaty 6s ease-in-out infinite; }
  @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

  /* nicer focus */
  a:focus-visible { outline: 2px solid rgba(255,255,255,0.9); outline-offset: 3px; border-radius: 12px; }
  button:focus-visible { outline: 2px solid rgba(255,255,255,0.9); outline-offset: 3px; border-radius: 12px; }

  @media (max-width: 980px) {
    .floaty { animation: none; }
  }
  @media (max-width: 980px) {
    /* hero stacks */
    main > div > section { }
  }
`;
