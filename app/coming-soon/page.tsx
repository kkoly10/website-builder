"use client";

import { useMemo, useState } from "react";
import { getEcomInterestEndpoint } from "../../lib/forms";

type SellerType =
  | "Amazon seller"
  | "Shopify store owner"
  | "eBay seller"
  | "Planning to sell online"
  | "Just curious";

type InterestOption =
  | "Inventory storage"
  | "Order fulfillment"
  | "Marketplace management"
  | "Website + e-commerce setup"
  | "Not sure yet";

type VolumeOption =
  | "Not selling yet"
  | "Under 100 orders / month"
  | "100–500 orders / month"
  | "500+ orders / month";

export default function ComingSoonPage() {
  const endpoint = useMemo(() => getEcomInterestEndpoint(), []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [sellerType, setSellerType] = useState<SellerType>("Planning to sell online");
  const [interests, setInterests] = useState<InterestOption[]>([]);
  const [volume, setVolume] = useState<VolumeOption>("Not selling yet");

  function toggleInterest(v: InterestOption) {
    setInterests((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!endpoint) {
      setError(
        "Missing form endpoint. Add NEXT_PUBLIC_ECOM_INTEREST_FORM_ENDPOINT in Vercel Environment Variables."
      );
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          seller_type: sellerType,
          interests: interests.length ? interests.join(", ") : "—",
          monthly_order_volume: volume,
          source: "coming-soon-page",
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          "Submission failed. Please try again or email us directly.";
        throw new Error(msg);
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: "60px auto", padding: 24 }}>
      <a href="/" style={{ color: "#6B7280", textDecoration: "none", fontWeight: 700 }}>
        ← Back to home
      </a>

      <h1 style={{ marginTop: 16, fontSize: 38, letterSpacing: -0.6, color: "#111827" }}>
        E-Commerce Support <span style={{ color: "#6B7280" }}>(Coming Later)</span>
      </h1>

      <p style={{ color: "#374151", fontSize: 16, lineHeight: 1.6, marginTop: 10 }}>
        We’re exploring additional support services for online sellers — including fulfillment and
        marketplace operations.
        <br />
        <strong>This is not live yet.</strong> We’re currently focused on website projects.
      </p>

      <p style={{ color: "#374151", fontSize: 16, lineHeight: 1.6 }}>
        If this is something you’d be interested in, join our early-interest list below. There’s no
        commitment — this simply helps us understand demand.
      </p>

      <section
        style={{
          marginTop: 22,
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: 18,
          background: "#fff",
        }}
      >
        {submitted ? (
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>✅ You’re on the list</h2>
            <p style={{ marginTop: 10, color: "#374151", lineHeight: 1.6 }}>
              Thanks — your interest has been noted.
              <br />
              This service isn’t available yet, but we’ll reach out if we move forward or open early
              pilots.
            </p>
            <a
              href="/"
              style={{
                display: "inline-flex",
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                textDecoration: "none",
                fontWeight: 800,
                color: "#111827",
                background: "#F9FAFB",
              }}
            >
              Back to home
            </a>
          </div>
        ) : (
          <>
            <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>Join Early Interest</h2>
            <p style={{ marginTop: 8, color: "#6B7280", fontSize: 13 }}>
              No obligation · No sales emails · We’ll only reach out if this moves forward.
            </p>

            <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 14 }}>
              <Field label="Email address *">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@email.com"
                  style={input}
                  required
                />
              </Field>

              <Field label="What best describes you? *">
                <div style={grid2}>
                  {(
                    [
                      "Amazon seller",
                      "Shopify store owner",
                      "eBay seller",
                      "Planning to sell online",
                      "Just curious",
                    ] as SellerType[]
                  ).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSellerType(opt)}
                      style={pill(sellerType === opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="What would you be most interested in? (optional)">
                <div style={grid2}>
                  {(
                    [
                      "Inventory storage",
                      "Order fulfillment",
                      "Marketplace management",
                      "Website + e-commerce setup",
                      "Not sure yet",
                    ] as InterestOption[]
                  ).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleInterest(opt)}
                      style={pill(interests.includes(opt))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 6, color: "#9CA3AF", fontSize: 12 }}>
                  Tip: pick one or more.
                </div>
              </Field>

              <Field label="Monthly order volume (optional)">
                <select
                  value={volume}
                  onChange={(e) => setVolume(e.target.value as VolumeOption)}
                  style={input}
                >
                  <option>Not selling yet</option>
                  <option>Under 100 orders / month</option>
                  <option>100–500 orders / month</option>
                  <option>500+ orders / month</option>
                </select>
              </Field>

              {error ? (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 900,
                  border: "1px solid #111827",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Join Early Interest"}
              </button>

              <div style={{ color: "#9CA3AF", fontSize: 12 }}>
                By submitting, you agree to be contacted if we launch or pilot this service.
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{label}</span>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#fff",
  outline: "none",
  fontSize: 14,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

function pill(active: boolean): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: active ? "1px solid #111827" : "1px solid #E5E7EB",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#111827",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
  };
}