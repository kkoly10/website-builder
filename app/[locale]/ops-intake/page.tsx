"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getOpsPricing, PRICING_MESSAGES } from "@/lib/pricing";

type OpsFormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  teamSize: string;
  jobVolume: string;
  monthlyRevenue: string;
  currentWebsite: string;
  budgetRange: string;
  currentTools: string[];
  painPoints: string[];
  triedBefore: string;
  workflowsNeeded: string[];
  urgency: string;
  readiness: string;
  notes: string;
};

const TOOLS_LIST = [
  "QuickBooks / Xero",
  "HubSpot / Salesforce",
  "Clio / PracticePanther",
  "Stripe / Square",
  "Google Sheets / Excel",
  "Legacy Industry Software",
];

const PAIN_POINTS_LIST = [
  "Too much manual data entry",
  "Software systems don't talk to each other",
  "Leads falling through the cracks",
  "Billing is delayed or inconsistent",
  "Client onboarding takes too long",
  "No visibility into what's happening in the business",
];

const WORKFLOWS_LIST = [
  "Automated Client Intake",
  "CRM to Billing Sync",
  "Operations Dashboard",
  "Automated Follow-ups",
  "Lead Routing & Assignment",
  "Invoice & Payment Automation",
];

const BUDGET_OPTIONS = [
  "Under $1,000",
  "$1,000 - $2,000",
  "$2,000 - $4,000",
  "$4,000 - $8,000",
  "$8,000+",
  "Not sure yet",
];

const REVENUE_OPTIONS = [
  "Under $10k/mo",
  "$10k - $50k/mo",
  "$50k - $200k/mo",
  "$200k+/mo",
  "Prefer not to say",
];

const URGENCY_OPTIONS = [
  "ASAP - this is costing us now",
  "Within the next month",
  "Next 2-3 months",
  "Exploring options",
];

const TRIED_BEFORE_OPTIONS = [
  "No - first time addressing this",
  "Yes - tried to fix it internally",
  "Yes - hired someone and it didn't work",
  "Yes - using a tool but it's not working",
];

