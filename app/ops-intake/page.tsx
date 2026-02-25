"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OpsFormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  teamSize: string;
  jobVolume: string;      // ADDED: Matches API
  currentTools: string[];
  painPoints: string[];
  workflowsNeeded: string[];
  urgency: string;
  readiness: string;      // ADDED: Matches API
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
  "Leads or patients are falling through the cracks",
  "Invoices and billing are delayed",
  "Onboarding takes too much staff time",
];

const WORKFLOWS_LIST = [
  "Automated Patient/Client Intake",
  "CRM to Billing Integration",
  "Custom Operations Dashboard",
  "Automated Follow-ups & Reminders",
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
    teamSize: "1-5",
    jobVolume: "10-50 per month",
    currentTools: [],
    painPoints: [],
    workflowsNeeded: [],
    urgency: "Exploring options",
    readiness: "Just doing research",
    notes: "",
  });

  const toggleArray = (field: "currentTools" | "painPoints" | "workflowsNeeded", value: string) => {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((i) => i !== value) : [...arr, value],
      };
    });
  };

  async function submit() {
    if (!form.companyName || !form.contactName || !form.email) {
      setError("Company, name, and email are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ops/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Submission failed");

      // Redirects securely to your booking page
      router.push(data.nextUrl || "/ops-thank-you");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Workflow Audit
      </div>
      
      <div style={{ height: 12 }} />
      
      <h1 className="h1">Business Systems Intake</h1>
      <p className="p" style={{ marginTop: 10, marginBottom: 24 }}>
        Step {step} of 4 — Let's identify where your operations are slowing down.
      </p>

      <section className="card">
        <div className="cardInner" style={{ display: "grid", gap: 20 }}>
          
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <>
              <h2 className="h2" style={{ fontSize: 24 }}>The Basics</h2>
              
              <div style={{ display: "grid", gap: 6 }}>
                <div className="fieldLabel">Company / Clinic Name *</div>
                <input className="input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div className="fieldLabel">Industry</div>
                <input className="input" placeholder="e.g. Dental, Legal, B2B Agency" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>

              <div className="grid2">
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="fieldLabel">Team Size</div>
                  <select className="select" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })}>
                    <option>1-5</option>
                    <option>6-15</option>
                    <option>16-50</option>
                    <option>50+</option>
                  </select>
                </div>
                
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="fieldLabel">Client/Job Volume</div>
                  <select className="select" value={form.jobVolume} onChange={(e) => setForm({ ...form, jobVolume: e.target.value })}>
                    <option>Under 10 per month</option>
                    <option>10-50 per month</option>
                    <option>50-200 per month</option>
                    <option>200+ per month</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: TECH STACK & PAIN */}
          {step === 2 && (
            <>
              <h2 className="h2" style={{ fontSize: 24 }}>The Stack & The Pain</h2>
              
              <div>
                <div className="fieldLabel">What software are you currently using?</div>
                <div className="checkGrid" style={{ marginTop: 8 }}>
                  {TOOLS_LIST.map((tool) => (
                    <label key={tool} className="checkRow" style={{ cursor: "pointer" }}>
                      <div className="checkLeft">
                        <input type="checkbox" className="check" checked={form.currentTools.includes(tool)} onChange={() => toggleArray("currentTools", tool)} />
                        <div className="checkLabel">{tool}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="fieldLabel">What is the biggest operational bottleneck right now?</div>
                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  {PAIN_POINTS_LIST.map((pain) => (
                    <label key={pain} className="checkRow" style={{ cursor: "pointer" }}>
                      <div className="checkLeft">
                        <input type="checkbox" className="check" checked={form.painPoints.includes(pain)} onChange={() => toggleArray("painPoints", pain)} />
                        <div className="checkLabel" style={{ whiteSpace: "normal" }}>{pain}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: GOALS & TIMELINE */}
          {step === 3 && (
            <>
              <h2 className="h2" style={{ fontSize: 24 }}>The Goal</h2>
              
              <div>
                <div className="fieldLabel">What workflows do you want to automate?</div>
                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  {WORKFLOWS_LIST.map((workflow) => (
                    <label key={workflow} className="checkRow" style={{ cursor: "pointer" }}>
                      <div className="checkLeft">
                        <input type="checkbox" className="check" checked={form.workflowsNeeded.includes(workflow)} onChange={() => toggleArray("workflowsNeeded", workflow)} />
                        <div className="checkLabel">{workflow}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="fieldLabel">How urgent is this fix?</div>
                  <select className="select" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                    <option>Exploring options</option>
                    <option>Within 30 days</option>
                    <option>ASAP - System is actively broken</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div className="fieldLabel">Project Readiness</div>
                  <select className="select" value={form.readiness} onChange={(e) => setForm({ ...form, readiness: e.target.value })}>
                    <option>Just doing research</option>
                    <option>Budget is approved</option>
                    <option>Ready to hire someone now</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div className="fieldLabel">Any specific details or context?</div>
                <textarea className="textarea" rows={4} placeholder="e.g., We spend 15 hours a week copying data from intake forms to QuickBooks." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </>
          )}

          {/* STEP 4: CONTACT */}
          {step === 4 && (
            <>
              <h2 className="h2" style={{ fontSize: 24 }}>Contact Details</h2>
              
              <div style={{ display: "grid", gap: 6 }}>
                <div className="fieldLabel">Your Name *</div>
                <input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div className="fieldLabel">Email Address *</div>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div className="fieldLabel">Phone Number</div>
                <input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              {error && (
                <div style={{ 
                  border: "1px solid rgba(255,80,80,0.35)", 
                  background: "rgba(255,80,80,0.08)", 
                  borderRadius: 12, 
                  padding: 12, 
                  color: "#ffb4b4", 
                  fontWeight: 800 
                }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        {step > 1 ? (
          <button className="btn btnGhost" onClick={() => setStep(step - 1)}>
             ← Back
          </button>
        ) : <div />}

        {step < 4 ? (
          <button className="btn btnPrimary" onClick={() => setStep(step + 1)}>
             Next Step →
          </button>
        ) : (
          <button className="btn btnPrimary" onClick={submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Workflow Audit"} <span className="btnArrow">→</span>
          </button>
        )}
      </div>
    </main>
  );
}
