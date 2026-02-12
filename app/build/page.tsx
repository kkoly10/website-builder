"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Hybrid Dynamic Intake:
 * - Chooser: guided vs known
 * - Dynamic branching
 * - Adds required lead email + optional phone at the end
 * - Sends everything to /estimate as query params
 */

type Mode = "chooser" | "guided" | "known";
type Intent =
  | "Marketing"
  | "Leads"
  | "Booking"
  | "Selling"
  | "Content"
  | "Membership"
  | "Other";

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
  automationTypes: string[];
  integrations: string[];
  integrationOther: string;

  hasLogo: YesNo;
  hasBrandGuide: YesNo;
  contentReady: ContentReady;
  assetsSource: AssetsSource;
  referenceWebsite: string;

  decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+";

  design: Design;
  timeline: Timeline;

  notes: string;

  // lead capture
  leadEmail: string;
  leadPhone: string;
};

const INTENTS: Intent[] = [
  "Marketing",
  "Leads",
  "Booking",
  "Selling",
  "Content",
  "Membership",
  "Other",
];

const WEBSITE_TYPES: WebsiteType[] = ["Business", "Ecommerce", "Portfolio", "Landing"];
const PAGES: Pages[] = ["1-3", "4-5", "6-8", "9+"];
const DESIGNS: Design[] = ["Modern", "Classic", "Creative"];
const TIMELINES: Timeline[] = ["2-3 weeks", "4+ weeks", "Under 14 days"];

const AUTOMATION_OPTIONS = [
  "Email confirmations",
  "Email follow-ups",
  "SMS reminders",
  "CRM integration",
  "Lead routing (multiple recipients)",
];

const INTEGRATION_OPTIONS = [
  "Google Maps / location",
  "Calendly / scheduling",
  "Stripe payments",
  "PayPal payments",
  "Mailchimp / email list",
  "Analytics (GA4 / Pixel)",
  "Live chat",
];

