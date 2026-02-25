"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OpsFormState = {
  companyName: string; contactName: string; email: string; phone: string;
  industry: string; teamSize: string; jobVolume: string; currentTools: string[];
  painPoints: string[]; workflowsNeeded: string[]; urgency: string; readiness: string; notes: string;
};

const TOOLS_LIST = ["QuickBooks / Xero", "HubSpot / Salesforce", "Clio / PracticePanther", "Stripe / Square", "Google Sheets / Excel", "Legacy Industry Software"];
const PAIN_POINTS_LIST = ["Too much manual data entry", "Software systems don't talk", "Leads falling through cracks", "Billing is delayed", "Onboarding takes too long"];
const WORKFLOWS_LIST = ["Automated Intake", "CRM to Billing Sync", "Operations Dashboard", "Automated Follow-ups"];

export default function OpsIntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OpsFormState>({
    companyName: "", contactName: "", email: "", phone: "", industry: "",
    teamSize: "1-5", jobVolume: "10-50 per month", currentTools: [],
    painPoints: [], workflowsNeeded: [], urgency: "Exploring options",
    readiness: "Just doing research", notes: "",
  });

  const getEstimate = () => {
    let base = 1500;
    base += form.workflowsNeeded.length * 500;
    if (form.teamSize === "16-50") base += 2000;
    if (form.teamSize === "50+") base += 4500;
    return `$${base.toLocaleString()} – $${Math.round(base * 1.5).toLocaleString()}`;
  };

  const toggleArray = (field: "currentTools" | "painPoints" | "workflowsNeeded", v: string) => {
    setForm(p => ({ ...p, [field]: p[field].includes(v) ? p[field].filter(i => i !== v) : [...p[field], v] }));
  };

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recommendation: { priceRange: getEstimate(), tierLabel: "Growth Build" } }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();
      router.push(data.nextUrl || "/ops-thank-you");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <div className="kicker"><span className="kickerDot" /> Workflow Audit</div>
      <h1 className="h1" style={{ marginTop: 12 }}>Business Systems Intake</h1>
      <p className="p" style={{ marginBottom: 24 }}>Step {step} of 4 — Analyzing your operations.</p>

      <section className="card">
        <div className="cardInner" style={{ display: "grid", gap: 20 }}>
          {step === 1 && (
            <>
              <h2 className="h2">The Basics</h2>
              <input className="input" placeholder="Company Name *" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
              <input className="input" placeholder="Industry" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} />
              <div className="grid2">
                <select className="select" value={form.teamSize} onChange={e => setForm({...form, teamSize: e.target.value})}>
                  <option>1-5 employees</option><option>6-15 employees</option><option>16-50 employees</option><option>50+ employees</option>
                </select>
                <select className="select" value={form.jobVolume} onChange={e => setForm({...form, jobVolume: e.target.value})}>
                  <option>Under 10 jobs/mo</option><option>10-50 jobs/mo</option><option>50-200 jobs/mo</option><option>200+ jobs/mo</option>
                </select>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="h2">The Tech & The Pain</h2>
              <div className="fieldLabel">Software you use:</div>
              <div className="checkGrid">{TOOLS_LIST.map(t => <label key={t} className="checkRow"><input type="checkbox" checked={form.currentTools.includes(t)} onChange={() => toggleArray("currentTools", t)}/> {t}</label>)}</div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="h2">Goals</h2>
              <div className="fieldLabel">Workflows needed:</div>
              <div className="checkGrid">{WORKFLOWS_LIST.map(w => <label key={w} className="checkRow"><input type="checkbox" checked={form.workflowsNeeded.includes(w)} onChange={() => toggleArray("workflowsNeeded", w)}/> {w}</label>)}</div>
            </>
          )}
          {step === 4 && (
            <>
              <div style={{ background: "rgba(255,122,24,0.1)", border: "1px solid rgba(255,122,24,0.3)", padding: 16, borderRadius: 12 }}>
                <div className="fieldLabel" style={{ color: "#ff9a4d" }}>Projected Investment Range</div>
                <div style={{ fontSize: 24, fontWeight: 950 }}>{getEstimate()}</div>
                <div className="smallNote" style={{ marginTop: 4 }}>Based on your requirements. Final scope confirmed via call.</div>
              </div>
              <h2 className="h2">Contact Details</h2>
              <input className="input" placeholder="Your Name *" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} />
              <input className="input" placeholder="Email *" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </>
          )}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        {step > 1 && <button className="btn btnGhost" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 4 ? <button className="btn btnPrimary" onClick={() => setStep(step + 1)}>Next →</button> : <button className="btn btnPrimary" onClick={submit} disabled={loading}>{loading ? "Saving..." : "Submit Audit"}</button>}
      </div>
    </main>
  );
}
