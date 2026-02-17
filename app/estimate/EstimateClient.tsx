"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Intake = {
  mode?: string;
  intent?: string;
  intentOther?: string;

  websiteType?: string;
  pages?: string;

  booking?: boolean;
  payments?: boolean;
  blog?: boolean;
  membership?: boolean;

  wantsAutomation?: string;

  contentReady?: string;

  // old estimate params
  hasBrand?: string;
  domainHosting?: string;
  timeline?: string;
  budget?: string;
  competitorUrl?: string;
  notes?: string;
};

type Props = {
  intake: Intake;
  leadEmail?: string;
  leadPhone?: string;
};

const LS_KEY = "crecystudio:intake";

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function normYesNo(v: any): "yes" | "no" {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "yes" || s === "true" || s === "1") return "yes";
  return "no";
}

function normContent(v: any): "ready" | "some" | "not ready" {
  const s = String(v ?? "").toLowerCase().trim();
  if (s.includes("ready")) return "ready";
  if (s.includes("not")) return "not ready";
  return "some";
}

function normWebsiteType(v: any): "business" | "ecommerce" | "portfolio" | "landing" {
  const s = String(v ?? "business").toLowerCase().trim();
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("port")) return "portfolio";
  if (s.includes("land")) return "landing";
  return "business";
}

function normPages(v: any): "1" | "1-3" | "4-6" | "6-8" | "9+" {
  const s = String(v ?? "1-3").trim();
  if (s === "1") return "1";
  if (s === "1-3") return "1-3";
  if (s === "4-5" || s === "4-6") return "4-6";
  if (s === "6-8") return "6-8";
  if (s === "9+") return "9+";
  // fallback
  return "1-3";
}

function normBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function normWantsAutomation(v: any): "yes" | "no" {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "yes" || s === "true" || s === "1") return "yes";
  return "no";
}

function parseList(v: any): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (!v) return [];
  const s = String(v);
  // could be comma-separated or already a single value
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

type Normalized = {
  websiteType: "business" | "ecommerce" | "portfolio" | "landing";
  pages: "1" | "1-3" | "4-6" | "6-8" | "9+";

  booking: boolean;
  payments: boolean;
  blog: boolean;
  membership: boolean;

  wantsAutomation: "yes" | "no";
  contentReady: "ready" | "some" | "not ready";

  // domain/hosting handled?
  domainHosting: "yes" | "no";

  // from localStorage (build intake)
  integrations: string[];
  automationTypes: string[];

  // used for debug / display
  intent: string;
  leadEmail: string;
  leadPhone: string;
  notes: string;

  // optional from build intake if present
  hasLogo?: "yes" | "no";
  hasBrandGuide?: "yes" | "no";
};

