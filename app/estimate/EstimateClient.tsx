// app/estimate/EstimateClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWebsitePricing, money, PRICING_MESSAGES } from "@/lib/pricing";

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
  budget: string;
  hasLogo: YesNo;
  hasBrandGuide: YesNo;
};

const LS_KEY = "crecystudio:intake";
const LAST_QUOTE_KEY = "crecystudio:lastQuoteId";
const LAST_QUOTE_TOKEN_KEY = "crecystudio:lastQuoteToken";

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
  "budget",
  "hasLogo",
  "hasBrandGuide",
  "quoteId",
  "quoteToken",
]);

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function normYesNo(v: unknown, fallback: YesNo = "no"): YesNo {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "yes" || s === "true" || s === "1" || s === "on") return "yes";
  if (s === "no" || s === "false" || s === "0" || s === "off") return "no";
  return fallback;
}

function normWebsiteType(v: unknown): Normalized["websiteType"] {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.includes("ecom")) return "ecommerce";
  if (s.includes("port")) return "portfolio";
  if (s.includes("land")) return "landing";
  return "business";
}

function normContentReady(v: unknown): Normalized["contentReady"] {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.includes("not")) return "not_ready";
  if (s.includes("ready")) return "ready";
  return "some";
}

function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  const s = String(v ?? "").trim();
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function parsePagesMax(raw: unknown): { max: number } {
  const s = String(raw ?? "").trim();
  if (!s) return { max: 3 };
  if (s.includes("+")) {
    const n = parseInt(s.replace("+", ""), 10);
    return { max: Number.isFinite(n) ? n : 9 };
  }
  if (s.includes("-")) {
    const nums = s.split("-").map((x) => parseInt(x.trim(), 10)).filter(Number.isFinite);
    const max = nums.length ? nums[nums.length - 1] : 3;
    return { max };
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

export default function EstimateClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState<Record<string, unknown> | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setLoadedFromLocalStorage(JSON.parse(raw));
    } catch {
      setLoadedFromLocalStorage(null);
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

  const merged = useMemo(
    () => ({ ...(loadedFromLocalStorage || {}), ...parsedQuery }),
    [loadedFromLocalStorage, parsedQuery]
  );

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
      timeline: String(merged.timeline ?? "").trim() || "2-3 weeks",
      intent: String(merged.intent ?? "").trim() || "business",
      leadEmail: String(merged.leadEmail ?? "").trim(),
      leadPhone: String(merged.leadPhone ?? "").trim(),
      notes: String(merged.notes ?? "").trim(),
      budget: String(merged.budget ?? "").trim(),
      hasLogo: normYesNo(merged.hasLogo, "yes"),
      hasBrandGuide: normYesNo(merged.hasBrandGuide, "no"),
    };
  }, [merged]);

  const existingQuoteId = useMemo(() => String(merged.quoteId ?? "").trim(), [merged]);
  const existingQuoteToken = useMemo(() => String(merged.quoteToken ?? merged.token ?? "").trim(), [merged]);

  const pricing = useMemo(() => getWebsitePricing(normalized), [normalized]);
  const hasIntake = !!loadedFromLocalStorage || hasMeaningfulQuery;

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
        quoteId: existingQuoteId || undefined,
        quoteToken: existingQuoteToken || undefined,
        lead: {
          email,
          phone: normalized.leadPhone || undefined,
        },
        intakeRaw: merged,
        intakeNormalized: normalized,
        pricing,
        estimate: {
          total: pricing.band.target,
          low: pricing.band.min,
          high: pricing.band.max,
          tierRecommended: pricing.tierLabel,
          tierKey: pricing.tierKey,
          isCustomScope: pricing.isCustomScope,
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
        if (json?.quoteToken) {
          window.localStorage.setItem(LAST_QUOTE_TOKEN_KEY, String(json.quoteToken));
        }
      } catch {}

      if (json?.nextUrl) {
        router.push(String(json.nextUrl));
        return;
      }

      const nextUrl = json?.quoteToken
        ? `/book?quoteId=${encodeURIComponent(String(json.quoteId))}&token=${encodeURIComponent(String(json.quoteToken))}`
        : `/book?quoteId=${encodeURIComponent(String(json.quoteId))}`;

      router.push(nextUrl);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to save estimate.");
    } finally {
      setSending(false);
    }
  }

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
          To generate an accurate estimate, we need a few details about your pages, features,
          timeline, and goals.
        </p>
        <div style={{ height: 18 }} />
        <section className="panel" style={{ maxWidth: 760 }}>
          <div className="panelHeader">
            <div style={{ fontWeight: 800 }}>No intake found</div>
            <div className="smallNote">This page only works after the Build questionnaire.</div>
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

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        CrecyStudio • Instant Estimate
      </div>

      <div style={{ height: 12 }} />
      <h1 className="h1">Your estimate</h1>
      <p className="p" style={{ maxWidth: 900, marginTop: 10 }}>
        We now classify your project into a clean pricing tier first, then place it inside a fair
        startup range based on scope, features, readiness, and launch pressure.
      </p>
      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div className="pDark">
            Type: <strong>{normalized.websiteType}</strong> • Pages:{" "}
            <strong>{normalized.pages}</strong> • Recommended package:{" "}
            <strong>{pricing.tierLabel}</strong>
          </div>

          <div style={{ height: 10 }} />

          {pricing.isCustomScope ? (
            <div
              style={{
                border: "1px solid var(--accentStroke)",
                background: "var(--accentSoft)",
                borderRadius: 12,
                padding: "14px 16px",
                fontWeight: 800,
                color: "var(--fg)",
              }}
            >
              {pricing.publicMessage}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, fontSize: 34, letterSpacing: "-0.8px" }}>
                {money(pricing.band.target)}
              </div>
              <div className="pDark">Typical range: {pricing.displayRange}</div>
            </div>
          )}
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              border: "1px solid var(--stroke)",
              background: "var(--panel2)",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>What this means</div>
            <div className="pDark">{pricing.summary}</div>
          </div>

          {pricing.complexityFlags.length > 0 ? (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Complexity flags</div>
              <div className="pills">
                {pricing.complexityFlags.map((flag) => (
                  <span key={flag} className="pill">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Why it landed here</div>
            <div style={{ display: "grid", gap: 10 }}>
              {pricing.reasons.map((reason, idx) => (
                <div
                  key={`${reason.label}-${idx}`}
                  style={{
                    border: "1px solid var(--stroke)",
                    background: "var(--panel2)",
                    borderRadius: 10,
                    padding: "12px 12px",
                  }}
                >
                  <div style={{ color: "var(--fg)", fontWeight: 800 }}>{reason.label}</div>
                  <div className="pDark" style={{ marginTop: 4 }}>
                    {reason.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="smallNote">
            Final scope and price are confirmed on a discovery call before any work begins.{" "}
            {PRICING_MESSAGES.depositPolicy}
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 800 }}>Next step</div>
          <div className="smallNote">
            Save your quote and book a quick call. Payment happens after the call if you proceed.
          </div>
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