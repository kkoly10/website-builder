"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/client";
import ScrollReveal from "@/components/site/ScrollReveal";

type PortalFormState = {
  contactName: string;
  companyName: string;
  accessType: string;
  currentProcess: string;
  features: string[];
  integration: string;
  integrations: string[];
  integrationNotes: string;
  compliance: string[];
  timeline: string;
  userCount: string;
  hasTechTeam: string;
  budget: string;
  budgetFlexibility: string;
  hardDeadline: string;
  deadlineReason: string;
  decisionMaker: string;
  approvalProcess: string;
  postLaunch: string;
  email: string;
  phone: string;
  notes: string;
};

const ACCESS_OPTIONS = ["clients", "team", "both"] as const;

const FEATURE_OPTIONS = [
  "docs",
  "status",
  "invoicing",
  "onboarding",
  "messaging",
  "reporting",
  "uploads",
  "forms",
] as const;

const TIMELINE_OPTIONS = ["asap", "1-3-months", "3-6-months", "flexible"] as const;

const USER_COUNT_OPTIONS = ["under-25", "25-100", "100-500", "500-2000", "2000-plus"] as const;
const TECH_TEAM_OPTIONS = ["yes", "no", "one-person"] as const;

const INTEGRATION_OPTIONS = [
  "Salesforce",
  "HubSpot CRM",
  "Pipedrive",
  "Other CRM",
  "Stripe",
  "PayPal / Braintree",
  "QuickBooks / Xero",
  "Other billing tool",
  "Google SSO",
  "Microsoft / Active Directory",
  "Auth0",
  "Custom login system",
  "Slack",
  "Twilio SMS",
  "Transactional email (SendGrid / Postmark)",
  "Other comms",
  "Internal database / ERP",
  "Google Sheets / Airtable",
  "External vendor API",
  "Other data source",
] as const;

const COMPLIANCE_OPTIONS = ["pci", "hipaa", "gdpr", "wcag", "government", "none"] as const;

const BUDGET_OPTIONS = ["15k-25k", "25k-50k", "50k-100k", "100k-plus", "guidance"] as const;
const DEADLINE_OPTIONS = ["yes", "no", "soft"] as const;
const APPROVAL_OPTIONS = ["solo", "small-team", "board", "legal", "not-sure"] as const;
const POST_LAUNCH_OPTIONS = ["crecy-manages", "internal", "full-files", "not-decided"] as const;

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

