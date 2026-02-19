// app/internal/preview/GeneratePieButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GeneratePieButton({
  quoteId,
  hasPie,
}: {
  quoteId: string;
  hasPie: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/internal/generate-pie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to generate PIE");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Failed to generate PIE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        className={`btn ${hasPie ? "btnGhost" : "btnPrimary"}`}
        type="button"
        onClick={run}
        disabled={loading}
        title={hasPie ? "Regenerate PIE (creates a new row)" : "Generate PIE"}
      >
        {loading ? "Generating..." : hasPie ? "Regenerate PIE report" : "Generate PIE report"}{" "}
        <span className="btnArrow">→</span>
      </button>
      {err ? (
        <div className="smallNote" style={{ color: "rgba(255,120,120,0.9)" }}>
          {err}
        </div>
      ) : null}
    </div>
  );
}