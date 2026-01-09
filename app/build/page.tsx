"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    timeline: "4+ weeks",
  });

  function next() {
    setStep(step + 1);
  }

  function back() {
    setStep(step - 1);
  }

  function submit() {
    const params = new URLSearchParams(form as any).toString();
    router.push(`/estimate?${params}`);
  }

  return (
    <main style={{ maxWidth: 800, margin: "60px auto", padding: 24 }}>
      <h2 style={{ fontSize: 32, marginBottom: 24 }}>
        Step {step} of 4
      </h2>

      {step === 1 && (
        <>
          <h3>What type of website do you need?</h3>
          <select
            value={form.websiteType}
            onChange={(e) =>
              setForm({ ...form, websiteType: e.target.value })
            }
          >
            <option>Business</option>
            <option>Ecommerce</option>
            <option>Portfolio</option>
            <option>Landing</option>
          </select>
        </>
      )}

      {step === 2 && (
        <>
          <h3>Pages & Features</h3>

          <label>Page Count</label>
          <select
            value={form.pages}
            onChange={(e) => setForm({ ...form, pages: e.target.value })}
          >
            <option value="1">1</option>
            <option value="3-5">3–5</option>
            <option value="6-10">6–10</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={form.booking}
              onChange={(e) =>
                setForm({ ...form, booking: e.target.checked })
              }
            />{" "}
            Booking system
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.payments}
              onChange={(e) =>
                setForm({ ...form, payments: e.target.checked })
              }
            />{" "}
            Online payments
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.blog}
              onChange={(e) =>
                setForm({ ...form, blog: e.target.checked })
              }
            />{" "}
            Blog
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <h3>Design Preference</h3>
          <select
            value={form.design}
            onChange={(e) => setForm({ ...form, design: e.target.value })}
          >
            <option>Classic</option>
            <option>Modern</option>
            <option>Creative</option>
          </select>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Timeline</h3>
          <select
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
          >
            <option>4+ weeks</option>
            <option>2-3 weeks</option>
            <option>Under 14 days</option>
          </select>
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
          <button onClick={submit} style={{ background: "black", color: "#fff" }}>
            View Estimate →
          </button>
        )}
      </div>
    </main>
  );
}
