"use client";

import { useSearchParams } from "next/navigation";
import { evaluatePIE } from "../../../lib/pie";
import { getByToken } from "../../../lib/internalStore";

export default function InternalPreview() {
  const sp = useSearchParams();
  const token = sp.get("token");

  if (!token) return <p>Invalid internal link.</p>;

  const stored = getByToken(token);
  if (!stored) return <p>Report not found or expired.</p>;

  const report = evaluatePIE(stored.payload);

  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1>PIE — Internal Evaluation</h1>
      <p><strong>Generated:</strong> {new Date(stored.createdAt).toLocaleString()}</p>

      <pre style={{ marginTop: 24 }}>
        {JSON.stringify(report, null, 2)}
      </pre>
    </main>
  );
}