"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

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
type Readiness =
  | "Process documented"
  | "Somewhat documented"
  | "Need help mapping";

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

type Recommendation = {
  score: number;
  tierLabel: string;
  priceRange: string;
  summary: string;
};

const TRADE_OPTIONS: Trade[] = [
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
];

const TEAM_OPTIONS: TeamSize[] = ["Solo", "2-5", "6-10", "11-20", "20+"];
const JOB_VOLUME_OPTIONS: JobVolume[] = ["1-10", "11-30", "31-75", "76+"];
const URGENCY_OPTIONS: Urgency[] = ["ASAP", "2-4 weeks", "1-2 months", "Exploring"];
const READINESS_OPTIONS: Readiness[] = [
  "Process documented",
  "Somewhat documented",
  "Need help mapping",
];

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
      // local fallback copy
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

      let opsIntakeId = String(
        data?.opsIntakeId ?? data?.id ?? data?.ops_intake_id ?? ""
      ).trim();

      // Fallback: try parsing from nextUrl if server returned only nextUrl
      if (!opsIntakeId && typeof data?.nextUrl === "string") {
        try {
          const parsed = new URL(data.nextUrl, window.location.origin);
          opsIntakeId = parsed.searchParams.get("opsIntakeId")?.trim() || "";
        } catch {
          // ignore parse failure
        }
      }

      if (!opsIntakeId) {
        throw new Error("Intake saved, but server did not return opsIntakeId.");
      }

      try {
        localStorage.setItem("crecystudio:lastOpsIntakeId", opsIntakeId);
      } catch {
        // ignore localStorage errors
      }

      // Force the correct ops flow route
      router.push(`/ops-book?opsIntakeId=${encodeURIComponent(opsIntakeId)}`);
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
          <div className="card cardHover">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                CrecyStudio Ops • Workflow Review Intake
              </div>

              <div style={{ height: 10 }} />

              <h1 className="h1" style={{ margin: 0 }}>
                Tell me how your business runs now — I’ll map the best workflow fix.
              </h1>

              <p className="p" style={{ marginTop: 12, maxWidth: 780 }}>
                This intake is for invoicing, CRM, lead handling, job tracking, and
                back-office automation. It works for contractors, offices, agencies,
                clinics, and service businesses.
              </p>

              <div className="pills" style={{ marginTop: 10 }}>
                <span className="pill">Billing & invoice reminders</span>
                <span className="pill">CRM workflows</span>
                <span className="pill">Job tracking</span>
                <span className="pill">Dashboards</span>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/build" className="btn btnGhost">
                  Need a Website Quote?
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Current fit estimate</div>

              <div className="statRow">
                <div className="stat">
                  <div className="statNum">{recommendation.tierLabel}</div>
                  <div className="statLab">Recommended tier</div>
                </div>
                <div className="stat">
                  <div className="statNum">{recommendation.priceRange}</div>
                  <div className="statLab">Typical range</div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.02)",
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  Score: {recommendation.score}/100
                </div>
                <div className="p" style={{ marginTop: 0 }}>
                  {recommendation.summary}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>How this works</div>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75 }}>
                  <li>Complete the intake</li>
                  <li>Get routed to the ops booking page</li>
                  <li>Book a workflow review call</li>
                  <li>Get a clear scope + next steps</li>
                </ul>
              </div>

              {error ? (
                <div
                  style={{
                    marginTop: 12,
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

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="card">
            <div className="cardInner">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Workflow Automation Intake
              </div>

              <div style={{ height: 10 }} />
              <h2 className="h2" style={{ margin: 0 }}>
                Fill this out once and use it as the source of truth for the review call
              </h2>

              <div style={{ height: 14 }} />

              <div style={grid2}>
                <Field label="Company name" required>
                  <input
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="Example: Stafford Comfort Plumbing"
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Contact name" required>
                  <input
                    value={form.contactName}
                    onChange={(e) => update("contactName", e.target.value)}
                    placeholder="Owner / Manager"
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Email" required>
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

                <Field label="Industry / business type">
                  <select
                    value={form.trade}
                    onChange={(e) => update("trade", e.target.value as Trade)}
                    style={inputStyle}
                  >
                    {TRADE_OPTIONS.map((v) => (
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
                    {TEAM_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Jobs / clients per month">
                  <select
                    value={form.jobVolume}
                    onChange={(e) => update("jobVolume", e.target.value as JobVolume)}
                    style={inputStyle}
                  >
                    {JOB_VOLUME_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Urgency">
                  <select
                    value={form.urgency}
                    onChange={(e) => update("urgency", e.target.value as Urgency)}
                    style={inputStyle}
                  >
                    {URGENCY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="How ready are your processes?">
                  <select
                    value={form.readiness}
                    onChange={(e) => update("readiness", e.target.value as Readiness)}
                    style={inputStyle}
                  >
                    {READINESS_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={{ height: 10 }} />

              <MultiSelectBlock
                title="Current tools"
                subtitle="Select what you currently use"
                options={TOOL_OPTIONS}
                selected={form.currentTools}
                onToggle={(v) => toggleArrayValue("currentTools", v)}
              />

              <div style={{ height: 10 }} />

              <MultiSelectBlock
                title="Main pain points"
                subtitle="Pick the biggest blockers"
                options={PAIN_OPTIONS}
                selected={form.painPoints}
                onToggle={(v) => toggleArrayValue("painPoints", v)}
              />

              <div style={{ height: 10 }} />

              <MultiSelectBlock
                title="What workflows do you want fixed?"
                subtitle="Choose what you want help building"
                options={WORKFLOW_OPTIONS}
                selected={form.workflowsNeeded}
                onToggle={(v) => toggleArrayValue("workflowsNeeded", v)}
              />

              <div style={{ height: 10 }} />

              <Field label="Extra notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Anything else? (billing issues, no-shows, team handoff problems, lead response delays, etc.)"
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                />
              </Field>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                <Link href="/" className="btn btnGhost">
                  Back Home
                </Link>

                <button className="btn btnPrimary" type="submit" disabled={submitting}>
                  {submitting ? "Saving intake..." : "Continue to Ops Booking"}
                  <span className="btnArrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function getRecommendation(form: IntakeState): Recommendation {
  let score = 25;

  // Size / volume
  score +=
    form.teamSize === "Solo"
      ? 4
      : form.teamSize === "2-5"
      ? 10
      : form.teamSize === "6-10"
      ? 14
      : form.teamSize === "11-20"
      ? 18
      : 22;

  score +=
    form.jobVolume === "1-10"
      ? 4
      : form.jobVolume === "11-30"
      ? 10
      : form.jobVolume === "31-75"
      ? 16
      : 22;

  // Urgency and readiness
  if (form.urgency === "ASAP") score += 10;
  else if (form.urgency === "2-4 weeks") score += 7;
  else if (form.urgency === "1-2 months") score += 4;
  else score += 1;

  if (form.readiness === "Need help mapping") score += 10;
  else if (form.readiness === "Somewhat documented") score += 6;
  else score += 3;

  // Complexity / pain
  score += Math.min(form.painPoints.length * 4, 20);
  score += Math.min(form.workflowsNeeded.length * 4, 20);

  if (form.currentTools.includes("No real system (manual)")) score += 10;
  if (form.currentTools.includes("Google Sheets")) score += 3;
  if (
    form.currentTools.includes("Jobber") ||
    form.currentTools.includes("Housecall Pro")
  ) {
    score += 2; // easier integrations but still process cleanup value
  }

  // Industry nudge (service businesses benefit a lot)
  if (
    ["Plumbing", "Electrical", "HVAC", "Cleaning", "Landscaping", "Auto Shop"].includes(
      form.trade
    )
  ) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  let tierLabel = "Starter Workflow Fix";
  let priceRange = "$450–$900";
  let summary =
    "Best for one or two workflows (like invoicing reminders or lead follow-up) with a simple setup.";

  if (score >= 50) {
    tierLabel = "Growth Ops System";
    priceRange = "$900–$1,800";
    summary =
      "Good fit for multi-step workflow cleanup: lead intake, quoting, invoicing reminders, and tracking dashboards.";
  }

  if (score >= 75) {
    tierLabel = "Full Ops Build";
    priceRange = "$1,800–$4,000+";
    summary =
      "Best for businesses needing a full systems overhaul: CRM, job tracking, billing automation, reporting, and team handoff workflows.";
  }

  return { score, tierLabel, priceRange, summary };
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 800 }}>
        {label} {required ? <span style={{ opacity: 0.8 }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

function MultiSelectBlock({
  title,
  subtitle,
  options,
  selected,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.02)",
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 850 }}>{title}</div>
      {subtitle ? (
        <div className="p" style={{ marginTop: 4 }}>
          {subtitle}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 10,
                padding: "8px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: checked ? "rgba(255,122,24,0.10)" : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                style={{ width: 16, height: 16 }}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

const grid2: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
