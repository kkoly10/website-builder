"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getOpsPricing, PRICING_MESSAGES } from "@/lib/pricing";

// IMPORTANT: All literal values in these arrays are sent verbatim to
// /api/ops/submit-intake and used by the pricing engine + admin pipeline.
// Locale-specific labels render via t(`enums.{group}.{value}`) lookups.
type OpsFormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  teamSize: string;
  jobVolume: string;
  monthlyRevenue: string;
  currentWebsite: string;
  budgetRange: string;
  currentTools: string[];
  painPoints: string[];
  triedBefore: string;
  workflowsNeeded: string[];
  urgency: string;
  readiness: string;
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
  "Leads falling through the cracks",
  "Billing is delayed or inconsistent",
  "Client onboarding takes too long",
  "No visibility into what's happening in the business",
];

const WORKFLOWS_LIST = [
  "Automated Client Intake",
  "CRM to Billing Sync",
  "Operations Dashboard",
  "Automated Follow-ups",
  "Lead Routing & Assignment",
  "Invoice & Payment Automation",
];

const BUDGET_OPTIONS = [
  "Under $1,000",
  "$1,000 - $2,000",
  "$2,000 - $4,000",
  "$4,000 - $8,000",
  "$8,000+",
  "Not sure yet",
];

const REVENUE_OPTIONS = [
  "Under $10k/mo",
  "$10k - $50k/mo",
  "$50k - $200k/mo",
  "$200k+/mo",
  "Prefer not to say",
];

const URGENCY_OPTIONS = [
  "ASAP - this is costing us now",
  "Within the next month",
  "Next 2-3 months",
  "Exploring options",
];

const TRIED_BEFORE_OPTIONS = [
  "No - first time addressing this",
  "Yes - tried to fix it internally",
  "Yes - hired someone and it didn't work",
  "Yes - using a tool but it's not working",
];

const TEAM_SIZE_OPTIONS = [
  "1-5 employees",
  "6-15 employees",
  "16-50 employees",
  "50+ employees",
];

const JOB_VOLUME_OPTIONS = [
  "Under 10 per month",
  "10-50 per month",
  "50-200 per month",
  "200+ per month",
];

