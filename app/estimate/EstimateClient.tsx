"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type YesNo = "yes" | "no";
type PagesBucket = "1" | "1-3" | "4-6" | "6-8" | "9+";

type Normalized = {
  websiteType: "business" | "ecommerce" | "portfolio" | "landing";
  pages: PagesBucket;

  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;

  wantsAutomation: YesNo;
  automationTypes: string[];

  integrations: string[];
  integrationOther: string;

  contentReady: "ready" | "some" | "not_ready";
  domainHosting: YesNo;

  timeline: string;
  intent: string;

  leadEmail: string;
  leadPhone: string;
  notes: string;
};

type BreakdownLine = { label: string; amount: number };

const LS_KEY = "crecystudio:intake";

/** FREE automations (never counted as paid add-ons) */
const FREE_AUTOMATIONS = new Set(["Email confirmations", "Email confirmation"]);

/** Integrations that are FREE if selected */
const FREE_INTEGRATIONS = new Set(["Google Maps / location", "Analytics (GA4 / Pixel)"]);

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function normYesNo(v: any, fallback: YesNo = "no"): YesNo {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "yes" || s === "true" || s === "1" || s === "on") return "yes";
  if (s === "no" || s === "false" || s === "0" || s === "off") return "no";
  return fallback;
}

function normWebsiteType(v: any): Normalized["websiteType"] {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("port")) return "portfolio";
  if (s.includes("land")) return "landing";
  return "business";
}

function normContentReady(v: any): Normalized["contentReady"] {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.includes("ready")) return "ready";
  if (s.includes("not")) return "not_ready";
  return "some";
}

