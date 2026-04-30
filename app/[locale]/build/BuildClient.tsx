"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/components/site/ScrollReveal";
import { getWebsitePricing } from "@/lib/pricing";

// IMPORTANT: The string literals on these enum types must NOT be translated.
// They are sent verbatim to /api/submit-estimate and used by the pricing
// engine + admin pipeline. Locale-specific labels are looked up via
// t(`enums.{group}.{value}`) at render time.
type Mode = "chooser" | "guided" | "known";
type Intent = "Marketing" | "Leads" | "Booking" | "Selling" | "Content" | "Membership" | "Other";
type WebsiteType = "Business" | "Ecommerce" | "Portfolio" | "Landing";
type Pages = "1" | "1-3" | "4-5" | "6-8" | "9+";
type Design = "Modern" | "Classic" | "Creative";
type Timeline = "2-3 weeks" | "4+ weeks" | "Under 14 days";
type YesNo = "Yes" | "No";
type ContentReady = "Ready" | "Some" | "Not ready";
type AssetsSource = "Client provides" | "Stock" | "Need help";
type Budget = "under-2k" | "2k-5k" | "5k-10k" | "10k-plus" | "not-sure";

type FormState = {
  mode: Mode; websiteType: WebsiteType; intent: Intent; intentOther: string;
  pages: Pages; booking: boolean; payments: boolean; blog: boolean; membership: boolean;
  wantsAutomation: YesNo; automationTypes: string[]; integrations: string[];
  integrationOther: string; hasLogo: YesNo; hasBrandGuide: YesNo;
  contentReady: ContentReady; assetsSource: AssetsSource; referenceWebsite: string;
  currentWebsite: string; domainHosting: YesNo; decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+"; budget: Budget; design: Design;
  timeline: Timeline; notes: string; leadEmail: string; leadPhone: string;
};

const INTENTS: Intent[] = ["Marketing", "Leads", "Booking", "Selling", "Content", "Membership", "Other"];
const WEBSITE_TYPES: WebsiteType[] = ["Business", "Ecommerce", "Portfolio", "Landing"];
const PAGES: Pages[] = ["1", "1-3", "4-5", "6-8", "9+"];
const DESIGNS: Design[] = ["Modern", "Classic", "Creative"];
const TIMELINES: Timeline[] = ["2-3 weeks", "4+ weeks", "Under 14 days"];
const AUTOMATION_OPTIONS = ["Email confirmations", "Email follow-ups", "SMS reminders", "CRM integration", "Lead routing"];
const INTEGRATION_OPTIONS = ["Google Maps / location", "Calendly / scheduling", "Stripe payments", "PayPal payments", "Mailchimp / email list", "Analytics (GA4 / Pixel)", "Live chat"];
const BUDGETS: Budget[] = ["under-2k", "2k-5k", "5k-10k", "10k-plus", "not-sure"];
const LS_KEY = "crecystudio:intake";
const TOTAL_STEPS = 8;

function normalizePagesBucket(pages: Pages) {
  if (pages === "4-5") return "4-6" as const;
  return pages as "1" | "1-3" | "4-6" | "6-8" | "9+";
}
function normalizeYesNo(value: YesNo) { return value === "Yes" ? "yes" : "no"; }
function normalizeContentReady(value: ContentReady) {
  if (value === "Ready") return "ready" as const;
  if (value === "Not ready") return "not_ready" as const;
  return "some" as const;
}

