// app/estimate/EstimateClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

type Intake = {
  mode?: string;

  intent?: string;
  intentOther?: string;

  websiteType?: string; // business/ecommerce/portfolio/landing (or Title Case from build form)
  pages?: string;       // 1-3, 4-6, 7-10, 9+, 10+ (or build values 4-5, 6-8, 9+)

  booking?: boolean;
  payments?: boolean;
  blog?: boolean;
  membership?: boolean;

  wantsAutomation?: string; // yes/no or Yes/No
  contentReady?: string;    // ready/some/not ready OR Ready/Some/Not ready
  hasBrand?: string;        // yes/no (if present from estimate query)
  domainHosting?: string;   // yes/no OR Yes/No OR handled states
  timeline?: string;        // 2-4w / rush OR build values

  leadEmail?: string;
  leadPhone?: string;

  notes?: string;

  // optional arrays from build/page.tsx
  integrations?: string[] | string;
};

type LegacyProps = { intake: Intake; leadEmail: string; leadPhone: string };
type NewProps = { searchParams: SearchParams };
type Props = Partial<LegacyProps> & Partial<NewProps>;

function pick(params: SearchParams, key: string) {
  const v = params?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function asBool(v: any) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function normYesNo(v: any, fallback: "yes" | "no" = "no") {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return fallback;
  if (s === "y" || s === "yes" || s === "true" || s === "1") return "yes";
  if (s === "n" || s === "no" || s === "false" || s === "0") return "no";
  return fallback;
}

function normContentReady(v: any): "ready" | "some" | "not" {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("ready") && !s.includes("not")) return "ready";
  if (s.includes("not")) return "not";
  if (s.includes("some")) return "some";
  // your estimate defaults:
  return "some";
}

/**
 * IMPORTANT: preserve 9+ as 9+ (don’t map it to 7–10).
 * Build form uses: 1-3, 4-5, 6-8, 9+
 * Estimate page/query might use: 1-3, 4-6, 7-10, 10+
 */
function normPages(v: any): "1-3" | "4-6" | "7-10" | "9+" | "10+" {
  const s = String(v ?? "").trim();
  if (!s) return "1-3";

  const low = s.toLowerCase();

  // preserve explicit 9+ and 10+
  if (low.includes("9+") || (low.includes("9") && low.includes("+"))) return "9+";
  if (low.includes("10+") || (low.includes("10") && low.includes("+"))) return "10+";

  // normalize common ranges
  if (low.includes("1-3")) return "1-3";
  if (low.includes("4-6") || low.includes("4-5")) return "4-6";

  // build’s 6-8 => treat as 7-10 (closer to premium effort)
  if (low.includes("6-8")) return "7-10";
  if (low.includes("7-10")) return "7-10";

  // if someone typed 9+ without plus formatting
  if (low === "9" || low.startsWith("9")) return "9+";

  return "1-3";
}

function normWebsiteType(v: any): "business" | "ecommerce" | "portfolio" | "landing" {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "business";
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("port")) return "portfolio";
  if (s.includes("land")) return "landing";
  return "business";
}

function normTimeline(v: any): "2-4w" | "4+w" | "rush" {
  const s = String(v ?? "").toLowerCase();
  if (!s) return "2-4w";
  if (s.includes("under") || s.includes("14") || s.includes("rush")) return "rush";
  if (s.includes("4+") || s.includes("4+w")) return "4+w";
  if (s.includes("2-4w") || s.includes("2-3") || s.includes("weeks")) return "2-4w";
  return "2-4w";
}

function parseIntegrations(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    // could be "a,b,c"
    if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
    return [s];
  }
  return [];
}

function readLocalStorageIntake(): any | null {
  if (typeof window === "undefined") return null;

  const keysToTry = [
    "crecystudio_intake_v1",
    "crecystudio:intake",
    "crecy:intake",
    "cs_intake",
    "intake",
    "buildForm",
  ];

  for (const k of keysToTry) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore
    }
  }
  return null;
}

