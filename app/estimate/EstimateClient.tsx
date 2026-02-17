"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type IntakeLike = Record<string, any>;

type Normalized = {
  websiteType: "business" | "ecommerce" | "portfolio" | "landing";
  pages: "1" | "1-3" | "4-6" | "6-8" | "9+";
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: "yes" | "no";
  contentReady: "ready" | "some" | "not_ready";
  domainHosting: "yes" | "no";
  timeline: "2-3w" | "4+w" | "under14" | "2-4w";
  intent: string;
  integrations: string[];
  automationTypes: string[];
  integrationOther: string;
  notes: string;
  leadEmail: string;
  leadPhone: string;
};

type Props = {
  intake: IntakeLike;
  leadEmail?: string;
  leadPhone?: string;
};

const LS_KEY = "crecystudio:intake";

/**
 * Light integrations = simple embeds (do NOT break starter caps).
 * Heavy integrations = require setup/testing/custom work (DO break caps).
 */
const LIGHT_INTEGRATIONS = new Set([
  "Mailchimp / email list",
  "Analytics (GA4 / Pixel)",
  "Google Maps / location",
]);

const HEAVY_INTEGRATIONS = new Set([
  "Calendly / scheduling",
  "Stripe payments",
  "PayPal payments",
  "CRM integration",
  "Live chat",
]);

function toBool(v: any) {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function normalizePages(raw: any): Normalized["pages"] {
  const v = String(raw ?? "").trim();

  // Values from /build
  if (v === "1") return "1";
  if (v === "1-3") return "1-3";
  if (v === "4-5" || v === "4-6") return "4-6";
  if (v === "6-8") return "6-8";
  if (v === "9+") return "9+";

  // Older possible values
  if (v === "7-10" || v === "10+") return "9+";

  return "1-3";
}

function normalizeWebsiteType(raw: any): Normalized["websiteType"] {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v.includes("ecom")) return "ecommerce";
  if (v.includes("port")) return "portfolio";
  if (v.includes("land")) return "landing";
  return "business";
}

function normalizeYesNo(raw: any): "yes" | "no" {
  const v = String(raw ?? "").toLowerCase().trim();
  return v === "yes" || v === "true" || v === "1" ? "yes" : "no";
}

function normalizeContentReady(raw: any): Normalized["contentReady"] {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v === "ready") return "ready";
  if (v === "some") return "some";
  if (v === "not ready" || v === "not_ready" || v === "not") return "not_ready";
  return "some";
}

function normalizeTimeline(raw: any): Normalized["timeline"] {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v.includes("under")) return "under14";
  if (v.includes("4+")) return "4+w";
  if (v.includes("2-3")) return "2-3w";
  if (v.includes("2-4")) return "2-4w";
  return "2-4w";
}

