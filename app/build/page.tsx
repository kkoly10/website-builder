"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function BuildPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    websiteType: "Business",
    pages: "3-5",
    booking: false,
    payments: false,
    blog: false,
    design: "Modern",
    timeline: "2-3 weeks",
    referenceWebsite: "",
    hasLogo: "Yes",
    hasContent: "Yes",
    notes: "",
  });

  function next() {
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function submit() {
    const params = new URLSearchParams(form as any).toString();
    router.push(`/estimate?${params}`);
  }

  return (
    <main style={container}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={title}>Custom Website Project</h1>
        <p style={subtitle}>
          Step {step} of 4 — answer a few questions so we can recommend the best
          build option for your needs.
        </p>
      </header>

      <section style={card}>
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2 style={sectionTitle}>Project Scope</h2>

            <Field label="Website type">
              <select
                value={form.websiteType}
                onChange={(e) =>
                  setForm({ ...form, websiteType: e.target.value })
                }
              >
                <option>Business</option>
                <option>Portfolio</option>
                <option>Landing</option>
                <option>Ecommerce</option>
              </select>
            </Field>

            <Field label="Estimated number of pages">
              <select
                value={form.pages}
                onChange={(e) => setForm({ ...form, pages: e.target.value })}
              >
                <option value="1">1</option>
                <option value="3-5">3–5</option>
                <option value="6-10">6–10</option>
              </select>
            </Field>

            <Field label="Key features">
              <Checkbox
                label="Booking / appointments"
                checked={form.booking}
                onChange={(v) => setForm({ ...form, booking: v })}
              />
              <Checkbox
                label="Payments / checkout"
                checked={form.payments}
                onChange={(v) => setForm({ ...form, payments: v })}
              />
              <Checkbox
                label="Blog / articles"
                checked={form.blog}
                onChange={(v) => setForm({ ...form, blog: v })}
              />
            </Field>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h2 style={sectionTitle}>Design & Timeline</h2>

            <Field label="Design preference">
              <select
                value={form.design}
                onChange={(e) => setForm({ ...form, design: e.target.value })}
              >
                <option>Modern</option>
                <option>Classic</option>
                <option>Creative</option>
              </select>
            </Field>

            <Field label="Desired timeline">
              <select
                value={form.timeline}
                onChange={(e) =>
                  setForm({ ...form, timeline: e.target.value })
                }
              >
                <option>2-3 weeks</option>
                <option>4+ weeks</option>
                <option>Under 14 days</option>
              </select>
            </Field>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h2 style={sectionTitle}>Project Readiness</h2>

            <Field label="Reference website (optional)">
              <input
                placeholder="https://example.com"
                value={form.referenceWebsite}
                onChange={(e) =>
                  setForm({ ...form, referenceWebsite: e.target.value })
                }
              />
            </Field>

            <Field label="Do you have a logo?">
              <select
                value={form.hasLogo}
                onChange={(e) =>
                  setForm({ ...form, hasLogo: e.target.value })
                }
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>

            <Field label="Do you have website text & images ready?">
              <select
                value={form.hasContent}
                onChange={(e) =>
                  setForm({ ...form, hasContent: e.target.value })
                }
              >
                <option>Yes</option>
                <option>No (I’ll need help)</option>
              </select>
            </Field>

            <Field label="Anything else we should know? (optional)">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <>
            <h2 style={sectionTitle}>Review & Continue</h2>
            <p style={{ color: "#555" }}>
              We’ll now generate clear pricing options based on your answers.
            </p>
          </>
        )}
      </section>

      {/* NAV */}
      <div style={nav}>
        {step > 1 && (
          <button onClick={back} style={secondaryBtn}>
            Back
          </button>
        )}

        {step < 4 && (
          <button onClick={next} style={primaryBtn}>
            Next →
          </button>
        )}

        {step === 4 && (
          <button onClick={submit} style={primaryBtn}>
            View Pricing →
          </button>
        )}
      </div>
    </main>
  );
}

/* ---------- UI HELPERS ---------- */

function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: any) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginRight: 8 }}
      />
      {label}
    </label>
  );
}

/* ---------- STYLES ---------- */

const container = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "80px 24px",
};

const title = {
  fontSize: 36,
  fontWeight: 700,
  marginBottom: 8,
};

const subtitle = {
  color: "#555",
  fontSize: 16,
};

const card = {
  background: "#fff",
  borderRadius: 20,
  padding: 32,
  border: "1px solid #e5e5e5",
};

const sectionTitle = {
  fontSize: 22,
  marginBottom: 20,
};

const nav = {
  marginTop: 32,
  display: "flex",
  gap: 12,
};

const primaryBtn = {
  padding: "14px 26px",
  background: "#000",
  color: "#fff",
  borderRadius: 12,
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "14px 26px",
  background: "#fff",
  color: "#000",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 600,
  cursor: "pointer",
};