"use client";

import Link from "next/link";

export default function EstimateClient() {
  return (
    <main style={container}>
      {/* HEADER */}
      <header style={{ marginBottom: 48 }}>
        <h1 style={title}>Your Website Options</h1>
        <p style={subtitle}>
          Based on your answers, here are the best ways we can build your website.
          Choose the option that fits your goals and budget.
        </p>
      </header>

      {/* PRICING TIERS */}
      <section style={grid}>
        {/* STANDARD */}
        <PricingCard
          title="Standard Website"
          price="$450 – $600"
          badge="Best for small businesses"
          features={[
            "3–6 pages",
            "Mobile-responsive design",
            "Contact form or booking form",
            "Basic SEO structure",
            "Email notifications",
          ]}
          revisions="2 revisions (50% & 90%)"
          automation="No automation"
          cta="Continue with Standard →"
        />

        {/* PROFESSIONAL */}
        <PricingCard
          title="Professional Website"
          price="$750 – $1,000"
          badge="⭐ Most Popular"
          highlight
          features={[
            "Up to 8 pages",
            "Booking + contact forms",
            "SEO titles & meta setup",
            "Email automation",
            "Priority build queue",
          ]}
          revisions="4 revisions"
          automation="Email automation included"
          cta="Continue with Professional →"
        />

        {/* ADVANCED */}
        <PricingCard
          title="Advanced / Growth Website"
          price="$1,500+"
          badge="For scaling businesses"
          features={[
            "10+ pages",
            "Advanced SEO & analytics",
            "Integrations & APIs",
            "Marketing setup",
            "Upgrade paths supported",
          ]}
          revisions="Unlimited revisions (within scope)"
          automation="Email automation + optional SMS add-on"
          cta="Request Advanced Build →"
        />
      </section>

      {/* DISCLAIMER */}
      <section style={disclaimer}>
        <p>
          Third-party tools, APIs, analytics platforms, and SMS services may
          require separate accounts and usage fees. SMS automation is available
          only as an optional add-on for Advanced projects.
        </p>
      </section>

      <div style={{ marginTop: 40 }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

/* ---------- COMPONENTS ---------- */

function PricingCard({
  title,
  price,
  features,
  revisions,
  automation,
  cta,
  badge,
  highlight,
}: any) {
  return (
    <div
      style={{
        ...card,
        border: highlight ? "2px solid #000" : "1px solid #e5e5e5",
      }}
    >
      {badge && <div style={badgeStyle}>{badge}</div>}

      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <div style={priceStyle}>{price}</div>

      <ul style={list}>
        {features.map((f: string) => (
          <li key={f}>✔ {f}</li>
        ))}
      </ul>

      <p style={meta}>
        <strong>Revisions:</strong> {revisions}
      </p>
      <p style={meta}>
        <strong>Automation:</strong> {automation}
      </p>

      <button style={primaryBtn}>{cta}</button>
    </div>
  );
}

/* ---------- STYLES ---------- */

const container = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "80px 24px",
};

const title = {
  fontSize: 40,
  fontWeight: 700,
  marginBottom: 12,
};

const subtitle = {
  fontSize: 18,
  color: "#555",
  maxWidth: 720,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 32,
};

const card = {
  background: "#fff",
  borderRadius: 20,
  padding: 32,
};

const badgeStyle = {
  display: "inline-block",
  background: "#000",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 12,
};

const priceStyle = {
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 16,
};

const list = {
  lineHeight: 1.8,
  paddingLeft: 0,
  listStyle: "none",
};

const meta = {
  fontSize: 14,
  color: "#555",
  marginTop: 12,
};

const primaryBtn = {
  marginTop: 20,
  padding: "14px 22px",
  background: "#000",
  color: "#fff",
  borderRadius: 12,
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

const disclaimer = {
  marginTop: 48,
  fontSize: 14,
  color: "#555",
  background: "#f9f9f9",
  padding: 20,
  borderRadius: 12,
};