export default function OpsIntakeClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("opsIntake");
  const tStep = useTranslations("opsIntake.stepTitles");
  const tEnumTeam = useTranslations("opsIntake.enums.teamSize");
  const tEnumVolume = useTranslations("opsIntake.enums.jobVolume");
  const tEnumRev = useTranslations("opsIntake.enums.revenue");
  const tEnumBudget = useTranslations("opsIntake.enums.budget");
  const tEnumUrgency = useTranslations("opsIntake.enums.urgency");
  const tEnumTried = useTranslations("opsIntake.enums.triedBefore");
  const tEnumTools = useTranslations("opsIntake.enums.tools");
  const tEnumPain = useTranslations("opsIntake.enums.painPoints");
  const tEnumWorkflows = useTranslations("opsIntake.enums.workflows");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OpsFormState>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    teamSize: "1-5 employees",
    jobVolume: "10-50 per month",
    monthlyRevenue: "Prefer not to say",
    currentWebsite: "",
    budgetRange: "Not sure yet",
    currentTools: [],
    painPoints: [],
    triedBefore: "No - first time addressing this",
    workflowsNeeded: [],
    urgency: "Exploring options",
    readiness: "Just doing research",
    notes: "",
  });

  const recommendation = useMemo(
    () =>
      getOpsPricing({
        companyName: form.companyName,
        industry: form.industry,
        teamSize: form.teamSize,
        jobVolume: form.jobVolume,
        monthlyRevenue: form.monthlyRevenue,
        budgetRange: form.budgetRange,
        currentTools: form.currentTools,
        painPoints: form.painPoints,
        triedBefore: form.triedBefore,
        workflowsNeeded: form.workflowsNeeded,
        urgency: form.urgency,
        readiness: form.readiness,
        notes: form.notes,
      }),
    [form]
  );

  const toggleArray = (
    field: "currentTools" | "painPoints" | "workflowsNeeded",
    v: string
  ) => {
    setForm((p) => ({
      ...p,
      [field]: p[field].includes(v)
        ? p[field].filter((i) => i !== v)
        : [...p[field], v],
    }));
  };

  function canAdvance() {
    if (step === 1) {
      return form.companyName.trim().length > 0 && form.contactName.trim().length > 0;
    }
    return true;
  }

  async function submit() {
    if (!form.email.trim().includes("@")) {
      setError(t("validation.validEmail"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ops/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          recommendation: {
            score: recommendation.complexityScore,
            tierLabel: recommendation.tierLabel,
            priceRange: recommendation.displayRange,
            summary: recommendation.summary,
            pricingVersion: recommendation.version,
            position: recommendation.position,
            isCustomScope: recommendation.isCustomScope,
            band: recommendation.band,
            reasons: recommendation.reasons,
            complexityFlags: recommendation.complexityFlags,
          },
          preferredLocale: locale,
        }),
      });

      if (!res.ok) throw new Error(t("validation.submitError"));
      const data = await res.json();
      router.push(data.nextUrl || "/ops-thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("validation.submitError"));
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <div className="kicker">
        <span className="kickerDot" /> {t("kicker")}
      </div>
      <h1 className="h1" style={{ marginTop: 12 }}>
        {t("title")}
      </h1>
      <p className="p" style={{ marginBottom: 24 }}>
        {t("stepCounter", { current: step, stepTitle: tStep(String(step)) })}
      </p>

      <div
        style={{
          height: 4,
          background: "var(--stroke)",
          borderRadius: 99,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(step / 4) * 100}%`,
            height: "100%",
            background: "var(--accent)",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <section className="card">
        <div className="cardInner" style={{ display: "grid", gap: 20 }}>
          {step === 1 && (
            <>
              <h2 className="h2">{t("step1.heading")}</h2>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">{t("step1.companyLabel")}</label>
                  <input
                    className="input"
                    placeholder={t("step1.companyPlaceholder")}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="fieldLabel">{t("step1.contactLabel")}</label>
                  <input
                    className="input"
                    placeholder={t("step1.contactPlaceholder")}
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="fieldLabel">{t("step1.industryLabel")}</label>
                <input
                  className="input"
                  placeholder={t("step1.industryPlaceholder")}
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">{t("step1.teamSizeLabel")}</label>
                  <select
                    className="select"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                  >
                    {TEAM_SIZE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{tEnumTeam(o)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fieldLabel">{t("step1.jobVolumeLabel")}</label>
                  <select
                    className="select"
                    value={form.jobVolume}
                    onChange={(e) => setForm({ ...form, jobVolume: e.target.value })}
                  >
                    {JOB_VOLUME_OPTIONS.map((o) => (
                      <option key={o} value={o}>{tEnumVolume(o)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">{t("step1.monthlyRevenueLabel")}</label>
                  <select
                    className="select"
                    value={form.monthlyRevenue}
                    onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                  >
                    {REVENUE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{tEnumRev(r)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fieldLabel">{t("step1.currentWebsiteLabel")}</label>
                  <input
                    className="input"
                    placeholder={t("step1.currentWebsitePlaceholder")}
                    value={form.currentWebsite}
                    onChange={(e) => setForm({ ...form, currentWebsite: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h2">{t("step2.heading")}</h2>
              <div>
                <label className="fieldLabel">{t("step2.toolsLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {TOOLS_LIST.map((tool) => (
                    <CheckRow
                      key={tool}
                      label={tEnumTools(tool)}
                      checked={form.currentTools.includes(tool)}
                      onChange={() => toggleArray("currentTools", tool)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.painLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {PAIN_POINTS_LIST.map((p) => (
                    <CheckRow
                      key={p}
                      label={tEnumPain(p)}
                      checked={form.painPoints.includes(p)}
                      onChange={() => toggleArray("painPoints", p)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.triedBeforeLabel")}</label>
                <select
                  className="select"
                  value={form.triedBefore}
                  onChange={(e) => setForm({ ...form, triedBefore: e.target.value })}
                >
                  {TRIED_BEFORE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{tEnumTried(o)}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h2">{t("step3.heading")}</h2>
              <div>
                <label className="fieldLabel">{t("step3.workflowsLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {WORKFLOWS_LIST.map((w) => (
                    <CheckRow
                      key={w}
                      label={tEnumWorkflows(w)}
                      checked={form.workflowsNeeded.includes(w)}
                      onChange={() => toggleArray("workflowsNeeded", w)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.budgetLabel")}</label>
                <select
                  className="select"
                  value={form.budgetRange}
                  onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b}>{tEnumBudget(b)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fieldLabel">{t("step3.urgencyLabel")}</label>
                <select
                  className="select"
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  {URGENCY_OPTIONS.map((u) => (
                    <option key={u} value={u}>{tEnumUrgency(u)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fieldLabel">{t("step3.notesLabel")}</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={t("step3.notesPlaceholder")}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div
                style={{
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent)",
                  padding: 20,
                  borderRadius: 12,
                }}
              >
                <div className="fieldLabel" style={{ color: "var(--accent)" }}>
                  {t("step4.recommendedEngagement")}
                </div>
                <div style={{ fontSize: 28, fontWeight: 950, marginTop: 6 }}>
                  {recommendation.tierLabel}
                </div>
                <div className="pDark" style={{ marginTop: 8 }}>
                  {recommendation.isCustomScope ? recommendation.publicMessage : recommendation.displayRange}
                </div>
                <div className="smallNote" style={{ marginTop: 8 }}>
                  {recommendation.summary}
                </div>
              </div>

              {recommendation.complexityFlags.length > 0 ? (
                <div>
                  <div className="fieldLabel">{t("step4.complexityFlags")}</div>
                  <div className="pills" style={{ marginTop: 10 }}>
                    {recommendation.complexityFlags.map((flag) => (
                      <span key={flag} className="pill">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h2 className="h2">{t("step4.auditDestinationHeading")}</h2>
                <div className="grid2">
                  <div>
                    <label className="fieldLabel">{t("step4.emailLabel")}</label>
                    <input
                      className="input"
                      type="email"
                      placeholder={t("step4.emailPlaceholder")}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="fieldLabel">{t("step4.phoneLabel")}</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder={t("step4.phonePlaceholder")}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div className="fieldLabel">{t("step4.whyHeading")}</div>
                {recommendation.reasons.map((reason, idx) => (
                  <div
                    key={`${reason.label}-${idx}`}
                    style={{
                      border: "1px solid var(--stroke)",
                      background: "var(--panel2)",
                      borderRadius: 10,
                      padding: "12px 12px",
                    }}
                  >
                    <div style={{ color: "var(--fg)", fontWeight: 800 }}>{reason.label}</div>
                    <div className="pDark" style={{ marginTop: 4 }}>
                      {reason.note}
                    </div>
                  </div>
                ))}
              </div>

              <div className="smallNote">{PRICING_MESSAGES.depositPolicy}</div>

              {error ? <div style={{ color: "var(--accent)", fontSize: 14 }}>{error}</div> : null}
            </>
          )}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        {step > 1 ? (
          <button className="btn btnGhost" onClick={() => setStep(step - 1)}>
            {t("nav.back")}
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            className="btn btnPrimary"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            style={{ opacity: canAdvance() ? 1 : 0.5 }}
          >
            {t("nav.continue")} <span className="btnArrow">→</span>
          </button>
        ) : (
          <button className="btn btnPrimary" onClick={submit} disabled={loading}>
            {loading ? t("nav.submitting") : `${t("nav.submit")} →`}
          </button>
        )}
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
  onChange: () => void;
}) {
  return (
    <label
      className="checkRow"
      style={{
        cursor: "pointer",
        background: checked ? "var(--accent-soft)" : "var(--paper-2)",
        borderColor: checked ? "var(--accent)" : "var(--rule)",
      }}
    >
      <div className="checkLeft">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ accentColor: "var(--accent)" }}
        />
        <div className="checkLabel">{label}</div>
      </div>
    </label>
  );
}
