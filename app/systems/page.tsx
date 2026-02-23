"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type FormEvent } from "react";

type Trade =
  | "Plumbing"
  | "Electrical"
  | "HVAC"
  | "Cleaning"
  | "Landscaping"
  | "Auto Shop"
  | "Agency"
  | "Dental"
  | "Medical"
  | "Law Firm"
  | "Other";

type TeamSize = "Solo" | "2-5" | "6-10" | "11-20" | "20+";
type JobVolume = "1-10" | "11-30" | "31-75" | "76+";
type Urgency = "ASAP" | "2-4 weeks" | "1-2 months" | "Exploring";
type Readiness = "Process documented" | "Somewhat documented" | "Need help mapping";

type IntakeState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  trade: Trade;
  teamSize: TeamSize;
  jobVolume: JobVolume;
  urgency: Urgency;
  readiness: Readiness;
  currentTools: string[];
  painPoints: string[];
  workflowsNeeded: string[];
  notes: string;
};

const TOOL_OPTIONS = [
  "QuickBooks",
  "Google Sheets",
  "Gmail / Outlook",
  "Jobber",
  "Housecall Pro",
  "HubSpot / CRM",
  "Stripe / Square",
  "No real system (manual)",
];

const PAIN_OPTIONS = [
  "Missed leads / callbacks",
  "Slow quote follow-up",
  "Delayed invoicing",
  "Unpaid invoices / reminders",
  "No clear job status tracking",
  "Owner doing too much admin",
  "Client info scattered in texts",
  "No reporting / visibility",
];

const WORKFLOW_OPTIONS = [
  "Lead intake + routing",
  "CRM setup / pipeline",
  "Job board / dispatch tracking",
  "Quote / estimate workflow",
  "Invoice reminders",
  "Payment follow-up automation",
  "Dashboard reporting",
  "Client portal / status page",
];

const initialState: IntakeState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  trade: "Plumbing",
  teamSize: "2-5",
  jobVolume: "11-30",
  urgency: "2-4 weeks",
  readiness: "Somewhat documented",
  currentTools: [],
  painPoints: [],
  workflowsNeeded: [],
  notes: "",
};