function computeEstimate(n: Normalized) {
  const breakdown: { label: string; amount: number }[] = [];

  const hasAddons =
    n.booking ||
    n.payments ||
    n.blog ||
    n.membership ||
    n.wantsAutomation === "yes" ||
    (n.integrations?.length ?? 0) > 0 ||
    (n.automationTypes?.length ?? 0) > 0;

  // Your starter cap rule:
  const qualifiesStarterCap =
    !hasAddons && n.contentReady === "ready" && n.domainHosting === "yes";

  // Base pricing (your vision)
  let base = 0;
  let baseLabel = "";

  if (n.pages === "1") {
    if (qualifiesStarterCap) {
      base = 225;
      baseLabel = "One-page starter (no add-ons)";
    } else {
      base = 400;
      baseLabel = "Starter base (1–3 pages)";
    }
  } else if (n.pages === "1-3") {
    base = 400;
    baseLabel = "Starter base (1–3 pages)";
  } else if (n.pages === "4-6") {
    base = 550;
    baseLabel = "Base (4–6 pages)";
  } else if (n.pages === "6-8") {
    base = 900;
    baseLabel = "Base (6–8 pages)";
  } else {
    // 9+
    base = 1200;
    baseLabel = "Base (9+ pages)";
  }

  breakdown.push({ label: baseLabel, amount: base });

  // Website type adjustments (light touch)
  if (n.websiteType === "ecommerce") breakdown.push({ label: "Ecommerce setup", amount: 180 });
  if (n.websiteType === "portfolio") breakdown.push({ label: "Portfolio layout polish", amount: 60 });
  if (n.websiteType === "landing") breakdown.push({ label: "Landing focus", amount: 0 });

  // Feature add-ons
  if (n.booking) breakdown.push({ label: "Booking / appointments", amount: 150 });
  if (n.payments) breakdown.push({ label: "Payments / checkout", amount: 250 });
  if (n.blog) breakdown.push({ label: "Blog / articles", amount: 120 });
  if (n.membership) breakdown.push({ label: "Membership / gated content", amount: 400 });

  if (n.wantsAutomation === "yes") breakdown.push({ label: "Automation setup (advanced)", amount: 200 });

  // Integrations should COUNT (this is the bug your output exposed)
  // Flat per-integration fee (simple + predictable)
  const integrationFeeEach = 60;
  if ((n.integrations?.length ?? 0) > 0) {
    breakdown.push({
      label: `Integrations (${n.integrations.length})`,
      amount: n.integrations.length * integrationFeeEach,
    });
  }

  // Readiness
  if (n.contentReady === "some") breakdown.push({ label: "Partial content readiness", amount: 60 });
  if (n.contentReady === "not ready") breakdown.push({ label: "Content not ready (content help)", amount: 180 });

  // Domain/hosting guidance
  if (n.domainHosting === "no") breakdown.push({ label: "Domain/hosting guidance", amount: 60 });

  // IMPORTANT: brand should NOT automatically punish people.
  // So we do NOT charge “no brand” by default.
  // (You can upsell brand direction during the call.)

  const total = breakdown.reduce((sum, b) => sum + b.amount, 0);

  // Typical range
  const low = Math.round(total * 0.9);
  const high = Math.round(total * 1.15);

  // Tier recommendation
  const heavy = n.payments || n.membership || n.wantsAutomation === "yes";
  let tier: "essential" | "growth" | "premium" = "essential";

  if (n.pages === "4-6" || n.pages === "6-8") tier = "growth";
  if (n.pages === "9+" || heavy) tier = "premium";
  if (n.pages === "1" || n.pages === "1-3") tier = "essential";

  return { total, low, high, tier, breakdown, hasAddons, qualifiesStarterCap };
}