export default function BuildClient() {
  const t = useTranslations("build");
  const tStep = useTranslations("build.stepTitles");
  const tEnumIntents = useTranslations("build.enums.intents");
  const tEnumTypes = useTranslations("build.enums.websiteTypes");
  const tEnumPages = useTranslations("build.enums.pages");
  const tEnumDesigns = useTranslations("build.enums.designs");
  const tEnumTimelines = useTranslations("build.enums.timelines");
  const tEnumContent = useTranslations("build.enums.contentReady");
  const tEnumYesNo = useTranslations("build.enums.yesNo");
  const tEnumBudgets = useTranslations("build.enums.budgets");
  const tEnumAutomation = useTranslations("build.enums.automation");
  const tEnumIntegrations = useTranslations("build.enums.integrations");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    mode: "chooser", websiteType: "Business", intent: "Marketing", intentOther: "",
    pages: "1-3", booking: false, payments: false, blog: false, membership: false,
    wantsAutomation: "No", automationTypes: [], integrations: [], integrationOther: "",
    hasLogo: "Yes", hasBrandGuide: "No", contentReady: "Some", assetsSource: "Client provides",
    referenceWebsite: "", currentWebsite: "", domainHosting: "Yes", decisionMaker: "Yes",
    stakeholdersCount: "1", budget: "not-sure", design: "Modern", timeline: "2-3 weeks",
    notes: "", leadEmail: "", leadPhone: "",
  });

  useEffect(() => {
    try { const raw = window.localStorage.getItem(LS_KEY); if (raw) { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") setForm((f) => ({ ...f, ...parsed })); } } catch {}
  }, []);

  useEffect(() => { try { window.localStorage.setItem(LS_KEY, JSON.stringify(form)); } catch {} }, [form]);

  useEffect(() => {
    const mode = searchParams.get("mode"); const intent = searchParams.get("intent");
    const websiteType = searchParams.get("websiteType"); const pages = searchParams.get("pages");
    const timeline = searchParams.get("timeline"); const contentReady = searchParams.get("contentReady");
    if (mode || intent || websiteType || pages || timeline) {
      setForm((f) => ({
        ...f,
        mode: mode === "guided" || mode === "known" ? (mode as Mode) : f.mode,
        intent: INTENTS.includes(intent as Intent) ? (intent as Intent) : f.intent,
        websiteType: WEBSITE_TYPES.includes(websiteType as WebsiteType) ? (websiteType as WebsiteType) : f.websiteType,
        pages: PAGES.includes(pages as Pages) ? (pages as Pages) : f.pages,
        timeline: TIMELINES.includes(timeline as Timeline) ? (timeline as Timeline) : f.timeline,
        contentReady: (["Ready", "Some", "Not ready"].includes(contentReady ?? "") ? contentReady : f.contentReady) as ContentReady,
      }));
      if (mode === "guided" || mode === "known") setStep(1);
    }
  }, [searchParams]);

  const suggested = useMemo(() => {
    const s: Partial<FormState> = {};
    if (form.intent === "Booking") { s.websiteType = "Business"; s.booking = true; }
    if (form.intent === "Leads" || form.intent === "Marketing") { s.websiteType = "Business"; }
    if (form.intent === "Selling") { s.websiteType = "Ecommerce"; s.payments = true; }
    if (form.intent === "Content") { s.websiteType = "Portfolio"; s.blog = true; }
    if (form.intent === "Membership") { s.websiteType = "Business"; s.membership = true; }
    return s;
  }, [form.intent]);

  function goMode(mode: Mode) { setForm((f) => ({ ...f, mode })); setStep(1); }
  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function applySuggested() { setForm((f) => ({ ...f, ...suggested })); }

  function toggleInList(key: "automationTypes" | "integrations", value: string) {
    setForm((f) => {
      const current = new Set(f[key]);
      if (current.has(value)) current.delete(value); else current.add(value);
      return { ...f, [key]: Array.from(current) } as FormState;
    });
  }

  async function submit() {
    const leadEmail = form.leadEmail.trim();
    if (!leadEmail || !leadEmail.includes("@")) { alert(t("validation.validEmail")); return; }
    const pricingInput: Parameters<typeof getWebsitePricing>[0] = {
      websiteType: form.websiteType.toLowerCase() as "business" | "ecommerce" | "portfolio" | "landing",
      pages: normalizePagesBucket(form.pages),
      booking: form.booking, payments: form.payments, blog: form.blog, membership: form.membership,
      wantsAutomation: normalizeYesNo(form.wantsAutomation),
      automationTypes: form.automationTypes,
      integrations: form.integrations,
      integrationOther: form.integrationOther,
      contentReady: normalizeContentReady(form.contentReady),
      domainHosting: normalizeYesNo(form.domainHosting),
      timeline: form.timeline,
      intent: form.intent === "Other" && form.intentOther.trim() ? form.intentOther.trim() : form.intent,
      budget: form.budget,
      hasLogo: normalizeYesNo(form.hasLogo),
      hasBrandGuide: normalizeYesNo(form.hasBrandGuide),
    };
    const intakeNormalized = {
      ...pricingInput,
      leadEmail,
      leadPhone: form.leadPhone.trim(),
      notes: form.notes,
    };
    const pricing = getWebsitePricing(pricingInput);

    try {
      const response = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "build",
          lead: { email: leadEmail, phone: form.leadPhone.trim() || undefined },
          intakeRaw: form,
          intakeNormalized,
          pricing,
          estimate: {
            total: pricing.band.target, low: pricing.band.min, high: pricing.band.max,
            tierRecommended: pricing.tierLabel, tierKey: pricing.tierKey,
            isCustomScope: pricing.isCustomScope,
          },
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.ok || !json?.nextUrl) {
        throw new Error(json?.error || t("validation.estimateError"));
      }

      try {
        window.localStorage.removeItem(LS_KEY);
        if (json?.quoteId) window.localStorage.setItem("crecystudio:lastQuoteId", String(json.quoteId));
        if (json?.quoteToken) window.localStorage.setItem("crecystudio:lastQuoteToken", String(json.quoteToken));
      } catch {}

      router.push(String(json.nextUrl));
    } catch (error) {
      alert(error instanceof Error ? error.message : t("validation.estimateError"));
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <ScrollReveal />
      {/* Header */}
      <div className="portalStory heroFadeUp" style={{ paddingBottom: 20 }}>
        <div className="portalStoryKicker">
          <span className="portalStoryKickerDot" />
          {t("kicker")}
        </div>
        <h1 className="portalStoryHeadline" style={{ fontSize: "clamp(26px, 5vw, 38px)" }}>
          {step === 0
            ? t.rich("step0Title", { em: (chunks) => <em>{chunks}</em> })
            : tStep(String(step))}
        </h1>
        {step === 0 && (
          <p className="portalStoryBody">{t("step0Subtitle")}</p>
        )}
        {step > 0 && step < TOTAL_STEPS && (
          <div className="portalStoryMeta">
            <span className="portalStoryMetaItem">
              {t("stepCounter", { current: step, total: TOTAL_STEPS - 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      {step > 0 && step < TOTAL_STEPS && (
        <div style={{ height: 3, background: "var(--stroke)", borderRadius: 99, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }} />
        </div>
      )}

      {/* Step bodies — added below */}

      {/* STEP 0 — Chooser */}
      {step === 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {([
            { mode: "guided" as Mode, key: "guided" as const, primary: true },
            { mode: "known" as Mode, key: "known" as const, primary: false },
          ]).map((opt) => (
            <button key={opt.mode} type="button" onClick={() => goMode(opt.mode)}
              style={{
                padding: "24px 22px", borderRadius: 16, textAlign: "left", cursor: "pointer",
                border: "1px solid var(--stroke)", background: "var(--panel)",
                transition: "border-color 0.2s, transform 0.2s",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.02em" }}>
                {t(`modes.${opt.key}.title`)}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{t(`modes.${opt.key}.desc`)}</div>
              <div style={{ marginTop: "auto", paddingTop: 8 }}>
                <span className={`btn ${opt.primary ? "btnPrimary" : "btnGhost"}`} style={{ pointerEvents: "none" }}>
                  {t(`modes.${opt.key}.cta`)} <span className="btnArrow">→</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1 — Goal / Type */}
      {step === 1 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader">
            <h2 className="portalPanelTitle">{form.mode === "guided" ? t("step1.guidedTitle") : t("step1.knownTitle")}</h2>
          </div>
          {form.mode === "guided" ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="fieldLabel">{t("step1.primaryGoal")}</div>
                <select className="select" value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value as Intent })}>
                  {INTENTS.map((i) => <option key={i} value={i}>{tEnumIntents(i)}</option>)}
                </select>
              </div>
              {form.intent === "Other" && (
                <div><div className="fieldLabel">{t("step1.describeGoal")}</div>
                  <input className="input" value={form.intentOther} onChange={(e) => setForm({ ...form, intentOther: e.target.value })} placeholder={t("step1.goalPlaceholder")} />
                </div>
              )}
            </div>
          ) : (
            <div><div className="fieldLabel">{t("step1.websiteTypeLabel")}</div>
              <select className="select" value={form.websiteType} onChange={(e) => setForm({ ...form, websiteType: e.target.value as WebsiteType })}>
                {WEBSITE_TYPES.map((tp) => <option key={tp} value={tp}>{tEnumTypes(tp)}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Scope */}
      {step === 2 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step2.title")}</h2></div>
          {form.mode === "guided" && (
            <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{t("step2.suggestedSetup")}</div>
              <div style={{ fontSize: 14, color: "var(--fg)" }}>
                {t("step2.typeLabel")} <strong>{tEnumTypes(suggested.websiteType ?? form.websiteType)}</strong>
                {suggested.booking && <> · {t("step2.bookingEnabled")}</>}
                {suggested.payments && <> · {t("step2.paymentsEnabled")}</>}
              </div>
              <button type="button" className="btn btnGhost" style={{ marginTop: 10, fontSize: 12, padding: "6px 12px" }} onClick={applySuggested}>{t("step2.applySuggestion")}</button>
            </div>
          )}
          <div><div className="fieldLabel">{t("step2.totalPages")}</div>
            <select className="select" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value as Pages })}>
              {PAGES.map((p) => <option key={p} value={p}>{p === "1" ? t("step2.singlePageLabel") : tEnumPages(p)}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* STEP 3 — Features */}
      {step === 3 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step3.title")}</h2></div>
          <div style={{ display: "grid", gap: 8 }}>
            {([
              { key: "booking" as const },
              { key: "payments" as const },
              { key: "blog" as const },
              { key: "membership" as const },
            ]).map((f) => (
              <Check key={f.key} label={t(`step3.features.${f.key}`)} checked={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="fieldLabel">{t("step3.advancedAutomations")}</div>
            <select className="select" value={form.wantsAutomation} onChange={(e) => setForm({ ...form, wantsAutomation: e.target.value as YesNo })}>
              <option value="No">{tEnumYesNo("No")}</option><option value="Yes">{tEnumYesNo("Yes")}</option>
            </select>
          </div>
          {form.wantsAutomation === "Yes" && (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--stroke)", background: "var(--panel2)" }}>
              <div className="fieldLabel">{t("step3.selectTypes")}</div>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{AUTOMATION_OPTIONS.map((a) => <Check key={a} label={tEnumAutomation(a)} checked={form.automationTypes.includes(a)} onChange={() => toggleInList("automationTypes", a)} />)}</div>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <div className="fieldLabel">{t("step3.thirdPartyIntegrations")}</div>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{INTEGRATION_OPTIONS.map((i) => <Check key={i} label={tEnumIntegrations(i)} checked={form.integrations.includes(i)} onChange={() => toggleInList("integrations", i)} />)}</div>
          </div>
        </div>
      )}

      {/* STEP 4 — Assets */}
      {step === 4 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step4.title")}</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><div className="fieldLabel">{t("step4.currentUrl")}</div><input className="input" placeholder={t("step4.currentUrlPlaceholder")} value={form.currentWebsite} onChange={(e) => setForm({ ...form, currentWebsite: e.target.value })} /></div>
            <div><div className="fieldLabel">{t("step4.referenceSite")}</div><input className="input" placeholder={t("step4.referenceSitePlaceholder")} value={form.referenceWebsite} onChange={(e) => setForm({ ...form, referenceWebsite: e.target.value })} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="fieldLabel">{t("step4.hasLogo")}</div><select className="select" value={form.hasLogo} onChange={(e) => setForm({ ...form, hasLogo: e.target.value as YesNo })}><option value="Yes">{tEnumYesNo("Yes")}</option><option value="No">{tEnumYesNo("No")}</option></select></div>
              <div><div className="fieldLabel">{t("step4.hasBrandGuide")}</div><select className="select" value={form.hasBrandGuide} onChange={(e) => setForm({ ...form, hasBrandGuide: e.target.value as YesNo })}><option value="No">{tEnumYesNo("No")}</option><option value="Yes">{tEnumYesNo("Yes")}</option></select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="fieldLabel">{t("step4.contentWritten")}</div><select className="select" value={form.contentReady} onChange={(e) => setForm({ ...form, contentReady: e.target.value as ContentReady })}><option value="Ready">{tEnumContent("Ready")}</option><option value="Some">{tEnumContent("Some")}</option><option value="Not ready">{tEnumContent("Not ready")}</option></select></div>
              <div><div className="fieldLabel">{t("step4.domainHosting")}</div><select className="select" value={form.domainHosting} onChange={(e) => setForm({ ...form, domainHosting: e.target.value as YesNo })}><option value="Yes">{t("step4.domainHaveIt")}</option><option value="No">{t("step4.domainNeedHelp")}</option></select></div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — Budget */}
      {step === 5 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step5.title")}</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="fieldLabel">{t("step5.budgetRange")}</div>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {BUDGETS.map((val) => {
                  const active = form.budget === val;
                  return (
                    <label key={val} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                      border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`,
                      background: active ? "rgba(201,168,76,0.06)" : "transparent",
                    }}>
                      <input type="radio" name="budget" value={val} checked={active} onChange={() => setForm({ ...form, budget: val })} style={{ accentColor: "var(--accent)" }} />
                      <span style={{ color: "var(--fg)", fontWeight: active ? 600 : 400, fontSize: 14 }}>{tEnumBudgets(val)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="fieldLabel">{t("step5.decisionMaker")}</div>
              <select className="select" value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value as YesNo })}>
                <option value="Yes">{t("step5.decisionYes")}</option><option value="No">{t("step5.decisionNo")}</option>
              </select>
            </div>
            {form.decisionMaker === "No" && (
              <div><div className="fieldLabel">{t("step5.stakeholdersCount")}</div>
                <select className="select" value={form.stakeholdersCount} onChange={(e) => setForm({ ...form, stakeholdersCount: e.target.value as "1" | "2-3" | "4+" })}>
                  <option value="2-3">{t("step5.stakeholders23")}</option><option value="4+">{t("step5.stakeholders4Plus")}</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 6 — Timeline */}
      {step === 6 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step6.title")}</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="fieldLabel">{t("step6.designDirection")}</div><select className="select" value={form.design} onChange={(e) => setForm({ ...form, design: e.target.value as Design })}>{DESIGNS.map((d) => <option key={d} value={d}>{tEnumDesigns(d)}</option>)}</select></div>
              <div><div className="fieldLabel">{t("step6.targetTimeline")}</div><select className="select" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value as Timeline })}>{TIMELINES.map((tl) => <option key={tl} value={tl}>{tEnumTimelines(tl)}</option>)}</select></div>
            </div>
            <div><div className="fieldLabel">{t("step6.additionalNotes")}</div>
              <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("step6.notesPlaceholder")} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 7 — Review */}
      {step === 7 && (
        <div className="portalPanel fadeUp">
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step7.title")}</h2></div>
          <div style={{ display: "grid", gap: 0 }}>
            <ReviewRow label={t("step7.rows.websiteType")} value={tEnumTypes(form.websiteType)} />
            <ReviewRow label={t("step7.rows.totalPages")} value={tEnumPages(form.pages)} />
            <ReviewRow label={t("step7.rows.contentReadiness")} value={tEnumContent(form.contentReady)} />
            <ReviewRow label={t("step7.rows.budgetRange")} value={tEnumBudgets(form.budget)} />
            <ReviewRow label={t("step7.rows.timeline")} value={tEnumTimelines(form.timeline)} />
            <ReviewRow label={t("step7.rows.design")} value={tEnumDesigns(form.design)} />
            <ReviewRow
              label={t("step7.rows.features")}
              value={[
                form.booking && t("step3.features.booking"),
                form.payments && t("step3.features.payments"),
                form.blog && t("step3.features.blog"),
                form.membership && t("step3.features.membership"),
              ].filter(Boolean).join(", ") || t("step7.rows.featuresNone")}
            />
            {form.integrations.length > 0 && <ReviewRow label={t("step7.rows.integrations")} value={form.integrations.map((i) => tEnumIntegrations(i)).join(", ")} />}
            {form.currentWebsite && <ReviewRow label={t("step7.rows.currentSite")} value={form.currentWebsite} />}
            {form.notes && <ReviewRow label={t("step7.rows.notes")} value={form.notes} />}
          </div>
        </div>
      )}

      {/* STEP 8 — Contact */}
      {step === 8 && (
        <div className="portalPanel fadeUp" style={{ borderColor: "rgba(201,168,76,0.2)", background: "radial-gradient(600px 200px at 50% 0%, rgba(201,168,76,0.04), transparent 50%), var(--panel)" }}>
          <div className="portalPanelHeader"><h2 className="portalPanelTitle">{t("step8.title")}</h2></div>
          <div style={{ display: "grid", gap: 14 }}>
            <div><div className="fieldLabel">{t("step8.emailLabel")}</div><input className="input" type="email" value={form.leadEmail} onChange={(e) => setForm({ ...form, leadEmail: e.target.value })} placeholder={t("step8.emailPlaceholder")} /></div>
            <div><div className="fieldLabel">{t("step8.phoneLabel")}</div><input className="input" type="tel" value={form.leadPhone} onChange={(e) => setForm({ ...form, leadPhone: e.target.value })} placeholder={t("step8.phonePlaceholder")} /></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button className="btn btnGhost" onClick={back}>← {t("nav.back")}</button>
          {step < TOTAL_STEPS ? (
            <button className="btn btnPrimary" onClick={next}>{t("nav.continue")} <span className="btnArrow">→</span></button>
          ) : (
            <button className="btn btnPrimary" onClick={submit}>{t("nav.generateEstimate")} <span className="btnArrow">→</span></button>
          )}
        </div>
      )}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
      border: `1px solid ${checked ? "rgba(201,168,76,0.3)" : "var(--stroke)"}`,
      background: checked ? "rgba(201,168,76,0.06)" : "transparent",
    }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
      <span style={{ fontSize: 14, color: "var(--fg)" }}>{label}</span>
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--rule)", gap: 16 }}>
      <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}
