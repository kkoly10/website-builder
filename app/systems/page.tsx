"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Trade =
  | "Plumbing"
  | "Electrical"
  | "HVAC"
  | "Cleaning"
  | "Landscaping"
  | "Auto Shop"
  | "Agency"
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
  const [form, setForm] = useState<IntakeState>(initialState);
  const [submitted, setSubmitted] = useState(false);

  const recommendation = useMemo(() => getRecommendation(form), [form]);

  function update<K extends keyof IntakeState>(key: K, value: IntakeState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue(key: "currentTools" | "painPoints" | "workflowsNeeded", value: string) {
    setForm((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      return {
        ...prev,
        [key]: exists ? list.filter((x) => x !== value) : [...list, value],
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      localStorage.setItem(
        "crecystudio:lastOpsIntake",
        JSON.stringify({
          ...form,
          recommendation,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore localStorage issues
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 10 }}>
        <div className="heroGrid">
          <div className="card cardHover">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio Ops • Workflow Review Intake
              </div>

              <div style={{ height: 14 }} />

              <h1 className="h1">
                Tell me how your business runs now — I’ll map the{" "}
                <span className="underline">best workflow fix</span>.
              </h1>

              <p className="p" style={{ marginTop: 12, maxWidth: 760 }}>
                This intake is for invoicing, CRM, lead handling, job tracking, and back-office automation.
                Great for contractors, home-service businesses, and small teams that want cleaner systems.
              </p>

              <div className="pills" style={{ marginTop: 14 }}>
                <span className="pill">Billing & invoice reminders</span>
                <span className="pill">CRM workflows</span>
                <span className="pill">Job tracking</span>
                <span className="pill">Dashboards</span>
              </div>

              <div className="heroActions" style={{ marginTop: 14 }}>
                <Link href="/book?service=ops" className="btn btnGhost">
                  Book a Call Instead
                </Link>
                <Link href="/build" className="btn btnGhost">
                  Need a Website Quote?
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="statRow">
              <div className="stat">
                <div className="statNum">{recommendation.tierLabel}</div>
                <div className="statLab">Current fit</div>
              </div>
              <div className="stat">
                <div className="statNum">{recommendation.priceRange}</div>
                <div className="statLab">Estimated range</div>
              </div>
            </div>

            <div className="cardInner">
              <div style={{ fontWeight: 950, marginBottom: 10 }}>How this works</div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.84)" }}>
                <li>Answer the intake questions</li>
                <li>See a recommended service tier</li>
                <li>Book a 15-minute workflow review</li>
                <li>Get a clear scope + next steps</li>
              </ul>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="badge badgeHot">Fastest path to a quote</span>
                <span className="badge">No pressure call</span>
              </div>

              {submitted && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,122,24,0.28)",
                    background: "rgba(255,122,24,0.08)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  Intake saved. Your current fit is <strong>{recommendation.tierLabel}</strong>{" "}
                  ({recommendation.priceRange}). Next step: book your workflow review.
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <Link className="btn btnPrimary" href="/book?service=ops">
                  Book Workflow Review <span className="btnArrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="cardInner">
              <h2 className="h2" style={{ margin: 0 }}>
                Workflow Automation Intake
              </h2>
              <p className="p" style={{ marginTop: 8 }}>
                Fill this out once and use it as your source of truth for the review call.
              </p>

              <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                <Field label="Company Name">
                  <input
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Example: Stafford Comfort Plumbing"
                    style={inputStyle}
                    required
                  />
                </Field>

                <div style={twoCol}>
                  <Field label="Your Name">
                    <input
                      value={form.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      placeholder="Owner / Manager"
                      style={inputStyle}
                      required
                    />
                  </Field>

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
                </div>

                <div style={twoCol}>
                  <Field label="Phone">
                    <input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="(555) 555-5555"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Industry / Trade">
                    <select
                      value={form.trade}
                      onChange={(e) => update("trade", e.target.value as Trade)}
                      style={inputStyle}
                    >
                      {["Plumbing", "Electrical", "HVAC", "Cleaning", "Landscaping", "Auto Shop", "Agency", "Other"].map(
                        (v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                </div>

                <div style={threeCol}>
                  <Field label="Team Size">
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

                  <Field label="Jobs / Projects per Month">
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

                  <Field label="Timeline">
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
                </div>

                <Field label="How documented is your current process?">
                  <select
                    value={form.readiness}
                    onChange={(e) => update("readiness", e.target.value as Readiness)}
                    style={inputStyle}
                  >
                    {["Process documented", "Somewhat documented", "Need help mapping"].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="What tools do you already use?">
                  <ToggleGrid
                    options={TOOL_OPTIONS}
                    selected={form.currentTools}
                    onToggle={(v) => toggleArrayValue("currentTools", v)}
                  />
                </Field>

                <Field label="What are your biggest pain points?">
                  <ToggleGrid
                    options={PAIN_OPTIONS}
                    selected={form.painPoints}
                    onToggle={(v) => toggleArrayValue("painPoints", v)}
                  />
                </Field>

                <Field label="What do you want automated or cleaned up first?">
                  <ToggleGrid
                    options={WORKFLOW_OPTIONS}
                    selected={form.workflowsNeeded}
                    onToggle={(v) => toggleArrayValue("workflowsNeeded", v)}
                  />
                </Field>

                <Field label="Anything else I should know? (optional)">
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
                  <button type="submit" className="btn btnPrimary">
                    Save Intake + Get Recommendation <span className="btnArrow">→</span>
                  </button>

                  <Link className="btn btnGhost" href="/book?service=ops">
                    Book Review Call
                  </Link>
                </div>

                {submitted && (
                  <div className="p" style={{ color: "rgba(255,255,255,0.78)" }}>
                    Next step: click <strong>Book Review Call</strong> so we can turn this into a clean scope and quote.
                  </div>
                )}
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
              border: active ? "1px solid rgba(255,122,24,0.45)" : "1px solid rgba(255,255,255,0.14)",
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

  // workflow count
  score += form.workflowsNeeded.length;

  // pain count
  score += Math.min(form.painPoints.length, 4);

  // team size
  if (form.teamSize === "6-10") score += 1;
  if (form.teamSize === "11-20") score += 2;
  if (form.teamSize === "20+") score += 3;

  // job volume
  if (form.jobVolume === "11-30") score += 1;
  if (form.jobVolume === "31-75") score += 2;
  if (form.jobVolume === "76+") score += 3;

  // urgency
  if (form.urgency === "ASAP") score += 2;
  if (form.urgency === "2-4 weeks") score += 1;

  // readiness penalty (more discovery needed)
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.95)",
  padding: "12px 14px",
  outline: "none",
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const threeCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};