export default function EstimateClient({ intake, leadEmail, leadPhone }: Props) {
  const [loaded, setLoaded] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") setLoaded(parsed);
    } catch {}
  }, []);

  const normalized: Normalized = useMemo(() => {
    const source = loaded ?? {};

    // Pull from localStorage build intake first, else server intake
    const websiteTypeRaw = source.websiteType ?? intake.websiteType ?? "business";
    const pagesRaw = source.pages ?? intake.pages ?? "1-3";

    const bookingRaw = source.booking ?? intake.booking ?? false;
    const paymentsRaw = source.payments ?? intake.payments ?? false;
    const blogRaw = source.blog ?? intake.blog ?? false;
    const membershipRaw = source.membership ?? intake.membership ?? false;

    const wantsAutomationRaw = source.wantsAutomation ?? intake.wantsAutomation ?? "no";
    const contentReadyRaw = source.contentReady ?? intake.contentReady ?? "some";

    // Domain/hosting from localStorage build intake ("Yes/No"), else estimate intake ("yes/no")
    const domainHostingRaw = source.domainHosting ?? intake.domainHosting ?? "no";

    const integrationsRaw = source.integrations ?? intake["integrations"] ?? [];
    const automationTypesRaw = source.automationTypes ?? intake["automationTypes"] ?? [];

    const n: Normalized = {
      websiteType: normWebsiteType(websiteTypeRaw),
      pages: normPages(pagesRaw),

      booking: normBool(bookingRaw),
      payments: normBool(paymentsRaw),
      blog: normBool(blogRaw),
      membership: normBool(membershipRaw),

      wantsAutomation: normWantsAutomation(wantsAutomationRaw),
      contentReady: normContent(contentReadyRaw),

      domainHosting: normYesNo(domainHostingRaw),

      integrations: parseList(integrationsRaw),
      automationTypes: parseList(automationTypesRaw),

      intent: String(source.intent ?? intake.intent ?? "business"),
      leadEmail: String(source.leadEmail ?? leadEmail ?? "").trim(),
      leadPhone: String(source.leadPhone ?? leadPhone ?? "").trim(),
      notes: String(source.notes ?? intake.notes ?? "").trim(),

      hasLogo: source.hasLogo ? normYesNo(source.hasLogo) : undefined,
      hasBrandGuide: source.hasBrandGuide ? normYesNo(source.hasBrandGuide) : undefined,
    };

    return n;
  }, [loaded, intake, leadEmail, leadPhone]);

  const result = useMemo(() => computeEstimate(normalized), [normalized]);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 920, marginTop: 10 }}>
        One-page starter from <strong>$225</strong> (no add-ons).{" "}
        <strong>1–3 pages from $400</strong> (no add-ons).{" "}
        <strong>4–6 pages start at $550</strong> + add-ons. We’ll confirm final scope together before you pay a deposit.
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
          <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: "-1px" }}>
            {money(result.total)}
          </div>
          <div className="smallNote" style={{ marginTop: 6 }}>
            Typical range: {money(result.low)} – {money(result.high)}
          </div>

          <div style={{ height: 14 }} />

          <div className="fieldLabel">Breakdown</div>
          <div style={{ display: "grid", gap: 10 }}>
            {result.breakdown
              .filter((b) => b.amount !== 0)
              .map((b, idx) => (
                <div key={idx} className="checkRow" style={{ justifyContent: "space-between" }}>
                  <div className="checkLeft">
                    <div className="checkLabel">{b.label}</div>
                  </div>
                  <div style={{ fontWeight: 950 }}>{b.amount > 0 ? `+ ${money(b.amount)}` : money(b.amount)}</div>
                </div>
              ))}
          </div>

          <div className="smallNote" style={{ marginTop: 12 }}>
            Note: if budget is tight, we can do scope trade-offs or admin-only discounts (10–25%) without changing public tier pricing.
          </div>

          <div className="smallNote" style={{ marginTop: 10 }}>
            Starter caps apply only when: <strong>no add-ons</strong>, <strong>content ready</strong>, and{" "}
            <strong>domain/hosting handled</strong>.
          </div>

          <div className="smallNote" style={{ marginTop: 10, fontWeight: 900 }}>
            Next: add Scope Snapshot preview
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
              sub="Best for simple launches"
              price="$225–$850"
              bullets={[
                "1 page starter available (no add-ons)",
                "1–3 pages for small businesses",
                "Mobile responsive + contact form",
                "1 revision round (structured)",
              ]}
              best={result.tier === "essential"}
            />
            <TierCard
              name="Growth Build"
              sub="Most chosen"
              price="$550–$1,500"
              bullets={[
                "4–6 pages/sections + stronger UX",
                "Booking + lead capture improvements",
                "Better SEO structure + analytics",
                "2 revision rounds (structured)",
              ]}
              best={result.tier === "growth"}
            />
            <TierCard
              name="Premium Platform"
              sub="Best for scale"
              price="$1,700–$3,500+"
              bullets={[
                "7+ pages or advanced features",
                "Payments/membership/automation options",
                "Integrations + custom workflows",
                "2–3 revision rounds (by scope)",
              ]}
              best={result.tier === "premium"}
            />
          </div>

          <div style={{ height: 16 }} />

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
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              color: "rgba(255,255,255,0.82)",
            }}
          >
{JSON.stringify(
  {
    loadedFromLocalStorage: loaded,
    normalized,
    tier: result.tier,
    total: result.total,
    qualifiesStarterCap: result.qualifiesStarterCap,
    hasAddons: result.hasAddons,
  },
  null,
  2
)}
          </pre>
        </div>
      </section>

      <div className="footer">
        © 2026 CrecyStudio. Built to convert. Clear scope. Clean builds.
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
  name,
  sub,
  price,
  bullets,
  best,
}: {
  name: string;
  sub: string;
  price: string;
  bullets: string[];
  best?: boolean;
}) {
  return (
    <div className={`card ${best ? "" : ""}`} style={{ borderColor: best ? "rgba(255,122,24,0.55)" : undefined }}>
      <div className="cardInner">
        <div className="tierHead">
          <div>
            <div className="tierName">{name}</div>
            <div className="tierSub">{sub}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tierPrice">{price}</div>
            <div className="badge" style={{ marginTop: 8, ...(best ? { borderColor: "rgba(255,122,24,0.50)", background: "rgba(255,122,24,0.16)" } : {}) }}>
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