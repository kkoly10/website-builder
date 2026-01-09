export default function AIExplainerPage() {
  return (
    <main style={{ maxWidth: 900, margin: "90px auto", padding: 24 }}>
      <h1 style={{ fontSize: 40, marginBottom: 16 }}>
        Not Ready for a Custom Website?
      </h1>

      <p style={{ fontSize: 20, color: "#555", marginBottom: 32 }}>
        Try our AI-Generated Website — a faster, more affordable way to launch
        a professional online presence.
      </p>

      {/* COMPARISON BLOCK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 48,
        }}
      >
        {/* CUSTOM */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3 style={{ marginBottom: 12 }}>Custom Website</h3>

          <ul style={{ lineHeight: 1.8, color: "#444" }}>
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
            border: "2px solid #000",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3 style={{ marginBottom: 12 }}>AI-Generated Website</h3>

          <ul style={{ lineHeight: 1.8, color: "#444" }}>
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
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 12 }}>Who Is This For?</h2>

        <ul style={{ lineHeight: 1.8, color: "#444" }}>
          <li>• Small businesses getting started</li>
          <li>• MVPs or validation projects</li>
          <li>• Budget-conscious founders</li>
          <li>• Anyone who wants to launch fast</li>
        </ul>
      </div>

      {/* CTA */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 12 }}>
          Ready to Try the AI Website Builder?
        </h2>

        <p style={{ color: "#555", marginBottom: 24 }}>
          Answer a few questions and we’ll generate a website tailored to your
          industry and goals.
        </p>

        <a
          href="/ai/builder"
          style={{
            display: "inline-block",
            padding: "14px 26px",
            background: "#000",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          Start AI Website Builder →
        </a>

        <div style={{ marginTop: 16 }}>
          <a href="/build" style={{ color: "#555", fontSize: 14 }}>
            Go back to custom quote
          </a>
        </div>
      </div>
    </main>
  );
}