"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getEcommercePricing } from "@/lib/pricing";

type EntryPath = "build" | "run" | "fix" | null;

// IMPORTANT: All literal values in these arrays are sent verbatim to
// /api/ecommerce/submit-intake and consumed by getEcommercePricing.
// Locale-specific labels render via t(`enums.{group}.{value}`) lookups.
type EcomFormState = {
  entryPath: EntryPath;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  storeUrl: string;
  platform: string;
  salesChannels: string[];
  serviceTypes: string[];
  skuCount: string;
  monthlyOrders: string;
  peakOrders: string;
  storageType: string;
  budgetRange: string;
  timeline: string;
  notes: string;
};

const STORAGE_KEY = "ecom-intake-draft-v2";

const CHANNELS = ["Shopify", "Amazon", "Etsy", "eBay", "WooCommerce", "Walmart", "Own website", "Other"];

const BUILD_SERVICES = [
  "Full store build (design + setup)",
  "Product page design",
  "Checkout flow optimization",
  "Payment gateway setup",
  "Shipping rate configuration",
  "Post-purchase email flow",
];

const RUN_SERVICES = [
  "Product listing management",
  "Order processing & fulfillment coordination",
  "Customer service & returns",
  "Inventory tracking",
  "Marketplace management (Amazon, Etsy, etc.)",
  "Monthly performance reporting",
  "Promotional campaigns & pricing updates",
];

const FIX_SERVICES = [
  "Checkout abandonment audit",
  "Conversion rate optimization",
  "Shipping & fulfillment restructure",
  "Product page overhaul",
  "Post-purchase flow fix",
  "Payment & tax configuration",
];

const PLATFORMS = ["Shopify", "WooCommerce", "BigCommerce", "Squarespace", "Wix", "Amazon Seller Central", "Etsy", "Custom / other", "Don't have one yet"];

const EMPTY_FORM: EcomFormState = {
  entryPath: null,
  businessName: "", contactName: "", email: "", phone: "",
  storeUrl: "", platform: "", salesChannels: [], serviceTypes: [],
  skuCount: "", monthlyOrders: "", peakOrders: "",
  storageType: "Shelf", budgetRange: "", timeline: "", notes: "",
};

const PATH_KEYS: Exclude<EntryPath, null>[] = ["build", "run", "fix"];

