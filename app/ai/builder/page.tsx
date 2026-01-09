"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AIBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    goal: "",
    tone: "Professional",
    useAdvanced: false,
  });

  function next() {
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => s - 1);
  }

  function generate() {
    if (!form.businessName.trim()) {
      alert("Please enter your business name.");
      return;
    }
    if (!form.industry.trim()) {
      alert("Please select an industry.");
      return;
    }
    if (!form.goal.trim()) {
      alert("Please select your main goal.");
      return;
    }

    const params = new URLSearchParams({
      businessName: form.businessName,
      industry: form.industry,
      goal: form.goal,
      tone: form.useAdvanced ? form.tone : "Professional",
      advanced: form.useAdvanced ? "true" : "false",
    }).toString();

    router.push(`/ai/preview?${params}`);
  }

  return (
    <main style={{ maxWidth: 800, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>AI Website Builder</h1>

      <p style={{ color: "#555", marginBottom: 32 }}>Step {step} of 4</p>

      {step === 1 && (
        <>
          <h3>What’s your business name?</h3>
          <input
            type="text"
            placeholder="e.g. Smith Auto Repair"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            style={{ width: "100%", padding: 12 }}
          />
        </>
      )}

      {step === 2 && (
        <>
          <h3>What industry are you in?</h3>
          <select
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            style={{ width: "100%", padding: 12 }}
          >
            <option value="">Select an industry</option>
            <option>Auto Repair</option>
            <option>Consulting</option>
            <option>Real Estate</option>
            <option>Restaurant</option>
            <option>Cleaning Services</option>
            <option>Other</option>
          </select>
        </>
      )}

      {step === 3 && (
        <>
          <h3>What is the main goal of your website?</h3>
          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            style={{ width: "100%", padding: 12 }}
          >
            <option value="">Select a goal</option>
            <option>Generate leads</option>
            <option>Get phone calls</option>
            <option>Book appointments</option>
            <option>Sell services</option>
            <option>Build credibility</option>
          </select>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Advanced Customization (Optional)</h3>

          <label style={{ display: "block", marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.useAdvanced}
              onChange={(e) => setForm({ ...form, useAdvanced: e.target.checked })}
            />{" "}
            Enable advanced customization
          </label>

          {form.useAdvanced && (
            <>
              <label>Website tone</label>
              <select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                style={{ width: "100%", padding: 12 }}
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Bold</option>
                <option>Luxury</option>
                <option>Minimal</option>
              </select>
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 40 }}>
        {step > 1 && (
          <button onClick={back} style={{ marginRight: 12, padding: "10px 16px" }}>
            Back
          </button>
        )}

        {step < 4 && (
          <button onClick={next} style={{ padding: "10px 16px" }}>
            Next
          </button>
        )}

        {step === 4 && (
          <button
            onClick={generate}
            style={{
              padding: "12px 22px",
              background: "#000",
              color: "#fff",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Generate AI Website →
          </button>
        )}
      </div>
    </main>
  );
}