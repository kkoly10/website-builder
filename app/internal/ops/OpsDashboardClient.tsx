"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type IntakeRow = {
  id: string;
  created_at: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  urgency: string | null;
  readiness: string | null;
  recommendation_tier: string | null;
  recommendation_price_range: string | null;
  recommendation_score: number | null;
  status: string | null;
};

type CallRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  best_time_to_call: string | null;
  preferred_times: string | null;
  timezone: string | null;
  status: string | null;
};

type PieRow = {
  id: string;
  ops_intake_id: string;
  created_at: string | null;
  status: string | null;
  summary: string | null;
  generator: string | null;
  model: string | null;
};

type Row = {
  intake: IntakeRow;
  latestCall: CallRow | null;
  latestPie: PieRow | null;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function OpsDashboardClient({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"pie" | "contacted" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const haystack = [
        r.intake.company_name,
        r.intake.contact_name,
        r.intake.email,
        r.intake.industry,
        r.intake.status,
        r.intake.recommendation_tier,
        r.latestCall?.status,
        r.latestPie?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [rows, query]);

  async function markContacted(opsIntakeId: string) {
    setBusyId(opsIntakeId);
    setBusyAction("contacted");
    setFlash(null);

    try {
      const res = await fetch("/api/internal/ops/mark-contacted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to update status.");

      setRows((prev) =>
        prev.map((r) =>
          r.intake.id === opsIntakeId
            ? { ...r, intake: { ...r.intake, status: "contacted" } }
            : r
        )
      );

      setFlash("Marked as contacted.");
    } catch (e: any) {
      setFlash(e?.message || "Failed to mark contacted.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function generatePie(opsIntakeId: string) {
    setBusyId(opsIntakeId);
    setBusyAction("pie");
    setFlash(null);

    try {
      const res = await fetch("/api/internal/ops/generate-pie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsIntakeId }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to generate PIE.");

      setRows((prev) =>
        prev.map((r) =>
          r.intake.id === opsIntakeId
            ? {
                ...r,
                latestPie: {
                  id: json.report?.id ?? `temp-${opsIntakeId}`,
                  ops_intake_id: opsIntakeId,
                  created_at: json.report?.created_at ?? new Date().toISOString(),
                  status: json.report?.status ?? "generated",
                  summary: json.report?.summary ?? "PIE report generated.",
                  generator: json.report?.generator ?? "ops_rules_v1",
                  model: json.report?.model ?? null,
                },
              }
            : r
        )
      );

      setFlash("PIE report generated.");
    } catch (e: any) {
      setFlash(e?.message || "Failed to generate PIE.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="cardInner">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, contact, email, tier, status..."
            style={{
              flex: "1 1 320px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.95)",
              padding: "12px 14px",
              outline: "none",
            }}
          />
          <div className="pill">{filtered.length} results</div>
        </div>

        {flash ? (
          <div
            style={{
              marginTop: 10,
              borderRadius: 12,
              padding: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {flash}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {filtered.length === 0 ? (
            <div className="p">No ops intakes match your search.</div>
          ) : (
            filtered.map((row) => {
              const { intake, latestCall, latestPie } = row;
              const loadingThisRow = busyId === intake.id;

              return (
                <div
                  key={intake.id}
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        {intake.company_name || "Unnamed company"}
                      </div>
                      <div className="p" style={{ marginTop: 4 }}>
                        {intake.contact_name || "—"} • {intake.email || "—"}
                      </div>
                      <div className="p" style={{ marginTop: 4 }}>
                        Submitted: {fmtDate(intake.created_at)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {intake.status ? <span className="pill">{intake.status}</span> : null}
                      {intake.recommendation_tier ? (
                        <span className="pill">{intake.recommendation_tier}</span>
                      ) : null}
                      {intake.recommendation_price_range ? (
                        <span className="pill">{intake.recommendation_price_range}</span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: 10,
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>Intake</div>
                      <div className="p">
                        <strong>Industry:</strong> {intake.industry || "—"}
                        <br />
                        <strong>Urgency:</strong> {intake.urgency || "—"}
                        <br />
                        <strong>Readiness:</strong> {intake.readiness || "—"}
                        <br />
                        <strong>Score:</strong> {intake.recommendation_score ?? "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: 10,
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>Call Request</div>
                      {latestCall ? (
                        <div className="p">
                          <strong>Status:</strong> {latestCall.status || "submitted"}
                          <br />
                          <strong>Best time:</strong> {latestCall.best_time_to_call || "—"}
                          <br />
                          <strong>Window:</strong> {latestCall.preferred_times || "—"}
                          <br />
                          <strong>Timezone:</strong> {latestCall.timezone || "—"}
                        </div>
                      ) : (
                        <div className="p">No call request yet.</div>
                      )}
                    </div>

                    <div
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: 10,
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>PIE Report</div>
                      {latestPie ? (
                        <div className="p">
                          <strong>Status:</strong> {latestPie.status || "generated"}
                          <br />
                          <strong>Generated:</strong> {fmtDate(latestPie.created_at)}
                          <br />
                          <strong>Summary:</strong> {latestPie.summary || "—"}
                        </div>
                      ) : (
                        <div className="p">No PIE report yet.</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <Link href={`/internal/ops/${intake.id}`} className="btn btnGhost">
                      View Details
                    </Link>

                    <button
                      type="button"
                      className="btn btnGhost"
                      onClick={() => markContacted(intake.id)}
                      disabled={loadingThisRow}
                    >
                      {loadingThisRow && busyAction === "contacted"
                        ? "Updating..."
                        : "Mark Contacted"}
                    </button>

                    <button
                      type="button"
                      className="btn btnPrimary"
                      onClick={() => generatePie(intake.id)}
                      disabled={loadingThisRow}
                    >
                      {loadingThisRow && busyAction === "pie"
                        ? "Generating..."
                        : "Generate PIE"}{" "}
                      <span className="btnArrow">→</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}