"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePrice } from "@/lib/pricing";

export default function EstimatePage() {
  const params = useSearchParams();

  const data = {
    websiteType: params.get("websiteType") || "Business",
    pages: params.get("pages") || "3-5",
    booking: params.get("booking") === "true",
    payments: params.get("payments") === "true",
    blog: params.get("blog") === "true",
    design: params.get("design") || "Modern",
    timeline: params.get("timeline") || "4+ weeks",
  };

  const price = calculatePrice(data);

  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 38, marginBottom: 12 }}>
        Your Project Options
      </h1>

      <p style={{ color: "#555", fontSize: 17, maxWidth: 760 }}>
        Based on your answers, here are the best ways we can build your website.
        Choose the option that fits your goals and timeline.
      </p>

      {/* TIERS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginTop: 40,
        }}
      >
        {/* STANDARD */}
        <TierCard
          title="Standard Website Build"
          price="$450 – $600"
          badge="Most Small Businesses"
          highlight
          features={[
            "Up to 3–6 pages",
            "Mobile-responsive design",
            "Contact form or booking form",
            "Basic SEO structure",
            "Email notifications for forms",
            "Map embed & analytics",
          ]}
          revisions="2 revisions (50% & 90%)"
          automation="No automation"
          cta="/build"
          ctaText="Continue with Standard →"
        />

        {/* PROFESSIONAL */}
        <TierCard
          title="Professional Website Build"
          price="$750 – $1,000"
          badge="⭐ Most Popular"
          features={[
            "Up to 8 pages",
            "Enhanced layout & structure",
            "Booking + contact forms",
            "SEO titles & meta setup",
            "Email automation & confirmations",
            "Priority build queue",
          ]}
          revisions="4 revisions"
          automation="Email automation included"
          cta="/build"
          ctaText="Continue with Professional →"
        />

        {/* ADVANCED */}
        <TierCard
          title="Advanced / Growth Website"
          price="$1,500+"
          badge="Growth-Focused"
          features={[
            "10+ pages",
            "Custom layouts & features",
            "SEO foundation + tracking",
            "Marketing & analytics setup",
            "CRM & API integrations",
          ]}
          revisions="Unlimited revisions (within scope)"
          automation="Email automation + optional SMS add-on"
          cta="/build"
          ctaText="Request Advanced Build →"
        />
      </div>

      {/* DISCLAIMER */}
      <div
        style={{
          marginTop: 40,
          padding: 16,
          background: "#f9f9f9",
          border: "1px solid #eee",
          borderRadius: 12,
          fontSize: 14,
          color: "#555",
        }}
      >
        Third-party tools, APIs, analytics platforms, or SMS services may require
        separate accounts and usage fees.
      </div>

      <div style={{ marginTop: 40 }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

/* ---------------- COMPONENT ---------------- */

function TierCard({
  title,
  price,
  features,
  revisions,
  automation,
  cta,
  ctaText,
  badge,
  highlight,
}: any) {
  return (
    <div
      style={{
        border: highlight ? "2px solid #000" : "1px solid #ddd",
        borderRadius: 20,
        padding: 28,
        background: "#fff",
        position: "relative",
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: 20,
            background: "#000",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {badge}
        </div>
      )}

      <h3 style={{ fontSize: 22 }}>{title}</h3>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
        {price}
      </div>

      <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>
        {features.map((f: string) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <p style={{ marginTop: 16, fontWeight: 600 }}>
        Revisions: {revisions}
      </p>

      <p style={{ fontSize: 14, color: "#666" }}>
        Automation: {automation}
      </p>

      <Link
        href={cta}
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "12px 18px",
          borderRadius: 12,
          background: "#000",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {ctaText}
      </Link>
    </div>
  );
}
