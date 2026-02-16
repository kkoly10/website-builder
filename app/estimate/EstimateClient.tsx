"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type FormState = {
  websiteType?: string;
  intent?: string;
  pages?: string;

  booking?: boolean;
  payments?: boolean;
  blog?: boolean;
  membership?: boolean;

  wantsAutomation?: string; // Yes/No or yes/no
  hasBrandGuide?: string;   // Yes/No
  contentReady?: string;    // Ready/Some/Not ready
  domainHosting?: string;   // (older) yes/no
  hasBrand?: string;        // (older) yes/no

  integrations?: string[];

  leadEmail?: string;
  leadPhone?: string;
  notes?: string;
};

function norm(v: any) {
  return String(v ?? "").trim();
}
function yn(v: any) {
  const x = norm(v).toLowerCase();
  return x === "yes" || x === "true" || x === "1" || x === "on";
}

function normalizeWebsiteType(v: any) {
  const x = norm(v).toLowerCase();
  if (x.includes("ecom")) return "ecommerce";
  if (x.includes("port")) return "portfolio";
  if (x.includes("land")) return "landing";
  return "business";
}

function normalizePages(v: any) {
  const x = norm(v);
  if (x === "1-3" || x === "1–3") return "1-3";
  if (x === "4-5" || x === "4–5") return "4-6";
  if (x === "4-6" || x === "4–6") return "4-6";
  if (x === "6-8" || x === "6–8") return "7-10";
  if (x === "7-10" || x === "7–10") return "7-10";
  if (x === "9+" || x === "9＋") return "10+";
  if (x === "10+") return "10+";
  return "1-3";
}

function normalizeContentReady(v: any) {
  const x = norm(v).toLowerCase();
  if (x.includes("not")) return "not";
  if (x.includes("ready")) return "ready";
  return "some";
}

