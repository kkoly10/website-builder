"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";

const FREE_AUTOMATIONS = new Set(["Email confirmations", "Email confirmation"]);
const FREE_INTEGRATIONS = new Set(["Google Maps / location", "Analytics (GA4 / Pixel)"]);

const CORE_KEYS = new Set([
  "websiteType",
  "pages",
  "booking",
  "payments",
  "blog",
  "membership",
  "wantsAutomation",
  "automationTypes",
  "integrations",
  "integrationOther",
  "contentReady",
  "domainHosting",
  "timeline",
  "intent",
  "leadEmail",
  "leadPhone",
  "notes",
]);

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
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function parsePagesMax(raw: any): { max: number } {
  const s = String(raw ?? "").trim();
  if (!s) return { max: 3 };
  if (s.includes("+")) {
    const n = parseInt(s.replace("+", ""), 10);
    return { max: Number.isFinite(n) ? n : 9 };
  }
  if (s.includes("-")) {
    const [, b] = s.split("-").map((x) => parseInt(x.trim(), 10));
    return { max: Number.isFinite(b) ? b : 3 };
  }
  const n = parseInt(s, 10);
  return { max: Number.isFinite(n) ? n : 3 };
}

function bucketPages(max: number): PagesBucket {
  if (max <= 1) return "1";
  if (max <= 3) return "1-3";
  if (max <= 6) return "4-6";
  if (max <= 8) return "6-8";
  return "9+";
}

function computeEstimate(n: Normalized) {
  const lines: BreakdownLine[] = [];

  let base = 0;

  if (n.pages === "1") {
    base = 225;
    lines.push({ label: "One-page starter base", amount: 225 });
  } else if (n.pages === "1-3") {
    base = 400;
    lines.push({ label: "Starter base (1–3 pages)", amount: 400 });
  } else {
    base = 550;
    lines.push({ label: "Base (4–6 pages starts here)", amount: 550 });

    if (n.pages === "6-8") lines.push({ label: "Larger scope (6–8)", amount: 250 });
    if (n.pages === "9+") lines.push({ label: "Large scope (9+)", amount: 500 });
  }

  if (n.websiteType === "ecommerce") lines.push({ label: "Ecommerce baseline", amount: 150 });
  if (n.booking) lines.push({ label: "Booking / appointments", amount: 120 });
  if (n.payments) lines.push({ label: "Payments / checkout", amount: 250 });
  if (n.membership) lines.push({ label: "Membership / gated content", amount: 400 });

  if (n.blog && (n.pages === "1" || n.pages === "1-3")) {
    lines.push({ label: "Blog / articles", amount: 120 });
  }

  const wantsAuto = n.wantsAutomation === "yes";
  const paidAutoTypes = n.automationTypes.filter((x) => !FREE_AUTOMATIONS.has(x));
  if (wantsAuto && paidAutoTypes.length > 0) {
    lines.push({ label: "Automations setup", amount: 200 });
    lines.push({ label: `Automation types (${paidAutoTypes.length})`, amount: paidAutoTypes.length * 40 });
  }

  const integrations = [...n.integrations];
  const filteredIntegrations = integrations.filter(
    (x) => x !== "Stripe payments" && x !== "PayPal payments" && x !== "Calendly / scheduling"
  );

  let paidIntegrationCount = 0;
  let integrationTotal = 0;

  for (const i of filteredIntegrations) {
    if (FREE_INTEGRATIONS.has(i)) continue;
    paidIntegrationCount += 1;
    integrationTotal += i === "Mailchimp / email list" ? 60 : i === "Live chat" ? 40 : 40;
  }

  if (paidIntegrationCount > 0) lines.push({ label: `Integrations (${paidIntegrationCount})`, amount: integrationTotal });

  if (n.contentReady === "some") lines.push({ label: "Partial content readiness", amount: 60 });
  if (n.contentReady === "not_ready") lines.push({ label: "Content not ready (help needed)", amount: 160 });

  if (n.domainHosting === "no") lines.push({ label: "Domain/hosting guidance", amount: 60 });

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const low = Math.max(0, Math.round(total * 0.9));
  const high = Math.max(low + 1, Math.round(total * 1.15));

  const pagesMax =
    n.pages === "1" ? 1 : n.pages === "1-3" ? 3 : n.pages === "4-6" ? 6 : n.pages === "6-8" ? 8 : 12;

  let tier: "essential" | "growth" | "premium" = "essential";
  if (pagesMax >= 9 || n.payments || n.membership || paidAutoTypes.length > 0) tier = "premium";
  else if (pagesMax >= 4 || n.booking || paidIntegrationCount > 0 || n.websiteType === "ecommerce") tier = "growth";
  else tier = total > 850 ? "growth" : "essential";

  return { total, low, high, lines, tier };
}