export default function PortalIntakeClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("portalIntake");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<PortalFormState>({
    contactName: "",
    companyName: "",
    accessType: "clients",
    currentProcess: "",
    features: [],
    integration: "none",
    integrations: [],
    integrationNotes: "",
    compliance: [],
    timeline: "1-3-months",
    userCount: "25-100",
    hasTechTeam: "no",
    budget: "",
    budgetFlexibility: "",
    hardDeadline: "no",
    deadlineReason: "",
    decisionMaker: "",
    approvalProcess: "solo",
    postLaunch: "not-decided",
    email: "",
    phone: "",
    notes: "",
  });

  function toggleFeature(v: string) {
    setForm((p) => ({
      ...p,
      features: p.features.includes(v) ? p.features.filter((i) => i !== v) : [...p.features, v],
    }));
  }

  function toggleIntegration(v: string) {
    setForm((p) => ({
      ...p,
      integrations: p.integrations.includes(v)
        ? p.integrations.filter((i) => i !== v)
        : [...p.integrations, v],
    }));
  }

  function toggleCompliance(v: string) {
    setForm((p) => ({
      ...p,
      compliance: p.compliance.includes(v)
        ? p.compliance.filter((i) => i !== v)
        : [...p.compliance, v],
    }));
  }

  function canAdvance() {
    if (step === 1) return form.contactName.trim().length > 0;
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
      const res = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: "web_app",
          contactName: form.contactName,
          email: form.email,
          phone: form.phone || undefined,
          preferredLocale: locale,
          intakeRaw: {
            projectSubType: "portal",
            companyName: form.companyName,
            accessType: form.accessType,
            currentProcess: form.currentProcess,
            features: form.features,
            integration: form.integration,
            integrations: form.integrations,
            integrationNotes: form.integrationNotes,
            compliance: form.compliance,
            timeline: form.timeline,
            userCount: form.userCount,
            hasTechTeam: form.hasTechTeam,
            budget: form.budget,
            budgetFlexibility: form.budgetFlexibility,
            hardDeadline: form.hardDeadline,
            deadlineReason: form.deadlineReason,
            decisionMaker: form.decisionMaker,
            approvalProcess: form.approvalProcess,
            postLaunch: form.postLaunch,
            notes: form.notes,
          },
        }),
      });

      if (!res.ok) throw new Error(t("validation.submitError"));
      const data = await res.json();

      trackEvent({
        event: "portal_intake_submitted",
        metadata: {
          accessType: form.accessType,
          featureCount: form.features.length,
          integrationsCount: form.integrations.length,
          timeline: form.timeline,
          budget: form.budget,
        },
      });

      const quoteId = data?.quoteId;
      const quoteToken = data?.quoteToken;
      if (quoteId) {
        const bookUrl = quoteToken
          ? `/book?quoteId=${encodeURIComponent(quoteId)}&token=${encodeURIComponent(quoteToken)}`
          : `/book?quoteId=${encodeURIComponent(quoteId)}`;
        router.push(bookUrl);
      } else {
        router.push("/contact?type=web_app");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("validation.submitError"));
      setLoading(false);
    }
  }

  const progressPct = (step / 4) * 100;

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <ScrollReveal />

      <div className="kicker">
        <span className="kickerDot" /> {t("kicker")}
      </div>
      <h1 className="h1" style={{ marginTop: 12 }}>
        {t("title")}
      </h1>
      <p className="p" style={{ marginBottom: 24 }}>
        {t("stepCounter", { current: step, stepTitle: t(`stepTitles.${step}`) })}
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
            width: `${progressPct}%`,
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
                  <label className="fieldLabel">{t("step1.contactLabel")}</label>
                  <input
                    className="input"
                    placeholder={t("step1.contactPlaceholder")}
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="fieldLabel">{t("step1.companyLabel")}</label>
                  <input
                    className="input"
                    placeholder={t("step1.companyPlaceholder")}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="fieldLabel">{t("step1.userCountLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {USER_COUNT_OPTIONS.map((opt) => {
                    const active = form.userCount === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, userCount: opt })}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "14px 1fr",
                          gap: 14,
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                            background: active ? "var(--accent)" : "transparent",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        />
                        <div style={{ fontSize: 14, color: "var(--fg)" }}>
                          {t(`enums.userCount.${opt}`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step1.techTeamLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {TECH_TEAM_OPTIONS.map((opt) => {
                    const active = form.hasTechTeam === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, hasTechTeam: opt })}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "14px 1fr",
                          gap: 14,
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                            background: active ? "var(--accent)" : "transparent",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        />
                        <div style={{ fontSize: 14, color: "var(--fg)" }}>
                          {t(`enums.techTeam.${opt}`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step1.accessLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {ACCESS_OPTIONS.map((opt) => {
                    const active = form.accessType === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, accessType: opt })}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "14px 1fr",
                          gap: 14,
                          alignItems: "center",
                          padding: "14px 16px",
                          borderRadius: 12,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                            background: active ? "var(--accent)" : "transparent",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        />
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>
                          {t(`enums.access.${opt}`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step1.currentProcessLabel")}</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.currentProcess}
                  onChange={(e) => setForm({ ...form, currentProcess: e.target.value })}
                  placeholder={t("step1.currentProcessPlaceholder")}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h2">{t("step2.heading")}</h2>
              <div>
                <label className="fieldLabel">{t("step2.featuresLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {FEATURE_OPTIONS.map((f) => (
                    <CheckRow
                      key={f}
                      label={t(`enums.features.${f}`)}
                      checked={form.features.includes(f)}
                      onChange={() => toggleFeature(f)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.integrationsLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {INTEGRATION_OPTIONS.map((opt) => (
                    <CheckRow
                      key={opt}
                      label={opt}
                      checked={form.integrations.includes(opt)}
                      onChange={() => toggleIntegration(opt)}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="fieldLabel">{t("step2.integrationNotesLabel")}</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={form.integrationNotes}
                    onChange={(e) => setForm({ ...form, integrationNotes: e.target.value })}
                    placeholder={t("step2.integrationNotesPlaceholder")}
                  />
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.complianceLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {COMPLIANCE_OPTIONS.map((opt) => (
                    <CheckRow
                      key={opt}
                      label={t(`enums.compliance.${opt}`)}
                      checked={form.compliance.includes(opt)}
                      onChange={() => toggleCompliance(opt)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.timelineLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {TIMELINE_OPTIONS.map((tl) => {
                    const active = form.timeline === tl;
                    return (
                      <button
                        key={tl}
                        type="button"
                        onClick={() => setForm({ ...form, timeline: tl })}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          color: active ? "var(--accent)" : "var(--fg)",
                          transition: "all 0.15s",
                        }}
                      >
                        {t(`enums.timeline.${tl}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h2">{t("step3.heading")}</h2>

              <div>
                <label className="fieldLabel">{t("step3.budgetLabel")}</label>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, marginTop: 4 }}>
                  {t("step3.budgetNote")}
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {BUDGET_OPTIONS.map((opt) => {
                    const active = form.budget === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, budget: opt })}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          color: active ? "var(--accent)" : "var(--fg)",
                          transition: "all 0.15s",
                        }}
                      >
                        {t(`enums.budget.${opt}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.budgetFlexibilityLabel")}</label>
                <input
                  className="input"
                  value={form.budgetFlexibility}
                  onChange={(e) => setForm({ ...form, budgetFlexibility: e.target.value })}
                  placeholder={t("step3.budgetFlexibilityPlaceholder")}
                />
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.deadlineLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {DEADLINE_OPTIONS.map((opt) => {
                    const active = form.hardDeadline === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, hardDeadline: opt })}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "14px 1fr",
                          gap: 14,
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                            background: active ? "var(--accent)" : "transparent",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        />
                        <div style={{ fontSize: 14, color: "var(--fg)" }}>
                          {t(`enums.deadline.${opt}`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {form.hardDeadline === "yes" && (
                  <div style={{ marginTop: 12 }}>
                    <label className="fieldLabel">{t("step3.deadlineReasonLabel")}</label>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={form.deadlineReason}
                      onChange={(e) => setForm({ ...form, deadlineReason: e.target.value })}
                      placeholder={t("step3.deadlineReasonPlaceholder")}
                    />
                  </div>
                )}
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.decisionMakerLabel")}</label>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, marginTop: 4 }}>
                  {t("step3.decisionMakerHelper")}
                </p>
                <input
                  className="input"
                  value={form.decisionMaker}
                  onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })}
                  placeholder={t("step3.decisionMakerPlaceholder")}
                />
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.approvalLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {APPROVAL_OPTIONS.map((opt) => {
                    const active = form.approvalProcess === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, approvalProcess: opt })}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          color: active ? "var(--accent)" : "var(--fg)",
                          transition: "all 0.15s",
                        }}
                      >
                        {t(`enums.approval.${opt}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="h2">{t("step4.heading")}</h2>
              <div
                style={{
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent)",
                  padding: "14px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                {t("step4.estimateNote")}
              </div>

              <div>
                <label className="fieldLabel">{t("step4.postLaunchLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {POST_LAUNCH_OPTIONS.map((opt) => {
                    const active = form.postLaunch === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, postLaunch: opt })}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          color: active ? "var(--accent)" : "var(--fg)",
                          transition: "all 0.15s",
                        }}
                      >
                        {t(`enums.postLaunch.${opt}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
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

              <div>
                <label className="fieldLabel">{t("step4.notesLabel")}</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={t("step4.notesPlaceholder")}
                />
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{t("step4.privacyNote")}</p>
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