export default function SystemsIntakePage() {
  const router = useRouter();

  const [form, setForm] = useState<IntakeState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommendation = useMemo(() => getRecommendation(form), [form]);

  function update<K extends keyof IntakeState>(key: K, value: IntakeState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue(
    key: "currentTools" | "painPoints" | "workflowsNeeded",
    value: string
  ) {
    setForm((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      return {
        ...prev,
        [key]: exists ? list.filter((x) => x !== value) : [...list, value],
      };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // keep a local copy too (helpful fallback)
      localStorage.setItem(
        "crecystudio:lastOpsIntake",
        JSON.stringify({
          ...form,
          recommendation,
          savedAt: new Date().toISOString(),
        })
      );

      const res = await fetch("/api/ops/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          trade: form.trade,
          teamSize: form.teamSize,
          jobVolume: form.jobVolume,
          urgency: form.urgency,
          readiness: form.readiness,
          currentTools: form.currentTools,
          painPoints: form.painPoints,
          workflowsNeeded: form.workflowsNeeded,
          notes: form.notes,
          recommendation,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save intake.");
      }

      // FIX: route into ops flow (not /book?quoteId=...)
      router.push(data.nextUrl || `/ops-book?opsIntakeId=${data.opsIntakeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setSubmitting(false);
      return;
    }
  }

  return (
    <main className="container">
      <section className="section">
        <div className="heroGrid">
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio Ops • Workflow Review Intake
              </div>

              <div style={{ height: 10 }} />

              <h1 className="h2">
                Tell me how your business runs now — I’ll map the best workflow fix.
              </h1>

              <p className="p" style={{ marginTop: 10 }}>
                This intake is for invoicing, CRM, lead handling, job tracking, and back-office
                automation. Works for contractors, small offices, agencies, clinics, shops, and
                service businesses.
              </p>

              <div className="pills" style={{ marginTop: 10 }}>
                <span className="pill">Billing & invoice reminders</span>
                <span className="pill">CRM workflows</span>
                <span className="pill">Job tracking</span>
                <span className="pill">Dashboards</span>
              </div>

              <div className="heroActions" style={{ marginTop: 14 }}>
                <Link href="/build" className="btn btnGhost">
                  Need a Website Quote?
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner" style={{ display: "grid", gap: 12 }}>
              <div className="badge badgeHot">{recommendation.tierLabel}</div>
              <div>
                <div className="statNum">{recommendation.priceRange}</div>
                <div className="statLab">Current fit estimate</div>
              </div>

              <div className="p">{recommendation.summary}</div>

              <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="cardInner">
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>How this works</div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                    <li>Complete the intake</li>
                    <li>Get routed to the ops booking page</li>
                    <li>Book a workflow review call</li>
                    <li>Get a clear scope + next steps</li>
                  </ul>
                </div>
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
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="cardInner" style={{ display: "grid", gap: 14 }}>
              <h2 className="h2" style={{ margin: 0 }}>
                Workflow Automation Intake
              </h2>
              <p className="p" style={{ marginTop: 0 }}>
                Fill this out once and use it as the source of truth for the review call.
              </p>

              <div style={twoCol}>
                <Field label="Company name">
                  <input
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Example: Stafford Comfort Plumbing"
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Contact name">
                  <input
                    value={form.contactName}
                    onChange={(e) => update("contactName", e.target.value)}
                    placeholder="Owner / Manager"
                    style={inputStyle}
                    required
                  />
                </Field>
              </div>

              <div style={twoCol}>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="name@company.com"
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 555-5555"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={threeCol}>
                <Field label="Industry">
                  <select
                    value={form.trade}
                    onChange={(e) => update("trade", e.target.value as Trade)}
                    style={inputStyle}
                  >
                    {[
                      "Plumbing",
                      "Electrical",
                      "HVAC",
                      "Cleaning",
                      "Landscaping",
                      "Auto Shop",
                      "Agency",
                      "Dental",
                      "Medical",
                      "Law Firm",
                      "Other",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Team size">
                  <select
                    value={form.teamSize}
                    onChange={(e) => update("teamSize", e.target.value as TeamSize)}
                    style={inputStyle}
                  >
                    {["Solo", "2-5", "6-10", "11-20", "20+"].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Monthly job/client volume">
                  <select
                    value={form.jobVolume}
                    onChange={(e) => update("jobVolume", e.target.value as JobVolume)}
                    style={inputStyle}
                  >
                    {["1-10", "11-30", "31-75", "76+"].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={twoCol}>
                <Field label="Urgency">
                  <select
                    value={form.urgency}
                    onChange={(e) => update("urgency", e.target.value as Urgency)}
                    style={inputStyle}
                  >
                    {["ASAP", "2-4 weeks", "1-2 months", "Exploring"].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Process readiness">
                  <select
                    value={form.readiness}
                    onChange={(e) => update("readiness", e.target.value as Readiness)}
                    style={inputStyle}
                  >
                    {[
                      "Process documented",
                      "Somewhat documented",
                      "Need help mapping",
                    ].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Current tools">
                <ToggleGrid
                  options={TOOL_OPTIONS}
                  selected={form.currentTools}
                  onToggle={(v) => toggleArrayValue("currentTools", v)}
                />
              </Field>

              <Field label="Main pain points">
                <ToggleGrid
                  options={PAIN_OPTIONS}
                  selected={form.painPoints}
                  onToggle={(v) => toggleArrayValue("painPoints", v)}
                />
              </Field>

              <Field label="What workflows do you want fixed first?">
                <ToggleGrid
                  options={WORKFLOW_OPTIONS}
                  selected={form.workflowsNeeded}
                  onToggle={(v) => toggleArrayValue("workflowsNeeded", v)}
                />
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Example: We use QuickBooks and Gmail, but all job updates happen over text messages and follow-up is inconsistent."
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                />
              </Field>

              <div
                className="card"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.10)",
                }}
              >
                <div className="cardInner" style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 950 }}>Current recommendation preview</div>
                  <div className="p">
                    <strong>{recommendation.tierLabel}</strong> • {recommendation.priceRange}
                  </div>
                  <div className="p" style={{ marginTop: 0 }}>
                    {recommendation.summary}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="submit" className="btn btnPrimary" disabled={submitting}>
                  {submitting ? "Saving intake..." : "Save Intake + Continue to Ops Booking"}
                  <span className="btnArrow">→</span>
                </button>

                <Link className="btn btnGhost" href="/build">
                  Website Quote Instead
                </Link>
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 850, color: "rgba(255,255,255,0.94)" }}>{label}</span>
      {children}
    </label>
  );
}

function ToggleGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            style={{
              borderRadius: 999,
              padding: "10px 12px",
              border: active
                ? "1px solid rgba(255,122,24,0.45)"
                : "1px solid rgba(255,255,255,0.14)",
              background: active ? "rgba(255,122,24,0.12)" : "rgba(255,255,255,0.03)",
              color: active ? "rgba(255,235,220,0.98)" : "rgba(255,255,255,0.88)",
              cursor: "pointer",
              fontSize: 13,
              lineHeight: 1.2,
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function getRecommendation(form: IntakeState) {
  let score = 0;

  score += form.workflowsNeeded.length;
  score += Math.min(form.painPoints.length, 4);

  if (form.teamSize === "6-10") score += 1;
  if (form.teamSize === "11-20") score += 2;
  if (form.teamSize === "20+") score += 3;

  if (form.jobVolume === "11-30") score += 1;
  if (form.jobVolume === "31-75") score += 2;
  if (form.jobVolume === "76+") score += 3;

  if (form.urgency === "ASAP") score += 2;
  if (form.urgency === "2-4 weeks") score += 1;

  if (form.readiness === "Need help mapping") score += 1;

  let tierLabel = "Quick Win Setup";
  let priceRange = "$500–$1,200";
  let summary =
    "Best for one or two workflow fixes (like intake + invoice reminders) with a fast setup and minimal disruption.";

  if (score >= 6 && score < 10) {
    tierLabel = "Operations Upgrade";
    priceRange = "$1,200–$3,000";
    summary =
      "Best for growing businesses that need multiple connected workflows (lead handling, job tracking, invoicing, and reporting).";
  }

  if (score >= 10) {
    tierLabel = "Custom Workflow Platform";
    priceRange = "$3,000+";
    summary =
      "Best for multi-step operations, team workflows, custom dashboards, and deeper integrations across your tools.";
  }

  return { score, tierLabel, priceRange, summary };
}

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

const threeCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};