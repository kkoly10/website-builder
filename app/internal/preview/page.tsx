"use client";

import { useSearchParams } from "next/navigation";
import { evaluatePIE, ProjectInput } from "@/lib/pie";

export default function InternalPreview() {
  const sp = useSearchParams();

  const input: ProjectInput = {
    pages: (sp.get("pages") as any) ?? "4-5",
    booking: (sp.get("booking") as any) ?? "none",
    payments: (sp.get("payments") as any) ?? "none",
    automation: (sp.get("automation") as any) ?? "none",
    integrations: (sp.get("integrations") as any) ?? "none",
    content: (sp.get("content") as any) ?? "ready",
    stakeholders: (sp.get("stakeholders") as any) ?? "1",
    timeline: (sp.get("timeline") as any) ?? "4+ weeks",
  };

  const report = evaluatePIE(input);

  return (
    <main style={{ maxWidth: 1100, margin: "80px auto", padding: 24 }}>
      <h1>PIE — Internal Project Evaluation</h1>

      <section style={{ marginTop: 24 }}>
        <h3>Executive Summary</h3>
        <p>{report.summary}</p>
      </section>

      <section style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <div><strong>Score</strong><div>{report.score} / 100</div></div>
        <div><strong>Tier</strong><div>{report.tier}</div></div>
        <div><strong>Confidence</strong><div>{report.confidence}</div></div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Pricing Guidance (Private)</h3>
        <p><strong>Target:</strong> ${report.pricing.target}</p>
        <p><strong>Minimum:</strong> ${report.pricing.minimum}</p>
        {report.pricing.buffers.length > 0 && (
          <>
            <strong>Buffers</strong>
            <ul>{report.pricing.buffers.map(b => <li key={b}>{b}</li>)}</ul>
          </>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Risk Flags</h3>
        {report.risks.length ? <ul>{report.risks.map(r => <li key={r}>🚩 {r}</li>)}</ul> : <p>None</p>}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Sales Pitch Helper</h3>
        <p>{report.pitch.recommend}</p>
        <strong>Emphasize</strong>
        <ul>{report.pitch.emphasize.map(e => <li key={e}>{e}</li>)}</ul>
        <strong>Likely Objections</strong>
        <ul>{report.pitch.objections.map(o => <li key={o}>{o}</li>)}</ul>
      </section>
    </main>
  );
}
