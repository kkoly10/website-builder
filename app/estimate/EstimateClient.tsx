"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

export type Intake = {
  mode: string;
  intent: string;
  intentOther: string;
  websiteType: string; // business | ecommerce | landing | portfolio
  pages: string; // 1-3 | 4-6 | 7-10 | 10+
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: string; // yes | no
  hasBrand: string; // yes | no
  contentReady: string; // ready | some | no
  domainHosting: string; // yes | no
  timeline: string; // 2-4w | rush | etc
  budget: string; // 500-1000 | 900-1500 | etc
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
  { label: string; rangeLow: number; rangeHigh: number; base: number; priceLabel: string; blurb: string }
> = {
  essential: {
    label: "Essential Launch",
    rangeLow: 550,
    rangeHigh: 850,
    base: 650,
    priceLabel: "$550–$850",
    blurb: "Best for simple launches",
  },
  growth: {
    label: "Growth Build",
    rangeLow: 900,
    rangeHigh: 1500,
    base: 1100,
    priceLabel: "$900–$1,500",
    blurb: "Most chosen",
  },
  premium: {
    label: "Premium Platform",
    rangeLow: 1700,
    rangeHigh: 3500,
    base: 2200,
    priceLabel: "$1,700–$3,500+",
    blurb: "Best for scale",
  },
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeWebsiteType(v: string) {
  const s = (v || "").toLowerCase().trim();
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("land")) return "landing";
  if (s.includes("port")) return "portfolio";
  return "business";
}

function normalizePages(v: string) {
  const s = (v || "").trim();
  if (s === "4-6" || s === "4-5" || s === "4-5 pages" || s === "4-5") return "4-6";
  if (s === "6-8" || s === "7-10") return "7-10";
  if (s === "9+" || s === "10+" || s === "10+ pages") return "10+";
  return "1-3";
}

function tierFromIntake(intake: Intake): TierKey {
  const pages = normalizePages(intake.pages);
  const wt = normalizeWebsiteType(intake.websiteType);

  const heavyFeatures =
    intake.payments || intake.membership || (intake.wantsAutomation || "").toLowerCase() === "yes";

  // Premium triggers
  if (pages === "10+") return "premium";
  if (wt === "ecommerce" && (pages === "7-10" || heavyFeatures)) return "premium";
  if (intake.membership) return "premium";

  // Growth triggers
  if (pages === "7-10") return "growth";
  if (wt === "ecommerce") return "growth";
  if (intake.booking || intake.payments || intake.blog || (intake.wantsAutomation || "").toLowerCase() === "yes")
    return "growth";

  // Otherwise Essential
  return "essential";
}

type Line = { label: string; amount: number; note?: string };

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

  const model = useMemo(() => {
    const pages = normalizePages(intake.pages);
    const wt = normalizeWebsiteType(intake.websiteType);
    const automationYes = (intake.wantsAutomation || "").toLowerCase() === "yes";
    const timeline = (intake.timeline || "").toLowerCase();

    const tier: TierKey = tierFromIntake(intake);
    const tierCfg = TIERS[tier];

    const lines: Line[] = [];

    // Base = includes the “Essentials” of that tier
    let total = tierCfg.base;
    lines.push({ label: `Start price (${tierCfg.label})`, amount: tierCfg.base });

    // INCLUDED (show as $0 so it’s clear you’re not double-charging)
    lines.push({ label: "Included: Base structure & UX", amount: 0 });
    if (wt === "landing") lines.push({ label: "Included: Landing page focus", amount: 0 });
    if (pages === "1-3") lines.push({ label: "Included: Small site scope (1–3 pages)", amount: 0 });

    // Pages uplift beyond what the tier typically covers
    // Essential: assumes 1–3 pages included; Growth: assumes up to ~6; Premium: assumes up to ~8 before uplift
    if (tier === "essential") {
      if (pages === "4-6") {
        total += 220;
        lines.push({ label: "Pages uplift (4–6)", amount: 220 });
      }
      if (pages === "7-10") {
        total += 520;
        lines.push({ label: "Pages uplift (7–10)", amount: 520 });
      }
      if (pages === "10+") {
        total += 900;
        lines.push({ label: "Pages uplift (10+)", amount: 900 });
      }
    } else if (tier === "growth") {
      if (pages === "7-10") {
        total += 260;
        lines.push({ label: "Pages uplift (7–10)", amount: 260 });
      }
      if (pages === "10+") {
        total += 650;
        lines.push({ label: "Pages uplift (10+)", amount: 650 });
      }
    } else {
      // premium
      if (pages === "10+") {
        total += 450;
        lines.push({ label: "Large scope uplift (10+)", amount: 450 });
      }
    }

    // Website type complexity
    if (wt === "ecommerce") {
      const add = tier === "essential" ? 380 : tier === "growth" ? 260 : 180;
      total += add;
      lines.push({ label: "E-commerce complexity", amount: add });
    }

    // Feature add-ons (true extras)
    if (intake.booking) {
      total += 150;
      lines.push({ label: "Booking / appointments", amount: 150 });
    }
    if (intake.payments) {
      total += 250;
      lines.push({ label: "Payments / checkout", amount: 250 });
    }
    if (intake.blog) {
      total += 120;
      lines.push({ label: "Blog setup", amount: 120 });
    }
    if (intake.membership) {
      total += 400;
      lines.push({ label: "Membership / gated content", amount: 400 });
    }
    if (automationYes) {
      total += 200;
      lines.push({ label: "Automations setup", amount: 200 });
    }

    // Readiness (only charge when it will genuinely add labor)
    const contentReady = (intake.contentReady || "").toLowerCase();
    if (contentReady === "no" || contentReady === "not ready") {
      total += 220;
      lines.push({ label: "Content not ready (writing/help)", amount: 220 });
    } else {
      lines.push({ label: "Included: Partial content readiness", amount: 0 });
    }

    const hasBrand = (intake.hasBrand || "").toLowerCase();
    if (hasBrand === "no") {
      // Included in Essential/Growth as “basic direction”, only charge in Premium if heavy custom branding implied
      if (tier === "premium") {
        total += 180;
        lines.push({ label: "Brand direction (no existing brand kit)", amount: 180 });
      } else {
        lines.push({ label: "Included: Basic brand direction (no brand kit)", amount: 0 });
      }
    }

    const domainHosting = (intake.domainHosting || "").toLowerCase();
    if (domainHosting === "no") {
      // Included (quick guidance) — only charge if you later add a “hands-on setup” option
      lines.push({ label: "Included: Domain/hosting guidance", amount: 0 });
    }

    if (timeline.includes("rush") || timeline.includes("under") || timeline.includes("14")) {
      total += 250;
      lines.push({ label: "Rush timeline", amount: 250 });
    }

    // Clamp to public tier range (Premium can exceed, but keep it sane for now)
    let clampedTotal = total;
    if (tier !== "premium") {
      clampedTotal = clamp(total, tierCfg.rangeLow, tierCfg.rangeHigh);
    } else {
      clampedTotal = Math.max(tierCfg.rangeLow, total);
    }

    // If clamped changed the total, add a note line (not money) by showing $0 with note
    if (clampedTotal !== total) {
      lines.push({
        label: "Tier range adjustment",
        amount: 0,
        note: `Kept within public ${tierCfg.priceLabel} range`,
      });
    }

    const rangeLow = Math.round(clampedTotal * 0.9);
    const rangeHigh = Math.round(clampedTotal * 1.15);

    // Best-fit tier (you already like this behavior)
    const bestFit: TierKey = tier;

    return {
      pages,
      websiteType: wt,
      tier,
      bestFit,
      total: clampedTotal,
      rangeLow,
      rangeHigh,
      lines,
      debug: {
        pages,
        booking: intake.booking,
        payments: intake.payments,
        blog: intake.blog,
        membership: intake.membership,
        wantsAutomation: automationYes ? "yes" : "no",
        contentReady: intake.contentReady,
        hasBrand: intake.hasBrand,
        domainHosting: intake.domainHosting,
        timeline: intake.timeline,
        websiteType: wt,
        intent: intake.intent,
      },
    };
  }, [intake]);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        Based on your selections (pages: <strong>{model.pages}</strong>).
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Estimate</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Includes the right tier baseline + only true add-ons.
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: -0.6 }}>
              ${model.total.toLocaleString()}
            </div>
            <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 800 }}>
              Typical range: ${model.rangeLow.toLocaleString()} – ${model.rangeHigh.toLocaleString()}
            </div>

            <div style={{ height: 10 }} />

            <div className="cardInner" style={{ padding: 14 }}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Breakdown</div>
              <div style={{ display: "grid", gap: 8 }}>
                {model.lines.map((l) => (
                  <div
                    key={l.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      color: "rgba(255,255,255,0.86)",
                    }}
                  >
                    <div style={{ maxWidth: 520 }}>
                      {l.label}
                      {l.note ? (
                        <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, marginTop: 2 }}>
                          {l.note}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>
                      {l.amount === 0 ? "$0" : `+ $${l.amount.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.70)", fontSize: 13, lineHeight: 1.6 }}>
                Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
              </div>
            </div>

            <div style={{ height: 8 }} />

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

            <div style={{ height: 10 }} />

            <div className="row">
              <Link className="btn btnPrimary" href="/build">
                Start a Build →
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>

            <div className="cardInner" style={{ padding: 14 }}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Recommended tier</div>
              <div className="tierGrid">
                {(Object.keys(TIERS) as TierKey[]).map((k) => {
                  const t = TIERS[k];
                  const best = k === model.bestFit;
                  return (
                    <div
                      key={k}
                      className="card"
                      style={{
                        borderColor: best ? "rgba(255,122,24,0.55)" : "rgba(255,255,255,0.12)",
                        background: best ? "rgba(255,122,24,0.10)" : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="cardInner">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div className="tierName">{t.label}</div>
                            <div className="tierSub">{t.blurb}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className="tierPrice">{t.priceLabel}</div>
                            <div className={`badge ${best ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
                              {best ? "Best fit" : "Tier"}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", lineHeight: 1.55 }}>
                          {best ? "Matches your scope + features based on System 2." : "See tier details on the homepage."}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
                Next: add Scope Snapshot preview
              </div>
            </div>

            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>
                Debug (what we parsed)
              </summary>
              <pre style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.82)", marginTop: 10 }}>
                {JSON.stringify(model.debug, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