function normalizeTimeline(v: any) {
  const x = norm(v).toLowerCase();
  if (x.includes("under") || x.includes("14") || x.includes("rush")) return "rush";
  if (x.includes("4")) return "4+w";
  return "2-4w";
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function EstimateClient() {
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("crecy_intake_v1");
      setForm(raw ? (JSON.parse(raw) as FormState) : {});
    } catch {
      setForm({});
    }
  }, []);

  const intake = useMemo(() => {
    const f = form || {};
    const websiteType = normalizeWebsiteType(f.websiteType);
    const pages = normalizePages(f.pages);

    // Unify brand fields (older/newer)
    const hasBrand =
      norm(f.hasBrand) || (yn(f.hasBrandGuide) ? "yes" : "no");

    // Unify hosting guidance
    const domainHosting = norm(f.domainHosting) || "no";

    return {
      websiteType,
      pages,
      booking: !!f.booking,
      payments: !!f.payments,
      blog: !!f.blog,
      membership: !!f.membership,
      wantsAutomation: yn(f.wantsAutomation) ? "yes" : "no",
      contentReady: normalizeContentReady(f.contentReady),
      hasBrand: yn(hasBrand) ? "yes" : "no",
      domainHosting: yn(domainHosting) ? "yes" : "no",
      timeline: normalizeTimeline((f as any).timeline),
      intent: norm(f.intent || "business") || "business",
      integrations: Array.isArray(f.integrations) ? f.integrations : [],
      leadEmail: norm(f.leadEmail),
      leadPhone: norm(f.leadPhone),
      notes: norm(f.notes),
    };
  }, [form]);

  const estimate = useMemo(() => {
    /**
     * ✅ NEW MODEL (No double counting)
     * System 2 base $550 already INCLUDES:
     * - Small site scope (1–3)
     * - Base structure & UX (for business)
     */
    let total = 550;

    const breakdown: { label: string; amount: number }[] = [
      { label: "Essential base (System 2: 1–3 pages + core UX)", amount: 550 },
    ];

    // Website type delta
    if (intake.websiteType === "ecommerce") {
      total += 250;
      breakdown.push({ label: "Ecommerce complexity", amount: 250 });
    } else if (intake.websiteType === "portfolio") {
      total += 80;
      breakdown.push({ label: "Portfolio layout", amount: 80 });
    } else if (intake.websiteType === "landing") {
      total -= 60;
      breakdown.push({ label: "Landing page focus discount", amount: -60 });
    } else {
      breakdown.push({ label: "Business site baseline", amount: 0 });
    }

    // Pages delta (only above 1–3)
    if (intake.pages === "4-6") {
      total += 220;
      breakdown.push({ label: "Medium scope (4–6)", amount: 220 });
    } else if (intake.pages === "7-10") {
      total += 520;
      breakdown.push({ label: "Large scope (7–10)", amount: 520 });
    } else if (intake.pages === "10+") {
      total += 920;
      breakdown.push({ label: "XL scope (10+)", amount: 920 });
    } else {
      breakdown.push({ label: "Small scope (1–3)", amount: 0 });
    }

    // Feature add-ons
    if (intake.booking) {
      total += 150;
      breakdown.push({ label: "Booking / scheduling", amount: 150 });
    }
    if (intake.payments) {
      total += 250;
      breakdown.push({ label: "Payments / checkout", amount: 250 });
    }
    if (intake.blog) {
      total += 120;
      breakdown.push({ label: "Blog / CMS setup", amount: 120 });
    }
    if (intake.membership) {
      total += 400;
      breakdown.push({ label: "Membership / gated content", amount: 400 });
    }

    if (intake.wantsAutomation === "yes") {
      total += 200;
      breakdown.push({ label: "Automations", amount: 200 });
    }

    // Readiness / Brand / Hosting guidance
    if (intake.contentReady === "not") {
      total += 240;
      breakdown.push({ label: "Content not ready (assist)", amount: 240 });
    } else if (intake.contentReady === "some") {
      total += 100;
      breakdown.push({ label: "Partial content readiness", amount: 100 });
    } else {
      breakdown.push({ label: "Content ready", amount: 0 });
    }

    if (intake.hasBrand === "no") {
      total += 150;
      breakdown.push({ label: "No brand kit (basic direction)", amount: 150 });
    } else {
      breakdown.push({ label: "Brand kit provided", amount: 0 });
    }

    if (intake.domainHosting === "no") {
      total += 90;
      breakdown.push({ label: "Domain/hosting guidance", amount: 90 });
    } else {
      breakdown.push({ label: "Domain/hosting handled", amount: 0 });
    }

    if (intake.timeline === "rush") {
      total += 250;
      breakdown.push({ label: "Rush timeline", amount: 250 });
    }

    // Guardrails
    total = Math.max(450, Math.round(total));

    const rangeLow = Math.round(total * 0.9);
    const rangeHigh = Math.round(total * 1.15);

    // Tier recommendation aligned to public ranges
    let tier: "essential" | "growth" | "premium" = "essential";
    if (total >= 1700 || intake.pages === "10+" || intake.membership) tier = "premium";
    else if (total >= 900 || intake.pages === "7-10" || intake.payments || intake.booking) tier = "growth";

    return { total, rangeLow, rangeHigh, breakdown, tier };
  }, [intake]);

  const loaded = form !== null;

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        Based on your selections (type: <strong>{intake.websiteType}</strong>, pages:{" "}
        <strong>{intake.pages}</strong>).
      </p>

      <div style={{ height: 22 }} />

      {!loaded ? (
        <section className="panel">
          <div className="panelBody">
            <div style={{ color: "rgba(255,255,255,0.75)" }}>Loading your intake…</div>
          </div>
        </section>
      ) : (
        <>
          <section className="panel">
            <div className="panelHeader">
              <h2 className="h2">Estimated total</h2>
              <p className="pDark" style={{ marginTop: 8 }}>
                Typical range: {money(estimate.rangeLow)} – {money(estimate.rangeHigh)}
              </p>
            </div>

            <div className="panelBody">
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: -0.6 }}>
                  {money(estimate.total)}
                </div>

                <div style={{ height: 6 }} />

                <div style={{ fontWeight: 950 }}>Breakdown</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {estimate.breakdown.map((b) => (
                    <div
                      key={b.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <div style={{ color: "rgba(255,255,255,0.86)", fontWeight: 700 }}>
                        {b.label}
                      </div>

                      <div style={{ color: "rgba(255,255,255,0.90)", fontWeight: 950 }}>
                        {b.amount === 0
                          ? "$0"
                          : b.amount > 0
                          ? `+ ${money(b.amount)}`
                          : `− ${money(Math.abs(b.amount))}`}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ height: 12 }} />

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
                  Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%)
                  without changing public tier pricing.
                </div>

                <div style={{ height: 12 }} />

                <div className="row">
                  <Link className="btn btnPrimary" href="/build">
                    Back to questionnaire →
                  </Link>
                  <Link className="btn btnGhost" href="/">
                    Back home
                  </Link>
                </div>

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 6 }}>
                  Next: add Scope Snapshot preview
                </div>
              </div>
            </div>
          </section>

          <div style={{ height: 18 }} />

          <section className="panel">
            <div className="panelHeader">
              <h2 className="h2">Recommended tier</h2>
              <p className="pDark" style={{ marginTop: 8 }}>Best fit based on scope.</p>
            </div>
            <div className="panelBody">
              <div className="tierGrid">
                <TierCard
                  name="Essential Launch"
                  price="$550–$850"
                  badge="Best for simple launches"
                  bestFit={estimate.tier === "essential"}
                />
                <TierCard
                  name="Growth Build"
                  price="$900–$1,500"
                  badge="Most chosen"
                  bestFit={estimate.tier === "growth"}
                />
                <TierCard
                  name="Premium Platform"
                  price="$1,700–$3,500+"
                  badge="Best for scale"
                  bestFit={estimate.tier === "premium"}
                />
              </div>
            </div>
          </section>

          <div style={{ height: 18 }} />

          <section className="panel">
            <div className="panelHeader">
              <h2 className="h2">Debug</h2>
              <p className="pDark" style={{ marginTop: 8 }}>
                This is exactly what we loaded from localStorage.
              </p>
            </div>
            <div className="panelBody">
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.35)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
{JSON.stringify(
  {
    loadedFromLocalStorage: form,
    normalized: intake,
    tier: estimate.tier,
    total: estimate.total,
  },
  null,
  2
)}
              </pre>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function TierCard({
  name,
  price,
  badge,
  bestFit,
}: {
  name: string;
  price: string;
  badge: string;
  bestFit?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{name}</div>
            <div className="tierSub">{badge}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{price}</div>
            <div className={`badge ${bestFit ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
              {bestFit ? "Best fit" : "Tier"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}