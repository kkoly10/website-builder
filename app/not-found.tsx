import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 className="h1" style={{ marginBottom: 12 }}>
        404 — Page not found
      </h1>
      <p className="p" style={{ marginBottom: 24, maxWidth: 480 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/" className="btn btnPrimary">
          Back to Home
        </Link>
        <Link href="/contact" className="btn btnGhost">
          Contact Us
        </Link>
      </div>
    </div>
  );
}
