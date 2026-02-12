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

  const [email, setEmail] = useState(
    props.leadEmail || pick(props.searchParams || {}, "leadEmail") || ""
  );
  const [phone, setPhone] = useState(
    props.leadPhone || pick(props.searchParams || {}, "leadPhone") || ""
  );

  const estimate = useMemo(() => {
    let base = 550;

    // pages
    if (intake.pages === "4-6") base += 250;
    if (intake.pages === "7-10") base += 600;
    if (intake.pages === "10+") base += 1100;

    // features
    if (intake.booking) base += 180;
    if (intake.payments) base += 300;
    if (intake.blog) base += 150;
    if (intake.membership) base += 500;

    // automation
    if (intake.wantsAutomation === "yes") base += 250;

    // timeline
    if (intake.timeline === "rush") base += 300;

    // content readiness (more work if none)
    if (intake.contentReady === "none") base += 250;

    // clamp
    const min = 550;
    const max = 3500;
    const total = Math.max(min, Math.min(max, base));

    return {
      total,
      rangeLow: Math.round(total * 0.9),
      rangeHigh: Math.round(total * 1.15),
    };
  }, [intake]);

  return (
    <main className="container" style={{ padding: "34px 0 70px", position: "relative", zIndex: 1 }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Get a quick estimate</h1>
      <p style={{ maxWidth: 760, marginTop: 10 }}>
        Answer a few questions and we’ll generate a ballpark price instantly. Then you can submit to save your quote.
      </p>

      <div style={{ height: 18 }} />

      {/* ✅ Paper Surface: fixes legibility permanently */}
      <section className="formPaper">
        <div className="paperHead">
          <div className="kicker paperKicker">
            <span className="kickerDot" aria-hidden="true" />
            Your estimate summary
          </div>
          <h2 className="h2 paperH2" style={{ marginTop: 10 }}>
            Estimated total
          </h2>
          <div className="paperText" style={{ marginTop: 8 }}>
            Based on your selections. We’ll confirm scope + revisions before finalizing.
          </div>
        </div>

        <div className="paperBody">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 38, fontWeight: 980, letterSpacing: -0.8, color: "rgba(15,17,20,0.92)" }}>
              ${estimate.total.toLocaleString()}
            </div>

            <div style={{ fontWeight: 900, color: "rgba(15,17,20,0.72)" }}>
              Typical range: ${estimate.rangeLow.toLocaleString()} – ${estimate.rangeHigh.toLocaleString()}
            </div>

            {/* This is the “parentheses / small text” fix */}
            <div className="hint">
              (This is a starting range. Final price depends on pages, content readiness, and integrations.)
            </div>

            <div style={{ height: 10 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fieldLabel">Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
              </div>

              <div>
                <div className="fieldLabel">Phone (optional)</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnPrimary" href="/build">
                Start Custom Build <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
              <Link className="btn" href="/estimate">
                Adjust answers
              </Link>
            </div>

            <div className="hint">
              Next: add Scope Snapshot preview
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}