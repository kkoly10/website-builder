"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePrice, IntakeData } from "@/lib/pricing";

/* -------- SAFE PARSERS -------- */

function parseWebsiteType(v: string | null): IntakeData["websiteType"] {
  if (v === "Ecommerce") return "Ecommerce";
  if (v === "Portfolio") return "Portfolio";
  if (v === "Landing") return "Landing";
  return "Business";
}

function parsePages(v: string | null): IntakeData["pages"] {
  if (v === "1") return "1";
  if (v === "6-10") return "6-10";
  return "3-5";
}

function parseDesign(v: string | null): IntakeData["design"] {
  if (v === "Classic") return "Classic";
  if (v === "Creative") return "Creative";
  return "Modern";
}

function parseTimeline(v: string | null): IntakeData["timeline"] {
  if (v === "Under 14 days") return "Under 14 days";
  if (v === "2-3 weeks") return "2-3 weeks";
  return "4+ weeks";
}

/* -------- PAGE -------- */

export default function EstimateClient() {
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

  const recommended =
    price.total <= 600 ? "standard" :
    price.total <= 1000 ? "professional" :
    "advanced";

  return (
    <main style={{ maxWidth: 1200, margin: "80px auto", padding: 24 }}>
      {/* HEADER */}
      <section style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 40, marginBottom: 12 }}>
          Your Website Estimate
        </h1>
        <p style={{ fontSize: 18, color: "#555", maxWidth: 720 }}>
          Based on your project details, here’s a clear breakdown of your
          recommended build options. Final pricing depends on selected scope.
        </p>
      </section>

      {/* TIERS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32,
        }}
      >
        <Tier
          title="Standard Website"
          price="$450 – $600"
          highlight={recommended === "standard"}
          badge="Best for small businesses"
          features={[
            "Up to 3–6 pages",
            "Mobile-responsive design",
            "Contact or booking form",
            "Basic SEO structure",
            "2 revisions (50% & 90%)",
            "Email notifications + analytics",
          ]}
          cta="/build"
          ctaText="Proceed with Standard →"
        />

        <Tier
          title="Professional Website"
          price="$750 – $1,000"
          highlight={recommended === "professional"}
          badge="⭐ Most Popular"
          features={[
            "Up to 8 pages",
            "Enhanced layout & structure",
            "Booking + contact forms",
            "SEO titles & meta setup",
            "4 total revisions",
            "Email automation included",
          ]}
          cta="/build"
          ctaText="Choose Professional →"
        />

        <Tier
          title="Advanced / Growth"
          price="$1,500+"
          highlight={recommended === "advanced"}
          badge="Growth-focused"
          features={[
            "10+ pages",
            "Custom layouts & features",
            "SEO + marketing setup",
            "Advanced integrations",
            "Unlimited revisions (within scope)",
            "Optional SMS automation add-on",
          ]}
          cta="/build"
          ctaText="Request Advanced Build →"
        />
      </div>

      {/* WHY PRICE */}
      <section
        style={{
          marginTop: 64,
          padding: 32,
          background: "#f9f9f9",
          borderRadius: 16,
        }}
      >
        <h2 style={{ marginBottom: 12 }}>How we calculated this</h2>
        <ul style={{ lineHeight: 1.8, color: "#444", paddingLeft: 18 }}>
          <li>• Page count and feature requirements</li>
          <li>• Design complexity</li>
          <li>• Timeline urgency</li>
        </ul>
        <p style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
          Third-party tools, APIs, and messaging services may require separate
          accounts and usage fees.
        </p>
      </section>

      <div style={{ marginTop: 48 }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>
          ← Back to homepage
        </Link>
      </div>
    </main>
  );
}

/* -------- COMPONENT -------- */

function Tier({
  title,
  price,
  features,
  cta,
  ctaText,
  badge,
  highlight,
}: any) {
  return (
    <div
      style={{
        border: highlight ? "2px solid #000" : "1px solid #e5e5e5",
        borderRadius: 18,
        padding: 28,
        background: "#fff",
        position: "relative",
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: 20,
            background: "#000",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {badge}
        </div>
      )}

      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
        {price}
      </div>

      <ul style={{ lineHeight: 1.8, paddingLeft: 18 }}>
        {features.map((f: string) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <Link
        href={cta}
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "14px 22px",
          background: "#000",
          color: "#fff",
          borderRadius: 12,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {ctaText}
      </Link>
    </div>
  );
}