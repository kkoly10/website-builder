export default function AIExplainerPage() {
  return (
    <main style={{ maxWidth: 900, margin: "90px auto", padding: 24 }}>
      <h1>
        Not Ready for a Custom Website?
      </h1>

      <p style={{ fontSize: 20, color: "var(--muted)", marginBottom: 32 }}>
        Try our AI-Generated Website — a faster, more affordable way to launch
        a professional online presence.
      </p>

      {/* COMPARISON BLOCK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 24,
          marginBottom: 48,
        }}
      >
        {/* CUSTOM */}
        <div
          style={{
            border: "1px solid var(--rule)",
            borderRadius: 0,
            padding: 24,
          }}
        >
          <h3>Custom Website</h3>

          <ul style={{ lineHeight: 1.8, color: "var(--ink-2)" }}>
            <li>✔ Fully custom design</li>
            <li>✔ Human strategy & planning</li>
            <li>✔ Advanced features</li>
            <li>✔ Best for long-term growth</li>
          </ul>

          <p style={{ marginTop: 12, fontWeight: 600 }}>
            Higher investment
          </p>
        </div>

        {/* AI */}
        <div
          style={{
            border: "2px solid var(--ink)",
            borderRadius: 0,
            padding: 24,
          }}
        >
          <h3>AI-Generated Website</h3>

          <ul style={{ lineHeight: 1.8, color: "var(--ink-2)" }}>
            <li>✔ Industry-specific content</li>
            <li>✔ Goal-focused layout</li>
            <li>✔ Launch in minutes</li>
            <li>✔ Upgrade anytime</li>
          </ul>

          <p style={{ marginTop: 12, fontWeight: 600 }}>
            Starting at a lower cost
          </p>
        </div>
      </div>

      {/* WHY IT WORKS */}
      <div>
        <h2>Who Is This For?</h2>

        <ul style={{ lineHeight: 1.8, color: "var(--ink-2)" }}>
          <li>• Small businesses getting started</li>
          <li>• MVPs or validation projects</li>
          <li>• Budget-conscious founders</li>
          <li>• Anyone who wants to launch fast</li>
        </ul>
      </div>

      {/* CTA */}
      <div
        style={{
          border: "1px solid var(--rule)",
          borderRadius: 0,
          padding: 24,
          textAlign: "center",
        }}
      >
        <h2>
          Ready to Try the AI Website Builder?
        </h2>

        <p>
          Answer a few questions and we’ll generate a website tailored to your
          industry and goals.
        </p>

        <a
          href="/ai/builder"
          style={{
            display: "inline-block",
            padding: "14px 26px",
            background: "var(--ink)",
            color: "#fff",
            borderRadius: 0,
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          Start AI Website Builder →
        </a>

        <div>
          <a href="/build" style={{ color: "var(--muted)", fontSize: 14 }}>
            Go back to custom quote
          </a>
        </div>
      </div>
    </main>
  );
}