function splitList(v: any): string[] {
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  const s = String(v ?? "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parsePagesMax(raw: any): { max: number; raw: string } {
  const s = String(raw ?? "").trim();
  if (!s) return { max: 3, raw: "" };
  if (s.includes("+")) {
    // treat "9+" as 9+ (big bucket)
    const n = parseInt(s.replace("+", ""), 10);
    return { max: Number.isFinite(n) ? n : 9, raw: s };
  }
  if (s.includes("-")) {
    const [a, b] = s.split("-").map((x) => parseInt(x.trim(), 10));
    const max = Number.isFinite(b) ? b : Number.isFinite(a) ? a : 3;
    return { max, raw: s };
  }
  const n = parseInt(s, 10);
  return { max: Number.isFinite(n) ? n : 3, raw: s };
}

function bucketPages(max: number): PagesBucket {
  if (max <= 1) return "1";
  if (max <= 3) return "1-3";
  if (max <= 6) return "4-6";
  if (max <= 8) return "6-8";
  return "9+";
}

/**
 * Price model (your new vision):
 * - pages=1 => base 225 always (add-ons stack)
 * - pages=1–3 => base 400 always (add-ons stack)
 * - pages=4–6 => base 550 + add-ons
 * - pages=6–8 => base 550 + scope bump + add-ons
 * - pages=9+ => base 550 + bigger scope bump + add-ons
 *
 * Included rules:
 * - Email confirmations is free
 * - Blog is $0 when pages >= 4–6 (light blog)
 */
function computeEstimate(n: Normalized) {
  const lines: BreakdownLine[] = [];

  // Base + scope
  let base = 0;
  let scopeBump = 0;

  if (n.pages === "1") {
    base = 225;
    lines.push({ label: "One-page starter base", amount: 225 });
  } else if (n.pages === "1-3") {
    base = 400;
    lines.push({ label: "Starter base (1–3 pages)", amount: 400 });
  } else {
    base = 550;
    lines.push({ label: "Base (4–6 pages starts here)", amount: 550 });

    if (n.pages === "6-8") {
      scopeBump = 250;
      lines.push({ label: "Larger scope (6–8)", amount: scopeBump });
    }
    if (n.pages === "9+") {
      scopeBump = 500;
      lines.push({ label: "Large scope (9+)", amount: scopeBump });
    }
  }

  // Website type adjustments (small, not aggressive)
  if (n.websiteType === "ecommerce") {
    lines.push({ label: "Ecommerce baseline", amount: 150 });
  } else if (n.websiteType === "portfolio") {
    lines.push({ label: "Portfolio baseline", amount: 0 });
  } else if (n.websiteType === "landing") {
    lines.push({ label: "Landing focus", amount: 0 });
  } else {
    lines.push({ label: "Business site baseline", amount: 0 });
  }

  // FEATURES (paid)
  if (n.booking) lines.push({ label: "Booking / appointments", amount: 120 });
  if (n.payments) lines.push({ label: "Payments / checkout", amount: 250 });
  if (n.membership) lines.push({ label: "Membership / gated content", amount: 400 });

  // Blog: paid only for <= 1–3 pages; included ($0) for 4–6+
  if (n.blog) {
    if (n.pages === "1" || n.pages === "1-3") {
      lines.push({ label: "Blog / articles", amount: 120 });
    } else {
      lines.push({ label: "Light blog (included at 4–6+)", amount: 0 });
    }
  }

  // Automations
  const wantsAuto = n.wantsAutomation === "yes";
  const freeChosen = n.automationTypes.filter((x) => FREE_AUTOMATIONS.has(x));
  const paidAutoTypes = n.automationTypes.filter((x) => !FREE_AUTOMATIONS.has(x));

  if (wantsAuto) {
    // Email confirmations free (and does not trigger paid automation fees)
    if (freeChosen.length > 0 && paidAutoTypes.length === 0) {
      lines.push({ label: "Email confirmations (included)", amount: 0 });
    }

    // Paid automations only if they selected something besides confirmations
    if (paidAutoTypes.length > 0) {
      lines.push({ label: "Automations setup", amount: 200 });
      lines.push({ label: `Automation types (${paidAutoTypes.length})`, amount: paidAutoTypes.length * 40 });
    }
  }

  // Integrations
  // If they picked Stripe/PayPal in integrations, treat it as Payments (so estimate matches intent)
  const integrations = [...n.integrations];
  const hasStripe = integrations.includes("Stripe payments");
  const hasPayPal = integrations.includes("PayPal payments");
  const hasCalendly = integrations.includes("Calendly / scheduling");

  const inferredPayments = (hasStripe || hasPayPal) && !n.payments;
  const inferredBooking = hasCalendly && !n.booking;

  // Prevent double counting if inferred
  const filteredIntegrations = integrations.filter(
    (x) => x !== "Stripe payments" && x !== "PayPal payments" && x !== "Calendly / scheduling"
  );

  if (inferredPayments) lines.push({ label: "Payments (from selected integration)", amount: 250 });
  if (inferredBooking) lines.push({ label: "Booking (from selected integration)", amount: 120 });

  // Integration fees (simple ones free)
  let paidIntegrationCount = 0;
  let integrationTotal = 0;

  for (const i of filteredIntegrations) {
    if (FREE_INTEGRATIONS.has(i)) {
      // free
      continue;
    }
    paidIntegrationCount += 1;
    // light setup vs heavier setup
    const amt =
      i === "Mailchimp / email list" ? 60 :
      i === "Live chat" ? 40 :
      40; // default small setup
    integrationTotal += amt;
  }

  if (paidIntegrationCount > 0) {
    lines.push({ label: `Integrations (${paidIntegrationCount})`, amount: integrationTotal });
  }

  // Readiness (keep “soft” for conversion)
  if (n.contentReady === "some") lines.push({ label: "Partial content readiness", amount: 60 });
  if (n.contentReady === "not_ready") lines.push({ label: "Content not ready (help needed)", amount: 160 });

  if (n.domainHosting === "no") lines.push({ label: "Domain/hosting guidance", amount: 60 });
  if (n.domainHosting === "yes") lines.push({ label: "Domain/hosting handled by client", amount: 0 });

  // Total
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  // Typical range (tight)
  const low = Math.max(0, Math.round(total * 0.90));
  const high = Math.max(low + 1, Math.round(total * 1.15));

  // Paid add-ons detector (for messaging)
  const hasPaidAutomation = paidAutoTypes.length > 0;
  const hasPaidBlog = n.blog && (n.pages === "1" || n.pages === "1-3");
  const hasPaidIntegrations = paidIntegrationCount > 0;

  const hasPaidAddons =
    n.booking ||
    n.payments ||
    n.membership ||
    hasPaidAutomation ||
    hasPaidBlog ||
    hasPaidIntegrations ||
    inferredPayments ||
    inferredBooking ||
    n.contentReady !== "ready" ||
    n.domainHosting !== "yes";

  // Tier recommendation
  const pagesMax =
    n.pages === "1" ? 1 :
    n.pages === "1-3" ? 3 :
    n.pages === "4-6" ? 6 :
    n.pages === "6-8" ? 8 :
    12;

  let tier: "essential" | "growth" | "premium" = "essential";

  if (pagesMax >= 9 || n.payments || n.membership || hasPaidAutomation) tier = "premium";
  else if (pagesMax >= 4 || n.booking || hasPaidIntegrations || n.websiteType === "ecommerce") tier = "growth";
  else tier = total > 850 ? "growth" : "essential";

  return { total, low, high, lines, tier, hasPaidAddons };
}

export default function EstimateClient() {
  const sp = useSearchParams();

  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState<any>(null);

  // Load localStorage intake
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) {
        setLoadedFromLocalStorage(null);
        return;
      }
      const parsed = JSON.parse(raw);
      setLoadedFromLocalStorage(parsed && typeof parsed === "object" ? parsed : null);
    } catch {
      setLoadedFromLocalStorage(null);
    }
  }, []);

  // Parse query ONLY for keys present (so query can “win” cleanly)
  const parsedQuery = useMemo(() => {
    const has = (k: string) => sp.has(k);
    const get = (k: string) => sp.get(k);

    const q: any = {};

    if (has("websiteType")) q.websiteType = get("websiteType");
    if (has("pages")) q.pages = get("pages");

    if (has("booking")) q.booking = get("booking");
    if (has("payments")) q.payments = get("payments");
    if (has("blog")) q.blog = get("blog");
    if (has("membership")) q.membership = get("membership");

    if (has("wantsAutomation")) q.wantsAutomation = get("wantsAutomation");
    if (has("automationTypes")) q.automationTypes = get("automationTypes");

    if (has("integrations")) q.integrations = get("integrations");
    if (has("integrationOther")) q.integrationOther = get("integrationOther");

    if (has("contentReady")) q.contentReady = get("contentReady");
    if (has("domainHosting")) q.domainHosting = get("domainHosting");

    if (has("timeline")) q.timeline = get("timeline");
    if (has("intent")) q.intent = get("intent");

    if (has("leadEmail")) q.leadEmail = get("leadEmail");
    if (has("leadPhone")) q.leadPhone = get("leadPhone");
    if (has("notes")) q.notes = get("notes");

    return q;
  }, [sp]);

  // Merge order: localStorage -> URL query (query wins)
  const merged = useMemo(() => {
    const base = loadedFromLocalStorage && typeof loadedFromLocalStorage === "object" ? loadedFromLocalStorage : {};
    return { ...base, ...parsedQuery };
  }, [loadedFromLocalStorage, parsedQuery]);

  // Normalize merged source into what pricing uses
  const normalized: Normalized = useMemo(() => {
    const { max } = parsePagesMax(merged.pages);
    const pages = bucketPages(max);

    const integrations = splitList(merged.integrations);

    return {
      websiteType: normWebsiteType(merged.websiteType),
      pages,

      booking: toBool(merged.booking),
      payments: toBool(merged.payments),
      blog: toBool(merged.blog),
      membership: toBool(merged.membership),

      wantsAutomation: normYesNo(merged.wantsAutomation, "no"),
      automationTypes: splitList(merged.automationTypes),

      integrations,
      integrationOther: String(merged.integrationOther ?? "").trim(),

      contentReady: normContentReady(merged.contentReady),
      domainHosting: normYesNo(merged.domainHosting, "no"),

      timeline: String(merged.timeline ?? "").trim() || "2-3w",
      intent: String(merged.intent ?? "").trim() || "business",

      leadEmail: String(merged.leadEmail ?? "").trim(),
      leadPhone: String(merged.leadPhone ?? "").trim(),
      notes: String(merged.notes ?? "").trim(),
    };
  }, [merged]);

  const estimate = useMemo(() => computeEstimate(normalized), [normalized]);

  const headerMessage =
    "One-page starter from $225 (no paid add-ons). 1–3 pages from $400 (no paid add-ons). 4–6 pages start at $550 + add-ons. We’ll confirm final scope together before you pay a deposit.";

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        {headerMessage}
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div className="pDark">
            Based on your selections (type: <strong>{normalized.websiteType}</strong>, pages:{" "}
            <strong>{normalized.pages}</strong>).
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 950, fontSize: 34, letterSpacing: "-0.8px" }}>
              {money(estimate.total)}
            </div>
            <div className="pDark">
              Typical range: {money(estimate.low)} – {money(estimate.high)}
            </div>
          </div>
        </div>

        <div className="panelBody">
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Breakdown</div>

          <div style={{ display: "grid", gap: 10 }}>
            {estimate.lines.map((l) => (
              <div
                key={l.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  padding: "12px 12px",
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.86)", fontWeight: 850 }}>
                  {l.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.86)", fontWeight: 950 }}>
                  {l.amount === 0 ? "$0" : `+ ${money(l.amount)}`}
                </div>
              </div>
            ))}
          </div>

          <div className="smallNote" style={{ marginTop: 14 }}>
            Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
          </div>

          <div className="smallNote" style={{ marginTop: 8, fontWeight: 900 }}>
            Next: add Scope Snapshot preview
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      {/* Recommended tier cards */}
      <section className="sectionSm">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Recommended tier
        </div>
        <div style={{ height: 10 }} />
        <div className="pDark">Best fit based on scope.</div>

        <div style={{ height: 14 }} />

        <div className="tierGrid">
          <TierCard
            title="Essential Launch"
            sub="Best for simple launches"
            price="$225–$850"
            best={estimate.tier === "essential"}
            bullets={[
              "1 page starter available (no paid add-ons)",
              "1–3 pages for small businesses",
              "Mobile responsive + contact form",
              "1 revision round (structured)",
            ]}
          />
          <TierCard
            title="Growth Build"
            sub="Most chosen"
            price="$550–$1,500"
            best={estimate.tier === "growth"}
            bullets={[
              "4–6 pages/sections + stronger UX",
              "Booking + lead capture improvements",
              "Better SEO structure + analytics",
              "2 revision rounds (structured)",
            ]}
          />
          <TierCard
            title="Premium Platform"
            sub="Best for scale"
            price="$1,700–$3,500+"
            best={estimate.tier === "premium"}
            bullets={[
              "7+ pages or advanced features",
              "Payments/membership/automation options",
              "Integrations + custom workflows",
              "2–3 revision rounds (by scope)",
            ]}
          />
        </div>
      </section>

      <div style={{ height: 18 }} />

      {/* Actions */}
      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Next step</div>
          <div className="smallNote">If you want, send this estimate and we’ll lock scope together.</div>
        </div>
        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="fieldLabel">Email</div>
            <input className="input" value={normalized.leadEmail} readOnly placeholder="you@company.com" />
          </div>
          <div>
            <div className="fieldLabel">Phone (optional)</div>
            <input className="input" value={normalized.leadPhone} readOnly placeholder="(555) 555-5555" />
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/">
              Back home
            </Link>

            <Link className="btn btnPrimary" href="/build">
              Get a Quote <span className="btnArrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      {/* Debug */}
      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Debug</div>
          <div className="smallNote">
            Merge order: localStorage → URL query (query wins). Email confirmations are free.
          </div>
        </div>
        <div className="panelBody">
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              color: "rgba(255,255,255,0.80)",
            }}
          >
{JSON.stringify(
  {
    loadedFromLocalStorage: loadedFromLocalStorage ?? null,
    parsedQuery,
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

      <div className="footer">
        © {new Date().getFullYear()} CrecyStudio. Built to convert. Clear scope. Clean builds.
        <div className="footerLinks">
          <Link href="/">Home</Link>
          <Link href="/estimate">Estimate</Link>
          <a href="mailto:hello@crecystudio.com">hello@crecystudio.com</a>
        </div>
      </div>
    </main>
  );
}

function TierCard({
  title,
  sub,
  price,
  bullets,
  best,
}: {
  title: string;
  sub: string;
  price: string;
  bullets: string[];
  best?: boolean;
}) {
  return (
    <div className="card cardHover">
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{title}</div>
            <div className="tierSub">{sub}</div>
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