"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

type Mode = "chooser" | "guided" | "known";
type Intent = "Marketing" | "Leads" | "Booking" | "Selling" | "Content" | "Membership" | "Other";
type WebsiteType = "Business" | "Ecommerce" | "Portfolio" | "Landing";
type Pages = "1" | "1-3" | "4-5" | "6-8" | "9+";
type Design = "Modern" | "Classic" | "Creative";
type Timeline = "2-3 weeks" | "4+ weeks" | "Under 14 days";
type YesNo = "Yes" | "No";
type ContentReady = "Ready" | "Some" | "Not ready";
type AssetsSource = "Client provides" | "Stock" | "Need help";

type FormState = {
  mode: Mode;
  websiteType: WebsiteType;
  intent: Intent;
  intentOther: string;
  pages: Pages;
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: YesNo;
  automationTypes: string[];
@@ -36,96 +35,114 @@ type FormState = {
  assetsSource: AssetsSource;
  referenceWebsite: string;
  domainHosting: YesNo;
  decisionMaker: YesNo;
  stakeholdersCount: "1" | "2-3" | "4+";
  design: Design;
  timeline: Timeline;
  notes: string;
  leadEmail: string;
  leadPhone: string;
};

const INTENTS: Intent[] = ["Marketing", "Leads", "Booking", "Selling", "Content", "Membership", "Other"];
const WEBSITE_TYPES: WebsiteType[] = ["Business", "Ecommerce", "Portfolio", "Landing"];
const PAGES: Pages[] = ["1", "1-3", "4-5", "6-8", "9+"];
const DESIGNS: Design[] = ["Modern", "Classic", "Creative"];
const TIMELINES: Timeline[] = ["2-3 weeks", "4+ weeks", "Under 14 days"];

const AUTOMATION_OPTIONS = ["Email confirmations", "Email follow-ups", "SMS reminders", "CRM integration", "Lead routing"];
const INTEGRATION_OPTIONS = ["Google Maps / location", "Calendly / scheduling", "Stripe payments", "PayPal payments", "Mailchimp / email list", "Analytics (GA4 / Pixel)", "Live chat"];

const LS_KEY = "crecystudio:intake";

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    mode: "chooser",
    websiteType: "Business",
    intent: "Marketing",
    intentOther: "",
    pages: "1-3",
    booking: false,
    payments: false,
    blog: false,
    membership: false,
    wantsAutomation: "No",
    automationTypes: [],
    integrations: [],
    integrationOther: "",
    hasLogo: "Yes",
    hasBrandGuide: "No",
    contentReady: "Some",
    assetsSource: "Client provides",
    referenceWebsite: "",
    domainHosting: "Yes",
    decisionMaker: "Yes",
    stakeholdersCount: "1",
    design: "Modern",
    timeline: "2-3 weeks",
    notes: "",
    leadEmail: "",
    leadPhone: "",
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") setForm((f) => ({ ...f, ...parsed }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const intent = searchParams.get("intent");
    const websiteType = searchParams.get("websiteType");
    const pages = searchParams.get("pages");
    const timeline = searchParams.get("timeline");

    setForm((f) => ({
      ...f,
      mode: mode === "guided" || mode === "known" ? mode : f.mode,
      intent: INTENTS.includes(intent as Intent) ? (intent as Intent) : f.intent,
      websiteType: WEBSITE_TYPES.includes(websiteType as WebsiteType) ? (websiteType as WebsiteType) : f.websiteType,
      pages: PAGES.includes(pages as Pages) ? (pages as Pages) : f.pages,
      timeline: TIMELINES.includes(timeline as Timeline) ? (timeline as Timeline) : f.timeline,
    }));
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

  function goMode(mode: Mode) {
    setForm((f) => ({ ...f, mode }));
    setStep(1);
  }

  function next() { setStep((s) => Math.min(s + 1, 7)); } // Max step reduced to 7
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function applySuggested() { setForm((f) => ({ ...f, ...suggested })); }

  function toggleInList(key: "automationTypes" | "integrations", value: string) {
    setForm((f) => {
      const current = new Set(f[key]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...f, [key]: Array.from(current) } as FormState;
app/page.tsx
app/page.tsx
+2
-2

@@ -5,51 +5,51 @@ export const dynamic = "force-dynamic";
export default function Home() {
  return (
    <main className="homePage">
      
      {/* 1. CLEAN, CENTERED HERO SECTION */}
      <section className="section" style={{ padding: "100px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="kicker" style={{ margin: "0 auto 24px" }}>
            Websites & Workflow Systems
          </div>
          
          <h1 className="h1">
            Build a professional presence. <br />
            Automate the busywork.
          </h1>
          
          <p className="p" style={{ marginTop: 24, fontSize: 20 }}>
            I help local businesses look elite online and run seamlessly behind the scenes. 
            From high-converting websites to automated client intake and invoicing workflows.
          </p>
          
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/systems" className="btn btnPrimary" style={{ padding: "16px 24px", fontSize: 16 }}>
              Fix My Workflow Operations
            </Link>
            <Link href="/build" className="btn btnGhost" style={{ padding: "16px 24px", fontSize: 16 }}>
            <Link href="/build/intro" className="btn btnGhost" style={{ padding: "16px 24px", fontSize: 16 }}>
              Get a Website Quote
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM (AGITATION) */}
      <section className="section" style={{ background: "var(--panel)", borderTop: "1px solid var(--stroke)", borderBottom: "1px solid var(--stroke)" }}>
        <div className="container">
          <div className="grid2" style={{ alignItems: "center" }}>
            <div>
              <h2 className="h2">Most local businesses outgrow their systems.</h2>
              <p className="p" style={{ marginTop: 16 }}>
                You started by tracking leads in a notebook or an Excel sheet. Now, you are spending 15 hours a week chasing down invoices, copying data between tools, and losing potential clients because your website doesn't convert them instantly.
              </p>
              <div className="pills" style={{ marginTop: 24 }}>
                <span className="badge">Data Entry Bottlenecks</span>
                <span className="badge">Messy Client Intake</span>
                <span className="badge">Outdated Web Design</span>
              </div>
            </div>
            
            <div className="card">
              <div className="cardInner" style={{ padding: 40 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>1-3</div>
@@ -90,39 +90,39 @@ export default function Home() {
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link href="/systems" className="btn btnPrimary" style={{ width: "100%" }}>
                    Start Workflow Audit
                  </Link>
                </div>
              </div>
            </div>

            {/* PATH 2 */}
            <div className="card cardHover">
              <div className="cardInner" style={{ padding: 40, height: "100%", display: "flex", flexDirection: "column" }}>
                <div>
                  <div className="badge">Marketing</div>
                  <h3 className="h2" style={{ fontSize: 28, marginTop: 16 }}>Custom Websites</h3>
                  <p className="p" style={{ marginTop: 12 }}>
                    Professional, mobile-optimized sites built to convert visitors into booked jobs. Perfect for local services needing to outrank competitors.
                  </p>
                  <ul style={{ margin: "24px 0", paddingLeft: 20, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>Lead Capture & Booking Forms</li>
                    <li>SEO & Performance Optimized</li>
                    <li>Starting at $550</li>
                  </ul>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link href="/build" className="btn btnGhost" style={{ width: "100%" }}>
                  <Link href="/build/intro" className="btn btnGhost" style={{ width: "100%" }}>
                    Get Instant Website Quote
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
