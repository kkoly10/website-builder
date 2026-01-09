"use client";

import { useSearchParams } from "next/navigation";
import { calculatePrice } from "../../lib/pricing";

export default function EstimatePage() {
  const params = useSearchParams();

  const data = {
    websiteType: params.get("websiteType") as any,
    pages: params.get("pages") as any,
    booking: params.get("booking") === "true",
    payments: params.get("payments") === "true",
    blog: params.get("blog") === "true",
    design: params.get("design") as any,
    timeline: params.get("timeline") as any,
  };

  const breakdown = calculatePrice(data);

  return (
    <main style={{ maxWidth: 800, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 32 }}>Estimate Page Loaded ✅</h1>

      <p style={{ marginBottom: 20 }}>
        If you see this page, routing and imports are working.
      </p>

      <pre
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 8,
        }}
      >
        {JSON.stringify(breakdown, null, 2)}
      </pre>
    </main>
  );
}