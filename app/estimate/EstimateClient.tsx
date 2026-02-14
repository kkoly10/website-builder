"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

/** normalize values from server-style SearchParams */
function pickObj(params: SearchParams, key: string) {
  const v = params?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

/** normalize values from useSearchParams() */
function pickUrl(sp: URLSearchParams, key: string) {
  return sp.get(key) ?? "";
}

function asBool(v: string) {
  const s = (v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function hasAnyEstimateParams(sp: URLSearchParams) {
  // If ANY of these exist, we consider URL to be the source of truth.
  const keys = [
    "pages",
    "websiteType",
    "booking",
    "payments",
    "blog",
    "membership",
    "wantsAutomation",
    "hasBrand",
    "contentReady",
    "domainHosting",
    "timeline",
    "budget",
    "intent",
    "mode",
  ];
  return keys.some((k) => sp.has(k));
}

export default function EstimateClient(props: Props) {
  const urlParams = useSearchParams();

  // Build intake from URL first (source of truth), else fallback to props.intake, else props.searchParams
  const intake: Intake = useMemo(() => {
    const sp = new URLSearchParams(urlParams?.toString() || "");

    // 1) URL params take priority if present
    if (hasAnyEstimateParams(sp)) {
      return {
        mode: pickUrl(sp, "mode") || "estimate",
        intent: pickUrl(sp, "intent") || "business",
        intentOther: pickUrl(sp, "intentOther") || "",

        websiteType: pickUrl(sp, "websiteType") || "business",
        pages: pickUrl(sp, "pages") || "1-3",

        booking: asBool(pickUrl(sp, "booking")),
        payments: asBool(pickUrl(sp, "payments")),
        blog: asBool(pickUrl(sp, "blog")),
        membership: asBool(pickUrl(sp, "membership")),

        wantsAutomation: pickUrl(sp, "wantsAutomation") || "no",
        hasBrand: pickUrl(sp, "hasBrand") || "no",
        contentReady: pickUrl(sp, "contentReady") || "some",
        domainHosting: pickUrl(sp, "domainHosting") || "no",
        timeline: pickUrl(sp, "timeline") || "2-4w",
        budget: pickUrl(sp, "budget") || "500-1000",
        competitorUrl: pickUrl(sp, "competitorUrl") || "",
        notes: pickUrl(sp, "notes") || "",
      };
    }

    // 2) legacy props.intake
    if (props.intake) return props.intake;

    // 3) server props.searchParams
    const obj = props.searchParams || {};
    return {
      mode: pickObj(obj, "mode") || "estimate",
      intent: pickObj(obj, "intent") || "business",
      intentOther: pickObj(obj, "intentOther") || "",

      websiteType: pickObj(obj, "websiteType") || "business",
      pages: pickObj(obj, "pages") || "1-3",

      booking: asBool(pickObj(obj, "booking")),
      payments: asBool(pickObj(obj, "payments")),
      blog: asBool(pickObj(obj, "blog")),
      membership: asBool(pickObj(obj, "membership")),

      wantsAutomation: pickObj(obj, "wantsAutomation") || "no",
      hasBrand: pickObj(obj, "hasBrand") || "no",
      contentReady: pickObj(obj, "contentReady") || "some",
      domainHosting: pickObj(obj, "domainHosting") || "no",
      timeline: pickObj(obj, "timeline") || "2-4w",
      budget: pickObj(obj, "budget") || "500-1000",
      competitorUrl: pickObj(obj, "competitorUrl") || "",
      notes: pickObj(obj, "notes") || "",
    };
  }, [urlParams, props.intake, props.searchParams]);

  const [email, setEmail] = useState(() => {
    const sp = new URLSearchParams(urlParams?.toString() || "");
    return (
      props.leadEmail ||
      (urlParams ? pickUrl(sp, "leadEmail") : "") ||
      pickObj(props.searchParams || {}, "leadEmail") ||
      ""
    );
  });

  const [phone, setPhone] = useState(() => {
    const sp = new URLSearchParams(urlParams?.toString() || "");
    return (
      props.leadPhone ||
      (urlParams ? pickUrl(sp, "leadPhone") : "") ||
      pickObj(props.searchParams || {}, "leadPhone") ||
      ""
    );
  });

  // --- Pricing logic (System 2-ish starter) ---
  const estimate = useMemo(() => {
    const items: { label: string; amount: number }[] = [];

    // Start price
    items.push({ label: "Start price (System 2)", amount: 550 });

    // Base structure / UX always
    items.push({ label: "Base structure & UX", amount: 120 });

    // Website type impact
    const type = (intake.websiteType || "").toLowerCase();
    if (type.includes("ecommerce") || type.includes("e-commerce")) {
      items.push({ label: "E-commerce complexity", amount: 260 });
    } else if (type.includes("landing")) {
      items.push({ label: "Landing page focus", amount: 60 });
    }

    // Pages
    const pages = intake.pages;
    if (pages === "1-3") items.push({ label: "Small site scope (1–3)", amount: 0 });
    else if (pages === "4-5" || pages === "4-6") items.push({ label: "Pages (4–6)", amount: 180 });
    else if (pages === "6-8" || pages === "7-10") items.push({ label: "Pages (6–10)", amount: 320 });
    else if (pages === "9+" || pages === "10+") items.push({ label: "Pages (9+ / 10+)", amount: 520 });

    // Features
    if (intake.booking) items.push({ label: "Booking / scheduling", amount: 180 });
    if (intake.payments) items.push({ label: "Payments / checkout", amount: 280 });
    if (intake.blog) items.push({ label: "Blog / posts setup", amount: 140 });
    if (intake.membership) items.push({ label: "Membership / gated content", amount: 420 });

    // Automation
    const auto = (intake.wantsAutomation || "").toLowerCase();
    if (auto === "yes") items.push({ label: "Automations requested", amount: 220 });

    // Content readiness
    const cr = (intake.contentReady || "").toLowerCase();
    if (cr === "some") items.push({ label: "Partial content readiness", amount: 140 });
    if (cr === "not" || cr.includes("not")) items.push({ label: "Content not ready (structure + guidance)", amount: 260 });

    // Brand / domain guidance
    const hb = (intake.hasBrand || "").toLowerCase();
    if (hb === "no") items.push({ label: "No brand kit (basic brand direction)", amount: 220 });

    const dh = (intake.domainHosting || "").toLowerCase();
    if (dh === "no") items.push({ label: "Domain/hosting guidance", amount: 90 });

    // Timeline rush
    const tl = (intake.timeline || "").toLowerCase();
    if (tl.includes("rush") || tl.includes("under") || tl.includes("14")) {
      items.push({ label: "Rush timeline", amount: 250 });
    }

    const total = items.reduce((sum, i) => sum + i.amount, 0);

    // clamp to your system 2 public limits (soft)
    const min = 550;
    const max = 3500;
    const clamped = Math.max(min, Math.min(max, total));

    return {
      total: clamped,
      rangeLow: Math.round(clamped * 0.9),
      rangeHigh: Math.round(clamped * 1.15),
      items,
    };
  }, [intake]);

  const tiers = useMemo(() => {
    // Simple recommendation based on total
    const t = estimate.total;

    const rec =
      t <= 850 ? "Essential Launch" : t <= 1500 ? "Growth Build" : "Premium Platform";

    return {
      recommended: rec,
      list: [
        {
          name: "Essential Launch",
          price: "$550–$850",
          bullets: [
            "Up to ~5 sections/pages",
            "Clean layout + mobile responsive",
            "Contact form + basic SEO",
            "1 revision round (structured)",
          ],
        },
        {
          name: "Growth Build",
          price: "$900–$1,500",
          bullets: [
            "5–8 pages/sections + stronger UX",
            "Booking + lead capture improvements",
            "Better SEO structure + analytics",
            "2 revision rounds (structured)",
          ],
        },
        {
          name: "Premium Platform",
          price: "$1,700–$3,500+",
          bullets: [
            "Custom features + integrations",
            "Advanced UI + performance focus",
            "Payments/membership/automation options",
            "2–3 revision rounds (by scope)",
          ],
        },
      ],
    };
  }, [estimate.total]);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        Based on your selections (pages: <strong>{intake.pages}</strong>).
      </p>

      <div style={{ height: 22 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Price</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Typical range: ${estimate.rangeLow.toLocaleString()} – ${estimate.rangeHigh.toLocaleString()}
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: -0.8 }}>
              ${estimate.total.toLocaleString()}
            </div>

            <div className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Breakdown</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {estimate.items.map((it) => (
                    <div
                      key={it.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        color: "rgba(255,255,255,0.88)",
                      }}
                    >
                      <div>{it.label}</div>
                      <div style={{ fontWeight: 900 }}>
                        {it.amount === 0 ? "$0" : `+ $${it.amount}`}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.68)" }}>
                  Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
                </div>
              </div>
            </div>

            <div className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Contact</div>

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

                <div style={{ height: 14 }} />

                <div className="row">
                  <Link className="btn btnPrimary" href="/build">
                    Start a Build →
                  </Link>
                  <Link className="btn btnGhost" href="/">
                    Back home
                  </Link>
                </div>

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
                  Next: add Scope Snapshot preview
                </div>
              </div>
            </div>

            <div className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="cardInner">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 950 }}>Recommended tier</div>
                    <div style={{ color: "rgba(255,255,255,0.70)", marginTop: 6 }}>
                      Based on your scope: <strong>{tiers.recommended}</strong>
                    </div>
                  </div>
                  <Link className="btn btnPrimary" href="/estimate">
                    Refresh <span className="btnArrow">→</span>
                  </Link>
                </div>

                <div className="tierGrid" style={{ marginTop: 14 }}>
                  {tiers.list.map((t) => {
                    const hot = t.name === tiers.recommended;
                    return (
                      <div key={t.name} className="card cardHover">
                        <div className="cardInner">
                          <div className="tierHead">
                            <div>
                              <div className="tierName">{t.name}</div>
                              <div className="tierSub">{hot ? "Recommended" : "Tier option"}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div className="tierPrice">{t.price}</div>
                              <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
                                {hot ? "Best fit" : "Option"}
                              </div>
                            </div>
                          </div>

                          <ul className="tierList">
                            {t.bullets.map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: "pointer", color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>
                    Debug (what we parsed)
                  </summary>
                  <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
{JSON.stringify(
  {
    pages: intake.pages,
    booking: intake.booking,
    payments: intake.payments,
    blog: intake.blog,
    membership: intake.membership,
    wantsAutomation: intake.wantsAutomation,
    contentReady: intake.contentReady,
    hasBrand: intake.hasBrand,
    domainHosting: intake.domainHosting,
    timeline: intake.timeline,
    websiteType: intake.websiteType,
    intent: intake.intent,
  },
  null,
  2
)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}