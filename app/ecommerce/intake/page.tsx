"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EcomFormState = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  storeUrl: string;
  salesChannels: string[];
  serviceTypes: string[];
  skuCount: string;
  unitsInStock: string;
  productSize: string;
  fragile: string;
  storageType: string;
  monthlyOrders: string;
  peakOrders: string;
  avgItemsPerOrder: string;
  monthlyReturns: string;
  readinessStage: string;
  budgetRange: string;
  timeline: string;
  decisionMaker: string;
  notes: string;
};

const STORAGE_KEY = "ecom-intake-draft-v2";
const CHANNELS = ["Amazon", "eBay", "Shopify", "Etsy", "Walmart", "Other"];
const SERVICES = ["Website only", "Hosting / maintenance", "Product listing help", "Inventory storage", "Fulfillment", "Returns handling", "Marketplace management", "Virtual assistant support"];
const BUDGET_OPTIONS = ["Under $1,000", "$1,000 - $3,000", "$3,000 - $6,000", "$6,000 - $10,000", "$10,000+", "Need guidance"];
const TIMELINE_OPTIONS = ["ASAP", "2-4 weeks", "1-2 months", "2-3 months", "Exploring options"];

const EMPTY_FORM: EcomFormState = {
  businessName: "", contactName: "", email: "", phone: "", storeUrl: "", salesChannels: [], serviceTypes: [],
  skuCount: "", unitsInStock: "", productSize: "Small parcel", fragile: "No", storageType: "Shelf", monthlyOrders: "", peakOrders: "", avgItemsPerOrder: "", monthlyReturns: "",
  readinessStage: "already selling", budgetRange: "Need guidance", timeline: "Exploring options", decisionMaker: "", notes: "",
};

