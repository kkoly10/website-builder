// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio
      </div>

      <div style={{ height: 16 }} />

      <h1 className="h1">Page not found</h1>
      <p className="p" style={{ maxWidth: 500, margin: "12px auto 0" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div style={{ height: 28 }} />

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn btnPrimary">
          Back to home <span className="btnArrow">&#8594;</span>
        </Link>
        <Link href="/contact" className="btn btnGhost">
          Contact us
        </Link>
      </div>
    </main>
  );
}
