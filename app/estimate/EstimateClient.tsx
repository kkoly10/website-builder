"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

type Intake = {
  mode: string;
  intent: string;
  intentOther: string;

  websiteType: string; // business | ecommerce | portfolio | landing (normalized)
  pages: string; // 1-3 | 4-6 | 7-10 | 10+

  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;

  wantsAutomation: string; // yes/no
  hasBrand: string; // yes/no
  contentReady: string; // ready/some/not
  domainHosting: string; // yes/no
  timeline: string; // 2-4w / rush / etc

  budget: string;
  competitorUrl: string;
  notes: string;

  integrations?: string[];
  leadEmail?: string;
  leadPhone?: string;
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

function normYN(v: string) {
  const s = (v || "").toLowerCase().trim();
  if (s === "yes" || s === "true" || s === "1" || s === "y") return "yes";
  return "no";
}

function normContentReady(v: string) {
  const s = (v || "").toLowerCase();
  if (s.includes("ready")) return "ready";
  if (s.includes("not")) return "not";
  return "some";
}

function normWebsiteType(v: string) {
  const s = (v || "").toLowerCase().trim();
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("portfolio")) return "portfolio";
  if (s.includes("landing")) return "landing";
  return "business";
}

function normPages(v: string) {
  const s = (v || "").toLowerCase().trim();
  if (s.includes("10+")) return "10+";
  if (s.includes("9+")) return "10+";
  if (s.includes("7-10")) return "7-10";
  if (s.includes("6-8")) return "7-10"; // map build-page variant
  if (s.includes("4-6") || s.includes("4-5")) return "4-6";
  return "1-3";
}

/**
 * Your build page writes a big JSON object to localStorage (we’ll try to find it safely).
 * We DO NOT rely solely on it — query params + legacy props still work.
 */
function tryLoadBuildFormFromLocalStorage(): any | null {
  if (typeof window === "undefined") return null;

  const candidates = [
    "crecystudio:intake",
    "crecystudio_intake",
    "crecy:intake",
    "crecy_intake",
    "build:intake",
    "buildForm",
    "websiteBuilder:intake",
    "intake",
  ];

  // 1) direct known keys
  for (const k of candidates) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && (parsed.pages || parsed.websiteType)) return parsed;
    } catch {}
  }

  // 2) scan all keys (last resort)
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      if (raw.length < 40) continue;
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.pages || parsed.websiteType) &&
          (parsed.booking !== undefined || parsed.payments !== undefined)
        ) {
          return parsed;
        }
      } catch {}
    }
  } catch {}

  return null;
}

