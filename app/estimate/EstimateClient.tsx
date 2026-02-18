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

  // extra fields (from /build)
  hasLogo: YesNo;
  hasBrandGuide: YesNo;
  assetsSource: string;
  referenceWebsite: string;
  decisionMaker: YesNo;
  stakeholdersCount: string;
  design: string;

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
    if (freeChosen.length > 0 && paidAutoTypes.length === 0) {
      lines.push({ label: "Email confirmations (included)", amount: 0 });
    }
    if (paidAutoTypes.length > 0) {
      lines.push({ label: "Automations setup", amount: 200 });
      lines.push({
        label: `Automation types (${paidAutoTypes.length})`,
        amount: paidAutoTypes.length * 40,
      });
    }
  }

  // Integrations (Stripe/PayPal/Calendly can infer paid feature so estimate matches intent)
  const integrations = [...n.integrations];
  const hasStripe = integrations.includes("Stripe payments");
  const hasPayPal = integrations.includes("PayPal payments");
  const hasCalendly = integrations.includes("Calendly / scheduling");

  const inferredPayments = (hasStripe || hasPayPal) && !n.payments;
  const inferredBooking = hasCalendly && !n.booking;

  const filteredIntegrations = integrations.filter(
    (x) => x !== "Stripe payments" && x !== "PayPal payments" && x !== "Calendly / scheduling"
  );

  if (inferredPayments) lines.push({ label: "Payments (from selected integration)", amount: 250 });
  if (inferredBooking) lines.push({ label: "Booking (from selected integration)", amount: 120 });

  let paidIntegrationCount = 0;
  let integrationTotal = 0;

  for (const i of filteredIntegrations) {
    if (FREE_INTEGRATIONS.has(i)) continue;

    paidIntegrationCount += 1;
    const amt =
      i === "Mailchimp / email list" ? 60 :
      i === "Live chat" ? 40 :
      40;
    integrationTotal += amt;
  }

  if (paidIntegrationCount > 0) {
    lines.push({ label: `Integrations (${paidIntegrationCount})`, amount: integrationTotal });
  }

  // Readiness
  if (n.contentReady === "some") lines.push({ label: "Partial content readiness", amount: 60 });
  if (n.contentReady === "not_ready") lines.push({ label: "Content not ready (help needed)", amount: 160 });

  if (n.domainHosting === "no") lines.push({ label: "Domain/hosting guidance", amount: 60 });
  if (n.domainHosting === "yes") lines.push({ label: "Domain/hosting handled by client", amount: 0 });

  // Total + range
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
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

function recommendPlatform(n: Normalized) {
  // lightweight heuristic — final platform decided on call
  const advanced =
    n.payments ||
    n.membership ||
    (n.wantsAutomation === "yes" && n.automationTypes.some((t) => !FREE_AUTOMATIONS.has(t))) ||
    n.pages === "9+";

  if (advanced) return "Custom (Next.js) — recommended";
  if (n.websiteType === "ecommerce") return "Custom (Next.js) or Squarespace (depends on checkout)";
  return "Wix or Squarespace — recommended";
}

function revisionPolicyByTier(tier: "essential" | "growth" | "premium") {
  if (tier === "essential") return "1 structured revision round";
  if (tier === "growth") return "2 structured revision rounds";
  return "2–3 revision rounds (by scope)";
}

function listFeatures(n: Normalized) {
  const list: string[] = [];
  if (n.booking) list.push("Booking / appointments");
  if (n.payments) list.push("Payments / checkout");
  if (n.blog) list.push("Blog / articles");
  if (n.membership) list.push("Membership / gated content");

  const paidAutoTypes = n.automationTypes.filter((x) => !FREE_AUTOMATIONS.has(x));
  if (n.wantsAutomation === "yes") {
    if (paidAutoTypes.length) list.push(`Automations (${paidAutoTypes.length} paid types)`);
    else if (n.automationTypes.length) list.push("Email confirmations (included)");
  }

  if (n.integrations?.length) list.push(`Integrations (${n.integrations.length})`);
  if (n.integrationOther) list.push(`Other integration: ${n.integrationOther}`);

  return list.length ? list : ["None selected"];
}

