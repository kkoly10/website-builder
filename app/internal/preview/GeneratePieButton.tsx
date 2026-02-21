// app/internal/preview/GeneratePieButton.tsx
"use client";

import { useState, useTransition } from "react";

export default function GeneratePieButton({ quoteId }: { quoteId: string }) {
  const [msg, setMsg] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const run = (mode: "generate" | "regenerate" = "generate") => {
    setMsg("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/internal/pie/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId, mode }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.ok === false) {
          setMsg(data?.error || `Request failed (${res.status})`);
          return;
        }

        setMsg("PIE generated. Refreshing...");
        setTimeout(() => window.location.reload(), 600);
      } catch (e: any) {
        setMsg(e?.message || "Failed to generate PIE");
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button
        type="button"
        className="btn btnPrimary"
        onClick={() => run("generate")}
        disabled={pending}
      >
        {pending ? "Generating..." : "Generate PIE now"}
      </button>

      <button
        type="button"
        className="btn btnGhost"
        onClick={() => run("regenerate")}
        disabled={pending}
      >
        Regenerate
      </button>

      {msg ? (
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
          {msg}
        </span>
      ) : null}
    </div>
  );
}