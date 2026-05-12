"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/client";
import ScrollReveal from "@/components/site/ScrollReveal";
import { getAiIntakePricing } from "@/lib/pricing";

type AiIntakeFormState = {
  // Step 1 — use case
  companyName: string;
  contactName: string;
  productDescription: string;
  useCase: string;
  useCaseOther: string;
  // Step 2 — technical context
  productType: string;
  currentStack: string[];
  aiCurrentlyUsed: string;
  aiCurrentProvider: string;
  dataClassification: string[];
  // Step 3 — safety & autonomy
  autonomyLevel: string;
  aiOutputAudience: string;
  mistakeConsequence: string;
  auditTrail: string;
  // Step 4 — scope & contact
  dailyVolume: string;
  timeline: string;
  budget: string;
  decisionMaker: string;
  approvalProcess: string;
  email: string;
  phone: string;
};

const USE_CASE_OPTIONS = [
  "copilot",
  "triage",
  "generation",
  "vision",
  "monitoring",
  "other",
] as const;

const PRODUCT_TYPE_OPTIONS = [
  "saas",
  "internal",
  "api",
  "mobile",
  "none",
] as const;

const AI_USED_OPTIONS = [
  "none",
  "openai",
  "anthropic",
  "other_provider",
  "multiple",
] as const;

const STACK_OPTIONS = [
  "nextjs",
  "vue",
  "node",
  "python",
  "rails",
  "dotnet",
  "php",
  "other",
] as const;

const DATA_CLASSIFICATION_OPTIONS = [
  "personal",
  "financial",
  "health",
  "legal",
  "operational",
] as const;

const AUTONOMY_OPTIONS = [
  "suggest",
  "confirm",
  "auto_low",
  "autonomous",
] as const;

const AUDIENCE_OPTIONS = ["internal", "clients", "both"] as const;

const CONSEQUENCE_OPTIONS = [
  "cosmetic",
  "operational",
  "client_facing",
  "financial_legal",
] as const;

const AUDIT_TRAIL_OPTIONS = ["required", "preferred", "not_needed"] as const;

const VOLUME_OPTIONS = [
  "under_100",
  "100_1k",
  "1k_10k",
  "10k_plus",
  "not_sure",
] as const;

const TIMELINE_OPTIONS = [
  "asap",
  "1-3-months",
  "3-6-months",
  "flexible",
] as const;

const AI_BUDGET_OPTIONS = [
  "5k-15k",
  "15k-35k",
  "35k-75k",
  "75k-plus",
  "guidance",
] as const;

const APPROVAL_OPTIONS = [
  "solo",
  "small-team",
  "board",
  "legal",
  "not-sure",
] as const;

