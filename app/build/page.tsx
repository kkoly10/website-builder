"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Build / Quote Questionnaire (Obsidian Edition)
 * - Uses global CSS classes for consistent styling
 * - Fixes checkbox layout (no weird placement)
 * - Sends EXACT param names that /estimate expects
 * - Includes a Review step with URL preview (so you can confirm pages/websiteType are being sent)
 */

type WebsiteType = "business" | "ecommerce" | "portfolio" | "landing";
type Pages = "1-3" | "4-5" | "6-8" | "9+";
type YesNo = "yes" | "no";

type ContentReady = "ready" | "some" | "not_ready";
type Timeline = "2-4w" | "4-8w" | "rush";
type Budget = "under_550" | "550-850" | "900-1500" | "1700-3500" | "3500+";

type FormState = {
  websiteType: WebsiteType;
  pages: Pages;

  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;

  wantsAutomation: YesNo;

  hasBrand: YesNo;
  contentReady: ContentReady;
  domainHosting: YesNo;

  timeline: Timeline;
  budget: Budget;

  competitorUrl: string;
  notes: string;

  leadEmail: string;
  leadPhone: string;
};

const WEBSITE_TYPES: { label: string; value: WebsiteType; desc: string }[] = [
  { label: "Business", value: "business", desc: "Most service businesses, agencies, local brands" },
  { label: "Ecommerce", value: "ecommerce", desc: "Selling products, checkout, catalog" },
  { label: "Portfolio", value: "portfolio", desc: "Creators, professionals, personal branding" },
  { label: "Landing", value: "landing", desc: "Single offer, lead-gen, campaign page" },
];

const PAGES: { label: string; value: Pages }[] = [
  { label: "1–3 pages", value: "1-3" },
  { label: "4–5 pages", value: "4-5" },
  { label: "6–8 pages", value: "6-8" },
  { label: "9+ pages", value: "9+" },
];

