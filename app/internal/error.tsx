"use client";

export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="cardInner">
        <div className="kicker">
          <span className="kickerDot" /> Admin error
        </div>
        <h2 className="h2" style={{ marginTop: 10 }}>Something went wrong</h2>
        <p className="pDark" style={{ marginTop: 8 }}>
          {error?.message || "An unexpected error occurred loading this admin page."}
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button onClick={reset} className="btn btnPrimary">Try again</button>
        </div>
      </div>
    </section>
  );
}
