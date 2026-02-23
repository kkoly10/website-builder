"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

export default function OpsBookClient({ opsIntakeId }: { opsIntakeId: string }) {
  const [bestTimeToCall, setBestTimeToCall] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/ops/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId, bestTimeToCall, preferredTimes, timezone, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save call request.");
      }

      window.location.href =
        data.nextUrl ||
        `/ops-thank-you?opsIntakeId=${encodeURIComponent(opsIntakeId)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setSubmitting(false);
    }
  }

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="cardInner" style={{ display: "grid", gap: 14 }}>
            <h2 className="h2" style={{ margin: 0 }}>
              Call preferences
            </h2>

            <div style={twoCol}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>Best time to call</span>
                <input
                  value={bestTimeToCall}
                  onChange={(e) => setBestTimeToCall(e.target.value)}
                  placeholder="Example: Weekdays after 3pm"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={labelStyle}>Timezone</span>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="America/New_York"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={labelStyle}>Preferred days / windows</span>
              <textarea
                value={preferredTimes}
                onChange={(e) => setPreferredTimes(e.target.value)}
                placeholder="Example: Tue/Thu 10am–1pm, Fri 2pm–5pm"
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={labelStyle}>Anything important before the call?</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Please focus on invoicing + missed leads first."
                style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              />
            </label>

            {error ? (
              <div
                style={{
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid rgba(255,80,80,0.35)",
                  background: "rgba(255,80,80,0.08)",
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" className="btn btnPrimary" disabled={submitting}>
                {submitting ? "Saving..." : "Submit Call Request"}
                <span className="btnArrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

const labelStyle: CSSProperties = {
  fontWeight: 850,
  color: "rgba(255,255,255,0.94)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.95)",
  padding: "12px 14px",
  outline: "none",
};

const twoCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};