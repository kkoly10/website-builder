"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/client";
import ScrollReveal from "@/components/site/ScrollReveal";

type CustomAppFormState = {
  projectDescription: string;
  companyName: string;
  contactName: string;
  targetUsers: string;
  currentSolution: string;
  userScale: string;
  stage: string;
  scopePreference: string;
  timeline: string;
  email: string;
  phone: string;
};

const TARGET_USER_OPTIONS = [
  "internal-team",
  "paying-customers",
  "both",
  "partners",
] as const;

const USER_SCALE_OPTIONS = [
  "under-100",
  "100-1000",
  "1000-10k",
  "10k-plus",
] as const;

const STAGE_OPTIONS = [
  "exploring",
  "validated",
  "funded",
  "replacing",
] as const;

const SCOPE_OPTIONS = [
  "discovery",
  "mvp",
  "full",
  "not-sure",
] as const;

const TIMELINE_OPTIONS = [
  "asap",
  "1-3-months",
  "3-6-months",
  "flexible",
] as const;

type RadioGroupProps = {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  labelFn: (v: string) => string;
  descFn?: (v: string) => string;
};

function RadioGroup({ options, value, onChange, labelFn, descFn }: RadioGroupProps) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
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
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>
                {labelFn(opt)}
              </div>
              {descFn && (
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {descFn(opt)}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function CustomAppIntakeClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("customAppIntake");
  const tStep = useTranslations("customAppIntake.stepTitles");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CustomAppFormState>({
    projectDescription: "",
    companyName: "",
    contactName: "",
    targetUsers: "paying-customers",
    currentSolution: "",
    userScale: "under-100",
    stage: "validated",
    scopePreference: "not-sure",
    timeline: "3-6-months",
    email: "",
    phone: "",
  });

  const TOTAL_STEPS = 4;

  function canAdvance() {
    if (step === 1) {
      return form.projectDescription.trim().length > 20 && form.companyName.trim().length > 0 && form.contactName.trim().length > 0;
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
            companyName: form.companyName,
            projectDescription: form.projectDescription,
            targetUsers: form.targetUsers,
            currentSolution: form.currentSolution,
            userScale: form.userScale,
            stage: form.stage,
            scopePreference: form.scopePreference,
            timeline: form.timeline,
          },
        }),
      });

      if (!res.ok) throw new Error(t("validation.submitError"));
      const data = await res.json();
      trackEvent({
        event: "custom_app_intake_submitted",
        metadata: {
          stage: form.stage,
          scope: form.scopePreference,
          timeline: form.timeline,
          targetUsers: form.targetUsers,
          userScale: form.userScale,
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
        {t("stepCounter", { current: step, total: TOTAL_STEPS, stepTitle: tStep(String(step)) })}
      </p>

      {/* Progress bar */}
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
            width: `${(step / TOTAL_STEPS) * 100}%`,
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
              <div>
                <label className="fieldLabel">{t("step1.descriptionLabel")}</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder={t("step1.descriptionPlaceholder")}
                  value={form.projectDescription}
                  onChange={(e) => setForm({ ...form, projectDescription: e.target.value })}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
              {!canAdvance() && form.projectDescription.length > 0 && form.projectDescription.length < 20 && (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {t("step1.descriptionHint")}
                </p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h2">{t("step2.heading")}</h2>
              <div>
                <label className="fieldLabel">{t("step2.targetUsersLabel")}</label>
                <div style={{ marginTop: 10 }}>
                  <RadioGroup
                    options={TARGET_USER_OPTIONS}
                    value={form.targetUsers}
                    onChange={(v) => setForm({ ...form, targetUsers: v })}
                    labelFn={(v) => t(`enums.targetUsers.${v}`)}
                  />
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.currentSolutionLabel")}</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder={t("step2.currentSolutionPlaceholder")}
                  value={form.currentSolution}
                  onChange={(e) => setForm({ ...form, currentSolution: e.target.value })}
                />
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.userScaleLabel")}</label>
                <div style={{ marginTop: 10 }}>
                  <RadioGroup
                    options={USER_SCALE_OPTIONS}
                    value={form.userScale}
                    onChange={(v) => setForm({ ...form, userScale: v })}
                    labelFn={(v) => t(`enums.userScale.${v}`)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h2">{t("step3.heading")}</h2>
              <div>
                <label className="fieldLabel">{t("step3.stageLabel")}</label>
                <div style={{ marginTop: 10 }}>
                  <RadioGroup
                    options={STAGE_OPTIONS}
                    value={form.stage}
                    onChange={(v) => setForm({ ...form, stage: v })}
                    labelFn={(v) => t(`enums.stage.${v}.label`)}
                    descFn={(v) => t(`enums.stage.${v}.desc`)}
                  />
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.scopeLabel")}</label>
                <div style={{ marginTop: 10 }}>
                  <RadioGroup
                    options={SCOPE_OPTIONS}
                    value={form.scopePreference}
                    onChange={(v) => setForm({ ...form, scopePreference: v })}
                    labelFn={(v) => t(`enums.scope.${v}.label`)}
                    descFn={(v) => t(`enums.scope.${v}.desc`)}
                  />
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.timelineLabel")}</label>
                <div style={{ marginTop: 10 }}>
                  <RadioGroup
                    options={TIMELINE_OPTIONS}
                    value={form.timeline}
                    onChange={(v) => setForm({ ...form, timeline: v })}
                    labelFn={(v) => t(`enums.timeline.${v}`)}
                  />
                </div>
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
                  {t("step4.nextStep")}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "var(--fg)" }}>
                  {t("step4.nextStepValue")}
                </div>
                <div className="pDark" style={{ marginTop: 8 }}>
                  {t("step4.nextStepDetail")}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid var(--stroke)",
                  background: "var(--panel2)",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div className="fieldLabel" style={{ marginBottom: 10 }}>
                  {t("step4.summaryLabel")}
                </div>
                <div style={{ display: "grid", gap: 6, fontSize: 13, color: "var(--muted)" }}>
                  <p><strong style={{ color: "var(--fg)" }}>{t("step4.summaryScope")}</strong> {t(`enums.scope.${form.scopePreference}.label`)}</p>
                  <p><strong style={{ color: "var(--fg)" }}>{t("step4.summaryStage")}</strong> {t(`enums.stage.${form.stage}.label`)}</p>
                  <p><strong style={{ color: "var(--fg)" }}>{t("step4.summaryTimeline")}</strong> {t(`enums.timeline.${form.timeline}`)}</p>
                  <p><strong style={{ color: "var(--fg)" }}>{t("step4.summaryUsers")}</strong> {t(`enums.targetUsers.${form.targetUsers}`)}</p>
                </div>
              </div>

              <h2 className="h2">{t("step4.contactHeading")}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

              <p style={{ fontSize: 13, color: "var(--muted)" }}>{t("step4.privacyNote")}</p>

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

        {step < TOTAL_STEPS ? (
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
