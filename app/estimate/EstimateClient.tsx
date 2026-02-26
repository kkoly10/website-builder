"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Types remain unchanged
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

function money(n: number) { return `$${Math.round(n).toLocaleString()}`; }
function toBool(v: any): boolean { if (typeof v === "boolean") return v; const s = String(v ?? "").trim().toLowerCase(); return s === "1" || s === "true" || s === "yes" || s === "on"; }
function normYesNo(v: any, fallback: YesNo = "no"): YesNo { const s = String(v ?? "").trim().toLowerCase(); if (s === "yes" || s === "true" || s === "1" || s === "on") return "yes"; if (s === "no" || s === "false" || s === "0" || s === "off") return "no"; return fallback; }
function normWebsiteType(v: any): Normalized["websiteType"] { const s = String(v ?? "").trim().toLowerCase(); if (s.includes("ecom")) return "ecommerce"; if (s.includes("port")) return "portfolio"; if (s.includes("land")) return "landing"; return "business"; }
function normContentReady(v: any): Normalized["contentReady"] { const s = String(v ?? "").trim().toLowerCase(); if (s.includes("ready")) return "ready"; if (s.includes("not")) return "not_ready"; return "some"; }
function splitList(v: any): string[] { if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean); const s = String(v ?? "").trim(); if (!s) return []; return s.split(",").map((x) => x.trim()).filter(Boolean); }
function parsePagesMax(raw: any): { max: number; raw: string } { const s = String(raw ?? "").trim(); if (!s) return { max: 3, raw: "" }; if (s.includes("+")) { const n = parseInt(s.replace("+", ""), 10); return { max: Number.isFinite(n) ? n : 9, raw: s }; } if (s.includes("-")) { const [a, b] = s.split("-").map((x) => parseInt(x.trim(), 10)); const max = Number.isFinite(b) ? b : Number.isFinite(a) ? a : 3; return { max, raw: s }; } const n = parseInt(s, 10); return { max: Number.isFinite(n) ? n : 3, raw: s }; }
function bucketPages(max: number): PagesBucket { if (max <= 1) return "1"; if (max <= 3) return "1-3"; if (max <= 6) return "4-6"; if (max <= 8) return "6-8"; return "9+"; }

