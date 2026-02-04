import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      {/* HERO */}
      <section style={{ marginBottom: 80 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: -0.8,
            marginBottom: 16,
          }}
        >
          Professional Websites, Built With a Clear Process
        </h1>

        <p
          style={{
            fontSize: 20,
            lineHeight: 1.6,
            color: "#444",
            maxWidth: 720,
          }}
        >
          We design and build modern websites for businesses using a guided
          process with transparent pricing, milestones, and revisions — so you
          always know what to expect.
        </p>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link
            href="/build"
            style={{
              padding: "14px 22px",
              background: "#000",
              color: "#fff",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Start Your Project →
          </Link>

          <a
            href="#how-it-works"
            style={{
              padding: "14px 22px",
              border: "1px solid #ddd",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 600,
              color: "#000",
            }}
          >
            How It Works
          </a>
        </div>
      </section>

      {/* TRUST / VALUE */}
      <section style={{ marginBottom: 80 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
          }}
        >
          {[
            {
              title: "Clear Pricing",
              desc: "Answer a few questions and receive an estimate based on your actual needs — not guesswork.",
            },
            {
              title: "Milestone-Based Work",
              desc: "Projects are broken into stages with approvals and payments tied to progress.",
            },
            {
              title: "Revision Control",
              desc: "Defined revision rounds keep projects focused, efficient, and on schedule.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                border: "1px solid #eee",
                borderRadius: 16,
                padding: 24,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: 18 }}>{item.title}</h3>
              <p style={{ color: "#555", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 32, marginBottom: 24 }}>
          How the Process Works
        </h2>

        <ol
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
            paddingLeft: 0,
            listStyle: "none",
          }}
        >
          {[
            {
              step: "1",
              title: "Answer Guided Questions",
              desc: "Tell us what you’re building, how many pages you need, and your timeline.",
            },
            {
              step: "2",
              title: "Receive an Estimate",
              desc: "We calculate pricing based on scope, features, and design complexity.",
            },
            {
              step: "3",
              title: "Build With Milestones",
              desc: "We design, review, revise, and launch — all tracked through a dashboard.",
            },
          ].map((s) => (
            <li
              key={s.step}
              style={{
                border: "1px solid #eee",
                borderRadius: 16,
                padding: 24,
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#666",
                  marginBottom: 8,
                }}
              >
                STEP {s.step}
              </div>
              <h3 style={{ marginTop: 0 }}>{s.title}</h3>
              <p style={{ color: "#555", lineHeight: 1.6 }}>{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 20,
          padding: 40,
          background: "#fff",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>
          Ready to Build Your Website?
        </h2>
        <p style={{ color: "#555", fontSize: 16 }}>
          Start with a few questions and get a tailored estimate.
        </p>

        <Link
          href="/build"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "14px 26px",
            background: "#000",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Start Project →
        </Link>
      </section>
    </main>
  );
}
