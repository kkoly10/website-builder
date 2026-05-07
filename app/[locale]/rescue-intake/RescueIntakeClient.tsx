"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/client";
import ScrollReveal from "@/components/site/ScrollReveal";
import { getRescuePricing } from "@/lib/pricing";

type RescueFormState = {
  contactName: string;
  companyName: string;
  siteUrl: string;
  platform: string;
  issues: string[];
  urgency: string;
  builtWhen: string;
  builtBy: string;
  previousVendorStatus: string;
  alreadyTried: string;
  assetAccess: string[];
  assetAccessNotes: string;
  previousVendorReason: string;
  seoPreservation: string;
  urlsToPreserve: string;
  budget: string;
  decisionMaker: string;
  email: string;
  phone: string;
  notes: string;
};

const PLATFORM_OPTIONS = [
  "wordpress",
  "webflow",
  "squarespace",
  "wix",
  "custom",
  "other",
] as const;

const ISSUE_OPTIONS = [
  "slow",
  "broken",
  "mobile",
  "design",
  "conversion",
  "seo",
  "cms",
  "security",
] as const;

const URGENCY_OPTIONS = ["critical", "soon", "low"] as const;

const BUILT_WHEN_OPTIONS = [
  "2020-earlier",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "unknown",
] as const;

const PREVIOUS_VENDOR_OPTIONS = [
  "active",
  "ended-revoked",
  "ended-may-still-have",
  "self-built",
  "not-sure",
] as const;

const ASSET_ACCESS_OPTIONS = [
  "domain-registrar",
  "cms-admin",
  "hosting-account",
  "analytics",
  "site-backup",
  "design-files",
] as const;

const SEO_OPTIONS = ["yes-critical", "somewhat", "no", "dont-know"] as const;

const RESCUE_BUDGET_OPTIONS = [
  "under-2k",
  "2k-5k",
  "5k-10k",
  "10k-20k",
  "20k-plus",
  "guidance",
] as const;

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

