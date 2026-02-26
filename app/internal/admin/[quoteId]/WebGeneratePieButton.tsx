"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WebGeneratePieButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/internal/pie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, force: true }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to generate PIE");
      
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={generate} disabled={loading} className="btn btnPrimary">
        {loading ? "Analyzing..." : "Generate / Refresh PIE →"}
      </button>
      
      {error && <span style={{ color: "#ffb4b4", fontSize: 13, fontWeight: 700 }}>{error}</span>}
    </div>
  );
}