export default function EcommerceIntakeClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ecomIntake");
  const tPath = useTranslations("ecomIntake.paths");
  const tEnumChannels = useTranslations("ecomIntake.enums.channels");
  const tEnumPlatforms = useTranslations("ecomIntake.enums.platforms");
  const tEnumBuild = useTranslations("ecomIntake.enums.buildServices");
  const tEnumRun = useTranslations("ecomIntake.enums.runServices");
  const tEnumFix = useTranslations("ecomIntake.enums.fixServices");
  const tRow = useTranslations("ecomIntake.review.rows");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EcomFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm({ ...EMPTY_FORM, ...parsed });
        if (parsed.entryPath) setStep(1);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const emailValid = useMemo(() => /^\S+@\S+\.\S+$/.test(form.email), [form.email]);

  const serviceConfig = useMemo(() => {
    if (form.entryPath === "build") return { options: BUILD_SERVICES, translator: tEnumBuild };
    if (form.entryPath === "run") return { options: RUN_SERVICES, translator: tEnumRun };
    if (form.entryPath === "fix") return { options: FIX_SERVICES, translator: tEnumFix };
    return { options: [] as string[], translator: null as ((k: string) => string) | null };
  }, [form.entryPath, tEnumBuild, tEnumRun, tEnumFix]);

  const recommendation = useMemo(
    () =>
      getEcommercePricing({
        entryPath: form.entryPath,
        businessName: form.businessName,
        platform: form.platform,
        salesChannels: form.salesChannels,
        serviceTypes: form.serviceTypes,
        skuCount: form.skuCount,
        monthlyOrders: form.monthlyOrders,
        peakOrders: form.peakOrders,
        budgetRange: form.budgetRange,
        timeline: form.timeline,
        storeUrl: form.storeUrl,
        notes: form.notes,
      }),
    [form]
  );

  function toggleList(field: "salesChannels" | "serviceTypes", value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  function selectPath(path: EntryPath) {
    setForm((prev) => ({ ...prev, entryPath: path, serviceTypes: [] }));
    setStep(1);
  }

  function next() { setStep((s) => Math.min(s + 1, totalSteps)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  const totalSteps = 4;

  async function submit() {
    if (!form.businessName.trim() || !form.contactName.trim() || !emailValid) {
      setError(t("validation.incomplete"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        entryPath: form.entryPath,
        businessName: form.businessName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        storeUrl: form.storeUrl,
        platform: form.platform,
        salesChannels: form.salesChannels,
        serviceTypes: form.serviceTypes,
        skuCount: form.skuCount,
        monthlyOrders: form.monthlyOrders,
        peakOrders: form.peakOrders,
        storageType: form.storageType,
        budgetRange: form.budgetRange,
        timeline: form.timeline,
        notes: form.notes,
        readinessStage: form.entryPath === "build" ? "need website first"
          : form.entryPath === "fix" ? "already selling"
          : "already selling",
        recommendation,
        unitsInStock: "",
        productSize: "",
        fragile: "No",
        monthlyReturns: "",
        avgItemsPerOrder: "",
        decisionMaker: "",
      };

      const res = await fetch("/api/ecommerce/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, preferredLocale: locale }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || t("validation.submissionFailed"));
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/ecommerce/book?ecomIntakeId=${encodeURIComponent(data.ecomIntakeId)}`);
    } catch (err: any) {
      setError(err.message || t("validation.fallback"));
      setSubmitting(false);
    }
  }

  // Style metadata stays per-path and locale-agnostic; visible label and
  // description come from the dictionary via tPath().
  const pathStyle = {
    build: { color: "var(--accent)", bg: "var(--accent-bg)", border: "var(--accent)" },
    run: { color: "var(--success)", bg: "var(--success-bg)", border: "var(--success)" },
    fix: { color: "var(--muted)", bg: "var(--paper-2)", border: "var(--rule)" },
  } as const;

  const reviewStep = step === 4;

  return (
    <main className="container productWrap">
      <div className="ecomIntakeShell">
        <div className="portalStory heroFadeUp" style={{ paddingBottom: 24 }}>
          <div className="portalStoryKicker">
            <span className="portalStoryKickerDot" />
            {t("kicker")}
          </div>

          <h1 className="portalStoryHeadline" style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
            {step === 0
              ? t.rich("step0Title", { em: (chunks) => <em>{chunks}</em> })
              : form.entryPath
              ? tPath(`${form.entryPath}.label`)
              : t("fallbackHeadline")}
          </h1>

          {step === 0 && (
            <p className="portalStoryBody">{t("step0Subtitle")}</p>
          )}
        </div>

        {step > 0 && (
          <div style={{ height: 3, background: "var(--rule)", borderRadius: 99, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ width: `${(step / totalSteps) * 100}%`, height: "100%", background: form.entryPath ? pathStyle[form.entryPath].color : "var(--accent)", transition: "width 0.3s ease" }} />
          </div>
        )}

        {step === 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {PATH_KEYS.map((path) => {
              const style = pathStyle[path];
              const selected = form.entryPath === path;
              return (
                <button key={path} type="button" onClick={() => selectPath(path)} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", gap: 16, alignItems: "center", padding: "22px 24px", borderRadius: 16, border: `1px solid ${selected ? style.border : "var(--rule)"}`, background: selected ? style.bg : "var(--paper)", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s, background 0.2s, transform 0.2s" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: style.color, opacity: selected ? 1 : 0.4 }} />
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em" }}>{tPath(`${path}.label`)}</div>
                    <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{tPath(`${path}.description`)}</div>
                  </div>
                  <div style={{ fontSize: 18, color: style.color, opacity: 0.6 }}>→</div>
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step1.heading")}</h2></div>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">{t("step1.businessLabel")}</div><input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder={t("step1.businessPlaceholder")} /></div>
                <div><div className="fieldLabel">{t("step1.contactLabel")}</div><input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder={t("step1.contactPlaceholder")} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div className="fieldLabel">{t("step1.emailLabel")}</div>
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("step1.emailPlaceholder")} />
                  {form.email && <div style={{ fontSize: 11, marginTop: 4, color: emailValid ? "var(--success)" : "var(--accent)" }}>{emailValid ? t("step1.emailValid") : t("step1.emailInvalid")}</div>}
                </div>
                <div><div className="fieldLabel">{t("step1.phoneLabel")}</div><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("step1.phonePlaceholder")} /></div>
              </div>
              {form.entryPath !== "build" && (
                <>
                  <div><div className="fieldLabel">{t("step1.storeUrlLabel")}</div><input className="input" value={form.storeUrl} onChange={(e) => setForm({ ...form, storeUrl: e.target.value })} placeholder={t("step1.storeUrlPlaceholder")} /></div>
                  <div>
                    <div className="fieldLabel">{t("step1.platformLabel")}</div>
                    <select className="select" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                      <option value="">{t("step1.platformSelect")}</option>
                      {PLATFORMS.filter((p) => p !== "Don't have one yet").map((p) => <option key={p} value={p}>{tEnumPlatforms(p)}</option>)}
                    </select>
                  </div>
                </>
              )}
              {form.entryPath === "build" && (
                <div>
                  <div className="fieldLabel">{t("step1.preferredPlatformLabel")}</div>
                  <select className="select" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                    <option value="">{t("step1.preferredPlatformNotSure")}</option>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{tEnumPlatforms(p)}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader">
              <h2 className="portalPanelTitle">
                {form.entryPath === "build" ? t("step2.headingBuild") : form.entryPath === "run" ? t("step2.headingRun") : t("step2.headingFix")}
              </h2>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {serviceConfig.options.map((svc) => {
                const checked = form.serviceTypes.includes(svc);
                const accentColor = form.entryPath ? pathStyle[form.entryPath].color : "var(--accent)";
                const accentBg = form.entryPath ? pathStyle[form.entryPath].bg : "var(--accent-bg)";
                const accentBorder = form.entryPath ? pathStyle[form.entryPath].border : "var(--accent)";
                const label = serviceConfig.translator ? serviceConfig.translator(svc) : svc;
                return <label key={svc} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", borderRadius: 10, border: `1px solid ${checked ? accentBorder : "var(--rule)"}`, background: checked ? accentBg : "var(--paper-2)", cursor: "pointer", transition: "all 0.15s" }}><input type="checkbox" checked={checked} onChange={() => toggleList("serviceTypes", svc)} style={{ accentColor }} /><span style={{ fontSize: 14, color: "var(--ink)" }}>{label}</span></label>;
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="fieldLabel">{t("step2.channelsLabel")}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {CHANNELS.map((ch) => {
                  const active = form.salesChannels.includes(ch);
                  return <button key={ch} type="button" onClick={() => toggleList("salesChannels", ch)} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`, background: active ? "var(--accent-bg)" : "transparent", color: active ? "var(--accent)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}>{tEnumChannels(ch)}</button>;
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && form.entryPath === "build" && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step3Build.heading")}</h2></div>
            <div style={{ display: "grid", gap: 14 }}>
              <div><div className="fieldLabel">{t("step3Build.skuLabel")}</div><input className="input" value={form.skuCount} onChange={(e) => setForm({ ...form, skuCount: e.target.value })} placeholder={t("step3Build.skuPlaceholder")} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">{t("step3Build.budgetLabel")}</div><input className="input" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} placeholder={t("step3Build.budgetPlaceholder")} /></div>
                <div><div className="fieldLabel">{t("step3Build.timelineLabel")}</div><input className="input" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder={t("step3Build.timelinePlaceholder")} /></div>
              </div>
              <div><div className="fieldLabel">{t("step3Build.notesLabel")}</div><textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("step3Build.notesPlaceholder")} /></div>
            </div>
          </div>
        )}

        {step === 3 && form.entryPath !== "build" && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step3Other.heading")}</h2></div>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">{t("step3Other.monthlyOrdersLabel")}</div><input className="input" value={form.monthlyOrders} onChange={(e) => setForm({ ...form, monthlyOrders: e.target.value })} placeholder={t("step3Other.monthlyOrdersPlaceholder")} /></div>
                <div><div className="fieldLabel">{t("step3Other.peakLabel")}</div><input className="input" value={form.peakOrders} onChange={(e) => setForm({ ...form, peakOrders: e.target.value })} placeholder={t("step3Other.peakPlaceholder")} /></div>
              </div>
              <div><div className="fieldLabel">{t("step3Other.skuLabel")}</div><input className="input" value={form.skuCount} onChange={(e) => setForm({ ...form, skuCount: e.target.value })} placeholder={t("step3Other.skuPlaceholder")} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">{t("step3Other.budgetLabel")}</div><input className="input" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} placeholder={t("step3Other.budgetPlaceholder")} /></div>
                <div><div className="fieldLabel">{t("step3Other.timelineLabel")}</div><input className="input" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder={t("step3Other.timelinePlaceholder")} /></div>
              </div>
              <div><div className="fieldLabel">{t("step3Other.notesLabel")}</div><textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("step3Other.notesPlaceholder")} /></div>
            </div>
          </div>
        )}

        {reviewStep && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("review.heading")}</h2></div>
            {form.entryPath && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${pathStyle[form.entryPath].border}`, background: pathStyle[form.entryPath].bg, marginBottom: 16 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: pathStyle[form.entryPath].color }} /><span style={{ fontSize: 14, fontWeight: 600, color: pathStyle[form.entryPath].color }}>{tPath(`${form.entryPath}.label`)}</span></div>}

            <div style={{ border: "1px solid color-mix(in srgb, var(--accent) 28%, var(--paper))", background: "var(--accent-bg)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div className="smallNote">{t("review.recommendedLane")}</div>
              <div style={{ marginTop: 8, color: "var(--ink)", fontWeight: 800, fontSize: 22 }}>{recommendation.tierLabel}</div>
              <div className="pDark" style={{ marginTop: 6 }}>{recommendation.displayRange}</div>
              <div className="smallNote" style={{ marginTop: 8 }}>{recommendation.summary}</div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <ReviewRow label={tRow("business")} value={form.businessName || tRow("empty")} />
              <ReviewRow label={tRow("contact")} value={`${form.contactName} · ${form.email}`} />
              {form.storeUrl && <ReviewRow label={tRow("storeUrl")} value={form.storeUrl} />}
              {form.platform && <ReviewRow label={tRow("platform")} value={tEnumPlatforms(form.platform)} />}
              {form.salesChannels.length > 0 && <ReviewRow label={tRow("channels")} value={form.salesChannels.map((c) => tEnumChannels(c)).join(", ")} />}
              {form.serviceTypes.length > 0 && serviceConfig.translator && <ReviewRow label={tRow("services")} value={form.serviceTypes.map((s) => serviceConfig.translator!(s)).join(", ")} />}
              {form.skuCount && <ReviewRow label={tRow("skus")} value={form.skuCount} />}
              {form.monthlyOrders && <ReviewRow label={tRow("monthlyOrders")} value={form.monthlyOrders} />}
              {form.budgetRange && <ReviewRow label={tRow("budget")} value={form.budgetRange} />}
              {form.timeline && <ReviewRow label={tRow("timeline")} value={form.timeline} />}
              {form.notes && <ReviewRow label={tRow("notes")} value={form.notes} />}
            </div>

            {recommendation.complexityFlags.length > 0 && <div className="pills" style={{ marginTop: 14 }}>{recommendation.complexityFlags.map((flag) => <span key={flag} className="pill">{flag}</span>)}</div>}

            {error && <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 600, fontSize: 14 }}>{error}</div>}
          </div>
        )}

        {step > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, alignItems: "center" }}>
            <button className="btn btnGhost" onClick={back}>← {t("nav.back")}</button>
            {step < totalSteps ? (
              <button className="btn btnPrimary" onClick={next} disabled={step === 1 && (!form.businessName.trim() || !form.contactName.trim() || !emailValid)}>
                {t("nav.continue")} <span className="btnArrow">→</span>
              </button>
            ) : (
              <button className="btn btnPrimary" onClick={submit} disabled={submitting}>
                {submitting ? t("nav.submitting") : t("nav.submit")} <span className="btnArrow">→</span>
              </button>
            )}
          </div>
        )}

        {step > 0 && <div className="smallNote ecomIntakeDraftNote">{t("draftNote")}</div>}
      </div>
    </main>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ecomReviewRow">
      <span className="ecomReviewLabel">{label}</span>
      <span className="ecomReviewValue">{value}</span>
    </div>
  );
}
