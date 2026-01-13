"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { calculatePrice } from "../../lib/pricing";

export default function EstimateClient() {
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

  const [email, setEmail] = useState("");
  const [locked, setLocked] = useState(false);

  function handleLock() {
    if (!email) {
      alert("Please enter your email to continue.");
      return;
    }
    setLocked(true);
  }

  return (
    <main style={{ maxWidth: 900, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 38, marginBottom: 10 }}>Your Website Estimate</h1>

      <p style={{ fontSize: 18, color: "#555", marginBottom: 32 }}>
        Based on your selections, here’s a transparent breakdown of your project.
      </p>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Project Cost Breakdown</h3>

        <Row label="Base website" value={breakdown.basePrice} />
        {breakdown.pageAddOn > 0 && <Row label="Additional pages" value={breakdown.pageAddOn} />}
        {breakdown.featureAddOn > 0 && (
          <Row label="Features & functionality" value={breakdown.featureAddOn} />
        )}
        {breakdown.designMultiplier > 1 && (
          <Row label="Design complexity" value={`${breakdown.designMultiplier}×`} isText />
        )}
        {breakdown.rushFeeAmount > 0 && <Row label="Rush timeline" value={breakdown.rushFeeAmount} />}

        <hr style={{ margin: "20px 0" }} />

        <Row label="Total Estimated Investment" value={breakdown.total} bold large />
      </div>

      {/* Conversion-saver block */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 18,
          marginBottom: 24,
          background: "#fafafa",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Not ready for a custom build budget?
        </div>
        <div style={{ color: "#555", marginBottom: 12 }}>
          Try our AI-Generated Website — faster and much cheaper. You can upgrade anytime.
        </div>

        <a
          href="/ai"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            background: "#000",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Try AI Website →
        </a>
      </div>

      {!locked ? (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <h3 style={{ marginBottom: 10 }}>Get this estimate sent to your email</h3>

          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          <button
            onClick={handleLock}
            style={{
              padding: "14px 24px",
              background: "#000",
              color: "#fff",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Continue →
          </button>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #bbf7d0",
            background: "#ecfdf5",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3>Estimate Locked In ✅</h3>
          <p style={{ marginTop: 8 }}>
            This estimate has been prepared for <strong>{email}</strong>.
          </p>

          <button
            style={{
              marginTop: 20,
              padding: "14px 24px",
              background: "#000",
              color: "#fff",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Book a Call
          </button>
        </div>
      )}
    </main>
  );
}

function Row({
  label,
  value,
  bold,
  large,
  isText,
}: {
  label: string;
  value: number | string;
  bold?: boolean;
  large?: boolean;
  isText?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: large ? 22 : 16,
        fontWeight: bold ? 600 : 400,
        marginBottom: 8,
      }}
    >
      <span>{label}</span>
      <span>{isText ? value : `$${value}`}</span>
    </div>
  );
}