function computeEstimate(n: Normalized) {
  const lines: BreakdownLine[] = [];
  let base = 0; let scopeBump = 0;

  if (n.pages === "1") { base = 225; lines.push({ label: "One-page starter base", amount: 225 }); }
  else if (n.pages === "1-3") { base = 400; lines.push({ label: "Starter base (1–3 pages)", amount: 400 }); }
  else {
    base = 550; lines.push({ label: "Base (4–6 pages starts here)", amount: 550 });
    if (n.pages === "6-8") { scopeBump = 250; lines.push({ label: "Larger scope (6–8)", amount: scopeBump }); }
    if (n.pages === "9+") { scopeBump = 500; lines.push({ label: "Large scope (9+)", amount: scopeBump }); }
  }

  if (n.websiteType === "ecommerce") lines.push({ label: "Ecommerce baseline", amount: 150 });
  
  if (n.booking) lines.push({ label: "Booking / appointments", amount: 120 });
  if (n.payments) lines.push({ label: "Payments / checkout", amount: 250 });
  if (n.membership) lines.push({ label: "Membership / gated content", amount: 400 });

  if (n.blog && (n.pages === "1" || n.pages === "1-3")) lines.push({ label: "Blog / articles", amount: 120 });

  const wantsAuto = n.wantsAutomation === "yes";
  const paidAutoTypes = n.automationTypes.filter((x) => !FREE_AUTOMATIONS.has(x));
  if (wantsAuto && paidAutoTypes.length > 0) {
    lines.push({ label: "Automations setup", amount: 200 });
    lines.push({ label: `Automation types (${paidAutoTypes.length})`, amount: paidAutoTypes.length * 40 });
  }

  const integrations = [...n.integrations];
  const filteredIntegrations = integrations.filter((x) => x !== "Stripe payments" && x !== "PayPal payments" && x !== "Calendly / scheduling");
  let paidIntegrationCount = 0; let integrationTotal = 0;
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
  const low = Math.max(0, Math.round(total * 0.90));
  const high = Math.max(low + 1, Math.round(total * 1.15));

  const pagesMax = n.pages === "1" ? 1 : n.pages === "1-3" ? 3 : n.pages === "4-6" ? 6 : n.pages === "6-8" ? 8 : 12;
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
  const [sendError, setSendError] = useState<string>("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setLoadedFromLocalStorage(JSON.parse(raw));
    } catch {}
  }, []);

  const parsedQuery = useMemo(() => {
    const q: any = {};
    for (const [key, val] of sp.entries()) q[key] = val;
    return q;
  }, [sp]);

  const merged = useMemo(() => ({ ...(loadedFromLocalStorage || {}), ...parsedQuery }), [loadedFromLocalStorage, parsedQuery]);

  const normalized: Normalized = useMemo(() => {
    const { max } = parsePagesMax(merged.pages);
    return {
      websiteType: normWebsiteType(merged.websiteType), pages: bucketPages(max),
      booking: toBool(merged.booking), payments: toBool(merged.payments),
      blog: toBool(merged.blog), membership: toBool(merged.membership),
      wantsAutomation: normYesNo(merged.wantsAutomation, "no"), automationTypes: splitList(merged.automationTypes),
      integrations: splitList(merged.integrations), integrationOther: String(merged.integrationOther ?? "").trim(),
      contentReady: normContentReady(merged.contentReady), domainHosting: normYesNo(merged.domainHosting, "no"),
      timeline: String(merged.timeline ?? "").trim() || "2-3w", intent: String(merged.intent ?? "").trim() || "business",
      leadEmail: String(merged.leadEmail ?? "").trim(), leadPhone: String(merged.leadPhone ?? "").trim(), notes: String(merged.notes ?? "").trim(),
    };
  }, [merged]);

  const estimate = useMemo(() => computeEstimate(normalized), [normalized]);

  async function onSendEstimate() {
    setSendError("");
    if (!normalized.leadEmail || !normalized.leadEmail.includes("@")) {
      setSendError("Missing a valid email. Please go back and enter your email.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        source: "estimate",
        lead: { email: normalized.leadEmail, phone: normalized.leadPhone || undefined },
        intakeRaw: merged, intakeNormalized: normalized,
        estimate: { total: estimate.total, low: estimate.low, high: estimate.high, tierRecommended: estimate.tier }
      };

      const res = await fetch("/api/submit-estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save estimate.");
      if (!json.quoteId) throw new Error("Saved, but missing quoteId.");

      try { window.localStorage.setItem(LAST_QUOTE_KEY, json.quoteId); } catch {}
      router.push(`/book?quoteId=${encodeURIComponent(json.quoteId)}`);
    } catch (e: any) {
      setSendError(e?.message || "Failed to save estimate.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="container" style={{ padding: "60px 0 100px", maxWidth: 860 }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Instant Estimate
      </div>

      <h1 className="h1" style={{ marginTop: 16 }}>Project Scope & Pricing</h1>
      <p className="p" style={{ marginTop: 10 }}>Review your itemized breakdown below. You can save this quote and book a discovery call to confirm the details.</p>

      <div style={{ height: 24 }} />

      <section className="panel" style={{ border: "1px solid var(--accentStroke)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div className="panelHeader" style={{ background: "var(--panel)", borderBottom: "1px solid var(--stroke)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: 12, letterSpacing: 1 }}>Project Estimate</div>
            <div style={{ fontWeight: 900, fontSize: 40, color: "var(--fg)", lineHeight: 1 }}>{money(estimate.total)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>Expected Range</div>
            <div style={{ fontWeight: 700, color: "var(--fg)", fontSize: 18 }}>{money(estimate.low)} – {money(estimate.high)}</div>
          </div>
        </div>

        <div className="panelBody">
          <div style={{ fontWeight: 800, marginBottom: 16, color: "var(--fg)" }}>Line Item Breakdown</div>
          
          <div style={{ display: "grid", gap: 8 }}>
            {estimate.lines.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i !== estimate.lines.length -1 ? "1px solid var(--stroke)" : "none" }}>
                <div style={{ color: "var(--muted)", fontWeight: 500 }}>{l.label}</div>
                <div style={{ color: "var(--fg)", fontWeight: 700 }}>{l.amount === 0 ? "Included" : `+${money(l.amount)}`}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ marginTop: 24, display: "flex", gap: 14, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
        {sendError && <span style={{ color: "#ffb4b4", fontWeight: 700 }}>{sendError}</span>}
        <Link href="/build" className="btn btnGhost">Edit Answers</Link>
        <button className="btn btnPrimary" onClick={onSendEstimate} disabled={sending} style={{ padding: "14px 24px" }}>
          {sending ? "Saving Quote..." : "Save Quote & Book Call"} <span className="btnArrow">→</span>
        </button>
      </div>

      <div style={{ height: 40 }} />

      <section>
        <div className="kicker" style={{ marginBottom: 16 }}>Tier Options</div>
        <div className="tierGrid">
          <TierCard title="Essential Launch" sub="Starter" price="$225–$850" best={estimate.tier === "essential"} bullets={["1-3 pages", "Mobile responsive", "Contact form", "1 revision round"]} />
          <TierCard title="Growth Build" sub="Most Chosen" price="$550–$1,500" best={estimate.tier === "growth"} bullets={["4-6 pages", "Booking or Lead Capture", "SEO Structure", "2 revision rounds"]} />
          <TierCard title="Premium Platform" sub="Scale" price="$1,700–$3,500+" best={estimate.tier === "premium"} bullets={["7+ pages", "Payments & Memberships", "Custom Automations", "Priority Support"]} />
        </div>
      </section>
    </main>
  );
}

function TierCard({ title, sub, price, bullets, best }: { title: string; sub: string; price: string; bullets: string[]; best?: boolean; }) {
  return (
    <div className="card cardHover" style={{ borderColor: best ? "var(--accentStroke)" : "var(--stroke)", boxShadow: best ? "0 0 0 1px var(--accentSoft)" : "" }}>
      <div className="cardInner">
        <div className="tierHead">
          <div><div className="tierName" style={{ color: "var(--fg)" }}>{title}</div><div className="tierSub">{sub}</div></div>
          <div style={{ textAlign: "right" }}><div className="tierPrice" style={{ color: "var(--fg)" }}>{price}</div></div>
        </div>
        <ul className="tierList" style={{ marginTop: 20 }}>{bullets.map((b) => (<li key={b}>{b}</li>))}</ul>
        {best && <div style={{ marginTop: 20, textAlign: "center", padding: "8px", background: "var(--accentSoft)", color: "var(--accent)", fontWeight: 700, borderRadius: 8 }}>Recommended Scope</div>}
      </div>
    </div>
  );
}
