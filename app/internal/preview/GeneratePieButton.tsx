"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GeneratePieButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.details || json?.error || "Failed to generate PIE");

      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn btnPrimary" onClick={run} disabled={loading}>
        {loading ? "Generating PIE..." : "Generate PIE →"}
      </button>
      {err ? <span style={{ color: "rgba(255,120,120,0.95)", fontWeight: 800 }}>{err}</span> : null}
    </div>
  );
}