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
  timeline: string;
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

const INTEGRATION_OPTIONS = [
  "none",
  "crm",
  "billing",
  "project-mgmt",
  "custom-api",
] as const;

const TIMELINE_OPTIONS = ["asap", "1-3-months", "3-6-months", "flexible"] as const;

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
    timeline: "1-3-months",
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
            timeline: form.timeline,
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
          integration: form.integration,
          timeline: form.timeline,
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

  const progressPct = (step / 3) * 100;

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
              <div>
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
                <label className="fieldLabel">{t("step2.integrationLabel")}</label>
                <select
                  className="select"
                  value={form.integration}
                  onChange={(e) => setForm({ ...form, integration: e.target.value })}
                  style={{ marginTop: 8 }}
                >
                  {INTEGRATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(`enums.integration.${opt}`)}
                    </option>
                  ))}
                </select>
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
                {t("step3.estimateNote")}
              </div>
              <div className="grid2">
                <div>
                  <label className="fieldLabel">{t("step3.emailLabel")}</label>
                  <input
                    className="input"
                    type="email"
                    placeholder={t("step3.emailPlaceholder")}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="fieldLabel">{t("step3.phoneLabel")}</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder={t("step3.phonePlaceholder")}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
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
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{t("step3.privacyNote")}</p>
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

        {step < 3 ? (
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
