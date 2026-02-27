"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "chooser" | "guided" | "known";
type Intent = "Marketing" | "Leads" | "Booking" | "Selling" | "Content" | "Membership" | "Other";
type WebsiteType = "Business" | "Ecommerce" | "Portfolio" | "Landing";
type Pages = "1" | "1-3" | "4-5" | "6-8" | "9+";
type Design = "Modern" | "Classic" | "Creative";
type Timeline = "2-3 weeks" | "4+ weeks" | "Under 14 days";
type YesNo = "Yes" | "No";
type ContentReady = "Ready" | "Some" | "Not ready";
type AssetsSource = "Client provides" | "Stock" | "Need help";

type FormState = {
  mode: Mode;
  websiteType: WebsiteType;
  intent: Intent;
  intentOther: string;
  pages: Pages;
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: YesNo;
  automationTypes: string[];
  integrations: string[];
  integrationOther: string;
  hasLogo: YesNo;
  hasBrandGuide: YesNo;
  contentReady: ContentReady;
  assetsSource: AssetsSource;
  referenceWebsite: string;
  domainHosting: YesNo;
  decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+";
  design: Design;
  timeline: Timeline;
  notes: string;
  leadEmail: string;
  leadPhone: string;
};

const INTENTS: Intent[] = ["Marketing", "Leads", "Booking", "Selling", "Content", "Membership", "Other"];
const WEBSITE_TYPES: WebsiteType[] = ["Business", "Ecommerce", "Portfolio", "Landing"];
const PAGES: Pages[] = ["1", "1-3", "4-5", "6-8", "9+"];
const DESIGNS: Design[] = ["Modern", "Classic", "Creative"];
const TIMELINES: Timeline[] = ["2-3 weeks", "4+ weeks", "Under 14 days"];

const AUTOMATION_OPTIONS = ["Email confirmations", "Email follow-ups", "SMS reminders", "CRM integration", "Lead routing"];
const INTEGRATION_OPTIONS = ["Google Maps / location", "Calendly / scheduling", "Stripe payments", "PayPal payments", "Mailchimp / email list", "Analytics (GA4 / Pixel)", "Live chat"];

const LS_KEY = "crecystudio:intake";

function BuildFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    mode: "chooser",
    websiteType: "Business",
    intent: "Marketing",
    intentOther: "",
    pages: "1-3",
    booking: false,
    payments: false,
    blog: false,
    membership: false,
    wantsAutomation: "No",
    automationTypes: [],
    integrations: [],
    integrationOther: "",
    hasLogo: "Yes",
    hasBrandGuide: "No",
    contentReady: "Some",
    assetsSource: "Client provides",
    referenceWebsite: "",
    domainHosting: "Yes",
    decisionMaker: "Yes",
    stakeholdersCount: "1",
    design: "Modern",
    timeline: "2-3 weeks",
    notes: "",
    leadEmail: "",
    leadPhone: "",
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") setForm((f) => ({ ...f, ...parsed }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const intent = searchParams.get("intent");
    const websiteType = searchParams.get("websiteType");
    const pages = searchParams.get("pages");
    const timeline = searchParams.get("timeline");

    if (mode || intent || websiteType || pages || timeline) {
      setForm((f) => ({
        ...f,
        mode: mode === "guided" || mode === "known" ? (mode as Mode) : f.mode,
        intent: INTENTS.includes(intent as Intent) ? (intent as Intent) : f.intent,
        websiteType: WEBSITE_TYPES.includes(websiteType as WebsiteType) ? (websiteType as WebsiteType) : f.websiteType,
        pages: PAGES.includes(pages as Pages) ? (pages as Pages) : f.pages,
        timeline: TIMELINES.includes(timeline as Timeline) ? (timeline as Timeline) : f.timeline,
      }));

      // Bypasses Step 0 (Chooser) if parameters are already fed in from the Quiz Intro
      if (mode === "guided" || mode === "known") {
        setStep(1);
      }
    }
  }, [searchParams]);

  const suggested = useMemo(() => {
    const s: Partial<FormState> = {};
    if (form.intent === "Booking") { s.websiteType = "Business"; s.booking = true; }
    if (form.intent === "Leads" || form.intent === "Marketing") { s.websiteType = "Business"; }
    if (form.intent === "Selling") { s.websiteType = "Ecommerce"; s.payments = true; }
    if (form.intent === "Content") { s.websiteType = "Portfolio"; s.blog = true; }
    if (form.intent === "Membership") { s.websiteType = "Business"; s.membership = true; }
    return s;
  }, [form.intent]);

  function goMode(mode: Mode) {
    setForm((f) => ({ ...f, mode }));
    setStep(1);
  }

  function next() { setStep((s) => Math.min(s + 1, 7)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function applySuggested() { setForm((f) => ({ ...f, ...suggested })); }

  function toggleInList(key: "automationTypes" | "integrations", value: string) {
    setForm((f) => {
      const current = new Set(f[key]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...f, [key]: Array.from(current) } as FormState;
    });
  }

  function submit() {
    const leadEmail = form.leadEmail.trim();
    if (!leadEmail || !leadEmail.includes("@")) {
      alert("Please enter a valid email address so we can secure your estimate.");
      return;
    }

    const params = new URLSearchParams({
      leadEmail, leadPhone: form.leadPhone.trim(),
      websiteType: form.websiteType, pages: form.pages,
      booking: String(form.booking), payments: String(form.payments),
      blog: String(form.blog), membership: String(form.membership),
      wantsAutomation: form.wantsAutomation, contentReady: form.contentReady,
      domainHosting: form.domainHosting, design: form.design,
      timeline: form.timeline, mode: form.mode,
      intent: form.intent, intentOther: form.intentOther,
      automationTypes: form.automationTypes.join(","), integrations: form.integrations.join(","),
      integrationOther: form.integrationOther, hasLogo: form.hasLogo,
      hasBrandGuide: form.hasBrandGuide, assetsSource: form.assetsSource,
      referenceWebsite: form.referenceWebsite, decisionMaker: form.decisionMaker,
      stakeholdersCount: form.stakeholdersCount, notes: form.notes,
    }).toString();

    // Clears the cache to prevent old states from loading on the next quote attempt
    window.localStorage.removeItem(LS_KEY);

    router.push(`/estimate?${params}`);
  }

  const stepLabel = step === 0 ? "Choose how you'd like to start" : step === 6 ? "Review & Summary" : step === 7 ? "Final Step: Contact Details" : `Step ${step} of 5`;

  return (
    <div style={{ width: "100%" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Website Builder Quote
      </div>

      <h1 className="h1" style={{ marginTop: 16 }}>Scope your project</h1>
      <p className="p" style={{ marginTop: 10, marginBottom: 24 }}>
        {stepLabel}
      </p>

      {step === 0 && (
        <section className="grid2">
          <div className="panel cardHover" style={{ cursor: "pointer" }} onClick={() => goMode("guided")}>
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 24 }}>Help me decide</h2>
              <p className="pDark" style={{ marginTop: 8 }}>We’ll ask goal-based questions and recommend the best setup.</p>
            </div>
            <div className="panelBody">
              <button className="btn btnPrimary" style={{ width: "100%" }}>Start guided intake <span className="btnArrow">→</span></button>
            </div>
          </div>
          <div className="panel cardHover" style={{ cursor: "pointer" }} onClick={() => goMode("known")}>
            <div className="panelHeader">
              <h2 className="h2" style={{ fontSize: 24 }}>I know what I need</h2>
              <p className="pDark" style={{ marginTop: 8 }}>You already know your requirements. We’ll jump straight to scope.</p>
            </div>
            <div className="panelBody">
              <button className="btn btnGhost" style={{ width: "100%" }}>Start scope intake <span className="btnArrow">→</span></button>
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 24 }}>{form.mode === "guided" ? "What is the primary goal?" : "What type of website?"}</h2>
          </div>
          <div className="panelBody">
            {form.mode === "guided" ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div className="fieldLabel">Primary Business Goal</div>
                  <select className="select" value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value as Intent })}>
                    {INTENTS.map((i) => (<option key={i} value={i}>{i}</option>))}
                  </select>
                </div>
                {form.intent === "Other" && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="fieldLabel">Briefly describe your goal</div>
                    <input className="input" value={form.intentOther} onChange={(e) => setForm({ ...form, intentOther: e.target.value })} placeholder="e.g., recruiting, investor credibility…" />
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div className="fieldLabel">Website Type</div>
                <select className="select" value={form.websiteType} onChange={(e) => setForm({ ...form, websiteType: e.target.value as WebsiteType })}>
                  {WEBSITE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 24 }}>Basic Scope</h2>
          </div>
          <div className="panelBody">
            {form.mode === "guided" && (
              <div style={{ marginBottom: 20, background: "var(--panel2)", padding: 16, borderRadius: 12, border: "1px solid var(--stroke)" }}>
                <div className="fieldLabel" style={{ color: "var(--accent2)" }}>Suggested Setup:</div>
                <ul style={{ margin: "8px 0 16px", paddingLeft: 18, color: "var(--fg)" }}>
                  <li>Type: {suggested.websiteType ?? form.websiteType}</li>
                  {suggested.booking && <li>Booking enabled</li>}
                  {suggested.payments && <li>Payments enabled</li>}
                </ul>
                <button type="button" className="btn btnGhost" style={{ padding: "8px 12px", fontSize: 13 }} onClick={applySuggested}>Apply Suggestion</button>
              </div>
            )}
            <div>
              <div className="fieldLabel">Estimated Total Pages</div>
              <select className="select" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value as Pages })}>
                {PAGES.map((p) => (<option key={p} value={p}>{p === "1" ? "1 (Single Landing Page)" : p}</option>))}
              </select>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 24 }}>Features & Integrations</h2>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            <CheckRow label="Booking / appointments" checked={form.booking} onChange={(v) => setForm({ ...form, booking: v })} />
            <CheckRow label="Payments / checkout" checked={form.payments} onChange={(v) => setForm({ ...form, payments: v })} />
            <CheckRow label="Blog / articles" checked={form.blog} onChange={(v) => setForm({ ...form, blog: v })} />
            <CheckRow label="Membership / gated content" checked={form.membership} onChange={(v) => setForm({ ...form, membership: v })} />
            
            <div style={{ marginTop: 16 }}>
              <div className="fieldLabel">Advanced Automations Needed?</div>
              <select className="select" value={form.wantsAutomation} onChange={(e) => setForm({ ...form, wantsAutomation: e.target.value as YesNo })}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>

            {form.wantsAutomation === "Yes" && (
              <div style={{ padding: 16, background: "var(--panel2)", borderRadius: 12, border: "1px solid var(--stroke)" }}>
                <div className="fieldLabel">Select Automation Types:</div>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {AUTOMATION_OPTIONS.map((a) => (
                    <CheckRow key={a} label={a} checked={form.automationTypes.includes(a)} onChange={() => toggleInList("automationTypes", a)} />
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 16 }}>
              <div className="fieldLabel">3rd Party Integrations</div>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {INTEGRATION_OPTIONS.map((i) => (
                  <CheckRow key={i} label={i} checked={form.integrations.includes(i)} onChange={() => toggleInList("integrations", i)} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 24 }}>Assets & Readiness</h2>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 16 }}>
            <div>
              <div className="fieldLabel">Reference Website (Optional)</div>
              <input className="input" placeholder="e.g. https://competitor.com" value={form.referenceWebsite} onChange={(e) => setForm({ ...form, referenceWebsite: e.target.value })} />
            </div>
            <div className="grid2">
              <div>
                <div className="fieldLabel">Have a Logo?</div>
                <select className="select" value={form.hasLogo} onChange={(e) => setForm({ ...form, hasLogo: e.target.value as YesNo })}><option>Yes</option><option>No</option></select>
              </div>
              <div>
                <div className="fieldLabel">Brand Colors Defined?</div>
                <select className="select" value={form.hasBrandGuide} onChange={(e) => setForm({ ...form, hasBrandGuide: e.target.value as YesNo })}><option>No</option><option>Yes</option></select>
              </div>
            </div>
            <div className="grid2">
              <div>
                <div className="fieldLabel">Content Written?</div>
                <select className="select" value={form.contentReady} onChange={(e) => setForm({ ...form, contentReady: e.target.value as ContentReady })}><option>Ready</option><option>Some</option><option>Not ready</option></select>
              </div>
              <div>
                <div className="fieldLabel">Domain/Hosting Setup?</div>
                <select className="select" value={form.domainHosting} onChange={(e) => setForm({ ...form, domainHosting: e.target.value as YesNo })}><option value="Yes">Yes, I have it</option><option value="No">No, need help</option></select>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 24 }}>Timeline & Details</h2>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 16 }}>
            <div className="grid2">
              <div>
                <div className="fieldLabel">Design Direction</div>
                <select className="select" value={form.design} onChange={(e) => setForm({ ...form, design: e.target.value as Design })}>
                  {DESIGNS.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <div className="fieldLabel">Target Timeline</div>
                <select className="select" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value as Timeline })}>
                  {TIMELINES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            </div>
            <div>
              <div className="fieldLabel">Additional Notes</div>
              <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any specific requirements or features..." />
            </div>
          </div>
        </section>
      )}

      {step === 6 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2" style={{ fontSize: 24 }}>Review Scope</h2>
          </div>
          <div className="panelBody">
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
              <li>Website Type: <strong style={{ color: "var(--fg)" }}>{form.websiteType}</strong></li>
              <li>Total Pages: <strong style={{ color: "var(--fg)" }}>{form.pages}</strong></li>
              <li>Content Readiness: <strong style={{ color: "var(--fg)" }}>{form.contentReady}</strong></li>
              <li>Timeline: <strong style={{ color: "var(--fg)" }}>{form.timeline}</strong></li>
              <li>Features: <strong style={{ color: "var(--fg)" }}>{[form.booking && "Booking", form.payments && "Payments", form.membership && "Membership"].filter(Boolean).join(", ") || "None"}</strong></li>
            </ul>
          </div>
        </section>
      )}

      {step === 7 && (
        <section className="panel" style={{ borderColor: "var(--accentStroke)", boxShadow: "0 0 0 1px var(--accentSoft)" }}>
          <div className="panelHeader" style={{ background: "var(--accentSoft)" }}>
            <h2 className="h2" style={{ fontSize: 24, color: "var(--fg)" }}>Where should we send the estimate?</h2>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 16 }}>
            <div>
              <div className="fieldLabel">Email Address (Required)</div>
              <input className="input" type="email" value={form.leadEmail} onChange={(e) => setForm({ ...form, leadEmail: e.target.value })} placeholder="you@company.com" required />
            </div>
            <div>
              <div className="fieldLabel">Phone Number (Optional)</div>
              <input className="input" type="tel" value={form.leadPhone} onChange={(e) => setForm({ ...form, leadPhone: e.target.value })} placeholder="(555) 555-5555" />
            </div>
          </div>
        </section>
      )}

      {step > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="btn btnGhost" onClick={back}>← Back</button>
          {step < 7 ? (
            <button className="btn btnPrimary" onClick={next}>Continue <span className="btnArrow">→</span></button>
          ) : (
            <button className="btn btnPrimary" onClick={submit}>Generate Estimate <span className="btnArrow">→</span></button>
          )}
        </div>
      )}
    </div>
  );
}

// Suspense Boundary wrapping the page to satisfy Next.js useSearchParams requirements.
export default function BuildPage() {
  return (
    <main className="container" style={{ padding: "60px 0 100px", maxWidth: 760 }}>
      <Suspense fallback={<div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Loading builder...</div>}>
        <BuildFormInner />
      </Suspense>
    </main>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <label className="checkLine" style={{ cursor: "pointer", background: checked ? "var(--accentSoft)" : "var(--bg2)", borderColor: checked ? "var(--accentStroke)" : "var(--stroke)" }}>
      <div className="checkLeft">
        <input type="checkbox" className="check" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="checkLabel">{label}</div>
      </div>
    </label>
  );
}
