"use client";

// app/error.tsx
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio
      </div>

      <div style={{ height: 16 }} />

      <h1 className="h1">Something went wrong</h1>
      <p className="p" style={{ maxWidth: 500, margin: "12px auto 0" }}>
        An unexpected error occurred. Please try again or contact us if the problem persists.
      </p>

      <div style={{ height: 28 }} />

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={reset} className="btn btnPrimary">
          Try again
        </button>
        <a href="/" className="btn btnGhost">
          Back to home
        </a>
      </div>
    </main>
  );
}