export default function BuildPage() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);

  const [form, setForm] = useState<FormState>({
    websiteType: "business",
    pages: "4-5",

    booking: false,
    payments: false,
    blog: false,
    membership: false,

    wantsAutomation: "no",

    hasBrand: "no",
    contentReady: "some",
    domainHosting: "no",

    timeline: "2-4w",
    budget: "550-850",

    competitorUrl: "",
    notes: "",

    leadEmail: "",
    leadPhone: "",
  });

  function next() {
    setStep((s) => Math.min(s + 1, 5));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  // Build query string using the EXACT keys EstimateClient expects
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      // REQUIRED keys used by EstimateClient/EstimatePage
      websiteType: form.websiteType,
      pages: form.pages,

      booking: String(form.booking),
      payments: String(form.payments),
      blog: String(form.blog),
      membership: String(form.membership),

      wantsAutomation: form.wantsAutomation,

      hasBrand: form.hasBrand,
      contentReady: form.contentReady === "not_ready" ? "not ready" : form.contentReady, // EstimateClient supports "not ready"/"some"/"ready"
      domainHosting: form.domainHosting,

      timeline: form.timeline,
      budget: form.budget,

      competitorUrl: form.competitorUrl.trim(),
      notes: form.notes.trim(),

      // lead
      leadEmail: form.leadEmail.trim(),
      leadPhone: form.leadPhone.trim(),

      // these exist in some older flows; harmless but useful
      mode: "estimate",
      intent: "business",
      intentOther: "",
    });

    return params.toString();
  }, [form]);

  function submit() {
    const email = form.leadEmail.trim();
    if (!email) {
      alert("Please enter your email so we can send your estimate and follow up.");
      return;
    }
    router.push(`/estimate?${queryString}`);
  }

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Get a Quote
      </div>

      <div style={{ height: 10 }} />

      <h1 className="h1">Scope your website</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        Answer a few questions. We’ll generate a personalized estimate + tier recommendation.
      </p>

      <div style={{ height: 18 }} />

      {/* STEP INDICATOR */}
      <div className="card" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.10)" }}>
        <div className="cardInner" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950 }}>
            Step {step} of 5
          </div>
          <div style={{ opacity: 0.75 }}>
            {step === 1 && "Type & pages"}
            {step === 2 && "Features"}
            {step === 3 && "Readiness"}
            {step === 4 && "Timeline & budget"}
            {step === 5 && "Review & submit"}
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      {/* STEP 1 */}
      {step === 1 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Type & pages</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Choose the closest match — we’ll refine later.
            </p>
          </div>

          <div className="panelBody">
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fieldLabel">Website type</div>
                <div className="grid2">
                  {WEBSITE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`card cardHover`}
                      onClick={() => setForm((f) => ({ ...f, websiteType: t.value }))}
                      style={{
                        textAlign: "left",
                        background:
                          form.websiteType === t.value
                            ? "rgba(255,122,24,0.12)"
                            : "rgba(255,255,255,0.03)",
                        borderColor:
                          form.websiteType === t.value
                            ? "rgba(255,122,24,0.35)"
                            : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <div className="cardInner">
                        <div style={{ fontWeight: 950 }}>{t.label}</div>
                        <div style={{ opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="fieldLabel">Pages</div>
                <select
                  className="select"
                  value={form.pages}
                  onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value as Pages }))}
                >
                  {PAGES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="help">
                  Pages help estimate effort; final scope gets confirmed in your Scope Snapshot.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Features</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Pick what you actually need.
            </p>
          </div>

          <div className="panelBody">
            <div className="checkGrid">
              <CheckRow
                label="Booking / appointments"
                checked={form.booking}
                onChange={(v) => setForm((f) => ({ ...f, booking: v }))}
              />
              <CheckRow
                label="Payments / checkout"
                checked={form.payments}
                onChange={(v) => setForm((f) => ({ ...f, payments: v }))}
              />
              <CheckRow
                label="Blog / articles"
                checked={form.blog}
                onChange={(v) => setForm((f) => ({ ...f, blog: v }))}
              />
              <CheckRow
                label="Membership / gated content"
                checked={form.membership}
                onChange={(v) => setForm((f) => ({ ...f, membership: v }))}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="fieldLabel">Automations</div>
              <select
                className="select"
                value={form.wantsAutomation}
                onChange={(e) => setForm((f) => ({ ...f, wantsAutomation: e.target.value as YesNo }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <div className="help">
                Automations include confirmations, follow-ups, routing leads, and simple workflows.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Readiness</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              This prevents delays and revision disputes later.
            </p>
          </div>

          <div className="panelBody">
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fieldLabel">Do you already have brand (logo/colors/fonts)?</div>
                <select
                  className="select"
                  value={form.hasBrand}
                  onChange={(e) => setForm((f) => ({ ...f, hasBrand: e.target.value as YesNo }))}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Content readiness (text, services, about)</div>
                <select
                  className="select"
                  value={form.contentReady}
                  onChange={(e) => setForm((f) => ({ ...f, contentReady: e.target.value as ContentReady }))}
                >
                  <option value="ready">Ready</option>
                  <option value="some">Some</option>
                  <option value="not_ready">Not ready</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Do you need help with domain/hosting setup?</div>
                <select
                  className="select"
                  value={form.domainHosting}
                  onChange={(e) => setForm((f) => ({ ...f, domainHosting: e.target.value as YesNo }))}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Competitor / inspiration link (optional)</div>
                <input
                  className="input"
                  value={form.competitorUrl}
                  onChange={(e) => setForm((f) => ({ ...f, competitorUrl: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Timeline & budget</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              We’ll recommend the best tier based on effort.
            </p>
          </div>

          <div className="panelBody">
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fieldLabel">Timeline</div>
                <select
                  className="select"
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value as Timeline }))}
                >
                  <option value="2-4w">2–4 weeks</option>
                  <option value="4-8w">4–8 weeks</option>
                  <option value="rush">Rush (under 14 days)</option>
                </select>
              </div>

              <div>
                <div className="fieldLabel">Budget range</div>
                <select
                  className="select"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value as Budget }))}
                >
                  <option value="under_550">Under $550 (tight)</option>
                  <option value="550-850">$550–$850</option>
                  <option value="900-1500">$900–$1,500</option>
                  <option value="1700-3500">$1,700–$3,500</option>
                  <option value="3500+">$3,500+</option>
                </select>
                <div className="help">
                  Public start is $550. If budget is tight, we reduce scope or use admin-only discounts (10–25%).
                </div>
              </div>

              <div>
                <div className="fieldLabel">Notes (optional)</div>
                <textarea
                  className="textarea"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Anything special you want? Sections, features, examples…"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Review & submit</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Confirm your answers and enter email to view your estimate.
            </p>
          </div>

          <div className="panelBody">
            <div className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="cardInner" style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950 }}>Summary</div>
                <div style={{ opacity: 0.86, lineHeight: 1.7 }}>
                  <div>Website type: <strong>{form.websiteType}</strong></div>
                  <div>Pages: <strong>{form.pages}</strong></div>
                  <div>
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
                  <div>Automation: <strong>{form.wantsAutomation}</strong></div>
                  <div>Content: <strong>{form.contentReady}</strong></div>
                  <div>Has brand: <strong>{form.hasBrand}</strong></div>
                  <div>Domain/hosting help: <strong>{form.domainHosting}</strong></div>
                  <div>Timeline: <strong>{form.timeline}</strong></div>
                  <div>Budget: <strong>{form.budget}</strong></div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div className="fieldLabel">Email (required)</div>
                  <input
                    className="input"
                    value={form.leadEmail}
                    onChange={(e) => setForm((f) => ({ ...f, leadEmail: e.target.value }))}
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <div className="fieldLabel">Phone (optional)</div>
                  <input
                    className="input"
                    value={form.leadPhone}
                    onChange={(e) => setForm((f) => ({ ...f, leadPhone: e.target.value }))}
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.78 }}>
                  URL preview (should include pages + websiteType):{" "}
                  <span style={{ opacity: 0.92 }}>/estimate?{queryString}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }} className="row">
              <button type="button" className="btn btnPrimary" onClick={submit}>
                View Estimate <span className="btnArrow">→</span>
              </button>
              <button type="button" className="btn btnGhost" onClick={() => router.push("/")}>
                Back home
              </button>
            </div>
          </div>
        </section>
      )}

      {/* NAV */}
      <div style={{ marginTop: 16 }} className="row">
        <button type="button" className="btn btnGhost" onClick={back} disabled={step === 1}>
          Back
        </button>
        <button type="button" className="btn btnPrimary" onClick={next} disabled={step === 5}>
          Next <span className="btnArrow">→</span>
        </button>
      </div>

      <div style={{ marginTop: 14, opacity: 0.78, fontSize: 13 }}>
        Next: add Scope Snapshot preview
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
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="checkRow"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.10)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 18,
          height: 18,
          accentColor: "rgb(255,122,24)",
          margin: 0,
        }}
      />
      <span style={{ fontWeight: 850, opacity: 0.92 }}>{label}</span>
    </label>
  );
}
