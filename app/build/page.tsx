"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Hybrid Dynamic Intake:
 * - Chooser: guided vs known
 * - Dynamic branching
 * - Lead email + optional phone
 * - Saves to localStorage (backup)
 * - Sends everything to /estimate as query params (primary)
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

  // ✅ NEW (needed for Estimate inputs)
  domainHosting: YesNo;

  decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+";

  design: Design;
  timeline: Timeline;

  notes: string;

  leadEmail: string;
  leadPhone: string;
};

const STORAGE_KEY = "crecy_intake_v1";

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

function safeSetLocalStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function normalizeWebsiteType(w: WebsiteType) {
  if (w === "Business") return "business";
  if (w === "Ecommerce") return "ecommerce";
  if (w === "Portfolio") return "portfolio";
  return "landing";
}

function normalizePages(p: Pages) {
  // Estimate expects: 1-3, 4-6, 7-10, 10+
  if (p === "1-3") return "1-3";
  if (p === "4-5") return "4-6";
  if (p === "6-8") return "7-10";
  return "10+";
}

function normalizeTimeline(t: Timeline) {
  // Estimate expects: 2-4w, rush
  if (t === "Under 14 days") return "rush";
  return "2-4w";
}

function normalizeContentReady(c: ContentReady) {
  // Estimate expects: ready, some, no
  if (c === "Ready") return "ready";
  if (c === "Some") return "some";
  return "no";
}

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

    domainHosting: "No",

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

    // ✅ Save full raw form as backup
    safeSetLocalStorage(STORAGE_KEY, form);

    // ✅ Build a normalized payload that Estimate expects
    const normalized = {
      mode: form.mode,
      intent: form.intent,
      intentOther: form.intentOther,
      websiteType: normalizeWebsiteType(form.websiteType),
      pages: normalizePages(form.pages),

      booking: String(form.booking),
      payments: String(form.payments),
      blog: String(form.blog),
      membership: String(form.membership),

      wantsAutomation: form.wantsAutomation === "Yes" ? "yes" : "no",

      // Estimate expects these keys:
      contentReady: normalizeContentReady(form.contentReady),
      hasBrand: form.hasBrandGuide === "Yes" ? "yes" : "no",
      domainHosting: form.domainHosting === "Yes" ? "yes" : "no",
      timeline: normalizeTimeline(form.timeline),

      // Nice-to-have (kept)
      integrations: form.integrations.join(","),
      integrationOther: form.integrationOther,
      notes: form.notes,

      // lead
      leadEmail,
      leadPhone: form.leadPhone.trim(),
    };

    const params = new URLSearchParams(normalized as any).toString();

    // ✅ Always push params (primary handoff)
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
    <main style={container}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={title}>Get a Quote</h1>
        <p style={subtitle}>
          {stepLabel} — we’ll ask only what’s relevant so we can recommend the right tier.
        </p>
      </header>

      {/* STEP 0: CHOOSER */}
      {step === 0 && (
        <section style={grid2}>
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
        </section>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <section style={card}>
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
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section style={card}>
          <h2 style={sectionTitle}>Basic Scope</h2>

          {form.mode === "guided" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ color: "#444", lineHeight: 1.6 }}>
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
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section style={card}>
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
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>
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
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
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
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <section style={card}>
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

            <Field label="Do you need domain/hosting help?">
              <select
                value={form.domainHosting}
                onChange={(e) =>
                  setForm((f) => ({ ...f, domainHosting: e.target.value as YesNo }))
                }
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
          </div>

          <div style={hint}>
            These answers help prevent delays and revision disputes later.
          </div>
        </section>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <section style={card}>
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
        </section>
      )}

      {/* STEP 6 */}
      {step === 6 && (
        <section style={card}>
          <h2 style={sectionTitle}>Review</h2>
          <p style={{ color: "#555", lineHeight: 1.7 }}>
            Next we’ll generate a personalized estimate, then show tier options.
          </p>

          <div style={{ marginTop: 12, color: "#444", lineHeight: 1.8 }}>
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
              <li>
                Domain/hosting help: <strong>{form.domainHosting}</strong>
              </li>
            </ul>
          </div>

          <div style={hint}>
            After you continue, we’ll ask for your email so we can send your estimate and follow up.
          </div>
        </section>
      )}

      {/* STEP 7: CONTACT */}
      {step === 7 && (
        <section style={card}>
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
        </section>
      )}

      {/* STEP 8: FINAL CONFIRM */}
      {step === 8 && (
        <section style={card}>
          <h2 style={sectionTitle}>All set</h2>
          <p style={{ color: "#555", lineHeight: 1.7 }}>
            We’ll generate your estimate next. You’ll also see tier options if you want to upgrade.
          </p>

          <div style={miniBox}>
            <div><strong>Email:</strong> {form.leadEmail || "(missing)"}</div>
            {form.leadPhone ? <div><strong>Phone:</strong> {form.leadPhone}</div> : null}
          </div>
        </section>
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
    </main>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

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
        border: highlight ? "2px solid #000" : "1px solid #e5e5e5",
      }}
    >
      <h2 style={{ marginBottom: 10 }}>{title}</h2>
      <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 18 }}>{desc}</p>
      <div style={{ fontWeight: 700 }}>{cta}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
        {label}
      </label>
      {children}
      <style jsx>{`
        select,
        input,
        textarea {
          width: 100%;
          padding: 12px 12px;
          border-radius: 12px;
          border: 1px solid #ddd;
          background: #fff;
          font-size: 15px;
          outline: none;
        }
        textarea {
          resize: vertical;
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
      {label}
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
    <label style={{ display: "block", marginBottom: 8 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ marginRight: 10 }}
      />
      {label}
    </label>
  );
}

/* ---------------- STYLES ---------------- */

const container: React.CSSProperties = {
  maxWidth: 1000,
  margin: "0 auto",
  padding: "80px 24px",
};

const title: React.CSSProperties = {
  fontSize: 40,
  fontWeight: 800,
  marginBottom: 10,
};

const subtitle: React.CSSProperties = {
  color: "#555",
  fontSize: 16,
  lineHeight: 1.6,
  maxWidth: 760,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 22,
};

const cardChoice: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 26,
  cursor: "pointer",
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 30,
  border: "1px solid #e5e5e5",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  marginBottom: 16,
};

const nav: React.CSSProperties = {
  marginTop: 22,
  display: "flex",
  gap: 12,
};

const primaryBtn: React.CSSProperties = {
  padding: "14px 22px",
  background: "#000",
  color: "#fff",
  borderRadius: 12,
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "14px 22px",
  background: "#fff",
  color: "#000",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 800,
  cursor: "pointer",
};

const hint: React.CSSProperties = {
  marginTop: 10,
  background: "#f7f7f7",
  borderRadius: 14,
  padding: 12,
  color: "#444",
  lineHeight: 1.6,
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
  border: "1px solid #eee",
  borderRadius: 12,
  background: "#fafafa",
};

const subCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 16,
  background: "#fafafa",
};

const miniList: React.CSSProperties = {
  marginTop: 10,
  lineHeight: 1.8,
  paddingLeft: 18,
};

const miniBox: React.CSSProperties = {
  marginTop: 14,
  border: "1px solid #eee",
  background: "#fafafa",
  padding: 14,
  borderRadius: 14,
  lineHeight: 1.8,
};