type Normalized = {
  websiteType: "business" | "ecommerce" | "portfolio" | "landing";
  pages: "1-3" | "4-6" | "7-10" | "9+" | "10+";
  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;
  wantsAutomation: "yes" | "no";
  contentReady: "ready" | "some" | "not";
  hasBrand: "yes" | "no";
  domainHosting: "yes" | "no";
  timeline: "2-4w" | "4+w" | "rush";
  intent: string;
  leadEmail: string;
  leadPhone: string;
  notes: string;
  integrations: string[];
};

function normalizeAny(raw: any, sp?: SearchParams): Normalized {
  // base from raw object
  const websiteType = normWebsiteType(raw?.websiteType ?? pick(sp || {}, "websiteType"));
  const pages = normPages(raw?.pages ?? pick(sp || {}, "pages"));

  const booking = asBool(raw?.booking ?? pick(sp || {}, "booking"));
  const payments = asBool(raw?.payments ?? pick(sp || {}, "payments"));
  const blog = asBool(raw?.blog ?? pick(sp || {}, "blog"));
  const membership = asBool(raw?.membership ?? pick(sp || {}, "membership"));

  const wantsAutomation = normYesNo(raw?.wantsAutomation ?? pick(sp || {}, "wantsAutomation"), "no");

  // content readiness can come as: Ready/Some/Not ready
  const contentReady = normContentReady(raw?.contentReady ?? pick(sp || {}, "contentReady"));

  // hasBrand: from estimate query param OR inferred from build form fields (hasBrandGuide/hasLogo)
  const explicitHasBrand = pick(sp || {}, "hasBrand") || raw?.hasBrand;
  let hasBrand = normYesNo(explicitHasBrand, "no");

  // if build form hasBrandGuide/hasLogo exist and explicitHasBrand not provided, infer
  if (!explicitHasBrand) {
    const hasBrandGuide = raw?.hasBrandGuide;
    const hasLogo = raw?.hasLogo;
    if (String(hasBrandGuide ?? "").toLowerCase() === "yes" || String(hasLogo ?? "").toLowerCase() === "yes") {
      hasBrand = "yes";
    }
  }

  // domainHosting: from estimate query param OR build form domainHosting (Yes/No)
  const domainHosting = normYesNo(raw?.domainHosting ?? pick(sp || {}, "domainHosting"), "no");

  const timeline = normTimeline(raw?.timeline ?? pick(sp || {}, "timeline"));

  const intent = String(raw?.intent ?? pick(sp || {}, "intent") ?? "business").trim() || "business";

  const leadEmail = String(raw?.leadEmail ?? pick(sp || {}, "leadEmail") ?? "").trim();
  const leadPhone = String(raw?.leadPhone ?? pick(sp || {}, "leadPhone") ?? "").trim();
  const notes = String(raw?.notes ?? pick(sp || {}, "notes") ?? "").trim();

  const integrations = parseIntegrations(raw?.integrations ?? pick(sp || {}, "integrations"));

  return {
    websiteType,
    pages,
    booking,
    payments,
    blog,
    membership,
    wantsAutomation,
    contentReady,
    hasBrand,
    domainHosting,
    timeline,
    intent,
    leadEmail,
    leadPhone,
    notes,
    integrations,
  };
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function EstimateClient(props: Props) {
  const [lsIntake, setLsIntake] = useState<any | null>(null);

  const [email, setEmail] = useState(
    props.leadEmail || pick(props.searchParams || {}, "leadEmail") || ""
  );
  const [phone, setPhone] = useState(
    props.leadPhone || pick(props.searchParams || {}, "leadPhone") || ""
  );

  useEffect(() => {
    const found = readLocalStorageIntake();
    setLsIntake(found);
  }, []);

  const normalized = useMemo<Normalized>(() => {
    // priority: server-provided intake > localStorage intake > query params
    const raw = props.intake ?? lsIntake ?? null;
    return normalizeAny(raw, props.searchParams || {});
  }, [props.intake, lsIntake, props.searchParams]);

  // keep email/phone synced if we loaded from localStorage later
  useEffect(() => {
    if (!email && normalized.leadEmail) setEmail(normalized.leadEmail);
    if (!phone && normalized.leadPhone) setPhone(normalized.leadPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized.leadEmail, normalized.leadPhone]);

  const pricing = useMemo(() => {
    // --- System 2 base ---
    const BASE = 550;

    // Website type baseline (small, because tiers already communicate the big story)
    const typeAdd =
      normalized.websiteType === "ecommerce" ? 150 :
      normalized.websiteType === "portfolio" ? 60 :
      normalized.websiteType === "landing" ? 0 :
      0;

    // Scope add-ons (IMPORTANT: 9+ is its own bucket now)
    const scopeAdd =
      normalized.pages === "4-6" ? 220 :
      normalized.pages === "7-10" ? 550 :
      normalized.pages === "9+" ? 650 :
      normalized.pages === "10+" ? 900 :
      0;

    // Features
    const bookingAdd = normalized.booking ? 150 : 0;
    const paymentsAdd = normalized.payments ? 250 : 0;
    const blogAdd = normalized.blog ? 120 : 0;
    const membershipAdd = normalized.membership ? 400 : 0;

    // Automation (only when explicitly yes)
    const automationAdd = normalized.wantsAutomation === "yes" ? 200 : 0;

    // Readiness (softened for conversion)
    const contentAdd =
      normalized.contentReady === "ready" ? 0 :
      normalized.contentReady === "some" ? 60 :
      140; // not ready

    /**
     * BRAND: don’t penalize "no brand"
     * - Basic brand direction is INCLUDED in the build.
     * - Brand kit / logo creation is a separate paid add-on later (upsell on call).
     */
    const brandAdd = 0;

    // Domain/hosting guidance (soft)
    const domainAdd = normalized.domainHosting === "no" ? 60 : 0;

    // Rush timeline
    const rushAdd = normalized.timeline === "rush" ? 200 : 0;

    const lines: { label: string; amount: number; kind?: "base" }[] = [
      { label: "Essential base (System 2: 1–3 pages + core UX)", amount: BASE, kind: "base" },
      { label: normalized.websiteType === "business" ? "Business site baseline" :
               normalized.websiteType === "ecommerce" ? "E-commerce baseline" :
               normalized.websiteType === "portfolio" ? "Portfolio baseline" :
               "Landing page baseline",
        amount: typeAdd
      },
      {
        label:
          normalized.pages === "1-3" ? "Small scope (1–3)" :
          normalized.pages === "4-6" ? "Medium scope (4–6)" :
          normalized.pages === "7-10" ? "Large scope (7–10)" :
          normalized.pages === "9+" ? "Extra-large scope (9+)" :
          "Enterprise scope (10+)",
        amount: scopeAdd,
      },
      { label: "Booking / appointments", amount: bookingAdd },
      { label: "Payments / checkout", amount: paymentsAdd },
      { label: "Blog / articles", amount: blogAdd },
      { label: "Membership / gated content", amount: membershipAdd },
      { label: "Automation setup", amount: automationAdd },

      {
        label:
          normalized.contentReady === "ready"
            ? "Content ready"
            : normalized.contentReady === "some"
            ? "Partial content readiness"
            : "Content not ready (copy/content help)",
        amount: contentAdd,
      },

      // brand line as info but $0
      {
        label:
          normalized.hasBrand === "yes"
            ? "Brand assets provided"
            : "Basic brand direction included (no brand kit needed)",
        amount: brandAdd,
      },

      {
        label:
          normalized.domainHosting === "no"
            ? "Domain/hosting guidance"
            : "Domain/hosting handled by client",
        amount: domainAdd,
      },

      { label: "Rush timeline", amount: rushAdd },
    ];

    // sum
    const total = lines.reduce((sum, x) => sum + (x.amount || 0), 0);

    // range
    const rangeLow = Math.round(total * 0.9);
    const rangeHigh = Math.round(total * 1.15);

    // tier logic (best-fit)
    const tier =
      normalized.pages === "1-3" && total <= 900 && !normalized.payments && !normalized.membership
        ? "essential"
        : (normalized.pages === "4-6" && total <= 1600)
        ? "growth"
        : "premium";

    return { total, rangeLow, rangeHigh, lines, tier };
  }, [normalized]);

  return (
    <main className="container" style={{ padding: "42px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>

      <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
        <strong>Starts at $550.</strong> Most projects land <strong>$800–$1,200</strong> depending on readiness
        (content, brand direction, and domain/hosting help). We’ll confirm final scope together before you pay a deposit.
      </p>

      <div style={{ height: 22 }} />

      <section className="panel">
        <div className="panelHeader">
          <h2 className="h2">Estimated total</h2>
          <p className="pDark" style={{ marginTop: 8 }}>
            Based on your selections (type: <strong>{normalized.websiteType}</strong>, pages:{" "}
            <strong>{normalized.pages}</strong>).
          </p>
        </div>

        <div className="panelBody">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: -0.8 }}>
              {money(pricing.total)}
            </div>

            <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>
              Typical range: {money(pricing.rangeLow)} – {money(pricing.rangeHigh)}
            </div>

            <div style={{ height: 12 }} />

            <div style={{ fontWeight: 950, marginBottom: 6 }}>Breakdown</div>
            <div style={{ display: "grid", gap: 10 }}>
              {pricing.lines
                .filter((x) => x.amount !== 0 || x.kind === "base")
                .map((x) => (
                  <div
                    key={x.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ color: "rgba(255,255,255,0.86)", fontWeight: 850 }}>
                      {x.label}
                    </div>
                    <div style={{ fontWeight: 950 }}>
                      {x.kind === "base" ? money(x.amount) : `+ ${money(x.amount)}`}
                    </div>
                  </div>
                ))}

              <div className="smallNote" style={{ marginTop: 8 }}>
                Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
              </div>

              <div className="smallNote" style={{ marginTop: 6, fontWeight: 900 }}>
                Next: add Scope Snapshot preview
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div className="grid2">
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
                Get a Quote <span className="btnArrow">→</span>
              </Link>
              <Link className="btn btnGhost" href="/">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 26 }} />

      {/* Recommended Tier */}
      <section className="sectionSm">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Recommended tier
        </div>
        <div style={{ height: 10 }} />
        <div className="pDark" style={{ maxWidth: 860 }}>
          Best fit based on scope.
        </div>

        <div style={{ height: 14 }} />

        <div className="tierGrid">
          <TierCard
            name="Essential Launch"
            price="$550–$850"
            badge="Best for simple launches"
            best={pricing.tier === "essential"}
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
            best={pricing.tier === "growth"}
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
            best={pricing.tier === "premium"}
            bullets={[
              "Custom features + integrations",
              "Advanced UI + performance focus",
              "Payments/membership/automation options",
              "2–3 revision rounds (by scope)",
            ]}
          />
        </div>
      </section>

      {/* Debug */}
      <section className="sectionSm">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Debug
        </div>

        <p className="pDark" style={{ marginTop: 10 }}>
          This is exactly what we loaded from localStorage (if present) + what we normalized.
        </p>

        <pre
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(10,12,18,0.55)",
            color: "rgba(255,255,255,0.85)",
            overflowX: "auto",
            lineHeight: 1.5,
            fontSize: 12,
          }}
        >
{JSON.stringify(
  {
    loadedFromLocalStorage: lsIntake,
    normalized,
    tier: pricing.tier,
    total: pricing.total,
  },
  null,
  2
)}
        </pre>
      </section>
    </main>
  );
}

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