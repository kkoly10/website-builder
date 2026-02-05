import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 42, fontWeight: 600, marginBottom: 12 }}>
        Website Project Builder
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, color: "#444" }}>
        Get a clear, transparent website quote in minutes — no calls required.
        Choose a build option that fits your goals and budget.
      </p>

      <Link
        href="/build"
        style={{
          display: "inline-block",
          marginTop: 32,
          padding: "14px 22px",
          background: "#000",
          color: "#fff",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 16,
        }}
      >
        Start Your Project →
      </Link>
    </main>
  );
}
