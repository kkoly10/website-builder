"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import ScrollReveal from "@/components/site/ScrollReveal";
import { getWebsitePricing } from "@/lib/pricing";

type Mode = "chooser" | "guided" | "known";
type Intent = "Marketing" | "Leads" | "Booking" | "Selling" | "Content" | "Membership" | "Other";
type WebsiteType = "Business" | "Ecommerce" | "Portfolio" | "Landing";
type Pages = "1" | "1-3" | "4-5" | "6-8" | "9+";
type Design = "Modern" | "Classic" | "Creative";
type Timeline = "2-3 weeks" | "4+ weeks" | "Under 14 days";
type YesNo = "Yes" | "No";
type ContentReady = "Ready" | "Some" | "Not ready";
type AssetsSource = "Client provides" | "Stock" | "Need help";
type Budget = "under-2k" | "2k-5k" | "5k-10k" | "10k-plus" | "not-sure";

type FormState = {
  mode: Mode; websiteType: WebsiteType; intent: Intent; intentOther: string;
  pages: Pages; booking: boolean; payments: boolean; blog: boolean; membership: boolean;
  wantsAutomation: YesNo; automationTypes: string[]; integrations: string[];
  integrationOther: string; hasLogo: YesNo; hasBrandGuide: YesNo;
  contentReady: ContentReady; assetsSource: AssetsSource; referenceWebsite: string;
  currentWebsite: string; domainHosting: YesNo; decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+"; budget: Budget; design: Design;
  timeline: Timeline; notes: string; leadEmail: string; leadPhone: string;
};

const INTENTS: Intent[] = ["Marketing", "Leads", "Booking", "Selling", "Content", "Membership", "Other"];
const WEBSITE_TYPES: WebsiteType[] = ["Business", "Ecommerce", "Portfolio", "Landing"];
const PAGES: Pages[] = ["1", "1-3", "4-5", "6-8", "9+"];
const DESIGNS: Design[] = ["Modern", "Classic", "Creative"];
const TIMELINES: Timeline[] = ["2-3 weeks", "4+ weeks", "Under 14 days"];
const AUTOMATION_OPTIONS = ["Email confirmations", "Email follow-ups", "SMS reminders", "CRM integration", "Lead routing"];
const INTEGRATION_OPTIONS = ["Google Maps / location", "Calendly / scheduling", "Stripe payments", "PayPal payments", "Mailchimp / email list", "Analytics (GA4 / Pixel)", "Live chat"];
const BUDGET_LABELS: Record<Budget, string> = {
  "under-2k": "Under $2,000", "2k-5k": "$2,000 – $5,000",
  "5k-10k": "$5,000 – $10,000", "10k-plus": "$10,000+", "not-sure": "Not sure yet",
};
const LS_KEY = "crecystudio:intake";
const TOTAL_STEPS = 8;

function normalizePagesBucket(pages: Pages) {
  if (pages === "4-5") return "4-6" as const;
  return pages as "1" | "1-3" | "4-6" | "6-8" | "9+";
}

function normalizeYesNo(value: YesNo) {
  return value === "Yes" ? "yes" : "no";
}

function normalizeContentReady(value: ContentReady) {
  if (value === "Ready") return "ready" as const;
  if (value === "Not ready") return "not_ready" as const;
  return "some" as const;
}

const STEP_TITLES = [
  "Choose how you'd like to start",
  "What's the goal?",
  "Basic scope",
  "Features & integrations",
  "Assets & readiness",
  "Budget & decision",
  "Timeline & details",
  "Review your scope",
  "Where should we send the estimate?",
];

function BuildFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    mode: "chooser", websiteType: "Business", intent: "Marketing", intentOther: "",
    pages: "1-3", booking: false, payments: false, blog: false, membership: false,
    wantsAutomation: "No", automationTypes: [], integrations: [], integrationOther: "",
    hasLogo: "Yes", hasBrandGuide: "No", contentReady: "Some", assetsSource: "Client provides",
    referenceWebsite: "", currentWebsite: "", domainHosting: "Yes", decisionMaker: "Yes",
    stakeholdersCount: "1", budget: "not-sure", design: "Modern", timeline: "2-3 weeks",
    notes: "", leadEmail: "", leadPhone: "",
  });

  useEffect(() => {
    try { const raw = window.localStorage.getItem(LS_KEY); if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") setForm((f) => ({ ...f, ...parsed })); } } catch {}
  }, []);

  useEffect(() => { try { window.localStorage.setItem(LS_KEY, JSON.stringify(form)); } catch {} }, [form]);

  useEffect(() => {
    const mode = searchParams.get("mode"); const intent = searchParams.get("intent");
    const websiteType = searchParams.get("websiteType"); const pages = searchParams.get("pages");
    const timeline = searchParams.get("timeline"); const contentReady = searchParams.get("contentReady");
    if (mode || intent || websiteType || pages || timeline) {
      setForm((f) => ({
        ...f,
        mode: mode === "guided" || mode === "known" ? (mode as Mode) : f.mode,
        intent: INTENTS.includes(intent as Intent) ? (intent as Intent) : f.intent,
        websiteType: WEBSITE_TYPES.includes(websiteType as WebsiteType) ? (websiteType as WebsiteType) : f.websiteType,
        pages: PAGES.includes(pages as Pages) ? (pages as Pages) : f.pages,
        timeline: TIMELINES.includes(timeline as Timeline) ? (timeline as Timeline) : f.timeline,
        contentReady: (["Ready", "Some", "Not ready"].includes(contentReady ?? "") ? contentReady : f.contentReady) as ContentReady,
      }));
      if (mode === "guided" || mode === "known") setStep(1);
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

  function goMode(mode: Mode) { setForm((f) => ({ ...f, mode })); setStep(1); }
  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function applySuggested() { setForm((f) => ({ ...f, ...suggested })); }

  function toggleInList(key: "automationTypes" | "integrations", value: string) {
    setForm((f) => {
      const current = new Set(f[key]);
      if (current.has(value)) current.delete(value); else current.add(value);
      return { ...f, [key]: Array.from(current) } as FormState;
    });
  }

  async function submit() {
    const leadEmail = form.leadEmail.trim();
    if (!leadEmail || !leadEmail.includes("@")) { alert("Please enter a valid email address."); return; }
    const pricingInput: Parameters<typeof getWebsitePricing>[0] = {
      websiteType: form.websiteType.toLowerCase() as "business" | "ecommerce" | "portfolio" | "landing",
      pages: normalizePagesBucket(form.pages),
      booking: form.booking,
      payments: form.payments,
      blog: form.blog,
      membership: form.membership,
      wantsAutomation: normalizeYesNo(form.wantsAutomation),
      automationTypes: form.automationTypes,
      integrations: form.integrations,
      integrationOther: form.integrationOther,
      contentReady: normalizeContentReady(form.contentReady),
      domainHosting: normalizeYesNo(form.domainHosting),
      timeline: form.timeline,
      intent: form.intent === "Other" && form.intentOther.trim() ? form.intentOther.trim() : form.intent,
      budget: form.budget,
      hasLogo: normalizeYesNo(form.hasLogo),
      hasBrandGuide: normalizeYesNo(form.hasBrandGuide),
    };
    const intakeNormalized = {
      ...pricingInput,
      leadEmail,
      leadPhone: form.leadPhone.trim(),
      notes: form.notes,
    };
    const pricing = getWebsitePricing(pricingInput);

    try {
      const response = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "build",
          lead: {
            email: leadEmail,
            phone: form.leadPhone.trim() || undefined,
          },
          intakeRaw: form,
          intakeNormalized,
          pricing,
          estimate: {
            total: pricing.band.target,
            low: pricing.band.min,
            high: pricing.band.max,
            tierRecommended: pricing.tierLabel,
            tierKey: pricing.tierKey,
            isCustomScope: pricing.isCustomScope,
          },
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.ok || !json?.nextUrl) {
        throw new Error(json?.error || "We could not generate the estimate.");
      }

      try {
        window.localStorage.removeItem(LS_KEY);
        if (json?.quoteId) window.localStorage.setItem("crecystudio:lastQuoteId", String(json.quoteId));
        if (json?.quoteToken) window.localStorage.setItem("crecystudio:lastQuoteToken", String(json.quoteToken));
      } catch {}

      router.push(String(json.nextUrl));
    } catch (error) {
      alert(error instanceof Error ? error.message : "We could not generate the estimate.");
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <ScrollReveal />
      {/* Header */}
      <div className="portalStory heroFadeUp" style={{ paddingBottom: 20 }}>
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          Website estimate
        </div>
        <h1 className="portalStoryHeadline" style={{ fontSize: "clamp(26px, 5vw, 38px)" }}>
          {step === 0 ? <>Scope your <em>project</em></> : <>{STEP_TITLES[step]}</>}
        </h1>
        {step === 0 && (
          <p className="portalStoryBody">
            Choose how you&apos;d like to start — we&apos;ll guide you through
            scoping and generate a detailed estimate at the end.
          </p>
        )}
        {step > 0 && step < TOTAL_STEPS && (
          <div className="portalStoryMeta">
            <span className="portalStoryMetaItem">Step {step} of {TOTAL_STEPS - 2}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {step > 0 && step < TOTAL_STEPS && (
        <div style={{ height: 3, background: "var(--stroke)", borderRadius: 99, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }} />
        </div>
      )}

      {/* STEP 0 — Chooser */}
      {step === 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { mode: "guided" as Mode, title: "Help me decide", desc: "We'll ask goal-based questions and recommend the best setup.", cta: "Start guided intake", primary: true },
            { mode: "known" as Mode, title: "I know what I need", desc: "You already know your requirements. Jump straight to scope.", cta: "Start scope intake", primary: false },
          ].map((opt) => (
            <button key={opt.mode} type="button" onClick={() => goMode(opt.mode)}
              style={{
                padding: "24px 22px", borderRadius: 16, textAlign: "left", cursor: "pointer",
                border: "1px solid var(--stroke)", background: "var(--panel)",
                transition: "border-color 0.2s, transform 0.2s",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.02em" }}>
                {opt.title}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{opt.desc}</div>
              <div style={{ marginTop: "auto", paddingTop: 8 }}>
                <span className={`btn ${opt.primary ? "btnPrimary" : "btnGhost"}`} style={{ pointerEvents: "none" }}>
                  {opt.cta} <span className="btnArrow">→</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1 — Goal / Type */}
      {step === 1 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{form.mode === "guided" ? "What's the primary goal?" : "What type of website?"}</h2>
          </div>
          {form.mode === "guided" ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="fieldLabel">Primary business goal</div>
                <select className="select" value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value as Intent })}>
                  {INTENTS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              {form.intent === "Other" && (
                <div><div className="fieldLabel">Describe your goal</div>
                  <input className="input" value={form.intentOther} onChange={(e) => setForm({ ...form, intentOther: e.target.value })} placeholder="e.g., recruiting, investor credibility…" />
                </div>
              )}
            </div>
          ) : (
            <div><div className="fieldLabel">Website type</div>
              <select className="select" value={form.websiteType} onChange={(e) => setForm({ ...form, websiteType: e.target.value as WebsiteType })}>
                {WEBSITE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Scope */}
      {step === 2 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Basic scope</h2></div>
          {form.mode === "guided" && (
            <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Suggested setup</div>
              <div style={{ fontSize: 14, color: "var(--fg)" }}>
                Type: <strong>{suggested.websiteType ?? form.websiteType}</strong>
                {suggested.booking && <> · Booking enabled</>}
                {suggested.payments && <> · Payments enabled</>}
              </div>
              <button type="button" className="btn btnGhost" style={{ marginTop: 10, fontSize: 12, padding: "6px 12px" }} onClick={applySuggested}>Apply suggestion</button>
            </div>
          )}
          <div><div className="fieldLabel">Estimated total pages</div>
            <select className="select" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value as Pages })}>
              {PAGES.map((p) => <option key={p} value={p}>{p === "1" ? "1 (Single landing page)" : p}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* STEP 3 — Features */}
      {step === 3 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Features & integrations</h2></div>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { label: "Booking / appointments", key: "booking" as const },
              { label: "Payments / checkout", key: "payments" as const },
              { label: "Blog / articles", key: "blog" as const },
              { label: "Membership / gated content", key: "membership" as const },
            ].map((f) => (
              <Check key={f.key} label={f.label} checked={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="fieldLabel">Advanced automations?</div>
            <select className="select" value={form.wantsAutomation} onChange={(e) => setForm({ ...form, wantsAutomation: e.target.value as YesNo })}>
              <option value="No">No</option><option value="Yes">Yes</option>
            </select>
          </div>
          {form.wantsAutomation === "Yes" && (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
              <div className="fieldLabel">Select types</div>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{AUTOMATION_OPTIONS.map((a) => <Check key={a} label={a} checked={form.automationTypes.includes(a)} onChange={() => toggleInList("automationTypes", a)} />)}</div>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <div className="fieldLabel">Third-party integrations</div>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{INTEGRATION_OPTIONS.map((i) => <Check key={i} label={i} checked={form.integrations.includes(i)} onChange={() => toggleInList("integrations", i)} />)}</div>
          </div>
        </div>
      )}

      {/* STEP 4 — Assets */}
      {step === 4 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Assets & readiness</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><div className="fieldLabel">Current website URL</div><input className="input" placeholder="https://yoursite.com" value={form.currentWebsite} onChange={(e) => setForm({ ...form, currentWebsite: e.target.value })} /></div>
            <div><div className="fieldLabel">Reference / inspiration site</div><input className="input" placeholder="https://competitor.com" value={form.referenceWebsite} onChange={(e) => setForm({ ...form, referenceWebsite: e.target.value })} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="fieldLabel">Have a logo?</div><select className="select" value={form.hasLogo} onChange={(e) => setForm({ ...form, hasLogo: e.target.value as YesNo })}><option>Yes</option><option>No</option></select></div>
              <div><div className="fieldLabel">Brand colors defined?</div><select className="select" value={form.hasBrandGuide} onChange={(e) => setForm({ ...form, hasBrandGuide: e.target.value as YesNo })}><option>No</option><option>Yes</option></select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="fieldLabel">Content written?</div><select className="select" value={form.contentReady} onChange={(e) => setForm({ ...form, contentReady: e.target.value as ContentReady })}><option>Ready</option><option>Some</option><option>Not ready</option></select></div>
              <div><div className="fieldLabel">Domain / hosting setup?</div><select className="select" value={form.domainHosting} onChange={(e) => setForm({ ...form, domainHosting: e.target.value as YesNo })}><option value="Yes">Yes, I have it</option><option value="No">No, need help</option></select></div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — Budget */}
      {step === 5 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Budget & decision</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="fieldLabel">Budget range</div>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {(Object.entries(BUDGET_LABELS) as [Budget, string][]).map(([val, label]) => {
                  const active = form.budget === val;
                  return (
                    <label key={val} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                      border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                      background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    }}>
                      <input type="radio" name="budget" value={val} checked={active} onChange={() => setForm({ ...form, budget: val })} style={{ accentColor: "var(--accent)" }} />
                      <span style={{ color: "var(--fg)", fontWeight: active ? 600 : 400, fontSize: 14 }}>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="fieldLabel">Are you the final decision maker?</div>
              <select className="select" value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value as YesNo })}>
                <option value="Yes">Yes — I can approve</option><option value="No">No — others need to sign off</option>
              </select>
            </div>
            {form.decisionMaker === "No" && (
              <div><div className="fieldLabel">How many stakeholders?</div>
                <select className="select" value={form.stakeholdersCount} onChange={(e) => setForm({ ...form, stakeholdersCount: e.target.value as "1" | "2-3" | "4+" })}>
                  <option value="2-3">2–3 people</option><option value="4+">4 or more</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 6 — Timeline */}
      {step === 6 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Timeline & details</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="fieldLabel">Design direction</div><select className="select" value={form.design} onChange={(e) => setForm({ ...form, design: e.target.value as Design })}>{DESIGNS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><div className="fieldLabel">Target timeline</div><select className="select" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value as Timeline })}>{TIMELINES.map((t) => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div><div className="fieldLabel">Additional notes</div>
              <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Specific requirements, feature requests, competitor references..." />
            </div>
          </div>
        </div>
      )}

      {/* STEP 7 — Review */}
      {step === 7 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Review your scope</h2></div>
          <div style={{ display: "grid", gap: 0 }}>
            <ReviewRow label="Website type" value={form.websiteType} />
            <ReviewRow label="Total pages" value={form.pages} />
            <ReviewRow label="Content readiness" value={form.contentReady} />
            <ReviewRow label="Budget range" value={BUDGET_LABELS[form.budget]} />
            <ReviewRow label="Timeline" value={form.timeline} />
            <ReviewRow label="Design" value={form.design} />
            <ReviewRow label="Features" value={[form.booking && "Booking", form.payments && "Payments", form.blog && "Blog", form.membership && "Membership"].filter(Boolean).join(", ") || "None"} />
            {form.integrations.length > 0 && <ReviewRow label="Integrations" value={form.integrations.join(", ")} />}
            {form.currentWebsite && <ReviewRow label="Current site" value={form.currentWebsite} />}
            {form.notes && <ReviewRow label="Notes" value={form.notes} />}
          </div>
        </div>
      )}

      {/* STEP 8 — Contact */}
      {step === 8 && (
        <div className="portalPanel fadeUp" style={{ borderColor: "rgba(201,168,76,0.2)", background: "radial-gradient(600px 200px at 50% 0%, rgba(201,168,76,0.04), transparent 50%), var(--panel)" }}>
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">Where should we send the estimate?</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><div className="fieldLabel">Email address *</div><input className="input" type="email" value={form.leadEmail} onChange={(e) => setForm({ ...form, leadEmail: e.target.value })} placeholder="you@company.com" /></div>
            <div><div className="fieldLabel">Phone number (optional)</div><input className="input" type="tel" value={form.leadPhone} onChange={(e) => setForm({ ...form, leadPhone: e.target.value })} placeholder="(555) 555-5555" /></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button className="btn btnGhost" onClick={back}>← Back</button>
          {step < TOTAL_STEPS ? (
            <button className="btn btnPrimary" onClick={next}>Continue <span className="btnArrow">→</span></button>
          ) : (
            <button className="btn btnPrimary" onClick={submit}>Generate estimate <span className="btnArrow">→</span></button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuildPage() {
  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <Suspense fallback={<div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading...</div>}>
        <BuildFormInner />
      </Suspense>
    </main>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
      border: `1px solid ${checked ? "rgba(201,168,76,0.3)" : "var(--stroke)"}`,
      background: checked ? "rgba(201,168,76,0.06)" : "transparent",
    }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
      <span style={{ fontSize: 14, color: "var(--fg)" }}>{label}</span>
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 16 }}>
      <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}