function parseCsv(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ✅ Detect if the URL *actually* has query params that should override localStorage.
 * This prevents “default intake props” (pages=1-3) from overwriting the real saved choice (pages=1).
 */
function hasMeaningfulQuery(): boolean {
  if (typeof window === "undefined") return false;
  const qs = new URLSearchParams(window.location.search);
  if ([...qs.keys()].length === 0) return false;

  // If any of these keys exist, we treat the query as intentional.
  const meaningfulKeys = new Set([
    "pages",
    "websiteType",
    "booking",
    "payments",
    "blog",
    "membership",
    "wantsAutomation",
    "contentReady",
    "domainHosting",
    "timeline",
    "intent",
    "integrations",
    "automationTypes",
    "integrationOther",
    "leadEmail",
    "leadPhone",
    "notes",
  ]);

  for (const k of qs.keys()) {
    if (meaningfulKeys.has(k)) return true;
  }
  return false;
}

export default function EstimateClient({ intake, leadEmail = "", leadPhone = "" }: Props) {
  const [ls, setLs] = useState<any>(null);
  const [queryWins, setQueryWins] = useState(false);

  useEffect(() => {
    // localStorage
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setLs(JSON.parse(raw));
      else setLs(null);
    } catch {
      setLs(null);
    }

    // query detection
    setQueryWins(hasMeaningfulQuery());
  }, []);

  const source = useMemo(() => {
    // ✅ If URL has real query params: merge (LS as fallback, query props override)
    // ✅ If URL has no query params: trust localStorage (real user choices)
    if (queryWins) return { ...(ls ?? {}), ...(intake ?? {}) };
    return ls ?? intake ?? {};
  }, [queryWins, ls, intake]);

  const normalized: Normalized = useMemo(() => {
    return {
      websiteType: normalizeWebsiteType(source?.websiteType),
      pages: normalizePages(source?.pages),

      booking: toBool(source?.booking),
      payments: toBool(source?.payments),
      blog: toBool(source?.blog),
      membership: toBool(source?.membership),

      wantsAutomation: normalizeYesNo(source?.wantsAutomation),

      contentReady: normalizeContentReady(source?.contentReady),
      domainHosting: normalizeYesNo(source?.domainHosting),

      timeline: normalizeTimeline(source?.timeline),

      intent: String(source?.intent ?? "business"),
      integrations: parseCsv(source?.integrations),
      automationTypes: parseCsv(source?.automationTypes),
      integrationOther: String(source?.integrationOther ?? ""),

      notes: String(source?.notes ?? ""),
      leadEmail: String(leadEmail || source?.leadEmail || "").trim(),
      leadPhone: String(leadPhone || source?.leadPhone || "").trim(),
    };
  }, [source, leadEmail, leadPhone]);

  const pricing = useMemo(() => {
    const n = normalized;

    // ✅ Your vision: true base by pages (1 page NEVER becomes 400)
    const baseByPages: Record<Normalized["pages"], number> = {
      "1": 225,
      "1-3": 400,
      "4-6": 550,
      "6-8": 800,
      "9+": 1100,
    };

    const breakdown: { label: string; amt: number }[] = [];
    let total = baseByPages[n.pages];

    if (n.pages === "1") breakdown.push({ label: "One-page starter base", amt: baseByPages["1"] });
    else if (n.pages === "1-3") breakdown.push({ label: "Starter base (1–3 pages)", amt: baseByPages["1-3"] });
    else if (n.pages === "4-6") breakdown.push({ label: "Growth base (4–6 pages)", amt: baseByPages["4-6"] });
    else if (n.pages === "6-8") breakdown.push({ label: "Larger scope base (6–8 pages)", amt: baseByPages["6-8"] });
    else breakdown.push({ label: "Large scope base (9+ pages)", amt: baseByPages["9+"] });

    const add = (label: string, amt: number) => {
      if (amt === 0) return;
      breakdown.push({ label, amt });
      total += amt;
    };

    // Features
    if (n.booking) add("Booking / appointments", 150);
    if (n.payments) add("Payments / checkout", 250);
    if (n.blog) add("Blog / articles", 120);
    if (n.membership) add("Membership / gated content", 400);

    // Automations
    if (n.wantsAutomation === "yes") {
      add("Automations setup", 200);
      if (n.automationTypes.length) add(`Automation types (${n.automationTypes.length})`, n.automationTypes.length * 40);
    }

    // Integrations
    const integrations = n.integrations || [];
    const heavy = integrations.filter((x) => HEAVY_INTEGRATIONS.has(x));
    const light = integrations.filter((x) => LIGHT_INTEGRATIONS.has(x));
    const unknown = integrations.filter((x) => !HEAVY_INTEGRATIONS.has(x) && !LIGHT_INTEGRATIONS.has(x));

    if (light.length) breakdown.push({ label: `Light embeds included (${light.length})`, amt: 0 });
    if (unknown.length) breakdown.push({ label: `Integrations noted (${unknown.length})`, amt: 0 });

    // Heavy integrations are paid
    if (heavy.length) add(`Heavy integrations (${heavy.length})`, heavy.length * 60);
    if (n.integrationOther.trim()) add("Custom integration (other)", 60);

    // Readiness (soft)
    if (n.contentReady === "some") add("Partial content readiness", 60);
    if (n.contentReady === "not_ready") add("Content not ready (assist/setup)", 180);
    if (n.domainHosting === "no") add("Domain/hosting guidance", 60);

    // Rush
    if (n.timeline === "under14") add("Rush timeline (under 14 days)", 250);

    // Starter cap rules (same as before)
    const hasPaidAddons =
      n.booking ||
      n.payments ||
      n.blog ||
      n.membership ||
      n.wantsAutomation === "yes" ||
      heavy.length > 0 ||
      Boolean(n.integrationOther.trim());

    const qualifiesStarterCap =
      (n.pages === "1" || n.pages === "1-3") &&
      !hasPaidAddons &&
      n.contentReady === "ready" &&
      n.domainHosting === "yes" &&
      n.timeline !== "under14";

    if (qualifiesStarterCap) {
      // Cap keeps the correct base: 1 page stays 225, 1–3 stays 400
      total = baseByPages[n.pages];
      const baseLine = breakdown[0];
      breakdown.length = 0;
      breakdown.push(baseLine);
      breakdown.push({ label: "Starter cap applied (ready + domain/hosting handled + no paid add-ons)", amt: 0 });
    } else {
      breakdown.push({
        label: "Starter caps apply only when: no paid add-ons, content ready, and domain/hosting handled.",
        amt: 0,
      });
    }

    const rangeLow = Math.round(total * 0.9);
    const rangeHigh = Math.round(total * 1.15);

    // Tier recommendation
    let tier: "essential" | "growth" | "premium" = "essential";
    if (n.pages === "4-6" || n.pages === "6-8") tier = "growth";
    if (n.pages === "9+" || n.payments || n.membership || n.wantsAutomation === "yes") tier = "premium";
    if (total >= 1700) tier = "premium";

    return {
      total,
      rangeLow,
      rangeHigh,
      tier,
      breakdown,
      qualifiesStarterCap,
      hasPaidAddons,
    };
  }, [normalized]);

  const headline = `Based on your selections (type: ${normalized.websiteType}, pages: ${normalized.pages}).`;

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        One-page starter from <strong>$225</strong> (no paid add-ons).{" "}
        <strong>1–3 pages from $400</strong> (no paid add-ons).{" "}
        <strong>4–6 pages start at $550</strong> + add-ons. We’ll confirm final scope together before you pay a deposit.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Estimated total</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            {headline}
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: -0.6 }}>
              ${pricing.total.toLocaleString()}
            </div>
            <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>
              Typical range: ${pricing.rangeLow.toLocaleString()} – ${pricing.rangeHigh.toLocaleString()}
            </div>

            <div style={{ height: 10 }} />

            <div style={{ fontWeight: 950 }}>Breakdown</div>
            <div style={{ display: "grid", gap: 10 }}>
              {pricing.breakdown.map((b) => (
                <div key={b.label} className="checkRow" style={{ justifyContent: "space-between" }}>
                  <div className="checkLeft">
                    <div className="checkLabel">{b.label}</div>
                  </div>
                  <div style={{ fontWeight: 950, color: "rgba(255,255,255,0.85)" }}>
                    {b.amt === 0 ? "$0" : `+ $${b.amt.toLocaleString()}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="smallNote" style={{ marginTop: 10 }}>
              Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
              <br />
              <strong>Next: add Scope Snapshot preview</strong>
            </div>

            <div style={{ height: 14 }} />

            <div className="grid2">
              <div>
                <div className="fieldLabel">Email</div>
                <input className="input" value={normalized.leadEmail} readOnly placeholder="you@domain.com" />
              </div>

              <div>
                <div className="fieldLabel">Phone (optional)</div>
                <input className="input" value={normalized.leadPhone} readOnly placeholder="(555) 555-5555" />
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="row">
              <Link className="btn btnPrimary" href="/build">
                Get a Quote <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Recommended tier</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Best fit based on scope.
          </p>
        </div>

        <div className="panelBody">
          <div className="tierGrid">
            <TierCard
              name="Essential Launch"
              price="$225–$850"
              badge={pricing.tier === "essential" ? "Best fit" : "Tier"}
              hot={pricing.tier === "essential"}
              bullets={[
                "1 page starter available (no paid add-ons)",
                "1–3 pages for small businesses",
                "Mobile responsive + contact form",
                "1 revision round (structured)",
              ]}
            />

            <TierCard
              name="Growth Build"
              price="$550–$1,500"
              badge={pricing.tier === "growth" ? "Best fit" : "Tier"}
              hot={pricing.tier === "growth"}
              bullets={[
                "4–6 pages/sections + stronger UX",
                "Booking + lead capture improvements",
                "Better SEO structure + analytics",
                "2 revision rounds (structured)",
              ]}
            />

            <TierCard
              name="Premium Platform"
              price="$1,700–$3,500+"
              badge={pricing.tier === "premium" ? "Best fit" : "Tier"}
              hot={pricing.tier === "premium"}
              bullets={[
                "7+ pages or advanced features",
                "Payments/membership/automation options",
                "Integrations + custom workflows",
                "2–3 revision rounds (by scope)",
              ]}
            />
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Debug</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            This is exactly what we loaded from localStorage (if present) + what we normalized.
          </p>
        </div>
        <div className="panelBody">
          <pre
            className="textarea"
            style={{ whiteSpace: "pre-wrap", margin: 0, background: "rgba(10,12,18,0.55)" }}
          >
{JSON.stringify(
  {
    queryWins,
    loadedFromLocalStorage: ls,
    normalized,
    tier: pricing.tier,
    total: pricing.total,
    qualifiesStarterCap: pricing.qualifiesStarterCap,
    hasPaidAddons: pricing.hasPaidAddons,
  },
  null,
  2
)}
          </pre>
        </div>
      </section>
    </main>
  );
}

function TierCard({
  name,
  price,
  bullets,
  badge,
  hot,
}: {
  name: string;
  price: string;
  bullets: string[];
  badge: string;
  hot?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{name}</div>
            <div className="tierSub">{hot ? "Best fit based on scope." : "Tier"}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{price}</div>
            <div className={`badge ${hot ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
              {badge}
            </div>
          </div>
        </div>

        <ul className="tierList">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="tierCTA">
          <Link className="btn btnPrimary" href="/build">
            Get a Quote <span className="btnArrow">→</span>
          </Link>
          <Link className="btn btnGhost" href="/">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}