export default function EcommerceIntakePage() {
  const router = useRouter();
  const [form, setForm] = useState<EcomFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm({ ...EMPTY_FORM, ...JSON.parse(raw) });
    } catch {
      // ignore corrupted draft
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const emailValid = useMemo(() => /^\S+@\S+\.\S+$/.test(form.email), [form.email]);

  const toggle = (field: "salesChannels" | "serviceTypes", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }));
  };

  const submit = async () => {
    if (!form.businessName || !form.contactName || !emailValid) {
      setError("Please complete business name, contact name, and a valid email.");
      return;
    }

    if (form.serviceTypes.length < 1) {
      setError("Select at least one service type so we can scope the right plan.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/ecommerce/submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Submission failed");
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/ecommerce/book?ecomIntakeId=${encodeURIComponent(data.ecomIntakeId)}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 840, margin: "0 auto" }}>
        <div className="kicker">E-Commerce Intake</div>
        <h1 className="h1" style={{ marginTop: 10 }}>Tell us about your seller operation</h1>
        <p className="p" style={{ marginTop: 10 }}>Complete this guided intake for a custom recommendation. Your draft auto-saves in your browser.</p>
      </section>

      <section className="section" style={{ maxWidth: 840, margin: "0 auto", paddingTop: 0 }}>
        <FormCard title="Section A — Business basics">
          <Field label="Business name *"><input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></Field>
          <div className="grid2">
            <Field label="Contact name *"><input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></Field>
            <Field label="Email *"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><div style={{ fontSize: 12, color: form.email ? (emailValid ? "#22c55e" : "#ef4444") : "var(--muted)", marginTop: 4 }}>{form.email ? (emailValid ? "Email looks valid" : "Enter a valid email") : "We validate email before submission."}</div></Field>
          </div>
          <div className="grid2">
            <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Website/store URL"><input className="input" value={form.storeUrl} onChange={(e) => setForm({ ...form, storeUrl: e.target.value })} /></Field>
          </div>
        </FormCard>

        <FormCard title="Section B — Where you sell">
          <p className="pDark" style={{ margin: 0, fontSize: 13 }}>Select all current channels. If you&apos;re launching soon, choose planned channels.</p>
          <CheckboxGrid values={CHANNELS} checked={form.salesChannels} onChange={(v) => toggle("salesChannels", v)} />
        </FormCard>

        <FormCard title="Section C — What you need">
          <p className="pDark" style={{ margin: 0, fontSize: 13 }}>Pick at least one service area.</p>
          <CheckboxGrid values={SERVICES} checked={form.serviceTypes} onChange={(v) => toggle("serviceTypes", v)} />
        </FormCard>

        <FormCard title="Section D — Inventory profile">
          <div className="grid2">
            <Field label="Approximate SKU count"><input className="input" value={form.skuCount} onChange={(e) => setForm({ ...form, skuCount: e.target.value })} /></Field>
            <Field label="Units currently in stock"><input className="input" value={form.unitsInStock} onChange={(e) => setForm({ ...form, unitsInStock: e.target.value })} /></Field>
          </div>
          <div className="grid2">
            <Field label="Product size"><select className="select" value={form.productSize} onChange={(e) => setForm({ ...form, productSize: e.target.value })}><option>Small parcel</option><option>Medium box</option><option>Large / Oversize</option><option>Mixed sizes</option></select></Field>
            <Field label="Fragile?"><select className="select" value={form.fragile} onChange={(e) => setForm({ ...form, fragile: e.target.value })}><option>Yes</option><option>No</option></select></Field>
          </div>
          <Field label="Storage type"><select className="select" value={form.storageType} onChange={(e) => setForm({ ...form, storageType: e.target.value })}><option>Shelf</option><option>Bin</option><option>Pallet</option></select></Field>
        </FormCard>

        <FormCard title="Section E — Order volume">
          <div className="grid2">
            <Field label="Orders per month"><input className="input" value={form.monthlyOrders} onChange={(e) => setForm({ ...form, monthlyOrders: e.target.value })} /></Field>
            <Field label="Peak season volume"><input className="input" value={form.peakOrders} onChange={(e) => setForm({ ...form, peakOrders: e.target.value })} /></Field>
          </div>
          <div className="grid2">
            <Field label="Average items per order"><input className="input" value={form.avgItemsPerOrder} onChange={(e) => setForm({ ...form, avgItemsPerOrder: e.target.value })} /></Field>
            <Field label="Returns per month"><input className="input" value={form.monthlyReturns} onChange={(e) => setForm({ ...form, monthlyReturns: e.target.value })} /></Field>
          </div>
        </FormCard>

        <FormCard title="Section F — Readiness">
          <Field label="Current stage"><select className="select" value={form.readinessStage} onChange={(e) => setForm({ ...form, readinessStage: e.target.value })}><option>already selling</option><option>launching soon</option><option>need website first</option><option>need storage first</option><option>need full-service help</option></select></Field>
        </FormCard>

        <FormCard title="Section G — Budget and timeline">
          <div className="grid2">
            <Field label="Budget range"><select className="select" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}>{BUDGET_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Timeline"><select className="select" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}>{TIMELINE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
          </div>
          <Field label="Decision maker"><input className="input" value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 120, resize: "vertical" }} /></Field>
        </FormCard>

        {error ? <p style={{ color: "#ef4444", marginTop: 10 }}>{error}</p> : null}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <p className="pDark" style={{ margin: 0, fontSize: 14 }}>Flexible combinations are supported. We&apos;ll tailor your plan after submission.</p>
          <button className="btn btnPrimary" onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit E-Commerce Intake"}</button>
        </div>
      </section>
    </main>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card" style={{ marginBottom: 12 }}><div className="cardInner" style={{ display: "grid", gap: 10 }}><h2 className="h3">{title}</h2>{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="fieldLabel">{label}</label>{children}</div>;
}

function CheckboxGrid({ values, checked, onChange }: { values: string[]; checked: string[]; onChange: (v: string) => void }) {
  return (
    <div className="grid2">
      {values.map((value) => (
        <label key={value} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 12px", background: "var(--panel2)" }}>
          <input type="checkbox" checked={checked.includes(value)} onChange={() => onChange(value)} />
          <span>{value}</span>
        </label>
      ))}
    </div>
  );
}
