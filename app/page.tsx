import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main style={{ display: "grid", gap: 18 }}>
      {/* HERO */}
      <section className="glass" style={{ padding: 26, overflow: "hidden" }}>
        <div className="kicker">Websites that convert</div>

        <div className="h1" style={{ marginTop: 10, maxWidth: 980 }}>
          Professional websites, built the right way —{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,1), rgba(34,211,238,1))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            fast, clean, and transparent.
          </span>
        </div>

        <div className="p" style={{ maxWidth: 820 }}>
          Get a modern, conversion-focused website with clear scope, clear revisions, and zero
          surprises. Choose a custom build or launch faster with the AI option.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link href="/estimate" className="btn btnPrimary">
            Get instant estimate →
          </Link>
          <Link href="/build" className="btn btnGhost">
            Start custom project
          </Link>
          <Link href="/ai" className="btn btnGhost">
            Try AI option
          </Link>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 18 }}>
          <Stat title="Fast delivery" desc="Modern stack, clean handoff, no bloat." />
          <Stat title="Transparent pricing" desc="You see what drives cost — upfront." />
          <Stat title="Clear revisions" desc="Limits prevent disputes and scope creep." />
        </div>
      </section>

      {/* OPTIONS */}
      <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div className="glass" style={{ padding: 18 }}>
          <div className="h2">Custom Website</div>
          <div className="p">
            Built by a real developer. Best for businesses that want full control, stronger branding,
            and room to grow.
          </div>

          <div className="hr" />

          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.80)" }}>
            <li><strong>✓</strong> Hand-built layout + sections</li>
            <li><strong>✓</strong> Booking, forms, payments</li>
            <li><strong>✓</strong> SEO + integrations available</li>
            <li><strong>✓</strong> Clear scope & revisions</li>
          </ul>

          <div className="small" style={{ marginTop: 12 }}>
            Typical projects: <strong>$450 – $1,500+</strong>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/build" className="btn btnPrimary">Start custom →</Link>
            <Link href="/estimate" className="btn btnGhost">See estimate</Link>
          </div>
        </div>

        <div className="card" style={{ padding: 18, border: "1px solid rgba(124,58,237,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div className="h2">AI Website Option</div>
              <div className="small">Fastest way to launch</div>
            </div>
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                background: "rgba(124,58,237,0.20)",
                border: "1px solid rgba(124,58,237,0.35)",
                fontWeight: 950,
                fontSize: 12,
              }}
            >
              ★ Popular
            </div>
          </div>

          <div className="p" style={{ marginTop: 6 }}>
            Great for MVPs, side-projects, and early-stage businesses. Generate a layout + content in
            minutes, then refine.
          </div>

          <div className="hr" />

          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.80)" }}>
            <li><strong>✓</strong> Industry-specific content</li>
            <li><strong>✓</strong> Goal-focused sections</li>
            <li><strong>✓</strong> Quick launch + upgrades later</li>
            <li><strong>✓</strong> Professional tone and structure</li>
          </ul>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/ai" className="btn btnPrimary">Try AI →</Link>
            <Link href="/estimate" className="btn btnGhost">Compare pricing</Link>
          </div>
        </div>
      </section>

      {/* PROOF / TRUST */}
      <section className="glass" style={{ padding: 18 }}>
        <div className="h2">How it works</div>
        <div className="grid2" style={{ marginTop: 12 }}>
          <Step n="01" title="Estimate" desc="Get a range based on pages + features." />
          <Step n="02" title="Scope check" desc="Quick call/message to confirm details." />
          <Step n="03" title="Build + review" desc="You get a link to review and request revisions." />
          <Step n="04" title="Launch" desc="We publish and hand off with next steps." />
        </div>

        <div className="hr" />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/estimate" className="btn btnPrimary">Get estimate →</Link>
          <Link href="/build" className="btn btnGhost">Start custom</Link>
          <Link href="/coming-soon" className="btn btnGhost">E-commerce support</Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ fontWeight: 950, marginBottom: 6 }}>{title}</div>
      <div className="small">{desc}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div className="kicker" style={{ marginBottom: 8 }}>{n}</div>
      <div style={{ fontWeight: 950, marginBottom: 6 }}>{title}</div>
      <div className="small">{desc}</div>
    </div>
  );
}