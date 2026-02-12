"use client";

import React, { useMemo, useState } from "react";
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

      <h1 className="h1">Scope your website project</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        {stepLabel} — we’ll ask only what’s relevant so we can recommend the right tier.
      </p>

      <div style={{ height: 18 }} />

      {/* ✅ Paper wrapper (forces readable dark text & proper inputs) */}
      <section className="formPaper">
        {/* STEP 0: CHOOSER */}
        {step === 0 && (
          <div style={grid2}>
            <Card
              title="Help me decide"
              desc="Not sure what you need? We’ll ask goal-based questions and recommend the best approach."
              cta="Start guided intake →"
              onClick={() => goMode("guided")}
              highlight
            />
            <Card
              title="I know what I need"
              desc="You already know the type of site you want. We’ll jump straight into scope details."
              cta="Start scope intake →"
              onClick={() => goMode("known")}
            />
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <PaperCard>
            {form.mode === "guided" ? (
              <>
                <h2 style={sectionTitle}>What are you trying to achieve?</h2>

                <Field label="Primary goal">
                  <select
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
                </Field>

                {form.intent === "Other" && (
                  <Field label="Briefly describe your goal">
                    <input
                      value={form.intentOther}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, intentOther: e.target.value }))
                      }
                      placeholder="e.g., recruiting, investor credibility, event promotion…"
                    />
                  </Field>
                )}

                <div style={hint}>
                  <strong>Tip:</strong> After you pick a goal, we’ll suggest the typical setup (you can change it).
                </div>
              </>
            ) : (
              <>
                <h2 style={sectionTitle}>What type of website do you need?</h2>
                <Field label="Website type">
                  <select
                    value={form.websiteType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, websiteType: e.target.value as WebsiteType }))
                    }
                  >
                    {WEBSITE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </PaperCard>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <PaperCard>
            <h2 style={sectionTitle}>Basic Scope</h2>

            {form.mode === "guided" && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: PAPER.text, lineHeight: 1.6 }}>
                  Based on your goal, we typically recommend:
                  <ul style={miniList}>
                    <li>
                      <strong>Website type:</strong> {suggested.websiteType ?? form.websiteType}
                    </li>
                    {suggested.booking && <li>Booking enabled</li>}
                    {suggested.payments && <li>Payments enabled</li>}
                    {suggested.blog && <li>Blog enabled</li>}
                    {suggested.membership && <li>Membership enabled</li>}
                  </ul>
                </div>

                <button type="button" onClick={applySuggested} style={secondaryBtn}>
                  Apply suggested setup
                </button>
              </div>
            )}

            <Field label="Estimated pages">
              <select
                value={form.pages}
                onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value as Pages }))}
              >
                {PAGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <div style={hint}>
              Pages help us estimate effort — final scope is confirmed during your consultation.
            </div>
          </PaperCard>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <PaperCard>
            <h2 style={sectionTitle}>Features (Only What Applies)</h2>

            <div style={twoCol}>
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
              <div style={{ marginTop: 18 }}>
                <Field label="Do you want automations? (advanced)">
                  <select
                    value={form.wantsAutomation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wantsAutomation: e.target.value as YesNo }))
                    }
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>

                {form.wantsAutomation === "Yes" && (
                  <div style={subCard}>
                    <div style={{ fontWeight: 800, marginBottom: 10, color: PAPER.text }}>
                      What automations do you want?
                    </div>

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
              <div style={{ marginTop: 18 }}>
                <div style={subCard}>
                  <div style={{ fontWeight: 800, marginBottom: 10, color: PAPER.text }}>
                    Any integrations needed?
                  </div>

                  {INTEGRATION_OPTIONS.map((i) => (
                    <CheckLine
                      key={i}
                      label={i}
                      checked={form.integrations.includes(i)}
                      onChange={() => toggleInList("integrations", i)}
                    />
                  ))}

                  <Field label="Other integration (optional)">
                    <input
                      value={form.integrationOther}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, integrationOther: e.target.value }))
                      }
                      placeholder="e.g., a specific CRM, booking platform, inventory tool…"
                    />
                  </Field>
                </div>
              </div>
            )}
          </PaperCard>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <PaperCard>
            <h2 style={sectionTitle}>Assets & Readiness</h2>

            <Field label="Reference website (optional)">
              <input
                placeholder="https://example.com"
                value={form.referenceWebsite}
                onChange={(e) => setForm((f) => ({ ...f, referenceWebsite: e.target.value }))}
              />
            </Field>

            <div style={twoCol}>
              <Field label="Do you have a logo?">
                <select
                  value={form.hasLogo}
                  onChange={(e) => setForm((f) => ({ ...f, hasLogo: e.target.value as YesNo }))}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Brand guide / colors already defined?">
                <select
                  value={form.hasBrandGuide}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hasBrandGuide: e.target.value as YesNo }))
                  }
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
            </div>

            <div style={twoCol}>
              <Field label="Content readiness (text / services / about)">
                <select
                  value={form.contentReady}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contentReady: e.target.value as ContentReady }))
                  }
                >
                  <option value="Ready">Ready</option>
                  <option value="Some">Some</option>
                  <option value="Not ready">Not ready</option>
                </select>
              </Field>

              <Field label="Images source">
                <select
                  value={form.assetsSource}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assetsSource: e.target.value as AssetsSource }))
                  }
                >
                  <option value="Client provides">Client provides</option>
                  <option value="Stock">Stock</option>
                  <option value="Need help">Need help</option>
                </select>
              </Field>
            </div>

            <div style={hint}>
              These answers help prevent delays and revision disputes later.
            </div>
          </PaperCard>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <PaperCard>
            <h2 style={sectionTitle}>Decision & Delivery</h2>

            <div style={twoCol}>
              <Field label="Are you the final decision-maker?">
                <select
                  value={form.decisionMaker}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, decisionMaker: e.target.value as YesNo }))
                  }
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="How many stakeholders will review?">
                <select
                  value={form.stakeholdersCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stakeholdersCount: e.target.value as any }))
                  }
                >
                  <option value="1">1</option>
                  <option value="2-3">2–3</option>
                  <option value="4+">4+</option>
                </select>
              </Field>
            </div>

            <div style={twoCol}>
              <Field label="Design direction">
                <select
                  value={form.design}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, design: e.target.value as Design }))
                  }
                >
                  {DESIGNS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Timeline">
                <select
                  value={form.timeline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, timeline: e.target.value as Timeline }))
                  }
                >
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Notes (optional)">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Anything special you want us to know (pages, sections, examples, features)…"
              />
            </Field>
          </PaperCard>
        )}

        {/* STEP 6 */}
        {step === 6 && (
          <PaperCard>
            <h2 style={sectionTitle}>Review</h2>
            <p style={{ color: PAPER.muted, lineHeight: 1.7 }}>
              Next we’ll generate a personalized estimate, then show tier options.
            </p>

            <div style={{ marginTop: 12, color: PAPER.text, lineHeight: 1.8 }}>
              <strong>Summary:</strong>
              <ul style={miniList}>
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

            <div style={hint}>
              After you continue, we’ll ask for your email so we can send your estimate and follow up.
            </div>
          </PaperCard>
        )}

        {/* STEP 7: CONTACT */}
        {step === 7 && (
          <PaperCard>
            <h2 style={sectionTitle}>Where should we send your estimate?</h2>

            <Field label="Email (required)">
              <input
                value={form.leadEmail}
                onChange={(e) => setForm((f) => ({ ...f, leadEmail: e.target.value }))}
                placeholder="you@company.com"
              />
            </Field>

            <Field label="Phone (optional)">
              <input
                value={form.leadPhone}
                onChange={(e) => setForm((f) => ({ ...f, leadPhone: e.target.value }))}
                placeholder="(555) 555-5555"
              />
            </Field>

            <div style={hint}>
              We’ll use this to send your estimate and schedule a free consultation if you want one.
            </div>
          </PaperCard>
        )}

        {/* STEP 8: FINAL CONFIRM */}
        {step === 8 && (
          <PaperCard>
            <h2 style={sectionTitle}>All set</h2>
            <p style={{ color: PAPER.muted, lineHeight: 1.7 }}>
              We’ll generate your estimate next. You’ll also see tier options if you want to upgrade.
            </p>

            <div style={miniBox}>
              <div><strong>Email:</strong> {form.leadEmail || "(missing)"}</div>
              {form.leadPhone ? <div><strong>Phone:</strong> {form.leadPhone}</div> : null}
            </div>
          </PaperCard>
        )}

        {/* NAV */}
        {step > 0 && (
          <div style={nav}>
            <button onClick={back} style={secondaryBtn}>
              Back
            </button>

            {step < 8 ? (
              <button onClick={next} style={primaryBtn}>
                Next →
              </button>
            ) : (
              <button onClick={submit} style={primaryBtn}>
                View Estimate →
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

function PaperCard({ children }: { children: React.ReactNode }) {
  return <section style={card}>{children}</section>;
}

function Card({
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
      style={{
        ...cardChoice,
        border: highlight ? `2px solid ${PAPER.strokeStrong}` : `1px solid ${PAPER.stroke}`,
      }}
    >
      <h2 style={{ marginBottom: 10, color: PAPER.text }}>{title}</h2>
      <p style={{ color: PAPER.muted, lineHeight: 1.6, marginBottom: 18 }}>{desc}</p>
      <div style={{ fontWeight: 900, color: PAPER.text }}>{cta}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontWeight: 900, marginBottom: 6, color: PAPER.text }}>
        {label}
      </label>

      <div className="paperField">{children}</div>

      {/* ✅ Force readable inputs regardless of global theme */}
      <style jsx>{`
        .paperField :global(select),
        .paperField :global(input),
        .paperField :global(textarea) {
          width: 100%;
          padding: 12px 12px;
          border-radius: 14px;
          border: 1px solid rgba(15, 17, 20, 0.16);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(15, 17, 20, 0.92);
          font-size: 15px;
          outline: none;
        }
        .paperField :global(input::placeholder),
        .paperField :global(textarea::placeholder) {
          color: rgba(15, 17, 20, 0.45);
        }
        .paperField :global(textarea) {
          resize: vertical;
        }
        .paperField :global(select:focus),
        .paperField :global(input:focus),
        .paperField :global(textarea:focus) {
          box-shadow: 0 0 0 4px rgba(255, 122, 24, 0.18);
          border-color: rgba(255, 122, 24, 0.45);
        }
      `}</style>
    </div>
  );
}

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
    <label style={toggleRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginRight: 10 }}
      />
      <span style={{ color: PAPER.text, fontWeight: 850 }}>{label}</span>
    </label>
  );
}

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
    <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, color: PAPER.text }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span style={{ fontWeight: 800 }}>{label}</span>
    </label>
  );
}

