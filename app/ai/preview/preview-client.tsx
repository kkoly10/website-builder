"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type AiWebsiteDraft = {
  businessName: string;
  industry: string;
  goal: string;
  tone: string;
  heroHeadline: string;
  heroSubheadline: string;
  about: string;
  services: string[];
  ctaHeadline: string;
  ctaButton: string;
};

const emptyDraft: AiWebsiteDraft = {
  businessName: "",
  industry: "",
  goal: "",
  tone: "Professional",
  heroHeadline: "",
  heroSubheadline: "",
  about: "",
  services: ["", "", ""],
  ctaHeadline: "",
  ctaButton: "",
};

export default function PreviewClient() {
  const params = useSearchParams();

  const seed = useMemo(() => {
    const businessName = params.get("businessName") || "";
    const industry = params.get("industry") || "";
    const goal = params.get("goal") || "";
    const tone = params.get("tone") || "Professional";
    return { businessName, industry, goal, tone };
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [draft, setDraft] = useState<AiWebsiteDraft>({ ...emptyDraft, ...seed });
  const [generatedOnce, setGeneratedOnce] = useState(false);

  async function generateDraft() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seed),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Generation failed");
      }

      const json = (await res.json()) as AiWebsiteDraft;
      setDraft(json);
      setGeneratedOnce(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // auto-generate first draft once
    if (!generatedOnce && seed.businessName && seed.industry && seed.goal) {
      generateDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed.businessName, seed.industry, seed.goal, seed.tone]);

  return (
    <main style={{ maxWidth: 1000, margin: "70px auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>AI Website Preview</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        Edit anything you want. When you’re happy, you’ll be able to move to the next step.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <button
          onClick={generateDraft}
          style={{
            padding: "10px 16px",
            background: "#000",
            color: "#fff",
            borderRadius: 10,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Generating…" : generatedOnce ? "Regenerate" : "Generate"}
        </button>

        <a href="/ai/builder" style={{ alignSelf: "center", color: "#555" }}>
          ← Back to AI Builder
        </a>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#7f1d1d",
          }}
        >
          {error}
        </div>
      )}

      {/* EDIT FORM */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 18,
          marginBottom: 24,
        }}
      >
        <h3 style={{ marginBottom: 12 }}>Editable Content</h3>

        <Field label="Business name">
          <input
            value={draft.businessName}
            onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
            style={inputStyle}
          />
        </Field>

        <Field label="Hero headline">
          <input
            value={draft.heroHeadline}
            onChange={(e) => setDraft({ ...draft, heroHeadline: e.target.value })}
            style={inputStyle}
          />
        </Field>

        <Field label="Hero subheadline">
          <input
            value={draft.heroSubheadline}
            onChange={(e) => setDraft({ ...draft, heroSubheadline: e.target.value })}
            style={inputStyle}
          />
        </Field>

        <Field label="About">
          <textarea
            value={draft.about}
            onChange={(e) => setDraft({ ...draft, about: e.target.value })}
            style={{ ...inputStyle, minHeight: 110 }}
          />
        </Field>

        <Field label="Services (edit each line)">
          {draft.services.map((s, idx) => (
            <input
              key={idx}
              value={s}
              onChange={(e) => {
                const next = [...draft.services];
                next[idx] = e.target.value;
                setDraft({ ...draft, services: next });
              }}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
          ))}
        </Field>

        <Field label="CTA headline">
          <input
            value={draft.ctaHeadline}
            onChange={(e) => setDraft({ ...draft, ctaHeadline: e.target.value })}
            style={inputStyle}
          />
        </Field>

        <Field label="CTA button text">
          <input
            value={draft.ctaButton}
            onChange={(e) => setDraft({ ...draft, ctaButton: e.target.value })}
            style={inputStyle}
          />
        </Field>
      </section>

      {/* LIVE PREVIEW */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 22,
        }}
      >
        <h3 style={{ marginBottom: 14 }}>Live Preview</h3>

        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 22 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>
              {draft.industry} • {draft.goal} • Tone: {draft.tone}
            </div>
            <h2 style={{ fontSize: 36, margin: "6px 0 10px" }}>
              {draft.heroHeadline || "Your headline will appear here"}
            </h2>
            <p style={{ fontSize: 18, color: "#555" }}>
              {draft.heroSubheadline || "Your subheadline will appear here"}
            </p>
          </div>

          <hr style={{ margin: "18px 0" }} />

          <h4 style={{ marginBottom: 8 }}>About {draft.businessName || "your business"}</h4>
          <p style={{ color: "#444", lineHeight: 1.7 }}>{draft.about || "About text…"}</p>

          <hr style={{ margin: "18px 0" }} />

          <h4 style={{ marginBottom: 10 }}>Services</h4>
          <ul style={{ lineHeight: 1.8, color: "#444" }}>
            {(draft.services || []).filter(Boolean).length ? (
              draft.services.filter(Boolean).map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li>Service items will appear here</li>
            )}
          </ul>

          <hr style={{ margin: "18px 0" }} />

          <h4 style={{ marginBottom: 10 }}>{draft.ctaHeadline || "CTA headline…"}</h4>
          <button
            style={{
              padding: "12px 18px",
              background: "#000",
              color: "#fff",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {draft.ctaButton || "Call to action"}
          </button>
        </div>

        {/* Next step placeholder */}
        <div style={{ marginTop: 18, color: "#666", fontSize: 14 }}>
          Next: we’ll add “Save + Email this draft” and a cheap checkout option for the AI site.
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  fontSize: 16,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};
