"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePrice, IntakeData } from "@/lib/pricing";

/* ---------- SAFE PARSERS ---------- */

function parseWebsiteType(value: string | null): IntakeData["websiteType"] {
  if (value === "Ecommerce") return "Ecommerce";
  if (value === "Portfolio") return "Portfolio";
  if (value === "Landing") return "Landing";
  return "Business";
}

function parsePages(value: string | null): IntakeData["pages"] {
  if (value === "1") return "1";
  if (value === "6-10") return "6-10";
  return "3-5";
}

function parseDesign(value: string | null): IntakeData["design"] {
  if (value === "Classic") return "Classic";
  if (value === "Creative") return "Creative";
  return "Modern";
}

function parseTimeline(value: string | null): IntakeData["timeline"] {
  if (value === "2-3 weeks") return "2-3 weeks";
  if (value === "Under 14 days") return "Under 14 days";
  return "4+ weeks";
}

/* ---------- PAGE ---------- */

export default function EstimatePage() {
  const params = useSearchParams();

  const data: IntakeData = {
    websiteType: parseWebsiteType(params.get("websiteType")),
    pages: parsePages(params.get("pages")),
    booking: params.get("booking") === "true",
    payments: params.get("payments") === "true",
    blog: params.get("blog") === "true",
    design: parseDesign(params.get("design")),
    timeline: parseTimeline(params.get("timeline")),
  };

  const price = calculatePrice(data);

  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        Your Project Estimate
      </h1>

      <p style={{ color: "#555", marginBottom: 32 }}>
        Based on your answers, here is a recommended pricing range and build
        structure.
      </p>

      <pre
        style={{
          background: "#f7f7f7",
          padding: 20,
          borderRadius: 12,
          fontSize: 14,
        }}
      >
        {JSON.stringify(price, null, 2)}
      </pre>

      <div style={{ marginTop: 32 }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
