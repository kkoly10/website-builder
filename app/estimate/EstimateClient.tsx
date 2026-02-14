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

function normalizeTimeline(t: string) {
  const x = (t || "").toLowerCase();
  if (x.includes("under") || x.includes("rush") || x.includes("14")) return "rush";
  if (x.includes("4") || x.includes("+")) return "4+";
  return "2-3";
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function EstimateClient(props: Props) {
  const intake: Intake = useMemo(() => {
    if (props.intake) return props.intake;

    const sp = props.searchParams || {};
    return {
      mode: pick(sp, "mode") || "estimate",
      intent: pick(sp, "intent") || "business",
      intentOther: pick(sp, "intentOther") || "",
      websiteType: pick(sp, "websiteType") || "Business",
      pages: pick(sp, "pages") || "1-3",

      booking: asBool(pick(sp, "booking")),
      payments: asBool(pick(sp, "payments")),
      blog: asBool(pick(sp, "blog")),
      membership: asBool(pick(sp, "membership")),

      wantsAutomation: pick(sp, "wantsAutomation") || "no",

      hasBrand: pick(sp, "hasBrand") || pick(sp, "hasLogo") || "no",
      contentReady: pick(sp, "contentReady") || "some",
      domainHosting: pick(sp, "domainHosting") || "no",
      timeline: pick(sp, "timeline") || "2-3 weeks",
      budget: pick(sp, "budget") || "500-1000",
      competitorUrl: pick(sp, "competitorUrl") || pick(sp, "referenceWebsite") || "",
      notes: pick(sp, "notes") || "",
    };
  }, [props.intake, props.searchParams]);

  const [email, setEmail] = useState(props.leadEmail || pick(props.searchParams || {}, "leadEmail") || "");
  const [phone, setPhone] = useState(props.leadPhone || pick(props.searchParams || {}, "leadPhone") || "");

  const pricing = useMemo(() => {
    // System 2 baselines
    let base = 550;

    const breakdown: { label: string; amount: number }[] = [];

    // pages (accept both formats: 1-3, 4-5, 6-8, 9+ etc.)
    const pages = (intake.pages || "").toLowerCase();
    if (pages.includes("1-3") || pages.includes("1") || pages.includes("3")) {
      breakdown.push({ label: "Base (small site)", amount: 0 });
    } else if (pages.includes("4") || pages.includes("5")) {
      base += 220;
      breakdown.push({ label: "More pages (4–5)", amount: 220 });
    } else if (pages.includes("6") || pages.includes("7") || pages.includes("8")) {
      base += 520;
      breakdown.push({ label: "More pages (6–8)", amount: 520 });
    } else {
      base += 900;
      breakdown.push({ label: "Large site (9+)", amount: 900 });
    }

    // website type signal
    const wt = (intake.websiteType || "").toLowerCase();
    if (wt.includes("ecom")) {
      base += 450;
      breakdown.push({ label: "E-commerce complexity", amount: 450 });
    } else if (wt.includes("portfolio") || wt.includes("landing")) {
      base += 0;
    } else {
      base += 120;
      breakdown.push({ label: "Business site structure", amount: 120 });
    }

    // features
    if (intake.booking) {
      base += 220;
      breakdown.push({ label: "Booking / scheduling", amount: 220 });
    }
    if (intake.payments) {
      base += 380;
      breakdown.push({ label: "Payments / checkout", amount: 380 });
    }
    if (intake.blog) {
      base += 160;
      breakdown.push({ label: "Blog setup", amount: 160 });
    }
    if (intake.membership) {
      base += 520;
      breakdown.push({ label: "Membership / gated content", amount: 520 });
    }

    // automation
    if ((intake.wantsAutomation || "").toLowerCase() === "yes") {
      base += 260;
      breakdown.push({ label: "Automations", amount: 260 });
    }

    // brand + content readiness affect effort
    const hasBrand = (intake.hasBrand || "").toLowerCase();
    if (hasBrand === "no") {
      base += 180;
      breakdown.push({ label: "Brand direction support", amount: 180 });
    }

    const contentReady = (intake.contentReady || "").toLowerCase();
    if (contentReady.includes("not")) {
      base += 240;
      breakdown.push({ label: "Content help / placeholders", amount: 240 });
    } else if (contentReady.includes("some")) {
      base += 120;
      breakdown.push({ label: "Partial content coordination", amount: 120 });
    }

    const dh = (intake.domainHosting || "").toLowerCase();
    if (dh === "no") {
      base += 90;
      breakdown.push({ label: "Domain/hosting setup help", amount: 90 });
    }

    // timeline
    const tl = normalizeTimeline(intake.timeline);
    if (tl === "rush") {
      base += 300;
      breakdown.push({ label: "Rush timeline", amount: 300 });
    }

    // clamp into your System 2 range
    const total = clamp(Math.round(base), 550, 3500);

    const rangeLow = Math.round(total * 0.9);
    const rangeHigh = Math.round(total * 1.18);

    // recommend tier based on total
    const tier =
      total <= 850 ? "Essential Launch" : total <= 1500 ? "Growth Build" : "Premium Platform";

    return { total, rangeLow, rangeHigh, tier, breakdown };
  }, [intake]);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate (actually personalized)</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        This number changes based on pages, features, timeline, and content readiness. Next we’ll save submissions to Supabase.
      </p>

      <div style={{ height: 18 }} />

      <div className="grid2">
        {/* LEFT: estimate */}
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Estimated price</h2>
            <div className="pDark" style={{ marginTop: 8 }}>
              Recommended tier: <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950 }}>{pricing.tier}</span>
            </div>
          </div>

          <div className="panelBody">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: -0.8 }}>
                ${pricing.total.toLocaleString()}
              </div>

              <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 850 }}>
                Typical range: ${pricing.rangeLow.toLocaleString()} – ${pricing.rangeHigh.toLocaleString()}
              </div>

              <div style={{ height: 10 }} />

              <div className="panel" style={{ borderRadius: 16 }}>
                <div className="panelHeader" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontWeight: 950 }}>What influenced the estimate</div>
                  <div className="smallNote">This helps you see why the number moved.</div>
                </div>
                <div className="panelBody" style={{ padding: 14 }}>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.82)" }}>
                    {pricing.breakdown.map((b) => (
                      <li key={b.label}>
                        {b.label}{" "}
                        {b.amount > 0 ? (
                          <span style={{ color: "rgba(255,255,255,0.65)" }}>+${b.amount}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ height: 8 }} />

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

              <div style={{ height: 12 }} />

              <div className="row">
                <Link className="btn btnPrimary" href="/build">
                  Edit answers <span className="btnArrow">→</span>
                </Link>
                <Link className="btn btnGhost" href="/">
                  Back home
                </Link>
              </div>

              <div className="smallNote">
                Next: add Scope Snapshot preview
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: tiers */}
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Tier options</h2>
            <p className="pDark" style={{ marginTop: 8 }}>
              Based on your estimate, we’ll recommend one—but you can choose any.
            </p>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 12 }}>
            <TierMini
              name="Essential Launch"
              price="$550–$850"
              hot={pricing.tier === "Essential Launch"}
              bullets={["Up to ~5 pages/sections", "Contact + basic SEO", "1 revision round"]}
            />
            <TierMini
              name="Growth Build"
              price="$900–$1,500"
              hot={pricing.tier === "Growth Build"}
              bullets={["5–8 pages/sections", "Better UX + analytics", "2 revision rounds"]}
            />
            <TierMini
              name="Premium Platform"
              price="$1,700–$3,500+"
              hot={pricing.tier === "Premium Platform"}
              bullets={["Custom features/integrations", "Performance focus", "2–3 revision rounds"]}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TierMini({
  name,
  price,
  bullets,
  hot,
}: {
  name: string;
  price: string;
  bullets: string[];
  hot?: boolean;
}) {
  return (
    <div className="card" style={{ background: "rgba(255,255,255,0.04)", borderColor: hot ? "rgba(255,122,24,0.45)" : "rgba(255,255,255,0.10)" }}>
      <div className="cardInner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 950 }}>{name}</div>
            <div style={{ color: "rgba(255,255,255,0.62)", fontWeight: 850, marginTop: 4 }}>{price}</div>
          </div>
          <div className={`badge ${hot ? "badgeHot" : ""}`}>{hot ? "Recommended" : "Tier"}</div>
        </div>

        <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}