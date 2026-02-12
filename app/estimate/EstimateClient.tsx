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

type TierKey = "essential" | "growth" | "premium";

const TIERS: Record<
  TierKey,
  {
    name: string;
    range: [number, number];
    label: string;
    bullets: string[];
    revisionLabel: string;
  }
> = {
  essential: {
    name: "Essential Launch",
    range: [550, 850],
    label: "Best for simple launches",
    bullets: [
      "Up to ~5 pages/sections",
      "Clean layout + mobile responsive",
      "Contact form + basic SEO",
      "Fast launch path",
    ],
    revisionLabel: "1 revision round (structured)",
  },
  growth: {
    name: "Growth Build",
    range: [900, 1500],
    label: "Most chosen",
    bullets: [
      "5–8 pages/sections + stronger UX",
      "Booking or conversion improvements",
      "SEO structure + analytics",
      "Better polish + clarity",
    ],
    revisionLabel: "2 revision rounds (structured)",
  },
  premium: {
    name: "Premium Platform",
    range: [1700, 3500],
    label: "Best for scale",
    bullets: [
      "Custom features + integrations",
      "Performance focus + advanced UI",
      "Payments/membership/automation options",
      "More complex workflows",
    ],
    revisionLabel: "2–3 revision rounds (by scope)",
  },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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

  const result = useMemo(() => {
    // Base aligned with System 2 entry
    let score = 0;
    let price = 550;

    const why: string[] = [];

    // pages
    if (intake.pages === "1-3") {
      score += 0;
      price += 0;
      why.push("Small site size");
    } else if (intake.pages === "4-6") {
      score += 1;
      price += 220;
      why.push("More pages/sections");
    } else if (intake.pages === "7-10") {
      score += 2;
      price += 520;
      why.push("Larger site size");
    } else if (intake.pages === "10+") {
      score += 3;
      price += 900;
      why.push("High page count");
    }

    // features
    if (intake.booking) {
      score += 1;
      price += 180;
      why.push("Booking / scheduling");
    }
    if (intake.payments) {
      score += 2;
      price += 320;
      why.push("Payments");
    }
    if (intake.membership) {
      score += 2;
      price += 520;
      why.push("Membership / gated content");
    }
    if (intake.blog) {
      score += 1;
      price += 140;
      why.push("Blog / CMS structure");
    }

    // automation
    if (intake.wantsAutomation === "yes") {
      score += 1;
      price += 220;
      why.push("Automation (workflows/integrations)");
    }

    // content readiness
    if (intake.contentReady === "no") {
      score += 1;
      price += 180;
      why.push("Content not ready");
    } else if (intake.contentReady === "some") {
      score += 0;
    } else if (intake.contentReady === "yes") {
      score += 0;
    }

    // brand
    if (intake.hasBrand === "no") {
      score += 1;
      price += 160;
      why.push("Needs branding polish");
    }

    // domain/hosting
    if (intake.domainHosting === "no") {
      score += 1;
      price += 120;
      why.push("Domain/hosting setup");
    }

    // timeline
    if (intake.timeline === "rush") {
      score += 2;
      price += 360;
      why.push("Rush timeline");
    } else if (intake.timeline === "1w") {
      score += 1;
      price += 220;
      why.push("Tight timeline");
    }

    // budget signal (doesn't directly lower price; affects recommendation & range)
    const budget = intake.budget;
    const budgetTight =
      budget === "under-500" || budget === "500-1000" || budget === "under-1000";
    const budgetHigh = budget === "2000+" || budget === "3500+";

    // Determine tier
    let tier: TierKey = "essential";
    if (score >= 5) tier = "premium";
    else if (score >= 2) tier = "growth";

    // price clamp by tier band with slight flexibility
    const band = TIERS[tier].range;
    const softMin = band[0];
    const softMax = band[1];

    // Keep within sensible bounds, but allow premium to go beyond 3500 a bit
    const hardMax = tier === "premium" ? 5000 : 3500;
    price = clamp(price, 450, hardMax);

    // anchor the displayed "recommended" inside the tier band if close
    // (still respects feature adds)
    const displayed = clamp(price, softMin, tier === "premium" ? hardMax : softMax);

    // range
    const low = Math.round(displayed * 0.92);
    const high = Math.round(displayed * 1.18);

    // If budget is tight, we don’t “lie” — we show the real estimate but hint scope trade-offs.
    const note = budgetTight
      ? "If budget is tight, we can reduce scope (fewer pages/features) or apply an admin-only discount (10–25%) after review."
      : budgetHigh
      ? "You’ll likely benefit from stronger UX polish and performance work."
      : "We’ll confirm scope and lock in the final quote after review.";

    // highlight complexity drivers (top 3)
    const drivers = why.slice(0, 3);

    return {
      tier,
      displayed,
      low,
      high,
      score,
      drivers,
      note,
    };
  }, [intake]);

  return (
    <main className="container" style={{ padding: "44px 0 86px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <h1 className="h1" style={{ marginTop: 14 }}>
        Your estimate, <span className="underline">tailored</span>
      </h1>

      <p className="p" style={{ maxWidth: 840, marginTop: 12 }}>
        Based on your selections. Next we’ll save your quote and generate a scope snapshot (deliverables + exclusions),
        then you can move forward with a deposit or a short call.
      </p>

      <div style={{ height: 22 }} />

      {/* TOP GRID */}
      <div className="estimateGrid">
        {/* LEFT: Estimate panel */}
        <section className="panel">
          <div className="panelHeader">
            <h2 className="h2">Recommended</h2>
            <p className="p" style={{ marginTop: 8 }}>
              {TIERS[result.tier].name} • {TIERS[result.tier].label}
            </p>
          </div>

          <div className="panelBody">
            <div className="bigPrice">${result.displayed.toLocaleString()}</div>
            <div className="rangeLine">
              Typical range: ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
            </div>

            <div className="drivers">
              <div className="driversTitle">Top complexity drivers</div>
              <div className="driversRow">
                {result.drivers.length ? (
                  result.drivers.map((d) => (
                    <span className="driverPill" key={d}>
                      <span className="driverDot" aria-hidden="true" />
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="driverPill">
                    <span className="driverDot" aria-hidden="true" />
                    Standard build
                  </span>
                )}
              </div>
              <div className="helpText">{result.note}</div>
            </div>

            <div className="hr" />

            <div className="formGrid">
              <div>
                <div className="fieldLabel">Email</div>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
                <div className="helpText">(We’ll send your scope snapshot here.)</div>
              </div>

              <div>
                <div className="fieldLabel">Phone (optional)</div>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
                <div className="helpText">(Optional — only if you want a quick call.)</div>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="row">
              <Link className="btn btnPrimary" href="/build">
                Start Custom Build <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>

            <div className="pTiny" style={{ marginTop: 10 }}>
              Next step: we’ll connect this to Supabase so submissions are saved and PIE can generate a consultant-grade recommendation.
            </div>
          </div>
        </section>

        {/* RIGHT: Tier cards */}
        <aside className="tierStack">
          <TierMini
            tierKey="essential"
            active={result.tier === "essential"}
            note="$550–$850"
          />
          <TierMini
            tierKey="growth"
            active={result.tier === "growth"}
            note="$900–$1,500"
            hot
          />
          <TierMini
            tierKey="premium"
            active={result.tier === "premium"}
            note="$1,700–$3,500+"
          />

          <div className="miniInfo">
            <div className="miniInfoTitle">Revision policy</div>
            <div className="miniInfoText">{TIERS[result.tier].revisionLabel}</div>
            <div className="miniInfoText" style={{ marginTop: 8 }}>
              You’ll also get a “Scope Snapshot” that lists deliverables and exclusions — so there are no arguments later.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function TierMini({
  tierKey,
  active,
  note,
  hot,
}: {
  tierKey: TierKey;
  active?: boolean;
  note: string;
  hot?: boolean;
}) {
  const t = TIERS[tierKey];
  return (
    <div className={`card cardHover tierMini ${active ? "tierActive" : ""}`}>
      <div className="cardInner">
        <div className="tierMiniHead">
          <div>
            <div className="tierName">{t.name}</div>
            <div className="tierSub">{t.label}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{note}</div>
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
              {active ? "Your match" : hot ? "Most chosen" : "Tier"}
            </div>
          </div>
        </div>

        <ul className="tierList" style={{ marginTop: 10 }}>
          {t.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}