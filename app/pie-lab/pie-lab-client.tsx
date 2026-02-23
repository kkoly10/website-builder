// app/pie-lab/pie-lab-client.tsx
"use client";

import { useMemo, useState } from "react";

const SAMPLE = {
  businessName: "Example Home Services Co",
  contactName: "Owner",
  industry: "Home services",
  location: "Fredericksburg, VA",
  teamSize: "5-10",
  currentTools: ["QuickBooks", "Google Sheets", "Gmail", "Phone calls/texts"],
  problems: [
    "Invoices are sent late",
    "No follow-up on unpaid invoices",
    "Leads get lost after calls",
    "No centralized customer history"
  ],
  goals: [
    "Get paid faster",
    "Track leads and jobs",
    "Automate reminders",
    "Have a simple dashboard"
  ],
  budgetRange: "$500-$1500 initial, then monthly if useful",
  urgency: "Need a solution this month",
  notes:
    "Owner handles most admin work manually. Wants something simple first, then can expand."
};

export default function PieLabClient() {
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE, null, 2));
  const [previousResponseId, setPreviousResponseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [report, setReport] = useState<any>(null);
  const [responseId, setResponseId] = useState<string | null>(null);

  const prettyReport = useMemo(() => {
    if (!report) return "";
    return JSON.stringify(report, null, 2);
  }, [report]);

  async function onGenerate() {
    setLoading(true);
    setError(null);

    try {
      let intake: Record<string, unknown>;
      try {
        intake = JSON.parse(jsonText);
      } catch {
        throw new Error("Intake JSON is not valid.");
      }

      const res = await fetch("/api/pie/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake,
          previousResponseId: previousResponseId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to generate PIE report.");
      }

      setReport(data.report);
      setResponseId(data.responseId || null);

      if (data.responseId) {
        setPreviousResponseId(data.responseId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner" style={{ display: "grid", gap: 14 }}>
          <label style={{ fontWeight: 800 }}>Client intake JSON</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            style={{
              width: "100%",
              borderRadius: 12,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          />

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 800 }}>
              previousResponseId (optional, for follow-up)
            </label>
            <input
              value={previousResponseId}
              onChange={(e) => setPreviousResponseId(e.target.value)}
              placeholder="Paste previous response id to continue the same PIE thread"
              className="input"
              style={{
                width: "100%",
                borderRadius: 12,
                padding: 10,
                background: "rgba(255,255,255,0.04)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={onGenerate}
              className="btn btnPrimary"
              disabled={loading}
              type="button"
            >
              {loading ? "Generating..." : "Generate PIE Report"}
            </button>

            <button
              onClick={() => {
                setJsonText(JSON.stringify(SAMPLE, null, 2));
                setError(null);
              }}
              className="btn btnGhost"
              type="button"
            >
              Reset Sample
            </button>
          </div>

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

          {responseId ? (
            <div
              style={{
                borderRadius: 12,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 800 }}>Latest PIE Response ID</div>
              <div style={{ opacity: 0.85, marginTop: 4, wordBreak: "break-all" }}>
                {responseId}
              </div>
            </div>
          ) : null}

          {report ? (
            <>
              <div style={{ marginTop: 8, fontWeight: 900 }}>Structured PIE report</div>

              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  borderRadius: 12,
                  padding: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}
              >
                {prettyReport}
              </pre>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}