function buildScopeSnapshotStructured(
  n: Normalized,
  estimate: { total: number; low: number; high: number; tier: "essential" | "growth" | "premium" }
) {
  return {
    project: {
      websiteType: n.websiteType,
      pages: n.pages,
      intent: n.intent,
      timeline: n.timeline,
      design: n.design || "(not specified)",
      platformRecommendation: recommendPlatform(n),
    },
    features: listFeatures(n),
    readiness: {
      contentReady: n.contentReady,
      domainHostingHandled: n.domainHosting,
      assetsSource: n.assetsSource || "(not specified)",
      hasLogo: n.hasLogo,
      hasBrandGuide: n.hasBrandGuide,
      referenceWebsite: n.referenceWebsite || "",
    },
    reviews: {
      decisionMaker: n.decisionMaker,
      stakeholdersCount: n.stakeholdersCount || "1",
      revisions: revisionPolicyByTier(estimate.tier),
    },
    estimate: {
      total: estimate.total,
      low: estimate.low,
      high: estimate.high,
      tierRecommended: estimate.tier,
      depositPolicy: "No payment before the video call. Deposit collected after scope is confirmed.",
    },
    notes: n.notes || "",
    exclusions: [
      "Copywriting beyond light edits",
      "Photography / video production",
      "Paid ads management",
      "Ongoing SEO retainers",
      "Third-party subscription fees (hosting, domains, apps)",
    ],
  };
}

function buildScopeSnapshotText(structured: any) {
  const p = structured?.project ?? {};
  const r = structured?.readiness ?? {};
  const rev = structured?.reviews ?? {};
  const est = structured?.estimate ?? {};
  const features: string[] = structured?.features ?? [];
  const exclusions: string[] = structured?.exclusions ?? [];

  const lines: string[] = [];

  lines.push("SCOPE SNAPSHOT (Draft)");
  lines.push("");
  lines.push(`Website type: ${p.websiteType ?? "-"}`);
  lines.push(`Pages: ${p.pages ?? "-"}`);
  lines.push(`Primary goal: ${p.intent ?? "-"}`);
  lines.push(`Timeline: ${p.timeline ?? "-"}`);
  lines.push(`Design direction: ${p.design ?? "-"}`);
  lines.push(`Recommended platform: ${p.platformRecommendation ?? "-"}`);
  lines.push("");

  lines.push("Features included:");
  for (const f of features.length ? features : ["None selected"]) lines.push(`- ${f}`);
  lines.push("");

  lines.push("Assets & readiness:");
  lines.push(`- Content readiness: ${r.contentReady ?? "-"}`);
  lines.push(`- Domain/hosting handled: ${r.domainHostingHandled ?? "-"}`);
  lines.push(`- Assets source: ${r.assetsSource ?? "-"}`);
  lines.push(`- Logo available: ${r.hasLogo ?? "-"}`);
  lines.push(`- Brand guide/colors: ${r.hasBrandGuide ?? "-"}`);
  if (r.referenceWebsite) lines.push(`- Reference: ${r.referenceWebsite}`);
  lines.push("");

  lines.push("Review & revisions:");
  lines.push(`- Decision maker: ${rev.decisionMaker ?? "-"}`);
  lines.push(`- Stakeholders: ${rev.stakeholdersCount ?? "-"}`);
  lines.push(`- Revisions: ${rev.revisions ?? "-"}`);
  lines.push("");

  lines.push("Estimate:");
  lines.push(`- Estimated range: $${est.low ?? "-"} – $${est.high ?? "-"}`);
  lines.push(`- Recommended tier: ${est.tierRecommended ?? "-"}`);
  lines.push(`- Deposit: ${est.depositPolicy ?? "-"}`);
  lines.push("");

  if (structured?.notes) {
    lines.push("Notes:");
    lines.push(structured.notes);
    lines.push("");
  }

  lines.push("Exclusions (not included unless added later):");
  for (const e of exclusions) lines.push(`- ${e}`);

  return lines.join("\n");
}

