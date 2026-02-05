import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      {/* HERO */}
      <section style={{ marginBottom: 80 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          Professional Websites, Built the Right Way
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "#555",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Get a modern, conversion-focused website with transparent pricing,
          clear revisions, and zero surprises. Choose a fully custom build or
          launch faster with our AI-assisted option.
        </p>

        <div style={{ marginTop: 36, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/build" style={primaryBtn}>
            Start a Custom Website →
          </Link>

          <Link href="/ai" style={secondaryBtn}>
            Try AI Website Option
          </Link>
        </div>
      </section>

      {/* OPTIONS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32,
          marginBottom: 80,
        }}
      >
        {/* CUSTOM */}
        <div style={card}>
          <h2 style={{ marginBottom: 12 }}>Custom Website</h2>
          <p style={mutedText}>
            Built by a real developer. Best for businesses that want full
            control, stronger branding, and room to grow.
          </p>

          <ul style={list}>
            <li>✔ Hand-built design</li>
            <li>✔ Clear scope & revisions</li>
            <li>✔ Booking, forms, payments</li>
            <li>✔ SEO & integrations available</li>
          </ul>

          <p style={{ fontWeight: 600, marginTop: 12 }}>
            Typical projects: $450 – $1,500+
          </p>

          <Link href="/build" style={{ ...primaryBtn, marginTop: 16 }}>
            Get Custom Quote →
          </Link>
        </div>

        {/* AI */}
        <div style={{ ...card, border: "2px solid #000" }}>
          <h2 style={{ marginBottom: 12 }}>AI-Generated Website</h2>
          <p style={mutedText}>
            A faster, lower-cost way to launch online. Ideal for MVPs,
            side-projects, and early-stage businesses.
          </p>

          <ul style={list}>
            <li>✔ Industry-specific content</li>
            <li>✔ Goal-focused layout</li>
            <li>✔ Launch in minutes</li>
            <li>✔ Upgrade to custom anytime</li>
          </ul>

          <p style={{ fontWeight: 600, marginTop: 12 }}>
            Lower cost · Faster launch
          </p>

          <Link href="/ai" style={{ ...secondaryBtn, marginTop: 16 }}>
            Explore AI Option →
          </Link>
        </div>
      </section>

      {/* WHY US */}
      <section style={{ maxWidth: 900 }}>
        <h2 style={{ marginBottom: 16 }}>Why Work With Us</h2>

        <ul style={{ ...list, color: "#444" }}>
          <li>• Transparent pricing — no hidden fees</li>
          <li>• Clear revision limits to avoid disputes</li>
          <li>• Modern tech stack, fast loading sites</li>
          <li>• Human support — not just software</li>
        </ul>
      </section>
    </main>
  );
}

/* ---------------- STYLES ---------------- */

const primaryBtn = {
  display: "inline-block",
  padding: "14px 26px",
  background: "#000",
  color: "#fff",
  borderRadius: 12,
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 600,
};

const secondaryBtn = {
  display: "inline-block",
  padding: "14px 26px",
  border: "1px solid #000",
  color: "#000",
  borderRadius: 12,
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 600,
};

const card = {
  border: "1px solid #e5e5e5",
  borderRadius: 16,
  padding: 28,
  background: "#fff",
};

const mutedText = {
  color: "#555",
  lineHeight: 1.6,
};

const list = {
  marginTop: 16,
  lineHeight: 1.8,
  paddingLeft: 18,
};