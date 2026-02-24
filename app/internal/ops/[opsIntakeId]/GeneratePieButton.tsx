// app/internal/ops/[opsIntakeId]/GeneratePieButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GeneratePieButton({ opsIntakeId }: { opsIntakeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/internal/ops/generate-pie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId, force: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to generate PIE report");
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PIE report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          border: "1px solid rgba(255,255,255,0.18)",
          background: loading ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
          color: "white",
          borderRadius: 10,
          padding: "10px 12px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "Generating PIE..." : "Generate / Regenerate PIE Report"}
      </button>

      {error ? (
        <div
          style={{
            borderRadius: 10,
            padding: 10,
            border: "1px solid rgba(255,80,80,0.35)",
            background: "rgba(255,80,80,0.08)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