export default function OpsIntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OpsFormState>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    teamSize: "1-5 employees",
    jobVolume: "10-50 per month",
    monthlyRevenue: "Prefer not to say",
    currentWebsite: "",
    budgetRange: "Not sure yet",
    currentTools: [],
    painPoints: [],
    triedBefore: "No - first time addressing this",
    workflowsNeeded: [],
    urgency: "Exploring options",
    readiness: "Just doing research",
    notes: "",
  });

  const recommendation = useMemo(
    () =>
      getOpsPricing({
        companyName: form.companyName,
        industry: form.industry,
        teamSize: form.teamSize,
        jobVolume: form.jobVolume,
        monthlyRevenue: form.monthlyRevenue,
        budgetRange: form.budgetRange,
        currentTools: form.currentTools,
        painPoints: form.painPoints,
        triedBefore: form.triedBefore,
        workflowsNeeded: form.workflowsNeeded,
        urgency: form.urgency,
        readiness: form.readiness,
        notes: form.notes,
      }),
    [form]
  );

  const toggleArray = (
    field: "currentTools" | "painPoints" | "workflowsNeeded",
    v: string
  ) => {
    setForm((p) => ({
      ...p,
      [field]: p[field].includes(v)
        ? p[field].filter((i) => i !== v)
        : [...p[field], v],
    }));
  };

  function canAdvance() {
    if (step === 1) {
      return form.companyName.trim().length > 0 && form.contactName.trim().length > 0;
    }
    return true;
  }

  async function submit() {
    if (!form.email.trim().includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ops/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          recommendation: {
            score: recommendation.complexityScore,
            tierLabel: recommendation.tierLabel,
            priceRange: recommendation.displayRange,
            summary: recommendation.summary,
            pricingVersion: recommendation.version,
            position: recommendation.position,
            isCustomScope: recommendation.isCustomScope,
            band: recommendation.band,
            reasons: recommendation.reasons,
            complexityFlags: recommendation.complexityFlags,
          },
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();
      router.push(data.nextUrl || "/ops-thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const stepTitles = [
    "",
    "The Basics",
    "Your Tools & Pain Points",
    "Goals & Budget",
    "Review & Submit",
  ];

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <div className="kicker">
        <span className="kickerDot" /> Workflow Audit
      </div>
      <h1 className="h1" style={{ marginTop: 12 }}>
        Business Systems Intake
      </h1>
      <p className="p" style={{ marginBottom: 24 }}>
        Step {step} of 4 — {stepTitles[step]}
      </p>

      <div
        style={{
          height: 4,
          background: "var(--stroke)",
          borderRadius: 99,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(step / 4) * 100}%`,
            height: "100%",
            background: "var(--accent)",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <section className="card">
        <div className="cardInner" style={{ display: "grid", gap: 20 }}>
          {step === 1 && (
            <>
              <h2 className="h2">Tell us about your business</h2>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">Company Name *</label>
                  <input
                    className="input"
                    placeholder="Acme Corp"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="fieldLabel">Your Name *</label>
                  <input
                    className="input"
                    placeholder="Jane Smith"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="fieldLabel">Industry</label>
                <input
                  className="input"
                  placeholder="e.g. Legal, HVAC, Real Estate"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">Team Size</label>
                  <select
                    className="select"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                  >
                    <option>1-5 employees</option>
                    <option>6-15 employees</option>
                    <option>16-50 employees</option>
                    <option>50+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="fieldLabel">Monthly Client Volume</label>
                  <select
                    className="select"
                    value={form.jobVolume}
                    onChange={(e) => setForm({ ...form, jobVolume: e.target.value })}
                  >
                    <option>Under 10 per month</option>
                    <option>10-50 per month</option>
                    <option>50-200 per month</option>
                    <option>200+ per month</option>
                  </select>
                </div>
              </div>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">Monthly Revenue (optional)</label>
                  <select
                    className="select"
                    value={form.monthlyRevenue}
                    onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                  >
                    {REVENUE_OPTIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fieldLabel">Current Website (if any)</label>
                  <input
                    className="input"
                    placeholder="https://yoursite.com"
                    value={form.currentWebsite}
                    onChange={(e) => setForm({ ...form, currentWebsite: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h2">Your Tools & Pain Points</h2>
              <div>
                <label className="fieldLabel">
                  Software you currently use (select all that apply)
                </label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {TOOLS_LIST.map((t) => (
                    <CheckRow
                      key={t}
                      label={t}
                      checked={form.currentTools.includes(t)}
                      onChange={() => toggleArray("currentTools", t)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">
                  What is causing the most pain? (select all that apply)
                </label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {PAIN_POINTS_LIST.map((p) => (
                    <CheckRow
                      key={p}
                      label={p}
                      checked={form.painPoints.includes(p)}
                      onChange={() => toggleArray("painPoints", p)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">Have you tried to fix this before?</label>
                <select
                  className="select"
                  value={form.triedBefore}
                  onChange={(e) => setForm({ ...form, triedBefore: e.target.value })}
                >
                  {TRIED_BEFORE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h2">Goals & Budget</h2>
              <div>
                <label className="fieldLabel">
                  Workflows you want built (select all that apply)
                </label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {WORKFLOWS_LIST.map((w) => (
                    <CheckRow
                      key={w}
                      label={w}
                      checked={form.workflowsNeeded.includes(w)}
                      onChange={() => toggleArray("workflowsNeeded", w)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">What is your budget range?</label>
                <select
                  className="select"
                  value={form.budgetRange}
                  onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fieldLabel">How urgent is this?</label>
                <select
                  className="select"
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  {URGENCY_OPTIONS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fieldLabel">Anything else we should know?</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Specific tools, deadlines, constraints..."
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div
                style={{
                  background: "rgba(255,122,24,0.08)",
                  border: "1px solid rgba(255,122,24,0.3)",
                  padding: 20,
                  borderRadius: 12,
                }}
              >
                <div className="fieldLabel" style={{ color: "var(--accent)" }}>
                  Recommended Engagement
                </div>
                <div style={{ fontSize: 28, fontWeight: 950, marginTop: 6 }}>
                  {recommendation.tierLabel}
                </div>
                <div className="pDark" style={{ marginTop: 8 }}>
                  {recommendation.isCustomScope ? recommendation.publicMessage : recommendation.displayRange}
                </div>
                <div className="smallNote" style={{ marginTop: 8 }}>
                  {recommendation.summary}
                </div>
              </div>

              {recommendation.complexityFlags.length > 0 ? (
                <div>
                  <div className="fieldLabel">Complexity flags</div>
                  <div className="pills" style={{ marginTop: 10 }}>
                    {recommendation.complexityFlags.map((flag) => (
                      <span key={flag} className="pill">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h2 className="h2">Where should we send your audit?</h2>
                <div className="grid2">
                  <div>
                    <label className="fieldLabel">Email Address *</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="fieldLabel">Phone (Optional)</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div className="fieldLabel">Why it landed here</div>
                {recommendation.reasons.map((reason, idx) => (
                  <div
                    key={`${reason.label}-${idx}`}
                    style={{
                      border: "1px solid var(--stroke)",
                      background: "var(--panel2)",
                      borderRadius: 10,
                      padding: "12px 12px",
                    }}
                  >
                    <div style={{ color: "var(--fg)", fontWeight: 800 }}>{reason.label}</div>
                    <div className="pDark" style={{ marginTop: 4 }}>
                      {reason.note}
                    </div>
                  </div>
                ))}
              </div>

              <div className="smallNote">{PRICING_MESSAGES.depositPolicy}</div>

              {error ? <div style={{ color: "#ff6b6b", fontSize: 14 }}>{error}</div> : null}
            </>
          )}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        {step > 1 ? (
          <button className="btn btnGhost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            className="btn btnPrimary"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            style={{ opacity: canAdvance() ? 1 : 0.5 }}
          >
            Continue <span className="btnArrow">→</span>
          </button>
        ) : (
          <button className="btn btnPrimary" onClick={submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Audit →"}
          </button>
        )}
      </div>
    </main>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className="checkRow"
      style={{
        cursor: "pointer",
        background: checked ? "var(--accentSoft)" : "var(--bg2)",
        borderColor: checked ? "var(--accentStroke)" : "var(--stroke)",
      }}
    >
      <div className="checkLeft">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ accentColor: "var(--accent)" }}
        />
        <div className="checkLabel">{label}</div>
      </div>
    </label>
  );
}