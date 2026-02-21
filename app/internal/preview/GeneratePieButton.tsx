// app/internal/preview/GeneratePieButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GeneratePieButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/internal/pie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setError(json?.error || "Failed to generate PIE report.");
        return;
      }

      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to generate PIE report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button
        onClick={onGenerate}
        disabled={loading}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.05)",
          color: "inherit",
          fontWeight: 700,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Generating..." : "Generate PIE now"}
      </button>
      {error ? (
        <div style={{ fontSize: 12, color: "#fca5a5", maxWidth: 300, textAlign: "right" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}