export default function BuildPage() {
  const router = useRouter();

  // steps: 0 chooser, 1..6 intake, 7 contact, 8 review
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    mode: "chooser",

    websiteType: "Business",

    intent: "Marketing",
    intentOther: "",

    pages: "4-5",

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

    decisionMaker: "Yes",
    stakeholdersCount: "1",

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

  function goMode(mode: Mode) {
    setForm((f) => ({ ...f, mode }));
    setStep(1);
  }

  function next() {
    setStep((s) => Math.min(s + 1, 8));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function applySuggested() {
    setForm((f) => ({ ...f, ...suggested }));
  }

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
    if (!leadEmail) {
      alert("Please enter your email so we can send your estimate and follow up.");
      return;
    }

    const params = new URLSearchParams({
      // lead
      leadEmail,
      leadPhone: form.leadPhone.trim(),

      // old-friendly keys
      websiteType: form.websiteType,
      pages: form.pages,
      booking: String(form.booking),
      payments: String(form.payments),
      blog: String(form.blog),
      design: form.design,
      timeline: form.timeline,

      // richer keys
      mode: form.mode,
      intent: form.intent,
      intentOther: form.intentOther,
      membership: String(form.membership),

      wantsAutomation: form.wantsAutomation,
      automationTypes: form.automationTypes.join(","),
      integrations: form.integrations.join(","),
      integrationOther: form.integrationOther,

      hasLogo: form.hasLogo,
      hasBrandGuide: form.hasBrandGuide,
      contentReady: form.contentReady,
      assetsSource: form.assetsSource,
      referenceWebsite: form.referenceWebsite,

      decisionMaker: form.decisionMaker,
      stakeholdersCount: form.stakeholdersCount,

      notes: form.notes,
    }).toString();

    router.push(`/estimate?${params}`);
  }

  const stepLabel =
    step === 0
      ? "Choose how you'd like to start"
      : step === 7
      ? "Contact"
      : step === 8
      ? "Review"
      : `Step ${step} of 6`;

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Get a Quote
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Get a Quote</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        {stepLabel} — we’ll ask only what’s relevant so your estimate feels accurate.
      </p>

      <div style={{ height: 18 }} />

      {/* STEP 0 */}
      {step === 0 && (
        <section className="grid2" style={{ marginTop: 14 }}>
          <ChoiceCard
            title="Help me decide"
            desc="Not sure what you need? We’ll ask goal-based questions and recommend the best setup."
            cta="Start guided intake →"
            onClick={() => goMode("guided")}
            highlight
          />
          <ChoiceCard
            title="I know what I need"
            desc="You already know the type of site you want. We’ll jump straight into scope."
            cta="Start scope intake →"
            onClick={() => goMode("known")}
          />
        </section>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Step 1 — Goal / Type</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Pick a goal (guided) or choose the site type (direct). You can adjust later.
            </p>
          </div>

          <div className="panelBody">
            {form.mode === "guided" ? (
              <>
                <div className="field">
                  <div className="fieldLabel">Primary goal</div>
                  <select
                    className="input"
                    value={form.intent}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, intent: e.target.value as Intent }))
                    }
                  >
                    {INTENTS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                {form.intent === "Other" && (
                  <div className="field">
                    <div className="fieldLabel">Briefly describe your goal</div>
                    <input
                      className="input"
                      value={form.intentOther}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, intentOther: e.target.value }))
                      }
                      placeholder="e.g., recruiting, investor credibility, event promotion…"
                    />
                  </div>
                )}

                <div className="hintBox">
                  <strong>Tip:</strong> After you pick a goal, we’ll suggest a typical setup
                  (you can override it).
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <div className="fieldLabel">Website type</div>
                  <select
                    className="input"
                    value={form.websiteType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        websiteType: e.target.value as WebsiteType,
                      }))
                    }
                  >
                    {WEBSITE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Step 2 — Basic scope</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Pages help estimate effort. Final scope is confirmed during your consultation.
            </p>
          </div>

          <div className="panelBody">
            {form.mode === "guided" && (
              <div className="subPanel">
                <div className="subPanelTitle">Suggested setup</div>
                <ul className="miniList">
                  <li>
                    <strong>Website type:</strong> {suggested.websiteType ?? form.websiteType}
                  </li>
                  {suggested.booking && <li>Booking enabled</li>}
                  {suggested.payments && <li>Payments enabled</li>}
                  {suggested.blog && <li>Blog enabled</li>}
                  {suggested.membership && <li>Membership enabled</li>}
                </ul>

                <button type="button" onClick={applySuggested} className="btn btnGhost">
                  Apply suggested setup
                </button>
              </div>
            )}

            <div className="field">
              <div className="fieldLabel">Estimated pages</div>
              <select
                className="input"
                value={form.pages}
                onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value as Pages }))}
              >
                {PAGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="hintBox">
              We’ll confirm pages/sections during the Scope Snapshot step.
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Step 3 — Features</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Select only what applies — this is where pricing differences come from.
            </p>
          </div>

          <div className="panelBody">
            <div className="twoCol">
              <ToggleRow
                label="Booking / appointments"
                checked={form.booking}
                onChange={(v) => setForm((f) => ({ ...f, booking: v }))}
              />
              <ToggleRow
                label="Payments / checkout"
                checked={form.payments}
                onChange={(v) => setForm((f) => ({ ...f, payments: v }))}
              />
              <ToggleRow
                label="Blog / articles"
                checked={form.blog}
                onChange={(v) => setForm((f) => ({ ...f, blog: v }))}
              />
              <ToggleRow
                label="Membership / gated content"
                checked={form.membership}
                onChange={(v) => setForm((f) => ({ ...f, membership: v }))}
              />
            </div>

            {(form.booking || form.payments || form.membership || form.intent === "Selling") && (
              <div style={{ marginTop: 16 }}>
                <div className="field">
                  <div className="fieldLabel">Do you want automations? (advanced)</div>
                  <select
                    className="input"
                    value={form.wantsAutomation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wantsAutomation: e.target.value as YesNo }))
                    }
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {form.wantsAutomation === "Yes" && (
                  <div className="subPanel">
                    <div className="subPanelTitle">Automation types</div>
                    {AUTOMATION_OPTIONS.map((a) => (
                      <CheckLine
                        key={a}
                        label={a}
                        checked={form.automationTypes.includes(a)}
                        onChange={() => toggleInList("automationTypes", a)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {(form.payments || form.booking || form.intent === "Selling") && (
              <div style={{ marginTop: 16 }}>
                <div className="subPanel">
                  <div className="subPanelTitle">Integrations</div>

                  {INTEGRATION_OPTIONS.map((i) => (
                    <CheckLine
                      key={i}
                      label={i}
                      checked={form.integrations.includes(i)}
                      onChange={() => toggleInList("integrations", i)}
                    />
                  ))}

                  <div className="field" style={{ marginTop: 12 }}>
                    <div className="fieldLabel">Other integration (optional)</div>
                    <input
                      className="input"
                      value={form.integrationOther}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, integrationOther: e.target.value }))
                      }
                      placeholder="e.g., HubSpot, a specific CRM, booking platform…"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Step 4 — Assets & readiness</h2>
            <p className="p" style={{ marginTop: 8 }}>
              These answers prevent delays and revision disputes later.
            </p>
          </div>

          <div className="panelBody">
            <div className="field">
              <div className="fieldLabel">Reference website (optional)</div>
              <input
                className="input"
                placeholder="https://example.com"
                value={form.referenceWebsite}
                onChange={(e) => setForm((f) => ({ ...f, referenceWebsite: e.target.value }))}
              />
            </div>

            <div className="twoCol">
              <div className="field">
                <div className="fieldLabel">Do you have a logo?</div>
                <select
                  className="input"
                  value={form.hasLogo}
                  onChange={(e) => setForm((f) => ({ ...f, hasLogo: e.target.value as YesNo }))}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="field">
                <div className="fieldLabel">Brand guide / colors already defined?</div>
                <select
                  className="input"
                  value={form.hasBrandGuide}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hasBrandGuide: e.target.value as YesNo }))
                  }
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="twoCol">
              <div className="field">
                <div className="fieldLabel">Content readiness (text / services / about)</div>
                <select
                  className="input"
                  value={form.contentReady}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contentReady: e.target.value as ContentReady }))
                  }
                >
                  <option value="Ready">Ready</option>
                  <option value="Some">Some</option>
                  <option value="Not ready">Not ready</option>
                </select>
              </div>

              <div className="field">
                <div className="fieldLabel">Images source</div>
                <select
                  className="input"
                  value={form.assetsSource}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assetsSource: e.target.value as AssetsSource }))
                  }
                >
                  <option value="Client provides">Client provides</option>
                  <option value="Stock">Stock</option>
                  <option value="Need help">Need help</option>
                </select>
              </div>
            </div>

            <div className="hintBox">
              We’ll keep the scope clean so you don’t get stuck in endless edits.
            </div>
          </div>
        </section>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Step 5 — Decision & delivery</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Helps us forecast revision cycles and delivery risk.
            </p>
          </div>

          <div className="panelBody">
            <div className="twoCol">
              <div className="field">
                <div className="fieldLabel">Are you the final decision-maker?</div>
                <select
                  className="input"
                  value={form.decisionMaker}
                  onChange={(e) => setForm((f) => ({ ...f, decisionMaker: e.target.value as YesNo }))}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="field">
                <div className="fieldLabel">How many stakeholders will review?</div>
                <select
                  className="input"
                  value={form.stakeholdersCount}
                  onChange={(e) => setForm((f) => ({ ...f, stakeholdersCount: e.target.value as any }))}
                >
                  <option value="1">1</option>
                  <option value="2-3">2–3</option>
                  <option value="4+">4+</option>
                </select>
              </div>
            </div>

            <div className="twoCol">
              <div className="field">
                <div className="fieldLabel">Design direction</div>
                <select
                  className="input"
                  value={form.design}
                  onChange={(e) => setForm((f) => ({ ...f, design: e.target.value as Design }))}
                >
                  {DESIGNS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <div className="fieldLabel">Timeline</div>
                <select
                  className="input"
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value as Timeline }))}
                >
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <div className="fieldLabel">Notes (optional)</div>
              <textarea
                className="input"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Anything special you want us to know (pages, sections, examples, features)…"
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 6 */}
      {step === 6 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Step 6 — Review</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Next we generate your estimate + show tier options.
            </p>
          </div>

          <div className="panelBody">
            <div className="subPanel">
              <div className="subPanelTitle">Summary</div>
              <ul className="miniList">
                <li>
                  Mode:{" "}
                  <strong>{form.mode === "guided" ? "Help me decide" : "I know what I need"}</strong>
                </li>
                <li>
                  Website type: <strong>{form.websiteType}</strong>
                </li>
                <li>
                  Pages: <strong>{form.pages}</strong>
                </li>
                <li>
                  Features:{" "}
                  <strong>
                    {[
                      form.booking && "Booking",
                      form.payments && "Payments",
                      form.blog && "Blog",
                      form.membership && "Membership",
                    ]
                      .filter(Boolean)
                      .join(", ") || "None selected"}
                  </strong>
                </li>
                <li>
                  Content readiness: <strong>{form.contentReady}</strong>
                </li>
                <li>
                  Timeline: <strong>{form.timeline}</strong>
                </li>
              </ul>
            </div>

            <div className="hintBox">
              After you continue, we’ll ask for your email so we can send your estimate.
            </div>
          </div>
        </section>
      )}

      {/* STEP 7 */}
      {step === 7 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">Contact</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Where should we send your estimate?
            </p>
          </div>

          <div className="panelBody">
            <div className="field">
              <div className="fieldLabel">Email (required)</div>
              <input
                className="input"
                value={form.leadEmail}
                onChange={(e) => setForm((f) => ({ ...f, leadEmail: e.target.value }))}
                placeholder="you@company.com"
              />
            </div>

            <div className="field">
              <div className="fieldLabel">Phone (optional)</div>
              <input
                className="input"
                value={form.leadPhone}
                onChange={(e) => setForm((f) => ({ ...f, leadPhone: e.target.value }))}
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="hintBox">
              We’ll use this to follow up and schedule a call if you want one.
            </div>
          </div>
        </section>
      )}

      {/* STEP 8 */}
      {step === 8 && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panelHeader">
            <h2 className="h2">All set</h2>
            <p className="p" style={{ marginTop: 8 }}>
              Next: we’ll generate your estimate and show tier options.
            </p>
          </div>

          <div className="panelBody">
            <div className="subPanel">
              <div className="subPanelTitle">Confirm</div>
              <div style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.82)" }}>
                <div><strong>Email:</strong> {form.leadEmail || "(missing)"}</div>
                {form.leadPhone ? <div><strong>Phone:</strong> {form.leadPhone}</div> : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* NAV */}
      {step > 0 && (
        <div className="row" style={{ marginTop: 18 }}>
          <button onClick={back} className="btn btnGhost" type="button">
            Back
          </button>

          {step < 8 ? (
            <button onClick={next} className="btn btnPrimary" type="button">
              Next <span className="btnArrow">→</span>
            </button>
          ) : (
            <button onClick={submit} className="btn btnPrimary" type="button">
              View Estimate <span className="btnArrow">→</span>
            </button>
          )}
        </div>
      )}
    </main>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

function ChoiceCard({
  title,
  desc,
  cta,
  onClick,
  highlight,
}: {
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`card cardHover ${highlight ? "cardHot" : ""}`}
      style={{ cursor: "pointer" }}
    >
      <div className="cardInner">
        <div style={{ fontWeight: 950, fontSize: 18 }}>{title}</div>
        <div className="p" style={{ marginTop: 10 }}>
          {desc}
        </div>
        <div style={{ marginTop: 14, fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
          {cta}
        </div>
      </div>
    </div>
  );
}

/** ✅ FIXED: checkbox alignment + no more white UI */
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="checkRow">
      <input
        className="check"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/** ✅ FIXED: checkbox alignment + no more white UI */
function CheckLine({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="checkLine">
      <input className="check" type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}