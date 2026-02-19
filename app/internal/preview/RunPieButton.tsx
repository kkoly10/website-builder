"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunPieButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function run() {
    setErr("");
    setStatus("running");
    try {
      const res = await fetch("/api/run-pie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to run PIE.");

      setStatus("done");
      router.refresh();
    } catch (e: any) {
      setStatus("error");
      setErr(e?.message || "Failed to run PIE.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {status === "error" && (
        <div style={{ color: "#b00", fontWeight: 700 }}>{err}</div>
      )}

      <button
        type="button"
        onClick={run}
        disabled={status === "running"}
        style={{
          border: "1px solid rgba(0,0,0,0.15)",
          borderRadius: 10,
          padding: "10px 12px",
          fontWeight: 800,
          cursor: status === "running" ? "not-allowed" : "pointer",
          background: "white",
        }}
      >
        {status === "running" ? "Generating PIE..." : "Generate PIE report"}
      </button>
    </div>
  );
}