export default function RescueIntakeClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("rescueIntake");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RescueFormState>({
    contactName: "",
    companyName: "",
    siteUrl: "",
    platform: "",
    issues: [],
    urgency: "soon",
    builtWhen: "unknown",
    builtBy: "",
    previousVendorStatus: "not-sure",
    alreadyTried: "",
    assetAccess: [],
    assetAccessNotes: "",
    previousVendorReason: "",
    seoPreservation: "dont-know",
    urlsToPreserve: "",
    budget: "",
    decisionMaker: "",
    email: "",
    phone: "",
    notes: "",
  });

  function toggleIssue(v: string) {
    setForm((p) => ({
      ...p,
      issues: p.issues.includes(v) ? p.issues.filter((i) => i !== v) : [...p.issues, v],
    }));
  }

  function toggleAssetAccess(v: string) {
    setForm((p) => ({
      ...p,
      assetAccess: p.assetAccess.includes(v)
        ? p.assetAccess.filter((i) => i !== v)
        : [...p.assetAccess, v],
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
      // Phase 4: compute rescue pricing client-side. Same submission
      // pattern as ops/ecommerce/web_app intakes.
      const recommendation = getRescuePricing({
        siteUrl: form.siteUrl,
        platform: form.platform,
        issues: form.issues,
        urgency: form.urgency,
        builtWhen: form.builtWhen,
        builtBy: form.builtBy,
        previousVendorStatus: form.previousVendorStatus,
        alreadyTried: form.alreadyTried,
        assetAccess: form.assetAccess,
        seoPreservation: form.seoPreservation,
        urlsToPreserve: form.urlsToPreserve,
        budget: form.budget,
        notes: form.notes,
      });

      const res = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: "rescue",
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
            siteUrl: form.siteUrl,
            platform: form.platform,
            issues: form.issues,
            urgency: form.urgency,
            builtWhen: form.builtWhen,
            builtBy: form.builtBy,
            previousVendorStatus: form.previousVendorStatus,
            alreadyTried: form.alreadyTried,
            assetAccess: form.assetAccess,
            assetAccessNotes: form.assetAccessNotes,
            previousVendorReason: form.previousVendorReason,
            seoPreservation: form.seoPreservation,
            urlsToPreserve: form.urlsToPreserve,
            budget: form.budget,
            decisionMaker: form.decisionMaker,
            notes: form.notes,
          },
        }),
      });

      if (!res.ok) throw new Error(t("validation.submitError"));
      const data = await res.json();

      trackEvent({
        event: "rescue_intake_submitted",
        metadata: {
          platform: form.platform,
          issueCount: form.issues.length,
          urgency: form.urgency,
          budget: form.budget,
          seoPreservation: form.seoPreservation,
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
        router.push("/contact?type=rescue");
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
                <label className="fieldLabel">{t("step1.siteUrlLabel")}</label>
                <input
                  className="input"
                  type="url"
                  placeholder={t("step1.siteUrlPlaceholder")}
                  value={form.siteUrl}
                  onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="fieldLabel">{t("step1.platformLabel")}</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {PLATFORM_OPTIONS.map((p) => {
                    const active = form.platform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, platform: p })}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: active ? 600 : 400,
                          border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                          background: active ? "var(--accent-bg)" : "transparent",
                          color: active ? "var(--accent)" : "var(--muted)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {t(`enums.platform.${p}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <div className="grid2">
                  <div>
                    <label className="fieldLabel">{t("step1.builtWhenLabel")}</label>
                    <select
                      className="select"
                      value={form.builtWhen}
                      onChange={(e) => setForm({ ...form, builtWhen: e.target.value })}
                      style={{ marginTop: 8 }}
                    >
                      {BUILT_WHEN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {t(`enums.builtWhen.${opt}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="fieldLabel">{t("step1.builtByLabel")}</label>
                    <input
                      className="input"
                      placeholder={t("step1.builtByPlaceholder")}
                      value={form.builtBy}
                      onChange={(e) => setForm({ ...form, builtBy: e.target.value })}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step1.previousVendorLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {PREVIOUS_VENDOR_OPTIONS.map((opt) => {
                    const active = form.previousVendorStatus === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, previousVendorStatus: opt })}
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
                            {t(`enums.previousVendor.${opt}.label`)}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                            {t(`enums.previousVendor.${opt}.desc`)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h2">{t("step2.heading")}</h2>
              <div>
                <label className="fieldLabel">{t("step2.issuesLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {ISSUE_OPTIONS.map((issue) => (
                    <CheckRow
                      key={issue}
                      label={t(`enums.issues.${issue}`)}
                      checked={form.issues.includes(issue)}
                      onChange={() => toggleIssue(issue)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.urgencyLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {URGENCY_OPTIONS.map((u) => {
                    const active = form.urgency === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setForm({ ...form, urgency: u })}
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
                            {t(`enums.urgency.${u}.label`)}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                            {t(`enums.urgency.${u}.desc`)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step2.alreadyTriedLabel")}</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.alreadyTried}
                  onChange={(e) => setForm({ ...form, alreadyTried: e.target.value })}
                  placeholder={t("step2.alreadyTriedPlaceholder")}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h2">{t("step3.heading")}</h2>

              <div>
                <label className="fieldLabel">{t("step3.assetAccessLabel")}</label>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, marginTop: 4 }}>
                  {t("step3.assetAccessHelper")}
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {ASSET_ACCESS_OPTIONS.map((opt) => (
                    <CheckRow
                      key={opt}
                      label={t(`enums.assetAccess.${opt}`)}
                      checked={form.assetAccess.includes(opt)}
                      onChange={() => toggleAssetAccess(opt)}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className="fieldLabel">{t("step3.assetAccessNotesLabel")}</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={form.assetAccessNotes}
                    onChange={(e) => setForm({ ...form, assetAccessNotes: e.target.value })}
                    placeholder={t("step3.assetAccessNotesPlaceholder")}
                  />
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.previousVendorReasonLabel")}</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={form.previousVendorReason}
                  onChange={(e) => setForm({ ...form, previousVendorReason: e.target.value })}
                  placeholder={t("step3.previousVendorReasonPlaceholder")}
                />
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--stroke)" }}>
                <label className="fieldLabel">{t("step3.seoLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {SEO_OPTIONS.map((opt) => {
                    const active = form.seoPreservation === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, seoPreservation: opt })}
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
                        {t(`enums.seo.${opt}`)}
                      </button>
                    );
                  })}
                </div>
                {(form.seoPreservation === "yes-critical" ||
                  form.seoPreservation === "somewhat") && (
                  <div style={{ marginTop: 12 }}>
                    <label className="fieldLabel">{t("step3.urlsToPreserveLabel")}</label>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={form.urlsToPreserve}
                      onChange={(e) => setForm({ ...form, urlsToPreserve: e.target.value })}
                      placeholder={t("step3.urlsToPreservePlaceholder")}
                    />
                  </div>
                )}
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
                <label className="fieldLabel">{t("step4.budgetLabel")}</label>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {RESCUE_BUDGET_OPTIONS.map((opt) => {
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

              <div>
                <label className="fieldLabel">{t("step4.decisionMakerLabel")}</label>
                <input
                  className="input"
                  value={form.decisionMaker}
                  onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })}
                  placeholder={t("step4.decisionMakerPlaceholder")}
                />
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
