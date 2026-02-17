// app/build/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

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

  domainHosting: YesNo; // ✅ NEW: ask it

  decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+";

  design: Design;
  timeline: Timeline;

  notes: string;

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
const PAGES: Pages[] = ["1", "1-3", "4-5", "6-8", "9+"];
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

const LS_KEY = "crecystudio:intake";

export default function BuildPage() {
  const router = useRouter();

  // steps: 0 chooser, 1..6 intake, 7 contact, 8 review
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

    domainHosting: "Yes", // default: help more people qualify for starter if they're ready

    decisionMaker: "Yes",
    stakeholdersCount: "1",

    design: "Modern",
    timeline: "2-3 weeks",

    notes: "",

    leadEmail: "",
    leadPhone: "",
  });

  // load prior draft (optional)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setForm((f) => ({ ...f, ...parsed }));
      }
    } catch {}
  }, []);

  // persist draft
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

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
      leadEmail,
      leadPhone: form.leadPhone.trim(),

      websiteType: form.websiteType,
      pages: form.pages,

      booking: String(form.booking),
      payments: String(form.payments),
      blog: String(form.blog),
      membership: String(form.membership),

      wantsAutomation: form.wantsAutomation,

      contentReady: form.contentReady,
      domainHosting: form.domainHosting, // ✅ ensure estimate can qualify starter caps

      design: form.design,
      timeline: form.timeline,

      mode: form.mode,
      intent: form.intent,
      intentOther: form.intentOther,

      automationTypes: form.automationTypes.join(","),
      integrations: form.integrations.join(","),
      integrationOther: form.integrationOther,

      hasLogo: form.hasLogo,
      hasBrandGuide: form.hasBrandGuide,
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
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Get a Quote
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Scope your website project</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        {stepLabel} — we’ll ask only what’s relevant so we can recommend the right tier.
      </p>

      <div style={{ height: 22 }} />

      {/* STEP 0 */}
      {step === 0 && (
        <section className="grid2">
          <div className="panel" style={{ cursor: "pointer" }} onClick={() => goMode("guided")}>
            <div className="panelHeader">
              <h2 className="h2">Help me decide</h2>
              <p className="pDark" style={{ marginTop: 8 }}>
                Not sure what you need? We’ll ask goal-based questions and recommend the best approach.
              </p>
            </div>
            <div className="panelBody">
              <Link className="btn btnPrimary" href="#" onClick={(e) => { e.preventDefault(); goMode("guided"); }}>
                Start guided intake <span className="btnArrow">→</span>
              </Link>
            </div>
          </div>

          <div className="panel" style={{ cursor: "pointer" }} onClick={() => goMode("known")}>
            <div className="panelHeader">
              <h2 className="h2">I know what I need</h2>
              <p className="pDark" style={{ marginTop: 8 }}>
                You already know the type of site you want. We’ll jump straight into scope details.
              </p>
            </div>
            <div className="panelBody">
              <Link className="btn btnGhost" href="#" onClick={(e) => { e.preventDefault(); goMode("known"); }}>
                Start scope intake <span className="btnArrow">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">{form.mode === "guided" ? "What are you trying to achieve?" : "What type of website do you need?"}</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              This helps us recommend the best setup.
            </p>
          </div>
          <div className="panelBody">
            {form.mode === "guided" ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div className="fieldLabel">Primary goal</div>
                  <select
                    className="select"
                    value={form.intent}
                    onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value as Intent }))}
                  >
                    {INTENTS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                {form.intent === "Other" && (
                  <div style={{ marginBottom: 14 }}>
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
                  Tip: After you pick a goal, we’ll suggest the typical setup (you can change it).
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <div className="fieldLabel">Website type</div>
                <select
                  className="select"
                  value={form.websiteType}
                  onChange={(e) => setForm((f) => ({ ...f, websiteType: e.target.value as WebsiteType }))}
                >
                  {WEBSITE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Basic scope</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Pages help us estimate effort — final scope is confirmed during your consultation.
            </p>
          </div>

          <div className="panelBody">
            {form.mode === "guided" && (
              <div style={{ marginBottom: 16 }}>
                <div className="smallNote" style={{ marginBottom: 12 }}>
                  Based on your goal, we typically recommend:
                </div>

                <ul className="tierList" style={{ marginTop: 0 }}>
                  <li>
                    <strong>Website type:</strong> {suggested.websiteType ?? form.websiteType}
                  </li>
                  {suggested.booking && <li>Booking enabled</li>}
                  {suggested.payments && <li>Payments enabled</li>}
                  {suggested.blog && <li>Blog enabled</li>}
                  {suggested.membership && <li>Membership enabled</li>}
                </ul>

                <button type="button" className="btn btnGhost" onClick={applySuggested}>
                  Apply suggested setup
                </button>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div className="fieldLabel">Estimated pages</div>
              <select
                className="select"
                value={form.pages}
                onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value as Pages }))}
              >
                {PAGES.map((p) => (
                  <option key={p} value={p}>
                    {p === "1" ? "1 (single page)" : p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Features</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Select only what applies.
            </p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            <CheckRow label="Booking / appointments" checked={form.booking} onChange={(v) => setForm((f) => ({ ...f, booking: v }))} />
            <CheckRow label="Payments / checkout" checked={form.payments} onChange={(v) => setForm((f) => ({ ...f, payments: v }))} />
            <CheckRow label="Blog / articles" checked={form.blog} onChange={(v) => setForm((f) => ({ ...f, blog: v }))} />
            <CheckRow label="Membership / gated content" checked={form.membership} onChange={(v) => setForm((f) => ({ ...f, membership: v }))} />

            <div style={{ marginTop: 10 }}>
              <div className="fieldLabel">Do you want automations? (advanced)</div>
              <select
                className="select"
                value={form.wantsAutomation}
                onChange={(e) => setForm((f) => ({ ...f, wantsAutomation: e.target.value as YesNo }))}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {form.wantsAutomation === "Yes" && (
              <div className="panel" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="panelHeader">
                  <div style={{ fontWeight: 950 }}>What automations do you want?</div>
                  <div className="smallNote">Pick any that apply.</div>
                </div>
                <div className="panelBody" style={{ display: "grid", gap: 10 }}>
                  {AUTOMATION_OPTIONS.map((a) => (
                    <CheckRow
                      key={a}
                      label={a}
                      checked={form.automationTypes.includes(a)}
                      onChange={() => toggleInList("automationTypes", a)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="panel" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="panelHeader">
                <div style={{ fontWeight: 950 }}>Integrations</div>
                <div className="smallNote">Only if needed.</div>
              </div>
              <div className="panelBody" style={{ display: "grid", gap: 10 }}>
                {INTEGRATION_OPTIONS.map((i) => (
                  <CheckRow
                    key={i}
                    label={i}
                    checked={form.integrations.includes(i)}
                    onChange={() => toggleInList("integrations", i)}
                  />
                ))}

                <div style={{ marginTop: 10 }}>
                  <div className="fieldLabel">Other integration (optional)</div>
                  <input
                    className="input"
                    value={form.integrationOther}
                    onChange={(e) => setForm((f) => ({ ...f, integrationOther: e.target.value }))}
                    placeholder="e.g., a specific CRM, booking platform, inventory tool…"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Assets & readiness</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              These answers prevent delays and revision disputes later.
            </p>
          </div>

          <div className="panelBody">
            <div style={{ marginBottom: 14 }}>
              <div className="fieldLabel">Reference website (optional)</div>
              <input
                className="input"
                placeholder="https://example.com"
                value={form.referenceWebsite}
                onChange={(e) => setForm((f) => ({ ...f, referenceWebsite: e.target.value }))}
              />
            </div>

            <div className="grid2" style={{ marginBottom: 14 }}>
              <div>
                <div className="fieldLabel">Do you have a logo?</div>
                <select
                  className="select"
                  value={form.hasLogo}
                  onChange={(e) => setForm((f) => ({ ...f, hasLogo: e.target.value as YesNo }))}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Brand guide / colors defined?</div>
                <select
                  className="select"
                  value={form.hasBrandGuide}
                  onChange={(e) => setForm((f) => ({ ...f, hasBrandGuide: e.target.value as YesNo }))}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="grid2" style={{ marginBottom: 14 }}>
              <div>
                <div className="fieldLabel">Content readiness (text/services/about)</div>
                <select
                  className="select"
                  value={form.contentReady}
                  onChange={(e) => setForm((f) => ({ ...f, contentReady: e.target.value as ContentReady }))}
                >
                  <option value="Ready">Ready</option>
                  <option value="Some">Some</option>
                  <option value="Not ready">Not ready</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Images source</div>
                <select
                  className="select"
                  value={form.assetsSource}
                  onChange={(e) => setForm((f) => ({ ...f, assetsSource: e.target.value as AssetsSource }))}
                >
                  <option value="Client provides">Client provides</option>
                  <option value="Stock">Stock</option>
                  <option value="Need help">Need help</option>
                </select>
              </div>
            </div>

            {/* ✅ NEW: domain/hosting question */}
            <div style={{ marginBottom: 14 }}>
              <div className="fieldLabel">Do you already have domain + hosting handled?</div>
              <select
                className="select"
                value={form.domainHosting}
                onChange={(e) => setForm((f) => ({ ...f, domainHosting: e.target.value as YesNo }))}
              >
                <option value="Yes">Yes</option>
                <option value="No">No (I need guidance/help)</option>
              </select>
              <div className="smallNote" style={{ marginTop: 8 }}>
                Starter caps ($225/$400) apply only when domain/hosting is already handled.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Decision & delivery</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Helps us estimate review cycles and timeline risk.
            </p>
          </div>

          <div className="panelBody">
            <div className="grid2" style={{ marginBottom: 14 }}>
              <div>
                <div className="fieldLabel">Are you the final decision-maker?</div>
                <select
                  className="select"
                  value={form.decisionMaker}
                  onChange={(e) => setForm((f) => ({ ...f, decisionMaker: e.target.value as YesNo }))}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">How many stakeholders will review?</div>
                <select
                  className="select"
                  value={form.stakeholdersCount}
                  onChange={(e) => setForm((f) => ({ ...f, stakeholdersCount: e.target.value as any }))}
                >
                  <option value="1">1</option>
                  <option value="2-3">2–3</option>
                  <option value="4+">4+</option>
                </select>
              </div>
            </div>

            <div className="grid2" style={{ marginBottom: 14 }}>
              <div>
                <div className="fieldLabel">Design direction</div>
                <select
                  className="select"
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

              <div>
                <div className="fieldLabel">Timeline</div>
                <select
                  className="select"
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

            <div style={{ marginBottom: 14 }}>
              <div className="fieldLabel">Notes (optional)</div>
              <textarea
                className="textarea"
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
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Review</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Next we’ll generate a personalized estimate, then show tier options.
            </p>
          </div>

          <div className="panelBody">
            <div className="smallNote" style={{ marginBottom: 10 }}>
              Summary:
            </div>
            <ul className="tierList" style={{ marginTop: 0 }}>
              <li>
                Mode: <strong>{form.mode === "guided" ? "Help me decide" : "I know what I need"}</strong>
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
                Domain/hosting handled: <strong>{form.domainHosting}</strong>
              </li>
              <li>
                Timeline: <strong>{form.timeline}</strong>
              </li>
            </ul>

            <div className="smallNote" style={{ marginTop: 10 }}>
              After you continue, we’ll ask for your email so we can send your estimate and follow up.
            </div>
          </div>
        </section>
      )}

      {/* STEP 7 */}
      {step === 7 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Where should we send your estimate?</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Email is required.
            </p>
          </div>

          <div className="panelBody">
            <div style={{ marginBottom: 14 }}>
              <div className="fieldLabel">Email (required)</div>
              <input
                className="input"
                value={form.leadEmail}
                onChange={(e) => setForm((f) => ({ ...f, leadEmail: e.target.value }))}
                placeholder="you@company.com"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="fieldLabel">Phone (optional)</div>
              <input
                className="input"
                value={form.leadPhone}
                onChange={(e) => setForm((f) => ({ ...f, leadPhone: e.target.value }))}
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="smallNote">
              We’ll use this to send your estimate and schedule a free consultation if you want one.
            </div>
          </div>
        </section>
      )}

      {/* STEP 8 */}
      {step === 8 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">All set</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              We’ll generate your estimate next. You’ll also see tier options if you want to upgrade.
            </p>
          </div>

          <div className="panelBody">
            <div className="smallNote">
              <strong>Email:</strong> {form.leadEmail || "(missing)"}
              <br />
              <strong>Phone:</strong> {form.leadPhone || "(optional)"}
            </div>
          </div>
        </section>
      )}

      {/* NAV */}
      {step > 0 && (
        <div className="row" style={{ marginTop: 18, justifyContent: "space-between" }}>
          <button className="btn btnGhost" onClick={back}>
            Back
          </button>

          {step < 8 ? (
            <button className="btn btnPrimary" onClick={next}>
              Next <span className="btnArrow">→</span>
            </button>
          ) : (
            <button className="btn btnPrimary" onClick={submit}>
              View Estimate <span className="btnArrow">→</span>
            </button>
          )}
        </div>
      )}
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
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="checkRow">
      <div className="checkLeft">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="checkLabel">{label}</div>
      </div>
    </div>
  );
}