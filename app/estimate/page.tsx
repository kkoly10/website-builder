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
    email: params.get("email") || "",
  };

  const price = calculatePrice(data);

  return (
    <main style={{ maxWidth: 800, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        Your Project Estimate
      </h1>

      <p style={{ fontSize: 18, color: "#555" }}>
        Based on your selections, your estimated investment is:
      </p>

      <h2 style={{ fontSize: 52, margin: "28px 0" }}>
        ${price}
      </h2>

      <p style={{ color: "#666", maxWidth: 600 }}>
        This estimate reflects your project scope and timeline.
        Final pricing may adjust slightly after review.
      </p>

      {data.email && (
        <p style={{ marginTop: 16, color: "#444" }}>
          Estimate prepared for <strong>{data.email}</strong>
        </p>
      )}

      <button
        style={{
          marginTop: 36,
          padding: "14px 22px",
          background: "#000",
          color: "#fff",
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        Book a Call
      </button>
    </main>
  );
}