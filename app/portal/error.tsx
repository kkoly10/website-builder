"use client";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <section className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" /> Portal error
          </div>
          <h2 className="h2" style={{ marginTop: 10 }}>Something went wrong</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            We couldn&apos;t load this page. Try refreshing, or go back to your portal.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={reset} className="btn btnPrimary">Try again</button>
            <a href="/portal" className="btn btnGhost">Back to portal</a>
          </div>
        </div>
      </section>
    </main>
  );
}
