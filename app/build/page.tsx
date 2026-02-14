"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

type Mode = "guided" | "known";

type Intent = "Marketing" | "Leads" | "Booking" | "Selling" | "Content" | "Membership" | "Other";
type WebsiteType = "Business" | "Ecommerce" | "Portfolio" | "Landing";
type Pages = "1-3" | "4-5" | "6-8" | "9+";
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
  hasLogo: YesNo;
  hasBrandGuide: YesNo;
  contentReady: ContentReady;
  assetsSource: AssetsSource;
  referenceWebsite: string;

  design: Design;
  timeline: Timeline;
  notes: string;

  leadEmail: string;
  leadPhone: string;
};

const INTENTS: Intent[] = ["Marketing", "Leads", "Booking", "Selling", "Content", "Membership", "Other"];
const WEBSITE_TYPES: WebsiteType[] = ["Business", "Ecommerce", "Portfolio", "Landing"];
const PAGES: Pages[] = ["1-3", "4-5", "6-8", "9+"];
const DESIGNS: Design[] = ["Modern", "Classic", "Creative"];
const TIMELINES: Timeline[] = ["2-3 weeks", "4+ weeks", "Under 14 days"];

export default function BuildPage() {
  const router = useRouter();

  // steps: 0 mode, 1..6 questions, 7 contact, 8 review
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    mode: "guided",

    websiteType: "Business",
    intent: "Marketing",
    intentOther: "",
    pages: "4-5",

    booking: false,
    payments: false,
    blog: false,
    membership: false,

    wantsAutomation: "No",
    hasLogo: "Yes",
    hasBrandGuide: "No",
    contentReady: "Some",
    assetsSource: "Client provides",
    referenceWebsite: "",

    design: "Modern",
    timeline: "2-3 weeks",
    notes: "",

    leadEmail: "",
    leadPhone: "",
  });

  const suggested = useMemo(() => {
    const s: Partial<FormState> = {};
    if (form.intent === "Booking") {
      s.websiteType = "Business";
      s.booking = true;
    }
    if (form.intent === "Leads" || form.intent === "Marketing") {
      s.websiteType = "Business";
    }
    if (form.intent === "Selling") {
      s.websiteType = "Ecommerce";
      s.payments = true;
    }
    if (form.intent === "Content") {
      s.websiteType = "Portfolio";
      s.blog = true;
    }
    if (form.intent === "Membership") {
      s.websiteType = "Business";
      s.membership = true;
    }
    return s;
  }, [form.intent]);

  function next() {
    setStep((s) => Math.min(s + 1, 8));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function applySuggested() {
    setForm((f) => ({ ...f, ...suggested }));
  }

  function submit() {
    const leadEmail = form.leadEmail.trim();
    if (!leadEmail) {
      alert("Please enter your email so we can send your estimate and follow up.");
      return;
    }

    const params = new URLSearchParams({
      leadEmail,
      leadPhone: form.leadPhone.trim(),

      websiteType: form.websiteType,
      pages: form.pages,
      booking: String(form.booking),
      payments: String(form.payments),
      blog: String(form.blog),
      membership: String(form.membership),
      wantsAutomation: form.wantsAutomation,

      hasBrand: form.hasBrandGuide === "Yes" || form.hasLogo === "Yes" ? "yes" : "no",
      contentReady: form.contentReady,
      domainHosting: "no", // later we’ll ask
      timeline: form.timeline,
      budget: "500-1000", // later we’ll ask
      competitorUrl: form.referenceWebsite,
      notes: form.notes,

      mode: form.mode,
      intent: form.intent,
      intentOther: form.intentOther,
      design: form.design,
    }).toString();

    router.push(`/estimate?${params}`);
  }

  const stepTitle =
    step === 0 ? "Start your quote" :
    step === 7 ? "Contact" :
    step === 8 ? "Review" :
    `Step ${step} of 6`;

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Get a Quote
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Get a quote in minutes</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        {stepTitle} — we only ask what’s relevant so your estimate is accurate.
      </p>

      <div style={{ height: 18 }} />

      {/* Step 0 */}
      {step === 0 && (
        <div className="grid2">
          <ChoiceCard
            title="Help me decide"
            desc="Goal-based questions and we recommend the right setup."
            onClick={() => { setForm((f)=>({ ...f, mode: "guided"})); setStep(1); }}
            primary
          />
          <ChoiceCard
            title="I know what I need"
            desc="Skip guidance and go straight into scope."
            onClick={() => { setForm((f)=>({ ...f, mode: "known"})); setStep(1); }}
          />
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Goal</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              This helps us recommend features and tier.
            </p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 14 }}>
            {form.mode === "guided" ? (
              <>
                <div>
                  <div className="fieldLabel">Primary goal</div>
                  <select
                    className="select"
                    value={form.intent}
                    onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value as Intent }))}
                  >
                    {INTENTS.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                {form.intent === "Other" && (
                  <div>
                    <div className="fieldLabel">Briefly describe your goal</div>
                    <input
                      className="input"
                      value={form.intentOther}
                      onChange={(e) => setForm((f) => ({ ...f, intentOther: e.target.value }))}
                      placeholder="e.g., recruiting, investor credibility, event promotion…"
                    />
                  </div>
                )}

                <div className="smallNote">
                  Tip: after you pick a goal, we’ll suggest the typical setup (you can change it).
                </div>
              </>
            ) : (
              <div>
                <div className="fieldLabel">Website type</div>
                <select
                  className="select"
                  value={form.websiteType}
                  onChange={(e) => setForm((f) => ({ ...f, websiteType: e.target.value as WebsiteType }))}
                >
                  {WEBSITE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Scope</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Pages help estimate effort. Final scope is confirmed during consultation.
            </p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 14 }}>
            {form.mode === "guided" && (
              <div className="card" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.10)" }}>
                <div className="cardInner">
                  <div style={{ fontWeight: 950 }}>Suggested setup</div>
                  <div className="smallNote" style={{ marginTop: 6 }}>
                    Website type: <strong>{suggested.websiteType ?? form.websiteType}</strong>{" "}
                    {suggested.booking ? " • Booking" : ""}{suggested.payments ? " • Payments" : ""}{suggested.blog ? " • Blog" : ""}{suggested.membership ? " • Membership" : ""}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button className="btn btnGhost" type="button" onClick={applySuggested}>
                      Apply suggested setup
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid2">
              <div>
                <div className="fieldLabel">Website type</div>
                <select
                  className="select"
                  value={form.websiteType}
                  onChange={(e) => setForm((f) => ({ ...f, websiteType: e.target.value as WebsiteType }))}
                >
                  {WEBSITE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="fieldLabel">Estimated pages</div>
                <select
                  className="select"
                  value={form.pages}
                  onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value as Pages }))}
                >
                  {PAGES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Features</h2>
            <p className="pDark" style={{ marginTop: 8 }}>Select only what applies.</p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            <CheckRow label="Booking / appointments" hint="Calendly or native scheduling" checked={form.booking} onChange={(v)=>setForm(f=>({ ...f, booking: v }))} />
            <CheckRow label="Payments / checkout" hint="Stripe/PayPal setup and flow" checked={form.payments} onChange={(v)=>setForm(f=>({ ...f, payments: v }))} />
            <CheckRow label="Blog / articles" hint="Categories + SEO structure" checked={form.blog} onChange={(v)=>setForm(f=>({ ...f, blog: v }))} />
            <CheckRow label="Membership / gated content" hint="Login + restricted pages" checked={form.membership} onChange={(v)=>setForm(f=>({ ...f, membership: v }))} />

            <div style={{ marginTop: 6 }}>
              <div className="fieldLabel">Automations?</div>
              <select className="select" value={form.wantsAutomation} onChange={(e)=>setForm(f=>({ ...f, wantsAutomation: e.target.value as YesNo }))}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <div className="smallNote" style={{ marginTop: 6 }}>
                Automations include confirmations, follow-ups, reminders, routing.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Assets & readiness</h2>
            <p className="pDark" style={{ marginTop: 8 }}>Helps prevent delays and revision disputes.</p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="fieldLabel">Reference website (optional)</div>
              <input className="input" value={form.referenceWebsite} onChange={(e)=>setForm(f=>({ ...f, referenceWebsite: e.target.value }))} placeholder="https://example.com" />
            </div>

            <div className="grid2">
              <div>
                <div className="fieldLabel">Do you have a logo?</div>
                <select className="select" value={form.hasLogo} onChange={(e)=>setForm(f=>({ ...f, hasLogo: e.target.value as YesNo }))}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Brand guide / colors defined?</div>
                <select className="select" value={form.hasBrandGuide} onChange={(e)=>setForm(f=>({ ...f, hasBrandGuide: e.target.value as YesNo }))}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="grid2">
              <div>
                <div className="fieldLabel">Content readiness</div>
                <select className="select" value={form.contentReady} onChange={(e)=>setForm(f=>({ ...f, contentReady: e.target.value as ContentReady }))}>
                  <option value="Ready">Ready</option>
                  <option value="Some">Some</option>
                  <option value="Not ready">Not ready</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Images source</div>
                <select className="select" value={form.assetsSource} onChange={(e)=>setForm(f=>({ ...f, assetsSource: e.target.value as AssetsSource }))}>
                  <option value="Client provides">Client provides</option>
                  <option value="Stock">Stock</option>
                  <option value="Need help">Need help</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Style & timeline</h2>
            <p className="pDark" style={{ marginTop: 8 }}>Timeline affects pricing if rush.</p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 14 }}>
            <div className="grid2">
              <div>
                <div className="fieldLabel">Design direction</div>
                <select className="select" value={form.design} onChange={(e)=>setForm(f=>({ ...f, design: e.target.value as Design }))}>
                  {DESIGNS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="fieldLabel">Timeline</div>
                <select className="select" value={form.timeline} onChange={(e)=>setForm(f=>({ ...f, timeline: e.target.value as Timeline }))}>
                  {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="fieldLabel">Notes (optional)</div>
              <textarea className="textarea" value={form.notes} onChange={(e)=>setForm(f=>({ ...f, notes: e.target.value }))} placeholder="Any special sections/features/examples…"/>
            </div>
          </div>
        </section>
      )}

      {/* Step 6 */}
      {step === 6 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Summary</h2>
            <p className="pDark" style={{ marginTop: 8 }}>Next we’ll collect your email and generate your estimate.</p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 8 }}>
            <div className="smallNote">
              Website type: <strong>{form.websiteType}</strong> • Pages: <strong>{form.pages}</strong> • Goal: <strong>{form.intent}</strong>
            </div>
            <div className="smallNote">
              Features:{" "}
              <strong>
                {[
                  form.booking && "Booking",
                  form.payments && "Payments",
                  form.blog && "Blog",
                  form.membership && "Membership",
                ].filter(Boolean).join(", ") || "None"}
              </strong>
            </div>
            <div className="smallNote">
              Content: <strong>{form.contentReady}</strong> • Timeline: <strong>{form.timeline}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Step 7 */}
      {step === 7 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Where should we send your estimate?</h2>
            <p className="pDark" style={{ marginTop: 8 }}>Email is required.</p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="fieldLabel">Email</div>
              <input className="input" value={form.leadEmail} onChange={(e)=>setForm(f=>({ ...f, leadEmail: e.target.value }))} placeholder="you@company.com" />
            </div>
            <div>
              <div className="fieldLabel">Phone (optional)</div>
              <input className="input" value={form.leadPhone} onChange={(e)=>setForm(f=>({ ...f, leadPhone: e.target.value }))} placeholder="(555) 555-5555" />
            </div>
            <div className="smallNote">
              We’ll use this to send your estimate and offer a free consultation if you want one.
            </div>
          </div>
        </section>
      )}

      {/* Step 8 */}
      {step === 8 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">All set</h2>
            <p className="pDark" style={{ marginTop: 8 }}>View your estimate and tier recommendation.</p>
          </div>

          <div className="panelBody">
            <div className="smallNote">
              Email: <strong>{form.leadEmail || "(missing)"}</strong>
              {form.leadPhone ? <> • Phone: <strong>{form.leadPhone}</strong></> : null}
            </div>
          </div>
        </section>
      )}

      {/* NAV */}
      {step > 0 && (
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btnGhost" onClick={back} type="button">
            Back
          </button>
          {step < 8 ? (
            <button className="btn btnPrimary" onClick={next} type="button">
              Next <span className="btnArrow">→</span>
            </button>
          ) : (
            <button className="btn btnPrimary" onClick={submit} type="button">
              View Estimate <span className="btnArrow">→</span>
            </button>
          )}
        </div>
      )}
    </main>
  );
}

function ChoiceCard({
  title,
  desc,
  onClick,
  primary,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <div
      className="card cardHover"
      role="button"
      tabIndex={0}
      onClick={onClick}
      style={{
        borderColor: primary ? "rgba(255,122,24,0.40)" : "rgba(255,255,255,0.12)",
        background: primary ? "rgba(255,122,24,0.10)" : "rgba(255,255,255,0.05)",
      }}
    >
      <div className="cardInner">
        <div style={{ fontWeight: 950, fontSize: 18 }}>{title}</div>
        <div className="p" style={{ marginTop: 8 }}>{desc}</div>
        <div style={{ marginTop: 12 }}>
          <span className={`badge ${primary ? "badgeHot" : ""}`}>Start →</span>
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="checkRow">
      <div className="checkLeft">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div style={{ minWidth: 0 }}>
          <div className="checkLabel">{label}</div>
          <div className="checkHint">{hint}</div>
        </div>
      </div>
      <div className={`badge ${checked ? "badgeHot" : ""}`}>{checked ? "On" : "Off"}</div>
    </div>
  );
}