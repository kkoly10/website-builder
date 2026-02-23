"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardRow = {
  intake: any;
  latestCallRequest: any | null;
  latestPieReport: any | null;
};

export default function OpsDashboardClient() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [regenerate, setRegenerate] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/internal/ops/dashboard", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load ops dashboard.");
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);

      setSelectedIntakeId((prev) => {
        if (prev && (data.rows || []).some((r: DashboardRow) => r.intake?.id === prev)) {
          return prev;
        }
        return data.rows?.[0]?.intake?.id ?? null;
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const selected = useMemo(
    () => rows.find((r) => r.intake?.id === selectedIntakeId) ?? null,
    [rows, selectedIntakeId]
  );

  async function generatePie() {
    if (!selected?.intake?.id) return;

    setGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/internal/generate-ops-pie-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opsIntakeId: selected.intake.id,
          followUpNote: followUpNote.trim() || undefined,
          regenerate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to generate PIE report.");
      }

      setFollowUpNote("");
      setRegenerate(false);
      await refresh();
      setSelectedIntakeId(selected.intake.id);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="heroGrid">
        <div className="card">
          <div className="cardInner" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Recent Intakes</div>
              <button className="btn btnGhost" type="button" onClick={refresh} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadError ? (
              <div
                style={{
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid rgba(255,80,80,0.35)",
                  background: "rgba(255,80,80,0.08)",
                }}
              >
                <strong>Error:</strong> {loadError}
              </div>
            ) : null}

            {rows.length === 0 && !loading ? (
              <div className="p">No ops intakes yet.</div>
            ) : null}

            <div style={{ display: "grid", gap: 10 }}>
              {rows.map((row) => {
                const intake = row.intake;
                const active = intake.id === selectedIntakeId;
                const hasPie = !!row.latestPieReport;
                const hasCall = !!row.latestCallRequest;

                return (
                  <button
                    key={intake.id}
                    type="button"
                    onClick={() => setSelectedIntakeId(intake.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: 14,
                      border: active
                        ? "1px solid rgba(255,122,24,0.35)"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: active ? "rgba(255,122,24,0.08)" : "rgba(255,255,255,0.03)",
                      padding: 12,
                      cursor: "pointer",
                      color: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{intake.company_name}</div>
                    <div className="p" style={{ marginTop: 4 }}>
                      {intake.contact_name} • {intake.email}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 8,
                        opacity: 0.95,
                      }}
                    >
                      {intake.recommendation_tier ? (
                        <span className="pill">{intake.recommendation_tier}</span>
                      ) : null}
                      {intake.recommendation_price_range ? (
                        <span className="pill">{intake.recommendation_price_range}</span>
                      ) : null}
                      <span className="pill">{hasCall ? "Call requested" : "No call yet"}</span>
                      <span className="pill">{hasPie ? "PIE ready" : "No PIE yet"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner" style={{ display: "grid", gap: 12 }}>
            {!selected ? (
              <div className="p">Select an intake to view details.</div>
            ) : (
              <>
                <div>
                  <div className="kicker">
                    <span className="kickerDot" aria-hidden="true" />
                    Selected Intake
                  </div>
                  <div style={{ height: 8 }} />
                  <div className="h2" style={{ margin: 0 }}>
                    {selected.intake.company_name}
                  </div>
                  <div className="p" style={{ marginTop: 8 }}>
                    {selected.intake.contact_name} • {selected.intake.email}
                    {selected.intake.phone ? ` • ${selected.intake.phone}` : ""}
                  </div>
                </div>

                <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="cardInner" style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 900 }}>Intake snapshot</div>
                    <div className="p">
                      <strong>Industry:</strong> {selected.intake.industry || "—"}
                    </div>
                    <div className="p">
                      <strong>Team size:</strong> {selected.intake.team_size || "—"}
                    </div>
                    <div className="p">
                      <strong>Volume:</strong> {selected.intake.job_volume || "—"}
                    </div>
                    <div className="p">
                      <strong>Urgency:</strong> {selected.intake.urgency || "—"}
                    </div>
                    <div className="p">
                      <strong>Readiness:</strong> {selected.intake.readiness || "—"}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="cardInner" style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 900 }}>Latest call request</div>
                    {selected.latestCallRequest ? (
                      <>
                        <div className="p">
                          <strong>Best time:</strong>{" "}
                          {selected.latestCallRequest.best_time_to_call || "—"}
                        </div>
                        <div className="p">
                          <strong>Preferred windows:</strong>{" "}
                          {selected.latestCallRequest.preferred_times || "—"}
                        </div>
                        <div className="p">
                          <strong>Timezone:</strong>{" "}
                          {selected.latestCallRequest.timezone || "—"}
                        </div>
                      </>
                    ) : (
                      <div className="p">No call request submitted yet.</div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="cardInner" style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 900 }}>PIE Actions</div>

                    <textarea
                      value={followUpNote}
                      onChange={(e) => setFollowUpNote(e.target.value)}
                      placeholder="Optional follow-up note for PIE (ex: client says budget max is $1200, focus on invoice automation first)"
                      style={{
                        width: "100%",
                        minHeight: 84,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.03)",
                        color: "rgba(255,255,255,0.95)",
                        padding: "12px 14px",
                        resize: "vertical",
                      }}
                    />

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        opacity: 0.95,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={regenerate}
                        onChange={(e) => setRegenerate(e.target.checked)}
                      />
                      Force regenerate (ignore cached latest report)
                    </label>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={generatePie}
                        disabled={generating}
                      >
                        {generating ? "Generating PIE..." : "Generate PIE Report"}
                        <span className="btnArrow">→</span>
                      </button>
                    </div>

                    {generateError ? (
                      <div
                        style={{
                          borderRadius: 12,
                          padding: 12,
                          border: "1px solid rgba(255,80,80,0.35)",
                          background: "rgba(255,80,80,0.08)",
                        }}
                      >
                        <strong>Error:</strong> {generateError}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="cardInner" style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 900 }}>Latest PIE report</div>

                    {selected.latestPieReport ? (
                      <>
                        <div className="p">
                          <strong>Model:</strong> {selected.latestPieReport.model || "—"}
                        </div>
                        <div className="p">
                          <strong>Response ID:</strong>{" "}
                          {selected.latestPieReport.openai_response_id || "—"}
                        </div>
                        <div className="p">
                          <strong>Summary:</strong>{" "}
                          {selected.latestPieReport.summary || "No summary"}
                        </div>

                        <details>
                          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
                            View JSON report
                          </summary>
                          <pre
                            style={{
                              marginTop: 10,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontSize: 12,
                              lineHeight: 1.5,
                              borderRadius: 12,
                              padding: 12,
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          >
                            {JSON.stringify(selected.latestPieReport.report_json, null, 2)}
                          </pre>
                        </details>
                      </>
                    ) : (
                      <div className="p">No PIE report generated yet.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}