export default function EstimateClient(props: Props) {
  const [loadedLS, setLoadedLS] = useState<any | null>(null);

  useEffect(() => {
    // only for debug + “it’s not updating” prevention
    setLoadedLS(tryLoadBuildFormFromLocalStorage());
  }, []);

  const intake: Intake = useMemo(() => {
    // 1) legacy props from estimate/page.tsx
    if (props.intake) return props.intake;

    // 2) query params
    const sp = props.searchParams || {};
    const qp: Intake = {
      mode: pick(sp, "mode") || "estimate",
      intent: pick(sp, "intent") || "business",
      intentOther: pick(sp, "intentOther") || "",

      websiteType: normWebsiteType(pick(sp, "websiteType") || "business"),
      pages: normPages(pick(sp, "pages") || "1-3"),

      booking: asBool(pick(sp, "booking")),
      payments: asBool(pick(sp, "payments")),
      blog: asBool(pick(sp, "blog")),
      membership: asBool(pick(sp, "membership")),

      wantsAutomation: normYN(pick(sp, "wantsAutomation") || "no"),
      hasBrand: normYN(pick(sp, "hasBrand") || "no"),
      contentReady: normContentReady(pick(sp, "contentReady") || "some"),
      domainHosting: normYN(pick(sp, "domainHosting") || "no"),
      timeline: (pick(sp, "timeline") || "2-4w").toLowerCase(),

      budget: pick(sp, "budget") || "500-1000",
      competitorUrl: pick(sp, "competitorUrl") || "",
      notes: pick(sp, "notes") || "",

      integrations: (pick(sp, "integrations") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),

      leadEmail: pick(sp, "leadEmail") || "",
      leadPhone: pick(sp, "leadPhone") || "",
    };

    return qp;
  }, [props.intake, props.searchParams]);

  const [email, setEmail] = useState(
    props.leadEmail || intake.leadEmail || pick(props.searchParams || {}, "leadEmail") || ""
  );
  const [phone, setPhone] = useState(
    props.leadPhone || intake.leadPhone || pick(props.searchParams || {}, "leadPhone") || ""
  );

  /**
   * Normalize from either:
   * - props.intake / query params
   * - OR localStorage build form (if present)
   *
   * IMPORTANT: localStorage is only used to prevent “stuck values” when build form is the source.
   * Query params still win if present.
   */
  const normalized = useMemo(() => {
    const sp = props.searchParams || {};
    const hasUsefulQP =
      !!pick(sp, "websiteType") ||
      !!pick(sp, "pages") ||
      !!pick(sp, "booking") ||
      !!pick(sp, "payments") ||
      !!pick(sp, "membership");

    const src = hasUsefulQP ? null : loadedLS;

    // Build-form fields look like: "Business", "4-5", "No", etc.
    const fromLS: Partial<Intake> = src
      ? {
          mode: String(src.mode || "guided"),
          websiteType: normWebsiteType(String(src.websiteType || "Business")),
          pages: normPages(String(src.pages || "1-3")),
          booking: !!src.booking,
          payments: !!src.payments,
          blog: !!src.blog,
          membership: !!src.membership,
          wantsAutomation: normYN(String(src.wantsAutomation || "No")),
          contentReady: normContentReady(String(src.contentReady || "Some")),
          hasBrand: normYN(String(src.hasBrandGuide || src.hasBrand || "No")),
          domainHosting: normYN(String(src.domainHosting || "No")),
          timeline: String(src.timeline || "2-4w").toLowerCase(),
          intent: String(src.intent || "business"),
          leadEmail: String(src.leadEmail || ""),
          leadPhone: String(src.leadPhone || ""),
          notes: String(src.notes || ""),
          integrations: Array.isArray(src.integrations) ? src.integrations : [],
        }
      : {};

    const base = intake;

    return {
      websiteType: normWebsiteType(fromLS.websiteType || base.websiteType),
      pages: normPages(fromLS.pages || base.pages),

      booking: typeof fromLS.booking === "boolean" ? fromLS.booking : base.booking,
      payments: typeof fromLS.payments === "boolean" ? fromLS.payments : base.payments,
      blog: typeof fromLS.blog === "boolean" ? fromLS.blog : base.blog,
      membership: typeof fromLS.membership === "boolean" ? fromLS.membership : base.membership,

      wantsAutomation: normYN(fromLS.wantsAutomation || base.wantsAutomation),
      contentReady: normContentReady(fromLS.contentReady || base.contentReady),
      hasBrand: normYN(fromLS.hasBrand || base.hasBrand),
      domainHosting: normYN(fromLS.domainHosting || base.domainHosting),
      timeline: (fromLS.timeline || base.timeline || "2-4w").toLowerCase(),

      intent: String(fromLS.intent || base.intent || "business"),
      leadEmail: String(fromLS.leadEmail || email || ""),
      leadPhone: String(fromLS.leadPhone || phone || ""),
      notes: String(fromLS.notes || base.notes || ""),
      integrations: (fromLS.integrations || base.integrations || []).filter(Boolean),
    };
  }, [intake, loadedLS, props.searchParams, email, phone]);

  const calc = useMemo(() => {
    // OPTION B positioning:
    // Starts at $550, but readiness commonly pushes typical to $800–$1,200.
    const rows: { label: string; delta: number }[] = [];
    let total = 0;

    // Base (System 2 essential baseline)
    rows.push({ label: "Essential base (System 2: 1–3 pages + core UX)", delta: 550 });
    total += 550;

    // Website type baseline
    if (normalized.websiteType === "ecommerce") {
      rows.push({ label: "E-commerce baseline (products/cart/checkout complexity)", delta: 220 });
      total += 220;
    } else if (normalized.websiteType === "portfolio") {
      rows.push({ label: "Portfolio layout baseline", delta: 60 });
      total += 60;
    } else if (normalized.websiteType === "landing") {
      rows.push({ label: "Landing page focus", delta: 60 });
      total += 60;
    } else {
      rows.push({ label: "Business site baseline", delta: 0 });
    }

    // Scope (pages)
    const p = normalized.pages;
    if (p === "4-6") {
      rows.push({ label: "Medium scope (4–6)", delta: 220 });
      total += 220;
    } else if (p === "7-10") {
      rows.push({ label: "Large scope (7–10)", delta: 520 });
      total += 520;
    } else if (p === "10+") {
      rows.push({ label: "Extra-large scope (10+)", delta: 900 });
      total += 900;
    } else {
      rows.push({ label: "Small scope (1–3)", delta: 0 });
    }

    // Features
    if (normalized.booking) {
      rows.push({ label: "Booking / appointments", delta: 150 });
      total += 150;
    }
    if (normalized.payments) {
      rows.push({ label: "Payments / checkout", delta: 250 });
      total += 250;
    }
    if (normalized.blog) {
      rows.push({ label: "Blog / articles", delta: 120 });
      total += 120;
    }
    if (normalized.membership) {
      rows.push({ label: "Membership / gated content", delta: 400 });
      total += 400;
    }

    // Automation
    if (normalized.wantsAutomation === "yes") {
      rows.push({ label: "Automations (email/SMS/CRM routing)", delta: 200 });
      total += 200;
    }

    // Readiness
    if (normalized.contentReady === "not") {
      rows.push({ label: "Content not ready (content assist / structure)", delta: 250 });
      total += 250;
    } else if (normalized.contentReady === "some") {
      rows.push({ label: "Partial content readiness", delta: 100 });
      total += 100;
    } else {
      rows.push({ label: "Content ready", delta: 0 });
    }

    if (normalized.hasBrand === "no") {
      rows.push({ label: "No brand kit (basic direction)", delta: 150 });
      total += 150;
    } else {
      rows.push({ label: "Brand kit ready", delta: 0 });
    }

    if (normalized.domainHosting === "no") {
      rows.push({ label: "Domain/hosting guidance", delta: 90 });
      total += 90;
    } else {
      rows.push({ label: "Domain/hosting ready", delta: 0 });
    }

    // Timeline (rush)
    const tl = normalized.timeline;
    const isRush = tl.includes("rush") || tl.includes("under 14") || tl.includes("1-2") || tl.includes("14");
    if (isRush) {
      rows.push({ label: "Rush timeline", delta: 250 });
      total += 250;
    }

    // Clamp safety (optional)
    const min = 550;
    const max = 3500;
    total = Math.max(min, Math.min(max, total));

    // Tier logic (FIXED)
    let tier: "essential" | "growth" | "premium" = "essential";

    /**
     * Align to System 2:
     * Essential: $550–$850
     * Growth:    $900–$1,500
     * Premium:   $1,700+
     *
     * Fix: membership should push to Growth, NOT auto Premium.
     */
    if (total >= 1700 || normalized.pages === "10+") {
      tier = "premium";
    } else if (
      total >= 900 ||
      normalized.pages === "7-10" ||
      normalized.payments ||
      normalized.booking ||
      normalized.membership
    ) {
      tier = "growth";
    } else {
      tier = "essential";
    }

    const rangeLow = Math.round(total * 0.9);
    const rangeHigh = Math.round(total * 1.15);

    return { rows, total, rangeLow, rangeHigh, tier };
  }, [normalized]);

  const tierCards = [
    {
      key: "essential" as const,
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
      key: "growth" as const,
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
      key: "premium" as const,
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
  ];

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 820, marginTop: 10 }}>
        Starts at <strong>$550</strong>. Most projects land <strong>$800–$1,200</strong> depending on readiness
        (content, brand direction, and domain/hosting help). We’ll confirm final scope together before you pay a deposit.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Estimated total</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Based on your selections (type: {normalized.websiteType}, pages: {normalized.pages}).
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: -0.8 }}>
              ${calc.total.toLocaleString()}
            </div>

            <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 800 }}>
              Typical range: ${calc.rangeLow.toLocaleString()} – ${calc.rangeHigh.toLocaleString()}
            </div>

            <div style={{ height: 8 }} />

            <div className="card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Breakdown</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {calc.rows.map((r) => (
                    <div
                      key={r.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 14,
                        color: "rgba(255,255,255,0.86)",
                        fontWeight: 750,
                      }}
                    >
                      <span style={{ maxWidth: 520 }}>{r.label}</span>
                      <span style={{ whiteSpace: "nowrap", color: "rgba(255,200,150,0.95)" }}>
                        {r.delta === 0 ? "$0" : `+ $${r.delta}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.6 }}>
                  Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing
                  public tier pricing.
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
                  Next: add Scope Snapshot preview
                </div>
              </div>
            </div>

            <div style={{ height: 6 }} />

            <div style={{ display: "grid", gap: 10 }}>
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

      <section className="section">
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="kicker">Recommended tier</div>
            <h2 className="h2" style={{ marginTop: 10 }}>
              Best fit based on scope.
            </h2>
          </div>
        </div>

        <div className="tierGrid" style={{ marginTop: 14 }}>
          {tierCards.map((t) => {
            const best = t.key === calc.tier;
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
                      <div className={`badge ${best ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
                        {best ? "Best fit" : "Tier"}
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
                      Get a Quote <span className="btnArrow">→</span>
                    </Link>
                    <Link className="btn btnGhost" href="/">
                      Back home
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="section">
        <div className="card" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}>
          <div className="cardInner">
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Debug</div>
            <div style={{ color: "rgba(255,255,255,0.72)", marginBottom: 10 }}>
              This is exactly what we loaded from localStorage (if present) + what we normalized.
            </div>
            <pre
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 14,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.10)",
                overflowX: "auto",
                color: "rgba(255,255,255,0.90)",
                fontSize: 12,
                lineHeight: 1.55,
              }}
            >
{JSON.stringify(
  {
    loadedFromLocalStorage: loadedLS,
    normalized,
    tier: calc.tier,
    total: calc.total,
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}