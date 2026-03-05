"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        Something went wrong
      </h1>
      <p className="p" style={{ marginBottom: 24, maxWidth: 480 }}>
        We hit an unexpected error. Please try again, or contact us if the
        problem persists.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn btnPrimary" onClick={reset}>
          Try Again
        </button>
        <a href="/" className="btn btnGhost">
          Back to Home
        </a>
      </div>
    </div>
  );
}