export default function EstimateClient() {
  const sp = useSearchParams();

  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState<any>(null);

  // submit state
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");

  const [submitState, setSubmitState] = useState<{
    status: "idle" | "submitting" | "ok" | "error";
    quoteId?: string;
    leadId?: string;
    error?: string;
  }>({ status: "idle" });

  const [snapshotText, setSnapshotText] = useState("");
  const [copied, setCopied] = useState(false);

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

    // extra fields from /build
    if (has("hasLogo")) q.hasLogo = get("hasLogo");
    if (has("hasBrandGuide")) q.hasBrandGuide = get("hasBrandGuide");
    if (has("assetsSource")) q.assetsSource = get("assetsSource");
    if (has("referenceWebsite")) q.referenceWebsite = get("referenceWebsite");
    if (has("decisionMaker")) q.decisionMaker = get("decisionMaker");
    if (has("stakeholdersCount")) q.stakeholdersCount = get("stakeholdersCount");
    if (has("design")) q.design = get("design");

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

      hasLogo: normYesNo(merged.hasLogo, "no"),
      hasBrandGuide: normYesNo(merged.hasBrandGuide, "no"),
      assetsSource: String(merged.assetsSource ?? "").trim(),
      referenceWebsite: String(merged.referenceWebsite ?? "").trim(),
      decisionMaker: normYesNo(merged.decisionMaker, "yes"),
      stakeholdersCount: String(merged.stakeholdersCount ?? "").trim() || "1",
      design: String(merged.design ?? "").trim(),

      timeline: String(merged.timeline ?? "").trim() || "2-3w",
      intent: String(merged.intent ?? "").trim() || "business",

      leadEmail: String(merged.leadEmail ?? "").trim(),
      leadPhone: String(merged.leadPhone ?? "").trim(),
      notes: String(merged.notes ?? "").trim(),
    };
  }, [merged]);

  // initialize editable contact fields ONCE when present
  useEffect(() => {
    setLeadEmail((prev) => prev || normalized.leadEmail || "");
    setLeadPhone((prev) => prev || normalized.leadPhone || "");
  }, [normalized.leadEmail, normalized.leadPhone]);

  const estimate = useMemo(() => computeEstimate(normalized), [normalized]);

  // Scope snapshot (structured + text)
  const snapshotStructured = useMemo(() => {
    return buildScopeSnapshotStructured(normalized, {
      total: estimate.total,
      low: estimate.low,
      high: estimate.high,
      tier: estimate.tier,
    });
  }, [normalized, estimate.total, estimate.low, estimate.high, estimate.tier]);

  // set default snapshot text once / whenever it is empty
  useEffect(() => {
    setSnapshotText((prev) => prev || buildScopeSnapshotText(snapshotStructured));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotStructured]);

  const headerMessage =
    "One-page starter from $225 (no paid add-ons). 1–3 pages from $400 (no paid add-ons). 4–6 pages start at $550 + add-ons. We’ll confirm final scope together before you pay a deposit.";

  async function copySnapshot() {
    try {
      await navigator.clipboard.writeText(snapshotText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  async function submitEstimate() {
    const email = String(leadEmail || "").trim().toLowerCase();
    const phone = String(leadPhone || "").trim();

    if (!email || !email.includes("@")) {
      setSubmitState({ status: "error", error: "Please enter a valid email." });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const intakeNormalized: Normalized = {
        ...normalized,
        leadEmail: email,
        leadPhone: phone,
      };

      const payload = {
        source: "estimate",
        lead: {
          email,
          phone: phone || undefined,
        },
        intakeRaw: {
          loadedFromLocalStorage: loadedFromLocalStorage ?? null,
          parsedQuery,
          merged,
        },
        intakeNormalized,
        scopeSnapshot: {
          structured: snapshotStructured,
          text: snapshotText,
        },
        estimate: {
          total: Number(estimate.total ?? 0),
          low: Number(estimate.low ?? 0),
          high: Number(estimate.high ?? 0),
          tierRecommended: estimate.tier,
        },
        debug: {
          mergeOrder: "localStorage → URL query (query wins)",
          queryString: sp.toString(),
          normalized: intakeNormalized,
          tier: estimate.tier,
          total: estimate.total,
          low: estimate.low,
          high: estimate.high,
          hasPaidAddons: estimate.hasPaidAddons,
          lines: estimate.lines,
          freeAutomations: Array.from(FREE_AUTOMATIONS),
          freeIntegrations: Array.from(FREE_INTEGRATIONS),
        },
      };

      const res = await fetch("/api/submit-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save estimate.");

      setSubmitState({
        status: "ok",
        quoteId: json?.quoteId,
        leadId: json?.leadId,
      });

      try {
        if (json?.quoteId) localStorage.setItem("crecystudio:lastQuoteId", String(json.quoteId));
      } catch {}
    } catch (e: any) {
      setSubmitState({ status: "error", error: e?.message || "Something went wrong." });
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
        </div>
      </section>

      <div style={{ height: 18 }} />

      {/* ✅ Scope Snapshot Preview */}
      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Scope Snapshot preview</div>
          <div className="smallNote">
            This is the draft scope we’ll review together on the video call (you can edit it).
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <textarea
            className="textarea"
            rows={16}
            value={snapshotText}
            onChange={(e) => setSnapshotText(e.target.value)}
            placeholder="Scope Snapshot will appear here…"
          />

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn btnGhost" onClick={copySnapshot}>
              {copied ? "Copied ✅" : "Copy snapshot"}
            </button>

            <button
              type="button"
              className="btn btnGhost"
              onClick={() => setSnapshotText(buildScopeSnapshotText(snapshotStructured))}
            >
              Reset to auto-draft
            </button>
          </div>

          <div className="smallNote">
            Next: click <strong>Send estimate</strong> — we’ll save this scope snapshot + estimate to your quote record.
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

      {/* Next step (saves + shows quoteId) */}
      <section className="panel">
        <div className="panelHeader">
          <div style={{ fontWeight: 950 }}>Next step</div>
          <div className="smallNote">
            Send this estimate so we can follow up and lock scope on a quick video call. No payment yet.
          </div>
        </div>

        <div className="panelBody" style={{ display: "grid", gap: 12 }}>
          <div className="grid2">
            <div>
              <div className="fieldLabel">Email (required)</div>
              <input
                className="input"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="fieldLabel">Phone (optional)</div>
              <input
                className="input"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link className="btn btnGhost" href="/">
              Back home
            </Link>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Link className="btn btnGhost" href="/build">
                Adjust answers
              </Link>

              <button
                type="button"
                className="btn btnPrimary"
                onClick={submitEstimate}
                disabled={submitState.status === "submitting"}
              >
                {submitState.status === "submitting" ? "Sending..." : "Send estimate"}{" "}
                <span className="btnArrow">→</span>
              </button>
            </div>
          </div>

          {submitState.status === "error" && (
            <p className="pDark" style={{ margin: 0, color: "rgba(255,120,120,0.95)" }}>
              {submitState.error}
            </p>
          )}

          {submitState.status === "ok" && (
            <div style={{ marginTop: 4 }}>
              <div className="badge badgeHot">Saved ✅</div>

              <div className="smallNote" style={{ marginTop: 10 }}>
                <strong>Quote ID:</strong>{" "}
                <code>{submitState.quoteId ?? "(missing)"}</code>
                {submitState.leadId ? (
                  <>
                    {" "}
                    • <strong>Lead ID:</strong> <code>{submitState.leadId}</code>
                  </>
                ) : null}
              </div>

              {submitState.quoteId && (
                <div className="smallNote" style={{ marginTop: 8 }}>
                  Internal preview:{" "}
                  <a
                    style={{ textDecoration: "underline" }}
                    href={`/internal/preview?quoteId=${encodeURIComponent(submitState.quoteId)}`}
                  >
                    open quote
                  </a>
                </div>
              )}

              <div className="smallNote" style={{ marginTop: 10 }}>
                Next: we schedule a video call, confirm scope, then send payment/deposit after the call.
              </div>
            </div>
          )}
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
    low: estimate.low,
    high: estimate.high,
    submitState,
    scopeSnapshotPreview: {
      structured: snapshotStructured,
      text: snapshotText,
    },
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