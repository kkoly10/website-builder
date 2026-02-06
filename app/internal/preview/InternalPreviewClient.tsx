"use client";

import { useSearchParams } from "next/navigation";
import { evaluatePIE } from "../../../lib/pie";
import { getByToken } from "../../../lib/internalStore";

export default function InternalPreviewClient() {
  const sp = useSearchParams();
  const token = sp.get("token");

  if (!token) {
    return (
      <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
        <h1>PIE — Internal Evaluation</h1>
        <p>Invalid internal link (missing token).</p>
      </main>
    );
  }

  const stored = getByToken(token);

  if (!stored) {
    return (
      <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
        <h1>PIE — Internal Evaluation</h1>
        <p>Report not found or expired.</p>
        <p style={{ color: "#666" }}>
          (V1 uses in-memory storage. Next step: store tokens in Supabase so links
          persist.)
        </p>
      </main>
    );
  }

  const report = evaluatePIE(stored.payload);

  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1>PIE — Internal Evaluation</h1>
      <p>
        <strong>Generated:</strong>{" "}
        {new Date(stored.createdAt).toLocaleString()}
      </p>

      <section style={{ marginTop: 18 }}>
        <h3>Summary</h3>
        <p>{report.summary}</p>
      </section>

      <section
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <div style={box()}>
          <div style={label()}>Score</div>
          <div style={value()}>{report.score} / 100</div>
        </div>
        <div style={box()}>
          <div style={label()}>Tier</div>
          <div style={value()}>{report.tier}</div>
        </div>
        <div style={box()}>
          <div style={label()}>Confidence</div>
          <div style={value()}>{report.confidence}</div>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Pricing Guidance (Private)</h3>
        <div style={box()}>
          <div>
            <strong>Target:</strong> ${report.pricing.target}
          </div>
          <div>
            <strong>Minimum:</strong> ${report.pricing.minimum}
          </div>

          {report.pricing.buffers.length > 0 && (
            <>
              <div style={{ marginTop: 10, fontWeight: 600 }}>Buffers</div>
              <ul>
                {report.pricing.buffers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Risk Flags</h3>
        {report.risks.length ? (
          <ul>
            {report.risks.map((r) => (
              <li key={r}>🚩 {r}</li>
            ))}
          </ul>
        ) : (
          <p>None</p>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Pitch Helper</h3>
        <p>{report.pitch.recommend}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={box()}>
            <div style={label()}>Emphasize</div>
            <ul style={{ marginTop: 8 }}>
              {report.pitch.emphasize.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>

          <div style={box()}>
            <div style={label()}>Likely Objections</div>
            <ul style={{ marginTop: 8 }}>
              {report.pitch.objections.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <details style={{ marginTop: 22 }}>
        <summary style={{ cursor: "pointer" }}>Raw JSON</summary>
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(report, null, 2)}
        </pre>
      </details>
    </main>
  );
}

function box() {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    background: "#fff",
  } as const;
}
function label() {
  return { fontSize: 12, color: "#6b7280", marginBottom: 6 } as const;
}
function value() {
  return { fontSize: 18, fontWeight: 700 } as const;
}
