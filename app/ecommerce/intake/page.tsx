"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getEcommercePricing } from "@/lib/pricing";

type EntryPath = "build" | "run" | "fix" | null;

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

export default function EcommerceIntakePage() {
  const router = useRouter();
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

  const serviceOptions = useMemo(() => {
    if (form.entryPath === "build") return BUILD_SERVICES;
    if (form.entryPath === "run") return RUN_SERVICES;
    if (form.entryPath === "fix") return FIX_SERVICES;
    return [];
  }, [form.entryPath]);

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

  const totalSteps = form.entryPath === "build" ? 5 : 4;

  async function submit() {
    if (!form.businessName.trim() || !form.contactName.trim() || !emailValid) {
      setError("Please complete business name, contact name, and a valid email.");
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
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Submission failed");
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/ecommerce/book?ecomIntakeId=${encodeURIComponent(data.ecomIntakeId)}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  const pathMeta = {
    build: {
      label: "Build my store",
      color: "#c9a84c",
      description: "You need a new online store designed, built, and launched.",
    },
    run: {
      label: "Run my existing store",
      color: "#5DCAA5",
      description: "You have a working store and need someone to handle operations.",
    },
    fix: {
      label: "Fix my broken store",
      color: "#8da4ff",
      description: "Your store exists but something isn't working right.",
    },
  };

  const reviewStep = (step === 4 && form.entryPath !== "build") || (step === 5 && form.entryPath === "build");

  return (
    <main className="container" style={{ paddingBottom: 64 }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div className="portalStory heroFadeUp" style={{ paddingBottom: 24 }}>
          <div className="portalStoryKicker">
            <span className="portalStoryKickerDot" />
            E-commerce intake
          </div>

          <h1 className="portalStoryHeadline" style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
            {step === 0
              ? <>What do you need <em>help with?</em></>
              : form.entryPath
              ? <>{pathMeta[form.entryPath].label}</>
              : <>E-commerce intake</>}
          </h1>

          {step === 0 && (
            <p className="portalStoryBody">
              Pick the option that best describes your situation. This determines
              what questions we ask and what kind of proposal you&apos;ll get.
            </p>
          )}
        </div>

        {step > 0 && (
          <div style={{ height: 3, background: "var(--stroke)", borderRadius: 99, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ width: `${(step / totalSteps) * 100}%`, height: "100%", background: form.entryPath ? pathMeta[form.entryPath].color : "var(--accent)", transition: "width 0.3s ease" }} />
          </div>
        )}

        {step === 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {(["build", "run", "fix"] as const).map((path) => {
              const meta = pathMeta[path];
              const selected = form.entryPath === path;
              return (
                <button key={path} type="button" onClick={() => selectPath(path)} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", gap: 16, alignItems: "center", padding: "22px 24px", borderRadius: 16, border: `1px solid ${selected ? meta.color : "var(--stroke)"}`, background: selected ? `${meta.color}08` : "var(--panel)", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s, background 0.2s, transform 0.2s" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: meta.color, opacity: selected ? 1 : 0.4 }} />
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.02em" }}>{meta.label}</div>
                    <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{meta.description}</div>
                  </div>
                  <div style={{ fontSize: 18, color: meta.color, opacity: 0.6 }}>→</div>
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">Tell us about your business</h2></div>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">Business name *</div><input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Acme Store" /></div>
                <div><div className="fieldLabel">Contact name *</div><input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Jane Smith" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">Email *</div><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@business.com" />{form.email && <div style={{ fontSize: 11, marginTop: 4, color: emailValid ? "#5DCAA5" : "#F09595" }}>{emailValid ? "Valid email" : "Enter a valid email"}</div>}</div>
                <div><div className="fieldLabel">Phone</div><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 555-5555" /></div>
              </div>
              {form.entryPath !== "build" && <><div><div className="fieldLabel">Store URL</div><input className="input" value={form.storeUrl} onChange={(e) => setForm({ ...form, storeUrl: e.target.value })} placeholder="https://yourstore.com or Amazon seller page" /></div><div><div className="fieldLabel">What platform is your store on?</div><select className="select" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="">Select platform</option>{PLATFORMS.filter((p) => p !== "Don't have one yet").map((p) => <option key={p}>{p}</option>)}</select></div></>}
              {form.entryPath === "build" && <div><div className="fieldLabel">Preferred platform</div><select className="select" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="">Not sure yet</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></div>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">{form.entryPath === "build" ? "What should the store include?" : form.entryPath === "run" ? "What do you need us to handle?" : "What needs fixing?"}</h2></div>
            <div style={{ display: "grid", gap: 8 }}>
              {serviceOptions.map((svc) => {
                const checked = form.serviceTypes.includes(svc);
                const accentColor = form.entryPath ? pathMeta[form.entryPath].color : "var(--accent)";
                return <label key={svc} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", borderRadius: 10, border: `1px solid ${checked ? accentColor + "40" : "var(--stroke)"}`, background: checked ? accentColor + "08" : "var(--panel2)", cursor: "pointer", transition: "all 0.15s" }}><input type="checkbox" checked={checked} onChange={() => toggleList("serviceTypes", svc)} style={{ accentColor }} /><span style={{ fontSize: 14, color: "var(--fg)" }}>{svc}</span></label>;
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="fieldLabel">Where do you sell? (select all)</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {CHANNELS.map((ch) => {
                  const active = form.salesChannels.includes(ch);
                  return <button key={ch} type="button" onClick={() => toggleList("salesChannels", ch)} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: `1px solid ${active ? "var(--accent)" : "var(--stroke)"}`, background: active ? "rgba(201,168,76,0.08)" : "transparent", color: active ? "var(--accent)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}>{ch}</button>;
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && form.entryPath === "build" && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">Budget & timeline</h2></div>
            <div style={{ display: "grid", gap: 14 }}>
              <div><div className="fieldLabel">Approximate number of products</div><input className="input" value={form.skuCount} onChange={(e) => setForm({ ...form, skuCount: e.target.value })} placeholder="e.g., 25, 100, 500+" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">Budget range</div><input className="input" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} placeholder="e.g., $2,000–$5,000" /></div>
                <div><div className="fieldLabel">Timeline</div><input className="input" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g., 3–4 weeks" /></div>
              </div>
              <div><div className="fieldLabel">Anything else we should know?</div><textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Design preferences, must-have features, competitor examples..." /></div>
            </div>
          </div>
        )}

        {step === 3 && form.entryPath !== "build" && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">Your store&apos;s current volume</h2></div>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">Orders per month</div><input className="input" value={form.monthlyOrders} onChange={(e) => setForm({ ...form, monthlyOrders: e.target.value })} placeholder="e.g., 50, 200, 1000+" /></div>
                <div><div className="fieldLabel">Peak season volume</div><input className="input" value={form.peakOrders} onChange={(e) => setForm({ ...form, peakOrders: e.target.value })} placeholder="e.g., 2x normal, holiday surge" /></div>
              </div>
              <div><div className="fieldLabel">Approximate SKU count</div><input className="input" value={form.skuCount} onChange={(e) => setForm({ ...form, skuCount: e.target.value })} placeholder="e.g., 25, 100, 500+" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="fieldLabel">Budget range (monthly)</div><input className="input" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} placeholder="e.g., $500–$2,000/mo" /></div>
                <div><div className="fieldLabel">When do you need this?</div><input className="input" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g., ASAP, next month" /></div>
              </div>
              <div><div className="fieldLabel">Anything else we should know?</div><textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Current pain points, what's been tried before, specific problems..." /></div>
            </div>
          </div>
        )}

        {reviewStep && (
          <div className="portalPanel fadeUp">
            <div className="portalPanelHeader"><h2 className="portalPanelTitle">Review your intake</h2></div>
            {form.entryPath && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${pathMeta[form.entryPath].color}30`, background: `${pathMeta[form.entryPath].color}08`, marginBottom: 16 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: pathMeta[form.entryPath].color }} /><span style={{ fontSize: 14, fontWeight: 600, color: pathMeta[form.entryPath].color }}>{pathMeta[form.entryPath].label}</span></div>}

            <div style={{ border: "1px solid var(--accentStroke)", background: "var(--accentSoft)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div className="smallNote">Recommended pricing lane</div>
              <div style={{ marginTop: 8, color: "var(--fg)", fontWeight: 800, fontSize: 22 }}>{recommendation.tierLabel}</div>
              <div className="pDark" style={{ marginTop: 6 }}>{recommendation.displayRange}</div>
              <div className="smallNote" style={{ marginTop: 8 }}>{recommendation.summary}</div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <ReviewRow label="Business" value={form.businessName || "—"} />
              <ReviewRow label="Contact" value={`${form.contactName} · ${form.email}`} />
              {form.storeUrl && <ReviewRow label="Store URL" value={form.storeUrl} />}
              {form.platform && <ReviewRow label="Platform" value={form.platform} />}
              {form.salesChannels.length > 0 && <ReviewRow label="Channels" value={form.salesChannels.join(", ")} />}
              {form.serviceTypes.length > 0 && <ReviewRow label="Services" value={form.serviceTypes.join(", ")} />}
              {form.skuCount && <ReviewRow label="SKUs" value={form.skuCount} />}
              {form.monthlyOrders && <ReviewRow label="Monthly orders" value={form.monthlyOrders} />}
              {form.budgetRange && <ReviewRow label="Budget" value={form.budgetRange} />}
              {form.timeline && <ReviewRow label="Timeline" value={form.timeline} />}
              {form.notes && <ReviewRow label="Notes" value={form.notes} />}
            </div>

            {recommendation.complexityFlags.length > 0 && <div className="pills" style={{ marginTop: 14 }}>{recommendation.complexityFlags.map((flag) => <span key={flag} className="pill">{flag}</span>)}</div>}

            {error && <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: "1px solid rgba(240,149,149,0.3)", background: "rgba(240,149,149,0.06)", color: "#F09595", fontWeight: 600, fontSize: 14 }}>{error}</div>}
          </div>
        )}

        {step > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, alignItems: "center" }}>
            <button className="btn btnGhost" onClick={back}>← Back</button>
            {step < totalSteps ? (
              <button className="btn btnPrimary" onClick={next} disabled={step === 1 && (!form.businessName.trim() || !form.contactName.trim() || !emailValid)}>
                Continue <span className="btnArrow">→</span>
              </button>
            ) : (
              <button className="btn btnPrimary" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit intake"} <span className="btnArrow">→</span>
              </button>
            )}
          </div>
        )}

        {step > 0 && <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted2)", textAlign: "center" }}>Draft auto-saves in your browser</div>}
      </div>
    </main>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 16 }}><span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>{label}</span><span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", textAlign: "right", maxWidth: "60%" }}>{value}</span></div>;
}
