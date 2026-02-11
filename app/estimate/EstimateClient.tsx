"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

type Intake = {
  mode: string;
  intent: string;
  intentOther: string;
  websiteType: string;
  pages: string;
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: string;
  hasBrand: string;
  contentReady: string;
  domainHosting: string;
  timeline: string;
  budget: string;
  competitorUrl: string;
  notes: string;
};

type LegacyProps = { intake: Intake; leadEmail: string; leadPhone: string };
type NewProps = { searchParams: SearchParams };
type Props = Partial<LegacyProps> & Partial<NewProps>;

function pick(params: SearchParams, key: string) {
  const v = params?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function asBool(v: string) {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export default function EstimateClient(props: Props) {
  const intake: Intake = useMemo(() => {
    if (props.intake) return props.intake;

    const sp = props.searchParams || {};
    return {
      mode: pick(sp, "mode") || "estimate",
      intent: pick(sp, "intent") || "business",
      intentOther: pick(sp, "intentOther") || "",
      websiteType: pick(sp, "websiteType") || "business",
      pages: pick(sp, "pages") || "1-3",
      booking: asBool(pick(sp, "booking")),
      payments: asBool(pick(sp, "payments")),
      blog: asBool(pick(sp, "blog")),
      membership: asBool(pick(sp, "membership")),
      wantsAutomation: pick(sp, "wantsAutomation") || "no",
      hasBrand: pick(sp, "hasBrand") || "no",
      contentReady: pick(sp, "contentReady") || "some",
      domainHosting: pick(sp, "domainHosting") || "no",
      timeline: pick(sp, "timeline") || "2-4w",
      budget: pick(sp, "budget") || "500-1000",
      competitorUrl: pick(sp, "competitorUrl") || "",
      notes: pick(sp, "notes") || "",
    };
  }, [props.intake, props.searchParams]);

  const [email, setEmail] = useState(props.leadEmail || pick(props.searchParams || {}, "leadEmail") || "");
  const [phone, setPhone] = useState(props.leadPhone || pick(props.searchParams || {}, "leadPhone") || "");

  // NOTE: estimate logic is intentionally simple right now.
  // Next step: real pricing rules based on selections (we’ll do that next).
  const estimate = useMemo(() => {
    let base = 450;

    // pages
    if (intake.pages === "4-6") base += 250;
    if (intake.pages === "7-10") base += 600;
    if (intake.pages === "10+") base += 1000;

    // features
    if (intake.booking) base += 150;
    if (intake.payments) base += 250;
    if (intake.blog) base += 120;
    if (intake.membership) base += 400;

    // automation
    if (intake.wantsAutomation === "yes") base += 200;

    // timeline
    if (intake.timeline === "rush") base += 250;

    // clamp
    const min = 450;
    const max = 3500;
    const total = Math.max(min, Math.min(max, base));

    return {
      total,
      rangeLow: Math.round(total * 0.9),
      rangeHigh: Math.round(total * 1.15),
    };
  }, [intake]);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Get a quick estimate</h1>
      <p className="p" style={{ maxWidth: 760, marginTop: 10 }}>
        Answer a few questions and we’ll generate a ballpark price instantly. Then you can submit to save your quote.
      </p>

      <div style={{ height: 22 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Your estimate</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Based on your selections.
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 36, fontWeight: 950, letterSpacing: -0.6 }}>
              ${estimate.total.toLocaleString()}
            </div>
            <div style={{ color: "rgba(11,16,32,.72)", fontWeight: 800 }}>
              Typical range: ${estimate.rangeLow.toLocaleString()} – ${estimate.rangeHigh.toLocaleString()}
            </div>

            <div style={{ height: 10 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fieldLabel">Email</div>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
              </div>

              <div>
                <div className="fieldLabel">Phone (optional)</div>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="row">
              <Link className="btn btnPrimary" href="/build">
                Start Custom Build →
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>

            <div style={{ fontSize: 12, color: "rgba(11,16,32,.62)", marginTop: 6 }}>
              Next: we’ll connect this to Supabase so every submission is saved and pricing becomes fully personalized.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}