export default function EstimateClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState<any>(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setLoadedFromLocalStorage(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const parsedQuery = useMemo(() => {
    const q: Record<string, string> = {};
    for (const [key, val] of sp.entries()) q[key] = val;
    return q;
  }, [sp]);

  const hasMeaningfulQuery = useMemo(() => {
    for (const k of Object.keys(parsedQuery)) {
      if (CORE_KEYS.has(k)) return true;
    }
    return false;
  }, [parsedQuery]);

  const hasIntake = !!loadedFromLocalStorage || hasMeaningfulQuery;

  // If no intake/query, show a “start here” gate instead of fake defaults
  if (!hasIntake) {
    return (
      <main className="container" style={{ padding: "48px 0 80px" }}>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          CrecyStudio • Estimate
        </div>

        <div style={{ height: 14 }} />

        <h1 className="h1">Start with the questionnaire</h1>
        <p className="p" style={{ maxWidth: 860, marginTop: 10 }}>
          To generate an accurate estimate, we need a few details (pages, features, timeline, and your email).
        </p>

        <div style={{ height: 18 }} />

        <section className="panel" style={{ maxWidth: 760 }}>
          <div className="panelHeader">
            <div style={{ fontWeight: 800 }}>No intake found</div>
            <div className="smallNote">This page only works after the “Build” questionnaire.</div>
          </div>
          <div className="panelBody" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btnPrimary" href="/build">
              Start Questionnaire <span className="btnArrow">→</span>
            </Link>
            <Link className="btn btnGhost" href="/systems">
              Fix My Workflow
            </Link>
            <Link className="btn btnGhost" href="/">
              Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const merged = useMemo(() => ({ ...(loadedFromLocalStorage || {}), ...parsedQuery }), [loadedFromLocalStorage, parsedQuery]);

  const normalized: Normalized = useMemo(() => {
    const { max } = parsePagesMax(merged.pages);
    return {
      websiteType: normWebsiteType(merged.websiteType),
      pages: bucketPages(max),

      booking: toBool(merged.booking),
      payments: toBool(merged.payments),
      blog: toBool(merged.blog),
      membership: toBool(merged.membership),

      wantsAutomation: normYesNo(merged.wantsAutomation, "no"),
      automationTypes: splitList(merged.automationTypes),

      integrations: splitList(merged.integrations),
      integrationOther: String(merged.integrationOther ?? "").trim(),

      contentReady: normContentReady(merged.contentReady),
      domainHosting: normYesNo(merged.domainHosting, "no"),

      timeline: String(merged.timeline ?? "").trim() || "2-3w",
      intent: String(merged.intent ?? "").trim() || "business",

      leadEmail: String(merged.leadEmail ?? merged?.lead?.email ?? "").trim(),
      leadPhone: String(merged.leadPhone ?? merged?.lead?.phone ?? "").trim(),
      notes: String(merged.notes ?? "").trim(),
    };
  }, [merged]);

  const estimate = useMemo(() => computeEstimate(normalized), [normalized]);

  async function onSendEstimate() {
    setSendError("");

    const email = normalized.leadEmail.trim();
    if (!email || !email.includes("@")) {
      setSendError("Missing a valid email. Go back to the questionnaire and add your email first.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        source: "estimate",
        lead: { email, phone: normalized.leadPhone || undefined },
        intakeRaw: merged,
        intakeNormalized: normalized,
        estimate: {
          total: estimate.total,
          low: estimate.low,
          high: estimate.high,
          tierRecommended: estimate.tier,
        },
      };

      const res = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to save estimate.");
      if (!json?.quoteId) throw new Error("Saved, but missing quoteId.");

      try {
        window.localStorage.setItem(LAST_QUOTE_KEY, String(json.quoteId));
      } catch {}

      router.push(`/book?quoteId=${encodeURIComponent(String(json.quoteId))}`);
    } catch (e: any) {
      setSendError(e?.message || "Failed to save estimate.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />

      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        Review your breakdown below. Then save your quote and book a discovery call to confirm final scope.
      </p>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div className="pDark">
            Type: <strong>{normalized.websiteType}</strong> • Pages: <strong>{normalized.pages}</strong> • Tier:{" "}
            <strong>{estimate.tier}</strong>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, fontSize: 34, letterSpacing: "-0.8px" }}>{money(estimate.total)}</div>
            <div className="pDark">
              Typical range: {money(estimate.low)} – {money(estimate.high)}
            </div>
          </div>
        </div>

        <div className="panelBody">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Line item breakdown</div>

          <div style={{ display: "grid", gap: 10 }}>
            {estimate.lines.map((l) => (
              <div
                key={l.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  border: "1px solid var(--stroke)",
                  background: "var(--panel2)",
                  borderRadius: 10,
                  padding: "12px 12px",
                }}
              >
                <div style={{ color: "var(--fg)", fontWeight: 700 }}>{l.label}</div>
                <div style={{ color: "var(--fg)", fontWeight: 800 }}>
                  {l.amount === 0 ? "Included" : `+ ${money(l.amount)}`}
                </div>
              </div>
            ))}
          </div>

          <div className="smallNote" style={{ marginTop: 14 }}>
            If budget is tight, we can do scope trade-offs or admin-only discounts without changing public pricing tiers.
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 800 }}>Next step</div>
          <div className="smallNote">Save your quote and book a quick call. Payment happens after the call if you proceed.</div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          {sendError ? (
            <div
              style={{
                border: "1px solid rgba(255,0,0,0.35)",
                background: "rgba(255,0,0,0.08)",
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {sendError}
            </div>
          ) : null}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/build">
              Edit answers
            </Link>

            <button className="btn btnPrimary" type="button" onClick={onSendEstimate} disabled={sending}>
              {sending ? "Saving..." : "Save + book call"} <span className="btnArrow">→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}