/* ---------------- PAPER THEME ---------------- */

const PAPER = {
  text: "rgba(15,17,20,0.92)",
  muted: "rgba(15,17,20,0.66)",
  stroke: "rgba(15,17,20,0.14)",
  strokeStrong: "rgba(15,17,20,0.22)",
  cardBg: "rgba(255,255,255,0.92)",
  cardBg2: "rgba(255,255,255,0.84)",
};

/* ---------------- STYLES ---------------- */

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 22,
};

const cardChoice: React.CSSProperties = {
  background: PAPER.cardBg,
  borderRadius: 22,
  padding: 26,
  cursor: "pointer",
  boxShadow: "0 12px 34px rgba(0,0,0,0.12)",
};

const card: React.CSSProperties = {
  background: PAPER.cardBg,
  borderRadius: 22,
  padding: 30,
  border: `1px solid ${PAPER.stroke}`,
  boxShadow: "0 14px 40px rgba(0,0,0,0.14)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  marginBottom: 16,
  color: PAPER.text,
  fontWeight: 950,
};

const nav: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  gap: 12,
};

const primaryBtn: React.CSSProperties = {
  padding: "14px 22px",
  background: "#0f1114",
  color: "#fff",
  borderRadius: 14,
  border: "1px solid rgba(15,17,20,0.18)",
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "14px 22px",
  background: "rgba(255,255,255,0.88)",
  color: PAPER.text,
  borderRadius: 14,
  border: `1px solid ${PAPER.stroke}`,
  fontWeight: 950,
  cursor: "pointer",
};

const hint: React.CSSProperties = {
  marginTop: 10,
  background: PAPER.cardBg2,
  borderRadius: 16,
  padding: 12,
  color: PAPER.muted,
  lineHeight: 1.6,
  border: `1px solid ${PAPER.stroke}`,
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const toggleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 12px",
  border: `1px solid ${PAPER.stroke}`,
  borderRadius: 14,
  background: PAPER.cardBg2,
};

const subCard: React.CSSProperties = {
  border: `1px solid ${PAPER.stroke}`,
  borderRadius: 18,
  padding: 16,
  background: PAPER.cardBg2,
};

const miniList: React.CSSProperties = {
  marginTop: 10,
  lineHeight: 1.8,
  paddingLeft: 18,
};

const miniBox: React.CSSProperties = {
  marginTop: 14,
  border: `1px solid ${PAPER.stroke}`,
  background: PAPER.cardBg2,
  padding: 14,
  borderRadius: 16,
  lineHeight: 1.8,
  color: PAPER.text,
};