"use client";

import { useEffect, useMemo, useState } from "react";
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

const STORAGE_KEY = "crecy_intake_v1";

/* ---------------- helpers ---------------- */

function pick(params: SearchParams, key: string) {
  const v = params?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function asBoolLoose(v: any) {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function normalizeWebsiteType(v: string) {
  const s = (v || "").toLowerCase().trim();
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("port")) return "portfolio";
  if (s.includes("land")) return "landing";
  return "business";
}

function normalizePages(v: string) {
  const s = (v || "").toLowerCase().trim();
  // Accept many formats: 4-5, 4-6, 6-8, 7-10, 9+, 10+, etc.
  if (s === "1-3" || s.includes("1") || s.includes("3")) return "1-3";
  if (s === "4-5" || s === "4-6" || s.includes("4") || s.includes("5") || s.includes("6")) return "4-6";
  if (s === "6-8" || s === "7-10" || s.includes("7") || s.includes("8") || s.includes("9")) return "7-10";
  return "10+";
}

function normalizeContentReady(v: string) {
  const s = (v || "").toLowerCase().trim();
  if (s.includes("ready")) return "ready";
  if (s.includes("some")) return "some";
  if (s === "no" || s.includes("not")) return "no";
  return "some";
}

function normalizeYesNo(v: string) {
  const s = (v || "").toLowerCase().trim();
  return s === "yes" || s === "true" || s === "1" || s === "on" ? "yes" : "no";
}

function normalizeTimeline(v: string) {
  const s = (v || "").toLowerCase().trim();
  // Accept: "2-3 weeks", "4+ weeks", "2-4w", "rush", "under 14 days"
  if (s.includes("rush") || s.includes("under") || s.includes("14")) return "rush";
  return "2-4w";
}

function safeParseJSON(s: string | null) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

type Normalized = {
  websiteType: "business" | "ecommerce" | "portfolio" | "landing";
  pages: "1-3" | "4-6" | "7-10" | "10+";
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: "yes" | "no";
  contentReady: "ready" | "some" | "no";
  hasBrand: "yes" | "no";
  domainHosting: "yes" | "no";
  timeline: "2-4w" | "rush";
  intent: string;
  integrations: string[];
  leadEmail: string;
  leadPhone: string;
  notes: string;
};

function normalizeFromQuery(sp: SearchParams): Normalized {
  const integrationsRaw = pick(sp, "integrations") || "";
  return {
    websiteType: normalizeWebsiteType(pick(sp, "websiteType")) as Normalized["websiteType"],
    pages: normalizePages(pick(sp, "pages")) as Normalized["pages"],

    booking: asBoolLoose(pick(sp, "booking")),
    payments: asBoolLoose(pick(sp, "payments")),
    blog: asBoolLoose(pick(sp, "blog")),
    membership: asBoolLoose(pick(sp, "membership")),

    wantsAutomation: (normalizeYesNo(pick(sp, "wantsAutomation")) as any) || "no",

    contentReady: normalizeContentReady(pick(sp, "contentReady")) as Normalized["contentReady"],
    hasBrand: (normalizeYesNo(pick(sp, "hasBrand")) as any) || "no",
    domainHosting: (normalizeYesNo(pick(sp, "domainHosting")) as any) || "no",

    timeline: normalizeTimeline(pick(sp, "timeline")) as Normalized["timeline"],

    intent: pick(sp, "intent") || "business",
    integrations: integrationsRaw
      ? integrationsRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : [],
    leadEmail: pick(sp, "leadEmail") || "",
    leadPhone: pick(sp, "leadPhone") || "",
    notes: pick(sp, "notes") || "",
  };
}

function normalizeFromLegacyIntake(intake: Intake, leadEmail: string, leadPhone: string): Normalized {
  return {
    websiteType: normalizeWebsiteType(intake.websiteType) as Normalized["websiteType"],
    pages: normalizePages(intake.pages) as Normalized["pages"],

    booking: !!intake.booking,
    payments: !!intake.payments,
    blog: !!intake.blog,
    membership: !!intake.membership,

    wantsAutomation: normalizeYesNo(intake.wantsAutomation) as any,

    contentReady: normalizeContentReady(intake.contentReady) as any,
    hasBrand: normalizeYesNo(intake.hasBrand) as any,
    domainHosting: normalizeYesNo(intake.domainHosting) as any,

    timeline: normalizeTimeline(intake.timeline) as any,

    intent: intake.intent || "business",
    integrations: [],
    leadEmail: leadEmail || "",
    leadPhone: leadPhone || "",
    notes: intake.notes || "",
  };
}

function normalizeFromLocalStorage(raw: any): Normalized {
  // This is the Build form shape you pasted earlier
  const integrations = Array.isArray(raw?.integrations) ? raw.integrations : [];
  const hasBrandGuide = String(raw?.hasBrandGuide ?? "No");
  const domainHosting = String(raw?.domainHosting ?? "No");
  const wantsAutomation = String(raw?.wantsAutomation ?? "No");
  const contentReady = String(raw?.contentReady ?? "Some");

  return {
    websiteType: normalizeWebsiteType(String(raw?.websiteType ?? "Business")) as any,
    pages: normalizePages(String(raw?.pages ?? "1-3")) as any,

    booking: !!raw?.booking,
    payments: !!raw?.payments,
    blog: !!raw?.blog,
    membership: !!raw?.membership,

    wantsAutomation: wantsAutomation.toLowerCase().includes("yes") ? "yes" : "no",

    contentReady: normalizeContentReady(contentReady) as any,
    hasBrand: hasBrandGuide.toLowerCase().includes("yes") ? "yes" : "no",
    domainHosting: domainHosting.toLowerCase().includes("yes") ? "yes" : "no",

    timeline: normalizeTimeline(String(raw?.timeline ?? "2-3 weeks")) as any,

    intent: String(raw?.intent ?? "business"),
    integrations,
    leadEmail: String(raw?.leadEmail ?? ""),
    leadPhone: String(raw?.leadPhone ?? ""),
    notes: String(raw?.notes ?? ""),
  };
}

/* ---------------- pricing (Option B + better conversion) ---------------- */

type Line = { label: string; amount: number; kind?: "base" | "add" | "neutral" };

function calcEstimate(n: Normalized) {
  const lines: Line[] = [];

  // ✅ Base (display without "+")
  const base = 550;
  lines.push({ label: "Essential base (System 2: 1–3 pages + core UX)", amount: base, kind: "base" });

  let total = base;

  // Website type adjustments (small, not punitive)
  if (n.websiteType === "ecommerce") {
    lines.push({ label: "E-commerce baseline", amount: 180, kind: "add" });
    total += 180;
  } else if (n.websiteType === "landing") {
    lines.push({ label: "Landing page focus", amount: -60, kind: "neutral" });
    total -= 60;
  } else if (n.websiteType === "portfolio") {
    lines.push({ label: "Portfolio baseline", amount: 60, kind: "add" });
    total += 60;
  } else {
    lines.push({ label: "Business site baseline", amount: 0, kind: "neutral" });
  }

  // Scope by pages
  if (n.pages === "1-3") {
    lines.push({ label: "Small scope (1–3)", amount: 0, kind: "neutral" });
  } else if (n.pages === "4-6") {
    lines.push({ label: "Medium scope (4–6)", amount: 220, kind: "add" });
    total += 220;
  } else if (n.pages === "7-10") {
    lines.push({ label: "Large scope (7–10)", amount: 550, kind: "add" });
    total += 550;
  } else {
    lines.push({ label: "Extended scope (10+)", amount: 950, kind: "add" });
    total += 950;
  }

  // Features
  if (n.booking) {
    lines.push({ label: "Booking / appointments", amount: 150, kind: "add" });
    total += 150;
  }
  if (n.payments) {
    lines.push({ label: "Payments / checkout", amount: 250, kind: "add" });
    total += 250;
  }
  if (n.blog) {
    lines.push({ label: "Blog / articles", amount: 120, kind: "add" });
    total += 120;
  }
  if (n.membership) {
    lines.push({ label: "Membership / gated content", amount: 400, kind: "add" });
    total += 400;
  }
  if (n.wantsAutomation === "yes") {
    lines.push({ label: "Automations (basic)", amount: 200, kind: "add" });
    total += 200;
  }

  // ✅ Readiness (soft add-ons so Essential doesn't explode)
  if (n.contentReady === "some") {
    lines.push({ label: "Partial content readiness", amount: 60, kind: "add" });
    total += 60;
  } else if (n.contentReady === "no") {
    lines.push({ label: "Content not ready (content help)", amount: 160, kind: "add" });
    total += 160;
  } else {
    lines.push({ label: "Content ready", amount: 0, kind: "neutral" });
  }

  if (n.hasBrand === "no") {
    lines.push({ label: "No brand kit (basic direction)", amount: 80, kind: "add" });
    total += 80;
  } else {
    lines.push({ label: "Brand kit provided", amount: 0, kind: "neutral" });
  }

  if (n.domainHosting === "yes") {
    lines.push({ label: "Domain/hosting guidance", amount: 50, kind: "add" });
    total += 50;
  } else {
    lines.push({ label: "Domain/hosting handled by client", amount: 0, kind: "neutral" });
  }

  // Timeline
  if (n.timeline === "rush") {
    lines.push({ label: "Rush timeline", amount: 250, kind: "add" });
    total += 250;
  }

  // Clamp
  const min = 550;
  const max = 3500;
  total = Math.max(min, Math.min(max, total));

  // Range
  const rangeLow = Math.round(total * 0.9);
  const rangeHigh = Math.round(total * 1.15);

  // Tier pick (scope + complexity)
  const complexity = (n.booking ? 1 : 0) + (n.payments ? 2 : 0) + (n.membership ? 2 : 0) + (n.wantsAutomation === "yes" ? 1 : 0);
  let tier: "essential" | "growth" | "premium" = "essential";

  if (n.pages === "10+" || n.pages === "7-10") tier = "premium";
  else if (n.pages === "4-6" && (complexity >= 2 || total >= 1200)) tier = "growth";
  else if (complexity >= 3 || total >= 1500) tier = "premium";
  else if (total >= 900) tier = "growth";
  else tier = "essential";

  return { total, rangeLow, rangeHigh, tier, lines };
}

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

/* ---------------- component ---------------- */

export default function EstimateClient(props: Props) {
  const [lsRaw, setLsRaw] = useState<any>(null);

  useEffect(() => {
    const raw = safeParseJSON(localStorage.getItem(STORAGE_KEY));
    setLsRaw(raw);
  }, []);

  // Decide source priority:
  // 1) Query params if they contain real values
  // 2) Legacy props.intake
  // 3) localStorage
  const normalized: Normalized = useMemo(() => {
    const sp = props.searchParams || {};
    const hasQuerySignal = !!(pick(sp, "pages") || pick(sp, "websiteType") || pick(sp, "booking") || pick(sp, "leadEmail"));

    if (hasQuerySignal) return normalizeFromQuery(sp);

    if (props.intake) {
      return normalizeFromLegacyIntake(
        props.intake,
        props.leadEmail || "",
        props.leadPhone || ""
      );
    }

    if (lsRaw) return normalizeFromLocalStorage(lsRaw);

    // hard fallback
    return {
      websiteType: "business",
      pages: "1-3",
      booking: false,
      payments: false,
      blog: false,
      membership: false,
      wantsAutomation: "no",
      contentReady: "some",
      hasBrand: "no",
      domainHosting: "no",
      timeline: "2-4w",
      intent: "business",
      integrations: [],
      leadEmail: "",
      leadPhone: "",
      notes: "",
    };
  }, [props.searchParams, props.intake, props.leadEmail, props.leadPhone, lsRaw]);

  const [email, setEmail] = useState(props.leadEmail || pick(props.searchParams || {}, "leadEmail") || "");
  const [phone, setPhone] = useState(props.leadPhone || pick(props.searchParams || {}, "leadPhone") || "");

  // keep local inputs in sync when normalized changes
  useEffect(() => {
    if (!email && normalized.leadEmail) setEmail(normalized.leadEmail);
    if (!phone && normalized.leadPhone) setPhone(normalized.leadPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized.leadEmail, normalized.leadPhone]);

  const estimate = useMemo(() => calcEstimate(normalized), [normalized]);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>

      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        Starts at <strong>$550</strong>. Most projects land <strong>$800–$1,200</strong> depending on readiness (content, brand direction,
        and domain/hosting help). We’ll confirm final scope together before you pay a deposit.
      </p>

      <div style={{ height: 22 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Estimated total</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Based on your selections (type: <strong>{normalized.websiteType}</strong>, pages: <strong>{normalized.pages}</strong>).
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "baseline" }}>
              <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: -0.8 }}>
                {money(estimate.total)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 850 }}>
                Typical range: {money(estimate.rangeLow)} – {money(estimate.rangeHigh)}
              </div>
            </div>

            <div style={{ height: 8 }} />

            <div className="card" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="cardInner">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Breakdown</div>

                <div style={{ display: "grid", gap: 10 }}>
                  {estimate.lines.map((l) => (
                    <div
                      key={l.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(0,0,0,0.18)",
                      }}
                    >
                      <div style={{ color: "rgba(255,255,255,0.82)", fontWeight: 850 }}>
                        {l.label}
                      </div>

                      <div
                        style={{
                          fontWeight: 950,
                          color:
                            l.kind === "base"
                              ? "rgba(255,255,255,0.95)"
                              : l.amount > 0
                              ? "rgba(255,220,200,0.95)"
                              : "rgba(255,255,255,0.65)",
                          minWidth: 96,
                          textAlign: "right",
                        }}
                      >
                        {l.kind === "base" ? money(l.amount) : l.amount === 0 ? money(0) : `+ ${money(l.amount)}`}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.5 }}>
                  Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>
                  Next: add Scope Snapshot preview
                </div>
              </div>
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
                Get a Quote <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 16 }} />

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
              price="$550–$850"
              badge="Best for simple launches"
              best={estimate.tier === "essential"}
              bullets={[
                "Up to ~5 sections / pages",
                "Clean layout + mobile responsive",
                "Contact form + basic SEO",
                "1 revision round (structured)",
              ]}
            />
            <TierCard
              name="Growth Build"
              price="$900–$1,500"
              badge="Most chosen"
              best={estimate.tier === "growth"}
              bullets={[
                "5–8 pages/sections + stronger UX",
                "Booking + lead capture improvements",
                "Better SEO structure + analytics",
                "2 revision rounds (structured)",
              ]}
            />
            <TierCard
              name="Premium Platform"
              price="$1,700–$3,500+"
              badge="Best for scale"
              best={estimate.tier === "premium"}
              bullets={[
                "Custom features + integrations",
                "Advanced UI + performance focus",
                "Payments/membership/automation options",
                "2–3 revision rounds (by scope)",
              ]}
            />
          </div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Debug</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            This is exactly what we loaded from localStorage (if present) + what we normalized.
          </p>
        </div>
        <div className="panelBody">
          <pre
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.25)",
              color: "rgba(255,255,255,0.86)",
              overflowX: "auto",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
{JSON.stringify(
  {
    loadedFromLocalStorage: lsRaw ?? null,
    normalized,
    tier: estimate.tier,
    total: estimate.total,
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

/* ---------------- tier card ---------------- */

function TierCard({
  name,
  price,
  bullets,
  badge,
  best,
}: {
  name: string;
  price: string;
  bullets: string[];
  badge: string;
  best?: boolean;
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
            <div className={`badge ${best ? "badgeHot" : ""}`} style={{ marginTop: 10 }}>
              {best ? "Best fit" : "Tier"}
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