function RadioGroup({
  options,
  value,
  onChange,
  getLabel,
  getDesc,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  getLabel: (v: string) => string;
  getDesc?: (v: string) => string;
}) {
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
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>
                {getLabel(opt)}
              </div>
              {getDesc && (
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {getDesc(opt)}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CheckRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${checked ? "var(--accent)" : "var(--stroke)"}`,
        background: checked ? "var(--accent-bg)" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: "var(--accent)", marginTop: 2, flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: 14, fontWeight: checked ? 600 : 400, color: "var(--fg)" }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
        )}
      </div>
    </label>
  );
}

export default function AiIntakeClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("aiIntake");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AiIntakeFormState>({
    companyName: "",
    contactName: "",
    productDescription: "",
    useCase: "",
    useCaseOther: "",
    productType: "",
    currentStack: [],
    aiCurrentlyUsed: "",
    aiCurrentProvider: "",
    dataClassification: [],
    autonomyLevel: "",
    aiOutputAudience: "",
    mistakeConsequence: "",
    auditTrail: "",
    dailyVolume: "",
    timeline: "",
    budget: "",
    decisionMaker: "",
    approvalProcess: "",
    email: "",
    phone: "",
  });

  function toggleStack(v: string) {
    setForm((p) => ({
      ...p,
      currentStack: p.currentStack.includes(v)
        ? p.currentStack.filter((i) => i !== v)
        : [...p.currentStack, v],
    }));
  }

  function toggleData(v: string) {
    setForm((p) => ({
      ...p,
      dataClassification: p.dataClassification.includes(v)
        ? p.dataClassification.filter((i) => i !== v)
        : [...p.dataClassification, v],
    }));
  }

  function canAdvance(): boolean {
    if (step === 1) {
      return (
        form.contactName.trim().length > 0 &&
        form.companyName.trim().length > 0 &&
        form.productDescription.trim().length > 20 &&
        form.useCase.length > 0
      );
    }
    if (step === 2) {
      return form.productType.length > 0 && form.aiCurrentlyUsed.length > 0;
    }
    if (step === 3) {
      return (
        form.autonomyLevel.length > 0 &&
        form.aiOutputAudience.length > 0 &&
        form.mistakeConsequence.length > 0 &&
        form.auditTrail.length > 0
      );
    }
    return true;
  }

  async function submit() {
    if (!form.email.trim().includes("@")) {
      setError(t("validation.validEmail"));
      return;
    }
    if (!form.dailyVolume || !form.timeline) {
      setError(t("validation.requiredFields"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const recommendation = getAiIntakePricing({
        useCase: form.useCase === "other" ? form.useCaseOther || "other" : form.useCase,
        productType: form.productType,
        currentStack: form.currentStack,
        aiCurrentlyUsed: form.aiCurrentlyUsed,
        dataClassification: form.dataClassification,
        autonomyLevel: form.autonomyLevel,
        aiOutputAudience: form.aiOutputAudience,
        mistakeConsequence: form.mistakeConsequence,
        auditTrail: form.auditTrail,
        dailyVolume: form.dailyVolume,
        timeline: form.timeline,
        budget: form.budget,
      });

      const res = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: "ai_integration",
          contactName: form.contactName,
          email: form.email,
          phone: form.phone || undefined,
          preferredLocale: locale,
          pricing: {
            version: recommendation.version,
            lane: recommendation.lane,
            tierKey: recommendation.tierKey,
            tierLabel: recommendation.tierLabel,
            estimateCents: recommendation.band.target * 100,
            estimateLowCents: recommendation.band.min * 100,
            estimateHighCents: recommendation.band.max * 100,
            displayRange: recommendation.displayRange,
            position: recommendation.position,
            isCustomScope: recommendation.isCustomScope,
            reasons: recommendation.reasons,
            complexityFlags: recommendation.complexityFlags,
            complexityScore: recommendation.complexityScore,
          },
          intakeRaw: {
            companyName: form.companyName,
            useCase: form.useCase,
            useCaseOther: form.useCaseOther,
            productType: form.productType,
            currentStack: form.currentStack,
            aiCurrentlyUsed: form.aiCurrentlyUsed,
            aiCurrentProvider: form.aiCurrentProvider,
            dataClassification: form.dataClassification,
            autonomyLevel: form.autonomyLevel,
            aiOutputAudience: form.aiOutputAudience,
            mistakeConsequence: form.mistakeConsequence,
            auditTrail: form.auditTrail,
            dailyVolume: form.dailyVolume,
            timeline: form.timeline,
            budget: form.budget,
            decisionMaker: form.decisionMaker,
            approvalProcess: form.approvalProcess,
          },
        }),
      });

      if (!res.ok) throw new Error(t("validation.submitError"));
      const data = await res.json();

      trackEvent({
        event: "ai_intake_submitted",
        metadata: {
          useCase: form.useCase,
          autonomyLevel: form.autonomyLevel,
          mistakeConsequence: form.mistakeConsequence,
          dataClassification: form.dataClassification,
          tierKey: recommendation.tierKey,
          complexityScore: recommendation.complexityScore,
          isCustomScope: recommendation.isCustomScope,
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
        router.push("/contact?type=ai_integration");
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

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          background: "var(--stroke)",
          borderRadius: 999,
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "var(--accent)",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* ─── Step 1: Use case ─── */}
      {step === 1 && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step1.contactHeading")}</h2>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}
                >
                  {t("step1.contactNameLabel")}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={t("step1.contactNamePlaceholder")}
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}
                >
                  {t("step1.companyLabel")}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={t("step1.companyPlaceholder")}
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step1.productHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step1.productSubtitle")}</p>
            </div>
            <textarea
              className="textarea"
              rows={4}
              placeholder={t("step1.productPlaceholder")}
              value={form.productDescription}
              onChange={(e) => setForm((p) => ({ ...p, productDescription: e.target.value }))}
              style={{ resize: "vertical" }}
            />
            {form.productDescription.trim().length > 0 &&
              form.productDescription.trim().length <= 20 && (
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {t("step1.productMinLength")}
                </p>
              )}
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step1.useCaseHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step1.useCaseSubtitle")}</p>
            </div>
            <RadioGroup
              options={USE_CASE_OPTIONS}
              value={form.useCase}
              onChange={(v) => setForm((p) => ({ ...p, useCase: v }))}
              getLabel={(v) => t(`enums.useCase.${v}.label`)}
              getDesc={(v) => t(`enums.useCase.${v}.desc`)}
            />
            {form.useCase === "other" && (
              <input
                type="text"
                className="input"
                style={{ marginTop: 10 }}
                placeholder={t("step1.useCaseOtherPlaceholder")}
                value={form.useCaseOther}
                onChange={(e) => setForm((p) => ({ ...p, useCaseOther: e.target.value }))}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Step 2: Technical context ─── */}
      {step === 2 && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step2.productTypeHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step2.productTypeSubtitle")}</p>
            </div>
            <RadioGroup
              options={PRODUCT_TYPE_OPTIONS}
              value={form.productType}
              onChange={(v) => setForm((p) => ({ ...p, productType: v }))}
              getLabel={(v) => t(`enums.productType.${v}.label`)}
              getDesc={(v) => t(`enums.productType.${v}.desc`)}
            />
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step2.stackHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step2.stackSubtitle")}</p>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {STACK_OPTIONS.map((s) => (
                <CheckRow
                  key={s}
                  label={t(`stack.${s}`)}
                  checked={form.currentStack.includes(s)}
                  onChange={() => toggleStack(s)}
                />
              ))}
            </div>
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step2.aiUsedHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step2.aiUsedSubtitle")}</p>
            </div>
            <RadioGroup
              options={AI_USED_OPTIONS}
              value={form.aiCurrentlyUsed}
              onChange={(v) => setForm((p) => ({ ...p, aiCurrentlyUsed: v }))}
              getLabel={(v) => t(`enums.aiUsed.${v}.label`)}
              getDesc={(v) => t(`enums.aiUsed.${v}.desc`)}
            />
            {(form.aiCurrentlyUsed === "other_provider" ||
              form.aiCurrentlyUsed === "multiple") && (
              <input
                type="text"
                className="input"
                style={{ marginTop: 10 }}
                placeholder={t("step2.aiProviderPlaceholder")}
                value={form.aiCurrentProvider}
                onChange={(e) =>
                  setForm((p) => ({ ...p, aiCurrentProvider: e.target.value }))
                }
              />
            )}
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step2.dataHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step2.dataSubtitle")}</p>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {DATA_CLASSIFICATION_OPTIONS.map((d) => (
                <CheckRow
                  key={d}
                  label={t(`data.${d}.label`)}
                  desc={t(`data.${d}.desc`)}
                  checked={form.dataClassification.includes(d)}
                  onChange={() => toggleData(d)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Safety & autonomy ─── */}
      {step === 3 && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Safety brief */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid var(--rule)",
              background: "var(--panel2)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {t("step3.safetyNote")}
            </p>
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step3.autonomyHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step3.autonomySubtitle")}</p>
            </div>
            <RadioGroup
              options={AUTONOMY_OPTIONS}
              value={form.autonomyLevel}
              onChange={(v) => setForm((p) => ({ ...p, autonomyLevel: v }))}
              getLabel={(v) => t(`enums.autonomy.${v}.label`)}
              getDesc={(v) => t(`enums.autonomy.${v}.desc`)}
            />
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step3.audienceHeading")}</h2>
            </div>
            <RadioGroup
              options={AUDIENCE_OPTIONS}
              value={form.aiOutputAudience}
              onChange={(v) => setForm((p) => ({ ...p, aiOutputAudience: v }))}
              getLabel={(v) => t(`enums.audience.${v}.label`)}
              getDesc={(v) => t(`enums.audience.${v}.desc`)}
            />
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step3.consequenceHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step3.consequenceSubtitle")}</p>
            </div>
            <RadioGroup
              options={CONSEQUENCE_OPTIONS}
              value={form.mistakeConsequence}
              onChange={(v) => setForm((p) => ({ ...p, mistakeConsequence: v }))}
              getLabel={(v) => t(`enums.consequence.${v}.label`)}
              getDesc={(v) => t(`enums.consequence.${v}.desc`)}
            />
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step3.auditHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step3.auditSubtitle")}</p>
            </div>
            <RadioGroup
              options={AUDIT_TRAIL_OPTIONS}
              value={form.auditTrail}
              onChange={(v) => setForm((p) => ({ ...p, auditTrail: v }))}
              getLabel={(v) => t(`enums.auditTrail.${v}.label`)}
              getDesc={(v) => t(`enums.auditTrail.${v}.desc`)}
            />
          </div>
        </div>
      )}

      {/* ─── Step 4: Scope & contact ─── */}
      {step === 4 && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step4.volumeHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step4.volumeSubtitle")}</p>
            </div>
            <RadioGroup
              options={VOLUME_OPTIONS}
              value={form.dailyVolume}
              onChange={(v) => setForm((p) => ({ ...p, dailyVolume: v }))}
              getLabel={(v) => t(`enums.volume.${v}.label`)}
              getDesc={(v) => t(`enums.volume.${v}.desc`)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="portalPanel">
              <div className="portalPanelHeader">
                <h2 className="portalPanelTitle">{t("step4.timelineHeading")}</h2>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {TIMELINE_OPTIONS.map((tl) => {
                  const active = form.timeline === tl;
                  return (
                    <button
                      key={tl}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, timeline: tl }))}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                        textAlign: "left",
                        border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                        background: active ? "var(--accent-bg)" : "transparent",
                        color: active ? "var(--fg)" : "var(--muted)",
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {t(`enums.timeline.${tl}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="portalPanel">
              <div className="portalPanelHeader">
                <h2 className="portalPanelTitle">{t("step4.budgetHeading")}</h2>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {AI_BUDGET_OPTIONS.map((b) => {
                  const active = form.budget === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, budget: b }))}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                        textAlign: "left",
                        border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                        background: active ? "var(--accent-bg)" : "transparent",
                        color: active ? "var(--fg)" : "var(--muted)",
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {t(`enums.budget.${b}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step4.approvalHeading")}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{t("step4.approvalSubtitle")}</p>
            </div>
            <RadioGroup
              options={APPROVAL_OPTIONS}
              value={form.approvalProcess}
              onChange={(v) => setForm((p) => ({ ...p, approvalProcess: v }))}
              getLabel={(v) => t(`enums.approval.${v}.label`)}
              getDesc={(v) => t(`enums.approval.${v}.desc`)}
            />
          </div>

          <div className="portalPanel">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">{t("step4.contactHeading")}</h2>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}
                >
                  {t("step4.emailLabel")}
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder={t("step4.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}
                >
                  {t("step4.phoneLabel")}
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder={t("step4.phonePlaceholder")}
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}
                >
                  {t("step4.decisionMakerLabel")}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={t("step4.decisionMakerPlaceholder")}
                  value={form.decisionMaker}
                  onChange={(e) => setForm((p) => ({ ...p, decisionMaker: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--error, #e53e3e)", marginTop: 4 }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 32,
          gap: 12,
        }}
      >
        {step > 1 ? (
          <button
            type="button"
            className="btn btnGhost"
            onClick={() => setStep((s) => s - 1)}
          >
            {t("nav.back")}
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            className="btn btnPrimary"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
            style={{ opacity: canAdvance() ? 1 : 0.45, cursor: canAdvance() ? "pointer" : "not-allowed" }}
          >
            {t("nav.next")} <span className="btnArrow">→</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btnPrimary btnLg"
            disabled={loading}
            onClick={submit}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? t("nav.submitting") : t("nav.submit")}
            {!loading && <span className="btnArrow">→</span>}
          </button>
        )}
      </div>
    </main>
  );
}
