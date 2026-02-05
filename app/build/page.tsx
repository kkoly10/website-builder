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
    <main style={{ maxWidth: 900, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        Custom Website Project
      </h1>

      <p style={{ color: "#555", marginBottom: 32 }}>
        Step {step} of 4 — help us understand your project so we can recommend the
        right build.
      </p>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <h3>Project Scope</h3>

          <label>Website type</label>
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

          <label style={{ marginTop: 12 }}>Estimated pages</label>
          <select
            value={form.pages}
            onChange={(e) => setForm({ ...form, pages: e.target.value })}
          >
            <option value="1">1</option>
            <option value="3-5">3–5</option>
            <option value="6-10">6–10</option>
          </select>

          <label style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={form.booking}
              onChange={(e) =>
                setForm({ ...form, booking: e.target.checked })
              }
            />{" "}
            Booking / appointments
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.payments}
              onChange={(e) =>
                setForm({ ...form, payments: e.target.checked })
              }
            />{" "}
            Payments / checkout
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.blog}
              onChange={(e) =>
                setForm({ ...form, blog: e.target.checked })
              }
            />{" "}
            Blog / articles
          </label>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <h3>Design & Timeline</h3>

          <label>Design preference</label>
          <select
            value={form.design}
            onChange={(e) => setForm({ ...form, design: e.target.value })}
          >
            <option>Modern</option>
            <option>Classic</option>
            <option>Creative</option>
          </select>

          <label style={{ marginTop: 12 }}>Timeline</label>
          <select
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
          >
            <option>2-3 weeks</option>
            <option>4+ weeks</option>
            <option>Under 14 days</option>
          </select>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <h3>Project Readiness</h3>

          <label>Reference website (optional)</label>
          <input
            placeholder="https://example.com"
            value={form.referenceWebsite}
            onChange={(e) =>
              setForm({ ...form, referenceWebsite: e.target.value })
            }
          />

          <label style={{ marginTop: 12 }}>Do you have a logo?</label>
          <select
            value={form.hasLogo}
            onChange={(e) => setForm({ ...form, hasLogo: e.target.value })}
          >
            <option>Yes</option>
            <option>No</option>
          </select>

          <label style={{ marginTop: 12 }}>
            Do you have website text & images ready?
          </label>
          <select
            value={form.hasContent}
            onChange={(e) =>
              setForm({ ...form, hasContent: e.target.value })
            }
          >
            <option>Yes</option>
            <option>No (I need help)</option>
          </select>

          <label style={{ marginTop: 12 }}>Notes (optional)</label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <>
          <h3>Review & Continue</h3>
          <p style={{ color: "#555" }}>
            We’ll now generate clear pricing options based on your answers.
          </p>
        </>
      )}

      <div style={{ marginTop: 32 }}>
        {step > 1 && (
          <button onClick={back} style={{ marginRight: 12 }}>
            Back
          </button>
        )}

        {step < 4 && <button onClick={next}>Next</button>}

        {step === 4 && (
          <button
            onClick={submit}
            style={{ background: "#000", color: "#fff" }}
          >
            View Pricing →
          </button>
        )}
      </div>
    </main>
  );
}
