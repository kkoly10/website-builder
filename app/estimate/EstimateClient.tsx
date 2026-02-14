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
  const s = (v ?? "").toString().trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function norm(s: string) {
  return (s ?? "").toString().trim();
}

function normLower(s: string) {
  return norm(s).toLowerCase();
}

function normPages(p: string) {
  const v = norm(p);

  // support multiple historical page labels you used across versions
  const map: Record<string, string> = {
    "1-3": "1-3",
    "1–3": "1-3",
    "1 to 3": "1-3",

    "4-5": "4-5",
    "4–5": "4-5",

    "4-6": "4-6",
    "4–6": "4-6",

    "6-8": "6-8",
    "6–8": "6-8",

    "7-10": "7-10",
    "7–10": "7-10",

    "9+": "9+",
    "9 +": "9+",
    "9plus": "9+",

    "10+": "10+",
    "10 +": "10+",
  };

  const key = v.replace(/\s+/g, " ").trim();
  return map[key] ?? v;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
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

  const pricing = useMemo(() => {
    // ===== System 2 baseline =====
    const START_PRICE = 550;

    const breakdown: { label: string; amount: number }[] = [];
    const add = (label: string, amount: number) => {
      if (amount === 0) return;
      breakdown.push({ label, amount });
    };

    let total = START_PRICE;

    // normalize inputs
    const pages = normPages(intake.pages);
    const websiteType = normLower(intake.websiteType);
    const intent = normLower(intake.intent);
    const contentReady = normLower(intake.contentReady);
    const timeline = normLower(intake.timeline);
    const wantsAutomation = normLower(intake.wantsAutomation);
    const hasBrand = normLower(intake.hasBrand);
    const domainHosting = normLower(intake.domainHosting);

    // ===== Pages / size =====
    const pageAddMap: Record<string, number> = {
      "1-3": 0,
      "4-5": 220,
      "4-6": 320,
      "6-8": 650,
      "7-10": 900,
      "9+": 1100,
      "10+": 1300,
    };
    const pageAdd = pageAddMap[pages] ?? 220; // safe default
    total += pageAdd;
    add(`Pages (${pages})`, pageAdd);

    // ===== Website type / intent complexity =====
    // keep it conservative + predictable
    const typeAdd =
      websiteType.includes("ecommerce") || intent.includes("selling") ? 380 : 120;
    total += typeAdd;
    add("Base structure & UX", typeAdd);

    // ===== Features =====
    if (intake.booking) {
      total += 220;
      add("Booking / scheduling", 220);
    }
    if (intake.payments) {
      total += 420;
      add("Payments / checkout", 420);
    }
    if (intake.blog) {
      total += 180;
      add("Blog / content setup", 180);
    }
    if (intake.membership) {
      total += 650;
      add("Membership / gated content", 650);
    }

    // ===== Automation =====
    if (wantsAutomation === "yes") {
      total += 260;
      add("Automations", 260);
    }

    // ===== Readiness =====
    // if content is not ready, scope expands (copy + structure)
    if (contentReady === "not ready") {
      total += 320;
      add("Content not ready (extra copy/structure)", 320);
    } else if (contentReady === "some") {
      total += 140;
      add("Partial content readiness", 140);
    }

    // ===== Brand =====
    // hasBrand = yes/no (your estimate page uses hasBrand)
    if (hasBrand === "no") {
      total += 220;
      add("No brand kit (basic brand direction)", 220);
    }

    // ===== Domain/hosting help =====
    if (domainHosting === "no") {
      total += 90;
      add("Domain/hosting guidance", 90);
    }

    // ===== Rush =====
    // support multiple label styles
    const isRush =
      timeline.includes("rush") ||
      timeline.includes("under 14") ||
      timeline.includes("under14") ||
      timeline.includes("1-2") ||
      timeline.includes("1–2");
    if (isRush) {
      total += 280;
      add("Rush timeline", 280);
    }

    // ===== Clamp to System 2 envelope =====
    const min = 550;
    const max = 3500;
    total = Math.max(min, Math.min(max, total));

    const rangeLow = Math.round(total * 0.9);
    const rangeHigh = Math.round(total * 1.15);

    // ===== Tier recommendation =====
    let tier: "Essential" | "Growth" | "Premium" = "Growth";
    if (total <= 850) tier = "Essential";
    else if (total <= 1500) tier = "Growth";
    else tier = "Premium";

    return { total, rangeLow, rangeHigh, tier, breakdown, pages };
  }, [intake]);

  const tierCards = useMemo(() => {
    const tiers = [
      {
        key: "Essential",
        name: "Essential Launch",
        price: "$550–$850",
        badge: "Best for simple launches",
        bullets: [
          "Up to ~5 sections / pages",
          "Clean layout + mobile responsive",
          "Contact form + basic SEO",
          "1 revision round (structured)",
        ],
      },
      {
        key: "Growth",
        name: "Growth Build",
        price: "$900–$1,500",
        badge: "Most chosen",
        bullets: [
          "5–8 pages/sections + stronger UX",
          "Booking + lead capture improvements",
          "Better SEO structure + analytics",
          "2 revision rounds (structured)",
        ],
      },
      {
        key: "Premium",
        name: "Premium Platform",
        price: "$1,700–$3,500+",
        badge: "Best for scale",
        bullets: [
          "Custom features + integrations",
          "Advanced UI + performance focus",
          "Payments/membership/automation options",
          "2–3 revision rounds (by scope)",
        ],
      },
    ] as const;

    return tiers;
  }, []);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Get a quick estimate</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        Answer a few questions and we’ll generate a ballpark price instantly — plus a
        tier recommendation. Then we finalize scope together.
      </p>

      <div style={{ height: 22 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Your estimate</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Based on your selections (pages: <strong>{pricing.pages}</strong>).
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: -0.8 }}>
              {money(pricing.total)}
            </div>

            <div style={{ fontWeight: 800, opacity: 0.92 }}>
              Typical range: {money(pricing.rangeLow)} – {money(pricing.rangeHigh)}
            </div>

            {/* breakdown */}
            <div className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Breakdown</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <Row label="Start price (System 2)" value={money(550)} />
                  {pricing.breakdown.map((x) => (
                    <Row key={x.label} label={x.label} value={`+ ${money(x.amount)}`} />
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.78 }}>
                  Note: if budget is tight, we can do scope trade-offs or admin-only discounts
                  (10–25%) without changing public tier pricing.
                </div>
              </div>
            </div>

            {/* lead */}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fieldLabel">Email</div>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
              </div>

              <div>
                <div className="fieldLabel">Phone (optional)</div>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <Link className="btn btnPrimary" href="/build">
                Update answers <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="section">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">System 2 • 3 Tiers</div>
            <h2 className="h2" style={{ marginTop: 12 }}>
              Recommended:{" "}
              <span className="underline">{pricing.tier === "Essential" ? "Essential Launch" : pricing.tier === "Growth" ? "Growth Build" : "Premium Platform"}</span>
            </h2>
            <div style={{ opacity: 0.78, marginTop: 8, maxWidth: 780, lineHeight: 1.6 }}>
              Your answers suggest the tier above — but you can choose any tier and we’ll finalize scope together.
            </div>
          </div>

          <Link className="btn btnPrimary" href="/build">
            Adjust scope <span className="btnArrow">→</span>
          </Link>
        </div>

        <div className="tierGrid" style={{ marginTop: 16 }}>
          {tierCards.map((t) => {
            const hot = t.key === pricing.tier;
            return (
              <div key={t.key} className="card cardHover">
                <div className="cardInner">
                  <div className="tierHead">
                    <div>
                      <div className="tierName">{t.name}</div>
                      <div className="tierSub">{t.badge}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="tierPrice">{t.price}</div>
                      <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
                        {hot ? "Recommended" : "Tier"}
                      </div>
                    </div>
                  </div>

                  <ul className="tierList">
                    {t.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <div className="tierCTA">
                    <Link className="btn btnPrimary" href="/build">
                      Refine scope <span className="btnArrow">→</span>
                    </Link>
                    <Link className="btn btnGhost" href="/dashboard">
                      Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, opacity: 0.78, fontSize: 13 }}>
          Next: add Scope Snapshot preview
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ opacity: 0.86 }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
    </div>
  );
}