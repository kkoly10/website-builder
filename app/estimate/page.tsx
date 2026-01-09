"use client";

import { useSearchParams } from "next/navigation";
import { calculatePrice } from "@/lib/pricing";

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
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        Project Estimate
      </h1>

      <p style={{ fontSize: 18, color: "#555" }}>
        Here is your estimated investment:
      </p>

      <h2 style={{ fontSize: 48, margin: "24px 0" }}>
        ${breakdown.total}
      </h2>

      <pre style={{ background: "#f7f7f7", padding: 16, borderRadius: 8 }}>
{JSON.stringify(breakdown, null, 2)}
      </pre>
    </main>
  );
}